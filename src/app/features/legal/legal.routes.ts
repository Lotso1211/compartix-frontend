import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'privacidad',
    pathMatch: 'full'
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./privacidad/privacidad.component').then(m => m.PrivacidadComponent)
  },
  {
    path: 'terminos',
    loadComponent: () => import('./terminos/terminos.component').then(m => m.TerminosComponent)
  }
];
