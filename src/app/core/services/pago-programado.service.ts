import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PagoProgramadoResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  montoMensual: number;
  montoCarnaval?: number;
  montoAhorro?: number;
  fechaInicio: string;
  fechaFin: string;
  diaLimitePago: number;
  tipoMulta: string;
  montoMulta?: number;
  porcentajeMulta?: number;
  activo: boolean;
}

export interface CuotaResponse {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  pagoProgramadoId: number;
  nombrePago: string;
  anio: number;
  mes: number;
  monto: number;
  montoCarnaval?: number;
  montoAhorro?: number;
  estado: string;
  fechaPago?: string;
  multaAplicada: boolean;
  montoMulta: number;
  motivoAnulacion?: string;
}

export interface ReactivacionInfo {
  conCarnaval: boolean;
  ahorroAdeudado: number;
  carnavalAdeudado: number;
  total: number;
}

export interface MiembroFaltante {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class PagoProgramadoService {
  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  crearPagoProgramado(grupoId: number, request: any): Observable<PagoProgramadoResponse> {
    return this.http.post<PagoProgramadoResponse>(`${this.apiUrl}/${grupoId}/pagos-programados`, request);
  }

  obtenerPagosProgramados(grupoId: number): Observable<PagoProgramadoResponse[]> {
    return this.http.get<PagoProgramadoResponse[]>(`${this.apiUrl}/${grupoId}/pagos-programados`);
  }

  obtenerCuotasMes(grupoId: number, anio: number, mes: number): Observable<CuotaResponse[]> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<CuotaResponse[]>(`${this.apiUrl}/${grupoId}/pagos-programados/cuotas`, { params });
  }

  obtenerMisCuotas(grupoId: number): Observable<CuotaResponse[]> {
    return this.http.get<CuotaResponse[]>(`${this.apiUrl}/${grupoId}/pagos-programados/mis-cuotas`);
  }

  marcarCuotaPagada(grupoId: number, cuotaId: number): Observable<CuotaResponse> {
    return this.http.patch<CuotaResponse>(`${this.apiUrl}/${grupoId}/pagos-programados/cuotas/${cuotaId}/pagar`, null);
  }

  anularCuota(grupoId: number, cuotaId: number, motivo: string): Observable<CuotaResponse> {
    return this.http.patch<CuotaResponse>(
      `${this.apiUrl}/${grupoId}/pagos-programados/cuotas/${cuotaId}/anular`, { motivo });
  }

  revertirAnulacionCuota(grupoId: number, cuotaId: number): Observable<CuotaResponse> {
    return this.http.patch<CuotaResponse>(
      `${this.apiUrl}/${grupoId}/pagos-programados/cuotas/${cuotaId}/revertir-anulacion`, null);
  }

  obtenerHistorialCuotas(grupoId: number, pagoProgramadoId: number): Observable<CuotaResponse[]> {
    return this.http.get<CuotaResponse[]>(
      `${this.apiUrl}/${grupoId}/pagos-programados/${pagoProgramadoId}/cuotas`);
  }

  verificarMultas(grupoId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${grupoId}/pagos-programados/verificar-multas`, null);
  }
  finalizarPagoProgramado(grupoId: number, pagoProgramadoId: number): Observable<void> {
  return this.http.patch<void>(
    `${this.apiUrl}/${grupoId}/pagos-programados/${pagoProgramadoId}/desactivar`,
    null
  );
}

  // ── Gestión de miembros inactivos ──────────────────────────
  inactivarMiembro(grupoId: number, usuarioId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${grupoId}/pagos-programados/miembros/${usuarioId}/inactivar`, null);
  }

  cambiarParticipacionCarnaval(grupoId: number, usuarioId: number, participa: boolean): Observable<void> {
    const params = new HttpParams().set('participa', participa);
    return this.http.patch<void>(
      `${this.apiUrl}/${grupoId}/pagos-programados/miembros/${usuarioId}/participacion-carnaval`, null, { params });
  }

  infoReactivacion(grupoId: number, usuarioId: number, conCarnaval: boolean): Observable<ReactivacionInfo> {
    const params = new HttpParams().set('conCarnaval', conCarnaval);
    return this.http.get<ReactivacionInfo>(
      `${this.apiUrl}/${grupoId}/pagos-programados/miembros/${usuarioId}/reactivacion-info`, { params });
  }

  reactivarMiembro(grupoId: number, usuarioId: number, conCarnaval: boolean): Observable<ReactivacionInfo> {
    const params = new HttpParams().set('conCarnaval', conCarnaval);
    return this.http.patch<ReactivacionInfo>(
      `${this.apiUrl}/${grupoId}/pagos-programados/miembros/${usuarioId}/reactivar`, null, { params });
  }

  // ── Añadir a un miembro nuevo a un pago programado ya en curso ──
  obtenerMiembrosFaltantes(grupoId: number, pagoProgramadoId: number): Observable<MiembroFaltante[]> {
    return this.http.get<MiembroFaltante[]>(
      `${this.apiUrl}/${grupoId}/pagos-programados/${pagoProgramadoId}/miembros-faltantes`);
  }

  agregarMiembroAPago(grupoId: number, pagoProgramadoId: number, usuarioId: number): Observable<CuotaResponse[]> {
    return this.http.post<CuotaResponse[]>(
      `${this.apiUrl}/${grupoId}/pagos-programados/${pagoProgramadoId}/miembros/${usuarioId}`, null);
  }
}