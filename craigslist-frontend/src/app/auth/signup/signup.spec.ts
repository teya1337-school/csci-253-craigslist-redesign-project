import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Signup } from './signup';
import { AuthService } from '../auth.service';

describe('Signup', () => {
  afterEach(() => TestBed.resetTestingModule());
  function setup(returnUrl: string | null = null) {
    const auth = { currentUser: signal(null), signup: vi.fn().mockReturnValue(of(undefined)) };
    TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(Signup);
    return { component: fixture.componentInstance, auth, router: TestBed.inject(Router) };
  }
  const account = {
    username: 'new_user',
    privateEmail: 'private@example.test',
    password: 'bob',
    confirmPassword: 'bob',
  };
  it('does not submit an incomplete form', () => {
    const { component, auth } = setup();
    component['submit']();
    expect(auth.signup).not.toHaveBeenCalled();
    expect(component['signupForm'].controls.username.touched).toBe(true);
  });
  it('rejects mismatched passwords before making a request', () => {
    const { component, auth } = setup();
    component['signupForm'].setValue({ ...account, confirmPassword: 'different-password' });
    component['submit']();
    expect(auth.signup).not.toHaveBeenCalled();
    expect(component['errorMessage']()).toContain('do not match');
  });
  it('trims account fields and redirects to sign in with success feedback after creation', () => {
    const { component, auth, router } = setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['signupForm'].setValue({
      ...account,
      username: ' new_user ',
      privateEmail: ' private@example.test ',
    });
    component['submit']();
    expect(auth.signup).toHaveBeenCalledWith(account);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { registered: 'true', returnUrl: '/' },
      replaceUrl: true,
    });
    expect(component['signupForm'].controls.password.value).toBe('');
  });
  it('preserves the starting page through signup and sign in', () => {
    const { component, router } = setup('/community/general');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    expect(component['returnUrl']).toBe('/community/general');
    component['signupForm'].setValue(account);
    component['submit']();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { registered: 'true', returnUrl: '/community/general' },
      replaceUrl: true,
    });
  });
  it('shows duplicate-account feedback and preserves input for correction', () => {
    const { component, auth } = setup();
    auth.signup.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'That username is already in use.' },
          }),
      ),
    );
    component['signupForm'].setValue(account);
    component['submit']();
    expect(component['errorMessage']()).toContain('already in use');
    expect(component['signupForm'].controls.username.value).toBe('new_user');
    expect(component['signupForm'].enabled).toBe(true);
    expect(component['submitting']()).toBe(false);
  });
});
