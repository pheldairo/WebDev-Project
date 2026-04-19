import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  public auth = inject(AuthService);
  public api = inject(ApiService);
  public router = inject(Router);

  username = '';
  email = '';
  password = '';
  major: number | null = null;
  semester: number | null = null;

  error = '';
  loading = false;

  register() {
    if(!this.major || !this.semester) {
      this.error = 'Major and Semester are required';
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.auth.register(payload).subscribe({
      next: (res: any) => {
        // The backend returns access/refresh tokens directly upon register!
        this.auth.saveTokens(res.access, res.refresh);
        this.auth.saveUser(res.user);
        
        // Now update profile to set major and semester
        this.api.patch('auth/profile/', { major: this.major, semester: this.semester }).subscribe({
          next: () => {
            this.router.navigate(['/rooms']);
          },
          error: () => {
            // Even if major fails, user is registered and logged in
            this.router.navigate(['/profile']);
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to register. Username or email might exist.';
        this.loading = false;
      }
    });
  }
}