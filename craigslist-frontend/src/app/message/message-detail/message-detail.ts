import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, finalize, of, startWith, Subject, switchMap } from 'rxjs';
import { UserLink } from '../../shared/user-link/user-link';
import { DirectMessage, Mailbox, MessageService } from '../message.service';

@Component({
  selector: 'app-message-detail',
  imports: [DatePipe, RouterLink, UserLink],
  templateUrl: './message-detail.html',
  styleUrl: '../mailbox.scss',
})
export class MessageDetail implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly reload = new Subject<void>();

  // The mailbox is passed as route data, so we can read it from the ActivatedRoute snapshot.
  protected readonly mailbox: Mailbox = this.route.snapshot.data['mailbox'];

  protected readonly message = signal<DirectMessage | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  ngOnInit(): void {
    // We use combineLatest here to listen to both route parameter changes and manual reloads.
    // Whenever either of these emits, we fetch the message for the current messageId.
    combineLatest([this.route.paramMap, this.reload.pipe(startWith(undefined))]).pipe(
        switchMap(([params]) => {
          this.message.set(null);
          this.error.set(null);
          this.isLoading.set(true);
          this.confirmingDelete.set(false);
          // Get the messageId from the route parameters and fetch the message from the service.
          return this.messageService.get(params.get('messageId') ?? '', this.mailbox).pipe(
            switchMap((message) =>
              this.mailbox === 'INBOX' && !message.readAt
                ? this.messageService.markRead(message.id)
                : of(message),
            ),
            catchError((error: HttpErrorResponse) => {
              this.error.set(
                error.status === 404
                  ? 'This message is unavailable or has been deleted from your mailbox.'
                  : error.status === 401
                    ? 'Your session has expired. Please sign in again.'
                    : 'We could not load this message. Please try again.',
              );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((message) => {
        this.message.set(message);
        this.isLoading.set(false);
      });
  }

  // Retry loading the message.
  protected retry(): void {
    this.reload.next();
  }

  // Show the delete confirmation and move focus to the cancel button.
  protected confirmDelete(): void {
    this.confirmingDelete.set(true);
    this.deleteError.set(null);
    setTimeout(() =>
      this.element.nativeElement.querySelector<HTMLButtonElement>('.cancel-delete')?.focus(),
    );
  }

  // Cancel the delete confirmation and return focus to the delete button.
  protected cancelDelete(): void {
    this.confirmingDelete.set(false);
    this.element.nativeElement.querySelector<HTMLButtonElement>('.delete-trigger')?.focus();
  }

  // Delete the message and return to the current mailbox.
  protected deleteMessage(): void {
    const message = this.message();

    if (!message || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.messageService.delete(message.id, this.mailbox).pipe(
        finalize(() => this.isDeleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () =>
          void this.router.navigate(['/inbox'], {
            queryParams: { folder: this.mailbox === 'SENT' ? 'sent' : null, deleted: true },
          }),
        error: () => this.deleteError.set('We could not delete this message. Please try again.'),
      });
  }
}
