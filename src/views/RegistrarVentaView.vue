<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Cliente } from '../types/cliente'
import { METODOS_PAGO, IVA_PORCENTAJE, type ItemVenta, type ProductoVenta } from '../types/venta'
import {
  obtenerClientes,
  obtenerProductosVenta,
  buscarClientePorCuil,
  crearOrdenVenta,
  textoError,
} from '../services/ventasService'
import { avisoError, avisoExito } from '../utils/avisos'

// --- Datos que vienen del backend ---
const clientesRegistrados = ref<Cliente[]>([])
const productosDisponibles = ref<ProductoVenta[]>([])
const errorCarga = ref('')

async function cargarDatos() {
  try {
    ;[clientesRegistrados.value, productosDisponibles.value] = await Promise.all([
      obtenerClientes(),
      obtenerProductosVenta(),
    ])
  } catch (err) {
    console.error(err)
    errorCarga.value = textoError(err)
  }
}

onMounted(cargarDatos)

// --- Búsqueda de cliente por CUIL ---
const cuilBuscado = ref('')
const clienteEncontrado = ref<Cliente | null>(null)
const busquedaSinResultado = ref(false)

// El CUIL son 11 números seguidos: se borra todo lo que no sea dígito
function limpiarCuilBuscado() {
  cuilBuscado.value = cuilBuscado.value.replace(/\D/g, '').slice(0, 11)
  busquedaSinResultado.value = false
}

// La lupa se habilita recién cuando el CUIL está completo
const cuilCompleto = computed(() => cuilBuscado.value.length === 11)

// Búsqueda por CUIL mediante GET al backend
async function buscarCliente() {
  if (!cuilCompleto.value) return
  try {
    const encontrado = await buscarClientePorCuil(cuilBuscado.value)
    clienteEncontrado.value = encontrado
    busquedaSinResultado.value = !encontrado
  } catch (err) {
    console.error(err)
    clienteEncontrado.value = null
    avisoError(textoError(err), 'No se pudo buscar el cliente')
  }
}

// El tipo de comprobante lo define el sistema según la condición IVA del cliente
function comprobanteSegunIva(condicionIva: string): string {
  if (condicionIva === 'Responsable Inscripto') return 'Factura A'
  if (condicionIva === 'Monotributista') return 'Factura C'
  return 'Factura B' // Consumidor Final o Exento
}

const tipoComprobante = computed(() =>
  clienteEncontrado.value ? comprobanteSegunIva(clienteEncontrado.value.condicion_iva) : ''
)

// --- Fecha: siempre la del día en que se genera la orden (no se elige) ---
function fechaDeHoy(): string {
  return new Date().toLocaleDateString('en-CA') // AAAA-MM-DD, hora local
}
const fecha = ref(fechaDeHoy())

// --- Ítems de la orden ---
const items = ref<ItemVenta[]>([])
const busquedaProducto = ref('')
const mostrarSugerencias = ref(false)

// Lista de coincidencias en vivo, a medida que se escribe
const sugerencias = computed<ProductoVenta[]>(() => {
  const termino = busquedaProducto.value.trim().toLowerCase()
  if (!termino) return []
  return productosDisponibles.value.filter((p) => p.nombre.toLowerCase().includes(termino)).slice(0, 6)
})

function agregarProducto(producto: ProductoVenta) {
  const existente = items.value.find((i) => i.productoId === producto.producto_id)
  if (existente) {
    existente.cantidad += 1
  } else {
    items.value.push({
      id: Date.now(),
      productoId: producto.producto_id,
      nombre: producto.nombre,
      cantidad: 1,
      precioUnitario: producto.preciounitario,
    })
  }
  busquedaProducto.value = ''
  mostrarSugerencias.value = false
  
}
function ocultarSugerenciasConDelay() {
  setTimeout(() => {
    mostrarSugerencias.value = false
  }, 150)
}
function quitarItem(id: number) {
  items.value = items.value.filter((i) => i.id !== id)
}

function subtotalItem(item: ItemVenta) {
  return item.cantidad * item.precioUnitario
}

// --- Totales ---
const subtotal = computed(() => items.value.reduce((acc, item) => acc + subtotalItem(item), 0))
const iva = computed(() => subtotal.value * IVA_PORCENTAJE)
const total = computed(() => subtotal.value + iva.value)

// --- Método de pago ---
const metodoPago = ref(METODOS_PAGO[0])

const guardando = ref(false)

async function generarOrdenVenta() {
  if (!clienteEncontrado.value) {
    avisoError('Debe seleccionar un cliente para generar la orden de venta.', 'Faltan datos')
    return
  }
  if (clienteEncontrado.value.estado !== 'Activo') {
    avisoError('El cliente está dado de baja y no se le puede generar una orden de venta.', 'Cliente dado de baja')
    return
  }
  if (items.value.length === 0) {
    avisoError('Debe agregar al menos un producto a la orden de venta.', 'Faltan datos')
    return
  }

  // La fecha se toma automáticamente en el momento de generar la orden
  fecha.value = fechaDeHoy()

  guardando.value = true
  try {
    const orden = await crearOrdenVenta({
      clienteId: clienteEncontrado.value.cliente_id,
      metodoPago: metodoPago.value,
      tipoComprobante: tipoComprobante.value,
      items: items.value.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    })
    avisoExito(
      `Orden de venta N° ${orden.id} generada.\n` +
        `Total: $${orden.total.toLocaleString('es-AR')}\n` +
        'Estado: En proceso. Finanzas la factura desde su sector.',
      'Orden de venta creada',
    )

    items.value = []
    clienteEncontrado.value = null
    cuilBuscado.value = ''
    await cargarDatos() // el stock cambió: se vuelve a pedir la lista de productos
  } catch (err) {
    console.error(err)
    avisoError(textoError(err), 'No se pudo generar la orden de venta')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="container-fluid py-2">
    <div class="mb-4">
      <h3 class="fw-bold mb-0 text-dark">Generar orden de venta</h3>
      <p class="text-muted small mb-0">Nueva orden de venta</p>
    </div>

    <div v-if="errorCarga" class="alert alert-danger">{{ errorCarga }}</div>

    <!-- Encabezado -->
    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body p-3">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label fw-semibold">Cliente (buscar por CUIL)</label>
            <div class="input-group">
              <input
                v-model="cuilBuscado"
                type="text"
                inputmode="numeric"
                maxlength="11"
                class="form-control"
                placeholder="20314567892"
                @input="limpiarCuilBuscado"
                @keyup.enter="buscarCliente"
              />
              <button
                class="btn btn-coralon"
                type="button"
                :disabled="!cuilCompleto"
                @click="buscarCliente"
              >🔍</button>
            </div>
            <div v-if="cuilBuscado.length > 0 && !cuilCompleto" class="text-danger small mt-1">
              El CUIL debe tener 11 dígitos numéricos, sin guiones.
            </div>
            <div v-if="clienteEncontrado" class="text-success small mt-1">
              ✓ {{ clienteEncontrado.nombre }} — {{ clienteEncontrado.condicion_iva }}
            </div>
            <div v-else-if="busquedaSinResultado" class="text-danger small mt-1">
              No existe un cliente con ese CUIL.
            </div>
          </div>

          <div class="col-md-4">
            <label class="form-label fw-semibold">Fecha</label>
            <input :value="fecha" type="date" class="form-control" disabled />
          </div>

          <div class="col-md-4">
            <label class="form-label fw-semibold">Tipo de comprobante</label>
            <input
              :value="tipoComprobante || 'Se define al elegir el cliente'"
              type="text"
              class="form-control"
              disabled
            />
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Detalle de ítems -->
      <div class="col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white d-flex justify-content-between align-items-center position-relative">
            <span class="fw-bold">Detalle de ítems</span>
            <div class="position-relative" style="width: 320px;">
              <input
                v-model="busquedaProducto"
                type="text"
                class="form-control form-control-sm"
                placeholder="Buscar producto por nombre..."
                @focus="mostrarSugerencias = true"
                @blur="ocultarSugerenciasConDelay"              />

              <!-- Lista de sugerencias en vivo -->
              <ul
                v-if="mostrarSugerencias && sugerencias.length > 0"
                class="list-group position-absolute w-100 shadow-sm sugerencias-lista"
              >
                <li
                  v-for="producto in sugerencias"
                  :key="producto.producto_id"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  style="cursor: pointer;"
                  @mousedown.prevent="agregarProducto(producto)"
                >
                  <span>{{ producto.nombre }}</span>
                  <span class="text-muted small">${{ producto.preciounitario.toLocaleString('es-AR') }}</span>
                </li>
              </ul>

              <div
                v-if="mostrarSugerencias && busquedaProducto.trim() && sugerencias.length === 0"
                class="position-absolute w-100 shadow-sm sugerencias-lista bg-white border rounded p-2 text-muted small"
              >
                No se encontraron productos.
              </div>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table align-middle mb-0">
              <thead class="table-dark-custom">
                <tr>
                  <th class="ps-3">Producto</th>
                  <th>Cant.</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                  <th class="pe-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.id">
                  <td class="ps-3">{{ item.nombre }}</td>
                  <td style="width: 90px;">
                    <input v-model.number="item.cantidad" type="number" min="1" class="form-control form-control-sm" />
                  </td>
                  <td>${{ item.precioUnitario.toLocaleString('es-AR') }}</td>
                  <td class="fw-bold">${{ subtotalItem(item).toLocaleString('es-AR') }}</td>
                  <td class="pe-3 text-end">
                    <button class="btn btn-sm btn-outline-danger" type="button" @click="quitarItem(item.id)">🗑️</button>
                  </td>
                </tr>
                <tr v-if="items.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">
                    Buscá un producto arriba para agregarlo a la orden.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Resumen -->
      <div class="col-lg-4">
        <div class="card shadow-sm border-0">
          <div class="card-body p-3">
            <h6 class="fw-bold mb-3">Resumen</h6>

            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">Subtotal</span>
              <span>${{ subtotal.toLocaleString('es-AR') }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted">IVA (21%)</span>
              <span>${{ iva.toLocaleString('es-AR', { maximumFractionDigits: 0 }) }}</span>
            </div>
            <hr />
            <div class="d-flex justify-content-between mb-3 fs-5 fw-bold">
              <span>Total</span>
              <span>${{ total.toLocaleString('es-AR', { maximumFractionDigits: 0 }) }}</span>
            </div>

            <label class="form-label fw-semibold">Método de pago</label>
            <select v-model="metodoPago" class="form-select mb-3">
              <option v-for="m in METODOS_PAGO" :key="m" :value="m">{{ m }}</option>
            </select>

            <button class="btn btn-coralon w-100 fw-semibold" type="button" :disabled="guardando" @click="generarOrdenVenta">
              Generar orden de venta
            </button>
          </div>
        </div>
      </div>
    </div>
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
.sugerencias-lista {
  top: 100%;
  left: 0;
  z-index: 20;
  max-height: 240px;
  overflow-y: auto;
}
</style>