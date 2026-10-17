import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthService } from '../../auth/auth.service';
import { UserProfile } from './user-profile';

describe('UserProfile editing', () => {
  afterEach(() => TestBed.resetTestingModule());
  function setup(owner: boolean) {
    TestBed.configureTestingModule({
      imports: [UserProfile],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ userId: 'alice-id' })) },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(owner ? { id: 'alice-id' } : null),
            updatePictureVersion: () => {},
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(UserProfile);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/users/alice-id/profile').flush({
      id: 'alice-id',
      username: 'alice',
      memberSince: '2026-10-01T00:00:00Z',
      bio: null,
      publicEmail: null,
      publicPhoneNumber: null,
      posts: [],
    });
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, http };
  }
  it('does not offer or allow editing to public visitors', () => {
    const { fixture, component, http } = setup(false);
    expect(fixture.nativeElement.textContent).not.toContain('Edit profile');
    component['editProfile']();
    expect(component['editing']()).toBe(false);
    http.verify();
  });
  it('requires the current password and sends only public profile fields plus verification', () => {
    const { component, http } = setup(true);
    component['editProfile']();
    component['profileForm'].patchValue({ bio: 'About me', publicEmail: 'contact@example.com' });
    component['saveProfile']();
    http.expectNone('/api/account/profile');
    component['profileForm'].patchValue({ currentPassword: 'test-password' });
    const file = new File(['bytes'], 'picture.png');
    component['pictureChanged']({ file, removePicture: false });
    component['saveProfile']();
    const request = http.expectOne('/api/account/profile');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body instanceof FormData).toBe(true);
    expect(request.request.body.get('profile') instanceof Blob).toBe(true);
    expect(request.request.body.get('removePicture')).toBe('false');
    expect(request.request.body.get('file').name).toBe('picture.png');
    request.flush({ pictureVersion: null });
    expect(component['profile']()?.publicEmail).toBe('contact@example.com');
    expect(component['editing']()).toBe(false);
    expect(component['profileForm'].controls.currentPassword.value).toBe('');
    http.verify();
  });
  it('cancel discards profile drafts without changing the public view', () => {
    const { component, http } = setup(true);
    component['editProfile']();
    component['profileForm'].patchValue({ bio: 'Unsaved draft', currentPassword: 'secret' });
    component['cancelEdit']();
    expect(component['profile']()?.bio).toBeNull();
    expect(component['profileForm'].controls.currentPassword.value).toBe('');
    http.expectNone('/api/account/profile');
    http.verify();
  });
});
