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
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly composerInput = viewChild<ElementRef<HTMLTextAreaElement>>('composerInput');
  private replyTrigger?: HTMLElement;
  protected readonly replyTarget = signal<CommentResponse | null>(null);
  protected readonly statusMessage = signal('');

  private readonly formBuilder = inject(FormBuilder);
  private readonly commentService = inject(CommentService);

  readonly postId = input.required<string>();

  protected readonly authService = inject(AuthService);
  protected readonly comments = signal<CommentResponse[]>([]);
  protected readonly commentCount = computed(
    () => this.comments().filter((comment) => !comment.deleted).length,
  );
  protected readonly threadedComments = computed(() => {
    const children = new Map<string | null, CommentResponse[]>();
    for (const comment of this.comments()) {
      const key = comment.parentId ?? null;
      children.set(key, [...(children.get(key) ?? []), comment]);
    }
    const rows: { comment: CommentResponse; depth: number; parentName: string | null }[] = [];
    const visit = (parentId: string | null, depth: number, parentName: string | null) => {
      for (const comment of children.get(parentId) ?? []) {
        rows.push({ comment, depth, parentName });
        visit(comment.id, depth + 1, comment.username);
      }
    };
    visit(null, 0, null);
    return rows;
  });
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

  protected readonly commentForm = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  protected readonly editCommentForm = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  @HostListener('document:click')
  protected closeCommentMenuWhenClickingOutside(): void {
    this.openCommentMenuId.set(null);
  }

  @HostListener('document:keydown.escape')
  protected closeCommentMenuWithEscape(): void {
    if (this.openCommentMenuId()) {
      this.openCommentMenuId.set(null);
      this.openMenuTrigger?.focus();
    }
  }

  ngOnInit(): void {
    this.loadComments();
  }

  protected loadComments(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.commentService
      .getComments(this.postId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (comments) => this.comments.set(comments),
        error: () => this.loadError.set('We could not load the comments. Please try again.'),
      });
  }

  protected openForm(): void {
    this.submitError.set(null);
    this.replyTarget.set(null);
    this.isFormOpen.set(true);
    this.focusComposer();
  }

  protected startReply(comment: CommentResponse, event: Event): void {
    this.replyTrigger = event.currentTarget as HTMLElement;
    this.replyTarget.set(comment);
    this.isFormOpen.set(true);
    this.submitError.set(null);
    this.focusComposer();
  }

  protected focusComment(commentId: string | null): void {
    if (commentId) {
      this.element.nativeElement.querySelector<HTMLElement>('#comment-' + commentId)?.focus();
    }
  }

  private focusComposer(): void {
    setTimeout(() => this.composerInput()?.nativeElement.focus());
  }

  protected cancelComment(): void {
    this.commentForm.reset();
    this.submitError.set(null);
    this.isFormOpen.set(false);
    this.replyTarget.set(null);
    this.replyTrigger?.focus();
  }

  protected submitComment(): void {
    this.submitError.set(null);

    if (this.isSubmitting() || !this.authService.isAuthenticated()) return;

    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    const content = this.commentForm.controls.content.value.trim();
    this.isSubmitting.set(true);
    this.commentForm.disable();

    this.commentService
      .createComment(this.postId(), { content, parentId: this.replyTarget()?.id })
      .pipe(
        finalize(() => {
          this.isSubmitting.set(false);
          this.commentForm.enable();
        }),
      )
      .subscribe({
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

  protected ownsComment(comment: CommentResponse): boolean {
    return !comment.deleted && this.authService.currentUser()?.id === comment.userId;
  }

  protected toggleCommentMenu(commentId: string, event: Event): void {
    event.stopPropagation();
    this.openMenuTrigger = event.currentTarget as HTMLButtonElement;
    this.openCommentMenuId.update((openId) => (openId === commentId ? null : commentId));
  }

  protected startEditing(comment: CommentResponse): void {
    this.openCommentMenuId.set(null);
    this.pendingDeleteCommentId.set(null);
    this.commentActionError.set(null);
    this.editingCommentId.set(comment.id);
    this.editCommentForm.setValue({ content: comment.content });
  }

  protected cancelEditing(): void {
    this.editCommentForm.reset();
    this.commentActionError.set(null);
    this.editingCommentId.set(null);
  }

  protected saveComment(comment: CommentResponse): void {
    this.commentActionError.set(null);

    if (!this.ownsComment(comment) || this.editCommentForm.invalid) {
      this.editCommentForm.markAllAsTouched();
      return;
    }

    const content = this.editCommentForm.controls.content.value.trim();
    this.isManagingComment.set(true);
    this.editCommentForm.disable();

    this.commentService
      .updateComment(this.postId(), comment.id, { content })
      .pipe(
        finalize(() => {
          this.isManagingComment.set(false);
          this.editCommentForm.enable();
        }),
      )
      .subscribe({
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

  protected showDeleteConfirmation(comment: CommentResponse): void {
    this.openCommentMenuId.set(null);
    this.editingCommentId.set(null);
    this.commentActionError.set(null);
    this.pendingDeleteCommentId.set(comment.id);
  }

  protected cancelDelete(): void {
    this.commentActionError.set(null);
    this.pendingDeleteCommentId.set(null);
  }

  protected deleteComment(comment: CommentResponse): void {
    if (!this.ownsComment(comment)) {
      return;
    }

    this.isManagingComment.set(true);
    this.commentActionError.set(null);

    this.commentService
      .deleteComment(this.postId(), comment.id)
      .pipe(finalize(() => this.isManagingComment.set(false)))
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
