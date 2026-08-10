import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IaService, MetricasModelo } from '../../../core/services/ia.service';

interface FilaIntencion {
  intencion: string;
  precision: number;
  recall: number;
  f1: number;
  support: number;
  ejemplos: number;
}

@Component({
  selector: 'app-metricas-ia',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './metricas-ia.component.html',
  styleUrl: './metricas-ia.component.scss'
})
export class MetricasIaComponent implements OnInit {

  metricas: MetricasModelo | null = null;
  filas: FilaIntencion[] = [];
  loading = true;

  constructor(private iaService: IaService, private location: Location) {}

  ngOnInit(): void {
    this.iaService.obtenerMetricas().subscribe({
      next: (m) => {
        this.metricas = m;
        if (m.disponible && m.porIntencion) {
          this.filas = Object.entries(m.porIntencion).map(([intencion, v]) => ({
            intencion,
            precision: v.precision,
            recall: v.recall,
            f1: v.f1,
            support: v.support,
            ejemplos: v.ejemplos
          })).sort((a, b) => b.f1 - a.f1);
        }
        this.loading = false;
      },
      error: () => {
        this.metricas = { disponible: false, error: 'No se pudo conectar con el backend.' };
        this.loading = false;
      }
    });
  }

  pct(v: number | undefined): string {
    return v != null ? (v * 100).toFixed(1) + '%' : '—';
  }

  /** Color según el valor (verde alto, ámbar medio, rojo bajo). */
  colorF1(v: number): string {
    if (v >= 0.85) return '#10B981';
    if (v >= 0.6) return '#F59E0B';
    return '#EF4444';
  }

  volver(): void {
    this.location.back();
  }
}
