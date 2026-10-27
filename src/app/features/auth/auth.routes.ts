import { Routes } from '@angular/router';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', title: 'Sign in · Admin', loadComponent: () => import('./login') },
  { path: 'register', title: 'Create account · Admin', loadComponent: () => import('./register') },
] satisfies Routes;
