import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { CreatePost } from './create-post/create-post';
import { EditPost } from './edit-post/edit-post';
import { postCategories, postDestinations } from './post-destinations';
import { PostService } from './post.service';
import { routes } from '../app.routes';

afterEach(() => TestBed.resetTestingModule());
it('exposes six categories with distinct routable destinations', () => {
  expect(postCategories).toHaveLength(6);
  expect(postDestinations).toHaveLength(13);
  expect(new Set(postDestinations.map((item) => item.path)).size).toBe(13);
  for (const category of postCategories) {
    const expectedTypeCount = category.category === 'COMMUNITY' ? 3 : 2;
    const destinations = postDestinations.filter((item) => item.category === category.category);
    expect(destinations).toHaveLength(expectedTypeCount);
    const typeLabels = destinations.map((item) => item.typeLabel);
    expect(typeLabels).toEqual([...typeLabels].sort());
    expect(routes.some((route) => route.path === category.path.slice(1))).toBe(true);
  }
});
it.each(postDestinations)(
  'creates a post in $categoryLabel / $typeLabel without a destination picker',
  (destination) => {
    const service = { createPost: vi.fn().mockReturnValue(of({ id: 'new' })) };
    TestBed.configureTestingModule({
      imports: [CreatePost],
      providers: [
        provideRouter([]),
        { provide: PostService, useValue: service },
        { provide: AuthService, useValue: { currentUser: signal({ id: 'owner' }) } },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { destination } } } },
      ],
    });
    const component = TestBed.createComponent(CreatePost).componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component['postForm'].setValue({
      title: 'Title',
      body: 'Body',
      location: '',
      advertisement: destination.category === 'SERVICES',
    });
    component['submit']();
    expect(component['fromMyPosts']).toBe(false);
    expect(service.createPost).toHaveBeenCalledWith(
      {
        title: 'Title',
        body: 'Body',
        location: null,
        advertisement: destination.category === 'SERVICES',
        category: destination.category,
        postType: destination.postType,
      },
      [],
    );
    expect(navigate).toHaveBeenCalledWith([destination.path], { queryParams: { created: 'true' } });
  },
);
it.each(postDestinations)(
  'editing retains $categoryLabel / $typeLabel and publication status',
  (destination) => {
    const service = {
      getPost: vi.fn().mockReturnValue(
        of({
          ...destination,
          userId: 'owner',
          title: 'Title',
          body: 'Body',
          status: 'UNPUBLISHED',
          location: null,
          advertisement: destination.category === 'SERVICES',
        }),
      ),
      updatePost: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [EditPost],
      providers: [
        provideRouter([]),
        { provide: PostService, useValue: service },
        { provide: AuthService, useValue: { currentUser: signal({ id: 'owner' }) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ postId: 'post' }),
              queryParamMap: convertToParamMap({ returnTo: 'my-posts' }),
            },
          },
        },
      ],
    });
    const component = TestBed.createComponent(EditPost).componentInstance;
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.ngOnInit();
    component['postForm'].controls.title.setValue('Changed');
    component['submit']();
    expect(service.updatePost).toHaveBeenCalledWith(
      'post',
      {
        title: 'Changed',
        body: 'Body',
        location: null,
        advertisement: destination.category === 'SERVICES',
        category: destination.category,
        postType: destination.postType,
      },
      [],
      [],
    );
    expect(component['publicationStatus']()).toBe('UNPUBLISHED');
  },
);
