<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { DESTINOS_DEVOLUCION, ESTADOS_VENTA, type VentaHistorial } from '../types/devolucion'
import {
  obtenerOrdenesVenta,
  obtenerMotivoOrden,
  anularOrdenVenta,
  crearNotaCredito,
  textoError,
} from '../services/ventasService'
import ModalAnulacion from '../components/ModalAnulacion.vue'
import { avisoError, avisoExito, avisoInfo } from '../utils/avisos'

const ventas = ref<VentaHistorial[]>([])
const cargando = ref(false)
const error = ref('')

const busqueda = ref('')

// El texto se busca en el servidor (?search=), no en la memoria del navegador.
// Se evita que una respuesta vieja pise a una más nueva.
let numeroPedido = 0
async function cargarVentas() {
  const pedido = ++numeroPedido
  cargando.value = true
  error.value = ''
  try {
    const lista = await obtenerOrdenesVenta(busqueda.value)
    if (pedido === numeroPedido) ventas.value = lista
  } catch (err) {
    console.error(err)
    if (pedido === numeroPedido) error.value = textoError(err)
  } finally {
    if (pedido === numeroPedido) cargando.value = false
  }
}

onMounted(cargarVentas)

let temporizador: ReturnType<typeof setTimeout> | undefined
watch(busqueda, () => {
  clearTimeout(temporizador)
  temporizador = setTimeout(cargarVentas, 350)
})
onBeforeUnmount(() => clearTimeout(temporizador))

// Color de cada estado
function claseEstado(estado: VentaHistorial['estado']): string {
  if (estado === 'Confirmada') return 'bg-success'
  if (estado === 'Devuelta') return 'bg-warning text-dark'
  if (estado === 'Anulada') return 'bg-danger'
  return 'bg-secondary' // En proceso
}

// Qué se puede hacer con cada orden según su estado
function puedeAnular(venta: VentaHistorial): boolean {
  return venta.estado === 'En proceso' || venta.estado === 'Confirmada'
}

// Una devolución genera una nota de crédito, que solo existe si la orden fue facturada
function puedeDevolver(venta: VentaHistorial): boolean {
  return venta.estado === 'Confirmada'
}

function motivoAnular(venta: VentaHistorial): string {
  return puedeAnular(venta) ? '' : `No se puede anular una orden ${venta.estado.toLowerCase()}.`
}

function motivoDevolver(venta: VentaHistorial): string {
  if (puedeDevolver(venta)) return ''
  if (venta.estado === 'En proceso') return 'Solo se puede devolver una orden facturada por Finanzas.'
  return `No se puede devolver una orden ${venta.estado.toLowerCase()}.`
}
// Filtro por estado: el estado de cada orden se calcula en esta pantalla, por eso se filtra acá
const filtroEstado = ref<'' | VentaHistorial['estado']>('')

const ventasFiltradas = computed(() =>
  filtroEstado.value ? ventas.value.filter((v) => v.estado === filtroEstado.value) : ventas.value
)

// Ojito: motivo de la anulación o detalle de la devolución
function tieneMotivo(venta: VentaHistorial): boolean {
  return venta.estado === 'Anulada' || venta.estado === 'Devuelta'
}

function textoOjito(venta: VentaHistorial): string {
  return tieneMotivo(venta) ? 'Ver el motivo' : 'Esta orden no tiene anulación ni devolución.'
}

async function verMotivo(venta: VentaHistorial) {
  try {
    const { titulo, mensaje } = await obtenerMotivoOrden(venta)
    avisoInfo(mensaje, titulo)
  } catch (err) {
    console.error(err)
    avisoError(textoError(err), 'No se pudo obtener el motivo')
  }
}

// --- Modal de anulación ---
const mostrarModalAnular = ref(false)
const ventaAAnular = ref<VentaHistorial | null>(null)

function abrirAnular(venta: VentaHistorial) {
  ventaAAnular.value = venta
  mostrarModalAnular.value = true
}

function cerrarModalAnular() {
  mostrarModalAnular.value = false
  ventaAAnular.value = null
}

async function confirmarAnulacion(datos: { ventaId: number; motivo: string; detalle: string }) {
  try {
    await anularOrdenVenta(datos.ventaId, datos.motivo, datos.detalle)
    cerrarModalAnular()
    await cargarVentas() // el estado y el stock los define el backend
  } catch (err) {
    console.error(err)
    avisoError(textoError(err), 'No se pudo anular la orden')
  }
}

// --- Nota de crédito (devolución) ---
const ventaParaDevolver = ref<VentaHistorial | null>(null);
const itemsSeleccionados = ref<Record<number, { seleccionado: boolean; cantidad: number; destino: string }>>({})

function cerrarDevolucion() {
  if (guardandoNota.value) return
  ventaParaDevolver.value = null
}

function iniciarDevolucion(venta: VentaHistorial) {
  ventaParaDevolver.value = venta
  itemsSeleccionados.value = {}
  venta.items.forEach((item) => {
    itemsSeleccionados.value[item.productoId] = {
      seleccionado: false,
      cantidad: 0,
      destino: DESTINOS_DEVOLUCION[0],
    }
  })
}

const itemsSeleccionadosCount = computed(
  () => Object.values(itemsSeleccionados.value).filter((i) => i.seleccionado).length
)

// Monto a reembolsar: proporcional al precio promedio del total original
// (simplificado, sin precios unitarios reales en el historial)
const montoAReembolsar = computed(() => {
  if (!ventaParaDevolver.value) return 0
  const totalCantidadVendida = ventaParaDevolver.value.items.reduce((acc, i) => acc + i.cantidadVendida, 0)
  if (totalCantidadVendida === 0) return 0
  const precioPromedio = ventaParaDevolver.value.total / totalCantidadVendida

  return Object.values(itemsSeleccionados.value).reduce((acc, item) => {
    if (!item.seleccionado) return acc
    return acc + item.cantidad * precioPromedio
  }, 0)
})

const guardandoNota = ref(false)

async function generarNotaCredito() {
  if (!ventaParaDevolver.value) return
  if (itemsSeleccionadosCount.value === 0) {
    avisoError('Seleccioná al menos un ítem para devolver.', 'Faltan datos')
    return
  }

  const items = ventaParaDevolver.value.items
    .filter((i) => itemsSeleccionados.value[i.productoId]?.seleccionado)
    .map((i) => ({
      productoId: i.productoId,
      cantidadVendida: i.cantidadVendida,
      nombre: i.nombre,
      cantidad: itemsSeleccionados.value[i.productoId]!.cantidad,
      destino: itemsSeleccionados.value[i.productoId]!.destino,
    }))

  const invalido = items.find((i) => !Number.isInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > i.cantidadVendida)
  if (invalido) {
    avisoError(
      `La cantidad a devolver de "${invalido.nombre}" debe estar entre 1 y ${invalido.cantidadVendida}.`,
      'Cantidad inválida',
    )
    return
  }

  guardandoNota.value = true
  try {
    await crearNotaCredito({
      ordenId: ventaParaDevolver.value.id,
      monto: montoAReembolsar.value,
      saldoAFavor: false,
      items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, destino: i.destino })),
    })
    avisoExito(`Monto: $${montoAReembolsar.value.toLocaleString('es-AR')}`, 'Nota de crédito generada')
    ventaParaDevolver.value = null
    await cargarVentas()
  } catch (err) {
    console.error(err)
    avisoError(textoError(err), 'No se pudo generar la nota de crédito')
  } finally {
    guardandoNota.value = false
  }
}
</script>

<template>
  <div class="container-fluid py-2">
    <div class="mb-4">
      <h3 class="fw-bold mb-0 text-dark">Estado orden venta</h3>
      <p class="text-muted small mb-0">Historial de ventas, anulaciones y notas de crédito</p>
    </div>

    <!-- Qué significa cada estado -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body p-3">
        <h6 class="fw-bold mb-3">Estados de la orden de venta</h6>
        <div class="row g-2">
          <div v-for="e in ESTADOS_VENTA" :key="e.estado" class="col-md-6 d-flex align-items-start gap-2">
            <span class="badge" :class="claseEstado(e.estado)" style="min-width: 92px;">{{ e.estado }}</span>
            <span class="small text-muted">{{ e.descripcion }}</span>
          </div>
        </div>
        <p class="small text-muted mb-0 mt-3">
          Ventas genera la orden y Finanzas la factura desde su sector. Cuando está facturada pasa a Confirmada y recién ahí se puede devolver.
        </p>
      </div>
    </div>

    <!-- Historial de ventas -->
    <div class="card shadow-sm border-0 mb-4 overflow-hidden">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <span class="fw-bold">Historial de ventas</span>
        <div class="d-flex gap-2">
          <select v-model="filtroEstado" class="form-select form-select-sm w-auto" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option v-for="e in ESTADOS_VENTA" :key="e.estado" :value="e.estado">{{ e.estado }}</option>
          </select>
          <input
            v-model="busqueda"
            type="text"
            class="form-control form-control-sm w-auto"
            placeholder="Buscar por N° o cliente"
          />
        </div>
      </div>
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-dark-custom">
            <tr>
              <th class="ps-3">Comprobante</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th class="pe-3 text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venta in ventasFiltradas" :key="venta.id">
              <td class="ps-3 fw-bold">{{ venta.comprobante }}</td>
              <td>{{ venta.fecha }}</td>
              <td>{{ venta.cliente }}</td>
              <td>${{ venta.total.toLocaleString('es-AR') }}</td>
              <td>
                <span class="badge" :class="claseEstado(venta.estado)">{{ venta.estado }}</span>
              </td>
              <td class="pe-3 text-end">
                <button
                  class="btn btn-sm btn-outline-danger me-2"
                  type="button"
                  :disabled="!puedeAnular(venta)"
                  :title="motivoAnular(venta)"
                  @click="abrirAnular(venta)"
                >
                  Anular
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary me-2"
                  type="button"
                  :disabled="!puedeDevolver(venta)"
                  :title="motivoDevolver(venta)"
                  @click="iniciarDevolucion(venta)"
                >
                  Devolver
                </button>
                <button
                  class="btn btn-sm btn-outline-dark"
                  type="button"
                  :disabled="!tieneMotivo(venta)"
                  :title="textoOjito(venta)"
                  :aria-label="textoOjito(venta)"
                  @click="verMotivo(venta)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                  </svg>
                </button>
              </td>
            </tr>
            <tr v-if="cargando">
              <td colspan="6" class="text-center text-muted py-4">Cargando historial de ventas...</td>
            </tr>
            <tr v-else-if="error">
              <td colspan="6" class="text-center text-danger py-4">{{ error }}</td>
            </tr>
            <tr v-else-if="ventasFiltradas.length === 0">
              <td colspan="6" class="text-center text-muted py-4">No se encontraron órdenes con esos filtros.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Devolución (nota de crédito) en pop up -->
    <div v-if="ventaParaDevolver">
      <div class="modal-backdrop fade show"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" style="overflow-y: auto;">
        <div class="modal-dialog modal-dialog-centered modal-xl">
          <div class="modal-content shadow border-0 overflow-hidden">
            <div class="modal-header modal-header-custom text-white px-4 py-3">
              <h5 class="modal-title fw-bold">Devolución — {{ ventaParaDevolver.comprobante }}</h5>
              <button
                type="button"
                class="btn-close btn-close-white"
                aria-label="Cerrar"
                :disabled="guardandoNota"
                @click="cerrarDevolucion"
              ></button>
            </div>
            <div class="modal-body p-4 bg-light">
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card shadow-sm border-0 mb-3">
          <div class="card-body p-3">
            <h6 class="fw-bold mb-3">Referencia — Nota de crédito</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-semibold">N° de factura original</label>
                <input type="text" class="form-control" :value="ventaParaDevolver.comprobante" disabled />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-semibold">Cliente</label>
                <input type="text" class="form-control" :value="ventaParaDevolver.cliente" disabled />
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm border-0 overflow-hidden">
          <div class="card-header bg-white fw-bold">Ítems a devolver</div>
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-dark-custom">
                <tr>
                  <th class="ps-3"></th>
                  <th>Producto</th>
                  <th>Cant. Vendida</th>
                  <th>Cant. a Devolver</th>
                  <th class="pe-3">Destino</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in ventaParaDevolver.items" :key="item.productoId">
                  <td class="ps-3">
                    <input type="checkbox" v-model="itemsSeleccionados[item.productoId].seleccionado" />
                  </td>
                  <td>{{ item.nombre }}</td>
                  <td>{{ item.cantidadVendida }}</td>
                  <td style="width: 110px;">
                    <input
                      v-model.number="itemsSeleccionados[item.productoId].cantidad"
                      type="number"
                      min="0"
                      :max="item.cantidadVendida"
                      class="form-control form-control-sm"
                      :disabled="!itemsSeleccionados[item.productoId].seleccionado"
                    />
                  </td>
                  <td class="pe-3">
                    <select
                      v-model="itemsSeleccionados[item.productoId].destino"
                      class="form-select form-select-sm"
                      :disabled="!itemsSeleccionados[item.productoId].seleccionado"
                    >
                      <option v-for="d in DESTINOS_DEVOLUCION" :key="d" :value="d">{{ d }}</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card shadow-sm border-0">
          <div class="card-body p-3">
            <h6 class="fw-bold mb-3">Resumen de devolución</h6>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Ítems seleccionados</span>
              <span>{{ itemsSeleccionadosCount }}</span>
            </div>
            <div class="d-flex justify-content-between mb-3 fw-bold">
              <span>Monto a reembolsar</span>
              <span>${{ montoAReembolsar.toLocaleString('es-AR', { maximumFractionDigits: 0 }) }}</span>
            </div>

            <button class="btn btn-coralon w-100 fw-semibold" type="button" :disabled="guardandoNota" @click="generarNotaCredito">
              📄 Generar nota de crédito
            </button>
          </div>
        </div>
      </div>
    </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ModalAnulacion
      :mostrar="mostrarModalAnular"
      :venta="ventaAAnular"
      @cerrar="cerrarModalAnular"
      @confirmar="confirmarAnulacion"
    />
  </div>
</template>

<style scoped>
.modal-backdrop {
  opacity: 0.6;
}
.modal-header-custom {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14;
}
.btn-coralon {
  background-color: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
}
.btn-coralon:hover {
  background-color: #ff7a45;
  border-color: #ff7a45;
  color: #ffffff;
}
.table-dark-custom {
  background-color: #231f1d;
  color: #f5f5f5;
}
.table-dark-custom th {
  background-color: #231f1d;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.85rem;
}
</style>