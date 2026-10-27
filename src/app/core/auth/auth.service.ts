import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { AuthResponse, JwtPayload, User } from '../models';

const TOKEN_KEY = 'admin-dashboard.token';
const USER_KEY = 'admin-dashboard.user';

/** Decodes the (unverified) payload of a JWT. The server is the one that verifies the signature. */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private logoutTimer?: ReturnType<typeof setTimeout>;

  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<User | null>(JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'));

  /** Claims come from the token, so the UI role always matches what the API will enforce. */
  readonly claims = computed(() => {
    const token = this.token();
    return token ? decodeJwt(token) : null;
  });
  readonly isAuthenticated = computed(() => {
    const claims = this.claims();
    return !!claims && claims.exp * 1000 > Date.now();
  });
  readonly role = computed(() => (this.isAuthenticated() ? this.claims()!.role : null));
  readonly isAdmin = computed(() => this.role() === 'admin');

  constructor() {
    if (this.token() && !this.isAuthenticated()) this.clearSession();
    else this.scheduleAutoLogout();
  }

  getToken(): string | null {
    return this.isAuthenticated() ? this.token() : null;
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.user),
    );
  }

  register(data: { name: string; email: string; password: string }): Observable<User> {
    return this.http.post<AuthResponse>('/api/auth/register', data).pipe(
      tap((res) => this.setSession(res)),
      map((res) => res.user),
    );
  }

  refreshProfile(): Observable<User> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap((user) => {
        this.user.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(reason?: 'expired'): void {
    this.clearSession();
    this.router.navigate(['/auth/login'], reason ? { queryParams: { reason } } : {});
  }

  private setSession({ token, user }: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.user.set(user);
    this.scheduleAutoLogout();
  }

  private clearSession(): void {
    clearTimeout(this.logoutTimer);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
  }

  private scheduleAutoLogout(): void {
    clearTimeout(this.logoutTimer);
    const claims = this.claims();
    if (!claims) return;
    const msLeft = claims.exp * 1000 - Date.now();
    this.logoutTimer = setTimeout(() => this.logout('expired'), Math.max(0, msLeft));
  }
}
