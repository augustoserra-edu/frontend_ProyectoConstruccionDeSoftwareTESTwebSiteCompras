<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import ModalNuevaOrdenCompra from '../components/ModalNuevaOrdenCompra.vue'
import ModalVerOrdenesCompra from '../components/ModalVerOrdenesCompra.vue'
import { normalizarBusqueda } from '../utils/busqueda'
import { mensajeErrorApi } from '../utils/erroresApi'
import { obtenerProveedores } from '../services/proveedoresService'
import { obtenerProductosProveedor, type ProductoProveedor } from '../services/productosService'
import { actualizarEstadoCompra, crearOrdenCompra, obtenerEstadosCompra, obtenerFacturasCompra, obtenerOrdenesCompra, presentarDetalles, presentarOrden, transicionPermitida, type OrdenCompraAPI } from '../services/comprasService'
import type { Proveedor } from '../types/proveedor'
import { estadoCompraReconocido } from '../services/comprasService'
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
const mostrarConsultaOrdenes = ref(false)
const ordenConsultaId = ref<number | null>(null)
const cambiosHabilitados = ref(false)
const filtroBusqueda = ref('')
const filtroEstado = ref('')
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
))

async function cargar() {
  if (cargando.value) return
  cargando.value = true
  errorConsulta.value = ''
  try {
    const [ordenes, catalogoProveedores, catalogoProductos, catalogoEstados] = await Promise.all([
      obtenerOrdenesCompra(), obtenerProveedores(), obtenerProductosProveedor(), obtenerEstadosCompra()
    ])
    ordenesAPI.value = ordenes
    proveedores.value = catalogoProveedores
    productos.value = catalogoProductos
    estados.value = catalogoEstados
    catalogosListos.value = true
  } catch (error) {
    errorConsulta.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error))
  } finally { cargando.value = false }
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

function abrirConsulta(id: number | null = null) {
  if (accionesBloqueadas.value) return
  ordenConsultaId.value = id
  mostrarConsultaOrdenes.value = true
  void cargarFacturas()
}

async function guardarOrden(datos: NuevaOrdenCompra) {
  if (guardando.value) return
  guardando.value = true
  errorGuardado.value = ''
  try {
    const orden = await crearOrdenCompra(datos)
    ordenesAPI.value.unshift(orden)
    mostrarNuevaOrden.value = false
    mensaje.value = `Orden #${orden.ordencompra_id} creada correctamente.`
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
  if (!orden || !cambiosHabilitados.value || accionesBloqueadas.value || !transicionPermitida(orden.estado, nuevo)) return
  const estado = estados.value.find(e => e.nombre.toLowerCase() === nuevo)
  if (!estado) { errorEstado.value = 'El estado solicitado no está disponible.'; return }
  mensajeConfirmacion.value = nuevo === 'recibida'
    ? `¿Confirmás la recepción de la orden #${id}? La recepción se simulará sin modificar el stock real.`
    : `¿Confirmás cambiar la orden #${id} a ${estado.nombre}?`
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
onMounted(cargar)
</script>

<template>
  <div class="container-fluid py-2">
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div><h3 class="fw-bold mb-0">Órdenes de Compra</h3><p class="text-muted small mb-0">Registro y consulta de compras a proveedores</p></div>
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-outline-coralon" :disabled="accionesBloqueadas" :aria-pressed="cambiosHabilitados" @click="cambiosHabilitados = !cambiosHabilitados">{{ cambiosHabilitados ? 'Bloquear cambios de estado' : 'Habilitar cambios de estado' }}</button>
        <button class="btn btn-outline-coralon" :disabled="accionesBloqueadas" @click="cargar">Actualizar</button>
        <button class="btn btn-outline-coralon" :disabled="accionesBloqueadas || !catalogosListos" @click="abrirConsulta()">Ver órdenes</button>
        <button class="btn btn-coralon" :disabled="accionesBloqueadas || !catalogosListos" @click="errorGuardado = ''; mostrarNuevaOrden = true">Nueva orden</button>
      </div>
    </div>
    <div v-if="mensaje" class="alert alert-success" role="status">{{ mensaje }}</div>
    <div v-if="errorConsulta" class="alert alert-danger" role="alert">{{ errorConsulta }} <button class="btn btn-sm btn-outline-danger" :disabled="accionesBloqueadas" @click="cargar">Reintentar</button></div>
    <div v-if="errorEstado" class="alert alert-danger" role="alert">{{ errorEstado }}</div>
    <div class="card border-0 shadow-sm p-3 mb-4"><div class="row g-3">
      <div class="col-md-6"><label for="buscar-orden" class="form-label">Buscar orden</label><input id="buscar-orden" v-model="filtroBusqueda" type="search" class="form-control" placeholder="Número, proveedor o fecha" /></div>
      <div class="col-md-6"><label for="estado-orden" class="form-label">Estado</label><select id="estado-orden" v-model="filtroEstado" class="form-select"><option value="">Todos los estados</option><option v-for="estado in estados" :key="estado.estadoordencompra_id" :value="estado.nombre.toLowerCase()">{{ estado.nombre }}</option></select></div>
    </div></div>
    <div class="card border-0 shadow-sm overflow-hidden" :aria-busy="cargando"><div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-dark-custom"><tr><th>N° Orden</th><th>Proveedor</th><th>Productos y cantidades</th><th>Fecha</th><th>Estado</th><th class="text-end">Total</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr v-for="orden in ordenesFiltradas" :key="orden.ordencompra_id">
            <td><button class="btn btn-link" :disabled="accionesBloqueadas" @click="abrirConsulta(orden.ordencompra_id)">#{{ orden.ordencompra_id }}</button></td>
            <td>{{ nombreProveedor(orden.proveedor_id) }}</td>
            <td><div v-for="detalle in detalles.filter(d => d.ordencompra_id === orden.ordencompra_id)" :key="detalle.ordencompradetalle_id">{{ nombreProducto(detalle.producto_id) }} × {{ detalle.cantidad }}</div></td>
            <td>{{ fechaVisible(orden.fecha) }}</td><td>{{ orden.estado }}</td><td class="text-end text-nowrap">{{ moneda(orden.total) }}</td>
            <td><div class="d-flex gap-2">
              <span v-if="!estadoCompraReconocido(orden.estado)" class="text-warning-emphasis small">El estado «{{ orden.estado }}» no tiene transiciones configuradas. Es necesario corregirlo en el backend.</span>
              <button v-if="orden.estado === 'pendiente'" class="btn btn-sm btn-outline-success" :disabled="accionesBloqueadas || !cambiosHabilitados" @click="cambiarEstado(orden.ordencompra_id, 'aprobada')">Aprobar</button>
              <button v-if="orden.estado === 'aprobada'" class="btn btn-sm btn-outline-primary" :disabled="accionesBloqueadas || !cambiosHabilitados" @click="cambiarEstado(orden.ordencompra_id, 'recibida')">Recibir</button>
              <button v-if="['pendiente', 'aprobada'].includes(orden.estado)" class="btn btn-sm btn-outline-danger" :disabled="accionesBloqueadas || !cambiosHabilitados" @click="cambiarEstado(orden.ordencompra_id, 'rechazada')">Rechazar</button>
            </div></td>
          </tr>
          <tr v-if="cargando"><td colspan="7" class="text-center p-4">Cargando órdenes…</td></tr>
          <tr v-else-if="!errorConsulta && !ordenesFiltradas.length"><td colspan="7" class="text-center p-4 text-muted">{{ filtroBusqueda || filtroEstado ? 'No hay órdenes que coincidan con los filtros.' : 'No hay órdenes registradas.' }}</td></tr>
        </tbody>
      </table>
    </div></div>
    <ModalNuevaOrdenCompra :mostrar="mostrarNuevaOrden" :guardando="guardando" :error="errorGuardado" :proveedores="proveedores" :productos="productos" @cerrar="mostrarNuevaOrden = false" @guardar="guardarOrden" />
    <ModalVerOrdenesCompra :mostrar="mostrarConsultaOrdenes" :orden-inicial-id="ordenConsultaId" :ordenes="cabeceras" :detalles="detalles" :proveedores="proveedores" :productos="productos" :estados="estados" :facturas="facturas" :cargando-facturas="cargandoFacturas" :error-facturas="errorFacturas" :cambios-habilitados="cambiosHabilitados" :actualizando="accionesBloqueadas" :error="errorEstado" :mensaje="mensaje" @cerrar="mostrarConsultaOrdenes = false" @alternar-cambios="cambiosHabilitados = !cambiosHabilitados" @cambiar-estado="cambiarEstado" @reintentar-facturas="cargarFacturas" />
    <ModalConfirmacion v-if="mensajeConfirmacion" :mensaje="mensajeConfirmacion" @resolver="resolverCambioEstado" />
  </div>
</template>
<style scoped>
.orden-seleccionable { cursor: pointer; }
.text-coralon { color: #b33e14; }

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
