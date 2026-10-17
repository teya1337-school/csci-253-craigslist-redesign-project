import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-link',
  imports: [RouterLink],
  template: `
    @if (userId() && username() !== '[deleted]') {
      <a [routerLink]="['/users', userId()]" [attr.aria-label]="'View profile of ' + username()">{{
        username()
      }}</a>
    } @else {
      <span>{{ username() }}</span>
    }
  `,
  styles: `
    :host {
      color: #59316d;
      font-weight: 700;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    a:focus-visible {
      outline: 3px solid #8c5dad;
      outline-offset: 3px;
    }
  `,
})
export class UserLink {
  readonly userId = input.required<string | null>();
  readonly username = input.required<string>();
}
