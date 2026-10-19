<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DESTINOS_DEVOLUCION, ESTADOS_VENTA, type VentaHistorial } from '../types/devolucion'
import { obtenerOrdenesVenta, anularOrdenVenta, crearNotaCredito, textoError } from '../services/ventasService'
import ModalAnulacion from '../components/ModalAnulacion.vue'
import { avisoError, avisoExito } from '../utils/avisos'

const ventas = ref<VentaHistorial[]>([])
const cargando = ref(false)
const error = ref('')

async function cargarVentas() {
  cargando.value = true
  error.value = ''
  try {
    ventas.value = await obtenerOrdenesVenta()
  } catch (err) {
    console.error(err)
    error.value = textoError(err)
  } finally {
    cargando.value = false
  }
}

onMounted(cargarVentas)

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
const busqueda = ref('')

const ventasFiltradas = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return ventas.value
  return ventas.value.filter(
    (v) => v.comprobante.toLowerCase().includes(termino) || v.cliente.toLowerCase().includes(termino)
  )
})

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
      <h3 class="fw-bold mb-0 text-dark">Devoluciones</h3>
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
        <input
          v-model="busqueda"
          type="text"
          class="form-control form-control-sm w-auto"
          placeholder="Buscar por N° o cliente"
        />
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
                  class="btn btn-sm btn-outline-secondary"
                  type="button"
                  :disabled="!puedeDevolver(venta)"
                  :title="motivoDevolver(venta)"
                  @click="iniciarDevolucion(venta)"
                >
                  Devolver
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
              <td colspan="6" class="text-center text-muted py-4">No se encontraron ventas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nota de crédito -->
    <div v-if="ventaParaDevolver" class="row g-4">
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

    <ModalAnulacion
      :mostrar="mostrarModalAnular"
      :venta="ventaAAnular"
      @cerrar="cerrarModalAnular"
      @confirmar="confirmarAnulacion"
    />
  </div>
</template>

<style scoped>
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
  color: #ffffff;
  font-weight: 600;
  font-size: 0.85rem;
}
</style>