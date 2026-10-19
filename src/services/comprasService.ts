import api from '../api/clienteAxios'
import type { Proveedor } from '../types/proveedor'
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
export async function obtenerEstadosCompra() {
  const estados = await obtenerTodasLasPaginas<EstadoCompra>('/compras/estados-orden-compra/')
  const posicion = (nombre: string) => {
    const indice = estadosCompra.findIndex(estado => estado === normalizarEstadoCompra(nombre))
    return indice < 0 ? estadosCompra.length : indice
  }
  return estados.sort((a, b) => posicion(a.nombre) - posicion(b.nombre))
}

export function presentarOrden(orden: OrdenCompraAPI, estados: EstadoCompra[]): OrdenCompraCabecera {
  return {
    ordencompra_id: orden.ordencompra_id, proveedor_id: orden.proveedor,
    fecha: orden.fecha, total: Number(orden.total),
    estado: normalizarEstadoCompra(estados.find(e => e.estadoordencompra_id === orden.estado)?.nombre ?? `Estado #${orden.estado}`)
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
    fecha: new Date().toISOString(),
    // El servidor calcula el total a partir de los renglones.
    detalles: datos.detalles.map(d => ({
      producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.preciounitario.toFixed(2)
    }))
  })
  return data
}

export async function editarOrdenCompra(id: number, datos: NuevaOrdenCompra): Promise<OrdenCompraAPI> {
  const { data } = await api.patch<OrdenCompraAPI>(`/compras/ordenes-compra/${id}/`, {
    proveedor: datos.cabecera.proveedor_id,
    detalles: datos.detalles.map(d => ({ producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.preciounitario.toFixed(2) }))
  })
  return data
}

export async function actualizarEstadoCompra(id: number, estado: number): Promise<OrdenCompraAPI> {
  const { data } = await api.patch<OrdenCompraAPI>(`/compras/ordenes-compra/${id}/`, { estado })
  return data
}

export const estadosCompra = ['pendiente', 'aprobada', 'rechazada', 'recibida', 'devuelto', 'contabilizado'] as const

const transicionesCompra: Record<string, readonly string[]> = {
  pendiente: ['aprobada', 'rechazada'],
  aprobada: ['recibida', 'devuelto'],
  recibida: [],
  rechazada: [],
  devuelto: [],
  contabilizado: []
}

export function normalizarEstadoCompra(nombre: string) {
  const estado = nombre.trim().toLowerCase()
  if (['aprobado', 'aprobar'].includes(estado)) return 'aprobada'
  if (['rechazado', 'rechazar'].includes(estado)) return 'rechazada'
  if (['recibido', 'recibir'].includes(estado)) return 'recibida'
  return estado
}

export function buscarEstadoCompra(estados: EstadoCompra[], nombre: string) {
  const buscado = normalizarEstadoCompra(nombre)
  // Preferimos el nombre canónico si el catálogo contiene variantes duplicadas.
  return estados.find(estado => estado.nombre.trim().toLowerCase() === buscado)
    ?? estados.find(estado => normalizarEstadoCompra(estado.nombre) === buscado)
}

export function transicionPermitida(actual: string, nuevo: string) {
  actual = normalizarEstadoCompra(actual)
  nuevo = normalizarEstadoCompra(nuevo)
  return Object.hasOwn(transicionesCompra, actual) && transicionesCompra[actual]!.includes(nuevo)
}

export function estadoCompraReconocido(estado: string) {
  return estadosCompra.some(nombre => nombre === normalizarEstadoCompra(estado))
}

export function claseEstadoCompra(estado: string) {
  const nombre = normalizarEstadoCompra(estado)
  if (['aprobada', 'contabilizado'].includes(nombre)) return 'bg-success'
  if (['rechazada', 'devuelto'].includes(nombre)) return 'bg-danger'
  if (nombre === 'recibida') return 'bg-primary'
  if (nombre === 'pendiente') return 'bg-warning text-dark'
  return 'bg-secondary'
}

export function etiquetaEstadoCompra(estado: string) {
  estado = normalizarEstadoCompra(estado)
  if (estado === 'aprobada') return 'Aprobado'
  if (estado === 'rechazada') return 'Rechazado'
  if (estado === 'recibida') return 'Recibido'
  return estado.charAt(0).toUpperCase() + estado.slice(1)
}

export function formatearFechaHoraCompra(valor: string) {
  // Los registros que solo tienen fecha no deben inventar una hora.
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Fecha no disponible'
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(fecha)
  const campos = Object.fromEntries(partes.map(({ type, value }) => [type, value]))
  return `${campos.year}-${campos.month}-${campos.day} ${campos.hour}:${campos.minute}`
}

export async function obtenerFacturasCompra(): Promise<FacturaCompra[]> {
  const facturas = await obtenerTodasLasPaginas<{
    id: number; orden_compra_id: number | null; numero: string; tipo: string; fecha: string; total: string; subtotal: string; impuestos: string
  }>('/contabilidad/facturas/')
  return facturas.filter(f => f.tipo === 'COMPRA' && f.orden_compra_id != null).map(f => ({
    facturacabecera_id: f.id, ordencompra_id: f.orden_compra_id!, numero: f.numero,
    tipo: f.tipo, fecha: f.fecha, total: Number(f.total), subtotal: Number(f.subtotal), impuesto: Number(f.impuestos)
  }))
}

export type ProveedorAPI = Proveedor

// Compras sincroniza estados, sin emitir facturas ni asientos.
let sincronizacionFacturas: Promise<{
  ordenes: OrdenCompraAPI[]
  facturas: FacturaCompra[]
  errores: { ordenId: number; causa: unknown }[]
}> | null = null

export function sincronizarComprasFacturadas() {
  if (sincronizacionFacturas) return sincronizacionFacturas
  sincronizacionFacturas = (async () => {
    const [ordenes, facturas, estados] = await Promise.all([
      obtenerOrdenesCompra(), obtenerFacturasCompra(), obtenerEstadosCompra()
    ])
    const facturadas = new Set(facturas.map(factura => factura.ordencompra_id))
    const pendientes = ordenes.filter(orden =>
      presentarOrden(orden, estados).estado === 'recibida' && facturadas.has(orden.ordencompra_id)
    )
    const errores: { ordenId: number; causa: unknown }[] = []
    const contabilizado = buscarEstadoCompra(estados, 'contabilizado')
    for (const orden of pendientes) {
      try {
        if (!contabilizado) throw new Error('El catálogo no contiene el estado Contabilizado.')
        const actualizada = await actualizarEstadoCompra(orden.ordencompra_id, contabilizado.estadoordencompra_id)
        ordenes[ordenes.indexOf(orden)] = actualizada
      } catch (causa) {
        errores.push({ ordenId: orden.ordencompra_id, causa })
      }
    }
    return { ordenes, facturas, errores }
  })().finally(() => { sincronizacionFacturas = null })
  return sincronizacionFacturas
}

interface ProveedorRespuestaAPI {
  proveedor_id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  cuit: string
  direccion: string
  productos?: (number | { producto_id: number; precio_compra: string | null })[]
  producto_id?: number | null
}

export async function obtenerProveedores(): Promise<Proveedor[]> {
  const proveedores = await obtenerTodasLasPaginas<ProveedorRespuestaAPI>('/compras/proveedores/')
  return proveedores.map(({ producto_id, productos, ...proveedor }) => {
    const asociados = productos ?? (producto_id == null ? [] : [producto_id])
    return {
      ...proveedor,
      productos: asociados.map(producto => typeof producto === 'number' ? producto : producto.producto_id),
      preciosCompra: Object.fromEntries(asociados.flatMap(producto => typeof producto === 'number' ? [] : [[
        producto.producto_id, producto.precio_compra === null ? null : Number(producto.precio_compra)
      ]]))
    }
  })
}

export function precioCompraProveedor(proveedor: Proveedor, producto: { id: number; precio?: number }) {
  // El servidor anterior usa el precio del producto. Un precio de compra nulo
  // en el contrato nuevo sigue siendo faltante y no se reemplaza por el de venta.
  if (proveedor.preciosCompra && Object.hasOwn(proveedor.preciosCompra, producto.id)) {
    return proveedor.preciosCompra[producto.id] ?? NaN
  }
  return producto.precio ?? NaN
}
