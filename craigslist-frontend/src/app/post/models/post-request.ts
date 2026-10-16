export interface PostRequest {
  title: string;
  body: string;
  category: 'COMMUNITY';
  postType: 'GENERAL';
  location: string | null;
}
