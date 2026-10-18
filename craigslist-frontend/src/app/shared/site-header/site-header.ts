import { accountReturnUrl } from '../../auth/return-url';
import { UserAvatar } from '../user-avatar';
import { PostSearch } from '../../post/post-search/post-search';
import { MessageService } from '../../message/message.service';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, PostSearch, UserAvatar],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  protected readonly authService = inject(AuthService);
  protected readonly messageService = inject(MessageService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  private menuItems?: QueryList<ElementRef<HTMLElement>>;

  protected readonly isAccountMenuOpen = signal(false);
  protected readonly isSigningOut = signal(false);
  protected readonly signOutError = signal<string | null>(null);

  @ViewChild('accountTrigger') private accountTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChildren('menuItem', { read: ElementRef })

  // Compute the return URL for account-related actions based on the current route
  protected get accountReturnUrl(): string {
    const currentUrl = this.router.url;
    const route = this.router.parseUrl(currentUrl);
    const path = currentUrl.split(/[?#]/)[0];

    return accountReturnUrl(
      path === '/login' || path === '/signup'
        ? (route.queryParams['returnUrl'] ?? null)
        : currentUrl,
    );
  }

  // Close the account menu when clicking outside of it
  @HostListener('document:click', ['$event'])
  protected closeMenuWhenClickingOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isAccountMenuOpen.set(false);
    }
  }

  // Close the account menu when the escape key is pressed
  @HostListener('document:keydown.escape')
  protected closeMenuWithEscape(): void {
    if (this.isAccountMenuOpen()) {
      this.isAccountMenuOpen.set(false);
      this.accountTrigger?.nativeElement.focus();
    }
  }

  // Toggle the account menu open/closed and manage focus
  protected toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((isOpen) => !isOpen);

    if (this.isAccountMenuOpen()) {
      queueMicrotask(() => this.menuItems?.first?.nativeElement.focus());
    }
  }

  // Close the account menu and reset focus to the trigger button
  protected closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

  // Handle keyboard navigation within the account menu
  protected handleMenuKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    const items = this.menuItems?.toArray().map((item) => item.nativeElement) ?? [];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + items.length) % items.length;

    event.preventDefault();
    items[nextIndex]?.focus();
  }

  // Sign out the user and navigate to the home page
  protected logout(): void {
    this.signOutError.set(null);
    this.isSigningOut.set(true);

    this.authService.logout().pipe(
      finalize(() => this.isSigningOut.set(false))
    ).subscribe({
      next: () => {
        this.closeAccountMenu();
        void this.router.navigate(['/']);
      },
      error: () => this.signOutError.set('Sign out failed. Please try again.'),
    });
  }
}
