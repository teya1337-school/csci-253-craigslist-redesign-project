import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  finalize,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  throwError,
} from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserLink } from '../../shared/user-link/user-link';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-compose-message',
  imports: [ReactiveFormsModule, RouterLink, UserLink],
  templateUrl: './compose-message.html',
  styleUrls: ['../../post/create-post/create-post.scss', './compose-message.scss'],
})
export class ComposeMessage implements OnInit {
  private readonly service = inject(MessageService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();
  protected readonly recipient = signal<{ id: string; username: string } | null>(null);
  protected readonly replyTo = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly isSending = signal(false);
  protected readonly sendError = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    subject: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(5000)]],
  });

  ngOnInit(): void {
    combineLatest([this.route.queryParamMap, this.reload.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          this.isLoading.set(true);
          this.loadError.set(null);
          this.recipient.set(null);
          this.replyTo.set(params.get('replyTo'));
          const context = this.replyTo()
            ? this.service
                .get(this.replyTo()!, 'INBOX')
                .pipe(
                  map((message) => ({
                    id: message.senderId,
                    username: message.senderUsername,
                    subject: /^re:/i.test(message.subject)
                      ? message.subject
                      : ('Re: ' + message.subject).slice(0, 200),
                  })),
                )
            : params.get('to')
              ? this.http
                  .get<{ id: string; username: string }>(
                    `/api/users/${encodeURIComponent(params.get('to')!)}/profile`,
                  )
                  .pipe(map((user) => ({ ...user, subject: '' })))
              : throwError(() => new Error('No recipient'));
          return context.pipe(
            catchError(() => {
              this.loadError.set(
                'This recipient or original message is unavailable. Return to a user profile or your inbox.',
              );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((context) => {
        this.isLoading.set(false);
        if (!context) return;
        if (context.id === this.auth.currentUser()?.id) {
          this.loadError.set('You cannot send a message to yourself.');
          return;
        }
        this.recipient.set({ id: context.id, username: context.username });
        this.form.controls.subject.setValue(context.subject);
      });
  }

  protected retry(): void {
    this.reload.next();
  }
  protected cancel(): void {
    if (this.isSending()) return;
    if (this.replyTo()) void this.router.navigate(['/inbox/received', this.replyTo()]);
    else if (this.recipient()) void this.router.navigate(['/users', this.recipient()!.id]);
    else void this.router.navigate(['/inbox']);
  }
  protected send(): void {
    const recipient = this.recipient();
    if (!recipient || this.isSending()) return;
    this.sendError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    this.isSending.set(true);
    this.form.disable();
    this.service
      .send({ recipientId: recipient.id, subject: values.subject.trim(), body: values.body.trim() })
      .pipe(
        finalize(() => {
          this.isSending.set(false);
          this.form.enable();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () =>
          void this.router.navigate(['/inbox'], { queryParams: { folder: 'sent', sent: true } }),
        error: (error: HttpErrorResponse) =>
          this.sendError.set(
            error.status === 401 || error.status === 403
              ? 'Your session has expired. Sign in again before sending.'
              : error.status === 404
                ? 'This recipient is no longer available.'
                : 'We could not send your message. Please try again.',
          ),
      });
  }
}
