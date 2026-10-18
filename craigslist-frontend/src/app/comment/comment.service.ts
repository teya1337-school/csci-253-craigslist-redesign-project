import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentRequest } from './models/comment-request';
import { CommentResponse } from './models/comment-response';

@Service()
export class CommentService {
  private readonly http = inject(HttpClient);

  // Fetch comments for a specific post.
  getComments(postId: string): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`/api/posts/${postId}/comments`);
  }

  // Create a new comment for a specific post.
  createComment(postId: string, comment: CommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`/api/posts/${postId}/comments`, comment);
  }

  // Update an existing comment for a specific post.
  updateComment(
    postId: string,
    commentId: string,
    comment: CommentRequest,
  ): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`/api/posts/${postId}/comments/${commentId}`, comment);
  }

  // Delete a comment for a specific post.
  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`/api/posts/${postId}/comments/${commentId}`);
  }
}
