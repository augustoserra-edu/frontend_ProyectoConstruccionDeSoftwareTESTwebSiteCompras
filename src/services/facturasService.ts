import finanzasApi, { obtenerTodos } from './finanzasApi'
import { aNumero } from '../utils/formatoFinanzas'
import type { FacturaApi, FacturaDetalleApi, NuevaFacturaApi } from '../types/finanzasApi'

const RUTA_FACTURAS = '/contabilidad/facturas/'

// Forma cruda de la respuesta: los decimales llegan como string.
interface FacturaDetalleCruda {
  id: number
  producto_id: number
  cantidad: number
  precio_unitario: string
  subtotal: string
}

interface FacturaCruda {
  id: number
  orden_venta_id: number | null
  orden_compra_id: number | null
  diario: number | null
  tipo: FacturaApi['tipo']
  numero: string
  fecha: string
  subtotal: string
  impuestos: string
  total: string
  detalles: FacturaDetalleCruda[]
}

function convertirDetalle(detalle: FacturaDetalleCruda): FacturaDetalleApi {
  return {
    id: detalle.id,
    producto_id: detalle.producto_id,
    cantidad: detalle.cantidad,
    precio_unitario: aNumero(detalle.precio_unitario),
    subtotal: aNumero(detalle.subtotal)
  }
}

function convertirFactura(factura: FacturaCruda): FacturaApi {
  return {
    id: factura.id,
    orden_venta_id: factura.orden_venta_id,
    orden_compra_id: factura.orden_compra_id,
    diario: factura.diario,
    tipo: factura.tipo,
    numero: factura.numero,
    fecha: factura.fecha,
    subtotal: aNumero(factura.subtotal),
    impuestos: aNumero(factura.impuestos),
    total: aNumero(factura.total),
    detalles: (factura.detalles ?? []).map(convertirDetalle)
  }
}

/**
 * GET: Obtener todas las facturas con sus detalles anidados
 */
export async function obtenerFacturas(): Promise<FacturaApi[]> {
  const facturas = await obtenerTodos<FacturaCruda>(RUTA_FACTURAS)
  return facturas.map(convertirFactura)
}

/**
 * POST: Crear una factura con sus detalles. Subtotal y total los calcula el backend.
 */
export async function crearFactura(datos: NuevaFacturaApi): Promise<FacturaApi> {
  const respuesta = await finanzasApi.post<FacturaCruda>(RUTA_FACTURAS, datos)
  return convertirFactura(respuesta.data)
}
