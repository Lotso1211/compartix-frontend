import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Kardex } from '../models/kardex.model';

@Injectable({
  providedIn: 'root'
})
export class KardexService {

  private apiUrl = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  obtenerMiKardex(grupoId: number): Observable<Kardex> {
    return this.http.get<Kardex>(`${this.apiUrl}/${grupoId}/kardex/mio`);
  }

  obtenerKardexMiembro(grupoId: number, usuarioId: number): Observable<Kardex> {
    return this.http.get<Kardex>(`${this.apiUrl}/${grupoId}/kardex/${usuarioId}`);
  }

  obtenerKardexGrupo(grupoId: number): Observable<Kardex[]> {
    return this.http.get<Kardex[]>(`${this.apiUrl}/${grupoId}/kardex`);
  }
}