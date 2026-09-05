import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Movimiento,
  RegistrarAporteRequest,
  RegistrarGastoCompartidoRequest,
  RegistrarGastoIndividualRequest,
  RegistrarMultaRequest,
  RegistrarIngresoDirectoRequest,
  RegistrarGastoDirectoRequest
} from '../models/movimiento.model';

@Injectable({
  providedIn: 'root'
})
export class MovimientoService {

  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  registrarAporte(grupoId: number, request: RegistrarAporteRequest): Observable<Movimiento> {
    return this.http.post<Movimiento>(`${this.apiUrl}/${grupoId}/movimientos/aporte`, request);
  }

  registrarGastoCompartido(grupoId: number, request: RegistrarGastoCompartidoRequest): Observable<Movimiento> {
    return this.http.post<Movimiento>(`${this.apiUrl}/${grupoId}/movimientos/gasto-compartido`, request);
  }

  registrarGastoIndividual(grupoId: number, request: RegistrarGastoIndividualRequest): Observable<Movimiento> {
    return this.http.post<Movimiento>(`${this.apiUrl}/${grupoId}/movimientos/gasto-individual`, request);
  }

  registrarMulta(grupoId: number, request: RegistrarMultaRequest): Observable<Movimiento> {
    return this.http.post<Movimiento>(`${this.apiUrl}/${grupoId}/movimientos/multa`, request);
  }

  obtenerMovimientos(grupoId: number): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.apiUrl}/${grupoId}/movimientos`);
  }
  obtenerMisMovimientos(grupoId: number): Observable<Movimiento[]> {
  return this.http.get<Movimiento[]>(
    `${environment.apiUrl}/grupos/${grupoId}/movimientos/mis-movimientos`
  );
}
obtenerDetalleMovimiento(grupoId: number, movimientoId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${environment.apiUrl}/grupos/${grupoId}/movimientos/${movimientoId}/detalle`
  );
}
registrarIngresoDirecto(grupoId: number, request: RegistrarIngresoDirectoRequest): Observable<Movimiento> {
  return this.http.post<Movimiento>(
    `${environment.apiUrl}/grupos/${grupoId}/movimientos/ingreso-directo`,
    request
  );
}
registrarGastoDirecto(grupoId: number, request: RegistrarGastoDirectoRequest): Observable<Movimiento> {
  return this.http.post<Movimiento>(
    `${environment.apiUrl}/grupos/${grupoId}/movimientos/gasto-directo`,
    request
  );
}
obtenerMiDetalleMovimiento(grupoId: number, movimientoId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${environment.apiUrl}/grupos/${grupoId}/movimientos/${movimientoId}/mi-detalle`
  );
}

eliminarMovimiento(grupoId: number, movimientoId: number): Observable<void> {
  return this.http.delete<void>(
    `${environment.apiUrl}/grupos/${grupoId}/movimientos/${movimientoId}`
  );
}

}