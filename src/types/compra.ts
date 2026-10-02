import type { FacturaCabecera } from './finanzas'

// Contratos provisionales de la simulación, a ajustar cuando exista el backend.
export interface OrdenCompraCabecera {
  ordencompra_id: number
  proveedor_id: number
  // Este atributo no está en el DER; se simula para identificar al solicitante interno.
  solicitante: string
  fecha: string
  // Este atributo no está en el DER; se simula el nombre en lugar de resolver estado_id.
  // Sin estado hasta registrar la recepción; luego queda pendiente de evaluación.
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'recibida' | null
  total: number
}

export interface OrdenCompraDetalle {
  ordencompradetalle_id: number
  ordencompra_id: number
  producto_id: number
  cantidad: number
  preciounitario: number
  // Este atributo no está en el DER de OrdenCompraDetalle; se calcula para presentación.
  subtotal: number
}

export type NuevaOrdenCompraCabecera = Omit<OrdenCompraCabecera, 'ordencompra_id' | 'estado'>
export type NuevoOrdenCompraDetalle = Omit<OrdenCompraDetalle, 'ordencompradetalle_id' | 'ordencompra_id' | 'subtotal'>

export interface NuevaOrdenCompra {
  cabecera: NuevaOrdenCompraCabecera
  detalles: NuevoOrdenCompraDetalle[]
}

export const CABECERAS_COMPRA_MOCK: OrdenCompraCabecera[] = [
  { ordencompra_id: 301, proveedor_id: 1, solicitante: 'Depósito Central', fecha: '2026-09-11', estado: null, total: 490000 },
  { ordencompra_id: 302, proveedor_id: 2, solicitante: 'Sucursal Norte', fecha: '2026-09-13', estado: null, total: 290000 }
]

export const DETALLES_COMPRA_MOCK: OrdenCompraDetalle[] = [
  { ordencompradetalle_id: 1, ordencompra_id: 301, producto_id: 1, cantidad: 50, preciounitario: 9800, subtotal: 490000 },
  { ordencompradetalle_id: 2, ordencompra_id: 302, producto_id: 2, cantidad: 20, preciounitario: 14500, subtotal: 290000 }
]

// Factura de ejemplo vinculada por ordencompra_id. No se genera una factura al aprobar.
export const FACTURAS_COMPRA_MOCK: FacturaCabecera[] = [
  {
    facturacabecera_id: 301,
    ordenventa_id: null,
    ordencompra_id: 301,
    diario_id: null,
    tipo: 'Factura A',
    numero: 'FC-0000301',
    fecha: '2026-09-12',
    subtotal: 490000,
    impuesto: 102900,
    total: 592900
  }
]
