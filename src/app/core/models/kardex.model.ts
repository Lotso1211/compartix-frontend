export interface Kardex {
  id: number;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
  grupo: {
    id: number;
    nombre: string;
  };
  totalAportes: number;
  totalGastosCompartidos: number;
  totalGastosIndividuales: number;
  totalMultas: number;
  totalAhorro?: number;
  saldoActual: number;
  actualizadoEn: string;
}