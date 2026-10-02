export { relacionMultipleDisponible, obtenerProveedores, obtenerProveedorPorId, crearProveedor, actualizarProveedor, eliminarProveedor } from './comprasSimuladas'

// API COMENTADA TEMPORALMENTE: conservar hasta que se restablezca la conexión con la API.
// Para restaurar: quitar la implementación simulada de este archivo y descomentar el bloque original.
// import api from '../lib/api'
// import { ref } from 'vue'
// import type { Proveedor, NuevoProveedor } from '../types/proveedor'
// import { obtenerTodasLasPaginas } from './paginacion'
// 
// const RUTA_PROVEEDORES = '/compras/proveedores/' // Ajustar la ruta si el backend usa '/proveedores/' o similar
// 
// export const relacionMultipleDisponible = ref(true)
// type ProveedorAPI = Omit<Proveedor, 'productos'> & { productos?: number[]; producto_id?: number | null }
// 
// function presentarProveedor(datos: ProveedorAPI): Proveedor {
//   const { producto_id, ...proveedor } = datos
//   return { ...proveedor, productos: datos.productos ?? (producto_id == null ? [] : [producto_id]) }
// }
// 
// export async function obtenerProveedores(): Promise<Proveedor[]> {
//   const datos = await obtenerTodasLasPaginas<ProveedorAPI>(RUTA_PROVEEDORES)
//   relacionMultipleDisponible.value = !datos.some(p => !Array.isArray(p.productos) && 'producto_id' in p)
//   return datos.map(presentarProveedor)
// }
// 
// export async function obtenerProveedorPorId(id: number): Promise<Proveedor> {
//   const respuesta = await api.get<ProveedorAPI>(`${RUTA_PROVEEDORES}${id}/`)
//   return presentarProveedor(respuesta.data)
// }
// 
// export async function crearProveedor(datos: NuevoProveedor): Promise<Proveedor> {
//   if (!relacionMultipleDisponible.value) throw new Error('El servidor requiere actualizar el módulo de proveedores.')
//   const respuesta = await api.post<Proveedor>(RUTA_PROVEEDORES, datos)
//   return respuesta.data
// }
// 
// export async function actualizarProveedor(id: number, datos: Partial<NuevoProveedor>): Promise<Proveedor> {
//   if (!relacionMultipleDisponible.value) throw new Error('El servidor requiere actualizar el módulo de proveedores.')
//   const respuesta = await api.patch<Proveedor>(`${RUTA_PROVEEDORES}${id}/`, datos)
//   return respuesta.data
// }
// 
// export async function eliminarProveedor(id: number): Promise<void> {
//   await api.delete(`${RUTA_PROVEEDORES}${id}/`)
// }
// 
