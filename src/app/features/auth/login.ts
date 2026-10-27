import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
})
export default class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  // Bound from query params via withComponentInputBinding().
  readonly returnUrl = input<string>();
  readonly reason = input<string>();

  protected readonly hidePassword = signal(true);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected useDemo(role: 'admin' | 'user'): void {
    this.form.setValue(
      role === 'admin'
        ? { email: 'admin@demo.com', password: 'admin123' }
        : { email: 'user@demo.com', password: 'user123' },
    );
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() || '/dashboard'),
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 0
            ? 'Cannot reach the API. Start it with `npm run api`.'
            : (err.error?.message ?? 'Sign in failed'),
        );
        this.submitting.set(false);
      },
    });
  }
}
