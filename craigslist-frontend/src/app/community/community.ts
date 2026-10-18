import { postDestinations, PostCategoryOption } from '../post/post-destinations';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-community',
  imports: [RouterLink],
  templateUrl: './community.html',
  styleUrl: './community.scss',
})
export class Community {
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });
  protected readonly category = computed(() => this.routeData()['category'] as PostCategoryOption);
  protected readonly destinations = computed(() =>
    postDestinations.filter((option) => option.category === this.category().category),
  );
}
