export interface CommentResponse {
  id: string;
  userId: string | null;
  username: string;
  postId: string;
  content: string;
  parentId: string | null;
  deleted: boolean;
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
}
