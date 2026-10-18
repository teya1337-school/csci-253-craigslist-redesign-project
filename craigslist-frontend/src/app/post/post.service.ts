import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { PostCategory, PostType, PostRequest } from './models/post-request';
import { PostResponse } from './models/post-response';

@Service()
export class PostService {
  private readonly http = inject(HttpClient);

  // This method retrieves posts based on the specified category and post type.
  getPosts(category: PostCategory, postType: PostType): Observable<PostResponse[]> {
    const params = new HttpParams()
      .set('category', category)
      .set('postType', postType);

    return this.http.get<PostResponse[]>('/api/posts', { params });
  }

  // This method searches for posts based on a search string and returns an observable containing the matching posts and the total count.
  searchPosts(search: string): Observable<{ posts: PostResponse[]; total: number }> {
    return this.http.get<{ posts: PostResponse[]; total: number }>('/api/posts/search', {
      params: { search },
    });
  }

  // This method retrieves the current user's posts.
  getMyPosts(): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>('/api/posts/mine');
  }

  // This method retrieves a specific post by its ID.
  getPost(postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`/api/posts/${postId}`);
  }

  // This method creates a new post with the provided post data and any associated files.
  createPost(post: PostRequest, files: readonly File[] = []): Observable<PostResponse> {
    return this.http.post<PostResponse>('/api/posts', this.postData(post, files));
  }

  // This method updates an existing post by its ID, including the post data, any new files, and any removed picture IDs.
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

  // This method prepares the FormData for creating or updating a post, including the post data, files, and any removed picture IDs.
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

  // This method changes the publication status of a post.
  changePublication(postId: string, published: boolean): Observable<PostResponse> {
    return this.http.put<PostResponse>(`/api/posts/${postId}/publication`, { published });
  }

  // This method deletes a post by its ID.
  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`/api/posts/${postId}`);
  }
}
