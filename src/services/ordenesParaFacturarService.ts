import { obtenerTodos } from './finanzasApi'
import { aNumero } from '../utils/formatoFinanzas'
import type { OrdenComercial } from '../types/finanzas'

// Solo lectura: Finanzas consulta las órdenes de compra para poder facturarlas.
// Las órdenes de venta todavía no existen en el backend.
const RUTA_ORDENES_COMPRA = '/compras/ordenes-compra/'
const RUTA_PROVEEDORES = '/compras/proveedores/'
const RUTA_ESTADOS_ORDEN_COMPRA = '/compras/estados-orden-compra/'

interface OrdenCompraDetalleCrudo {
  ordencompradetalle_id: number
  producto_id: number
  cantidad: number
  precio_unitario: string
}

// El backend manda `proveedor` y `estado` solo como id.
interface OrdenCompraCruda {
  ordencompra_id: number
  proveedor: number
  estado: number
  fecha: string
  total: string
  detalles: OrdenCompraDetalleCrudo[]
}

interface ProveedorCrudo {
  proveedor_id: number
  nombre: string
  apellido: string
}

interface EstadoOrdenCompraCrudo {
  estadoordencompra_id: number
  nombre: string
}

/**
 * GET: Órdenes de compra con proveedor y estado ya resueltos por nombre.
 * Incluye todas las órdenes; el filtrado de las que se pueden facturar lo hace la vista.
 */
export async function obtenerOrdenesCompra(): Promise<OrdenComercial[]> {
  const [ordenes, proveedores, estados] = await Promise.all([
    obtenerTodos<OrdenCompraCruda>(RUTA_ORDENES_COMPRA),
    obtenerTodos<ProveedorCrudo>(RUTA_PROVEEDORES),
    obtenerTodos<EstadoOrdenCompraCrudo>(RUTA_ESTADOS_ORDEN_COMPRA)
  ])

  const nombresProveedor = new Map(
    proveedores.map((p) => [p.proveedor_id, `${p.nombre} ${p.apellido ?? ''}`.trim()])
  )
  const nombresEstado = new Map(estados.map((e) => [e.estadoordencompra_id, e.nombre]))

  return ordenes.map((orden) => ({
    orden_id: orden.ordencompra_id,
    tipo_orden: 'Compra',
    origen_id: orden.proveedor,
    entidad_nombre: nombresProveedor.get(orden.proveedor) ?? `Proveedor #${orden.proveedor}`,
    fecha: orden.fecha,
    estado_nombre: nombresEstado.get(orden.estado) ?? `Estado #${orden.estado}`,
    total: aNumero(orden.total),
    detalles: (orden.detalles ?? []).map((detalle) => {
      const precio = aNumero(detalle.precio_unitario)
      return {
        detalle_id: detalle.ordencompradetalle_id,
        producto_id: detalle.producto_id,
        producto_nombre: `Producto #${detalle.producto_id}`,
        cantidad: detalle.cantidad,
        preciounitario: precio,
        subtotal: detalle.cantidad * precio
      }
    })
  }))
}

export function esOrdenCancelada(orden: OrdenComercial): boolean {
  return orden.estado_nombre.toLowerCase().includes('cancel')
}
