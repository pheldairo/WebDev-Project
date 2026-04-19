import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  public auth = inject(AuthService);
  public router = inject(Router);
  public themeService = inject(ThemeService);

  username = '';
  password = '';
  error = '';
  loading = false;

  login() {
    this.loading = true;
    this.error = '';
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res: any) => {
        this.auth.saveTokens(res.access, res.refresh);
        this.auth.saveUser(res.user);
        this.router.navigate(['/rooms']);
      },
      error: () => {
        this.error = 'Invalid username or password';
        this.loading = false;
      }
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}