<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Producto, MovimientoInventario } from '../types/producto'
import { RUBROS_MOCK, type Rubro } from '../types/rubro'
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  inactivarProducto,
  obtenerMovimientosPorProducto
} from '../services/productosService'
import { obtenerRubros } from '../services/rubrosService'
import { mensajeErrorApi } from '../utils/erroresApi'
import ModalProducto from '../components/ModalProducto.vue'
import ModalMovimientos from '../components/ModalMovimientos.vue'

const listaProductos = ref<Producto[]>([])
const listaRubros = ref<Rubro[]>([...RUBROS_MOCK])
const filtroBusqueda = ref('')

const mostrarModal = ref(false)
const productoParaEditar = ref<Producto | null>(null)
const guardando = ref(false)
const errorGuardado = ref('')
const mensajeExito = ref('')

// Modal de Movimientos
const mostrarModalMovimientos = ref(false)
const productoParaMovimientos = ref<Producto | null>(null)
const movimientosProductoSeleccionado = ref<MovimientoInventario[]>([])

// Modal de Confirmación de Inactivación
const mostrarModalConfirmarBaja = ref(false)
const productoParaInactivar = ref<Producto | null>(null)
const procesandoBaja = ref(false)

onMounted(async () => {
  const [prods, rubs] = await Promise.all([obtenerProductos(), obtenerRubros()])
  listaProductos.value = prods
  listaRubros.value = rubs
})

function obtenerNombreRubro(rubroId: number): string {
  const r = listaRubros.value.find(item => item.rubro_id === rubroId)
  return r ? r.nombre : `Rubro #${rubroId}`
}

// Filtra productos activos que coincidan con la búsqueda
const productosFiltrados = computed(() => {
  const busqueda = filtroBusqueda.value.toLowerCase().trim()
  const productosActivos = listaProductos.value.filter(p => p.activo !== false)

  if (!busqueda) return productosActivos

  return productosActivos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda) ||
    p.descripcion.toLowerCase().includes(busqueda) ||
    obtenerNombreRubro(p.rubro_id).toLowerCase().includes(busqueda)
  )
})

function abrirModalCrear() {
  productoParaEditar.value = null
  errorGuardado.value = ''
  mostrarModal.value = true
}

function abrirModalEditar(producto: Producto) {
  productoParaEditar.value = { ...producto }
  errorGuardado.value = ''
  mostrarModal.value = true
}

function cerrarModal() {
  if (guardando.value) return
  mostrarModal.value = false
  productoParaEditar.value = null
}

async function verMovimientos(producto: Producto) {
  productoParaMovimientos.value = producto
  movimientosProductoSeleccionado.value = await obtenerMovimientosPorProducto(producto.producto_id)
  mostrarModalMovimientos.value = true
}

// Flujo de Confirmación de Baja con Modal
function solicitarBaja(producto: Producto) {
  productoParaInactivar.value = producto
  mostrarModalConfirmarBaja.value = true
}

function cancelarBaja() {
  if (procesandoBaja.value) return
  mostrarModalConfirmarBaja.value = false
  productoParaInactivar.value = null
}

async function confirmarBaja() {
  if (!productoParaInactivar.value) return
  procesandoBaja.value = true
  const id = productoParaInactivar.value.producto_id

  try {
    await inactivarProducto(id)
    const idx = listaProductos.value.findIndex(p => p.producto_id === id)
    if (idx !== -1) listaProductos.value[idx].activo = false
    mensajeExito.value = `El producto "${productoParaInactivar.value.nombre}" fue inactivado correctamente.`
    cancelarBaja()
  } catch (error) {
    alert(mensajeErrorApi(error))
  } finally {
    procesandoBaja.value = false
  }

  setTimeout(() => {
    mensajeExito.value = ''
  }, 4000)
}

async function guardarProducto(datos: any) {
  if (guardando.value) return
  guardando.value = true
  errorGuardado.value = ''
  mensajeExito.value = ''
  try {
    if (datos.producto_id) {
      const actualizado = await actualizarProducto(datos.producto_id, datos)
      const idx = listaProductos.value.findIndex(p => p.producto_id === datos.producto_id)
      if (idx !== -1) {
        listaProductos.value[idx] = actualizado
      }
      mensajeExito.value = 'Producto actualizado correctamente.'
    } else {
      const nuevoProd = await crearProducto(datos)
      listaProductos.value.unshift(nuevoProd)
      mensajeExito.value = 'Producto creado correctamente.'
    }
    cerrarModal()
  } catch (error) {
    errorGuardado.value = mensajeErrorApi(error)
  } finally {
    guardando.value = false
  }

  setTimeout(() => {
    mensajeExito.value = ''
  }, 4000)
}
</script>

<template>
  <div class="container-fluid p-0">
    <!-- Header y Acción Principal -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">Catálogo de Productos</h3>
        <p class="text-muted small mb-0">Gestión de inventario y catálogo del corralón</p>
      </div>

      <div class="w-100 w-md-auto">
        <button 
          class="btn btn-coralon d-flex align-items-center justify-content-center gap-2 px-3 fw-semibold w-100 w-md-auto shadow-sm"
          @click="abrirModalCrear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="mensajeExito" class="alert alert-success py-2 small mb-3" role="status">
      {{ mensajeExito }}
    </div>

    <!-- Buscador -->
    <div class="card shadow-sm border-0 mb-4 search-card">
      <div class="card-body p-3">
        <div class="row">
          <div class="col-12 col-md-6 col-lg-5">
            <input
              v-model="filtroBusqueda"
              type="text"
              class="form-control custom-search"
              placeholder="Buscar por Nombre, Descripción o Rubro..."
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla Responsive con Botones por Fila -->
    <div class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark-custom">
            <tr>
              <th class="ps-3 py-3" style="width: 60px;">ID</th>
              <th class="py-3">Producto</th>
              <th class="py-3 d-none d-md-table-cell">Descripción</th>
              <th class="py-3 d-none d-lg-table-cell">Rubro</th>
              <th class="py-3 text-center">Stock Actual</th>
              <th class="py-3 text-center d-none d-sm-table-cell">Stock Mín.</th>
              <th class="pe-3 py-3 text-end" style="min-width: 170px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="producto in productosFiltrados"
              :key="producto.producto_id"
            >
              <td class="ps-3 fw-bold font-monospace">#{{ producto.producto_id }}</td>
              <td>
                <div class="fw-semibold text-dark">{{ producto.nombre }}</div>
                <div class="d-lg-none mt-1">
                  <span class="badge badge-rubro small">{{ obtenerNombreRubro(producto.rubro_id) }}</span>
                </div>
              </td>
              <td class="text-secondary small text-truncate d-none d-md-table-cell" style="max-width: 250px;">
                {{ producto.descripcion }}
              </td>
              <td class="d-none d-lg-table-cell">
                <span class="badge badge-rubro">
                  {{ obtenerNombreRubro(producto.rubro_id) }}
                </span>
              </td>
              <td class="text-center">
                <span 
                  class="badge px-2 py-1" 
                  :class="producto.stockactual <= producto.stockminreposicion ? 'bg-danger' : 'bg-success'"
                >
                  {{ producto.stockactual }} un.
                </span>
              </td>
              <td class="text-muted text-center d-none d-sm-table-cell">{{ producto.stockminreposicion }} un.</td>
              
              <!-- Columna de Acciones por Fila -->
              <td class="pe-3 text-end">
                <div class="btn-group btn-group-sm" role="group" aria-label="Acciones de producto">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    title="Ver Movimientos"
                    @click="verMovimientos(producto)"
                  >
                    👁
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-coralon"
                    title="Editar Producto"
                    @click="abrirModalEditar(producto)"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger"
                    title="Inactivar Producto"
                    @click="solicitarBaja(producto)"
                  >
                    ✕
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="productosFiltrados.length === 0">
              <td colspan="7" class="text-center py-5 text-muted">
                No se encontraron productos activos que coincidan con la búsqueda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Editar / Crear Producto -->
    <ModalProducto
      :mostrar="mostrarModal"
      :producto-a-editar="productoParaEditar"
      :guardando="guardando"
      :error="errorGuardado"
      @cerrar="cerrarModal"
      @guardar="guardarProducto"
    />

    <!-- Modal de Movimientos -->
    <ModalMovimientos
      :mostrar="mostrarModalMovimientos"
      :producto="productoParaMovimientos"
      :movimientos="movimientosProductoSeleccionado"
      @cerrar="mostrarModalMovimientos = false"
    />

    <!-- Modal de Confirmación de Inactivación -->
    <div v-if="mostrarModalConfirmarBaja && productoParaInactivar">
      <div class="modal-backdrop fade show"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow border-0 overflow-hidden">
            <div class="modal-header bg-danger text-white px-4 py-3">
              <h5 class="modal-title fw-bold mb-0">Confirmar Inhabilitación</h5>
              <button 
                type="button" 
                class="btn-close btn-close-white" 
                aria-label="Cerrar"
                :disabled="procesandoBaja"
                @click="cancelarBaja"
              ></button>
            </div>
            <div class="modal-body p-4 bg-white">
              <p class="text-dark mb-2">
                ¿Está seguro de que desea inactivar el siguiente producto del inventario?
              </p>
              <div class="p-3 bg-light rounded border mb-3">
                <div class="fw-bold text-dark fs-6">{{ productoParaInactivar.nombre }}</div>
                <div class="text-muted small">ID: #{{ productoParaInactivar.producto_id }} | Rubro: {{ obtenerNombreRubro(productoParaInactivar.rubro_id) }}</div>
              </div>
              <p class="text-muted small mb-0">
                El producto dejará de estar visible en el catálogo activo para ventas y pedidos.
              </p>
            </div>
            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button 
                type="button" 
                class="btn btn-secondary px-3" 
                :disabled="procesandoBaja"
                @click="cancelarBaja"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                class="btn btn-danger px-4 fw-semibold" 
                :disabled="procesandoBaja"
                @click="confirmarBaja"
              >
                <span v-if="procesandoBaja" class="spinner-border spinner-border-sm me-2" role="status"></span>
                Inactivar Producto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.modal-backdrop {
  opacity: 0.6;
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

.table-dark-custom {
  background-color: #231f1d;
  color: #f5f5f5;
  border-bottom: 2px solid #b33e14;
}
.table-dark-custom th {
  background-color: #231f1d;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.88rem;
}

.badge-rubro {
  background-color: #332d2a;
  color: #c9881e;
  font-weight: 500;
  padding: 0.4em 0.6em;
}
</style>