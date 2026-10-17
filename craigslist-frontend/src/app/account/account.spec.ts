import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { Account } from './account';

describe('Account', () => {
  afterEach(() => TestBed.resetTestingModule());
  function setup() {
    const user = { id: 'alice-id', username: 'alice', email: 'alice@example.com' };
    const authService = {
      currentUser: signal(user),
      updateAccount: vi.fn().mockReturnValue(of({ ...user, username: 'new_alice' })),
      changePassword: vi.fn().mockReturnValue(of(undefined)),
      deleteAccount: vi.fn().mockReturnValue(of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [Account],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });
    const fixture = TestBed.createComponent(Account);
    return { component: fixture.componentInstance, authService };
  }
  it('prefills account information and requires the current password and closes editing after saving', () => {
    const { component, authService } = setup();
    expect(component['accountForm'].getRawValue()).toEqual({
      username: 'alice',
      email: 'alice@example.com',
      currentPassword: '',
    });
    component['editAccount']();
    component['accountForm'].patchValue({ username: 'new_alice', currentPassword: 'old-password' });
    component['saveAccount']();
    expect(authService.updateAccount).toHaveBeenCalledWith({
      username: 'new_alice',
      email: 'alice@example.com',
      currentPassword: 'old-password',
    });
    expect(component['accountSuccess']()).toContain('saved');
    expect(component['accountForm'].pristine).toBe(true);
  });
  it('rejects mismatched new passwords and clears password fields after success', () => {
    const { component, authService } = setup();
    component['editPassword']();
    component['passwordForm'].setValue({
      currentPassword: 'old-password',
      newPassword: 'new-password',
      confirmPassword: 'different',
    });
    component['changePassword']();
    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(component['passwordError']()).toContain('do not match');
    component['passwordForm'].patchValue({ confirmPassword: 'new-password' });
    component['changePassword']();
    expect(component['passwordSuccess']()).toContain('changed');
    expect(component['passwordForm'].getRawValue()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });
  it('preserves entered account details when a duplicate is rejected', () => {
    const { component, authService } = setup();
    authService.updateAccount.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'That username is already in use.' },
          }),
      ),
    );
    component['editAccount']();
    component['accountForm'].patchValue({ username: 'bob', currentPassword: 'old-password' });
    component['saveAccount']();
    expect(component['accountError']()).toBe('That username is already in use.');
    expect(component['accountForm'].controls.username.value).toBe('bob');
    expect(component['accountForm'].enabled).toBe(true);
  });
  it('keeps forms closed initially and Cancel restores saved values and clears credentials', () => {
    const { component, authService } = setup();
    expect(component['editingAccount']()).toBe(false);
    expect(component['editingPassword']()).toBe(false);
    component['editAccount']();
    component['accountForm'].patchValue({ username: 'accidental', currentPassword: 'secret' });
    component['cancelAccount']();
    expect(component['accountForm'].controls.username.value).toBe('alice');
    expect(component['accountForm'].controls.currentPassword.value).toBe('');
    expect(component['editingAccount']()).toBe(false);
    component['editPassword']();
    component['passwordForm'].patchValue({
      currentPassword: 'secret',
      newPassword: 'new-password',
    });
    component['cancelPassword']();
    expect(component['editingPassword']()).toBe(false);
    expect(component['passwordForm'].controls.newPassword.value).toBe('');
    expect(authService.updateAccount).not.toHaveBeenCalled();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('does not submit account changes without the current password', () => {
    const { component, authService } = setup();
    component['editAccount']();
    component['accountForm'].patchValue({ username: 'new_alice' });
    component['saveAccount']();
    expect(authService.updateAccount).not.toHaveBeenCalled();
    expect(component['accountForm'].controls.currentPassword.touched).toBe(true);
  });
  it('requires password and confirmation before deletion, and Cancel clears both', () => {
    const { component, authService } = setup();
    component['showDeleteConfirmation']();
    component['deleteAccount']();
    expect(authService.deleteAccount).not.toHaveBeenCalled();
    component['deleteForm'].patchValue({ currentPassword: 'old-password' });
    component['deleteAccount']();
    expect(authService.deleteAccount).not.toHaveBeenCalled();
    component['deleteForm'].patchValue({ confirmed: true });
    component['cancelDeletion']();
    expect(component['confirmingDeletion']()).toBe(false);
    expect(component['deleteForm'].getRawValue()).toEqual({
      currentPassword: '',
      confirmed: false,
    });
  });

  it('keeps deletion open and displays server rejection without retaining the password', () => {
    const { component, authService } = setup();
    authService.deleteAccount.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { detail: 'Your current password is incorrect.' },
          }),
      ),
    );
    component['showDeleteConfirmation']();
    component['deleteForm'].setValue({ currentPassword: 'wrong-password', confirmed: true });
    component['deleteAccount']();
    expect(component['deleteError']()).toContain('incorrect');
    expect(component['confirmingDeletion']()).toBe(true);
    expect(component['deleteForm'].controls.currentPassword.value).toBe('');
  });
});
