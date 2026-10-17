import { UserAvatar } from '../../shared/user-avatar';
import { PictureDraft, ProfilePicture } from '../profile-picture/profile-picture';
import { AuthService } from '../../auth/auth.service';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, combineLatest, of, startWith, Subject, switchMap } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { PostResponse } from '../../post/models/post-response';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';

interface PublicProfile {
  id: string;
  username: string;
  memberSince: string;
  pictureVersion: string | null;
  bio: string | null;
  publicEmail: string | null;
  publicPhoneNumber: string | null;
  posts: PostResponse[];
}

@Component({
  selector: 'app-user-profile',
  imports: [DatePipe, RouterLink, EditedIndicator, ReactiveFormsModule, UserAvatar, ProfilePicture],
  templateUrl: './user-profile.html',
  styleUrls: ['../../community/general/general.scss', './user-profile.scss'],
})
export class UserProfile implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private saveRequest?: Subscription;
  private pictureDraft: PictureDraft = { file: null, removePicture: false };
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly saveSuccess = signal('');
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    bio: ['', Validators.maxLength(1000)],
    publicEmail: ['', [Validators.email, Validators.maxLength(100)]],
    publicPhoneNumber: ['', [Validators.maxLength(30), Validators.pattern(/^[0-9+(). \-]*$/)]],
    currentPassword: ['', [Validators.required, Validators.maxLength(200)]],
  });
  private readonly reload = new Subject<void>();
  protected readonly profile = signal<PublicProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.reload.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          this.saveRequest?.unsubscribe();
          this.cancelEdit();
          this.saveSuccess.set('');
          this.profile.set(null);
          this.isLoading.set(true);
          this.errorMessage.set(null);
          return this.http
            .get<PublicProfile>(
              `/api/users/${encodeURIComponent(params.get('userId') ?? '')}/profile`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) => {
                this.errorMessage.set(
                  error.status === 404
                    ? 'This user profile could not be found.'
                    : 'We could not load this profile. Please try again.',
                );
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
        this.title.setTitle(
          profile
            ? `${profile.username} | Fresno Exchange`
            : 'Profile unavailable | Fresno Exchange',
        );
      });
  }

  protected editProfile(): void {
    const profile = this.profile();
    if (!profile || profile.id !== this.authService.currentUser()?.id) return;
    this.profileForm.reset({
      bio: profile.bio ?? '',
      publicEmail: profile.publicEmail ?? '',
      publicPhoneNumber: profile.publicPhoneNumber ?? '',
      currentPassword: '',
    });
    this.saveError.set('');
    this.saveSuccess.set('');
    this.editing.set(true);
  }

  protected cancelEdit(): void {
    this.pictureDraft = { file: null, removePicture: false };
    this.profileForm.reset();
    this.editing.set(false);
    this.saveError.set('');
  }

  protected saveProfile(): void {
    const profile = this.profile();
    if (
      !this.editing() ||
      this.saving() ||
      !profile ||
      profile.id !== this.authService.currentUser()?.id
    )
      return;
    const values = this.profileForm.getRawValue();
    this.profileForm.patchValue({
      bio: values.bio.trim(),
      publicEmail: values.publicEmail.trim(),
      publicPhoneNumber: values.publicPhoneNumber.trim(),
    });
    this.saveError.set('');
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const update = this.profileForm.getRawValue();
    const data = new FormData();
    data.append('profile', new Blob([JSON.stringify(update)], { type: 'application/json' }));
    if (this.pictureDraft.file) data.append('file', this.pictureDraft.file);
    data.append('removePicture', String(this.pictureDraft.removePicture));
    this.saving.set(true);
    this.profileForm.disable();
    this.saveRequest = this.http
      .put<{ pictureVersion: string | null }>('/api/account/profile', data)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.profileForm.enable();
          this.profileForm.controls.currentPassword.reset();
        }),
      )
      .subscribe({
        next: (result) => {
          this.authService.updatePictureVersion(result.pictureVersion);
          this.profile.set({
            ...profile,
            pictureVersion: result.pictureVersion,
            bio: update.bio || null,
            publicEmail: update.publicEmail || null,
            publicPhoneNumber: update.publicPhoneNumber || null,
          });
          this.cancelEdit();
          this.saveSuccess.set('Your profile was updated.');
        },
        error: (error: HttpErrorResponse) =>
          this.saveError.set(
            error.status === 401
              ? 'Please sign in again to edit your profile.'
              : (error.status === 400 || error.status === 413) &&
                  typeof error.error?.detail === 'string'
                ? error.error.detail
                : 'We could not update your profile. Please try again.',
          ),
      });
  }

  protected pictureChanged(draft: PictureDraft): void {
    this.pictureDraft = draft;
  }

  protected emailLink(email: string): string {
    return 'mailto:' + encodeURIComponent(email);
  }

  protected retry(): void {
    this.reload.next();
  }
}
