import { Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-post-picture-gallery',
  templateUrl: './post-picture-gallery.html',
  styleUrl: './post-picture-gallery.scss',
})
export class PostPictureGallery {
  readonly postId = input.required<string>();
  readonly pictureIds = input<readonly string[]>([]);
  protected readonly selected = signal(0);
  protected readonly currentIndex = computed(() =>
    Math.min(this.selected(), Math.max(0, this.pictureIds().length - 1)),
  );
  protected readonly pictureUrl = computed(() => this.url(this.pictureIds()[this.currentIndex()]));
  private readonly viewer = viewChild<ElementRef<HTMLDialogElement>>('viewer');

  // Build the API URL for a post picture.
  protected url(id: string): string {
    return `/api/posts/${this.postId()}/pictures/${id}`;
  }

  // Open the current picture in the larger dialog.
  protected enlarge(): void {
    this.viewer()?.nativeElement.showModal();
  }

  // Close the larger picture dialog.
  protected close(): void {
    this.viewer()?.nativeElement.close();
  }

  // Close the dialog when the user clicks its backdrop.
  protected closeBackdrop(event: MouseEvent): void {
    if (event.target === this.viewer()?.nativeElement) this.close();
  }

  // Move to the previous or next picture without leaving the valid range.
  protected move(step: number): void {
    this.selected.set(
      Math.max(0, Math.min(this.pictureIds().length - 1, this.currentIndex() + step)),
    );
  }

  // Move between pictures with the left and right arrow keys.
  protected handleKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
}
