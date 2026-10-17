import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostSearch } from './post-search';

describe('PostSearch', () => {
  let component: PostSearch;
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<PostSearch>>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    TestBed.configureTestingModule({
      imports: [PostSearch],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(PostSearch);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    http.verify();
    vi.useRealTimers();
  });

  it('waits for a pause, trims the query, and ignores equivalent input', () => {
    component['search'].setValue('we');
    vi.advanceTimersByTime(200);
    component['search'].setValue(' weekend ');
    vi.advanceTimersByTime(299);
    http.expectNone((request) => request.url === '/api/posts/search');
    vi.advanceTimersByTime(1);
    const request = http.expectOne('/api/posts/search?search=weekend');
    request.flush({ posts: [], total: 0 });
    component['search'].setValue('weekend');
    vi.advanceTimersByTime(500);
    http.expectNone((request) => request.url === '/api/posts/search');
    expect(component['state']().status).toBe('success');
  });

  it('cancels obsolete requests immediately and searches the new query', () => {
    component['search'].setValue('weekend');
    vi.advanceTimersByTime(300);
    const old = http.expectOne('/api/posts/search?search=weekend');
    component['search'].setValue('anime');
    expect(old.cancelled).toBe(true);
    expect(component['state']().posts).toEqual([]);
    vi.advanceTimersByTime(300);
    http.expectOne('/api/posts/search?search=anime').flush({ posts: [], total: 0 });
    expect(component['state']().query).toBe('anime');
  });

  it('clears immediately and sends no short or empty queries', () => {
    component['search'].setValue('weekend');
    vi.advanceTimersByTime(300);
    const old = http.expectOne('/api/posts/search?search=weekend');
    component['clear']();
    expect(old.cancelled).toBe(true);
    expect(component['state']().status).toBe('idle');
    component['search'].setValue('a');
    vi.advanceTimersByTime(300);
    http.expectNone((request) => request.url === '/api/posts/search');
  });

  it('recovers after a failed request and can retry the same query', () => {
    component['search'].setValue('weekend');
    vi.advanceTimersByTime(300);
    http
      .expectOne('/api/posts/search?search=weekend')
      .flush('Unavailable', { status: 503, statusText: 'Unavailable' });
    expect(component['state']().status).toBe('error');
    component['retrySearch']();
    vi.advanceTimersByTime(300);
    http.expectOne('/api/posts/search?search=weekend').flush({ posts: [], total: 0 });
    expect(component['state']().status).toBe('success');
    component['search'].setValue('anime');
    vi.advanceTimersByTime(300);
    http.expectOne('/api/posts/search?search=anime').flush({ posts: [], total: 0 });
    expect(component['state']().query).toBe('anime');
  });

  it('cancels in-flight work when leaving the page', () => {
    component['search'].setValue('weekend');
    vi.advanceTimersByTime(300);
    const pending = http.expectOne('/api/posts/search?search=weekend');
    fixture.destroy();
    expect(pending.cancelled).toBe(true);
  });

  it('supports arrow navigation and Enter to open a suggestion', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component['search'].setValue('weekend');
    vi.advanceTimersByTime(300);
    http.expectOne('/api/posts/search?search=weekend').flush({
      posts: [
        { id: 'first', title: 'First post', username: 'bob', createdAt: '2026-10-01T00:00:00Z' },
        {
          id: 'second',
          title: 'Second post',
          username: 'alice',
          createdAt: '2026-10-01T00:00:00Z',
        },
      ],
      total: 2,
    });
    component['handleKeydown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component['activeIndex']()).toBe(0);
    component['handleKeydown'](new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component['activeIndex']()).toBe(1);
    component['handleKeydown'](new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(navigate).toHaveBeenCalledWith(['/posts', 'second']);
    expect(component['dropdownVisible']()).toBe(false);
  });

  it('does not navigate when selecting the current post, even with a query or fragment', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'isActive').mockImplementation((url, options) => {
      expect(router.serializeUrl(url as ReturnType<Router['createUrlTree']>)).toBe(
        '/posts/current',
      );
      expect(options).toEqual({
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      });
      return true;
    });
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    document.body.appendChild(fixture.nativeElement);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    component['search'].setValue('event');
    vi.advanceTimersByTime(300);
    const pending = http.expectOne('/api/posts/search?search=event');
    component['choose']({ id: 'current' } as Parameters<PostSearch['choose']>[0]);
    expect(navigate).not.toHaveBeenCalled();
    expect(component['dropdownVisible']()).toBe(false);
    expect(component['search'].value).toBe('');
    expect(document.activeElement).not.toBe(input);
    expect(pending.cancelled).toBe(true);
  });

  it('clears the query and cancels pending results after successful navigation', async () => {
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: 'next', component: PostSearch }]);
    document.body.appendChild(fixture.nativeElement);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);
    component['search'].setValue('event');
    vi.advanceTimersByTime(300);
    const pending = http.expectOne('/api/posts/search?search=event');
    await router.navigateByUrl('/next');
    expect(document.activeElement).not.toBe(input);
    expect(component['search'].value).toBe('');
    expect(component['dropdownVisible']()).toBe(false);
    expect(component['state']().posts).toEqual([]);
    expect(pending.cancelled).toBe(true);
    vi.advanceTimersByTime(300);
    http.expectNone((request) => request.url === '/api/posts/search');
  });

  it('keeps Escape-dismissed results closed when a request finishes and reopens on focus', () => {
    component['search'].setValue('weekend');
    vi.advanceTimersByTime(300);
    const request = http.expectOne('/api/posts/search?search=weekend');
    component['handleKeydown'](new KeyboardEvent('keydown', { key: 'Escape' }));
    request.flush({ posts: [], total: 0 });
    expect(component['dropdownVisible']()).toBe(false);
    expect(component['search'].value).toBe('weekend');
    component['open']();
    expect(component['dropdownVisible']()).toBe(true);
  });

  it('closes on outside clicks or focus leaving the component', () => {
    component['search'].setValue('weekend');
    expect(component['dropdownVisible']()).toBe(true);
    fixture.nativeElement.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(component['dropdownVisible']()).toBe(true);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(component['dropdownVisible']()).toBe(false);
    component['open']();
    component['handleFocusOut'](new FocusEvent('focusout', { relatedTarget: document.body }));
    expect(component['dropdownVisible']()).toBe(false);
  });
});
