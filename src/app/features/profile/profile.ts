import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-profile',
  imports: [DatePipe, MatIconModule],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Profile</h1>
          <p>Your account and the claims inside your current access token.</p>
        </div>
      </header>

      <div class="grid">
        <section class="panel">
          <h2>Account</h2>
          @if (profile(); as u) {
            <dl>
              <dt>Name</dt><dd>{{ u.name }}</dd>
              <dt>Email</dt><dd>{{ u.email }}</dd>
              <dt>Role</dt><dd><span class="chip" [class.admin]="u.role === 'admin'">{{ u.role }}</span></dd>
              <dt>Department</dt><dd>{{ u.department }}</dd>
              <dt>Member since</dt><dd>{{ u.createdAt | date: 'longDate' }}</dd>
              <dt>Last sign-in</dt><dd>{{ u.lastLogin | date: 'medium' }}</dd>
            </dl>
          }
        </section>

        <section class="panel">
          <h2>Session (JWT)</h2>
          <p class="panel-subtitle">Decoded on the client. The API verifies the signature on every request.</p>
          @if (auth.claims(); as c) {
            <dl>
              <dt>Subject</dt><dd>{{ c.sub }}</dd>
              <dt>Role claim</dt><dd>{{ c.role }}</dd>
              <dt>Issued</dt><dd>{{ c.iat * 1000 | date: 'medium' }}</dd>
              <dt>Expires</dt><dd>{{ c.exp * 1000 | date: 'medium' }} <span class="muted">({{ minutesLeft() }} min left)</span></dd>
            </dl>
          }
        </section>
      </div>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 12px 24px;
      margin: 16px 0 0;
    }
    dt {
      color: var(--mat-sys-on-surface-variant);
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
    .chip {
      text-transform: capitalize;
    }
  `,
})
export default class Profile {
  protected readonly auth = inject(AuthService);
  // Fresh copy from the API; falls back to the cached user if the call fails.
  protected readonly profile = toSignal(this.auth.refreshProfile().pipe(catchError(() => of(this.auth.user()))), {
    initialValue: this.auth.user(),
  });
  protected readonly minutesLeft = computed(() =>
    Math.max(0, Math.round(((this.auth.claims()?.exp ?? 0) * 1000 - Date.now()) / 60000)),
  );
}
