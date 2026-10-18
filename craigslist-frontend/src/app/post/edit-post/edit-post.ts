import { PostPicturesEditor, PostPictureDraft } from '../post-pictures/post-pictures-editor';
import { findPostDestination, PostDestination } from '../post-destinations';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { PostService } from '../post.service';

@Component({
  selector: 'app-edit-post',
  imports: [PostPicturesEditor, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-post.html',
  styleUrl: './edit-post.scss',
})
export class EditPost implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly postService = inject(PostService);

  protected readonly authService = inject(AuthService);
  protected readonly returnToMyPosts =
    this.route.snapshot.queryParamMap.get('returnTo') === 'my-posts';
  protected readonly postId = this.route.snapshot.paramMap.get('postId');
  protected readonly destination = signal<PostDestination | null>(null);
  protected readonly publicationStatus = signal('PUBLISHED');
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);

  protected readonly pictureDraft = signal<PostPictureDraft>({ files: [], removedPictureIds: [] });
  protected readonly pictureIds = signal<string[]>([]);
  protected readonly postForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
    body: ['', [Validators.required, Validators.pattern(/\S/)]],
    location: ['', Validators.maxLength(255)],
    advertisement: [false],
  });

  ngOnInit(): void {
    this.loadPost();
  }

  protected loadPost(): void {
    if (!this.postId) {
      this.isLoading.set(false);
      this.loadError.set('This post could not be found.');
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    this.postService
      .getPost(this.postId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (post) => {
          if (post.userId !== this.authService.currentUser()?.id) {
            this.loadError.set('You can only edit your own posts.');
            return;
          }

          this.pictureIds.set(post.pictureIds ?? []);
          this.pictureDraft.set({ files: [], removedPictureIds: [] });
          this.destination.set(findPostDestination(post) ?? null);
          this.publicationStatus.set(post.status);
          this.postForm.setValue({
            title: post.title,
            body: post.body,
            location: post.location ?? '',
            advertisement: post.advertisement ?? false,
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(
            error.status === 404
              ? 'This post could not be found.'
              : 'We could not load this post. Please try again.',
          );
        },
      });
  }

  protected submit(): void {
    this.submitError.set(null);

    if (!this.postId || this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const destination = this.destination();
    if (!destination) return;
    const values = this.postForm.getRawValue();
    const location = values.location.trim();

    this.isSubmitting.set(true);
    this.postForm.disable();

    this.postService
      .updatePost(
        this.postId,
        {
          title: values.title.trim(),
          body: values.body.trim(),
          category: destination.category,
          postType: destination.postType,
          location: location || null,
          advertisement: values.advertisement,
        },
        this.pictureDraft().files,
        this.pictureDraft().removedPictureIds,
      )
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.postForm.enable();
        }),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(
            this.returnToMyPosts ? ['/my-posts'] : ['/posts', this.postId],
            {
              queryParams: { updated: 'true', status: this.publicationStatus() },
            },
          );
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.submitError.set('You must be signed in as the post owner to edit it.');
          } else if (error.status === 404) {
            this.submitError.set('This post could not be found.');
          } else if (
            (error.status === 400 || error.status === 413) &&
            typeof error.error?.detail === 'string'
          ) {
            this.submitError.set(error.error.detail);
          } else {
            this.submitError.set('We could not save your changes. Please try again.');
          }
        },
      });
  }
}
