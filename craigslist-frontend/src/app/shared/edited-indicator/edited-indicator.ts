import { Component, input } from '@angular/core';

@Component({
  selector: 'app-edited-indicator',
  templateUrl: './edited-indicator.html',
  styleUrl: './edited-indicator.scss',
})
export class EditedIndicator {
  // Receive the edit time from the parent component.
  readonly editedAt = input.required<string | null>();
}
