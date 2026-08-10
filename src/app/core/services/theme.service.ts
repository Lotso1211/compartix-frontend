import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private darkSubject = new BehaviorSubject<boolean>(false);
  dark$ = this.darkSubject.asObservable();

  /** Aplica el tema guardado. Llamar una vez al iniciar la app. */
  init(): void {
    const saved = localStorage.getItem('darkMode') === 'true';
    this.aplicar(saved);
  }

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  toggle(): void {
    this.aplicar(!this.darkSubject.value);
  }

  private aplicar(dark: boolean): void {
    this.darkSubject.next(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('darkMode', String(dark));
  }
}
