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
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  @ViewChild('accountTrigger') private accountTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChildren('menuItem', { read: ElementRef })
  private menuItems?: QueryList<ElementRef<HTMLElement>>;

  protected readonly messageService = inject(MessageService);
  protected readonly authService = inject(AuthService);
  protected readonly isAccountMenuOpen = signal(false);
  protected readonly isSigningOut = signal(false);
  protected readonly signOutError = signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  protected closeMenuWhenClickingOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isAccountMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeMenuWithEscape(): void {
    if (this.isAccountMenuOpen()) {
      this.isAccountMenuOpen.set(false);
      this.accountTrigger?.nativeElement.focus();
    }
  }

  protected toggleAccountMenu(): void {
    this.isAccountMenuOpen.update((isOpen) => !isOpen);

    if (this.isAccountMenuOpen()) {
      queueMicrotask(() => this.menuItems?.first?.nativeElement.focus());
    }
  }

  protected closeAccountMenu(): void {
    this.isAccountMenuOpen.set(false);
  }

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

  protected logout(): void {
    this.signOutError.set(null);
    this.isSigningOut.set(true);

    this.authService
      .logout()
      .pipe(finalize(() => this.isSigningOut.set(false)))
      .subscribe({
        next: () => {
          this.closeAccountMenu();
          void this.router.navigate(['/']);
        },
        error: () => this.signOutError.set('Sign out failed. Please try again.'),
      });
  }
}
