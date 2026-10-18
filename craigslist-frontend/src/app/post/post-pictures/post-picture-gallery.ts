import { Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-post-picture-gallery',
  template: `
    @if (pictureIds().length) {
      <section class="gallery" aria-label="Post pictures">
        <button
          class="main-picture"
          type="button"
          (click)="enlarge()"
          [attr.aria-label]="
            'Enlarge picture ' + (currentIndex() + 1) + ' of ' + pictureIds().length
          "
        >
          <img
            [src]="pictureUrl()"
            [alt]="'Post picture ' + (currentIndex() + 1)"
            draggable="false"
          />
        </button>
        @if (pictureIds().length > 1) {
          <div class="thumbnails" aria-label="Choose a picture">
            @for (id of pictureIds(); track id; let index = $index) {
              <button
                type="button"
                (click)="selected.set(index)"
                [attr.aria-pressed]="currentIndex() === index"
                [attr.aria-label]="'Show picture ' + (index + 1)"
              >
                <img [src]="url(id)" alt="" draggable="false" />
              </button>
            }
          </div>
        }
        <p class="picture-count">
          Picture {{ currentIndex() + 1 }} of {{ pictureIds().length }} · Click to enlarge
        </p>
      </section>
      <dialog
        #viewer
        aria-label="Enlarged post picture"
        (click)="closeBackdrop($event)"
        (keydown)="handleKey($event)"
      >
        <div class="viewer-header">
          <span>Picture {{ currentIndex() + 1 }} of {{ pictureIds().length }}</span>
          <button type="button" autofocus (click)="close()">Close</button>
        </div>
        <img
          class="enlarged"
          [src]="pictureUrl()"
          [alt]="'Post picture ' + (currentIndex() + 1)"
          draggable="false"
        />
        @if (pictureIds().length > 1) {
          <div class="viewer-navigation">
            <button type="button" (click)="move(-1)" [disabled]="currentIndex() === 0">
              ← Previous
            </button>
            <button
              type="button"
              (click)="move(1)"
              [disabled]="currentIndex() === pictureIds().length - 1"
            >
              Next →
            </button>
          </div>
        }
      </dialog>
    }
  `,
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
  protected url(id: string): string {
    return `/api/posts/${this.postId()}/pictures/${id}`;
  }
  protected enlarge(): void {
    this.viewer()?.nativeElement.showModal();
  }
  protected close(): void {
    this.viewer()?.nativeElement.close();
  }
  protected closeBackdrop(event: MouseEvent): void {
    if (event.target === this.viewer()?.nativeElement) this.close();
  }
  protected move(step: number): void {
    this.selected.set(
      Math.max(0, Math.min(this.pictureIds().length - 1, this.currentIndex() + step)),
    );
  }
  protected handleKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }
}
