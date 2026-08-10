import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { NotificacionService, Notificacion } from '../../core/services/notificacion.service';
import { Usuario } from '../../core/models/usuario.model';
import {
  passwordStrengthValidator,
  passwordMatchValidator,
  getPasswordRules,
  PasswordRules
} from '../../core/validators/password-strength.validator';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatTabsModule
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {

  // Cambio de contraseña
  form: FormGroup;
  loading = false;
  hideActual = true;
  hideNueva = true;
  hideConfirmar = true;
  passwordFocused = false;

  // Edición de perfil
  perfilForm: FormGroup;
  loadingPerfil = false;
  subiendoFoto = false;

  usuario: Usuario | null = null;

  // Historial de actividad
  historial: Notificacion[] = [];
  loadingHistorial = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      passwordActual:    ['', Validators.required],
      passwordNueva:     ['', [Validators.required, passwordStrengthValidator()]],
      confirmarPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    this.perfilForm = this.fb.group({
      nombre:   ['', [Validators.required, Validators.maxLength(100)]],
      apellido: ['', [Validators.required, Validators.maxLength(100)]],
      telefono: ['', [Validators.maxLength(20)]]
    });
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuarioActual();
    this.parchearForm();
    // Refrescar desde el backend por si cambió en otra sesión
    this.usuarioService.obtenerPerfil().subscribe({
      next: (u) => { this.usuario = { ...this.usuario, ...u }; this.parchearForm(); },
      error: () => {}
    });
    this.cargarHistorial();
  }

  private parchearForm(): void {
    if (this.usuario) {
      this.perfilForm.patchValue({
        nombre: this.usuario.nombre,
        apellido: this.usuario.apellido,
        telefono: this.usuario.telefono || ''
      });
    }
  }

  cargarHistorial(): void {
    this.loadingHistorial = true;
    this.notificacionService.listar().subscribe({
      next: (n) => { this.historial = n; this.loadingHistorial = false; },
      error: () => { this.loadingHistorial = false; }
    });
  }

  get iniciales(): string {
    if (!this.usuario) return '';
    return `${this.usuario.nombre?.charAt(0) || ''}${this.usuario.apellido?.charAt(0) || ''}`.toUpperCase();
  }

  // ── Editar datos ────────────────────────────────────────
  guardarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }
    this.loadingPerfil = true;
    this.usuarioService.actualizarPerfil(this.perfilForm.value).subscribe({
      next: (u) => {
        this.loadingPerfil = false;
        this.usuario = { ...this.usuario, ...u };
        this.authService.actualizarUsuarioLocal(this.usuario);
        this.snackBar.open('✅ Perfil actualizado', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.loadingPerfil = false;
        this.snackBar.open(err.error?.message || 'Error al actualizar', 'Cerrar', { duration: 4000 });
      }
    });
  }

  // ── Subir foto ──────────────────────────────────────────
  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('El archivo debe ser una imagen', 'Cerrar', { duration: 3000 });
      return;
    }
    this.subiendoFoto = true;
    this.usuarioService.subirFoto(file).subscribe({
      next: (r) => {
        this.subiendoFoto = false;
        if (this.usuario) {
          this.usuario = { ...this.usuario, fotoUrl: r.fotoUrl };
          this.authService.actualizarUsuarioLocal(this.usuario);
        }
        this.snackBar.open('✅ Foto actualizada', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.subiendoFoto = false;
        this.snackBar.open(err.error?.message || 'Error al subir la foto', 'Cerrar', { duration: 4000 });
      }
    });
  }

  iconoActividad(tipo: string): string {
    switch (tipo) {
      case 'MULTA': return 'gavel';
      case 'RECORDATORIO': return 'event';
      case 'APORTE_REGISTRADO': return 'payments';
      case 'GASTO': return 'shopping_cart';
      default: return 'notifications';
    }
  }

  // ── Cambio de contraseña (existente) ────────────────────
  get passwordRules(): PasswordRules {
    return getPasswordRules(this.form.get('passwordNueva')?.value || '');
  }

  get showChecklist(): boolean {
    const ctrl = this.form.get('passwordNueva');
    return this.passwordFocused || (!!ctrl?.value && ctrl?.invalid);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { passwordActual, passwordNueva } = this.form.value;

    this.usuarioService.cambiarPassword({ passwordActual, passwordNuevo: passwordNueva }).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('¡Contraseña actualizada exitosamente!', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-success']
        });
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'Error al cambiar la contraseña',
          'Cerrar',
          { duration: 4000, panelClass: ['snack-error'] }
        );
      }
    });
  }

  volver(): void {
    this.router.navigate(['/app']);
  }
}
