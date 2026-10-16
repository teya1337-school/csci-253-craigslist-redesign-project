import { Component, input } from '@angular/core';

@Component({
  selector: 'app-edited-indicator',
  template: `
    @if (editedAt()) {
      <span class="edited-label">Edited</span>
    }
  `,
  styles: `
    :host {
      display: inline;
    }
    .edited-label {
      color: #716a74;
      font-size: 0.82rem;
      font-weight: 400;
    }
  `,
})
export class EditedIndicator {
  readonly editedAt = input.required<string | null>();
}
