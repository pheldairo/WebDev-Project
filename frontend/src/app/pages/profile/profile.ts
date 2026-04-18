import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User } from '../../shared/interfaces';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  username = '';
  email = '';
  success = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.username = this.user?.username || '';
    this.email = this.user?.email || '';
  }

  getInitials(): string {
    return this.username.slice(0, 2).toUpperCase();
  }

  getAvatarColor(): string {
    let hash = 0;
    for (let i = 0; i < this.username.length; i++) {
      hash = this.username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash % 360)}, 70%, 55%)`;
  }

  getJoinDate(): string {
    if (!this.user?.date_joined) return '—';
    return new Date(this.user.date_joined).toLocaleDateString('ru-RU', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  save() {
    this.success = '';
    this.error = '';
    if (!this.username.trim() || !this.email.trim()) {
      this.error = 'Заполни все поля';
      return;
    }
    if (this.user) {
      const updated = { ...this.user, username: this.username, email: this.email };
      this.auth.saveUser(updated);
      this.success = 'Профиль обновлён локально';
    }
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => { this.auth.clearAll(); this.router.navigate(['/login']); },
      error: () => { this.auth.clearAll(); this.router.navigate(['/login']); }
    });
  }

  goToRooms() {
    this.router.navigate(['/rooms']);
  }
}