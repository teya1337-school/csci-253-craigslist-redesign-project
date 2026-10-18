import { postCategories } from '../post/post-destinations';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  // Get the post categories from the post-destinations.ts file and make them available to the template.
  protected readonly categories = postCategories;

  // Get the accountDeleted query parameter from the URL and make it available to the template.
  protected readonly accountDeleted =
    inject(ActivatedRoute).snapshot.queryParamMap.get('accountDeleted') === 'true';
}
