import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PedidoItemDetalle {
  usuarioId: number;
  nombreUsuario: string;
  cantidad: number;
  subtotal: number;
}

export interface PedidoItemResponse {
  id: number;
  nombre: string;
  precioUnitario: number;
  descripcion?: string;
  detalles: PedidoItemDetalle[];
  totalItem: number;
}

export interface PedidoResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  fecha: string;
  items: PedidoItemResponse[];
  totalGeneral: number;
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  crearPedido(grupoId: number, request: any): Observable<PedidoResponse> {
    return this.http.post<PedidoResponse>(`${this.apiUrl}/${grupoId}/pedidos`, request);
  }

  actualizarPedido(grupoId: number, pedidoId: number, request: any): Observable<PedidoResponse> {
    return this.http.put<PedidoResponse>(`${this.apiUrl}/${grupoId}/pedidos/${pedidoId}`, request);
  }

  obtenerPedidos(grupoId: number): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(`${this.apiUrl}/${grupoId}/pedidos`);
  }

  obtenerPedido(grupoId: number, pedidoId: number): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${this.apiUrl}/${grupoId}/pedidos/${pedidoId}`);
  }

  cerrarPedido(grupoId: number, pedidoId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${grupoId}/pedidos/${pedidoId}/cerrar`, null);
  }

  eliminarPedido(grupoId: number, pedidoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${grupoId}/pedidos/${pedidoId}`);
  }
}