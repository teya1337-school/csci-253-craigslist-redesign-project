import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthenticatedUser } from './models/authenticated-user';
import { CsrfTokenResponse } from './models/csrf-token-response';
import { LoginRequest } from './models/login-request';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUserState = signal<AuthenticatedUser | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  loadCurrentUser(): Observable<AuthenticatedUser | null> {
    return this.http.get<AuthenticatedUser>('/api/auth/me').pipe(
      tap((user) => this.currentUserState.set(user)),
      catchError(() => {
        this.currentUserState.set(null);
        return of(null);
      }),
    );
  }

  login(credentials: LoginRequest): Observable<AuthenticatedUser> {
    return this.getCsrfToken().pipe(
      switchMap(() => this.http.post<AuthenticatedUser>('/api/auth/login', credentials)),
      switchMap((user) => this.getCsrfToken().pipe(map(() => user))),
      tap((user) => this.currentUserState.set(user)),
    );
  }

  updateAccount(account: {
    username: string;
    email: string;
  }): Observable<AuthenticatedUser | null> {
    return this.http
      .put<void>('/api/account', account)
      .pipe(switchMap(() => this.loadCurrentUser()));
  }

  changePassword(password: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<void> {
    return this.http.put<void>('/api/account/password', password);
  }

  deleteAccount(account: { currentPassword: string; confirmed: boolean }): Observable<void> {
    return this.http
      .delete<void>('/api/account', { body: account })
      .pipe(tap(() => this.currentUserState.set(null)));
  }

  logout(): Observable<void> {
    return this.getCsrfToken().pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', null)),
      tap(() => this.currentUserState.set(null)),
      switchMap(() => this.getCsrfToken()),
      map(() => undefined),
    );
  }

  private getCsrfToken(): Observable<CsrfTokenResponse> {
    return this.http.get<CsrfTokenResponse>('/api/auth/csrf');
  }
}
