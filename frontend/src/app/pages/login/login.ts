import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  public loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  public error = '';
  public loading = false;

  get f() {
    return this.loginForm.controls;
  }

  public login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login(this.loginForm.value)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.auth.saveTokens(res.access, res.refresh);
          this.auth.saveUser(res.user);
          this.router.navigate(['/rooms']);
        },
        error: (err) => {
          if (err.status === 401) {
            this.error = 'Invalid username or password.';
          } else {
            this.error = 'Login failed. Please try again later.';
          }
        }
      });
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
