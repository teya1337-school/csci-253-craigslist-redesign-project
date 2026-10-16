import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommentRequest } from './models/comment-request';
import { CommentResponse } from './models/comment-response';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly http = inject(HttpClient);

  getComments(postId: string): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`/api/posts/${postId}/comments`);
  }

  createComment(postId: string, comment: CommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`/api/posts/${postId}/comments`, comment);
  }

  updateComment(
    postId: string,
    commentId: string,
    comment: CommentRequest,
  ): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`/api/posts/${postId}/comments/${commentId}`, comment);
  }

  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`/api/posts/${postId}/comments/${commentId}`);
  }
}
