import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class LandingComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  public readonly themeService = inject(ThemeService);

  isLoggedIn = this.auth.isLoggedIn();

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.auth.clearAll();
        window.location.reload();
      },
      error: () => {
        this.auth.clearAll();
        window.location.reload();
      }
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}