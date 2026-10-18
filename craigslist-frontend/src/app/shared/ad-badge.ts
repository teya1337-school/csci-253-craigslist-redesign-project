import { Component } from '@angular/core';

@Component({
  selector: 'app-ad-badge',
  template: `<span class="badge">Ad</span>`,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
      margin-inline-end: 8px;
    }
    .badge {
      padding: 4px 7px;
      border: 1px solid #91b59b;
      border-radius: 4px;
      background: #e7f4eb;
      color: #205b32;
      font:
        750 0.72rem/1 system-ui,
        sans-serif;
      white-space: nowrap;
    }
  `,
})
export class AdBadge {}
