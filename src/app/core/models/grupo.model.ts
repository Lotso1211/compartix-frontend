export interface Grupo {
  id: number;
  nombre: string;
  descripcion?: string;
  codigoInvitacion: string;
  cuotaBase: number;
  moneda: string;
  activo: boolean;
  alertaSaldoCarnaval?: number;
  alertaSaldoAhorro?: number;
  creadoEn: string;
}

export interface ActualizarAlertasRequest {
  alertaSaldoCarnaval?: number | null;
  alertaSaldoAhorro?: number | null;
}

export interface CrearGrupoRequest {
  nombre: string;
  descripcion?: string;
  cuotaBase: number;
  moneda: string;
}

export interface SaldoGrupo {
  grupoId: number;
  nombreGrupo: string;
  totalIngresos: number;
  totalEgresos: number;
  totalMultas: number;
  saldoDisponible: number;
  saldoCarnaval?: number;
  saldoAhorro?: number;
  actualizadoEn: string;
}

export interface MiembroGrupo {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo?: boolean;
  participaCarnaval?: boolean;
}