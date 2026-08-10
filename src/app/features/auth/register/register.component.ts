import { Component, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { GOOGLE_CLIENT_ID } from '../../../core/config/google.config';
import {
  passwordStrengthValidator,
  passwordMatchValidator,
  getPasswordRules,
  PasswordRules
} from '../../../core/validators/password-strength.validator';

declare const google: any;

@Component({
  selector: 'app-register',
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
    MatSnackBarModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements AfterViewInit {

  form: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmar = true;
  passwordFocused = false;
  googleHabilitado = !!GOOGLE_CLIENT_ID;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    this.form = this.fb.group({
      nombre:            ['', [Validators.required, Validators.minLength(2)]],
      apellido:          ['', [Validators.required, Validators.minLength(2)]],
      email:             ['', [Validators.required, Validators.email]],
      telefono:          [''],
      password:          ['', [Validators.required, passwordStrengthValidator()]],
      confirmarPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngAfterViewInit(): void {
    if (!this.googleHabilitado) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => this.iniciarGoogle();
    document.head.appendChild(script);
  }

  private iniciarGoogle(): void {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp: any) => this.zone.run(() => this.loginConGoogle(resp.credential))
    });
    google.accounts.id.renderButton(document.getElementById('googleBtn'), {
      theme: 'outline',
      size: 'large',
      text: 'signup_with',
      locale: 'es',
      width: 320
    });
  }

  private loginConGoogle(idToken: string): void {
    this.loading = true;
    this.authService.loginConGoogle(idToken).subscribe({
      next: () => this.router.navigate(['/app']),
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'No se pudo continuar con Google',
          'Cerrar',
          { duration: 4000, panelClass: ['snack-error'] }
        );
      }
    });
  }

  get passwordRules(): PasswordRules {
    return getPasswordRules(this.form.get('password')?.value || '');
  }

  get showChecklist(): boolean {
    const ctrl = this.form.get('password');
    return this.passwordFocused || (!!ctrl?.value && ctrl?.invalid);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { confirmarPassword, ...payload } = this.form.value;

    this.authService.register(payload).subscribe({
      next: () => {
        this.snackBar.open('¡Cuenta creada exitosamente!', 'Cerrar', {
          duration: 3000,
          panelClass: ['snack-success']
        });
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'Error al crear la cuenta',
          'Cerrar',
          { duration: 3000, panelClass: ['snack-error'] }
        );
      }
    });
  }
}