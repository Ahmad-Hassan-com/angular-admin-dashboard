import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
})
export class App {
  // Instantiated here so the saved theme is applied before any page renders.
  protected readonly theme = inject(ThemeService);
}
