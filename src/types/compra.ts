// Representación de las órdenes de la API para las vistas de compras.
export interface OrdenCompraCabecera {
  ordencompra_id: number
  proveedor_id: number
  fecha: string
  estado: string
  total: number
}
export interface OrdenCompraDetalle {
  ordencompradetalle_id: number
  ordencompra_id: number
  producto_id: number
  cantidad: number
  preciounitario: number
  subtotal: number
}
export type NuevaOrdenCompraCabecera = Omit<OrdenCompraCabecera, 'ordencompra_id' | 'estado'>
export type NuevoOrdenCompraDetalle = Omit<OrdenCompraDetalle, 'ordencompradetalle_id' | 'ordencompra_id' | 'subtotal'>
export interface NuevaOrdenCompra {
  cabecera: NuevaOrdenCompraCabecera
  detalles: NuevoOrdenCompraDetalle[]
}
export interface EstadoCompra { estadoordencompra_id: number; nombre: string }
export interface FacturaCompra {
  facturacabecera_id: number
  ordencompra_id: number
  numero: string
  tipo: string
  fecha: string
  total: number
  subtotal: number
  impuesto: number
}
