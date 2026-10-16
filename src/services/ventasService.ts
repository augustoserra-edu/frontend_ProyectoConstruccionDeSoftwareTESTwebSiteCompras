import axios from 'axios'
import api from '../api/clienteAxios'
import { mensajeErrorApi } from '../utils/erroresApi'
import type { Cliente, NuevoCliente } from '../types/cliente'
import type { ProductoVenta } from '../types/venta'
import type { EstadoVenta, VentaHistorial } from '../types/devolucion'

// Rutas del backend (módulo Ventas)
const RUTA_CLIENTES = '/ventas/clientes/'
const RUTA_PRODUCTOS = '/scm/productos/'
const RUTA_ORDENES = '/ventas/ordenes-venta/'
const RUTA_FACTURAS = '/contabilidad/facturas/'

// Las listas paginadas del backend llegan como { count, next, results: [...] }.
// Esta función va pidiendo página por página hasta juntar todo.
async function obtenerTodos<T>(ruta: string): Promise<T[]> {
  const resultado: T[] = []
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data } = await api.get(ruta, { params: { page: pagina } })
    if (Array.isArray(data)) return data as T[] // lista simple, sin paginar
    resultado.push(...((data?.results ?? []) as T[]))
    if (!data?.next) break
  }
  return resultado
}

// ---------- Clientes ----------
// La API usa id_cliente y estado 'AC' (activo) / 'OF' (baja);
// el front usa cliente_id y 'Activo' / 'Inactivo'.
interface ClienteApi {
  id_cliente: number
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  cuil: string | null
  condicion_iva: string | null
  estado: string
}

function clienteDesdeApi(c: ClienteApi): Cliente {
  return {
    cliente_id: c.id_cliente,
    cuil: c.cuil ?? '',
    nombre: c.nombre,
    telefono: c.telefono ?? '',
    email: c.email ?? '',
    direccion: c.direccion ?? '',
    condicion_iva: c.condicion_iva ?? 'Consumidor Final',
    estado: c.estado === 'AC' ? 'Activo' : 'Inactivo',
  }
}

export async function obtenerClientes(): Promise<Cliente[]> {
  const clientes = await obtenerTodos<ClienteApi>(RUTA_CLIENTES)
  return clientes.map(clienteDesdeApi)
}

// ---------- Productos ----------
interface ProductoApi {
  id: number
  nombre: string
  precio: string | number // el backend manda los decimales como texto ("9800.00")
  stock_actual: number
}

export async function obtenerProductosVenta(): Promise<ProductoVenta[]> {
  const productos = await obtenerTodos<ProductoApi>(RUTA_PRODUCTOS)
  return productos.map((p) => ({
    producto_id: p.id,
    nombre: p.nombre,
    preciounitario: Number(p.precio),
    stock: p.stock_actual,
  }))
}

// ---------- Órdenes de venta (historial de Devoluciones) ----------
interface OrdenVentaApi {
  id: number
  cliente: number | null
  numero_comprobante: string | null
  estado_nombre: string | null
  fecha: string
  total: string | number
  items: { producto: number; producto_nombre: string; cantidad: number }[]
}

// Estados que ve el usuario: En proceso, Confirmada, Devuelta y Anulada.
// "Confirmada" significa que Finanzas ya facturó la orden; "En proceso", que todavía no.
function estadoDesdeApi(nombre: string | null, facturada: boolean): EstadoVenta {
  if (nombre && /anul/i.test(nombre)) return 'Anulada'
  if (nombre && /devol/i.test(nombre)) return 'Devuelta'
  return facturada ? 'Confirmada' : 'En proceso'
}

// Números de las órdenes de venta que ya tienen una factura de venta cargada por Finanzas
async function obtenerIdsOrdenesFacturadas(): Promise<Set<number>> {
  const facturas = await obtenerTodos<{ orden_venta_id: number | null; tipo: string }>(RUTA_FACTURAS)
  return new Set(
    facturas
      .filter((f) => f.tipo === 'VENTA' && f.orden_venta_id !== null)
      .map((f) => f.orden_venta_id as number),
  )
}

// '2026-09-28T19:05:00-03:00' -> '2026-09-28 19:05'
function formatearFecha(iso: string): string {
  const f = new Date(iso)
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())} ${dos(f.getHours())}:${dos(f.getMinutes())}`
}

export async function obtenerOrdenesVenta(): Promise<VentaHistorial[]> {
  // La orden solo trae el id del cliente: buscamos los nombres en la lista de clientes
  const [ordenes, clientes, facturadas] = await Promise.all([
    obtenerTodos<OrdenVentaApi>(RUTA_ORDENES),
    obtenerClientes(),
    obtenerIdsOrdenesFacturadas(),
  ])
  const nombrePorId = new Map(clientes.map((c) => [c.cliente_id, c.nombre]))

  return ordenes.map((o) => ({
    id: o.id,
    comprobante: o.numero_comprobante ?? `OV-${o.id}`,
    fecha: formatearFecha(o.fecha),
    cliente: o.cliente ? (nombrePorId.get(o.cliente) ?? 'Cliente mostrador') : 'Cliente mostrador',
    total: Number(o.total),
    estado: estadoDesdeApi(o.estado_nombre, facturadas.has(o.id)),
    items: o.items.map((i) => ({
      productoId: i.producto,
      nombre: i.producto_nombre,
      cantidadVendida: i.cantidad,
    })),
  }))
}

// ---------- Sesión y mensajes de error ----------
function exigirSesion() {
  if (!localStorage.getItem('access_token')) {
    throw new Error('No hay sesión iniciada. Volvé a iniciar sesión.')
  }
}

// Todos los errores se muestran con el mismo formato: "Error: <detalle>".
// Si el token venció (401) se cierra la sesión y se vuelve al login.
export function textoError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setTimeout(() => window.location.reload(), 2500)
  }
  return `Error: ${mensajeErrorApi(err)}`
}

// ---------- Clientes: buscar por CUIL (GET), crear (POST) y editar (PUT) ----------
export async function buscarClientePorCuil(cuil: string): Promise<Cliente | null> {
  const { data } = await api.get(RUTA_CLIENTES, { params: { search: cuil } })
  const lista = (Array.isArray(data) ? data : (data?.results ?? [])) as ClienteApi[]
  const encontrado = lista.find((c) => c.cuil === cuil)
  if (encontrado) return clienteDesdeApi(encontrado)
  // Si el filtro del servidor no busca por CUIL, se revisa la lista completa
  const todos = await obtenerClientes()
  return todos.find((c) => c.cuil === cuil) ?? null
}

function clienteHaciaApi(c: NuevoCliente) {
  return {
    nombre: c.nombre,
    telefono: c.telefono || null,
    email: c.email || null,
    direccion: c.direccion || null,
    cuil: c.cuil || null,
    condicion_iva: c.condicion_iva || null,
    estado: c.estado === 'Activo' ? 'AC' : 'OF', // la baja es lógica: nunca se borra el cliente
  }
}

export async function crearCliente(datos: NuevoCliente): Promise<Cliente> {
  exigirSesion()
  const { data } = await api.post<ClienteApi>(RUTA_CLIENTES, clienteHaciaApi(datos))
  return clienteDesdeApi(data)
}

export async function actualizarCliente(cliente: Cliente): Promise<Cliente> {
  exigirSesion()
  const { data } = await api.put<ClienteApi>(`${RUTA_CLIENTES}${cliente.cliente_id}/`, clienteHaciaApi(cliente))
  return clienteDesdeApi(data)
}

// ---------- Generar orden de venta (POST) ----------
const FORMA_PAGO: Record<string, string> = {
  Efectivo: 'EFECTIVO',
  'Tarjeta de débito': 'DEBITO',
  'Tarjeta de crédito': 'CREDITO',
  Transferencia: 'TRANSFERENCIA',
}

const TIPO_COMPROBANTE: Record<string, string> = {
  'Factura A': 'FACTURA_A',
  'Factura B': 'FACTURA_B',
  'Factura C': 'FACTURA_C',
  'Nota de venta': 'NOTA_VENTA',
}

export interface DatosOrdenVenta {
  clienteId: number
  metodoPago: string
  tipoComprobante: string
  items: { productoId: number; cantidad: number }[]
}

export async function crearOrdenVenta(datos: DatosOrdenVenta): Promise<{ id: number; total: number }> {
  exigirSesion()
  const { data } = await api.post<{ id: number; total: string | number }>(RUTA_ORDENES, {
    cliente: datos.clienteId,
    forma_pago: FORMA_PAGO[datos.metodoPago],
    tipo_comprobante: TIPO_COMPROBANTE[datos.tipoComprobante] ?? null,
    detalles: datos.items.map((i) => ({ producto: i.productoId, cantidad: i.cantidad })),
  })
  return { id: data.id, total: Number(data.total) }
}

// ---------- Devoluciones: anular (POST) y nota de crédito (POST) ----------
export async function anularOrdenVenta(ordenId: number, motivo: string, detalle: string): Promise<void> {
  exigirSesion()
  await api.post('/ventas/anulaciones/', {
    orden_venta: ordenId,
    motivo,
    detalle: detalle.trim() || null,
  })
}

const DESTINO_DEVOLUCION: Record<string, string> = {
  'Stock disponible': 'STOCK_DISPONIBLE',
  'Producto dañado (baja)': 'PRODUCTO_DANADO',
}

export interface DatosNotaCredito {
  ordenId: number
  monto: number
  saldoAFavor: boolean
  items: { productoId: number; cantidad: number; destino: string }[]
}

export async function crearNotaCredito(datos: DatosNotaCredito): Promise<void> {
  exigirSesion()
  await api.post('/ventas/notas-credito/', {
    orden_venta: datos.ordenId,
    monto: datos.monto.toFixed(2),
    saldo_a_favor: datos.saldoAFavor,
    detalles: datos.items.map((i) => ({
      producto: i.productoId,
      cantidad_devuelta: i.cantidad,
      destino: DESTINO_DEVOLUCION[i.destino],
    })),
  })
}
