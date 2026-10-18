import { PostPicturesEditor, PostPictureDraft } from '../post-pictures/post-pictures-editor';
import { DestinationPicker } from '../destination-picker/destination-picker';
import { PostDestination } from '../post-destinations';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { PostService } from '../post.service';

@Component({
  selector: 'app-create-post',
  imports: [PostPicturesEditor, DestinationPicker, ReactiveFormsModule, RouterLink],
  templateUrl: './create-post.html',
  styleUrl: './create-post.scss',
})
export class CreatePost {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly fromMyPosts = this.route.snapshot.data['chooseDestination'] === true;

  protected readonly destination = signal<PostDestination | null>(
    this.fromMyPosts ? null : (this.route.snapshot.data['destination'] as PostDestination),
  );

  protected readonly pictureDraft = signal<PostPictureDraft>({ files: [], removedPictureIds: [] });
  protected readonly isSubmitting = signal(false);
  protected readonly destinationError = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // Use viewChild to get a reference to the DestinationPicker component.
  // We can open it when the user tries to submit without selecting a destination.
  private readonly destinationPicker = viewChild(DestinationPicker);

  protected readonly postForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.pattern(/\S/)]],
    location: ['', Validators.maxLength(255)],
    advertisement: [false],
  });

  // Submit handler for the form.
  protected submit(): void {
    this.errorMessage.set(null);

    if (this.isSubmitting()) {
      return;
    }

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

    // Call the post service to create the post.
    this.postService.createPost({
          title: values.title.trim(),
          body: values.body.trim(),
          category: destination.category,
          postType: destination.postType,
          location: location || null,
          advertisement: values.advertisement,
        },
      this.pictureDraft().files,
      ).pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.postForm.enable();
        }),
      ).subscribe({
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
          } else if (
            (error.status === 400 || error.status === 413) &&
            typeof error.error?.detail === 'string'
          ) {
            this.errorMessage.set(error.error.detail);
          } else {
            this.errorMessage.set(
              'We could not publish your post. Please review it and try again.',
            );
          }
        },
      });
  }
}
