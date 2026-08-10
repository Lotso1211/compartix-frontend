import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'compartix-frontend';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Aplica el tema (claro/oscuro) globalmente al iniciar, en cualquier ruta.
    this.themeService.init();
  }
};