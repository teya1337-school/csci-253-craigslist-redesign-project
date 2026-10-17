import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { afterEach, expect, it } from 'vitest';
import { PostDetail } from './post-detail';

afterEach(() => TestBed.resetTestingModule());
it('reloads a reused post page and cancels stale requests', () => {
  const params = new BehaviorSubject(convertToParamMap({ postId: 'anime' }));
  const route = {
    paramMap: params.asObservable(),
    snapshot: { paramMap: params.value, queryParamMap: convertToParamMap({}) },
  };
  TestBed.configureTestingModule({
    imports: [PostDetail],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
    ],
  });
  const fixture = TestBed.createComponent(PostDetail);
  const http = TestBed.inject(HttpTestingController);
  fixture.componentInstance.ngOnInit();
  const anime = http.expectOne('/api/posts/anime');
  route.snapshot.paramMap = convertToParamMap({ postId: 'events' });
  params.next(route.snapshot.paramMap);
  expect(anime.cancelled).toBe(true);
  http.expectOne('/api/posts/events').flush({ id: 'events', title: 'Weekend events' });
  expect(fixture.componentInstance['post']()?.id).toBe('events');
  expect(fixture.componentInstance['isLoading']()).toBe(false);
  fixture.destroy();
  http.verify();
});
