import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { Role } from '../models';
import { AuthService } from './auth.service';

/** Only signed-in users; others are sent to login with a return URL. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return (
    auth.isAuthenticated() ||
    inject(Router).createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } })
  );
};

/** Keeps signed-in users away from login/register. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/dashboard']);

/**
 * Role check as a CanMatch guard: a user without the role never downloads the
 * lazy-loaded chunk for the route at all.
 */
export const roleGuard =
  (...roles: Role[]): CanMatchFn =>
  (_route, segments) => {
    const role = inject(AuthService).role();
    const router = inject(Router);
    // CanMatch runs before the parent's canActivate, so handle signed-out visitors here too.
    if (!role) {
      const returnUrl = '/' + segments.map((s) => s.path).join('/');
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl } });
    }
    return roles.includes(role) || router.createUrlTree(['/forbidden']);
  };
