import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../shared/interfaces';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  public profileForm: FormGroup;
  public profile: User | null = null;
  public loading = true;
  public saving = false;
  public saved = false;
  public saveError = '';

  public selectedFile: File | null = null;
  public previewUrl: string | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      first_name: [''],
      last_name: [''],
      bio: [''],
      password: ['', [Validators.minLength(8)]]
    });
  }

  get f() {
    return this.profileForm.controls;
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  public loadProfile(): void {
    this.loading = true;
    this.api.get<User>('auth/profile/')
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.profile = data;
          this.profileForm.patchValue({
            username: data.username,
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,
            bio: data.bio
          });

          if (data.profile_picture) {
            // Исправляем логику формирования URL картинки профиля
            // Если приходит абсолютный URL от бэкенда (например с ngrok)
            if (data.profile_picture.startsWith('http')) {
              this.previewUrl = data.profile_picture;
            } else {
              // Иначе используем домен из environment
              const base = environment.apiUrl.replace('/api', '');
              this.previewUrl = `${base}${data.profile_picture}`;
            }
          } else {
            this.previewUrl = null;
          }
        },
        error: (err) => {
          console.error('Failed to load profile', err);
        }
      });
  }

  public onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  public saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saved = false;
    this.saveError = '';

    const formData = new FormData();
    formData.append('username', this.profileForm.value.username);
    formData.append('email', this.profileForm.value.email);
    formData.append('first_name', this.profileForm.value.first_name || '');
    formData.append('last_name', this.profileForm.value.last_name || '');
    formData.append('bio', this.profileForm.value.bio || '');

    if (this.profileForm.value.password) {
      formData.append('password', this.profileForm.value.password);
    }

    if (this.selectedFile) {
      formData.append('profile_picture', this.selectedFile);
    }

    this.api.patch<User>('auth/profile/', formData)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (data) => {
          this.profile = data;
          this.saved = true;
          this.profileForm.get('password')?.reset();
          this.selectedFile = null;
          this.authService.saveUser(data); // Обновляем данные пользователя в LocalStorage
          setTimeout(() => this.saved = false, 3000);
        },
        error: (err) => {
          console.error('Update failed', err);
          this.saveError = err.error?.detail || 'Failed to update profile. Details might be invalid or username/email taken.';
        }
      });
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  public logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearAll();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearAll();
        this.router.navigate(['/login']);
      }
    });
  }
}
