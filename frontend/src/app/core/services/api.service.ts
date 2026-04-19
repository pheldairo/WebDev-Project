import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = `http://${window.location.hostname}:8000/api`;
  private readonly http = inject(HttpClient);

  private getHeaders(body?: any): HttpHeaders {
    let headers = new HttpHeaders();
    
    // If body is NOT FormData, set JSON content type
    if (!(body instanceof FormData)) {
      headers = headers.set('Content-Type', 'application/json');
    }

    const token = localStorage.getItem('access_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, { headers: this.getHeaders(body) });
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body, { headers: this.getHeaders(body) });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders() });
  }
}
