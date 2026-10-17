import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth.service';
import { accountReturnUrl } from '../return-url';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['../login/login.scss', './signup.scss'],
})
export class Signup {
  protected readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly signupForm = this.formBuilder.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[A-Za-z0-9_]+$/),
      ],
    ],
    privateEmail: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required],
  });
  protected readonly returnUrl = accountReturnUrl(
    this.route.snapshot.queryParamMap.get('returnUrl'),
  );

  protected submit(): void {
    if (this.submitting()) return;
    this.errorMessage.set('');
    const values = this.signupForm.getRawValue();
    this.signupForm.patchValue({
      username: values.username.trim(),
      privateEmail: values.privateEmail.trim(),
    });
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    if (values.password !== values.confirmPassword) {
      this.errorMessage.set('The passwords do not match.');
      return;
    }
    if (new TextEncoder().encode(values.password).length > 72) {
      this.errorMessage.set('Your password is too long. Use fewer characters.');
      return;
    }
    this.submitting.set(true);
    this.signupForm.disable();
    this.auth
      .signup(this.signupForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting.set(false);
          this.signupForm.enable();
        }),
      )
      .subscribe({
        next: () => {
          this.signupForm.reset();
          void this.router.navigate(['/login'], {
            queryParams: { registered: 'true', returnUrl: this.returnUrl },
            replaceUrl: true,
          });
        },
        error: (error: HttpErrorResponse) =>
          this.errorMessage.set(
            (error.status === 400 || error.status === 409) &&
              typeof error.error?.detail === 'string'
              ? error.error.detail
              : error.status === 403
                ? 'Your session could not be verified. Refresh the page and try again.'
                : 'We could not create your account. Please try again.',
          ),
      });
  }
}
