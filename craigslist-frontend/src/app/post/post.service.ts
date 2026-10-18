import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostCategory, PostType, PostRequest } from './models/post-request';
import { PostResponse } from './models/post-response';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly http = inject(HttpClient);

  getPosts(category: PostCategory, postType: PostType): Observable<PostResponse[]> {
    const params = new HttpParams().set('category', category).set('postType', postType);
    return this.http.get<PostResponse[]>('/api/posts', { params });
  }

  searchPosts(search: string): Observable<{ posts: PostResponse[]; total: number }> {
    return this.http.get<{ posts: PostResponse[]; total: number }>('/api/posts/search', {
      params: { search },
    });
  }

  getMyPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>('/api/posts/mine');
  }

  getPost(postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`/api/posts/${postId}`);
  }

  createPost(post: PostRequest, files: readonly File[] = []): Observable<PostResponse> {
    return this.http.post<PostResponse>('/api/posts', this.postData(post, files));
  }

  updatePost(
    postId: string,
    post: PostRequest,
    files: readonly File[] = [],
    removedPictureIds: readonly string[] = [],
  ): Observable<PostResponse> {
    return this.http.put<PostResponse>(
      `/api/posts/${postId}`,
      this.postData(post, files, removedPictureIds),
    );
  }

  private postData(
    post: PostRequest,
    files: readonly File[],
    removedPictureIds: readonly string[] = [],
  ): FormData {
    const data = new FormData();
    data.append('post', new Blob([JSON.stringify(post)], { type: 'application/json' }));
    files.forEach((file) => data.append('files', file));
    data.append(
      'removedPictureIds',
      new Blob([JSON.stringify(removedPictureIds)], { type: 'application/json' }),
    );
    return data;
  }

  changePublication(postId: string, published: boolean): Observable<PostResponse> {
    return this.http.put<PostResponse>(`/api/posts/${postId}/publication`, { published });
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`/api/posts/${postId}`);
  }
}
