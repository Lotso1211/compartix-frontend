import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SolicitudPagoResponse {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  tipo: 'CUOTA' | 'MULTA';
  cuotaId?: number;
  multaId?: number;
  descripcion: string;
  monto: number;
  comprobanteUrl: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  motivoRechazo?: string;
  revisadoPor?: string;
  fechaRevision?: string;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudPagoService {
  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  subirComprobanteCuota(grupoId: number, cuotaId: number, comprobante: File): Observable<SolicitudPagoResponse> {
    const form = new FormData();
    form.append('comprobante', comprobante);
    return this.http.post<SolicitudPagoResponse>(
      `${this.apiUrl}/${grupoId}/solicitudes-pago/cuota/${cuotaId}`, form);
  }

  subirComprobanteMulta(grupoId: number, multaId: number, comprobante: File): Observable<SolicitudPagoResponse> {
    const form = new FormData();
    form.append('comprobante', comprobante);
    return this.http.post<SolicitudPagoResponse>(
      `${this.apiUrl}/${grupoId}/solicitudes-pago/multa/${multaId}`, form);
  }

  listar(grupoId: number, estado?: string): Observable<SolicitudPagoResponse[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<SolicitudPagoResponse[]>(`${this.apiUrl}/${grupoId}/solicitudes-pago`, { params });
  }

  misSolicitudes(grupoId: number): Observable<SolicitudPagoResponse[]> {
    return this.http.get<SolicitudPagoResponse[]>(`${this.apiUrl}/${grupoId}/solicitudes-pago/mis-solicitudes`);
  }

  aprobar(grupoId: number, solicitudId: number): Observable<SolicitudPagoResponse> {
    return this.http.patch<SolicitudPagoResponse>(
      `${this.apiUrl}/${grupoId}/solicitudes-pago/${solicitudId}/aprobar`, null);
  }

  rechazar(grupoId: number, solicitudId: number, motivo?: string): Observable<SolicitudPagoResponse> {
    return this.http.patch<SolicitudPagoResponse>(
      `${this.apiUrl}/${grupoId}/solicitudes-pago/${solicitudId}/rechazar`, { motivo });
  }
}
