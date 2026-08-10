import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GrupoService } from '../../../core/services/grupo.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService, Notificacion } from '../../../core/services/notificacion.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Grupo } from '../../../core/models/grupo.model';
import { Usuario } from '../../../core/models/usuario.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  grupos: Grupo[] = [];
  usuario: Usuario | null = null;
  loading = true;
  darkMode = false;

  // Notificaciones
  notificaciones: Notificacion[] = [];
  noLeidas = 0;
  showNotificaciones = false;
  loadingNotis = false;

  // Modal states
  showCrearGrupo = false;
  showUnirse = false;
  nombreGrupo = '';
  descripcionGrupo = '';
  cuotaBase = 0;
  moneda = 'BOB';
  codigoInvitacion = '';
  loadingAction = false;

  constructor(
    private grupoService: GrupoService,
    private authService: AuthService,
    private notificacionService: NotificacionService,
    private themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    this.cargarGrupos();
    this.themeService.dark$.subscribe(d => this.darkMode = d);
    this.notificacionService.noLeidas$.subscribe(n => this.noLeidas = n);
    this.notificacionService.refrescarContador();
    // Abrir el panel si venimos de la campana de otra pantalla (?notis=1)
    if (this.route.snapshot.queryParamMap.get('notis')) {
      this.toggleNotificaciones();
    }
  }

  toggleNotificaciones(): void {
    this.showNotificaciones = !this.showNotificaciones;
    if (this.showNotificaciones) {
      this.loadingNotis = true;
      this.notificacionService.listar().subscribe({
        next: (n) => { this.notificaciones = n; this.loadingNotis = false; },
        error: () => { this.loadingNotis = false; }
      });
    }
  }

  marcarLeida(noti: Notificacion): void {
    if (noti.leida) return;
    this.notificacionService.marcarLeida(noti.id).subscribe(() => noti.leida = true);
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe(() => {
      this.notificaciones.forEach(n => n.leida = true);
    });
  }

  iconoNoti(tipo: string): string {
    switch (tipo) {
      case 'MULTA': return 'gavel';
      case 'RECORDATORIO': return 'event';
      case 'APORTE_REGISTRADO': return 'payments';
      case 'GASTO': return 'shopping_cart';
      case 'MORA_CUOTA': return 'schedule';
      case 'FONDO_BAJO': return 'trending_down';
      case 'GRUPO': return 'group';
      case 'PEDIDO': return 'local_mall';
      default: return 'notifications';
    }
  }

  cargarGrupos(): void {
    this.loading = true;
    this.grupoService.obtenerMisGrupos().subscribe({
      next: (grupos) => {
        this.grupos = grupos;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  crearGrupo(): void {
    if (!this.nombreGrupo.trim()) return;
    this.loadingAction = true;
    this.grupoService.crearGrupo({
      nombre: this.nombreGrupo,
      descripcion: this.descripcionGrupo,
      cuotaBase: this.cuotaBase,
      moneda: this.moneda
    }).subscribe({
      next: (grupo) => {
        this.grupos.unshift(grupo);
        this.showCrearGrupo = false;
        this.nombreGrupo = '';
        this.descripcionGrupo = '';
        this.cuotaBase = 0;
        this.loadingAction = false;
        this.snackBar.open('¡Grupo creado exitosamente!', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al crear grupo', 'Cerrar', { duration: 3000 });
      }
    });
  }

  unirseGrupo(): void {
    if (!this.codigoInvitacion.trim()) return;
    this.loadingAction = true;
    this.grupoService.unirseAGrupo(this.codigoInvitacion).subscribe({
      next: (grupo) => {
        this.grupos.unshift(grupo);
        this.showUnirse = false;
        this.codigoInvitacion = '';
        this.loadingAction = false;
        this.snackBar.open('¡Te uniste al grupo exitosamente!', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Código inválido', 'Cerrar', { duration: 3000 });
      }
    });
  }

  
  irAPerfil(): void {
  this.router.navigate(['/app/perfil']);
}


  irAGrupo(grupo: Grupo): void {
    this.router.navigate(['/app/grupo', grupo.id]);
  }

  toggleDarkMode(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getInitiales(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  getColorGrupo(index: number): string {
    const colors = ['#0E6B4F', '#1F2937', '#0A4C38', '#334155', '#14532D', '#3F3F2E'];
    return colors[index % colors.length];
  }

  irAIa(grupoId: number): void {
  this.router.navigate(['/app/ia', grupoId]);
}

}