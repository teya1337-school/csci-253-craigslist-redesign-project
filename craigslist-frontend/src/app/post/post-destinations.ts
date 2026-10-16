import { PostRequest } from './models/post-request';

export interface PostDestination {
  category: PostRequest['category'];
  categoryLabel: string;
  postType: PostRequest['postType'];
  typeLabel: string;
  path: string;
}

// Add destinations here as their category and type become available.
export const postDestinations: readonly PostDestination[] = [
  {
    category: 'COMMUNITY',
    categoryLabel: 'Community',
    postType: 'GENERAL',
    typeLabel: 'General',
    path: '/community/general',
  },
];
