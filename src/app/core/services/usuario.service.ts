import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNuevo: string;   // debe coincidir con el DTO del backend
}

export interface ActualizarPerfilRequest {
  nombre: string;
  apellido: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private readonly url = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  cambiarPassword(request: CambiarPasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.url}/cambiar-password`, request);
  }

  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.url}/perfil`);
  }

  actualizarPerfil(request: ActualizarPerfilRequest): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/perfil`, request);
  }

  subirFoto(foto: File): Observable<{ fotoUrl: string }> {
    const form = new FormData();
    form.append('foto', foto);
    return this.http.post<{ fotoUrl: string }>(`${this.url}/foto`, form);
  }
}
