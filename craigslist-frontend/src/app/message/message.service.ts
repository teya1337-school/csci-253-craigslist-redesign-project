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
  private readonly unreadCountState = signal(0);
  private readonly refreshUnread = new Subject<void>();
  readonly unreadCount = this.unreadCountState.asReadonly();

  constructor() {
    effect((onCleanup) => {
      const userId = this.auth.currentUser()?.id;
      this.unreadCountState.set(0);
      if (!userId) return;

      // Cancel requests and clear the previous count whenever the signed-in user changes.
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

  list(mailbox: Mailbox): Observable<DirectMessage[]> {
    return this.http.get<DirectMessage[]>('/api/messages', { params: { mailbox } }).pipe(
      tap(() => {
        if (mailbox === 'INBOX') this.refreshUnread.next();
      }),
    );
  }
  get(id: string, mailbox: Mailbox): Observable<DirectMessage> {
    return this.http.get<DirectMessage>(`/api/messages/${encodeURIComponent(id)}`, {
      params: { mailbox },
    });
  }
  markRead(id: string): Observable<DirectMessage> {
    return this.http
      .post<DirectMessage>(`/api/messages/${encodeURIComponent(id)}/read`, null)
      .pipe(tap(() => this.refreshUnread.next()));
  }
  send(message: { recipientId: string; subject: string; body: string }): Observable<DirectMessage> {
    return this.http.post<DirectMessage>('/api/messages', message);
  }
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
