<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { FacturaApi } from '../types/finanzasApi'
import type { OrdenComercial } from '../types/finanzas'
import { obtenerFacturas, crearFactura } from '../services/facturasService'
import { obtenerOrdenesCompra, esOrdenCancelada } from '../services/ordenesParaFacturarService'
import { mensajeDeError } from '../services/finanzasApi'
import { formatoFecha, formatoMoneda } from '../utils/formatoFinanzas'
import ModalDetalleFactura from '../components/ModalDetalleFactura.vue'
import ModalDetalleOrden from '../components/ModalDetalleOrden.vue'

// El backend no calcula impuestos: la alícuota de IVA vive acá.
const TASA_IVA = 0.21

// Datos que vienen del backend
const facturas = ref<FacturaApi[]>([])
const ordenesCompra = ref<OrdenComercial[]>([])

const cargando = ref(false)
const facturando = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')

// Selecciones individuales
const facturaSeleccionada = ref<FacturaApi | null>(null)
const ordenSeleccionada = ref<OrdenComercial | null>(null)

// Control de modales
const mostrarModalFactura = ref(false)
const mostrarModalOrden = ref(false)

// Una orden de compra se puede facturar si no está cancelada y ninguna factura la referencia.
const ordenesCompraFacturadas = computed(
  () => new Set(facturas.value.flatMap(f => (f.orden_compra_id === null ? [] : [f.orden_compra_id])))
)

const ordenesCompraPendientes = computed(() =>
  ordenesCompra.value.filter(
    o => !esOrdenCancelada(o) && !ordenesCompraFacturadas.value.has(o.orden_id)
  )
)

function textoTipo(factura: FacturaApi): string {
  return factura.tipo === 'VENTA' ? 'Venta' : 'Compra'
}

async function cargarDatos() {
  cargando.value = true
  mensajeError.value = ''

  const [resFacturas, resOrdenes] = await Promise.allSettled([
    obtenerFacturas(),
    obtenerOrdenesCompra()
  ])

  const errores: string[] = []

  if (resFacturas.status === 'fulfilled') {
    facturas.value = resFacturas.value
  } else {
    facturas.value = []
    facturaSeleccionada.value = null
    errores.push(mensajeDeError(resFacturas.reason))
  }

  if (resOrdenes.status === 'fulfilled') {
    ordenesCompra.value = resOrdenes.value
  } else {
    ordenesCompra.value = []
    ordenSeleccionada.value = null
    errores.push(mensajeDeError(resOrdenes.reason))
  }

  // Si fallaron las dos por la misma causa (por ejemplo sin token) se muestra una sola vez.
  mensajeError.value = [...new Set(errores)].join(' ')
  cargando.value = false
}

function seleccionarOrden(orden: OrdenComercial) {
  if (ordenSeleccionada.value?.orden_id === orden.orden_id && ordenSeleccionada.value?.tipo_orden === orden.tipo_orden) {
    ordenSeleccionada.value = null
  } else {
    ordenSeleccionada.value = orden
  }
}

function seleccionarFactura(factura: FacturaApi) {
  if (facturaSeleccionada.value?.id === factura.id) {
    facturaSeleccionada.value = null
  } else {
    facturaSeleccionada.value = factura
  }
}

function verDetalleFactura() {
  if (facturaSeleccionada.value) {
    mostrarModalFactura.value = true
  }
}

function verDetalleOrden() {
  if (ordenSeleccionada.value) {
    mostrarModalOrden.value = true
  }
}

function mostrarMensajeExito(texto: string) {
  mensajeExito.value = texto
  setTimeout(() => {
    mensajeExito.value = ''
  }, 4000)
}

// Acción de Facturación: POST real al backend
async function registrarFacturaDesdeOrden() {
  const orden = ordenSeleccionada.value
  if (!orden || facturando.value) return

  if (orden.detalles.length === 0) {
    mensajeError.value = 'La orden seleccionada no tiene ítems para facturar.'
    return
  }

  // El backend suma los renglones (subtotal) y le agrega los impuestos que enviamos.
  const subtotalNeto = orden.detalles.reduce((acc, d) => acc + d.cantidad * d.preciounitario, 0)
  const impuestos = Math.round(subtotalNeto * TASA_IVA * 100) / 100

  facturando.value = true
  mensajeError.value = ''
  try {
    const factura = await crearFactura({
      tipo: 'COMPRA',
      // Derivado de la orden: facturar dos veces la misma orden da error por número repetido.
      numero: `FC-${String(orden.orden_id).padStart(7, '0')}`,
      fecha: new Date().toISOString(),
      orden_compra_id: orden.orden_id,
      impuestos: impuestos.toFixed(2),
      detalles: orden.detalles.map(d => ({
        producto_id: d.producto_id,
        cantidad: d.cantidad,
        precio_unitario: d.preciounitario.toFixed(2)
      }))
    })

    ordenSeleccionada.value = null
    await cargarDatos()
    mostrarMensajeExito(`Factura ${factura.numero} registrada por ${formatoMoneda(factura.total)}.`)
  } catch (error) {
    mensajeError.value = mensajeDeError(error)
  } finally {
    facturando.value = false
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<template>
  <div class="container-fluid py-2">
    <!-- Título de la Vista -->
    <div class="mb-4">
      <h3 class="fw-bold mb-0 text-dark">Facturación y Registro de Órdenes</h3>
      <p class="text-muted small mb-0">Transformación de órdenes comerciales en comprobantes contables</p>
    </div>

    <!-- Alertas -->
    <div v-if="mensajeExito" class="alert alert-success py-2 small mb-3" role="status">
      {{ mensajeExito }}
    </div>
    <div v-if="mensajeError" class="alert alert-danger py-2 small mb-3" role="alert">
      {{ mensajeError }}
    </div>

    <div class="row g-4">

      <!-- Columna Izquierda: Facturas Registradas -->
      <div class="col-lg-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-dark-custom text-white d-flex justify-content-between align-items-center py-3">
            <h5 class="fw-bold mb-0 fs-6">Facturas Registradas</h5>
            <div class="d-flex align-items-center gap-2">
              <span v-if="cargando" class="spinner-border spinner-border-sm text-light" role="status" aria-label="Cargando"></span>
              <button
                class="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                :disabled="!facturaSeleccionada"
                @click="verDetalleFactura"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                </svg>
                <span>Ver Detalle</span>
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th scope="col" class="ps-3 py-2">N° Factura</th>
                  <th scope="col" class="py-2">Tipo</th>
                  <th scope="col" class="py-2">Fecha</th>
                  <th scope="col" class="pe-3 py-2 text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="fac in facturas"
                  :key="fac.id"
                  :class="{ 'fila-seleccionada': facturaSeleccionada?.id === fac.id }"
                  style="cursor: pointer;"
                  @click="seleccionarFactura(fac)"
                >
                  <td class="ps-3 fw-bold">{{ fac.numero }}</td>
                  <td><span class="badge bg-secondary font-monospace">{{ textoTipo(fac) }}</span></td>
                  <td class="text-muted small">{{ formatoFecha(fac.fecha) }}</td>
                  <td class="pe-3 text-end fw-bold text-dark">{{ formatoMoneda(fac.total) }}</td>
                </tr>
                <tr v-if="!cargando && facturas.length === 0">
                  <td colspan="4" class="text-center py-4 text-muted">No hay facturas registradas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Órdenes de Compra y Venta -->
      <div class="col-lg-6 d-flex flex-column gap-3">

        <!-- Acciones sobre la Orden Seleccionada -->
        <div class="card shadow-sm border-0">
          <div class="card-body p-3 d-flex justify-content-between align-items-center bg-light rounded">
            <div>
              <span class="text-muted small d-block">Orden seleccionada:</span>
              <strong class="text-dark">
                {{ ordenSeleccionada ? `${ordenSeleccionada.tipo_orden} #${ordenSeleccionada.orden_id} (${ordenSeleccionada.entidad_nombre})` : 'Ninguna' }}
              </strong>
            </div>
            <div class="d-flex gap-2">
              <button
                class="btn btn-sm btn-outline-coralon d-flex align-items-center gap-1 fw-semibold"
                :disabled="!ordenSeleccionada"
                @click="verDetalleOrden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                </svg>
                <span>Ver</span>
              </button>

              <button
                class="btn btn-sm btn-coralon d-flex align-items-center gap-1 fw-semibold"
                :disabled="!ordenSeleccionada || facturando"
                @click="registrarFacturaDesdeOrden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                </svg>
                <span>{{ facturando ? 'Facturando…' : 'Facturar Orden' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla Órdenes de Compra -->
        <div class="card shadow-sm border-0">
          <div class="card-header bg-dark-custom text-white py-2">
            <h6 class="fw-bold mb-0 small text-uppercase letter-spacing">Órdenes de Compra (Proveedores)</h6>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th scope="col" class="ps-3 py-2">ID</th>
                  <th scope="col" class="py-2">Proveedor</th>
                  <th scope="col" class="py-2">Fecha</th>
                  <th scope="col" class="pe-3 py-2 text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="oc in ordenesCompraPendientes"
                  :key="'oc-' + oc.orden_id"
                  :class="{ 'fila-seleccionada': ordenSeleccionada?.orden_id === oc.orden_id && ordenSeleccionada?.tipo_orden === 'Compra' }"
                  style="cursor: pointer;"
                  @click="seleccionarOrden(oc)"
                >
                  <td class="ps-3 fw-bold text-muted">#{{ oc.orden_id }}</td>
                  <td class="fw-semibold">{{ oc.entidad_nombre }}</td>
                  <td class="text-muted small">{{ formatoFecha(oc.fecha) }}</td>
                  <td class="pe-3 text-end fw-bold text-dark">{{ formatoMoneda(oc.total) }}</td>
                </tr>
                <tr v-if="!cargando && ordenesCompraPendientes.length === 0">
                  <td colspan="4" class="text-center py-3 text-muted small">No hay órdenes de compra pendientes de facturar.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Órdenes de Venta: el backend todavía no las tiene -->
        <div class="card shadow-sm border-0">
          <div class="card-header bg-dark-custom text-white py-2">
            <h6 class="fw-bold mb-0 small text-uppercase letter-spacing">Órdenes de Venta (Clientes)</h6>
          </div>
          <div class="card-body text-center py-3 text-muted small">
            Módulo de ventas aún no disponible: todavía no hay órdenes de venta para facturar.
          </div>
        </div>

      </div>
    </div>

    <!-- Modales -->
    <ModalDetalleFactura
      :mostrar="mostrarModalFactura"
      :factura="facturaSeleccionada"
      @cerrar="mostrarModalFactura = false"
    />

    <ModalDetalleOrden
      :mostrar="mostrarModalOrden"
      :orden="ordenSeleccionada"
      @cerrar="mostrarModalOrden = false"
    />
  </div>
</template>

<style scoped>
.bg-dark-custom {
  background-color: #231f1d;
}

.letter-spacing {
  letter-spacing: 0.5px;
}

.btn-coralon {
  background-color: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
  transition: all 0.2s ease-in-out;
}

.btn-coralon:hover:not(:disabled) {
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

.fila-seleccionada {
  background-color: #fff1eb !important;
  border-left: 4px solid #b33e14;
}

.fila-seleccionada td {
  background-color: #fff1eb !important;
}
</style>
