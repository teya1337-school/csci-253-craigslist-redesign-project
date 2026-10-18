import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { UserAvatar } from '../../shared/user-avatar';

export interface PictureDraft {
  file: File | null;
  removePicture: boolean;
}

@Component({
  selector: 'app-profile-picture',
  imports: [UserAvatar],
  templateUrl: './profile-picture.html',
  styleUrl: './profile-picture.scss',
})
export class ProfilePicture {
  private readonly destroyRef = inject(DestroyRef);

  readonly userId = input.required<string>();
  readonly version = input<string | null>(null);
  readonly disabled = input(false);

  readonly changed = output<PictureDraft>();

  protected readonly preview = signal<string | null>(null);
  protected readonly removing = signal(false);
  protected readonly error = signal('');

  // Release the preview URL when the component is destroyed.
  constructor() {
    this.destroyRef.onDestroy(() => this.releasePreview());
  }

  // Handle file selection from the input element
  protected selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (!file || this.disabled()) {
      return;
    }

    this.error.set('');

    const isFileValid =
      (file.type !== '' && !['image/jpeg', 'image/png'].includes(file.type)) ||
      file.size === 0 ||
      file.size > 2 * 1024 * 1024;

    // Validate the file type and size
    if (isFileValid) {
      this.error.set('Choose a JPEG or PNG image up to 2 MB.');
      return;
    }

    this.releasePreview();

    this.removing.set(false);
    this.preview.set(URL.createObjectURL(file));

    this.changed.emit({ file, removePicture: false });
  }

  // Remove the current profile picture
  protected remove(): void {
    if (this.disabled()) {
      return;
    }

    this.releasePreview();

    this.removing.set(true);
    this.error.set('');

    this.changed.emit({ file: null, removePicture: true });
  }

  // Release the object URL for the preview image to free up memory
  private releasePreview(): void {
    const preview = this.preview();

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    this.preview.set(null);
  }
}
