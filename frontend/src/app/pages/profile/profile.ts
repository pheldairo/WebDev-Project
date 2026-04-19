import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../shared/interfaces';

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

  profileForm: FormGroup;
  profile: User | null = null;
  loading = true;
  saved = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      first_name: [''],
      last_name: [''],
      bio: [''],
      password: ['']
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.api.get<User>('auth/profile/').subscribe({
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
          this.previewUrl = data.profile_picture.startsWith('http') 
            ? data.profile_picture 
            : `http://${window.location.hostname}:8000${data.profile_picture}`;
        } else {
          this.previewUrl = null;
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    
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

    this.api.patch<User>('auth/profile/', formData).subscribe({
      next: (data) => {
        this.profile = data;
        this.saved = true;
        this.profileForm.get('password')?.reset();
        this.selectedFile = null;
        setTimeout(() => this.saved = false, 3000);
      },
      error: (err) => {
        console.error('Update failed', err);
        alert('Failed to update profile. Details might be invalid or username/email taken.');
      }
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.clearAll();
    this.router.navigate(['/login']);
  }
}