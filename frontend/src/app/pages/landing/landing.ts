import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  isLoggedIn = false;

  constructor(private auth: AuthService, private router: Router) {
    this.isLoggedIn = this.auth.isLoggedIn();
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.auth.clearAll();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.auth.clearAll();
        this.router.navigate(['/login']);
      }
    });
  }
}