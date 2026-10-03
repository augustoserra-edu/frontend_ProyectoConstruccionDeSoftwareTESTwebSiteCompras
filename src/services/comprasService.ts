import api from '../api/clienteAxios'
import { obtenerTodasLasPaginas } from './paginacion'
import type { EstadoCompra, FacturaCompra, NuevaOrdenCompra, OrdenCompraCabecera, OrdenCompraDetalle } from '../types/compra'

export interface OrdenCompraAPI {
  ordencompra_id: number
  proveedor: number
  estado: number
  fecha: string
  total: string
  detalles: { ordencompradetalle_id: number; producto_id: number; cantidad: number; precio_unitario: string }[]
}

export const obtenerOrdenesCompra = () => obtenerTodasLasPaginas<OrdenCompraAPI>('/compras/ordenes-compra/')
export const obtenerEstadosCompra = () => obtenerTodasLasPaginas<EstadoCompra>('/compras/estados-orden-compra/')

export function presentarOrden(orden: OrdenCompraAPI, estados: EstadoCompra[]): OrdenCompraCabecera {
  return {
    ordencompra_id: orden.ordencompra_id, proveedor_id: orden.proveedor,
    fecha: orden.fecha, total: Number(orden.total),
    estado: estados.find(e => e.estadoordencompra_id === orden.estado)?.nombre.toLowerCase() ?? `Estado #${orden.estado}`
  }
}

export function presentarDetalles(orden: OrdenCompraAPI): OrdenCompraDetalle[] {
  return orden.detalles.map(d => ({
    ordencompradetalle_id: d.ordencompradetalle_id, ordencompra_id: orden.ordencompra_id,
    producto_id: d.producto_id, cantidad: d.cantidad, preciounitario: Number(d.precio_unitario),
    subtotal: Math.round(d.cantidad * Number(d.precio_unitario) * 100) / 100
  }))
}

export async function crearOrdenCompra(datos: NuevaOrdenCompra): Promise<OrdenCompraAPI> {
  const { data } = await api.post<OrdenCompraAPI>('/compras/ordenes-compra/', {
    proveedor: datos.cabecera.proveedor_id,
    fecha: new Date(`${datos.cabecera.fecha}T12:00:00`).toISOString(),
    // El servidor calcula el total a partir de los renglones.
    detalles: datos.detalles.map(d => ({
      producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.preciounitario.toFixed(2)
    }))
  })
  return data
}

export async function actualizarEstadoCompra(id: number, estado: number): Promise<OrdenCompraAPI> {
  const { data } = await api.patch<OrdenCompraAPI>(`/compras/ordenes-compra/${id}/`, { estado })
  return data
}

export function transicionPermitida(actual: string, nuevo: string) {
  return (actual === 'pendiente' && ['aprobada', 'rechazada'].includes(nuevo)) ||
    (actual === 'aprobada' && ['recibida', 'rechazada'].includes(nuevo))
}

export function estadoCompraReconocido(estado: string) {
  return ['pendiente', 'aprobada', 'rechazada', 'recibida'].includes(estado)
}

export async function obtenerFacturasCompra(): Promise<FacturaCompra[]> {
  const facturas = await obtenerTodasLasPaginas<{
    id: number; orden_compra_id: number | null; numero: string; tipo: string; fecha: string; total: string; subtotal: string; impuestos: string
  }>('/contabilidad/facturas/')
  return facturas.filter(f => f.orden_compra_id != null).map(f => ({
    facturacabecera_id: f.id, ordencompra_id: f.orden_compra_id!, numero: f.numero,
    tipo: f.tipo, fecha: f.fecha, total: Number(f.total), subtotal: Number(f.subtotal), impuesto: Number(f.impuestos)
  }))
}
