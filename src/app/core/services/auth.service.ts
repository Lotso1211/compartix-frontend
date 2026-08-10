import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest, Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarUsuarioDeStorage();
  }

  private cargarUsuarioDeStorage(): void {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      this.usuarioSubject.next(JSON.parse(usuarioStr));
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => { if (!response.requiere2fa) this.guardarSesion(response); })
    );
  }

  loginConGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { idToken }).pipe(
      tap(response => { if (!response.requiere2fa) this.guardarSesion(response); })
    );
  }

  /** Segundo paso del login cuando el backend pide codigo de verificacion por correo. */
  verificar2fa(email: string, codigo: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verificar-2fa`, { email, codigo }).pipe(
      tap(response => this.guardarSesion(response))
    );
  }

  reenviar2fa(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reenviar-2fa`, null, { params: { email } });
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.guardarSesion(response))
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, null, {
        params: { token: refreshToken }
      }).subscribe();
    }
    localStorage.clear();
    this.usuarioSubject.next(null);
  }

  // Se llama solo cuando el login ya esta completo (requiere2fa=false), asi que
  // accessToken/refreshToken/usuario siempre vienen presentes en ese caso.
  private guardarSesion(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken!);
    localStorage.setItem('refreshToken', response.refreshToken!);
    localStorage.setItem('usuario', JSON.stringify(response.usuario));
    this.usuarioSubject.next(response.usuario ?? null);
  }

  getUsuarioActual(): Usuario | null {
    return this.usuarioSubject.value;
  }

  /** Actualiza el usuario en sesión (localStorage + observable) tras editar el perfil. */
  actualizarUsuarioLocal(usuario: Usuario): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}