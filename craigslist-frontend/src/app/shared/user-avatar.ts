import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.scss',
})
export class UserAvatar {
  // Receive the user and picture version from the parent component.
  readonly userId = input.required<string>();
  readonly version = input<string | null>(null);

  // Remember a failed picture version so the fallback avatar can be shown.
  protected readonly failedVersion = signal<string | null>(null);
}
