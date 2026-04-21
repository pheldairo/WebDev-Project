import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  public registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  public error = '';
  public loading = false;

  get f() {
    return this.registerForm.controls;
  }

  public register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.register(this.registerForm.value)
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
        error: (err) => this.handleRegistrationError(err)
      });
  }

 private handleRegistrationError(err: any): void {
    this.loading = false;
    if (err.status === 0) {
      this.error = 'Server is not responding. Please check your connection.';
      return;
    }

    const errorData = err.error;
    if (errorData && typeof errorData === 'object') {
      // Собираем все ошибки в один массив сообщений
      const messages = Object.entries(errorData).map(([field, msgs]: [string, any]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        const detail = Array.isArray(msgs) ? msgs[0] : msgs;
        return `${fieldName}: ${detail}`;
      });
      this.error = messages.join('. ');
    } else {
      this.error = errorData?.detail || 'Registration failed. Please check your data.';
    }
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
