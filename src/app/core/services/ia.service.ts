import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IaConsultaResponse {
  respuesta:              string;
  intencion:              string;
  confianza:              number;
  esAccion?:              boolean;
  accionRealizada?:       string;
  movimientoRegistradoId?: number;
}

export interface IaEscaneoResponse {
  monto:          number | null;
  fecha:          string | null;
  descripcion:    string | null;
  textoExtraido:  string | null;
  tipoDocumento?: string | null;
  confianza?:     number | null;
  resumen?:       string | null;
  exitoso:        boolean;
}

export interface MetricaIntencion {
  precision: number;
  recall:    number;
  f1:        number;
  support:   number;
  ejemplos:  number;
}

export interface MetricasModelo {
  disponible:           boolean;
  error?:               string;
  accuracy?:            number;
  macroAvgF1?:          number;
  weightedAvgF1?:       number;
  crossValMean?:        number;
  crossValStd?:         number;
  totalEjemplos?:       number;
  totalIntenciones?:    number;
  ejemplosEntrenamiento?: number;
  ejemplosPrueba?:      number;
  porIntencion?:        { [intencion: string]: MetricaIntencion };
}

@Injectable({ providedIn: 'root' })
export class IaService {

  private readonly base = `${environment.apiUrl}/grupos`;

  constructor(private http: HttpClient) {}

  consultar(grupoId: number, pregunta: string): Observable<IaConsultaResponse> {
    return this.http.post<IaConsultaResponse>(
      `${this.base}/${grupoId}/ia/consulta`,
      { pregunta }
    );
  }

  escanear(grupoId: number, imagen: File): Observable<IaEscaneoResponse> {
    const form = new FormData();
    form.append('imagen', imagen);
    return this.http.post<IaEscaneoResponse>(
      `${this.base}/${grupoId}/ia/escanear`,
      form
    );
  }

  obtenerMetricas(): Observable<MetricasModelo> {
    return this.http.get<MetricasModelo>(`${environment.apiUrl}/ia/metricas`);
  }
}
