export interface PostResponse {
  id: string;
  userId: string;
  username: string;
  title: string;
  body: string;
  category: 'COMMUNITY';
  postType: 'GENERAL';
  location: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDE' | 'DELETED';
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
}
