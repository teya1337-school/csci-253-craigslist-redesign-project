import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthenticatedUser } from './models/authenticated-user';
import { CsrfTokenResponse } from './models/csrf-token-response';
import { LoginRequest } from './models/login-request';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly currentUserState = signal<AuthenticatedUser | null>(null);
  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserState() !== null);

  // Update the picture version of the current user.
  updatePictureVersion(pictureVersion: string | null): void {
    this.currentUserState.update((user) => (user ? { ...user, pictureVersion } : null));
  }

  // Load the current user from the server and update the state.
  loadCurrentUser(): Observable<AuthenticatedUser | null> {
    return this.http.get<AuthenticatedUser>('/api/auth/me').pipe(
      tap((user) => this.currentUserState.set(user)),
      catchError(() => {
        this.currentUserState.set(null);
        return of(null);
      }),
    );
  }

  // Sign up a new user account.
  signup(account: {
    username: string;
    privateEmail: string;
    password: string;
    confirmPassword: string;
  }): Observable<void> {
    return this.getCsrfToken().pipe(
      switchMap(() => this.http.post<void>('/api/auth/signup', account)),
    );
  }

  // Log in a user with the provided credentials.
  login(credentials: LoginRequest): Observable<AuthenticatedUser> {
    return this.getCsrfToken().pipe(
      switchMap(() => this.http.post<AuthenticatedUser>('/api/auth/login', credentials)),
      switchMap((user) => this.getCsrfToken().pipe(
        map(() => user))),
      tap((user) => this.currentUserState.set(user)),
      );
  }

  // Update the account information of the current user.
  updateAccount(account: {
    username: string;
    privateEmail: string;
  }): Observable<AuthenticatedUser | null> {
    return this.http.put<void>('/api/account', account).pipe(
      switchMap(() => this.loadCurrentUser())
    );
  }

  // Change the password of the current user.
  changePassword(password: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<void> {
    return this.http.put<void>('/api/account/password', password);
  }

  // Delete the account of the current user.
  deleteAccount(account: { currentPassword: string; confirmed: boolean }): Observable<void> {
    return this.http
      .delete<void>('/api/account', { body: account })
      .pipe(tap(() => this.currentUserState.set(null)));
  }

  // Log out the current user and clear the state.
  logout(): Observable<void> {
    return this.getCsrfToken().pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', null)),
      tap(() => this.currentUserState.set(null)),
      switchMap(() => this.getCsrfToken()),
      map(() => undefined),
    );
  }

  // Get the CSRF token from the server.
  private getCsrfToken(): Observable<CsrfTokenResponse> {
    return this.http.get<CsrfTokenResponse>('/api/auth/csrf');
  }
}
