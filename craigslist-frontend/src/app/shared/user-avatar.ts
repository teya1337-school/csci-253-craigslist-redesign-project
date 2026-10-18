import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-user-avatar',
  template: `@if (version() && failedVersion() !== version()) {
      <img
        [src]="'/api/users/' + userId() + '/picture?version=' + version()"
        alt=""
        draggable="false"
        (error)="failedVersion.set(version())"
      />
    } @else {
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20c.6-4.1 3.2-6.2 7.5-6.2s6.9 2.1 7.5 6.2" />
      </svg>
    }`,
  styles: `
    :host {
      display: grid;
      place-items: center;
      width: var(--avatar-size, 40px);
      height: var(--avatar-size, 40px);
      flex-shrink: 0;
      border-radius: 50%;
      background: #e8f0fa;
      color: #2457a7;
      overflow: hidden;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    svg {
      width: 60%;
      height: 60%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.6;
    }
  `,
})
export class UserAvatar {
  readonly userId = input.required<string>();
  readonly version = input<string | null>(null);
  protected readonly failedVersion = signal<string | null>(null);
}
