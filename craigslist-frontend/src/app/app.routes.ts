import { postCategories, postDestinations } from './post/post-destinations';
import { Inbox } from './message/inbox/inbox';
import { MessageDetail } from './message/message-detail/message-detail';
import { ComposeMessage } from './message/compose-message/compose-message';
import { UserProfile } from './user/user-profile/user-profile';
import { MyPosts } from './post/my-posts/my-posts';
import { Routes } from '@angular/router';
import { Account } from './account/account';
import { authGuard } from './auth/auth.guard';
import { Signup } from './auth/signup/signup';
import { Login } from './auth/login/login';
import { CategoryDirectory } from './browse/category-directory/category-directory';
import { PostListing } from './browse/post-listing/post-listing';
import { Home } from './home/home';
import { CreatePost } from './post/create-post/create-post';
import { EditPost } from './post/edit-post/edit-post';
import { PostDetail } from './post/post-detail/post-detail';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home | ListNova' },
  ...postCategories.map((category) => ({
    path: category.path.slice(1),
    component: CategoryDirectory,
    data: { category },
    title: `${category.label} | ListNova`,
  })),
  ...postDestinations.flatMap((destination) => [
    {
      path: destination.path.slice(1),
      component: PostListing,
      data: { destination },
      title: `${destination.typeLabel} | ${destination.categoryLabel} | ListNova`,
    },
    {
      path: `${destination.path.slice(1)}/new`,
      component: CreatePost,
      canActivate: [authGuard],
      data: { destination },
      title: 'Create Post | ListNova',
    },
  ]),
  {
    path: 'posts/new',
    component: CreatePost,
    canActivate: [authGuard],
    data: { chooseDestination: true },
    title: 'Create Post | ListNova',
  },
  {
    path: 'posts/:postId/edit',
    component: EditPost,
    canActivate: [authGuard],
    title: 'Edit Post | ListNova',
  },
  { path: 'posts/:postId', component: PostDetail, title: 'Post | ListNova' },
  { path: 'browse', redirectTo: '', pathMatch: 'full' },
  { path: 'browse/community', redirectTo: 'community', pathMatch: 'full' },
  { path: 'browse/community/general', redirectTo: 'community/general', pathMatch: 'full' },
  {
    path: 'my-posts',
    component: MyPosts,
    canActivate: [authGuard],
    title: 'My Posts | ListNova',
  },
  { path: 'users/:userId', component: UserProfile, title: 'User profile | ListNova' },
  {
    path: 'inbox',
    component: Inbox,
    canActivate: [authGuard],
    title: 'Messages | ListNova',
  },
  {
    path: 'inbox/received/:messageId',
    component: MessageDetail,
    canActivate: [authGuard],
    data: { mailbox: 'INBOX' },
    title: 'Message | ListNova',
  },
  {
    path: 'inbox/sent/:messageId',
    component: MessageDetail,
    canActivate: [authGuard],
    data: { mailbox: 'SENT' },
    title: 'Sent message | ListNova',
  },
  {
    path: 'messages/new',
    component: ComposeMessage,
    canActivate: [authGuard],
    title: 'New message | ListNova',
  },
  { path: 'signup', component: Signup, title: 'Create account | ListNova' },
  { path: 'login', component: Login, title: 'Sign in | ListNova' },
  {
    path: 'account',
    component: Account,
    canActivate: [authGuard],
    title: 'Account settings | ListNova',
  },
  { path: '**', redirectTo: '' },
];
