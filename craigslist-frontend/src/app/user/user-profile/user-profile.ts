import { AuthService } from '../../auth/auth.service';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, combineLatest, of, startWith, Subject, switchMap } from 'rxjs';
import { PostResponse } from '../../post/models/post-response';
import { EditedIndicator } from '../../shared/edited-indicator/edited-indicator';

interface PublicProfile {
  id: string;
  username: string;
  memberSince: string;
  posts: PostResponse[];
}

@Component({
  selector: 'app-user-profile',
  imports: [DatePipe, RouterLink, EditedIndicator],
  templateUrl: './user-profile.html',
  styleUrls: ['../../community/general/general.scss', './user-profile.scss'],
})
export class UserProfile implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();
  protected readonly profile = signal<PublicProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.reload.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          this.profile.set(null);
          this.isLoading.set(true);
          this.errorMessage.set(null);
          return this.http
            .get<PublicProfile>(
              `/api/users/${encodeURIComponent(params.get('userId') ?? '')}/profile`,
            )
            .pipe(
              catchError((error: HttpErrorResponse) => {
                this.errorMessage.set(
                  error.status === 404
                    ? 'This user profile could not be found.'
                    : 'We could not load this profile. Please try again.',
                );
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
        this.title.setTitle(
          profile
            ? `${profile.username} | ListNova`
            : 'Profile unavailable | ListNova',
        );
      });
  }

  protected retry(): void {
    this.reload.next();
  }
}
