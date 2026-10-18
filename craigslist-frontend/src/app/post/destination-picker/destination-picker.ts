import { FormsModule } from '@angular/forms';
import { Component, computed, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { PostDestination, postDestinations } from '../post-destinations';

@Component({
  selector: 'app-destination-picker',
  imports: [FormsModule],
  templateUrl: './destination-picker.html',
  styleUrl: './destination-picker.scss',
})
export class DestinationPicker {
  readonly destination = model<PostDestination | null>(null);

  readonly showError = input(false);
  readonly disabled = input(false);

  protected readonly isOpen = signal(false);
  protected readonly category = signal('');
  protected readonly postType = signal('');

  // Keep one option for each available category.
  protected readonly categories = postDestinations.filter(
    (option, index, all) => all.findIndex((item) => item.category === option.category) === index,
  );

  // Show only the types that belong to the selected category.
  protected readonly types = computed(() =>
    postDestinations.filter((option) => option.category === this.category()),
  );

  // Enable the apply button only when the selected destination exists.
  protected readonly canApply = computed(() =>
    postDestinations.some(
      (option) => option.category === this.category() && option.postType === this.postType(),
    ),
  );

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly categorySelect = viewChild<ElementRef<HTMLSelectElement>>('categorySelect');

  // Open the picker with the current destination and focus the category select.
  open(): void {
    this.category.set(this.destination()?.category ?? '');
    this.postType.set(this.destination()?.postType ?? '');
    this.isOpen.set(true);

    setTimeout(() => this.categorySelect()?.nativeElement.focus());
  }

  // Toggle the picker open or closed.
  protected toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  // Change the category and reset the post type.
  protected changeCategory(category: string): void {
    this.category.set(category);
    this.postType.set('');
  }

  // Close the picker and focus the trigger button.
  protected close(): void {
    this.isOpen.set(false);
    this.trigger()?.nativeElement.focus();
  }

  // Apply the selected destination.
  protected apply(): void {
    const option = postDestinations.find(
      (item) => item.category === this.category() && item.postType === this.postType(),
    );

    if (!option) {
      return;
    }

    // Set the destination and close the picker.
    this.destination.set(option);
    this.close();
  }
}
