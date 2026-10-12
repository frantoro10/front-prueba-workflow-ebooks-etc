import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  access: string;
  refresh: string;
  user: { email: string; id: string };
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly BASE = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<{ email: string; id: string } | null>(
    this.loadUser()
  );

  private loadUser(): { email: string; id: string } | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.BASE}/register/`, payload)
      .pipe(tap((res) => this.storeSession(res)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.BASE}/login/`, payload)
      .pipe(tap((res) => this.storeSession(res)));
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem('access_token', res.access);
    localStorage.setItem('refresh_token', res.refresh);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }
}
