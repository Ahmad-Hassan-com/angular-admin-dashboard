import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="page error-page">
      <mat-icon class="big">travel_explore</mat-icon>
      <h1>Page not found</h1>
      <p class="muted">The page you're looking for doesn't exist.</p>
      <a mat-flat-button routerLink="/">Go home</a>
    </div>
  `,
  styles: `
    .error-page {
      text-align: center;
      padding-top: 120px;
    }
    .big {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-primary);
    }
  `,
})
export default class NotFound {}
