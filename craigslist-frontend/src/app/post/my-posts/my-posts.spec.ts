import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { afterEach, expect, it, vi } from 'vitest';
import { MyPosts } from './my-posts';
import { PostService } from '../post.service';
import { PostResponse } from '../models/post-response';

afterEach(() => TestBed.resetTestingModule());
const post = {
  id: 'post',
  title: 'Original post',
  status: 'PUBLISHED',
  createdAt: '2026-10-01T00:00:00Z',
} as PostResponse;
function setup(status = 'PUBLISHED') {
  const service = { getMyPosts: vi.fn().mockReturnValue(of([post])), changePublication: vi.fn() };
  const params = convertToParamMap({ status });
  const queryParams = new BehaviorSubject(params);
  TestBed.configureTestingModule({
    imports: [MyPosts],
    providers: [
      provideRouter([]),
      { provide: PostService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: params }, queryParamMap: queryParams },
      },
    ],
  });
  const fixture = TestBed.createComponent(MyPosts);
  fixture.componentInstance.ngOnInit();
  return { component: fixture.componentInstance, service, queryParams };
}
it('clears publication feedback when switching sections in either direction', () => {
  const { component, queryParams } = setup();
  for (const status of ['UNPUBLISHED', 'PUBLISHED']) {
    component['statusMessage'].set('Post published.');
    component['publicationError'].set('Previous error');
    queryParams.next(convertToParamMap({ status }));
    expect(component['statusMessage']()).toBe('');
    expect(component['publicationError']()).toBe('');
    expect(component['selectedStatus']()).toBe(status);
  }
});
it('moves a post between lists after the server confirms and preserves its date', () => {
  const { component, service } = setup();
  const response = new Subject<PostResponse>();
  service.changePublication.mockReturnValue(response);
  component['changePublication'](post);
  expect(service.changePublication).toHaveBeenCalledWith('post', false);
  expect(component['publishedPosts']()).toHaveLength(1);
  response.next({ ...post, status: 'UNPUBLISHED' });
  response.complete();
  expect(component['publishedPosts']()).toHaveLength(0);
  expect(component['unpublishedPosts']()[0].createdAt).toBe(post.createdAt);
  expect(component['statusMessage']()).toContain('Post unpublished');
});
it('retains the post when publication fails and allows retry', () => {
  const { component, service } = setup();
  service.changePublication.mockReturnValue(throwError(() => new Error('offline')));
  component['changePublication'](post);
  expect(component['publishedPosts']()).toHaveLength(1);
  expect(component['publicationError']()).toContain('try again');
  expect(component['changingPublication']()).toBeNull();
});
it('opens the requested unpublished section and publishes back to the public list', () => {
  const { component, service } = setup('UNPUBLISHED');
  const unpublished = { ...post, status: 'UNPUBLISHED' } as PostResponse;
  component['posts'].set([unpublished]);
  expect(component['visiblePosts']()).toHaveLength(1);
  service.changePublication.mockReturnValue(of(post));
  component['changePublication'](unpublished);
  expect(service.changePublication).toHaveBeenCalledWith('post', true);
  expect(component['unpublishedPosts']()).toHaveLength(0);
  expect(component['publishedPosts']()).toHaveLength(1);
});
