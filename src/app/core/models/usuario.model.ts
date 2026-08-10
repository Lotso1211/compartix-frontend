export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  fotoUrl?: string;
}

export interface AuthResponse {
  // accessToken/refreshToken/usuario vienen nulos cuando requiere2fa es true:
  // el login todavia no esta completo hasta verificar el codigo.
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  usuario?: Usuario;
  requiere2fa?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  password: string;
}