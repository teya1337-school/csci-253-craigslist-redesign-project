import { postDestinations, PostCategoryOption } from '../../post/post-destinations';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-category-directory',
  imports: [RouterLink],
  templateUrl: './category-directory.html',
  styleUrl: './category-directory.scss',
})
export class CategoryDirectory {
  private readonly route = inject(ActivatedRoute);

  // Convert the route data observable to a signal for reactive access.
  private readonly routeData = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data,
  });

  // Get the category from the route data and cast it to PostCategoryOption.
  protected readonly category = computed(() => this.routeData()['category'] as PostCategoryOption);

  // Filter the postDestinations based on the category from the route data.
  protected readonly destinations = computed(() =>
    postDestinations.filter((option) => option.category === this.category().category),
  );
}
