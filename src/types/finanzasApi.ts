// Tipos calcados del JSON real del backend de Finanzas (/api/contabilidad/...).
// Los decimales que el backend manda como string ya vienen convertidos a number
// por los services.

export interface PeriodoApi {
  id: number
  anio: number
  mes: number
}
export type NuevoPeriodoApi = Omit<PeriodoApi, 'id'>

export type EstadoCierreApi = 'ABIERTO' | 'CERRADO'

export interface CierreMensualApi {
  id: number
  // Solo el id del período: el año y el mes hay que cruzarlos con PeriodoApi.
  periodo: number
  fecha_cierre: string | null
  estado: EstadoCierreApi
}

export interface DiarioApi {
  id: number
  cierre_mensual: number
  fecha: string
  descripcion: string
}

export type TipoFacturaApi = 'VENTA' | 'COMPRA'

export interface FacturaDetalleApi {
  id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface FacturaApi {
  id: number
  orden_venta_id: number | null
  orden_compra_id: number | null
  diario: number | null
  tipo: TipoFacturaApi
  numero: string
  fecha: string
  subtotal: number
  impuestos: number
  total: number
  detalles: FacturaDetalleApi[]
}

// Body del POST: subtotal y total los calcula el backend.
export interface NuevaFacturaApi {
  tipo: TipoFacturaApi
  numero: string
  fecha: string
  orden_venta_id?: number
  orden_compra_id?: number
  diario?: number
  impuestos: string
  detalles: { producto_id: number; cantidad: number; precio_unitario: string }[]
}
