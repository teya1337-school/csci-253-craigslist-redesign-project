import { Component, computed, input, OnDestroy, output, signal } from '@angular/core';

export interface PostPictureDraft {
  files: File[];
  removedPictureIds: string[];
}
interface PicturePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-post-pictures-editor',
  template: `
    <section class="pictures-editor" aria-labelledby="pictures-heading">
      <h2 id="pictures-heading">Pictures <span>(optional)</span></h2>
      <input
        #fileInput
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        [disabled]="disabled()"
        (change)="selectFiles($event)"
      />
      <button
        type="button"
        class="upload"
        (click)="fileInput.click()"
        [disabled]="disabled() || count() >= 5"
      >
        Upload pictures
      </button>
      <p class="hint">
        Up to 5 JPEG or PNG pictures, 2 MB each, no larger than 4096 × 4096 pixels.
      </p>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      @if (count()) {
        <p class="count" role="status">{{ count() }} of 5 pictures selected</p>
        <div class="previews">
          @for (id of existingPictures(); track id; let index = $index) {
            <div class="preview">
              <img
                [src]="'/api/posts/' + postId() + '/pictures/' + id"
                [alt]="'Post picture ' + (index + 1)"
                draggable="false"
              />
              <button
                type="button"
                [disabled]="disabled()"
                (click)="removeExisting(id)"
                [attr.aria-label]="'Remove picture ' + (index + 1)"
              >
                Remove
              </button>
            </div>
          }
          @for (picture of additions(); track picture.url; let index = $index) {
            <div class="preview">
              <img
                [src]="picture.url"
                [alt]="'Selected picture ' + (index + 1)"
                draggable="false"
              />
              <button
                type="button"
                [disabled]="disabled()"
                (click)="removeNew(picture)"
                [attr.aria-label]="'Remove selected picture ' + (index + 1)"
              >
                Remove
              </button>
            </div>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './post-pictures-editor.scss',
})
export class PostPicturesEditor implements OnDestroy {
  readonly postId = input<string | null>(null);
  readonly pictureIds = input<readonly string[]>([]);
  readonly disabled = input(false);

  readonly changed = output<PostPictureDraft>();

  protected readonly additions = signal<PicturePreview[]>([]);
  protected readonly removedIds = signal<string[]>([]);
  protected readonly error = signal('');

  protected readonly existingPictures = computed(() =>
    this.pictureIds().filter((id) => !this.removedIds().includes(id)),
  );

  protected readonly count = computed(
    () => this.existingPictures().length + this.additions().length,
  );

  protected selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.addFiles(files);
  }

  protected addFiles(files: File[]): void {
    if (this.disabled() || files.length === 0) {
      return;
    }

    this.error.set('');

    if (this.count() + files.length > 5) {
      this.error.set('Use up to 5 pictures per post.');
      return;
    }

    if (
      files.some(
        (file) =>
          !file.size ||
          file.size > 2 * 1024 * 1024 ||
          (file.type && !['image/jpeg', 'image/png'].includes(file.type)),
      )
    ) {
      this.error.set('Choose JPEG or PNG pictures up to 2 MB each.');
      return;
    }

    this.additions.update((current) => [
      ...current,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);

    this.emitDraft();
  }

  protected removeExisting(id: string): void {
    if (this.disabled()) {
      return;
    }

    this.removedIds.update((ids) => [...ids, id]);

    this.error.set('');
    this.emitDraft();
  }

  protected removeNew(picture: PicturePreview): void {
    if (this.disabled()) {
      return;
    }

    URL.revokeObjectURL(picture.url);

    this.additions.update((pictures) => pictures.filter((item) => item !== picture));

    this.error.set('');
    this.emitDraft();
  }

  private emitDraft(): void {
    this.changed.emit({
      files: this.additions().map((picture) => picture.file),
      removedPictureIds: this.removedIds(),
    });
  }

  ngOnDestroy(): void {
    this.additions().forEach((picture) => URL.revokeObjectURL(picture.url));
  }
}
