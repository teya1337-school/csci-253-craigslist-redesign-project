import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePicture } from './profile-picture';

describe('ProfilePicture draft', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  });
  afterEach(() => TestBed.resetTestingModule());
  function setup() {
    TestBed.configureTestingModule({ imports: [ProfilePicture] });
    const fixture = TestBed.createComponent(ProfilePicture);
    fixture.componentRef.setInput('userId', 'owner-id');
    fixture.detectChanges();
    const changed = vi.fn();
    fixture.componentInstance.changed.subscribe(changed);
    return { fixture, component: fixture.componentInstance, changed };
  }
  function select(component: ProfilePicture, file: File) {
    component['selectFile']({ target: { files: [file], value: 'file' } } as unknown as Event);
  }
  it('rejects unsupported files without changing the draft', () => {
    const { component, changed } = setup();
    select(component, new File(['text'], 'image.svg', { type: 'image/svg+xml' }));
    expect(component['error']()).toContain('JPEG or PNG');
    expect(changed).not.toHaveBeenCalled();
  });
  it('previews a selection and releases the temporary URL when editing is cancelled', () => {
    const { component, fixture, changed } = setup();
    const file = new File(['image bytes'], 'avatar.png');
    select(component, file);
    expect(changed).toHaveBeenCalledWith({ file, removePicture: false });
    expect(component['preview']()).toBe('blob:preview');
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
  it('stages removal without an API request or separate save button', () => {
    const { component, fixture, changed } = setup();
    fixture.componentRef.setInput('version', 'old-version');
    component['remove']();
    fixture.detectChanges();
    expect(changed).toHaveBeenCalledWith({ file: null, removePicture: true });
    expect(fixture.nativeElement.textContent).toContain('when you update your profile');
    expect(fixture.nativeElement.textContent).not.toContain('Save picture');
    expect(fixture.nativeElement.querySelector('input[type=file]').hidden).toBe(true);
  });
});
