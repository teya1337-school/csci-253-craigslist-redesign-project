import { PostPictureGallery } from '../post-pictures/post-picture-gallery';
import { AdBadge } from '../../shared/ad-badge';
import { findPostDestination } from '../post-destinations';
import { UserLink } from '../../shared/user-link/user-link';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';
import { PostComments } from '../../comment/post-comments/post-comments';
import { PostResponse } from '../models/post-response';
import { PostService } from '../post.service';

@Component({
  selector: 'app-post-detail',
  imports: [
    PostPictureGallery,
    AdBadge,
    UserLink,
    EditedIndicator,
    DatePipe,
    PostComments,
    RouterLink,
  ],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss',
})
export class PostDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private postRequest?: Subscription;
  private readonly router = inject(Router);
  private readonly postService = inject(PostService);

  protected readonly authService = inject(AuthService);
  protected readonly post = signal<PostResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly publicationMessage = signal('');
  protected readonly publicationError = signal('');
  protected readonly changingPublication = signal(false);
  protected readonly wasUpdated = signal(false);
  protected readonly isPostMenuOpen = signal(false);
  protected readonly isConfirmingDelete = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly destination = computed(() =>
    this.post() ? findPostDestination(this.post()!) : undefined,
  );
  protected readonly isOwner = computed(() => {
    const post = this.post();
    const user = this.authService.currentUser();
    return Boolean(post && user && post.userId === user.id);
  });

  @ViewChild('postMenu') private postMenu?: ElementRef<HTMLElement>;
  @ViewChild('postMenuTrigger') private postMenuTrigger?: ElementRef<HTMLButtonElement>;

  @HostListener('document:click', ['$event'])
  protected closeMenuWhenClickingOutside(event: MouseEvent): void {
    if (this.isPostMenuOpen() && !this.postMenu?.nativeElement.contains(event.target as Node)) {
      this.isPostMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeMenuWithEscape(): void {
    if (this.isPostMenuOpen()) {
      this.isPostMenuOpen.set(false);
      this.postMenuTrigger?.nativeElement.focus();
    }
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.publicationMessage.set('');
      this.publicationError.set('');
      this.wasUpdated.set(this.route.snapshot.queryParamMap.get('updated') === 'true');
      this.isPostMenuOpen.set(false);
      this.isConfirmingDelete.set(false);
      this.deleteError.set(null);
      this.loadPost();
    });
  }

  protected loadPost(): void {
    this.postRequest?.unsubscribe();
    this.post.set(null);
    const postId = this.route.snapshot.paramMap.get('postId');

    if (!postId) {
      this.isLoading.set(false);
      this.errorMessage.set('This post could not be found.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.postRequest = this.postService
      .getPost(postId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (post) => this.post.set(post),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.status === 404
              ? 'This post could not be found.'
              : 'We could not load this post. Please try again.',
          );
        },
      });
  }

  protected changePublication(): void {
    const post = this.post();
    if (!post || !this.isOwner() || this.changingPublication()) return;
    this.closePostMenu();
    this.publicationError.set('');
    this.changingPublication.set(true);
    this.postService
      .changePublication(post.id, post.status !== 'PUBLISHED')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.changingPublication.set(false)),
      )
      .subscribe({
        next: (updated) => {
          if (this.post()?.id !== updated.id) return;
          this.post.set(updated);
          this.publicationMessage.set(
            updated.status === 'PUBLISHED'
              ? 'Post published.'
              : 'Post unpublished. Only you can view it.',
          );
        },
        error: () =>
          this.publicationError.set('We could not change publication. Please try again.'),
      });
  }

  protected showDeleteConfirmation(): void {
    this.isPostMenuOpen.set(false);
    this.deleteError.set(null);
    this.isConfirmingDelete.set(true);
  }

  protected togglePostMenu(): void {
    this.isPostMenuOpen.update((isOpen) => !isOpen);
  }

  protected closePostMenu(): void {
    this.isPostMenuOpen.set(false);
  }

  protected cancelDelete(): void {
    this.isConfirmingDelete.set(false);
  }

  protected deletePost(): void {
    const post = this.post();

    if (!post || !this.isOwner()) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);

    this.postService
      .deletePost(post.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate([this.destination()?.path ?? '/'], {
            queryParams: { deleted: 'true' },
          });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.deleteError.set('You must be signed in as the post owner to delete it.');
          } else if (error.status === 404) {
            this.deleteError.set('This post could not be found.');
          } else {
            this.deleteError.set('We could not delete this post. Please try again.');
          }
        },
      });
  }
}
