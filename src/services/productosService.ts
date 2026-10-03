import api from '../lib/api'
import {
  PRODUCTOS_MOCK,
  MOVIMIENTOS_INVENTARIO_MOCK,
  type Producto,
  type NuevoProducto,
  type MovimientoInventario
} from '../types/producto'

const RUTA_PRODUCTOS = '/inventario/productos/'

export async function obtenerProductos(): Promise<Producto[]> {
  try {
    const respuesta = await api.get<Producto[]>(RUTA_PRODUCTOS)
    return Array.isArray(respuesta.data) ? respuesta.data : PRODUCTOS_MOCK
  } catch (error) {
    console.warn('Backend de productos no disponible. Usando mocks.', error)
    return PRODUCTOS_MOCK
  }
}

export async function crearProducto(datos: NuevoProducto): Promise<Producto> {
  const respuesta = await api.post<Producto>(RUTA_PRODUCTOS, datos)
  return respuesta.data
}

export async function actualizarProducto(id: number, datos: Partial<Producto>): Promise<Producto> {
  const respuesta = await api.put<Producto>(`${RUTA_PRODUCTOS}${id}/`, datos)
  return respuesta.data
}

// Baja lógica: inactiva el producto en el backend sin eliminar registros relacionados
export async function inactivarProducto(id: number): Promise<void> {
  await api.patch(`${RUTA_PRODUCTOS}${id}/`, { activo: false })
}

// Consulta de movimientos asociados al producto
export async function obtenerMovimientosPorProducto(productoId: number): Promise<MovimientoInventario[]> {
  try {
    const respuesta = await api.get<MovimientoInventario[]>(`/inventario/movimientos/?producto_id=${productoId}`)
    return Array.isArray(respuesta.data)
      ? respuesta.data
      : MOVIMIENTOS_INVENTARIO_MOCK.filter(m => m.producto_id === productoId)
  } catch (error) {
    console.warn('Backend de movimientos no disponible. Usando mocks.', error)
    return MOVIMIENTOS_INVENTARIO_MOCK.filter(m => m.producto_id === productoId)
  }
}
// Catálogo real utilizado por compras y proveedores.
import { obtenerTodasLasPaginas } from './paginacion'
export interface ProductoProveedor { id: number; codigo: string; nombre: string; precio: string }
export const obtenerProductosProveedor = () => obtenerTodasLasPaginas<ProductoProveedor>('/scm/productos/')
