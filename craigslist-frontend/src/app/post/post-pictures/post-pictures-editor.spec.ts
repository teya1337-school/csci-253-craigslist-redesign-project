import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PostPicturesEditor } from './post-pictures-editor';
beforeEach(() => {
  let sequence = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => `blob:${++sequence}`),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});
afterEach(() => TestBed.resetTestingModule());
function setup() {
  TestBed.configureTestingModule({ imports: [PostPicturesEditor] });
  const fixture = TestBed.createComponent(PostPicturesEditor);
  const changed = vi.fn();
  fixture.componentInstance.changed.subscribe(changed);
  return { fixture, component: fixture.componentInstance, changed };
}
const file = () => new File(['image'], 'picture.png', { type: 'image/png' });
it('stages additions/removals and releases previews when cancelled', () => {
  const { fixture, component, changed } = setup();
  fixture.componentRef.setInput('pictureIds', ['existing']);
  component['addFiles']([file()]);
  component['removeExisting']('existing');
  expect(changed.mock.lastCall?.[0].removedPictureIds).toEqual(['existing']);
  expect(changed.mock.lastCall?.[0].files).toHaveLength(1);
  fixture.destroy();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
});
it('rejects more than five total pictures without losing the existing draft', () => {
  const { fixture, component } = setup();
  fixture.componentRef.setInput('pictureIds', ['1', '2', '3', '4']);
  component['addFiles']([file()]);
  component['addFiles']([file()]);
  expect(component['count']()).toBe(5);
  expect(component['error']()).toContain('up to 5');
  expect(component['additions']()).toHaveLength(1);
});
it('rejects unsupported, empty, and oversized files before creating previews', () => {
  const { component, changed } = setup();
  for (const invalid of [
    new File(['svg'], 'a.svg', { type: 'image/svg+xml' }),
    new File([], 'empty.png'),
    new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png'),
  ]) {
    component['addFiles']([invalid]);
    expect(component['error']()).toContain('JPEG or PNG');
  }
  expect(changed).not.toHaveBeenCalled();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
