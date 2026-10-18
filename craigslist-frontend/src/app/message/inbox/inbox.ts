import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, of, startWith, Subject, switchMap } from 'rxjs';
import { DirectMessage, Mailbox, MessageService } from '../message.service';

@Component({
  selector: 'app-inbox',
  imports: [DatePipe, RouterLink],
  templateUrl: './inbox.html',
  styleUrl: '../mailbox.scss',
})
export class Inbox implements OnInit {
  private readonly service = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly reload = new Subject<void>();

  protected readonly mailbox = signal<Mailbox>('INBOX');
  protected readonly messages = signal<DirectMessage[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal('');

  ngOnInit(): void {
    // We use combineLatest here to listen to both query parameter changes and manual reloads.
    // Whenever either of these emits, we fetch the messages for the current mailbox.
    combineLatest([this.route.queryParamMap, this.reload.pipe(startWith(undefined))]).pipe(
        switchMap(([params]) => {
          this.mailbox.set(params.get('folder') === 'sent' ? 'SENT' : 'INBOX');

          // Set the notice message based on query parameters.
          this.notice.set(
            params.get('sent') === 'true'
              ? 'Your message was sent.'
              : params.get('deleted') === 'true'
                ? 'Message deleted from your ' +
                  (this.mailbox() === 'INBOX' ? 'inbox.' : 'sent messages.')
                : '',
          );

          this.isLoading.set(true);
          this.messages.set([]);
          this.error.set(null);

          return this.service.list(this.mailbox()).pipe(
            catchError((error: HttpErrorResponse) => {
              this.error.set(
                error.status === 401
                  ? 'Your session has expired. Sign in again to view your messages.'
                  : 'We could not load your messages. Please try again.',
              );
              return of([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((messages) => {
        this.messages.set(messages);
        this.isLoading.set(false);
      });
  }

  // Refresh the message list.
  protected refresh(): void {
    this.reload.next();
  }
}
