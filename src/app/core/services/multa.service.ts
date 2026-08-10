import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MultaResponse {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  motivo: string;
  monto: number;
  estado: string;
  fecha: string;
  fechaPago?: string;
  periodoMes?: number;
  periodoAnio?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MultaService {

  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  obtenerMultas(grupoId: number): Observable<MultaResponse[]> {
    return this.http.get<MultaResponse[]>(`${this.apiUrl}/${grupoId}/multas`);
  }

  obtenerMisMultas(grupoId: number): Observable<MultaResponse[]> {
    return this.http.get<MultaResponse[]>(`${this.apiUrl}/${grupoId}/multas/mis-multas`);
  }

  marcarComoPagada(grupoId: number, multaId: number): Observable<MultaResponse> {
    return this.http.patch<MultaResponse>(`${this.apiUrl}/${grupoId}/multas/${multaId}/pagar`, null);
  }

  eliminarMulta(grupoId: number, multaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${grupoId}/multas/${multaId}`);
  }
}