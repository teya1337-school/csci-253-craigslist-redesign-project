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
  protected readonly categories = postCategories;
  protected readonly accountDeleted =
    inject(ActivatedRoute).snapshot.queryParamMap.get('accountDeleted') === 'true';
}
