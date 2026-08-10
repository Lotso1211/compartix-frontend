import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Grupo, CrearGrupoRequest, SaldoGrupo, MiembroGrupo, ActualizarAlertasRequest } from '../models/grupo.model';

@Injectable({
  providedIn: 'root'
})
export class GrupoService {

  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  crearGrupo(request: CrearGrupoRequest): Observable<Grupo> {
    return this.http.post<Grupo>(this.apiUrl, request);
  }

  unirseAGrupo(codigo: string): Observable<Grupo> {
    return this.http.post<Grupo>(`${this.apiUrl}/unirse`, null, {
      params: { codigo }
    });
  }

  obtenerMisGrupos(): Observable<Grupo[]> {
    return this.http.get<Grupo[]>(`${this.apiUrl}/mis-grupos`);
  }

  obtenerGrupo(grupoId: number): Observable<Grupo> {
    return this.http.get<Grupo>(`${this.apiUrl}/${grupoId}`);
  }

  obtenerSaldoGrupo(grupoId: number): Observable<SaldoGrupo> {
    return this.http.get<SaldoGrupo>(`${this.apiUrl}/${grupoId}/saldo`);
  }

  agregarMiembro(grupoId: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${grupoId}/miembros/${usuarioId}`, null);
  }

  quitarMiembro(grupoId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${grupoId}/miembros/${usuarioId}`);
  }

  obtenerMiRol(grupoId: number): Observable<string> {
  return this.http.get(`${this.apiUrl}/${grupoId}/mi-rol`, { responseType: 'text' });
}

obtenerMiembros(grupoId: number): Observable<MiembroGrupo[]> {
  return this.http.get<MiembroGrupo[]>(`${this.apiUrl}/${grupoId}/miembros`);
}
obtenerMiembrosGestion(grupoId: number): Observable<MiembroGrupo[]> {
  return this.http.get<MiembroGrupo[]>(`${this.apiUrl}/${grupoId}/miembros/gestion`);
}
cambiarRolMiembro(grupoId: number, usuarioId: number, rol: string): Observable<void> {
  return this.http.patch<void>(
    `${this.apiUrl}/${grupoId}/miembros/${usuarioId}/rol`,
    null,
    { params: { rol } }
  );
}

obtenerMovimientosUsuario(grupoId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${environment.apiUrl}/grupos/${grupoId}/movimientos/mis-movimientos`
  );
}

eliminarGrupo(grupoId: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${grupoId}`);
}

actualizarAlertas(grupoId: number, request: ActualizarAlertasRequest): Observable<Grupo> {
  return this.http.patch<Grupo>(`${this.apiUrl}/${grupoId}/alertas`, request);
}

}