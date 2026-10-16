import { UserProfile } from './user/user-profile/user-profile';
import { MyPosts } from './post/my-posts/my-posts';
import { Routes } from '@angular/router';
import { Account } from './account/account';
import { authGuard } from './auth/auth.guard';
import { Login } from './auth/login/login';
import { Community } from './community/community';
import { General } from './community/general/general';
import { Home } from './home/home';
import { CreatePost } from './post/create-post/create-post';
import { EditPost } from './post/edit-post/edit-post';
import { PostDetail } from './post/post-detail/post-detail';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home | Fresno Exchange' },
  { path: 'community', component: Community, title: 'Community | Fresno Exchange' },
  {
    path: 'community/general',
    component: General,
    title: 'General Community | Fresno Exchange',
  },
  {
    path: 'community/general/new',
    component: CreatePost,
    canActivate: [authGuard],
    title: 'Create Post | Fresno Exchange',
  },
  {
    path: 'posts/new',
    component: CreatePost,
    canActivate: [authGuard],
    data: { chooseDestination: true },
    title: 'Create Post | Fresno Exchange',
  },
  {
    path: 'posts/:postId/edit',
    component: EditPost,
    canActivate: [authGuard],
    title: 'Edit Post | Fresno Exchange',
  },
  { path: 'posts/:postId', component: PostDetail, title: 'Post | Fresno Exchange' },
  { path: 'browse', redirectTo: '', pathMatch: 'full' },
  { path: 'browse/community', redirectTo: 'community', pathMatch: 'full' },
  { path: 'browse/community/general', redirectTo: 'community/general', pathMatch: 'full' },
  {
    path: 'my-posts',
    component: MyPosts,
    canActivate: [authGuard],
    title: 'My Posts | Fresno Exchange',
  },
  { path: 'users/:userId', component: UserProfile, title: 'User profile | Fresno Exchange' },
  { path: 'login', component: Login, title: 'Sign in | Fresno Exchange' },
  {
    path: 'account',
    component: Account,
    canActivate: [authGuard],
    title: 'Account | Fresno Exchange',
  },
  { path: '**', redirectTo: '' },
];
