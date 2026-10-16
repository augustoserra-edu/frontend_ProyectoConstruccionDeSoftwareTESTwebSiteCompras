import api from '../api/clienteAxios'
import { ref } from 'vue'
import type { Proveedor, NuevoProveedor } from '../types/proveedor'
import { importeValido } from '../utils/validacionesCompras'
import type { ProductoProveedor } from './productosService'
import { obtenerTodasLasPaginas } from './paginacion'

const RUTA_PROVEEDORES = '/compras/proveedores/' // Ajustar la ruta si el backend usa '/proveedores/' o similar

export const relacionMultipleDisponible = ref(true)
type ProductoAsociadoAPI = number | string | { producto_id: number | string; precio_compra: string | number | null }

type ProveedorAPI = Omit<Proveedor, 'productos'> & { productos?: ProductoAsociadoAPI[]; producto_id?: number | string | null }

function presentarProveedor(datos: ProveedorAPI): Proveedor {
  const { producto_id, productos, ...proveedor } = datos
  const asociados = productos ?? (producto_id == null ? [] : [producto_id])
  const ids = asociados.map(item => Number(typeof item === 'object' ? item.producto_id : item))
  if (ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('El proveedor tiene un producto con ID inválido.')
  const precios = asociados.flatMap(item => typeof item === 'object' ? [[Number(item.producto_id), item.precio_compra === null ? null : Number(item.precio_compra)]] : [])
  return { ...proveedor, productos: [...new Set(ids)], ...(precios.length ? { preciosCompra: Object.fromEntries(precios) } : {}) }
}

export async function obtenerProveedores(): Promise<Proveedor[]> {
  const datos = await obtenerTodasLasPaginas<ProveedorAPI>(RUTA_PROVEEDORES)
  relacionMultipleDisponible.value = !datos.some(p => !Array.isArray(p.productos) && 'producto_id' in p)
  return datos.map(presentarProveedor)
}

export async function obtenerProveedorPorId(id: number): Promise<Proveedor> {
  const respuesta = await api.get<ProveedorAPI>(`${RUTA_PROVEEDORES}${id}/`)
  return presentarProveedor(respuesta.data)
}

export async function crearProveedor(datos: NuevoProveedor): Promise<Proveedor> {
  if (!relacionMultipleDisponible.value) throw new Error('El servidor requiere actualizar el módulo de proveedores.')
  const respuesta = await api.post<ProveedorAPI>(RUTA_PROVEEDORES, prepararProveedor(datos))
  return presentarProveedor(respuesta.data)
}

export async function actualizarProveedor(id: number, datos: Partial<NuevoProveedor>): Promise<Proveedor> {
  if (!relacionMultipleDisponible.value) throw new Error('El servidor requiere actualizar el módulo de proveedores.')
  const respuesta = await api.patch<ProveedorAPI>(`${RUTA_PROVEEDORES}${id}/`, prepararProveedor(datos))
  return presentarProveedor(respuesta.data)
}

export async function eliminarProveedor(id: number): Promise<void> {
  await api.delete(`${RUTA_PROVEEDORES}${id}/`)
}

// Consumo de SCM para Compras/Proveedores: catálogo completo, sin datos simulados.
export async function obtenerCatalogoProductosProveedor(): Promise<ProductoProveedor[]> {
  const productos = await obtenerTodasLasPaginas<{
    id?: number | string; producto_id?: number | string; nombre: string; codigo?: string;
    precio?: string | number | null; preciounitario?: string | number | null;
    rubro?: number | string; rubro_id?: number; rubro_nombre?: string
  }>('/scm/productos/')
  return productos.map(producto => {
    const id = Number(producto.id ?? producto.producto_id)
    if (!Number.isSafeInteger(id) || !id || id < 0 || typeof producto.nombre !== 'string') {
      throw new Error('El catálogo de productos contiene un registro inválido.')
    }
    const precio = producto.precio ?? producto.preciounitario
    return {
      id, nombre: producto.nombre, codigo: producto.codigo,
      precio: precio == null ? undefined : Number(precio),
      rubro: producto.rubro_nombre ?? producto.rubro ?? producto.rubro_id
    }
  })
}

function prepararProveedor(datos: Partial<NuevoProveedor>) {
  const { preciosCompra, ...payload } = datos
  if (!datos.productos) return payload
  return { ...payload, productos: datos.productos.map(producto_id => {
    const precio = preciosCompra?.[producto_id]
    if (precio == null || !importeValido(precio)) throw new Error(`Ingresá un precio de compra válido para el producto #${producto_id}.`)
    return { producto_id, precio_compra: precio.toFixed(2) }
  }) }
}
