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
  templateUrl: './post-pictures-editor.html',
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

  // Read the selected files and clear the file input so it can be used again.
  protected selectFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.addFiles(files);
  }

  // Validate and add new picture files to the draft.
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

  // Mark an existing picture for removal.
  protected removeExisting(id: string): void {
    if (this.disabled()) {
      return;
    }

    this.removedIds.update((ids) => [...ids, id]);

    this.error.set('');
    this.emitDraft();
  }

  // Remove a newly selected picture and release its preview URL.
  protected removeNew(picture: PicturePreview): void {
    if (this.disabled()) {
      return;
    }

    URL.revokeObjectURL(picture.url);

    this.additions.update((pictures) => pictures.filter((item) => item !== picture));

    this.error.set('');
    this.emitDraft();
  }

  // Send the current picture changes to the parent form.
  private emitDraft(): void {
    this.changed.emit({
      files: this.additions().map((picture) => picture.file),
      removedPictureIds: this.removedIds(),
    });
  }

  // Release any preview URLs when the component is destroyed.
  ngOnDestroy(): void {
    this.additions().forEach((picture) => URL.revokeObjectURL(picture.url));
  }
}
