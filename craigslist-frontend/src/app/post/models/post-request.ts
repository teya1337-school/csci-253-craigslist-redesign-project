export type PostCategory = 'COMMUNITY' | 'SERVICES' | 'FOR_SALE' | 'HOUSING' | 'JOBS' | 'GIGS';
export type PostType =
  | 'GENERAL'
  | 'EVENTS'
  | 'COMPUTER'
  | 'AUTOMOTIVE'
  | 'ELECTRONICS'
  | 'FURNITURE'
  | 'APARTMENTS'
  | 'ROOMS'
  | 'CUSTOMER_SERVICE'
  | 'GENERAL_LABOR'
  | 'CREATIVE';

export interface PostRequest {
  title: string;
  body: string;
  category: PostCategory;
  postType: PostType;
  location: string | null;
  advertisement: boolean;
}
