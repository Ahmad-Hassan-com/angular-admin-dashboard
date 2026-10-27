import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { LoadingService } from '../core/services/loading.service';
import { ThemeService } from '../core/services/theme.service';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressBarModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export default class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly loading = inject(LoadingService);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly nav = computed<NavItem[]>(() => [
    { path: '/dashboard', icon: 'space_dashboard', label: 'Dashboard' },
    ...(this.auth.isAdmin() ? [{ path: '/users', icon: 'group', label: 'Users' }] : []),
    { path: '/profile', icon: 'account_circle', label: 'Profile' },
  ]);

  protected readonly initials = computed(() =>
    (this.auth.user()?.name ?? '?')
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}
