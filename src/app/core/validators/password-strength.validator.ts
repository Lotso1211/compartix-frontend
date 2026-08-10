import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PasswordRules {
  minLength: boolean;
  hasUppercase: boolean;
  hasSpecial: boolean;
  noQuotes: boolean;
}

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value || '';
    const rules = getPasswordRules(value);
    const isValid = Object.values(rules).every(r => r);
    return isValid ? null : { passwordWeak: rules };
  };
}

export function getPasswordRules(value: string): PasswordRules {
  return {
    minLength:    value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasSpecial:   /[^A-Za-z0-9\s'"]/.test(value),
    noQuotes:     !/['"]/.test(value)
  };
}

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password    = control.get('password');
  const confirmar   = control.get('confirmarPassword');
  if (!password || !confirmar) return null;
  if (confirmar.value && password.value !== confirmar.value) {
    confirmar.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    const errors = { ...confirmar.errors };
    delete errors['passwordMismatch'];
    confirmar.setErrors(Object.keys(errors).length ? errors : null);
    return null;
  }
}