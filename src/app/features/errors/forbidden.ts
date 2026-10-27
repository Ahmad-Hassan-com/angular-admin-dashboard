import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="page error-page">
      <mat-icon class="big">lock</mat-icon>
      <h1>Access denied</h1>
      <p class="muted">You need the Admin role to open that page.</p>
      <a mat-flat-button routerLink="/dashboard">Back to dashboard</a>
    </div>
  `,
  styles: `
    .error-page {
      text-align: center;
      padding-top: 80px;
    }
    .big {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-sys-error);
    }
  `,
})
export default class Forbidden {}
