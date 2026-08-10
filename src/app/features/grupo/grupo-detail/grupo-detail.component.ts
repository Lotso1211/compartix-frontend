import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GrupoService } from '../../../core/services/grupo.service';
import { MovimientoService } from '../../../core/services/movimiento.service';
import { KardexService } from '../../../core/services/kardex.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Grupo, SaldoGrupo, MiembroGrupo } from '../../../core/models/grupo.model';
import { Movimiento, TipoFondo } from '../../../core/models/movimiento.model';
import { Kardex } from '../../../core/models/kardex.model';
import { Usuario } from '../../../core/models/usuario.model';
import { MultaService, MultaResponse } from '../../../core/services/multa.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { PedidoService, PedidoResponse } from '../../../core/services/pedido.service';
import { PagoProgramadoService, PagoProgramadoResponse, CuotaResponse, ReactivacionInfo, MiembroFaltante } from '../../../core/services/pago-programado.service';

@Component({
  selector: 'app-grupo-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './grupo-detail.component.html',
  styleUrls: ['./grupo-detail.component.scss']
})
export class GrupoDetailComponent implements OnInit {

  grupoId!: number;
  grupo: Grupo | null = null;
  saldo: SaldoGrupo | null = null;
  miembros: MiembroGrupo[] = [];
  miembrosGestion: MiembroGrupo[] = [];
  movimientos: Movimiento[] = [];
  kardexList: Kardex[] = [];
  miKardex: Kardex | null = null;
  usuario: Usuario | null = null;
  rolUsuario: string = 'MIEMBRO';
  loading = true;
  darkMode = false;
  notisNoLeidas = 0;
  miembroSeleccionado: any = null;
  kardexSeleccionado: Kardex | null = null;
  showKardexDetalle = false;
  multas: MultaResponse[] = [];
  movimientoSeleccionado: Movimiento | null = null;
  detalleMovimiento: any[] = [];
  showDetalleMovimiento = false;
  filtroMovimiento: string = 'TODOS';
  showConfirmEliminar = false;

  // Pedidos
  pedidos: PedidoResponse[] = [];
  pedidoSeleccionado: PedidoResponse | null = null;
  showDetallePedido = false;
  pedidoEditandoId: number | null = null;

  // Pagos programados
  pagosProgramados: PagoProgramadoResponse[] = [];
  cuotasMes: CuotaResponse[] = [];
  misCuotas: CuotaResponse[] = [];
  mesSeleccionado = new Date().getMonth() + 1;
  anioSeleccionado = new Date().getFullYear();

  // Modal
  modalActivo: string = '';
  loadingAction = false;

  // Reactivación de miembro
  miembroReactivar: MiembroGrupo | null = null;
  reactivarConCarnaval = true;
  reactivarInfo: ReactivacionInfo | null = null;
  loadingReactivarInfo = false;

  // Añadir miembro faltante a un pago programado ya en curso
  pagoParaAgregarMiembro: PagoProgramadoResponse | null = null;
  miembrosFaltantesPago: MiembroFaltante[] = [];
  loadingMiembrosFaltantes = false;

  // Forms
  aporteForm = { usuarioId: 0, monto: 0, fecha: '', descripcion: '', fondo: 'CARNAVAL' as TipoFondo };
  gastoCompartidoForm = { descripcion: '', montoTotal: 0, fecha: '', usuarioIds: [] as number[], fondo: 'CARNAVAL' as TipoFondo, montoCarnavalManual: 0, montoAhorroManual: 0 };
  gastoIndividualForm = { descripcion: '', precioUnitario: 0, fecha: '', cantidades: {} as {[key: number]: number}, fondo: 'CARNAVAL' as TipoFondo, montoCarnavalManual: 0, montoAhorroManual: 0 };
  multaForm = { usuarioId: 0, motivo: '', monto: 0, fecha: '', periodoMes: new Date().getMonth() + 1, periodoAnio: new Date().getFullYear() };
  ingresoDirectoForm = { descripcion: '', monto: 0, fecha: '', fondo: 'CARNAVAL' as TipoFondo };
  alertasForm: { alertaSaldoCarnaval: number | null, alertaSaldoAhorro: number | null } = { alertaSaldoCarnaval: null, alertaSaldoAhorro: null };

  pedidoForm = {
    nombre: '',
    descripcion: '',
    fecha: '',
    items: [] as {nombre: string, precioUnitario: number, descripcion: string, cantidades: {[key: number]: number}}[]
  };

  pagoProgramadoForm = {
    nombre: '',
    descripcion: '',
    montoCarnaval: 0,
    montoAhorro: 0,
    montoMensual: 0,
    fechaInicio: '',
    fechaFin: '',
    diaLimitePago: 5,
    tipoMulta: 'FIJO',
    montoMulta: 0,
    porcentajeMulta: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private grupoService: GrupoService,
    private movimientoService: MovimientoService,
    private kardexService: KardexService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private multaService: MultaService,
    private pedidoService: PedidoService,
    private pagoProgramadoService: PagoProgramadoService,
    private themeService: ThemeService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    this.grupoId = Number(this.route.snapshot.paramMap.get('id'));
    this.usuario = this.authService.getUsuarioActual();
    this.themeService.dark$.subscribe(d => this.darkMode = d);
    this.notificacionService.noLeidas$.subscribe(n => this.notisNoLeidas = n);
    this.notificacionService.refrescarContador();
    this.cargarDatos();
    this.revisarGastoPrellenado();
  }

  private revisarGastoPrellenado(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('preGasto') !== 'true') return;

    this.abrirModal('gastoCompartido');
    this.gastoCompartidoForm.descripcion = params.get('descripcion') || '';
    this.gastoCompartidoForm.montoTotal = Number(params.get('monto')) || 0;
    this.gastoCompartidoForm.fecha = params.get('fecha') || this.gastoCompartidoForm.fecha;

    // Limpiar los query params para que no se reabra el modal al refrescar la página
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  irANotificaciones(): void {
    // El panel de notificaciones vive en el dashboard
    this.router.navigate(['/app'], { queryParams: { notis: 1 } });
  }

  cargarDatos(): void {
    this.loading = true;
    this.grupoService.obtenerGrupo(this.grupoId).subscribe(g => this.grupo = g);
    this.grupoService.obtenerMiembros(this.grupoId).subscribe(m => this.miembros = m);

    this.grupoService.obtenerMiRol(this.grupoId).subscribe({
      next: (rol) => {
        this.rolUsuario = rol;

        if (this.esDirectiva) {
          this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
          this.grupoService.obtenerMiembrosGestion(this.grupoId).subscribe(m => this.miembrosGestion = m);
          this.movimientoService.obtenerMovimientos(this.grupoId).subscribe(m => this.movimientos = m);
          this.multaService.obtenerMultas(this.grupoId).subscribe(m => this.multas = m);
          this.pedidoService.obtenerPedidos(this.grupoId).subscribe(p => this.pedidos = p);
          this.pagoProgramadoService.obtenerPagosProgramados(this.grupoId).subscribe(p => this.pagosProgramados = p);
          this.cargarCuotasMes();
          this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe({
            next: k => { this.kardexList = k; this.loading = false; },
            error: () => this.loading = false
          });
        } else {
          this.movimientoService.obtenerMisMovimientos(this.grupoId).subscribe(m => this.movimientos = m);
          this.multaService.obtenerMisMultas(this.grupoId).subscribe(m => this.multas = m);
          this.pedidoService.obtenerPedidos(this.grupoId).subscribe(p => this.pedidos = p);
          this.pagoProgramadoService.obtenerMisCuotas(this.grupoId).subscribe(c => this.misCuotas = c);
          this.kardexService.obtenerMiKardex(this.grupoId).subscribe({
            next: k => { this.miKardex = k; this.loading = false; },
            error: () => this.loading = false
          });
        }
      },
      error: () => this.loading = false
    });
  }

  get esDirectiva(): boolean {
    return this.rolUsuario === 'DIRECTIVA';
  }

  abrirModal(tipo: string): void {
    if (tipo === 'pedido') {
      // Modal de pedido nuevo: limpiar cualquier resto de una edición previa
      this.pedidoEditandoId = null;
      this.pedidoForm = { nombre: '', descripcion: '', fecha: '', items: [] };
      this.itemExpandidoIndex = null;
    }
    const hoy = new Date().toISOString().split('T')[0];
    this.aporteForm.fecha = hoy;
    this.gastoCompartidoForm.fecha = hoy;
    this.gastoIndividualForm.fecha = hoy;
    this.multaForm.fecha = hoy;
    this.ingresoDirectoForm.fecha = hoy;
    this.pedidoForm.fecha = hoy;
    this.modalActivo = tipo;
  }

  cerrarModal(): void {
    this.modalActivo = '';
    this.gastoCompartidoForm.usuarioIds = [];
    this.gastoCompartidoForm.descripcion = '';
    this.gastoCompartidoForm.montoTotal = 0;
    this.gastoCompartidoForm.fondo = 'CARNAVAL';
    this.gastoCompartidoForm.montoCarnavalManual = 0;
    this.gastoCompartidoForm.montoAhorroManual = 0;
    this.gastoIndividualForm.fondo = 'CARNAVAL';
    this.gastoIndividualForm.montoCarnavalManual = 0;
    this.gastoIndividualForm.montoAhorroManual = 0;
    this.aporteForm.fondo = 'CARNAVAL';
    this.ingresoDirectoForm.fondo = 'CARNAVAL';
    this.pedidoEditandoId = null;
  }

  montoRestanteMixto(montoCarnavalManual: number, montoAhorroManual: number, total: number): number {
    return +(total - (montoCarnavalManual || 0) - (montoAhorroManual || 0)).toFixed(2);
  }

  abrirAlertas(): void {
    if (!this.esDirectiva || !this.grupo) return;
    this.alertasForm = {
      alertaSaldoCarnaval: this.grupo.alertaSaldoCarnaval ?? null,
      alertaSaldoAhorro: this.grupo.alertaSaldoAhorro ?? null
    };
    this.modalActivo = 'configAlertas';
  }

  guardarAlertas(): void {
    if (!this.esDirectiva) return;
    this.loadingAction = true;
    this.grupoService.actualizarAlertas(this.grupoId, {
      alertaSaldoCarnaval: this.alertasForm.alertaSaldoCarnaval,
      alertaSaldoAhorro: this.alertasForm.alertaSaldoAhorro
    }).subscribe({
      next: (g) => {
        this.grupo = g;
        this.loadingAction = false;
        this.cerrarModal();
        this.snackBar.open('✅ Alertas de fondo actualizadas', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al guardar las alertas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  registrarAporte(): void {
    if (!this.esDirectiva) return;
    if (!this.aporteForm.usuarioId || !this.aporteForm.monto) return;
    this.loadingAction = true;
    this.movimientoService.registrarAporte(this.grupoId, {
      usuarioId: this.aporteForm.usuarioId,
      monto: this.aporteForm.monto,
      fecha: this.aporteForm.fecha,
      descripcion: this.aporteForm.descripcion,
      fondo: this.aporteForm.fondo
    }).subscribe({
      next: (m) => {
        this.movimientos.unshift(m);
        this.cerrarModal();
        this.loadingAction = false;
        this.snackBar.open('✅ Aporte registrado', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al registrar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  registrarGastoCompartido(): void {
    if (!this.esDirectiva) return;
    if (!this.gastoCompartidoForm.descripcion || !this.gastoCompartidoForm.montoTotal) return;
    if (this.gastoCompartidoForm.usuarioIds.length === 0) {
      this.snackBar.open('Debes seleccionar al menos un miembro', 'Cerrar', { duration: 3000 });
      return;
    }
    if (this.gastoCompartidoForm.fondo === 'MIXTO' && this.montoRestanteMixto(this.gastoCompartidoForm.montoCarnavalManual, this.gastoCompartidoForm.montoAhorroManual, this.gastoCompartidoForm.montoTotal) !== 0) {
      this.snackBar.open('El reparto entre Carnaval y Ahorro debe sumar el monto total', 'Cerrar', { duration: 3000 });
      return;
    }
    this.loadingAction = true;
    this.movimientoService.registrarGastoCompartido(this.grupoId, {
      descripcion: this.gastoCompartidoForm.descripcion,
      montoTotal: this.gastoCompartidoForm.montoTotal,
      fecha: this.gastoCompartidoForm.fecha,
      usuarioIds: this.gastoCompartidoForm.usuarioIds,
      fondo: this.gastoCompartidoForm.fondo,
      ...(this.gastoCompartidoForm.fondo === 'MIXTO' ? {
        montoCarnaval: this.gastoCompartidoForm.montoCarnavalManual,
        montoAhorro: this.gastoCompartidoForm.montoAhorroManual
      } : {})
    }).subscribe({
      next: (m) => {
        this.movimientos.unshift(m);
        this.cerrarModal();
        this.loadingAction = false;
        this.snackBar.open('✅ Gasto compartido registrado', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al registrar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  registrarGastoIndividual(): void {
    if (!this.esDirectiva) return;
    if (!this.gastoIndividualForm.descripcion || !this.gastoIndividualForm.precioUnitario) return;
    const cantidadesPorUsuario: {[key: number]: number} = {};
    this.miembros.forEach(m => {
      const cant = this.gastoIndividualForm.cantidades[m.id];
      if (cant && cant > 0) cantidadesPorUsuario[m.id] = cant;
    });
    if (Object.keys(cantidadesPorUsuario).length === 0) {
      this.snackBar.open('Debes asignar cantidad a al menos un miembro', 'Cerrar', { duration: 3000 });
      return;
    }
    if (this.gastoIndividualForm.fondo === 'MIXTO' && this.montoRestanteMixto(this.gastoIndividualForm.montoCarnavalManual, this.gastoIndividualForm.montoAhorroManual, this.getTotalGastoIndividual()) !== 0) {
      this.snackBar.open('El reparto entre Carnaval y Ahorro debe sumar el monto total', 'Cerrar', { duration: 3000 });
      return;
    }
    this.loadingAction = true;
    this.movimientoService.registrarGastoIndividual(this.grupoId, {
      descripcion: this.gastoIndividualForm.descripcion,
      precioUnitario: this.gastoIndividualForm.precioUnitario,
      fecha: this.gastoIndividualForm.fecha,
      cantidadesPorUsuario,
      fondo: this.gastoIndividualForm.fondo,
      ...(this.gastoIndividualForm.fondo === 'MIXTO' ? {
        montoCarnaval: this.gastoIndividualForm.montoCarnavalManual,
        montoAhorro: this.gastoIndividualForm.montoAhorroManual
      } : {})
    }).subscribe({
      next: (m) => {
        this.movimientos.unshift(m);
        this.cerrarModal();
        this.loadingAction = false;
        this.snackBar.open('✅ Gasto individual registrado', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al registrar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  registrarMulta(): void {
    if (!this.esDirectiva) return;
    if (!this.multaForm.usuarioId || !this.multaForm.monto) return;
    this.loadingAction = true;
    this.movimientoService.registrarMulta(this.grupoId, {
      usuarioId: this.multaForm.usuarioId,
      motivo: this.multaForm.motivo,
      monto: this.multaForm.monto,
      fecha: this.multaForm.fecha,
      periodoMes: this.multaForm.periodoMes,
      periodoAnio: this.multaForm.periodoAnio
    }).subscribe({
      next: (m) => {
        this.movimientos.unshift(m);
        this.cerrarModal();
        this.loadingAction = false;
        this.snackBar.open('✅ Multa registrada', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
        this.multaService.obtenerMultas(this.grupoId).subscribe(multas => this.multas = multas);
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al registrar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  registrarIngresoDirecto(): void {
    if (!this.esDirectiva) return;
    if (!this.ingresoDirectoForm.monto) return;
    this.loadingAction = true;
    this.movimientoService.registrarIngresoDirecto(this.grupoId, {
      descripcion: this.ingresoDirectoForm.descripcion,
      monto: this.ingresoDirectoForm.monto,
      fecha: this.ingresoDirectoForm.fecha,
      fondo: this.ingresoDirectoForm.fondo
    }).subscribe({
      next: (m) => {
        this.movimientos.unshift(m);
        this.cerrarModal();
        this.loadingAction = false;
        this.snackBar.open('✅ Ingreso directo registrado', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al registrar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  toggleMiembro(miembroId: number): void {
    const idx = this.gastoCompartidoForm.usuarioIds.indexOf(miembroId);
    if (idx === -1) this.gastoCompartidoForm.usuarioIds.push(miembroId);
    else this.gastoCompartidoForm.usuarioIds.splice(idx, 1);
  }

  esMiembroSeleccionado(miembroId: number): boolean {
    return this.gastoCompartidoForm.usuarioIds.includes(miembroId);
  }

  get todosMiembrosSeleccionados(): boolean {
    return this.miembros.length > 0 &&
      this.gastoCompartidoForm.usuarioIds.length === this.miembros.length;
  }

  toggleTodosMiembros(): void {
    this.gastoCompartidoForm.usuarioIds = this.todosMiembrosSeleccionados
      ? []
      : this.miembros.map(m => m.id);
  }

  getTipoColor(tipo: string): string {
    const colors: {[key: string]: string} = {
      'APORTE': '#10B981',
      'GASTO_COMPARTIDO': '#F59E0B',
      'GASTO_INDIVIDUAL': '#6C63FF',
      'MULTA': '#EF4444',
      'INGRESO_DIRECTO': '#10B981'
    };
    return colors[tipo] || '#64748B';
  }

  getTipoIcon(tipo: string): string {
    const icons: {[key: string]: string} = {
      'APORTE': '💰',
      'GASTO_COMPARTIDO': '🤝',
      'GASTO_INDIVIDUAL': '🛍️',
      'MULTA': '⚠️',
      'INGRESO_DIRECTO': '🏦'
    };
    return icons[tipo] || '📋';
  }

  getTipoLabel(tipo: string): string {
    const labels: {[key: string]: string} = {
      'APORTE': 'Aporte',
      'GASTO_COMPARTIDO': 'Gasto Compartido',
      'GASTO_INDIVIDUAL': 'Gasto Individual',
      'MULTA': 'Multa',
      'INGRESO_DIRECTO': 'Ingreso Directo'
    };
    return labels[tipo] || tipo;
  }

  getMovimientosFiltrados(): Movimiento[] {
    if (this.filtroMovimiento === 'TODOS') return this.movimientos;
    return this.movimientos.filter(m => m.tipo === this.filtroMovimiento);
  }

  getTotalGastoIndividual(): number {
    return this.miembros.reduce((total, m) => {
      const cant = this.gastoIndividualForm.cantidades[m.id] || 0;
      return total + (cant * this.gastoIndividualForm.precioUnitario);
    }, 0);
  }

  verDetalleMovimiento(mov: Movimiento): void {
    if (mov.tipo !== 'GASTO_INDIVIDUAL' && mov.tipo !== 'GASTO_COMPARTIDO') return;
    this.movimientoSeleccionado = mov;
    const detalle$ = this.esDirectiva
      ? this.movimientoService.obtenerDetalleMovimiento(this.grupoId, mov.id)
      : this.movimientoService.obtenerMiDetalleMovimiento(this.grupoId, mov.id);
    detalle$.subscribe({
      next: (detalle: any[]) => {
        this.detalleMovimiento = detalle;
        this.showDetalleMovimiento = true;
      },
      error: () => this.snackBar.open('Error al cargar detalle', 'Cerrar', { duration: 2000 })
    });
  }

  eliminarMovimiento(mov: Movimiento, event: Event): void {
    event.stopPropagation();
    if (!this.esDirectiva) return;
    if (!confirm(`¿Eliminar este movimiento de ${this.grupo?.moneda} ${mov.montoTotal}? Se revertirá su efecto en el kardex y el saldo del grupo.`)) return;

    this.movimientoService.eliminarMovimiento(this.grupoId, mov.id).subscribe({
      next: () => {
        this.movimientos = this.movimientos.filter(m => m.id !== mov.id);
        this.snackBar.open('✅ Movimiento eliminado', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
        this.cargarCuotasMes();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 })
    });
  }

  verKardexMiembro(miembro: MiembroGrupo): void {
    this.miembroSeleccionado = miembro;
    this.kardexService.obtenerKardexMiembro(this.grupoId, miembro.id).subscribe({
      next: (k) => {
        this.kardexSeleccionado = k;
        this.showKardexDetalle = true;
      },
      error: () => this.snackBar.open('Este miembro aún no tiene movimientos', 'Cerrar', { duration: 2000 })
    });
  }

  pagarMulta(multa: MultaResponse): void {
    if (!this.esDirectiva) return;
    this.multaService.marcarComoPagada(this.grupoId, multa.id).subscribe({
      next: (m) => {
        multa.estado = m.estado;
        multa.fechaPago = m.fechaPago;
        this.snackBar.open('✅ Multa marcada como pagada', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
        this.multaService.obtenerMultas(this.grupoId).subscribe(m2 => this.multas = m2);
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error al procesar', 'Cerrar', { duration: 3000 })
    });
  }

  eliminarMulta(multa: MultaResponse): void {
    if (!this.esDirectiva) return;
    if (!confirm(`¿Eliminar la multa de ${multa.nombreUsuario} por ${multa.monto}? Esta acción es irreversible.`)) return;
    this.multaService.eliminarMulta(this.grupoId, multa.id).subscribe({
      next: () => {
        this.multas = this.multas.filter(m => m.id !== multa.id);
        this.snackBar.open('Multa eliminada', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 })
    });
  }

  cambiarRol(miembro: MiembroGrupo): void {
    if (!this.esDirectiva) return;
    const nuevoRol = miembro.rol === 'DIRECTIVA' ? 'MIEMBRO' : 'DIRECTIVA';
    this.grupoService.cambiarRolMiembro(this.grupoId, miembro.id, nuevoRol).subscribe({
      next: () => {
        miembro.rol = nuevoRol;
        this.snackBar.open(`✅ ${miembro.nombre} ahora es ${nuevoRol}`, 'Cerrar', { duration: 3000 });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error al cambiar rol', 'Cerrar', { duration: 3000 })
    });
  }

  esMiUsuario(miembroId: number): boolean {
    return this.usuario?.id === miembroId;
  }

  confirmarEliminar(): void {
    if (!this.esDirectiva) return;
    this.showConfirmEliminar = true;
  }

  eliminarGrupo(): void {
    if (!this.esDirectiva) return;
    this.grupoService.eliminarGrupo(this.grupoId).subscribe({
      next: () => {
        this.snackBar.open('✅ Grupo eliminado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/app']);
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3000 })
    });
  }

  toggleDarkMode(): void {
    this.themeService.toggle();
  }

  volver(): void {
    this.router.navigate(['/app']);
  }

  irAIa(): void {
    this.router.navigate(['/app/ia', this.grupoId]);
  }

  irAReportes(): void {
    this.router.navigate(['/app/reportes', this.grupoId]);
  }

  getInitiales(nombre: string, apellido: string): string {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  }

  copiarCodigo(): void {
    if (this.grupo?.codigoInvitacion) {
      navigator.clipboard.writeText(this.grupo.codigoInvitacion)
        .then(() => this.snackBar.open('Código copiado al portapapeles', 'Cerrar', { duration: 2000 }))
        .catch(() => this.snackBar.open('No se pudo copiar automáticamente', 'Cerrar', { duration: 2000 }));
    }
  }

  getNombreMes(mes: number): string {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return meses[mes - 1];
  }

  // ============================================================
  // PEDIDOS
  // ============================================================
  itemExpandidoIndex: number | null = null;

  agregarItemPedido(): void {
    this.pedidoForm.items.push({ nombre: '', precioUnitario: 0, descripcion: '', cantidades: {} });
    this.itemExpandidoIndex = this.pedidoForm.items.length - 1;
  }

  eliminarItemPedido(index: number): void {
    this.pedidoForm.items.splice(index, 1);
    if (this.itemExpandidoIndex === index) this.itemExpandidoIndex = null;
    else if (this.itemExpandidoIndex !== null && this.itemExpandidoIndex > index) this.itemExpandidoIndex--;
  }

  toggleItemExpandido(index: number): void {
    this.itemExpandidoIndex = this.itemExpandidoIndex === index ? null : index;
  }

  getTotalItemPedido(item: any): number {
    return this.miembros.reduce((total, m) => {
      return total + ((item.cantidades[m.id] || 0) * item.precioUnitario);
    }, 0);
  }

  getTotalPedidoForm(): number {
    return this.pedidoForm.items.reduce((total, item) => total + this.getTotalItemPedido(item), 0);
  }

  crearPedido(): void {
    if (!this.esDirectiva) return;
    if (!this.pedidoForm.nombre || this.pedidoForm.items.length === 0) {
      this.snackBar.open('Completa el nombre y agrega al menos un item', 'Cerrar', { duration: 3000 });
      return;
    }
    this.loadingAction = true;
    const request = {
      nombre: this.pedidoForm.nombre,
      descripcion: this.pedidoForm.descripcion,
      fecha: this.pedidoForm.fecha,
      items: this.pedidoForm.items.map(item => ({
        nombre: item.nombre,
        precioUnitario: item.precioUnitario,
        descripcion: item.descripcion,
        cantidadesPorUsuario: item.cantidades
      }))
    };

    const esEdicion = this.pedidoEditandoId !== null;
    const peticion$ = esEdicion
      ? this.pedidoService.actualizarPedido(this.grupoId, this.pedidoEditandoId!, request)
      : this.pedidoService.crearPedido(this.grupoId, request);

    peticion$.subscribe({
      next: (p) => {
        if (esEdicion) {
          const idx = this.pedidos.findIndex(x => x.id === p.id);
          if (idx !== -1) this.pedidos[idx] = p;
        } else {
          this.pedidos.unshift(p);
        }
        this.cerrarModal();
        this.loadingAction = false;
        this.pedidoForm = { nombre: '', descripcion: '', fecha: '', items: [] };
        this.snackBar.open(esEdicion ? '✅ Pedido actualizado' : '✅ Pedido creado', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al guardar pedido', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editarPedido(pedido: PedidoResponse): void {
    if (!this.esDirectiva || pedido.estado !== 'ABIERTO') return;
    this.pedidoEditandoId = pedido.id;
    this.pedidoForm = {
      nombre: pedido.nombre,
      descripcion: pedido.descripcion || '',
      fecha: pedido.fecha,
      items: pedido.items.map(item => {
        const cantidades: {[key: number]: number} = {};
        item.detalles.forEach(d => cantidades[d.usuarioId] = d.cantidad);
        return {
          nombre: item.nombre,
          precioUnitario: item.precioUnitario,
          descripcion: item.descripcion || '',
          cantidades
        };
      })
    };
    this.itemExpandidoIndex = null;
    this.modalActivo = 'pedido';
  }

  verDetallePedido(pedido: PedidoResponse): void {
    this.pedidoSeleccionado = pedido;
    this.showDetallePedido = true;
  }

  cerrarPedido(pedido: PedidoResponse): void {
    if (!this.esDirectiva) return;
    const ok = confirm(
      `¿Cerrar el pedido "${pedido.nombre}"?\n\n` +
      `Al cerrarlo se descontará lo consumido del kardex de cada miembro ` +
      `y del saldo del grupo. Un pedido cerrado ya no se puede editar.`
    );
    if (!ok) return;
    this.pedidoService.cerrarPedido(this.grupoId, pedido.id).subscribe({
    next: () => {
      pedido.estado = 'CERRADO';
      this.snackBar.open('✅ Pedido cerrado', 'Cerrar', { duration: 3000 });
      this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
      this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
    },
    error: (err) => {
      this.snackBar.open(err.error?.message || 'Error al cerrar pedido', 'Cerrar', { duration: 3000 });
    }
  });
}

  eliminarPedido(pedido: PedidoResponse): void {
    if (!this.esDirectiva) return;
    const aviso = pedido.estado === 'CERRADO'
      ? `¿Eliminar el pedido "${pedido.nombre}"?\n\nEste pedido está CERRADO: al eliminarlo se devolverán los montos descontados al kardex de cada miembro y al saldo del grupo.`
      : `¿Eliminar el pedido "${pedido.nombre}"? Esta acción no se puede deshacer.`;
    if (!confirm(aviso)) return;
    this.pedidoService.eliminarPedido(this.grupoId, pedido.id).subscribe({
      next: () => {
        this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
        this.snackBar.open('✅ Pedido eliminado', 'Cerrar', { duration: 3000 });
        if (pedido.estado === 'CERRADO') {
          this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
          this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
        }
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error al eliminar pedido', 'Cerrar', { duration: 3000 })
    });
  }

  exportarPedidoExcel(pedido: PedidoResponse): void {
    let csv = 'Item,Usuario,Cantidad,Precio Unitario,Subtotal\n';
    pedido.items.forEach(item => {
      item.detalles.forEach(d => {
        csv += `${item.nombre},${d.nombreUsuario},${d.cantidad},${item.precioUnitario},${d.subtotal}\n`;
      });
      csv += `${item.nombre},TOTAL ITEM,,,${item.totalItem}\n`;
    });
    csv += `TOTAL GENERAL,,,,${pedido.totalGeneral}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedido_${pedido.nombre}_${pedido.fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // PAGOS PROGRAMADOS
  // ============================================================
  cargarCuotasMes(): void {
    this.pagoProgramadoService.obtenerCuotasMes(this.grupoId, this.anioSeleccionado, this.mesSeleccionado)
      .subscribe(c => this.cuotasMes = c);
  }

  cambiarMes(delta: number): void {
    this.mesSeleccionado += delta;
    if (this.mesSeleccionado > 12) { this.mesSeleccionado = 1; this.anioSeleccionado++; }
    if (this.mesSeleccionado < 1) { this.mesSeleccionado = 12; this.anioSeleccionado--; }
    this.cargarCuotasMes();
  }

  crearPagoProgramado(): void {
    if (!this.esDirectiva) return;
    const carnaval = Number(this.pagoProgramadoForm.montoCarnaval) || 0;
    const ahorro = Number(this.pagoProgramadoForm.montoAhorro) || 0;
    this.pagoProgramadoForm.montoMensual = carnaval + ahorro;
    if (!this.pagoProgramadoForm.nombre || this.pagoProgramadoForm.montoMensual <= 0) {
      this.snackBar.open('Completa el nombre y al menos un monto (carnaval o ahorro)', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.pagoProgramadoForm.fechaInicio || !this.pagoProgramadoForm.fechaFin) {
      this.snackBar.open('Debes indicar la fecha de inicio y fin', 'Cerrar', { duration: 3000 });
      return;
    }
    if (this.pagoProgramadoForm.fechaFin < this.pagoProgramadoForm.fechaInicio) {
      this.snackBar.open('La fecha fin no puede ser anterior a la de inicio', 'Cerrar', { duration: 3000 });
      return;
    }
    this.loadingAction = true;
    this.pagoProgramadoService.crearPagoProgramado(this.grupoId, this.pagoProgramadoForm).subscribe({
      next: (p) => {
        this.pagosProgramados.unshift(p);
        this.cerrarModal();
        this.loadingAction = false;
        this.cargarCuotasMes();
        this.snackBar.open('✅ Pago programado creado', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al crear', 'Cerrar', { duration: 3000 });
      }
    });
  }

  pagarCuota(cuota: CuotaResponse): void {
    if (!this.esDirectiva) return;
    this.pagoProgramadoService.marcarCuotaPagada(this.grupoId, cuota.id).subscribe({
      next: (c) => {
        cuota.estado = c.estado;
        cuota.fechaPago = c.fechaPago;
        this.snackBar.open('✅ Cuota marcada como pagada', 'Cerrar', { duration: 3000 });
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
      }
    });
  }

  verificarMultas(): void {
    if (!this.esDirectiva) return;
    this.pagoProgramadoService.verificarMultas(this.grupoId).subscribe({
      next: () => {
        this.snackBar.open('✅ Multas verificadas', 'Cerrar', { duration: 3000 });
        this.cargarCuotasMes();
      }
    });
  }

  finalizarPagoProgramado(pp: PagoProgramadoResponse): void {
    if (!this.esDirectiva) return;
    const ok = confirm(
      `¿Finalizar "${pp.nombre}"?\n\n` +
      `• Ya no se generarán más cuotas.\n` +
      `• Las cuotas pendientes o vencidas se eliminarán.\n` +
      `• Solo quedará visible el historial de cuotas pagadas.`
    );
    if (!ok) return;
    this.pagoProgramadoService.finalizarPagoProgramado(this.grupoId, pp.id).subscribe({
    next: () => {
      pp.activo = false;
      // El backend elimina las cuotas no pagadas del pago finalizado → recargar la lista
      this.cargarCuotasMes();
      this.snackBar.open('✅ Pago programado finalizado. Solo quedan visibles las cuotas pagadas.', 'Cerrar', { duration: 4000 });
    },
    error: (err) => {
      this.snackBar.open(err.error?.message || 'Error al finalizar', 'Cerrar', { duration: 3000 });
    }
  });
}

  // ── Añadir un miembro que se sumó tarde a un pago programado en curso ──
  abrirAgregarMiembroPago(pp: PagoProgramadoResponse): void {
    if (!this.esDirectiva) return;
    this.pagoParaAgregarMiembro = pp;
    this.miembrosFaltantesPago = [];
    this.loadingMiembrosFaltantes = true;
    this.pagoProgramadoService.obtenerMiembrosFaltantes(this.grupoId, pp.id).subscribe({
      next: (miembros) => { this.miembrosFaltantesPago = miembros; this.loadingMiembrosFaltantes = false; },
      error: (err) => {
        this.loadingMiembrosFaltantes = false;
        this.pagoParaAgregarMiembro = null;
        this.snackBar.open(err.error?.message || 'No se pudo cargar la lista de miembros', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cerrarAgregarMiembroPago(): void {
    this.pagoParaAgregarMiembro = null;
    this.miembrosFaltantesPago = [];
  }

  confirmarAgregarMiembroAPago(miembro: MiembroFaltante): void {
    if (!this.esDirectiva || !this.pagoParaAgregarMiembro) return;
    const pp = this.pagoParaAgregarMiembro;
    this.loadingAction = true;
    this.pagoProgramadoService.agregarMiembroAPago(this.grupoId, pp.id, miembro.id).subscribe({
      next: () => {
        this.loadingAction = false;
        this.miembrosFaltantesPago = this.miembrosFaltantesPago.filter(m => m.id !== miembro.id);
        this.snackBar.open(`✅ ${miembro.nombre} añadido a "${pp.nombre}"`, 'Cerrar', { duration: 3000 });
        this.cargarCuotasMes();
        if (this.miembrosFaltantesPago.length === 0) this.cerrarAgregarMiembroPago();
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al añadir al miembro', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // ── Gestión de miembros inactivos ──────────────────────────
  private recargarMiembrosGestion(): void {
    this.grupoService.obtenerMiembrosGestion(this.grupoId).subscribe(m => this.miembrosGestion = m);
  }

  inactivarMiembro(m: MiembroGrupo): void {
    if (!this.esDirectiva) return;
    if (!confirm(`¿Marcar a ${m.nombre} ${m.apellido} como INACTIVO? Se congelarán sus cuotas pendientes.`)) return;
    this.pagoProgramadoService.inactivarMiembro(this.grupoId, m.id).subscribe({
      next: () => {
        m.activo = false;
        this.snackBar.open('Miembro marcado como inactivo', 'Cerrar', { duration: 3000 });
        this.cargarCuotasMes();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error', 'Cerrar', { duration: 3000 })
    });
  }

  toggleParticipaCarnaval(m: MiembroGrupo): void {
    if (!this.esDirectiva) return;
    const nuevo = !m.participaCarnaval;
    this.pagoProgramadoService.cambiarParticipacionCarnaval(this.grupoId, m.id, nuevo).subscribe({
      next: () => {
        m.participaCarnaval = nuevo;
        this.snackBar.open(nuevo ? 'Ahora participa en carnaval' : 'Ya no participa en carnaval', 'Cerrar', { duration: 3000 });
        this.cargarCuotasMes();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error', 'Cerrar', { duration: 3000 })
    });
  }

  abrirReactivarMiembro(m: MiembroGrupo): void {
    if (!this.esDirectiva) return;
    this.miembroReactivar = m;
    this.reactivarConCarnaval = true;
    this.reactivarInfo = null;
    this.cargarInfoReactivacion();
  }

  seleccionarOpcionReactivar(conCarnaval: boolean): void {
    if (this.reactivarConCarnaval === conCarnaval) return;
    this.reactivarConCarnaval = conCarnaval;
    this.cargarInfoReactivacion();
  }

  private cargarInfoReactivacion(): void {
    if (!this.miembroReactivar) return;
    this.loadingReactivarInfo = true;
    this.pagoProgramadoService.infoReactivacion(this.grupoId, this.miembroReactivar.id, this.reactivarConCarnaval)
      .subscribe({
        next: (info) => { this.reactivarInfo = info; this.loadingReactivarInfo = false; },
        error: (err) => {
          this.loadingReactivarInfo = false;
          this.miembroReactivar = null;
          this.snackBar.open(err.error?.message || 'No se pudo calcular la deuda', 'Cerrar', { duration: 3000 });
        }
      });
  }

  cerrarReactivarMiembro(): void {
    this.miembroReactivar = null;
    this.reactivarInfo = null;
  }

  confirmarReactivarMiembro(): void {
    if (!this.esDirectiva || !this.miembroReactivar) return;
    const m = this.miembroReactivar;
    const conCarnaval = this.reactivarConCarnaval;
    this.loadingAction = true;
    this.pagoProgramadoService.reactivarMiembro(this.grupoId, m.id, conCarnaval).subscribe({
      next: () => {
        m.activo = true;
        m.participaCarnaval = conCarnaval;
        this.loadingAction = false;
        this.cerrarReactivarMiembro();
        this.snackBar.open('✅ Miembro reactivado y pago registrado', 'Cerrar', { duration: 3000 });
        this.recargarMiembrosGestion();
        this.cargarCuotasMes();
        this.grupoService.obtenerSaldoGrupo(this.grupoId).subscribe(s => this.saldo = s);
        this.kardexService.obtenerKardexGrupo(this.grupoId).subscribe(k => this.kardexList = k);
      },
      error: (err) => {
        this.loadingAction = false;
        this.snackBar.open(err.error?.message || 'Error al reactivar', 'Cerrar', { duration: 3000 });
      }
    });
  }
}