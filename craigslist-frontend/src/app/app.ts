import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { SiteHeader } from './shared/site-header/site-header';

@Component({
  imports: [RouterOutlet, SiteHeader],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);

  // Load the signed-in user when the application starts.
  ngOnInit(): void {
    this.authService.loadCurrentUser().subscribe();
  }
}
