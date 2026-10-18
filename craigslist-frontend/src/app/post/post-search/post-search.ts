import { AdBadge } from '../../shared/ad-badge';
import { findPostDestination } from '../post-destinations';
import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  HostListener,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  share,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { PostResponse } from '../models/post-response';
import { PostService } from '../post.service';

interface SearchState {
  status: 'idle' | 'waiting' | 'loading' | 'success' | 'error';
  query: string;
  posts: PostResponse[];
  total: number;
}

@Component({
  selector: 'app-post-search',
  imports: [AdBadge, ReactiveFormsModule, DatePipe],
  templateUrl: './post-search.html',
  styleUrl: './post-search.scss',
})
export class PostSearch implements OnInit {
  protected readonly destinationFor = findPostDestination;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly suggestions = computed(() => this.state().posts.slice(0, 8));
  protected readonly dropdownVisible = computed(
    () => this.isOpen() && this.state().status !== 'idle',
  );
  private readonly service = inject(PostService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retry = new Subject<void>();
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly state = signal<SearchState>({
    status: 'idle',
    query: '',
    posts: [],
    total: 0,
  });

  ngOnInit(): void {
    const queries = merge(
      this.search.valueChanges.pipe(
        startWith(''),
        map((value) => value.trim()),
        distinctUntilChanged(),
      ),
      this.retry.pipe(map(() => this.search.value.trim())),
    ).pipe(share());

    queries
      .pipe(
        tap((query) => {
          this.activeIndex.set(-1);
          this.isOpen.set(query.length >= 2);
          this.state.set({
            status: query.length >= 2 ? 'waiting' : 'idle',
            query,
            posts: [],
            total: 0,
          });
        }),
        debounceTime(300),
        switchMap((query) => {
          if (query.length < 2)
            return of<SearchState>({ status: 'idle', query, posts: [], total: 0 });
          return this.service.searchPosts(query).pipe(
            map((result) => ({ status: 'success', query, ...result }) as SearchState),
            catchError(() => of<SearchState>({ status: 'error', query, posts: [], total: 0 })),
            // Cancel on the next normalized keystroke, even before its debounce finishes.
            takeUntil(queries),
            startWith<SearchState>({ status: 'loading', query, posts: [], total: 0 }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.state.set(state));

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.resetSearch());
  }

  private resetSearch(): void {
    this.search.setValue('');
    this.close();
    const focused = this.element.nativeElement.ownerDocument.activeElement;
    if (focused instanceof HTMLElement && this.element.nativeElement.contains(focused)) {
      focused.blur();
    }
  }

  protected clear(): void {
    this.search.setValue('');
    this.searchInput()?.nativeElement.focus();
  }
  protected retrySearch(): void {
    this.retry.next();
  }
  protected open(): void {
    this.isOpen.set(this.search.value.trim().length >= 2);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeOutside(event: PointerEvent): void {
    if (!this.element.nativeElement.contains(event.target as Node)) this.close();
  }

  protected handleFocusOut(event: FocusEvent): void {
    if (!this.element.nativeElement.contains(event.relatedTarget as Node | null)) this.close();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    const posts = this.suggestions();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (posts.length === 0) return;
      event.preventDefault();
      this.isOpen.set(true);
      const index = this.activeIndex();
      this.activeIndex.set(
        index < 0
          ? event.key === 'ArrowDown'
            ? 0
            : posts.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + posts.length) % posts.length,
      );
      setTimeout(() =>
        this.element.nativeElement
          .querySelector<HTMLElement>('.suggestion.active')
          ?.scrollIntoView({ block: 'nearest' }),
      );
    } else if (event.key === 'Enter' && this.dropdownVisible() && posts.length > 0) {
      event.preventDefault();
      this.choose(posts[this.activeIndex() < 0 ? 0 : this.activeIndex()]);
    }
  }

  protected choose(post: PostResponse): void {
    this.close();
    if (
      this.router.isActive(this.router.createUrlTree(['/posts', post.id]), {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      })
    ) {
      this.resetSearch();
      return;
    }
    void this.router.navigate(['/posts', post.id]);
  }
}
