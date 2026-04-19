import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthResponse, User } from '../shared/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = `http://${window.location.hostname}:8000/api`;

  constructor(private http: HttpClient) {}

  login(data: { username: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.api}/auth/login/`, data);
  }

  register(data: { username: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.api}/auth/register/`, data);
  }

  logout() {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post(`${this.api}/auth/logout/`, { refresh });
  }

  saveTokens(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  clearAll() {
    localStorage.clear();
  }
}