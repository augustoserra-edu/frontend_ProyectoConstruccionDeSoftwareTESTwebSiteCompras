<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PROVEEDORES_MOCK } from '../types/proveedor'
import { PRODUCTOS_MOCK } from '../types/producto'
import type { NuevaOrdenCompra, NuevoOrdenCompraDetalle } from '../types/compra'

interface Props {
  mostrar: boolean
  guardando: boolean
  error: string
  cabeceraCreada: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', orden: NuevaOrdenCompra): void
}>()

const proveedorId = ref<number | ''>('')
const solicitante = ref('')
const busquedaProveedor = ref('')
function obtenerFechaActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

const fecha = ref(obtenerFechaActual())
let siguienteClave = 1
const items = ref<(NuevoOrdenCompraDetalle & { clave: number; busqueda: string })[]>([])
const errorValidacion = ref('')
const moneda = (valor: number) => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const subtotal = (item: NuevoOrdenCompraDetalle) => Math.round(item.cantidad * item.preciounitario * 100) / 100
const total = computed(() => Math.round(items.value.reduce((suma, item) => suma + subtotal(item), 0) * 100) / 100)

function normalizarBusqueda(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

const proveedoresFiltrados = computed(() => {
  const busqueda = normalizarBusqueda(busquedaProveedor.value)
  const cuitSinSeparadores = busqueda.replace(/[-\s]/g, '')

  return PROVEEDORES_MOCK.filter(proveedor =>
    normalizarBusqueda(`${proveedor.nombre} ${proveedor.apellido}`).includes(busqueda) ||
    proveedor.proveedor_id.toString().includes(busqueda) ||
    (cuitSinSeparadores !== '' && proveedor.cuit.replace(/[-\s]/g, '').includes(cuitSinSeparadores))
  )
})

const proveedorFueraDelFiltro = computed(() => PROVEEDORES_MOCK.find(proveedor =>
  proveedor.proveedor_id === proveedorId.value &&
  !proveedoresFiltrados.value.some(coincidencia => coincidencia.proveedor_id === proveedor.proveedor_id)
))

const productosPorItem = computed(() => items.value.map(item => {
  const busqueda = normalizarBusqueda(item.busqueda)
  const coincidencias = PRODUCTOS_MOCK.filter(producto =>
    !items.value.some(otro => otro.clave !== item.clave && otro.producto_id === producto.producto_id) &&
    (normalizarBusqueda(producto.nombre).includes(busqueda) ||
    producto.producto_id.toString().includes(busqueda))
  )
  const seleccionadoFueraDelFiltro = PRODUCTOS_MOCK.find(producto =>
    producto.producto_id === item.producto_id &&
    !coincidencias.some(coincidencia => coincidencia.producto_id === producto.producto_id)
  )
  return { coincidencias, seleccionadoFueraDelFiltro }
}))

function agregarItem() {
  if (items.value.length >= PRODUCTOS_MOCK.length) return
  items.value.push({ clave: siguienteClave++, busqueda: '', producto_id: 0, cantidad: 1, preciounitario: 0 })
}

function actualizarPrecio(item: NuevoOrdenCompraDetalle) {
  item.preciounitario = PRODUCTOS_MOCK.find(producto => producto.producto_id === item.producto_id)?.preciounitario ?? 0
}

function guardar() {
  if (props.guardando) return
  if (!props.cabeceraCreada) items.value.forEach(actualizarPrecio)
  if (!props.cabeceraCreada) fecha.value = obtenerFechaActual()
  errorValidacion.value = ''
  const productosElegidos = items.value.filter(item => item.producto_id !== 0).map(item => item.producto_id)
  if (new Set(productosElegidos).size !== productosElegidos.length) {
    errorValidacion.value = 'Cada producto puede aparecer una sola vez. Modificá la cantidad en su fila para pedir más unidades.'
    return
  }
  if (!solicitante.value.trim() || !proveedorId.value || !fecha.value || !items.value.length || items.value.some(item =>
    !PRODUCTOS_MOCK.some(producto => producto.producto_id === item.producto_id)
    || !Number.isSafeInteger(item.cantidad) || item.cantidad <= 0
    || !Number.isFinite(item.preciounitario) || item.preciounitario <= 0
  ) || !Number.isFinite(total.value) || total.value <= 0) {
    errorValidacion.value = 'Completá solicitante interno, proveedor, fecha y al menos un producto con cantidad entera mayor a cero y precio válido.'
    return
  }
  emit('guardar', {
    cabecera: { solicitante: solicitante.value.trim(), proveedor_id: proveedorId.value, fecha: fecha.value, total: total.value },
    detalles: items.value.map(({ producto_id, cantidad, preciounitario }) => ({ producto_id, cantidad, preciounitario }))
  })
}

function cerrarModal() {
  if (!props.guardando) emit('cerrar')
}

watch(
  () => props.mostrar,
  (mostrar) => {
    if (!mostrar || props.cabeceraCreada) return
    proveedorId.value = ''
    solicitante.value = ''
    busquedaProveedor.value = ''
    fecha.value = obtenerFechaActual()
    items.value = []
    errorValidacion.value = ''
    agregarItem()
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="mostrar">
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="titulo-nueva-orden" @keydown.esc="cerrarModal">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
        <form class="modal-content shadow border-0 overflow-hidden" @submit.prevent="guardar">
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <h5 id="titulo-nueva-orden" class="modal-title fw-bold">Nueva Orden de Compra</h5>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" :disabled="guardando" @click="cerrarModal"></button>
          </div>
          <div class="modal-body p-4 bg-white">
            <div v-if="error || errorValidacion" class="alert alert-danger" role="alert">{{ error || errorValidacion }}</div>
            <fieldset :disabled="guardando || cabeceraCreada">
              <legend class="fs-6 fw-bold">Cabecera</legend>
              <div class="row g-3 mb-4">
                <div class="col-12">
                  <label for="orden-solicitante" class="form-label fw-semibold">Solicitante interno</label>
                  <input
                    id="orden-solicitante"
                    v-model="solicitante"
                    type="text"
                    class="form-control"
                    placeholder="Nombre de la persona o área de la empresa"
                    required
                  />
                </div>
                <div class="col-md-8">
                  <label for="buscar-proveedor" class="form-label small">Buscar proveedor</label>
                  <input
                    id="buscar-proveedor"
                    v-model="busquedaProveedor"
                    type="search"
                    class="form-control mb-2"
                    placeholder="Buscar por nombre, CUIT o ID..."
                    aria-describedby="resultados-proveedor"
                    @keydown.enter.prevent
                  />
                  <label for="orden-proveedor" class="form-label fw-semibold">Proveedor</label>
                  <select id="orden-proveedor" v-model="proveedorId" class="form-select" required>
                    <option disabled value="">Seleccionar proveedor</option>
                    <option v-if="proveedorFueraDelFiltro" :value="proveedorFueraDelFiltro.proveedor_id" hidden>
                      {{ proveedorFueraDelFiltro.nombre }} {{ proveedorFueraDelFiltro.apellido }} — {{ proveedorFueraDelFiltro.cuit }}
                    </option>
                    <option v-for="proveedor in proveedoresFiltrados" :key="proveedor.proveedor_id" :value="proveedor.proveedor_id">
                      {{ proveedor.nombre }} {{ proveedor.apellido }} — {{ proveedor.cuit }}
                    </option>
                  </select>
                  <small id="resultados-proveedor" class="text-muted d-block mt-1" role="status">
                    {{ proveedoresFiltrados.length === 0 ? 'No se encontraron proveedores.' : `${proveedoresFiltrados.length} proveedor(es) disponibles.` }}
                  </small>
                </div>
                <div class="col-md-4">
                  <label for="orden-fecha" class="form-label fw-semibold">Fecha</label>
                  <input id="orden-fecha" :value="fecha" type="date" class="form-control" readonly aria-describedby="orden-fecha-ayuda" />
                  <small id="orden-fecha-ayuda" class="text-muted">Se asigna automáticamente el día de creación.</small>
                </div>
              </div>
              <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
                <h6 class="fw-bold mb-0">Detalle de productos</h6>
                <button type="button" class="btn btn-sm btn-outline-coralon" :disabled="items.length >= PRODUCTOS_MOCK.length" @click="agregarItem">Agregar producto</button>
              </div>
              <div v-for="(item, index) in items" :key="item.clave" class="row g-2 align-items-end border rounded p-2 mb-3">
                <div class="col-md-4">
                  <label :for="`buscar-producto-${item.clave}`" class="form-label small">Buscar producto</label>
                  <input
                    :id="`buscar-producto-${item.clave}`"
                    v-model="item.busqueda"
                    type="search"
                    class="form-control mb-2"
                    placeholder="Buscar por nombre o ID..."
                    :aria-label="`Buscar producto para el ítem ${index + 1}`"
                    :aria-describedby="`resultados-producto-${item.clave}`"
                    @keydown.enter.prevent
                  />
                  <label :for="`producto-${item.clave}`" class="form-label small">Producto {{ index + 1 }}</label>
                  <select :id="`producto-${item.clave}`" v-model="item.producto_id" class="form-select" required @change="actualizarPrecio(item)">
                    <option disabled :value="0">Seleccionar producto</option>
                    <option
                      v-if="productosPorItem[index]?.seleccionadoFueraDelFiltro"
                      :value="item.producto_id"
                      hidden
                    >{{ productosPorItem[index]?.seleccionadoFueraDelFiltro?.nombre }}</option>
                    <option v-for="producto in productosPorItem[index]?.coincidencias" :key="producto.producto_id" :value="producto.producto_id">#{{ producto.producto_id }} — {{ producto.nombre }}</option>
                  </select>
                  <small :id="`resultados-producto-${item.clave}`" class="text-muted d-block mt-1" role="status">
                    {{ productosPorItem[index]?.coincidencias.length === 0 ? 'No se encontraron productos.' : `${productosPorItem[index]?.coincidencias.length} producto(s) disponibles.` }}
                  </small>
                </div>
                <div class="col-md-2">
                  <label :for="`cantidad-${item.clave}`" class="form-label small">Cantidad</label>
                  <input :id="`cantidad-${item.clave}`" v-model.number="item.cantidad" type="number" min="1" step="1" inputmode="numeric" required class="form-control" />
                </div>
                <div class="col-md-2">
                  <label :for="`precio-${item.clave}`" class="form-label small">Precio unitario</label>
                  <input :id="`precio-${item.clave}`" :value="moneda(item.preciounitario)" type="text" readonly class="form-control bg-light" />
                </div>
                <div class="col-md-3">
                  <span class="small d-block mb-2">Subtotal</span>
                  <span class="d-block py-2 fw-semibold">{{ moneda(subtotal(item)) }}</span>
                </div>
                <div class="col-md-1">
                  <button type="button" class="btn btn-outline-danger w-100" :aria-label="`Quitar producto ${index + 1}`" :disabled="items.length === 1" @click="items.splice(index, 1)">×</button>
                </div>
              </div>
            </fieldset>
            <p class="text-end fs-5 fw-bold mb-0">Total: <span class="text-coralon">{{ moneda(total) }}</span></p>
          </div>
          <div class="modal-footer bg-light px-4 py-3">
            <button type="button" class="btn btn-secondary px-3" :disabled="guardando" @click="cerrarModal">Cerrar</button>
            <button type="submit" class="btn btn-coralon fw-semibold" :disabled="guardando">
              {{ guardando ? 'Guardando…' : cabeceraCreada ? 'Reintentar detalle' : 'Guardar Orden' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop { opacity: 0.6; }
.modal-header-custom { background-color: #231f1d; border-bottom: 3px solid #b33e14; }
.text-coralon { color: #b33e14; }
.btn-coralon { background-color: #b33e14; border-color: #b33e14; color: #fff; }
.btn-coralon:hover { background-color: #ff7a45; border-color: #ff7a45; }
.btn-outline-coralon { border-color: #b33e14; color: #b33e14; }
.btn-outline-coralon:hover { background-color: #b33e14; color: #fff; }
</style>
