import { AdBadge } from '../../shared/ad-badge';
import { findPostDestination } from '../post-destinations';
import { UserLink } from '../../shared/user-link/user-link';
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
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';
import { PostResponse } from '../models/post-response';
import { PostService } from '../post.service';

@Component({
  selector: 'app-my-posts',
  imports: [AdBadge, UserLink, DatePipe, RouterLink, EditedIndicator],
  templateUrl: './my-posts.html',
  styleUrl: './my-posts.scss',
})
export class MyPosts implements OnInit {
  private readonly postService = inject(PostService);
  private readonly route = inject(ActivatedRoute);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private menuTrigger?: HTMLButtonElement;

  protected readonly destinationFor = findPostDestination;

  protected readonly posts = signal<PostResponse[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly pendingDelete = signal<PostResponse | null>(null);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly statusMessage = signal('');
  protected readonly selectedStatus = signal<'PUBLISHED' | 'UNPUBLISHED'>('PUBLISHED');
  protected readonly changingPublication = signal<string | null>(null);
  protected readonly publicationError = signal('');

  protected readonly publishedPosts = computed(() =>
    this.posts().filter((post) => post.status === 'PUBLISHED'),
  );

  protected readonly unpublishedPosts = computed(() =>
    this.posts().filter((post) => post.status === 'UNPUBLISHED'),
  );

  protected readonly visiblePosts = computed(() =>
    this.selectedStatus() === 'PUBLISHED' ? this.publishedPosts() : this.unpublishedPosts(),
  );

  ngOnInit(): void {
    // Listen for query param changes to update the selected status and reset messages.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.statusMessage.set('');
      this.publicationError.set('');
      this.selectedStatus.set(params.get('status') === 'UNPUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED');
      this.closeMenu();
      this.pendingDelete.set(null);
    });

    // Show a status message if the user was redirected here after saving changes to a post.
    if (this.route.snapshot.queryParamMap.get('updated') === 'true') {
      this.statusMessage.set('Your changes were saved.');
    }

    // Load the user's posts.
    this.loadPosts();
  }

  // Load the user's posts from the server and handle loading state and errors.
  protected loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Fetch the user's posts and sort them by creation date in descending order.
    this.postService.getMyPosts().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (posts) =>
        this.posts.set(
          [...posts].sort((a, b) =>
            Date.parse(b.createdAt) - Date.parse(a.createdAt)),
        ),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.status === 401
            ? 'Your session has expired. Sign in again to view your posts.'
            : 'We could not load your posts. Please try again.',
        ),
    });
  }

  // Close the menu when clicking outside of it.
  @HostListener('document:click')
  protected closeMenu(): void {
    this.openMenuId.set(null);
  }

  // Close the menu when pressing the Escape key and return focus to the menu trigger button.
  @HostListener('document:keydown.escape')
  protected closeWithEscape(): void {
    if (this.openMenuId()) {
      this.closeMenu();
      this.menuTrigger?.focus();
    }
  }

  // Toggle the menu for a specific post and manage focus for accessibility.
  protected toggleMenu(postId: string, event: Event): void {
    event.stopPropagation();

    this.menuTrigger = event.currentTarget as HTMLButtonElement;

    // Toggle the menu open or closed based on the current state.
    this.openMenuId.update((id) => (id === postId ? null : postId));

    // If the menu is opened, focus the first menu item for accessibility.
    if (this.openMenuId()) {
      setTimeout(() =>
        this.element.nativeElement.querySelector<HTMLElement>('[role="menuitem"]')?.focus(),
      );
    }
  }

  // Handle keyboard navigation within the menu using ArrowUp and ArrowDown keys.
  protected moveMenuFocus(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();

    const items = [
      ...this.element.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ];

    const index = items.indexOf(event.target as HTMLElement);

    items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }

  // Change the publication status of a post and handle loading state and errors.
  protected changePublication(post: PostResponse): void {
    if (this.changingPublication()) {
      return;
    }

    this.closeMenu();

    this.pendingDelete.set(null);
    this.publicationError.set('');
    this.statusMessage.set('');
    this.changingPublication.set(post.id);

    const published = post.status !== 'PUBLISHED';

    // Call the service to change the publication status and update the local state accordingly.
    this.postService.changePublication(post.id, published).pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.changingPublication.set(null)),
      ).subscribe({
        next: (updated) => {
          this.posts.update((posts) =>
            posts.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.statusMessage.set(
            published ? 'Post published.' : 'Post unpublished. Only you can view it.',
          );
          setTimeout(() =>
            this.element.nativeElement
              .querySelector<HTMLElement>('.publication-tabs .active')
              ?.focus(),
          );
        },
        error: () =>
          this.publicationError.set('We could not change publication. Please try again.'),
      });
  }

  protected confirmDelete(post: PostResponse): void {
    this.closeMenu();

    this.pendingDelete.set(post);
    this.deleteError.set(null);

    setTimeout(() =>
      this.element.nativeElement.querySelector<HTMLButtonElement>('.cancel-delete')?.focus(),
    );
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
    this.deleteError.set(null);
    this.menuTrigger?.focus();
  }

  // Delete the post if it is not already being deleted and handle loading state and errors.
  protected deletePost(): void {
    const post = this.pendingDelete();

    if (!post || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    this.deleteError.set(null);

    // Call the service to delete the post and update the local state accordingly.
    this.postService.deletePost(post.id).pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.posts.update((posts) => posts.filter((item) => item.id !== post.id));
          this.pendingDelete.set(null);
          this.statusMessage.set('Your post was deleted.');
          setTimeout(() =>
            this.element.nativeElement.querySelector<HTMLElement>('#my-posts-heading')?.focus(),
          );
        },
        error: (error: HttpErrorResponse) =>
          this.deleteError.set(
            error.status === 401 || error.status === 403
              ? 'You must be signed in as the post owner to delete it.'
              : 'We could not delete this post. Please try again.',
          ),
      });
  }
}
