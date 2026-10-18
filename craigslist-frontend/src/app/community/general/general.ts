import { AdBadge } from '../../shared/ad-badge';
import { UserLink } from '../../shared/user-link/user-link';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PostDestination, postDestinations } from '../../post/post-destinations';
import { AuthService } from '../../auth/auth.service';
import { PostResponse } from '../../post/models/post-response';
import { PostService } from '../../post/post.service';

@Component({
  selector: 'app-general',
  imports: [AdBadge, UserLink, EditedIndicator, DatePipe, RouterLink],
  templateUrl: './general.html',
  styleUrl: './general.scss',
})
export class General implements OnInit {
  private readonly postService = inject(PostService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private postRequest?: Subscription;
  protected readonly destination = signal<PostDestination>(postDestinations[0]);
  protected readonly authService = inject(AuthService);

  protected readonly posts = signal<PostResponse[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly postCreated = signal(false);
  protected readonly postDeleted = signal(false);

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.destination.set(data['destination']);
      this.postCreated.set(this.route.snapshot.queryParamMap.get('created') === 'true');
      this.postDeleted.set(this.route.snapshot.queryParamMap.get('deleted') === 'true');
      this.loadPosts();
    });
  }

  protected loadPosts(): void {
    this.postRequest?.unsubscribe();
    this.posts.set([]);
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.postRequest = this.postService
      .getPosts(this.destination().category, this.destination().postType)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (posts) => this.posts.set(posts),
        error: () => this.errorMessage.set('We could not load the posts. Please try again.'),
      });
  }
}
