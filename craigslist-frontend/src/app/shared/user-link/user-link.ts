import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-link',
  imports: [RouterLink],
  templateUrl: './user-link.html',
  styleUrl: './user-link.scss',
})
export class UserLink {
  // Receive the user information used to build the profile link.
  readonly userId = input.required<string | null>();
  readonly username = input.required<string>();
}
