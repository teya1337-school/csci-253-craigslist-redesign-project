import { PostCategory, PostType } from './models/post-request';

export interface PostCategoryOption {
  category: PostCategory;
  label: string;
  path: string;
  description: string;
  iconPath: string;
}
export interface PostDestination {
  category: PostCategory;
  categoryLabel: string;
  categoryPath: string;
  postType: PostType;
  typeLabel: string;
  path: string;
  description: string;
}

export const postCategories: readonly PostCategoryOption[] = [
  {
    category: 'COMMUNITY',
    label: 'Community',
    path: '/community',
    description: 'Local conversations, events, clubs, and shared-interest groups.',
    iconPath: 'M4 5h24v18H14l-7 5v-5H4Z M9 11h14M9 16h9',
  },
  {
    category: 'SERVICES',
    label: 'Services',
    path: '/services',
    description: 'Find or offer computer and automotive services.',
    iconPath: 'M20 4a8 8 0 0 0-9 10L3 23l6 6 9-9A8 8 0 0 0 28 11l-6 5-6-6Z',
  },
  {
    category: 'FOR_SALE',
    label: 'For Sale',
    path: '/for-sale',
    description: 'Buy and sell electronics and furniture nearby.',
    iconPath: 'M4 4h12l12 12-12 12L4 16Z M10 10h.1',
  },
  {
    category: 'HOUSING',
    label: 'Housing',
    path: '/housing',
    description: 'Explore local apartments and rooms.',
    iconPath: 'M3 15 16 4l13 11M7 12v16h18V12M12 28V18h8v10',
  },
  {
    category: 'JOBS',
    label: 'Jobs',
    path: '/jobs',
    description: 'Find customer service and general labor positions.',
    iconPath: 'M4 10h24v18H4ZM11 10V4h10v6M4 17h24M14 17v4h4v-4',
  },
  {
    category: 'GIGS',
    label: 'Gigs',
    path: '/gigs',
    description: 'Find short-term computer and creative work.',
    iconPath: 'M19 3 6 18h9l-2 11 13-16h-9Z',
  },
];

const types: readonly [PostCategory, PostType, string, string, string][] = [
  ['COMMUNITY', 'EVENTS', 'Events', 'events', 'Share local events, gatherings, and activities.'],
  [
    'COMMUNITY',
    'GENERAL',
    'General',
    'general',
    'Everyday local conversations, questions, and shared information.',
  ],
  [
    'COMMUNITY',
    'GROUPS',
    'Groups',
    'groups',
    'Find or organize local clubs, meetups, and shared-interest groups.',
  ],
  [
    'SERVICES',
    'AUTOMOTIVE',
    'Automotive',
    'automotive',
    'Find or offer vehicle maintenance and repair services.',
  ],
  [
    'SERVICES',
    'COMPUTER',
    'Computer',
    'computer',
    'Find or offer computer repairs, setup, and technical help.',
  ],
  [
    'FOR_SALE',
    'ELECTRONICS',
    'Electronics',
    'electronics',
    'Buy and sell electronics in your area.',
  ],
  [
    'FOR_SALE',
    'FURNITURE',
    'Furniture',
    'furniture',
    'Buy and sell furniture for your home or workspace.',
  ],
  ['HOUSING', 'APARTMENTS', 'Apartments', 'apartments', 'Find or offer apartments for rent.'],
  ['HOUSING', 'ROOMS', 'Rooms', 'rooms', 'Find or offer rooms and shared housing.'],
  [
    'JOBS',
    'CUSTOMER_SERVICE',
    'Customer Service',
    'customer-service',
    'Explore local customer service positions.',
  ],
  [
    'JOBS',
    'GENERAL_LABOR',
    'General Labor',
    'general-labor',
    'Explore local general labor positions.',
  ],
  [
    'GIGS',
    'COMPUTER',
    'Computer',
    'computer',
    'Find or offer short-term computer and technical work.',
  ],
  ['GIGS', 'CREATIVE', 'Creative', 'creative', 'Find or offer short-term creative projects.'],
];

export const postDestinations: readonly PostDestination[] = types.map(
  ([category, postType, typeLabel, slug, description]) => {
    const parent = postCategories.find((option) => option.category === category)!;
    return {
      category,
      postType,
      typeLabel,
      description,
      categoryLabel: parent.label,
      categoryPath: parent.path,
      path: `${parent.path}/${slug}`,
    };
  },
);

export function findPostDestination(post: {
  category: string;
  postType: string;
}): PostDestination | undefined {
  return postDestinations.find(
    (option) => option.category === post.category && option.postType === post.postType,
  );
}
