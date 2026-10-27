import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, throwError } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { LoadingService } from './services/loading.service';

const isAuthEndpoint = (url: string) => /\/api\/auth\/(login|register)$/.test(url);

/** Attaches the JWT to every API call. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token || !req.url.startsWith('/api') || isAuthEndpoint(req.url)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

/** Central error handling: expired sessions log out, everything else shows a snackbar. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Login/register show their own inline errors.
      if (!isAuthEndpoint(req.url)) {
        if (error.status === 401) {
          auth.logout('expired');
        } else {
          const message =
            error.status === 0
              ? 'Cannot reach the API. Is `npm run api` running?'
              : (error.error?.message ?? `Request failed (${error.status})`);
          snackBar.open(message, 'Dismiss', { duration: 5000 });
        }
      }
      return throwError(() => error);
    }),
  );
};

/** Drives the global progress bar. */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
