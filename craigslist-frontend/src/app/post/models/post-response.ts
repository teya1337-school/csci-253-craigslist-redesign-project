import { PostCategory, PostType } from './post-request';

export interface PostResponse {
  id: string;
  userId: string;
  username: string;
  title: string;
  body: string;
  category: PostCategory;
  postType: PostType;
  location: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED';
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
}
