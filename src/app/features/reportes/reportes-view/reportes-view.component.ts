import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { GrupoService } from '../../../core/services/grupo.service';
import { KardexService } from '../../../core/services/kardex.service';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { Grupo, SaldoGrupo } from '../../../core/models/grupo.model';
import { Kardex } from '../../../core/models/kardex.model';
import { Movimiento } from '../../../core/models/movimiento.model';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './reportes-view.component.html',
  styleUrl: './reportes-view.component.scss'
})
export class ReportesViewComponent implements OnInit, OnDestroy {

  grupoId!: number;
  grupo: Grupo | null = null;
  saldo: SaldoGrupo | null = null;
  kardexList: Kardex[] = [];
  movimientos: Movimiento[] = [];
  loading = true;
  today = new Date();

  private charts: Chart[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoService: GrupoService,
    private kardexService: KardexService,
    private movimientoService: MovimientoService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.grupoId = Number(this.route.snapshot.paramMap.get('grupoId'));
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.charts.forEach(c => c.destroy());
  }

  cargarDatos(): void {
    this.loading = true;
    forkJoin({
      grupo: this.grupoService.obtenerGrupo(this.grupoId),
      saldo: this.grupoService.obtenerSaldoGrupo(this.grupoId),
      kardex: this.kardexService.obtenerKardexGrupo(this.grupoId),
      movimientos: this.movimientoService.obtenerMovimientos(this.grupoId)
    }).subscribe({
      next: (r) => {
        this.grupo = r.grupo;
        this.saldo = r.saldo;
        this.kardexList = r.kardex;
        this.movimientos = r.movimientos;
        this.loading = false;
        // Forzar el render del *ngIf para que los <canvas> existan en el DOM,
        // luego dibujar. Un setTimeout adicional asegura el layout (ancho real).
        this.cdr.detectChanges();
        setTimeout(() => this.renderCharts(), 50);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudieron cargar los reportes. ¿Tienes permisos de directiva?', 'Cerrar', { duration: 4000 });
      }
    });
  }

  get moneda(): string { return this.grupo?.moneda || ''; }

  // ─────────────────────────────────────────────────────────
  //  Gráficos
  // ─────────────────────────────────────────────────────────

  private renderCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.renderBarras();
    this.renderLinea();
    this.renderTorta();
    this.renderFondos();
  }

  get hayFondos(): boolean {
    return ((this.saldo?.saldoCarnaval || 0) + (this.saldo?.saldoAhorro || 0)) > 0;
  }

  /** Dona: desglose explícito de los fondos Carnaval vs Ahorro. */
  private renderFondos(): void {
    const canvas = document.getElementById('chartFondos') as HTMLCanvasElement | null;
    if (!canvas) return;

    const carnaval = this.saldo?.saldoCarnaval || 0;
    const ahorro = this.saldo?.saldoAhorro || 0;

    this.charts.push(new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['🎭 Carnaval', '🐖 Ahorro'],
        datasets: [{
          data: [Number(carnaval.toFixed(2)), Number(ahorro.toFixed(2))],
          backgroundColor: ['#F59E0B', '#10B981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
      }
    }));
  }

  /** Barras: aportes vs gastos por miembro. */
  private renderBarras(): void {
    const canvas = document.getElementById('chartBarras') as HTMLCanvasElement | null;
    if (!canvas) return;

    const labels = this.kardexList.map(k => `${k.usuario.nombre} ${k.usuario.apellido}`);
    const aportes = this.kardexList.map(k => k.totalAportes);
    const gastos = this.kardexList.map(k => k.totalGastosCompartidos + k.totalGastosIndividuales);

    this.charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Aportes', data: aportes, backgroundColor: '#10B981', borderRadius: 6 },
          { label: 'Gastos', data: gastos, backgroundColor: '#EF4444', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    }));
  }

  /** Línea: evolución del saldo del grupo en el tiempo (acumulado desde movimientos). */
  private renderLinea(): void {
    const canvas = document.getElementById('chartLinea') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ordenados = [...this.movimientos].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    const labels: string[] = [];
    const serie: number[] = [];
    let acumulado = 0;
    for (const m of ordenados) {
      const esIngreso = m.tipo === 'APORTE' || m.tipo === 'INGRESO_DIRECTO' || m.tipo === 'MULTA';
      acumulado += esIngreso ? m.montoTotal : -m.montoTotal;
      labels.push(new Date(m.fecha).toLocaleDateString('es', { day: '2-digit', month: 'short' }));
      serie.push(Number(acumulado.toFixed(2)));
    }

    this.charts.push(new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Saldo acumulado',
          data: serie,
          borderColor: '#6C63FF',
          backgroundColor: 'rgba(108, 99, 255, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    }));
  }

  /** Torta: distribución de movimientos por tipo. */
  private renderTorta(): void {
    const canvas = document.getElementById('chartTorta') as HTMLCanvasElement | null;
    if (!canvas) return;

    const tipos: Record<string, { label: string; color: string }> = {
      APORTE:            { label: 'Aportes', color: '#10B981' },
      GASTO_COMPARTIDO:  { label: 'Gastos compartidos', color: '#EF4444' },
      GASTO_INDIVIDUAL:  { label: 'Gastos individuales', color: '#F59E0B' },
      MULTA:             { label: 'Multas', color: '#8B5CF6' },
      INGRESO_DIRECTO:   { label: 'Ingresos directos', color: '#00D4FF' },
      GASTO_DIRECTO:     { label: 'Gastos directos', color: '#EA580C' }
    };

    const totales: Record<string, number> = {};
    for (const m of this.movimientos) {
      totales[m.tipo] = (totales[m.tipo] || 0) + m.montoTotal;
    }

    const claves = Object.keys(tipos).filter(t => (totales[t] || 0) > 0);
    const labels = claves.map(t => tipos[t].label);
    const data = claves.map(t => Number((totales[t] || 0).toFixed(2)));
    const colors = claves.map(t => tipos[t].color);

    this.charts.push(new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
      }
    }));
  }

  get hayDatos(): boolean {
    return this.kardexList.length > 0 || this.movimientos.length > 0;
  }

  // ─────────────────────────────────────────────────────────
  //  Exportación
  // ─────────────────────────────────────────────────────────

  exportarPDF(): void {
    // Usa el diálogo nativo del navegador (Guardar como PDF). El @media print
    // del SCSS aísla el contenido del reporte e incluye los gráficos renderizados.
    window.print();
  }

  exportarExcel(): void {
    const sep = ';';
    const nl = '\r\n';
    let csv = `Reporte de ${this.grupo?.nombre || 'grupo'} (${this.moneda})${nl}${nl}`;

    // Resumen del grupo
    csv += `Resumen del grupo${nl}`;
    csv += `Ingresos totales${sep}${this.saldo?.totalIngresos ?? 0}${nl}`;
    csv += `Egresos totales${sep}${this.saldo?.totalEgresos ?? 0}${nl}`;
    csv += `Multas recaudadas${sep}${this.saldo?.totalMultas ?? 0}${nl}`;
    csv += `Saldo disponible${sep}${this.saldo?.saldoDisponible ?? 0}${nl}`;
    csv += `Fondo Carnaval${sep}${this.saldo?.saldoCarnaval ?? 0}${nl}`;
    csv += `Fondo Ahorro${sep}${this.saldo?.saldoAhorro ?? 0}${nl}${nl}`;

    // Detalle por miembro
    csv += `Miembro${sep}Aportes${sep}Ahorro${sep}Gastos compartidos${sep}Gastos individuales${sep}Multas${sep}Saldo${nl}`;
    for (const k of this.kardexList) {
      csv += `${k.usuario.nombre} ${k.usuario.apellido}${sep}${k.totalAportes}${sep}` +
             `${k.totalAhorro ?? 0}${sep}` +
             `${k.totalGastosCompartidos}${sep}${k.totalGastosIndividuales}${sep}` +
             `${k.totalMultas}${sep}${k.saldoActual}${nl}`;
    }

    // BOM para que Excel reconozca UTF-8 (acentos)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${this.grupo?.nombre || 'grupo'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  volver(): void {
    this.router.navigate(['/app/grupo', this.grupoId]);
  }
}
