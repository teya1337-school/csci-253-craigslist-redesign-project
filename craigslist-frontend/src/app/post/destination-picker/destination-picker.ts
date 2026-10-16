import { FormsModule } from '@angular/forms';
import { Component, computed, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { PostDestination, postDestinations } from '../post-destinations';

@Component({
  selector: 'app-destination-picker',
  imports: [FormsModule],
  template: `
    <div class="destination-field">
      <span class="field-label" id="destination-label">Post to</span>
      <button
        #trigger
        class="destination-trigger"
        type="button"
        aria-controls="destination-options"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-invalid]="showError() && !destination()"
        aria-describedby="destination-hint destination-error"
        [disabled]="disabled()"
        (click)="toggle()"
      >
        <span>{{
          destination()
            ? destination()!.categoryLabel + ' → ' + destination()!.typeLabel
            : 'Choose where to post'
        }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
      <p class="hint" id="destination-hint">Choose a category and type for your post.</p>
      @if (showError() && !destination()) {
        <p class="error" id="destination-error" role="alert">
          Choose where to post before publishing.
        </p>
      }
      @if (isOpen()) {
        <section
          id="destination-options"
          class="destination-options"
          aria-labelledby="destination-label"
          (keydown.escape)="close()"
        >
          <div class="select-fields">
            <div>
              <label for="destination-category">Category</label>
              <select
                #categorySelect
                id="destination-category"
                [ngModel]="category()"
                [ngModelOptions]="{ standalone: true }"
                [disabled]="disabled()"
                (ngModelChange)="changeCategory($event)"
              >
                <option value="">Select a category</option>
                @for (option of categories; track option.category) {
                  <option [value]="option.category">{{ option.categoryLabel }}</option>
                }
              </select>
            </div>
            <div>
              <label for="destination-type">Type</label>
              <select
                #typeSelect
                id="destination-type"
                [disabled]="disabled() || !category()"
                [ngModel]="postType()"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="postType.set($event)"
              >
                <option value="">
                  {{ category() ? 'Select a type' : 'Choose a category first' }}
                </option>
                @for (option of types(); track option.postType) {
                  <option [value]="option.postType">{{ option.typeLabel }}</option>
                }
              </select>
            </div>
          </div>
          <div class="picker-actions">
            <button type="button" (click)="close()">Cancel</button>
            <button
              class="apply-button"
              type="button"
              [disabled]="disabled() || !canApply()"
              (click)="apply()"
            >
              Use destination
            </button>
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './destination-picker.scss',
})
export class DestinationPicker {
  readonly destination = model<PostDestination | null>(null);
  readonly showError = input(false);
  readonly disabled = input(false);
  protected readonly isOpen = signal(false);
  protected readonly category = signal('');
  protected readonly postType = signal('');
  protected readonly categories = postDestinations.filter(
    (option, index, all) => all.findIndex((item) => item.category === option.category) === index,
  );
  protected readonly types = computed(() =>
    postDestinations.filter((option) => option.category === this.category()),
  );
  protected readonly canApply = computed(() =>
    postDestinations.some(
      (option) => option.category === this.category() && option.postType === this.postType(),
    ),
  );
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly categorySelect = viewChild<ElementRef<HTMLSelectElement>>('categorySelect');

  open(): void {
    this.category.set(this.destination()?.category ?? '');
    this.postType.set(this.destination()?.postType ?? '');
    this.isOpen.set(true);
    setTimeout(() => this.categorySelect()?.nativeElement.focus());
  }

  protected toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  protected changeCategory(category: string): void {
    this.category.set(category);
    this.postType.set('');
  }

  protected close(): void {
    this.isOpen.set(false);
    this.trigger()?.nativeElement.focus();
  }

  protected apply(): void {
    const option = postDestinations.find(
      (item) => item.category === this.category() && item.postType === this.postType(),
    );
    if (!option) return;
    this.destination.set(option);
    this.close();
  }
}
