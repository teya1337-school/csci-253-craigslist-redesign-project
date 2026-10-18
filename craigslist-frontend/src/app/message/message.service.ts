import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  EMPTY,
  filter,
  fromEvent,
  merge,
  Observable,
  Subject,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { AuthService } from '../auth/auth.service';

export type Mailbox = 'INBOX' | 'SENT';
export interface DirectMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
  subject: string;
  body: string;
  sentAt: string;
  readAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly refreshUnread = new Subject<void>();

  private readonly unreadCountState = signal(0);
  readonly unreadCount = this.unreadCountState.asReadonly();

  constructor() {
    // Set up an effect to refresh the unread count every 30 seconds, when the window gains focus, or when the user changes.
    effect((onCleanup) => {
      const userId = this.auth.currentUser()?.id;

      this.unreadCountState.set(0);

      // If the user is not signed in, do not set up the effect.
      if (!userId) {
        return;
      }

      // Set up a polling mechanism to refresh the unread count every 30 seconds, when the window gains focus, or when the document visibility changes.
      // Cancel requests and clear the previous count whenever the signed-in user changes.
      // This is important because the unread count is user-specific.
      // If the user signs out, we want to stop polling for unread messages and clear the count.
      // If the user signs in, we want to start polling for unread messages and set the count.
      const subscription = merge(
        timer(0, 30_000),
        this.refreshUnread,
        fromEvent(window, 'focus'),
        fromEvent(document, 'visibilitychange'),
      )
        .pipe(
          filter(() => document.visibilityState === 'visible'),
          switchMap(() =>
            this.http.get<{ count: number }>('/api/messages/unread-count').pipe(
              catchError((error) => {
                if (error.status === 401) this.unreadCountState.set(0);
                return EMPTY;
              }),
            ),
          ),
        )
        .subscribe((result) => this.unreadCountState.set(result.count));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  // List messages in a mailbox. If the mailbox is INBOX, refresh the unread count after listing.
  list(mailbox: Mailbox): Observable<DirectMessage[]> {
    return this.http.get<DirectMessage[]>('/api/messages', { params: { mailbox } }).pipe(
      tap(() => {
        if (mailbox === 'INBOX') this.refreshUnread.next();
      }),
    );
  }

  // Get a specific message by ID.
  get(id: string, mailbox: Mailbox): Observable<DirectMessage> {
    return this.http.get<DirectMessage>(`/api/messages/${encodeURIComponent(id)}`, {
      params: { mailbox },
    });
  }

  // Mark a message as read. This will also refresh the unread count.
  markRead(id: string): Observable<DirectMessage> {
    return this.http
      .post<DirectMessage>(`/api/messages/${encodeURIComponent(id)}/read`, null)
      .pipe(tap(() => this.refreshUnread.next()));
  }

  // Send a new message.
  send(message: { recipientId: string; subject: string; body: string }): Observable<DirectMessage> {
    return this.http.post<DirectMessage>('/api/messages', message);
  }

  // Delete a message.
  // If the message is in the INBOX, refresh the unread count after deletion.
  delete(id: string, mailbox: Mailbox): Observable<void> {
    return this.http
      .delete<void>(`/api/messages/${encodeURIComponent(id)}`, {
        params: { mailbox },
      })
      .pipe(
        tap(() => {
          if (mailbox === 'INBOX') this.refreshUnread.next();
        }),
      );
  }
}
