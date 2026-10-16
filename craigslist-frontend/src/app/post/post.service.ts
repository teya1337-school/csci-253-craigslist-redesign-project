import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostRequest } from './models/post-request';
import { PostResponse } from './models/post-response';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);

  getGeneralPosts(): Observable<PostResponse[]> {
    const params = new HttpParams().set('category', 'COMMUNITY').set('postType', 'GENERAL');
    return this.http.get<PostResponse[]>('/api/posts', { params });
  }

  getMyPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>('/api/posts/mine');
  }

  getPost(postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`/api/posts/${postId}`);
  }

  createPost(post: PostRequest): Observable<PostResponse> {
    return this.http.post<PostResponse>('/api/posts', post);
  }

  updatePost(postId: string, post: PostRequest): Observable<PostResponse> {
    return this.http.put<PostResponse>(`/api/posts/${postId}`, post);
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`/api/posts/${postId}`);
  }
}
