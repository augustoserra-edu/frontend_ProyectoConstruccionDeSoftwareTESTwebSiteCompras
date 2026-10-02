// SIMULACIÓN TEMPORAL: retirar al restablecer la conexión con la API.
// Estado compartido en memoria; se reinicia al recargar la página.
import { ref } from 'vue'
import { PRODUCTOS_MOCK } from '../types/producto'
import type { Proveedor, NuevoProveedor } from '../types/proveedor'
import type { EstadoCompra, FacturaCompra, NuevaOrdenCompra } from '../types/compra'
import type { OrdenCompraAPI } from './comprasService'

export interface ProductoProveedor { id: number; codigo: string; nombre: string; precio: string }
const copiar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor))
const productos: ProductoProveedor[] = PRODUCTOS_MOCK.map(p => ({
  id: p.producto_id, codigo: `ART-${String(p.producto_id).padStart(3, '0')}`,
  nombre: p.nombre, precio: p.preciounitario.toFixed(2)
}))
const proveedores: Proveedor[] = [
  { proveedor_id: 1, nombre: 'Materiales del Sur', apellido: 'S.A.', cuit: '30-50001234-9', email: 'ventas@example.com', telefono: '011-4567-8901', direccion: 'Av. San Martín 1200', productos: [1, 3] },
  { proveedor_id: 2, nombre: 'Distribuidora Central', apellido: 'S.R.L.', cuit: '30-54678912-3', email: 'central@example.com', telefono: '011-4212-3456', direccion: 'Belgrano 450', productos: [1, 2, 4] },
  { proveedor_id: 3, nombre: 'Pinturas del Oeste', apellido: 'S.A.', cuit: '30-61234567-8', email: 'pinturas@example.com', telefono: '011-4789-3322', direccion: 'Rivadavia 3200', productos: [4] }
]
const estados: EstadoCompra[] = ['Pendiente', 'Aprobada', 'Rechazada', 'Recibida'].map((nombre, i) => ({ estadoordencompra_id: i + 1, nombre }))
const ordenes: OrdenCompraAPI[] = [
  { ordencompra_id: 301, proveedor: 1, estado: 1, fecha: '2026-10-01T12:00:00', total: '117500.00', detalles: [
    { ordencompradetalle_id: 1, producto_id: 1, cantidad: 10, precio_unitario: '9800.00' },
    { ordencompradetalle_id: 2, producto_id: 3, cantidad: 30, precio_unitario: '650.00' }
  ] },
  { ordencompra_id: 302, proveedor: 2, estado: 2, fecha: '2026-09-30T12:00:00', total: '29000.00', detalles: [{ ordencompradetalle_id: 3, producto_id: 2, cantidad: 2, precio_unitario: '14500.00' }] },
  { ordencompra_id: 303, proveedor: 3, estado: 4, fecha: '2026-09-29T12:00:00', total: '58000.00', detalles: [{ ordencompradetalle_id: 4, producto_id: 4, cantidad: 1, precio_unitario: '58000.00' }] }
]
const facturas: FacturaCompra[] = [{ facturacabecera_id: 1, ordencompra_id: 303, numero: '0001-00000303', tipo: 'Factura A', fecha: '2026-09-29T12:00:00', subtotal: 58000, impuesto: 12180, total: 70180 }]
let siguienteProveedor = 4
let siguienteOrden = 304
let siguienteDetalle = 5
export const relacionMultipleDisponible = ref(true)
export async function obtenerProductosProveedor() { return copiar(productos) }
export async function obtenerProveedores() { return copiar(proveedores) }
export async function obtenerProveedorPorId(id: number) {
  const proveedor = proveedores.find(p => p.proveedor_id === id)
  if (!proveedor) throw new Error('No se encontró el proveedor.')
  return copiar(proveedor)
}
function validarProveedor(datos: NuevoProveedor, id?: number) {
  if (!datos.nombre.trim() || !datos.apellido.trim()) throw new Error('Completá nombre y apellido o denominación.')
  if (!/^\d{2}-?\d{8}-?\d$/.test(datos.cuit)) throw new Error('El CUIT debe contener 11 dígitos con guiones opcionales.')
  if (proveedores.some(p => p.proveedor_id !== id && p.cuit.replace(/-/g, '') === datos.cuit.replace(/-/g, ''))) throw new Error('Ya existe un proveedor con ese CUIT.')
  if (!datos.productos.length || datos.productos.some(id => !productos.some(p => p.id === id))) throw new Error('Seleccioná al menos un producto válido.')
}
export async function crearProveedor(datos: NuevoProveedor): Promise<Proveedor> {
  validarProveedor(datos)
  const proveedor = copiar({ ...datos, productos: [...new Set(datos.productos)], proveedor_id: siguienteProveedor++ })
  proveedores.push(proveedor)
  return copiar(proveedor)
}
export async function actualizarProveedor(id: number, datos: Partial<NuevoProveedor>): Promise<Proveedor> {
  const anterior = await obtenerProveedorPorId(id)
  const proveedor = { ...anterior, ...copiar(datos), proveedor_id: id }
  const productosQuitados = anterior.productos.filter(productoId => !proveedor.productos.includes(productoId))
  const compraPendiente = ordenes.find(orden => orden.proveedor === id && orden.estado === 1
    && orden.detalles.some(detalle => productosQuitados.includes(detalle.producto_id)))
  if (compraPendiente) {
    const nombres = compraPendiente.detalles
      .filter(detalle => productosQuitados.includes(detalle.producto_id))
      .map(detalle => productos.find(producto => producto.id === detalle.producto_id)?.nombre ?? `Producto #${detalle.producto_id}`)
    throw new Error(`No se puede quitar ${nombres.join(', ')} del proveedor ${anterior.nombre} ${anterior.apellido}: hay una compra pendiente de aprobación (orden #${compraPendiente.ordencompra_id}) con ese producto y proveedor.`)
  }
  validarProveedor(proveedor, id)
  proveedores[proveedores.findIndex(p => p.proveedor_id === id)] = proveedor
  return copiar(proveedor)
}
export async function eliminarProveedor(id: number): Promise<void> {
  if (ordenes.some(o => o.proveedor === id)) throw new Error('El proveedor tiene órdenes asociadas.')
  const indice = proveedores.findIndex(p => p.proveedor_id === id)
  if (indice < 0) throw new Error('No se encontró el proveedor.')
  proveedores.splice(indice, 1)
}
export async function obtenerOrdenesCompra() { return copiar(ordenes) }
export async function obtenerEstadosCompra() { return copiar(estados) }
export async function obtenerFacturasCompra() { return copiar(facturas) }
export async function crearOrdenCompra(datos: NuevaOrdenCompra): Promise<OrdenCompraAPI> {
  const proveedor = await obtenerProveedorPorId(datos.cabecera.proveedor_id)
  if (!datos.detalles.length || datos.detalles.some(d => !proveedor.productos.includes(d.producto_id)
    || !Number.isSafeInteger(d.cantidad) || d.cantidad <= 0
    || !Number.isFinite(d.preciounitario) || d.preciounitario <= 0)) throw new Error('Revisá los productos, las cantidades y los precios de la orden.')
  if (new Set(datos.detalles.map(d => d.producto_id)).size !== datos.detalles.length) throw new Error('Cada producto puede aparecer una sola vez.')
  const total = datos.detalles.reduce((suma, d) => suma + d.cantidad * d.preciounitario, 0)
  if (!Number.isFinite(total) || total <= 0) throw new Error('El total no es válido.')
  const fecha = new Date(`${datos.cabecera.fecha}T12:00:00`).toISOString()
  const orden: OrdenCompraAPI = {
    ordencompra_id: siguienteOrden++, proveedor: proveedor.proveedor_id, estado: 1, fecha, total: total.toFixed(2),
    detalles: datos.detalles.map(d => ({ ordencompradetalle_id: siguienteDetalle++, producto_id: d.producto_id, cantidad: d.cantidad, precio_unitario: d.preciounitario.toFixed(2) }))
  }
  ordenes.push(orden)
  return copiar(orden)
}
export async function actualizarEstadoCompra(id: number, estado: number): Promise<OrdenCompraAPI> {
  const orden = ordenes.find(o => o.ordencompra_id === id)
  if (!orden) throw new Error('No se encontró la orden.')
  if (!((orden.estado === 1 && [2, 3].includes(estado)) || (orden.estado === 2 && [3, 4].includes(estado)))) throw new Error('El cambio de estado no está permitido.')
  orden.estado = estado
  return copiar(orden)
}
