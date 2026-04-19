import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../shared/interfaces';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  public themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  profileForm: FormGroup;
  profile: User | null = null;
  loading = true;
  saved = false;

  constructor() {
    this.profileForm = this.fb.group({
      major: [null, Validators.required],
      semester: [null, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.api.get<User>('auth/profile/').subscribe(data => {
      this.profile = data;
      this.profileForm.patchValue({
        major: data.major,
        semester: data.semester
      });
      this.loading = false;
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.api.patch<User>('auth/profile/', this.profileForm.value).subscribe(data => {
      this.profile = data;
      this.saved = true;
      setTimeout(() => this.saved = false, 3000);
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}