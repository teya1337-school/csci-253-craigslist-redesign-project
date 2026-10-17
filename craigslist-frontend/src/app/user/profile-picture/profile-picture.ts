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
  readonly userId = input.required<string>();
  readonly version = input<string | null>(null);
  readonly disabled = input(false);
  readonly changed = output<PictureDraft>();
  private readonly destroyRef = inject(DestroyRef);
  protected readonly preview = signal<string | null>(null);
  protected readonly removing = signal(false);
  protected readonly error = signal('');

  constructor() {
    this.destroyRef.onDestroy(() => this.releasePreview());
  }

  protected selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.disabled()) return;
    this.error.set('');
    if (
      (file.type !== '' && !['image/jpeg', 'image/png'].includes(file.type)) ||
      file.size === 0 ||
      file.size > 2 * 1024 * 1024
    ) {
      this.error.set('Choose a JPEG or PNG image up to 2 MB.');
      return;
    }
    this.releasePreview();
    this.removing.set(false);
    this.preview.set(URL.createObjectURL(file));
    this.changed.emit({ file, removePicture: false });
  }

  protected remove(): void {
    if (this.disabled()) return;
    this.releasePreview();
    this.removing.set(true);
    this.error.set('');
    this.changed.emit({ file: null, removePicture: true });
  }

  private releasePreview(): void {
    const preview = this.preview();
    if (preview) URL.revokeObjectURL(preview);
    this.preview.set(null);
  }
}
