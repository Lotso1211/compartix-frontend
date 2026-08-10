import { Component, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { GOOGLE_CLIENT_ID } from '../../../core/config/google.config';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit {

  form: FormGroup;
  loading = false;
  hidePassword = true;
  googleHabilitado = !!GOOGLE_CLIENT_ID;

  // Paso 2 del login: código de verificación enviado por correo.
  esperandoCodigo2fa = false;
  emailPendiente2fa = '';
  codigo2fa = '';
  reenviando2fa = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngAfterViewInit(): void {
    if (!this.googleHabilitado) return;
    // Cargar el script de Google Identity Services y renderizar el botón oficial
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => this.iniciarGoogle();
    document.head.appendChild(script);
  }

  private iniciarGoogle(): void {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      // El callback llega fuera de Angular → NgZone para que la navegación funcione
      callback: (resp: any) => this.zone.run(() => this.loginConGoogle(resp.credential))
    });
    google.accounts.id.renderButton(document.getElementById('googleBtn'), {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      locale: 'es',
      width: 320
    });
  }

  private loginConGoogle(idToken: string): void {
    this.loading = true;
    this.authService.loginConGoogle(idToken).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.requiere2fa) {
          this.emailPendiente2fa = resp.usuario?.email || this.form.value.email;
          this.esperandoCodigo2fa = true;
        } else {
          this.router.navigate(['/app']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'No se pudo iniciar sesión con Google',
          'Cerrar',
          { duration: 4000, panelClass: ['snack-error'] }
        );
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.authService.login(this.form.value).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.requiere2fa) {
          this.emailPendiente2fa = this.form.value.email;
          this.esperandoCodigo2fa = true;
        } else {
          this.router.navigate(['/app']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'Credenciales incorrectas',
          'Cerrar',
          { duration: 3000, panelClass: ['snack-error'] }
        );
      }
    });
  }

  confirmarCodigo2fa(): void {
    if (!this.codigo2fa || this.codigo2fa.length !== 6) return;

    this.loading = true;
    this.authService.verificar2fa(this.emailPendiente2fa, this.codigo2fa).subscribe({
      next: () => this.router.navigate(['/app']),
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'Código inválido o expirado',
          'Cerrar',
          { duration: 3000, panelClass: ['snack-error'] }
        );
      }
    });
  }

  reenviarCodigo2fa(): void {
    this.reenviando2fa = true;
    this.authService.reenviar2fa(this.emailPendiente2fa).subscribe({
      next: () => {
        this.reenviando2fa = false;
        this.snackBar.open('Te enviamos un nuevo código', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.reenviando2fa = false;
        this.snackBar.open('No se pudo reenviar el código', 'Cerrar', { duration: 3000 });
      }
    });
  }

  volverALogin(): void {
    this.esperandoCodigo2fa = false;
    this.codigo2fa = '';
  }
}
