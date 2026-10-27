import { Routes } from '@angular/router';

// Lazy feature route; guarded by roleGuard('admin') via canMatch in app.routes.ts.
export default [
  { path: '', title: 'Users · Admin', loadComponent: () => import('./users') },
] satisfies Routes;
