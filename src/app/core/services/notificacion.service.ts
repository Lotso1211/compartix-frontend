import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  grupoId?: number;
  nombreGrupo?: string;
  creadoEn: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {

  private apiUrl = `${environment.apiUrl}/notificaciones`;

  // Contador reactivo para el badge del navbar
  private noLeidasSubject = new BehaviorSubject<number>(0);
  noLeidas$ = this.noLeidasSubject.asObservable();

  constructor(private http: HttpClient) {}

  listar(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.apiUrl);
  }

  refrescarContador(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/no-leidas/count`)
      .subscribe({
        next: (r) => this.noLeidasSubject.next(r.count),
        error: () => this.noLeidasSubject.next(0)
      });
  }

  marcarLeida(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/leer`, null)
      .pipe(tap(() => this.refrescarContador()));
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/leer-todas`, null)
      .pipe(tap(() => this.noLeidasSubject.next(0)));
  }
}
