import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'grupo/:id',
    loadComponent: () => import('../grupo/grupo-detail/grupo-detail.component').then(m => m.GrupoDetailComponent)
  },
  {
    path: 'kardex/:grupoId',
    loadComponent: () => import('../kardex/kardex-view/kardex-view.component').then(m => m.KardexViewComponent)
  },
  {
    path: 'reportes/:grupoId',
    loadComponent: () => import('../reportes/reportes-view/reportes-view.component').then(m => m.ReportesViewComponent)
  },
  {
    path: 'perfil',
    loadComponent: () => import('../perfil/perfil.component').then(m => m.PerfilComponent)
  },
  {
    path: 'ia/:grupoId',
    loadComponent: () => import('../ia/ia.component').then(m => m.IaComponent)
  },
  {
    path: 'metricas-ia',
    loadComponent: () => import('../ia/metricas-ia/metricas-ia.component').then(m => m.MetricasIaComponent)
  }
];