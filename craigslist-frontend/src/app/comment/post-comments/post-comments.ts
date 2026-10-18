import { UserLink } from '../../shared/user-link/user-link';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { CommentService } from '../comment.service';
import { CommentResponse } from '../models/comment-response';

@Component({
  selector: 'app-post-comments',
  imports: [UserLink, EditedIndicator, NgTemplateOutlet, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './post-comments.html',
  styleUrl: './post-comments.scss',
})
export class PostComments implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly commentService = inject(CommentService);

  private readonly composerInput = viewChild<ElementRef<HTMLTextAreaElement>>('composerInput');

  private replyTrigger?: HTMLElement;

  protected readonly replyTarget = signal<CommentResponse | null>(null);
  protected readonly statusMessage = signal('');

  readonly postId = input.required<string>();

  protected readonly comments = signal<CommentResponse[]>([]);
  protected readonly commentCount = computed(
    () => this.comments().filter((comment) => !comment.deleted).length,
  );

  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly isFormOpen = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly openCommentMenuId = signal<string | null>(null);
  protected readonly editingCommentId = signal<string | null>(null);
  protected readonly pendingDeleteCommentId = signal<string | null>(null);
  protected readonly isManagingComment = signal(false);
  protected readonly commentActionError = signal<string | null>(null);
  private openMenuTrigger?: HTMLButtonElement;

  // Organize comments into a threaded structure for display.
  protected readonly threadedComments = computed(() => {
    // Create a map of parentId to its child comments for easy lookup.
    const children = new Map<string | null, CommentResponse[]>();

    // Populate the map with comments, grouping them by their parentId.
    for (const comment of this.comments()) {
      const key = comment.parentId ?? null;
      children.set(key, [...(children.get(key) ?? []), comment]);
    }

    // Create a flat list of comments with depth information for rendering.
    const rows: { comment: CommentResponse; depth: number; parentName: string | null }[] = [];

    // Recursively visit comments and their children to build a flat list with depth information.
    const visit = (parentId: string | null, depth: number, parentName: string | null) => {
      for (const comment of children.get(parentId) ?? []) {
        rows.push({ comment, depth, parentName });
        visit(comment.id, depth + 1, comment.username);
      }
    };

    visit(null, 0, null);

    return rows;
  });

  // Close the comment menu when clicking outside of it.
  @HostListener('document:click')
  protected closeCommentMenuWhenClickingOutside(): void {
    this.openCommentMenuId.set(null);
  }

  // Close the comment menu when pressing the Escape key.
  @HostListener('document:keydown.escape')
  protected closeCommentMenuWithEscape(): void {
    if (this.openCommentMenuId()) {
      this.openCommentMenuId.set(null);
      this.openMenuTrigger?.focus();
    }
  }

  protected readonly commentForm = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  protected readonly editCommentForm = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  ngOnInit(): void {
    this.loadComments();
  }

  // Load comments for the given postId and handle loading state and errors.
  protected loadComments(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    // Fetch comments from the CommentService and update the comments signal.
    this.commentService.getComments(this.postId()).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (comments) => this.comments.set(comments),
      error: () => this.loadError.set('We could not load the comments. Please try again.'),
    });
  }

  // Open the comment form for creating a new comment.
  protected openForm(): void {
    this.submitError.set(null);
    this.replyTarget.set(null);
    this.isFormOpen.set(true);
    this.focusComposer();
  }

  // Open the comment form for replying to a specific comment.
  protected startReply(comment: CommentResponse, event: Event): void {
    this.replyTrigger = event.currentTarget as HTMLElement;
    this.replyTarget.set(comment);
    this.isFormOpen.set(true);
    this.submitError.set(null);
    this.focusComposer();
  }

  // Focus on a specific comment by its ID.
  protected focusComment(commentId: string | null): void {
    if (commentId) {
      this.element.nativeElement.querySelector<HTMLElement>('#comment-' + commentId)?.focus();
    }
  }

  // Focus on the comment composer input after a short delay to ensure it's rendered.
  private focusComposer(): void {
    setTimeout(() => this.composerInput()?.nativeElement.focus());
  }

  // Cancel the comment form, reset its state, and return focus to the reply trigger if applicable.
  protected cancelComment(): void {
    this.commentForm.reset();
    this.submitError.set(null);
    this.isFormOpen.set(false);
    this.replyTarget.set(null);
    this.replyTrigger?.focus();
  }

  // Submit a new comment or reply, handling form validation, submission state, and errors.
  protected submitComment(): void {
    this.submitError.set(null);

    if (this.isSubmitting() || !this.authService.isAuthenticated()) {
      return;
    }

    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const content = this.commentForm.controls.content.value.trim();
    this.isSubmitting.set(true);
    this.commentForm.disable();

    // Call the CommentService to create a new comment, passing the postId and optional parentId for replies.
    this.commentService.createComment(this.postId(), { content, parentId: this.replyTarget()?.id }).pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.commentForm.enable();
        }),
      ).subscribe({
        next: (comment) => {
          this.comments.update((comments) => [...comments, comment]);
          this.commentForm.reset();
          this.isFormOpen.set(false);
          this.replyTarget.set(null);
          this.statusMessage.set('Your comment was posted.');
          setTimeout(() =>
            this.element.nativeElement
              .querySelector<HTMLElement>('#comment-' + comment.id)
              ?.focus(),
          );
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 403) {
            this.submitError.set('Your session has expired. Please sign in and try again.');
          } else if (error.status === 404) {
            this.submitError.set(
              'This comment is no longer available. Cancel and refresh the discussion.',
            );
          } else {
            this.submitError.set('We could not post your comment. Please try again.');
          }
        },
      });
  }

  // Check if the current user owns the given comment, considering deleted comments.
  protected ownsComment(comment: CommentResponse): boolean {
    return !comment.deleted && this.authService.currentUser()?.id === comment.userId;
  }

  // Toggle the visibility of the comment menu for a specific comment, ensuring only one menu is open at a time.
  protected toggleCommentMenu(commentId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuTrigger = event.currentTarget as HTMLButtonElement;
    this.openCommentMenuId.update((openId) => (openId === commentId ? null : commentId));
  }

  // Start editing a comment by setting the editingCommentId and populating the edit form with the comment's content.
  protected startEditing(comment: CommentResponse): void {
    this.openCommentMenuId.set(null);
    this.pendingDeleteCommentId.set(null);
    this.commentActionError.set(null);
    this.editingCommentId.set(comment.id);
    this.editCommentForm.setValue({ content: comment.content });
  }

  // Cancel the comment editing process, reset the form, and clear the editing state.
  protected cancelEditing(): void {
    this.editCommentForm.reset();
    this.commentActionError.set(null);
    this.editingCommentId.set(null);
  }

  // Save the edited comment, handling form validation, submission state, and errors.
  protected saveComment(comment: CommentResponse): void {
    this.commentActionError.set(null);

    if (!this.ownsComment(comment) || this.editCommentForm.invalid) {
      this.editCommentForm.markAllAsTouched();
      return;
    }

    const content = this.editCommentForm.controls.content.value.trim();
    this.isManagingComment.set(true);
    this.editCommentForm.disable();

    // Call the CommentService to update the comment, passing the postId, commentId, and new content.
    this.commentService.updateComment(this.postId(), comment.id, { content }).pipe(
        finalize(() => {
          this.isManagingComment.set(false);
          this.editCommentForm.enable();
        }),
      ).subscribe({
        next: (updatedComment) => {
          this.comments.update((comments) =>
            comments.map((existingComment) =>
              existingComment.id === updatedComment.id ? updatedComment : existingComment,
            ),
          );
          this.editCommentForm.reset();
          this.editingCommentId.set(null);
        },
        error: (error: HttpErrorResponse) => this.setCommentActionError(error, 'save'),
      });
  }

  // Show a confirmation dialog for deleting a comment, setting the pendingDeleteCommentId to the comment's ID.
  protected showDeleteConfirmation(comment: CommentResponse): void {
    this.openCommentMenuId.set(null);
    this.editingCommentId.set(null);
    this.commentActionError.set(null);
    this.pendingDeleteCommentId.set(comment.id);
  }

  // Cancel the delete confirmation, clearing the pending delete state.
  protected cancelDelete(): void {
    this.commentActionError.set(null);
    this.pendingDeleteCommentId.set(null);
  }

  // Delete a comment if the current user owns it, handling submission state and errors.
  protected deleteComment(comment: CommentResponse): void {
    if (!this.ownsComment(comment)) {
      return;
    }

    this.isManagingComment.set(true);
    this.commentActionError.set(null);

    // Call the CommentService to delete the comment, passing the postId and commentId.
    this.commentService.deleteComment(this.postId(), comment.id).pipe(
      finalize(() => this.isManagingComment.set(false)))
      .subscribe({
        next: () => {
          this.comments.update((comments) =>
            comments.map((existingComment) =>
              existingComment.id === comment.id
                ? {
                    ...existingComment,
                    deleted: true,
                    content: 'Comment deleted',
                    username: '[deleted]',
                    userId: null,
                  }
                : existingComment,
            ),
          );
          this.pendingDeleteCommentId.set(null);
        },
        error: (error: HttpErrorResponse) => this.setCommentActionError(error, 'delete'),
      });
  }

  // Set an appropriate error message based on the HTTP error response and the action being performed (save or delete).
  private setCommentActionError(error: HttpErrorResponse, action: 'save' | 'delete'): void {
    if (error.status === 401 || error.status === 403) {
      this.commentActionError.set('You must be signed in as the comment author to manage it.');
    } else if (error.status === 404) {
      this.commentActionError.set('This comment could not be found.');
    } else {
      this.commentActionError.set(`We could not ${action} this comment. Please try again.`);
    }
  }
}
