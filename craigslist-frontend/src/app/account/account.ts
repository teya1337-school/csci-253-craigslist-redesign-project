import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-account',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly confirmingDeletion = signal(false);
  protected readonly deletingAccount = signal(false);
  protected readonly deleteError = signal('');
  private readonly formBuilder = inject(FormBuilder);
  private readonly user = this.authService.currentUser();
  protected readonly editingAccount = signal(false);
  protected readonly editingPassword = signal(false);
  protected readonly savingAccount = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly accountError = signal('');
  protected readonly accountSuccess = signal('');
  protected readonly passwordError = signal('');
  protected readonly passwordSuccess = signal('');
  protected readonly accountForm = this.formBuilder.nonNullable.group({
    username: [
      this.user?.username ?? '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[A-Za-z0-9_]+$/),
      ],
    ],
    currentPassword: ['', [Validators.required, Validators.maxLength(200)]],
    privateEmail: [
      this.user?.privateEmail ?? '',
      [Validators.required, Validators.email, Validators.maxLength(100)],
    ],
  });
  protected readonly deleteForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(200)]],
    confirmed: [false, Validators.requiredTrue],
  });
  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(200)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  });

  protected editAccount(): void {
    if (this.deletingAccount()) return;
    this.cancelDeletion();
    this.cancelPassword();
    this.resetAccountForm();
    this.accountSuccess.set('');
    this.editingAccount.set(true);
  }

  protected cancelAccount(): void {
    this.resetAccountForm();
    this.editingAccount.set(false);
  }

  private resetAccountForm(): void {
    const user = this.authService.currentUser();
    this.accountForm.reset({
      username: user?.username ?? '',
      privateEmail: user?.privateEmail ?? '',
      currentPassword: '',
    });
    this.accountError.set('');
  }

  protected editPassword(): void {
    if (this.deletingAccount()) return;
    this.cancelDeletion();
    this.cancelAccount();
    this.cancelPassword();
    this.passwordSuccess.set('');
    this.editingPassword.set(true);
  }

  protected cancelPassword(): void {
    this.passwordForm.reset();
    this.passwordError.set('');
    this.editingPassword.set(false);
  }

  protected saveAccount(): void {
    if (
      this.deletingAccount() ||
      !this.editingAccount() ||
      this.savingAccount() ||
      this.savingPassword()
    )
      return;
    this.accountError.set('');
    this.accountSuccess.set('');
    const account = this.accountForm.getRawValue();
    this.accountForm.patchValue({
      username: account.username.trim(),
      privateEmail: account.privateEmail.trim(),
    });
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    this.savingAccount.set(true);
    this.accountForm.disable();
    this.authService
      .updateAccount(this.accountForm.getRawValue())
      .pipe(
        finalize(() => {
          this.savingAccount.set(false);
          this.accountForm.enable();
          this.accountForm.controls.currentPassword.reset();
        }),
      )
      .subscribe({
        next: (user) => {
          if (!user) {
            this.accountError.set(
              'Your changes were saved, but we could not refresh your account. Please sign in again.',
            );
            return;
          }
          this.accountForm.reset({
            username: user.username,
            privateEmail: user.privateEmail,
            currentPassword: '',
          });
          this.editingAccount.set(false);
          this.accountSuccess.set(
            'Your account information was saved. Use your updated username the next time you sign in.',
          );
        },
        error: (error: HttpErrorResponse) =>
          this.accountError.set(
            this.errorMessage(error, 'We could not save your account. Please try again.'),
          ),
      });
  }

  protected changePassword(): void {
    if (
      this.deletingAccount() ||
      !this.editingPassword() ||
      this.savingPassword() ||
      this.savingAccount()
    )
      return;
    this.passwordError.set('');
    this.passwordSuccess.set('');
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const password = this.passwordForm.getRawValue();
    if (password.newPassword !== password.confirmPassword) {
      this.passwordError.set('The new passwords do not match.');
      return;
    }
    if (new TextEncoder().encode(password.newPassword).length > 72) {
      this.passwordError.set('Your new password is too long. Use fewer characters.');
      return;
    }
    this.savingPassword.set(true);
    this.passwordForm.disable();
    this.authService
      .changePassword(password)
      .pipe(
        finalize(() => {
          this.savingPassword.set(false);
          this.passwordForm.enable();
          this.passwordForm.controls.currentPassword.reset();
        }),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.editingPassword.set(false);
          this.passwordSuccess.set('Your password was changed.');
        },
        error: (error: HttpErrorResponse) =>
          this.passwordError.set(
            this.errorMessage(error, 'We could not change your password. Please try again.'),
          ),
      });
  }

  protected showDeleteConfirmation(): void {
    this.cancelAccount();
    this.cancelPassword();
    this.accountSuccess.set('');
    this.passwordSuccess.set('');
    this.cancelDeletion();
    this.confirmingDeletion.set(true);
  }

  protected cancelDeletion(): void {
    this.deleteForm.reset();
    this.deleteError.set('');
    this.confirmingDeletion.set(false);
  }

  protected deleteAccount(): void {
    if (
      !this.confirmingDeletion() ||
      this.deletingAccount() ||
      this.savingAccount() ||
      this.savingPassword()
    )
      return;
    this.deleteError.set('');
    if (this.deleteForm.invalid) {
      this.deleteForm.markAllAsTouched();
      return;
    }
    this.deletingAccount.set(true);
    this.deleteForm.disable();
    this.authService
      .deleteAccount(this.deleteForm.getRawValue())
      .pipe(
        finalize(() => {
          this.deletingAccount.set(false);
          this.deleteForm.enable();
          this.deleteForm.controls.currentPassword.reset();
        }),
      )
      .subscribe({
        next: () => {
          this.deleteForm.reset();
          void this.router.navigate(['/'], { queryParams: { accountDeleted: 'true' } });
        },
        error: (error: HttpErrorResponse) =>
          this.deleteError.set(
            this.errorMessage(error, 'We could not delete your account. Please try again.'),
          ),
      });
  }

  private errorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 401) return 'Please sign in again to update your account.';
    if (error.status === 403)
      return 'Your session could not be verified. Refresh the page and try again.';
    if ((error.status === 400 || error.status === 409) && typeof error.error?.detail === 'string')
      return error.error.detail;
    return fallback;
  }
}
