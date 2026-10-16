<script setup lang="ts">
import { vTextoLimpio } from '../directives/textoLimpio'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import ModalNuevaOrdenCompra from '../components/ModalNuevaOrdenCompra.vue'
import ModalVerOrdenesCompra from '../components/ModalVerOrdenesCompra.vue'
import { normalizarBusqueda } from '../utils/busqueda'
import { mensajeErrorApi } from '../utils/erroresApi'
import type { ProductoProveedor } from '../services/productosService'
import { obtenerCatalogoProductosProveedor } from '../services/proveedoresService'
import { editarOrdenCompra, actualizarEstadoCompra, claseEstadoCompra, buscarEstadoCompra, normalizarEstadoCompra, crearOrdenCompra, obtenerProveedores, enviarOrdenAFinanzas, type DatosFacturaCompra, etiquetaEstadoCompra, obtenerEstadosCompra, obtenerFacturasCompra, obtenerOrdenesCompra, presentarDetalles, presentarOrden, transicionPermitida, type OrdenCompraAPI } from '../services/comprasService'
import type { Proveedor } from '../types/proveedor'
import type { EstadoCompra, FacturaCompra, NuevaOrdenCompra } from '../types/compra'

const ordenesAPI = ref<OrdenCompraAPI[]>([])
const proveedores = ref<Proveedor[]>([])
const productos = ref<ProductoProveedor[]>([])
const estados = ref<EstadoCompra[]>([])
const facturas = ref<FacturaCompra[]>([])
const cargando = ref(false)
const guardando = ref(false)
const guardandoEstado = ref(false)
const cargandoFacturas = ref(false)
const catalogosListos = ref(false)
const errorConsulta = ref('')
const errorGuardado = ref('')
const errorEstado = ref('')
const errorFacturas = ref('')
const mensaje = ref('')
const mostrarNuevaOrden = ref(false)
const ordenAEditar = ref<OrdenCompraAPI | null>(null)
const mostrarConsultaOrdenes = ref(false)
const ordenConsultaId = ref<number | null>(null)
const filtroBusqueda = ref('')
const filtroEstado = ref('')
type CampoOrden = 'numero' | 'proveedor' | 'fecha'
const campoOrden = ref<CampoOrden>('numero')
const sentidoOrden = ref<'asc' | 'desc'>('desc')
function ordenarPor(campo: CampoOrden) {
  sentidoOrden.value = campoOrden.value === campo && sentidoOrden.value === 'asc' ? 'desc' : 'asc'
  campoOrden.value = campo
}
const indicadorOrden = (campo: CampoOrden) => campoOrden.value === campo ? (sentidoOrden.value === 'asc' ? '↑' : '↓') : '↕'
const ariaOrden = (campo: CampoOrden) => campoOrden.value !== campo ? 'none' : sentidoOrden.value === 'asc' ? 'ascending' : 'descending'
const etiquetaOrden = (campo: CampoOrden, nombre: string) => `Ordenar por ${nombre} ${campoOrden.value === campo && sentidoOrden.value === 'asc' ? 'descendente' : 'ascendente'}`
const mensajeConfirmacion = ref('')
let resolverConfirmacion: ((confirmado: boolean) => void) | null = null
const accionesBloqueadas = computed(() => cargando.value || guardando.value || guardandoEstado.value || !!mensajeConfirmacion.value)
const cabeceras = computed(() => ordenesAPI.value.map(o => presentarOrden(o, estados.value)))
const detalles = computed(() => ordenesAPI.value.flatMap(presentarDetalles))
const nombreProveedor = (id: number) => {
  const proveedor = proveedores.value.find(p => p.proveedor_id === id)
  return proveedor ? `${proveedor.nombre} ${proveedor.apellido}` : `Proveedor #${id}`
}
const nombreProducto = (id: number) => productos.value.find(p => p.id === id)?.nombre ?? `Producto #${id}`
const moneda = (valor: number) => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const fechaVisible = (valor: string) => new Date(valor).toLocaleDateString('es-AR')
const ordenesFiltradas = computed(() => cabeceras.value.filter(o =>
  (!filtroEstado.value || o.estado === filtroEstado.value) &&
  normalizarBusqueda(`${o.ordencompra_id} ${nombreProveedor(o.proveedor_id)} ${fechaVisible(o.fecha)}`).includes(normalizarBusqueda(filtroBusqueda.value))
).sort((a, b) => {
  const diferenciaNumero = a.ordencompra_id - b.ordencompra_id
  let comparacion = 0
  if (campoOrden.value === 'numero') comparacion = diferenciaNumero
  else if (campoOrden.value === 'proveedor') {
    comparacion = nombreProveedor(a.proveedor_id).localeCompare(nombreProveedor(b.proveedor_id), 'es-AR', { sensitivity: 'base', numeric: true })
  } else {
    const fechaA = Date.parse(a.fecha)
    const fechaB = Date.parse(b.fecha)
    // Las fechas inválidas quedan al final, en ambos sentidos.
    if (Number.isNaN(fechaA) || Number.isNaN(fechaB)) {
      return Number(Number.isNaN(fechaA)) - Number(Number.isNaN(fechaB)) || diferenciaNumero
    }
    comparacion = fechaA - fechaB
  }
  return (comparacion || diferenciaNumero) * (sentidoOrden.value === 'asc' ? 1 : -1)
}))

const filasPorPagina = 20
const limiteFilas = ref(filasPorPagina)
const ordenesVisibles = computed(() => ordenesFiltradas.value.slice(0, limiteFilas.value))
const hayMasOrdenes = computed(() => limiteFilas.value < ordenesFiltradas.value.length)
function cargarMas() {
  limiteFilas.value += filasPorPagina
}
watch([filtroBusqueda, filtroEstado, campoOrden, sentidoOrden], () => {
  limiteFilas.value = filasPorPagina
})

async function cargar() {
  if (cargando.value) return
  cargando.value = true
  errorConsulta.value = ''
  try {
    const [ordenes, catalogoProveedores, catalogoProductos, catalogoEstados] = await Promise.all([
      obtenerOrdenesCompra(), obtenerProveedores(), obtenerCatalogoProductosProveedor(), obtenerEstadosCompra()
    ])
    ordenesAPI.value = ordenes
    proveedores.value = catalogoProveedores
    productos.value = catalogoProductos
    estados.value = catalogoEstados
    limiteFilas.value = filasPorPagina
    catalogosListos.value = true
  } catch (error) {
    errorConsulta.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error))
  } finally { cargando.value = false }
}

async function abrirNuevaOrden() {
  ordenAEditar.value = null
  if (accionesBloqueadas.value) return
  await cargar()
  if (errorConsulta.value) return
  errorGuardado.value = ''
  mostrarNuevaOrden.value = true
}

async function cargarFacturas() {
  if (cargandoFacturas.value) return
  cargandoFacturas.value = true
  errorFacturas.value = ''
  facturas.value = []
  try { facturas.value = await obtenerFacturasCompra() }
  catch (error) { errorFacturas.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error)) }
  finally { cargandoFacturas.value = false }
}

function abrirConsulta(id: number) {
  if (accionesBloqueadas.value) return
  ordenConsultaId.value = id
  mostrarConsultaOrdenes.value = true
  void cargarFacturas()
}

async function abrirEdicion(id: number) {
  if (accionesBloqueadas.value) return
  await cargar()
  if (errorConsulta.value) { errorEstado.value = errorConsulta.value; return }
  if (cabeceras.value.find(o => o.ordencompra_id === id)?.estado !== 'pendiente') {
    errorEstado.value = 'Solo se pueden editar órdenes en estado Pendiente.'
    return
  }
  ordenAEditar.value = ordenesAPI.value.find(o => o.ordencompra_id === id) ?? null
  errorGuardado.value = ''
  mostrarConsultaOrdenes.value = false
  mostrarNuevaOrden.value = true
}

async function guardarOrden(datos: NuevaOrdenCompra) {
  if (guardando.value) return
  guardando.value = true
  errorGuardado.value = ''
  try {
    const id = ordenAEditar.value?.ordencompra_id
    if (id && cabeceras.value.find(o => o.ordencompra_id === id)?.estado !== 'pendiente') throw new Error('Solo se pueden editar órdenes en estado Pendiente.')
    const orden = id ? await editarOrdenCompra(id, datos) : await crearOrdenCompra(datos)
    if (id) {
      const indice = ordenesAPI.value.findIndex(o => o.ordencompra_id === id)
      if (indice !== -1) ordenesAPI.value[indice] = orden
    } else ordenesAPI.value.unshift(orden)
    mostrarNuevaOrden.value = false
    mensaje.value = `Orden #${orden.ordencompra_id} ${id ? 'actualizada' : 'creada'} correctamente.`
  } catch (error) { errorGuardado.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error)) }
  finally { guardando.value = false }
}

function resolverCambioEstado(confirmado: boolean) {
  const resolver = resolverConfirmacion
  resolverConfirmacion = null
  mensajeConfirmacion.value = ''
  resolver?.(confirmado)
}
onBeforeUnmount(() => resolverCambioEstado(false))

async function cambiarEstado(id: number, nuevo: string) {
  const orden = cabeceras.value.find(o => o.ordencompra_id === id)
  if (!orden || accionesBloqueadas.value || !transicionPermitida(orden.estado, nuevo)) return
  if (nuevo === 'contabilizado' && (cargandoFacturas.value || errorFacturas.value || !facturas.value.some(factura => factura.ordencompra_id === id))) return
  let estado = buscarEstadoCompra(estados.value, nuevo)
  if (!estado) {
    guardandoEstado.value = true
    try {
      estados.value = await obtenerEstadosCompra()
      estado = buscarEstadoCompra(estados.value, nuevo)
    } catch (error) {
      errorEstado.value = mensajeErrorApi(error)
      return
    } finally { guardandoEstado.value = false }
  }
  if (!estado) {
    errorEstado.value = `No se puede cambiar a «${etiquetaEstadoCompra(nuevo)}»: el catálogo de estados recibido no contiene esa opción.`
    return
  }
  errorEstado.value = ''
  mensajeConfirmacion.value = nuevo === 'recibida'
    ? `¿Confirmás la recepción de la orden #${id}? Se sumarán los productos al stock.`
    : nuevo === 'devuelto'
      ? `¿Confirmás devolver la orden #${id}? La entrega se rechazará sin ingresar productos al stock.`
      : `¿Confirmás cambiar la orden #${id} a ${etiquetaEstadoCompra(estado.nombre.toLowerCase())}?`
  if (!await new Promise<boolean>(resolve => { resolverConfirmacion = resolve })) return
  guardandoEstado.value = true
  errorEstado.value = ''
  mensaje.value = ''
  try {
    const actualizada = await actualizarEstadoCompra(id, estado.estadoordencompra_id)
    const indice = ordenesAPI.value.findIndex(o => o.ordencompra_id === id)
    if (indice !== -1) ordenesAPI.value[indice] = actualizada
    mensaje.value = `Orden #${id}: ${estado.nombre}.`
  } catch (error) { errorEstado.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error)) }
  finally { guardandoEstado.value = false }
}
async function enviarAFinanzas(id: number, datos: DatosFacturaCompra) {
  if (accionesBloqueadas.value || cargandoFacturas.value || errorFacturas.value) return
  const orden = cabeceras.value.find(item => item.ordencompra_id === id)
  if (orden?.estado !== 'recibida' || facturas.value.some(factura => factura.ordencompra_id === id)) return
  guardandoEstado.value = true
  errorEstado.value = ''
  mensaje.value = ''
  try {
    const actualizada = await enviarOrdenAFinanzas(id, datos)
    const indice = ordenesAPI.value.findIndex(item => item.ordencompra_id === id)
    if (indice !== -1) ordenesAPI.value[indice] = actualizada
    mensaje.value = `Orden #${id} contabilizada y factura enviada a Finanzas.`
    await cargarFacturas()
  } catch (error) { errorEstado.value = mensajeErrorApi(error) }
  finally { guardandoEstado.value = false }
}
onMounted(cargar)
</script>

<template>
  <div class="container-fluid py-2">
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div><h3 class="fw-bold mb-0">Órdenes de Compra</h3><p class="text-muted small mb-0">Registro y consulta de compras a proveedores</p></div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-coralon" :disabled="accionesBloqueadas || !catalogosListos" @click="abrirNuevaOrden">Nueva orden</button>
      </div>
    </div>
    <div v-if="mensaje" class="alert alert-success" role="status">{{ mensaje }}</div>
    <div v-if="errorConsulta" class="alert alert-danger" role="alert">{{ errorConsulta }} <button class="btn btn-sm btn-outline-danger" :disabled="accionesBloqueadas" @click="cargar">Reintentar</button></div>
    <div v-if="errorEstado" class="alert alert-danger" role="alert">{{ errorEstado }}</div>
    <div class="card border-0 shadow-sm p-3 mb-4"><div class="row g-3">
      <div class="col-md-6"><label for="buscar-orden" class="form-label">Buscar orden</label><input maxlength="150" v-texto-limpio id="buscar-orden" v-model="filtroBusqueda" type="search" class="form-control" placeholder="Número, proveedor o fecha" /></div>
      <div class="col-md-6"><label for="estado-orden" class="form-label">Estado</label><select id="estado-orden" v-model="filtroEstado" class="form-select"><option value="">Todos los estados</option><option v-for="estado in estados" :key="estado.estadoordencompra_id" :value="normalizarEstadoCompra(estado.nombre)">{{ etiquetaEstadoCompra(estado.nombre.toLowerCase()) }}</option></select></div>
    </div></div>
    <section class="d-lg-none" aria-label="Órdenes de compra" :aria-busy="cargando">
      <div class="row g-2 mb-3">
        <div class="col-7">
          <label for="orden-mobile-campo" class="form-label small">Ordenar por</label>
          <select id="orden-mobile-campo" v-model="campoOrden" class="form-select">
            <option value="numero">N° de orden</option><option value="proveedor">Proveedor</option><option value="fecha">Fecha</option>
          </select>
        </div>
        <div class="col-5">
          <label for="orden-mobile-sentido" class="form-label small">Sentido</label>
          <select id="orden-mobile-sentido" v-model="sentidoOrden" class="form-select">
            <option value="asc">Ascendente</option><option value="desc">Descendente</option>
          </select>
        </div>
      </div>
      <ul class="list-unstyled d-grid gap-3 mb-0">
        <li v-for="orden in ordenesVisibles" :key="orden.ordencompra_id">
          <button type="button" class="orden-tarjeta card shadow-sm p-3 w-100 text-start" :disabled="accionesBloqueadas" :aria-label="`Ver orden #${orden.ordencompra_id} de ${nombreProveedor(orden.proveedor_id)}`" @click="abrirConsulta(orden.ordencompra_id)">
            <span class="d-flex flex-wrap justify-content-between align-items-center gap-2 w-100 mb-2">
              <span class="fw-bold">Orden #{{ orden.ordencompra_id }} </span>
              <span class="badge" :class="claseEstadoCompra(orden.estado)">{{ etiquetaEstadoCompra(orden.estado) }}</span>
            </span>
            <span class="fw-semibold text-break">{{ nombreProveedor(orden.proveedor_id) }}</span>
            <span class="small text-muted mt-1">Fecha: {{ fechaVisible(orden.fecha) }}</span>
            <span class="d-block border-top pt-2 mt-3 w-100">
              <span class="small text-muted d-block mb-1">Productos y cantidades</span>
              <span v-for="detalle in detalles.filter(d => d.ordencompra_id === orden.ordencompra_id)" :key="detalle.ordencompradetalle_id" class="d-block small text-break">{{ nombreProducto(detalle.producto_id) }} × {{ detalle.cantidad }}</span>
            </span>
            <span class="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top pt-2 mt-3 w-100">
              <span class="small text-coralon">Ver detalle →</span>
              <span class="fw-bold text-break">Total: {{ moneda(orden.total) }}</span>
            </span>
          </button>
        </li>
      </ul>
      <p v-if="cargando" class="text-center p-4 mb-0" role="status">Cargando órdenes…</p>
      <p v-else-if="!errorConsulta && !ordenesFiltradas.length" class="text-center p-4 text-muted mb-0">{{ filtroBusqueda || filtroEstado ? 'No hay órdenes que coincidan con los filtros.' : 'No hay órdenes registradas.' }}</p>
    </section>
    <div class="card border-0 shadow-sm overflow-hidden d-none d-lg-block" :aria-busy="cargando"><div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-dark-custom"><tr>
          <th scope="col" :aria-sort="ariaOrden('numero')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('numero', 'número de orden')" @click="ordenarPor('numero')">N° Orden <span aria-hidden="true">{{ indicadorOrden('numero') }}</span></button></th>
          <th scope="col" :aria-sort="ariaOrden('proveedor')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('proveedor', 'proveedor')" @click="ordenarPor('proveedor')">Proveedor <span aria-hidden="true">{{ indicadorOrden('proveedor') }}</span></button></th>
          <th>Productos y cantidades</th>
          <th scope="col" :aria-sort="ariaOrden('fecha')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('fecha', 'fecha')" @click="ordenarPor('fecha')">Fecha <span aria-hidden="true">{{ indicadorOrden('fecha') }}</span></button></th>
          <th>Estado</th><th class="text-end">Total</th>
        </tr></thead>
        <tbody>
          <tr v-for="orden in ordenesVisibles" :key="orden.ordencompra_id" class="orden-seleccionable" @click="abrirConsulta(orden.ordencompra_id)">
            <td><button class="btn p-0 text-reset text-decoration-none" :disabled="accionesBloqueadas" @click.stop="abrirConsulta(orden.ordencompra_id)">#{{ orden.ordencompra_id }}</button></td>
            <td>{{ nombreProveedor(orden.proveedor_id) }}</td>
            <td><div v-for="detalle in detalles.filter(d => d.ordencompra_id === orden.ordencompra_id)" :key="detalle.ordencompradetalle_id">{{ nombreProducto(detalle.producto_id) }} × {{ detalle.cantidad }}</div></td>
            <td>{{ fechaVisible(orden.fecha) }}</td><td><span class="badge" :class="claseEstadoCompra(orden.estado)">{{ etiquetaEstadoCompra(orden.estado) }}</span></td><td class="text-end text-nowrap">{{ moneda(orden.total) }}</td>
          </tr>
          <tr v-if="cargando"><td colspan="6" class="text-center p-4">Cargando órdenes…</td></tr>
          <tr v-else-if="!errorConsulta && !ordenesFiltradas.length"><td colspan="6" class="text-center p-4 text-muted">{{ filtroBusqueda || filtroEstado ? 'No hay órdenes que coincidan con los filtros.' : 'No hay órdenes registradas.' }}</td></tr>
        </tbody>
      </table>
    </div></div>
    <div v-if="ordenesFiltradas.length" class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
      <span class="text-muted small" role="status">Mostrando {{ ordenesVisibles.length }} de {{ ordenesFiltradas.length }} órdenes</span>
      <button v-if="hayMasOrdenes" type="button" class="btn btn-outline-coralon" :disabled="accionesBloqueadas" @click="cargarMas">Cargar más</button>
    </div>
    <ModalNuevaOrdenCompra :orden-a-editar="ordenAEditar" :mostrar="mostrarNuevaOrden" :guardando="guardando" :error="errorGuardado" :proveedores="proveedores" :productos="productos" @cerrar="mostrarNuevaOrden = false" @guardar="guardarOrden" />
    <ModalVerOrdenesCompra @editar="abrirEdicion" :mostrar="mostrarConsultaOrdenes" :orden-inicial-id="ordenConsultaId" :ordenes="cabeceras" :detalles="detalles" :proveedores="proveedores" :productos="productos" :estados="estados" :facturas="facturas" :cargando-facturas="cargandoFacturas" :error-facturas="errorFacturas" :actualizando="accionesBloqueadas" :error="errorEstado" :mensaje="mensaje" @cerrar="mostrarConsultaOrdenes = false" @cambiar-estado="cambiarEstado" @enviar-a-finanzas="enviarAFinanzas" @reintentar-facturas="cargarFacturas" />
    <ModalConfirmacion v-if="mensajeConfirmacion" :mensaje="mensajeConfirmacion" @resolver="resolverCambioEstado" />
  </div>
</template>
<style scoped>
.orden-seleccionable { cursor: pointer; }
.orden-tarjeta { border: 1px solid #e4dfdc; color: inherit; font: inherit; }
.orden-tarjeta:hover:not(:disabled) { border-color: #b33e14; background-color: #fff8f4; }
.orden-tarjeta:focus-visible { outline: 2px solid #b33e14; outline-offset: 3px; }
.orden-tarjeta:disabled { opacity: 0.65; }

.text-coralon { color: #b33e14; }
.ordenar-columna {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;
}
.ordenar-columna:hover { color: #ffb38f; }
.ordenar-columna:focus-visible { outline: 2px solid #ffb38f; outline-offset: 3px; }

.table-dark-custom {
  background-color: #231f1d;
  border-bottom: 2px solid #b33e14;
}

.table-dark-custom th {
  background-color: #231f1d;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.btn-coralon {
  background-color: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
  transition: all 0.2s ease-in-out;
}

.btn-coralon:hover {
  background-color: #ff7a45;
  border-color: #ff7a45;
  color: #ffffff;
}

.btn-outline-coralon {
  border: 1px solid #b33e14;
  color: #b33e14;
  background-color: transparent;
  transition: all 0.2s ease-in-out;
}

.btn-outline-coralon:hover:not(:disabled) {
  background-color: #b33e14;
  color: #ffffff;
}

.btn-outline-coralon:disabled {
  border-color: #d1cfcc;
  color: #a8a5a0;
}

.custom-search:focus {
  border-color: #dee2e6;
  box-shadow: none;
}
</style>
