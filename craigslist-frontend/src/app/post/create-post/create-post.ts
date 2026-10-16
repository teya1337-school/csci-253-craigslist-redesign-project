import { DestinationPicker } from '../destination-picker/destination-picker';
import { PostDestination, postDestinations } from '../post-destinations';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { PostService } from '../post.service';

@Component({
  selector: 'app-create-post',
  imports: [DestinationPicker, ReactiveFormsModule, RouterLink],
  templateUrl: './create-post.html',
  styleUrl: './create-post.scss',
})
export class CreatePost {
  private readonly formBuilder = inject(FormBuilder);
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);
  protected readonly fromMyPosts = this.route.snapshot.data['chooseDestination'] === true;
  protected readonly destination = signal<PostDestination | null>(
    this.fromMyPosts ? null : postDestinations[0],
  );
  protected readonly destinationError = signal(false);
  private readonly destinationPicker = viewChild(DestinationPicker);

  protected readonly authService = inject(AuthService);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly postForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.pattern(/\S/)]],
    location: ['', Validators.maxLength(255)],
  });

  protected submit(): void {
    this.errorMessage.set(null);

    if (this.isSubmitting()) return;
    const destination = this.destination();
    this.destinationError.set(!destination);
    if (!destination) {
      this.destinationPicker()?.open();
      return;
    }

    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const values = this.postForm.getRawValue();
    const location = values.location.trim();

    this.isSubmitting.set(true);
    this.postForm.disable();

    this.postService
      .createPost({
        title: values.title.trim(),
        body: values.body.trim(),
        category: destination.category,
        postType: destination.postType,
        location: location || null,
      })
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.postForm.enable();
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigate([destination.path], {
            queryParams: { created: 'true' },
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.errorMessage.set('Your session has expired. Please sign in and try again.');
          } else if (error.status === 0 || error.status === 502 || error.status === 504) {
            this.errorMessage.set(
              'The service is unavailable right now. Please try again shortly.',
            );
          } else {
            this.errorMessage.set(
              'We could not publish your post. Please review it and try again.',
            );
          }
        },
      });
  }
}
