import { UserLink } from '../../shared/user-link/user-link';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';
import { PostResponse } from '../models/post-response';
import { PostService } from '../post.service';

@Component({
  selector: 'app-my-posts',
  imports: [UserLink, DatePipe, RouterLink, EditedIndicator],
  templateUrl: './my-posts.html',
  styleUrl: './my-posts.scss',
})
export class MyPosts implements OnInit {
  private readonly postService = inject(PostService);
  private readonly route = inject(ActivatedRoute);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private menuTrigger?: HTMLButtonElement;
  protected readonly posts = signal<PostResponse[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly pendingDelete = signal<PostResponse | null>(null);
  protected readonly isDeleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly statusMessage = signal('');

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('updated') === 'true') {
      this.statusMessage.set('Your changes were saved.');
    }
    this.loadPosts();
  }

  protected loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.postService
      .getMyPosts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (posts) =>
          this.posts.set(
            [...posts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
          ),
        error: (error: HttpErrorResponse) =>
          this.errorMessage.set(
            error.status === 401
              ? 'Your session has expired. Sign in again to view your posts.'
              : 'We could not load your posts. Please try again.',
          ),
      });
  }

  @HostListener('document:click')
  protected closeMenu(): void {
    this.openMenuId.set(null);
  }

  @HostListener('document:keydown.escape')
  protected closeWithEscape(): void {
    if (this.openMenuId()) {
      this.closeMenu();
      this.menuTrigger?.focus();
    }
  }

  protected toggleMenu(postId: string, event: Event): void {
    event.stopPropagation();
    this.menuTrigger = event.currentTarget as HTMLButtonElement;
    this.openMenuId.update((id) => (id === postId ? null : postId));
    if (this.openMenuId()) {
      setTimeout(() =>
        this.element.nativeElement.querySelector<HTMLElement>('[role="menuitem"]')?.focus(),
      );
    }
  }

  protected moveMenuFocus(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [
      ...this.element.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    ];
    const index = items.indexOf(event.target as HTMLElement);
    items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
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

  protected deletePost(): void {
    const post = this.pendingDelete();
    if (!post || this.isDeleting()) return;
    this.isDeleting.set(true);
    this.deleteError.set(null);
    this.postService
      .deletePost(post.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
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
