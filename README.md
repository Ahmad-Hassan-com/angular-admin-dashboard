# Pulse Admin: Angular Admin Dashboard

A responsive admin dashboard built with **Angular 22**, **Angular Material (M3)**, **RxJS** and **Chart.js**, backed by a small Express mock API that issues real signed JWTs.

## Features

- **Authentication**: login and register with reactive-form validation; JWTs are stored client-side and the user is logged out automatically when the token expires.
- **Role-based access (Admin / User)**: `authGuard`, `guestGuard`, and a `roleGuard` that runs as a `canMatch` guard, so non-admins never download the admin chunk. The navigation adapts to the user's role.
- **HTTP interceptors**:
  - `authInterceptor` attaches the bearer token.
  - `errorInterceptor` logs the user out on 401 and shows a snackbar for other errors.
  - `loadingInterceptor` drives the global progress bar.
- **Users table (admin)**: server-side search, role and status filters, column sorting and pagination, combined with RxJS `merge` + `switchMap` so stale requests are cancelled. Admins can edit, suspend and delete users through Material dialogs.
- **Sales charts**: a monthly revenue line chart (year over year), revenue by category and revenue by region, plus KPI tiles. Each chart has an accessible table view.
- **Dark mode**: Material M3 `light-dark()` tokens with a persisted toggle. It respects the OS preference, avoids a light flash on load, and re-themes the charts.
- **Lazy loading**: every route, including the shell, is lazy-loaded. The initial bundle is about 125 kB transferred.
- Standalone components, signals, zoneless change detection, and functional guards and interceptors.

## Run it

```bash
npm install
npm start          # starts the API on :3000 and Angular on :4200 (proxied /api)
```

Open http://localhost:4200 and sign in with a demo account:

| Role  | Email            | Password |
|-------|------------------|----------|
| Admin | admin@demo.com   | admin123 |
| User  | user@demo.com    | user123  |

Other scripts: `npm run api`, `npm run web`, `npm run build`, `npm run reset-db` (the API re-seeds on its next start).

## Project structure

```
server/                 Express mock API (JWT + bcrypt), seeds server/db.json
src/app/
  core/
    auth/               AuthService (signals, JWT decode, auto-logout), guards
    interceptors.ts     auth / error / loading interceptors
    services/           theme, loading, users + sales data services
  layout/shell.*        sidenav + toolbar (lazy)
  features/
    auth/               login, register (lazy child routes)
    dashboard/          KPI tiles + Chart.js charts
    users/              admin-only table, edit/confirm dialogs
    profile/            account + decoded JWT claims
    errors/             forbidden, not found
  shared/chart.ts       theme-aware Chart.js wrapper
```

## API

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/login`, `/api/auth/register` | public |
| GET | `/api/auth/me`, `/api/sales`, `/api/stats` | signed in |
| GET | `/api/users?q=&role=&status=&_sort=&_order=&_page=&_limit=` | admin (`X-Total-Count` header) |
| PATCH / DELETE | `/api/users/:id` | admin |

> The JWT secret in `server/server.js` is for local demos only; set `JWT_SECRET` in any real deployment.
