import { UserLink } from '../../shared/user-link/user-link';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';
import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { PostResponse } from '../../post/models/post-response';
import { PostService } from '../../post/post.service';

@Component({
  selector: 'app-general',
  imports: [UserLink, EditedIndicator, DatePipe, RouterLink],
  templateUrl: './general.html',
  styleUrl: './general.scss',
})
export class General implements OnInit {
  private readonly postService = inject(PostService);
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);

  protected readonly posts = signal<PostResponse[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly postCreated = signal(false);
  protected readonly postDeleted = signal(false);

  ngOnInit(): void {
    this.postCreated.set(this.route.snapshot.queryParamMap.get('created') === 'true');
    this.postDeleted.set(this.route.snapshot.queryParamMap.get('deleted') === 'true');
    this.loadPosts();
  }

  protected loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.postService
      .getGeneralPosts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (posts) => this.posts.set(posts),
        error: () => this.errorMessage.set('We could not load the discussions. Please try again.'),
      });
  }
}
