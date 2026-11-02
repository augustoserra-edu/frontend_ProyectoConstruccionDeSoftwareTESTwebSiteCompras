import api from '../lib/api'
import type {
  Producto,
  NuevoProducto,
  MovimientoInventario
} from '../types/producto'

const RUTA_PRODUCTOS = '/scm/productos/'

// Tipo auxiliar requerido por OrdenesDeCompras y ProveedoresView
export interface ProductoProveedor {
  id: number
  nombre: string
  codigo?: string
  precio?: number
  rubro?: number | string
}

interface RespuestaProductosAPI {
  count?: number
  next?: string | null
  previous?: string | null
  results?: any[]
}

function mapearProductoDesdeBackend(item: any): Producto {
  const id = item.id ?? item.producto_id
  const rubroId = item.rubro ?? item.rubro_id ?? 0

  return {
    id,
    producto_id: id,
    codigo: item.codigo || `ART-${id}`,
    nombre: item.nombre || '',
    descripcion: item.descripcion || '',
    rubro: rubroId,
    rubro_id: rubroId,
    rubro_nombre: item.rubro_nombre,
    stock_actual: item.stock_actual ?? item.stockactual ?? 0,
    stockactual: item.stock_actual ?? item.stockactual ?? 0,
    stock_minimo: item.stock_minimo ?? item.stockminreposicion ?? 0,
    stockminreposicion: item.stock_minimo ?? item.stockminreposicion ?? 0,
    necesita_reposicion: item.necesita_reposicion,
    activo: item.activo !== false
  }
}

export async function obtenerProductos(): Promise<Producto[]> {
  const respuesta = await api.get<RespuestaProductosAPI | any[]>(RUTA_PRODUCTOS)
  const items = Array.isArray(respuesta.data)
    ? respuesta.data
    : (respuesta.data?.results || [])

  return items.map(mapearProductoDesdeBackend)
}

export async function crearProducto(datos: NuevoProducto & { codigo?: string }): Promise<Producto> {
  const payload = {
    codigo: datos.codigo || `ART-${Date.now().toString().slice(-4)}`,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    rubro: datos.rubro_id,
    stock_minimo: datos.stockminreposicion
  }

  const respuesta = await api.post(RUTA_PRODUCTOS, payload)
  return mapearProductoDesdeBackend(respuesta.data)
}

export async function actualizarProducto(id: number, datos: Partial<Producto>): Promise<Producto> {
  const payload: any = {}
  if (datos.codigo !== undefined) payload.codigo = datos.codigo
  if (datos.nombre !== undefined) payload.nombre = datos.nombre
  if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion
  if (datos.rubro_id !== undefined) payload.rubro = datos.rubro_id
  if (datos.stockminreposicion !== undefined) payload.stock_minimo = datos.stockminreposicion

  const respuesta = await api.patch(`${RUTA_PRODUCTOS}${id}/`, payload)
  return mapearProductoDesdeBackend(respuesta.data)
}

export async function inactivarProducto(id: number): Promise<void> {
  try {
    await api.delete(`${RUTA_PRODUCTOS}${id}/`)
  } catch {
    await api.patch(`${RUTA_PRODUCTOS}${id}/`, { activo: false })
  }
}

export async function obtenerMovimientosPorProducto(productoId: number): Promise<MovimientoInventario[]> {
  const respuesta = await api.get<any>(`/scm/movimientos-inventario/?producto=${productoId}`)
  const items = Array.isArray(respuesta.data)
    ? respuesta.data
    : (respuesta.data?.results || [])

  return items.map((m: any) => ({
    movimientoinventario_id: m.id ?? m.movimientoinventario_id,
    producto_id: m.producto ?? m.producto_id,
    usuario_id: m.usuario ?? m.usuario_id ?? 1,
    tipo: m.tipo,
    cantidad: m.cantidad,
    fecha: m.fecha ? new Date(m.fecha).toLocaleString('es-AR') : '',
    observacion: m.observacion || ''
  }))
}

// Función auxiliar exportada para las vistas de compras y proveedores
export async function obtenerProductosProveedor(): Promise<ProductoProveedor[]> {
  const productos = await obtenerProductos()
  return productos.map(p => ({
    id: p.id ?? p.producto_id,
    nombre: p.nombre,
    codigo: p.codigo,
    rubro: p.rubro_nombre ?? p.rubro_id
  }))
}
