export type TipoMovimiento = 'APORTE' | 'GASTO_COMPARTIDO' | 'GASTO_INDIVIDUAL' | 'MULTA' | 'INGRESO_DIRECTO';

// A qué fondo pertenece un movimiento. Los aportes/ingresos solo usan CARNAVAL o AHORRO
// (un único fondo); los gastos además admiten MIXTO (repartido entre ambos).
export type TipoFondo = 'CARNAVAL' | 'AHORRO' | 'MIXTO';

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  descripcion?: string;
  montoTotal: number;
  fecha: string;
  comprobanteUrl?: string;
  origenIa: boolean;
  fondo?: TipoFondo;
  usuarioAfectado?: string;
  registradoPor: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  creadoEn: string;
}

export interface RegistrarAporteRequest {
  usuarioId: number;
  monto: number;
  fecha: string;
  fondo: TipoFondo;
  categoriaId?: number;
  descripcion?: string;
  comprobanteUrl?: string;
}

export interface RegistrarGastoCompartidoRequest {
  descripcion: string;
  montoTotal: number;
  fecha: string;
  usuarioIds: number[];
  fondo: TipoFondo;
  montoCarnaval?: number;
  montoAhorro?: number;
  categoriaId?: number;
}

export interface RegistrarGastoIndividualRequest {
  descripcion: string;
  precioUnitario: number;
  fecha: string;
  cantidadesPorUsuario: { [usuarioId: number]: number };
  fondo: TipoFondo;
  montoCarnaval?: number;
  montoAhorro?: number;
  categoriaId?: number;
}

export interface RegistrarMultaRequest {
  usuarioId: number;
  motivo: string;
  monto: number;
  fecha: string;
  periodoMes?: number;
  periodoAnio?: number;
}

export interface RegistrarIngresoDirectoRequest {
  descripcion?: string;
  monto: number;
  fecha: string;
  fondo: TipoFondo;
}
