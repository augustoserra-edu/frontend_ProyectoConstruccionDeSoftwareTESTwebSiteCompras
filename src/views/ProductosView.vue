<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Producto, MovimientoInventario } from '../types/producto'
import type { Rubro } from '../types/rubro'
import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  inactivarProducto,
  obtenerMovimientosPorProducto
} from '../services/productosService'
import { obtenerRubros } from '../services/rubrosService'
import { mensajeErrorApi } from '../utils/erroresApi'
import { alerta } from '../utils/alertas'
import ModalProducto from '../components/ModalProducto.vue'
import ModalMovimientos from '../components/ModalMovimientos.vue'

const listaProductos = ref<Producto[]>([])
const listaRubros = ref<Rubro[]>([])
const filtroBusqueda = ref('')
const cargando = ref(false)
const errorCarga = ref('')

const mostrarModal = ref(false)
const productoParaEditar = ref<Producto | null>(null)
const guardando = ref(false)

// Modal de Movimientos
const mostrarModalMovimientos = ref(false)
const productoParaMovimientos = ref<Producto | null>(null)
const movimientosProductoSeleccionado = ref<MovimientoInventario[]>([])

async function cargarDatos() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const [prods, rubs] = await Promise.all([
      obtenerProductos(),
      obtenerRubros().catch(() => [] as Rubro[])
    ])
    listaProductos.value = prods
    listaRubros.value = rubs
  } catch {
    listaProductos.value = []
    listaRubros.value = []
    errorCarga.value = 'No se pudo conectar con el servidor o cargar los datos. Verifique que el servicio esté disponible.'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarDatos()
})

function obtenerNombreRubro(rubroId: number, rubroNombre?: string): string {
  if (rubroNombre) return rubroNombre
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
    obtenerNombreRubro(p.rubro_id, p.rubro_nombre).toLowerCase().includes(busqueda)
  )
})

function abrirModalCrear() {
  productoParaEditar.value = null
  mostrarModal.value = true
}

function abrirModalEditar(producto: Producto) {
  productoParaEditar.value = { ...producto }
  mostrarModal.value = true
}

function cerrarModal() {
  if (guardando.value) return
  mostrarModal.value = false
  productoParaEditar.value = null
}

async function verMovimientos(producto: Producto) {
  productoParaMovimientos.value = producto
  try {
    movimientosProductoSeleccionado.value = await obtenerMovimientosPorProducto(producto.producto_id)
    mostrarModalMovimientos.value = true
  } catch (error) {
    movimientosProductoSeleccionado.value = []
    alerta.error('Error al cargar movimientos', mensajeErrorApi(error))
  }
}

// Flujo de Confirmación de Baja con SweetAlert2
async function solicitarBaja(producto: Producto) {
  const confirmado = await alerta.confirmar(
    '¿Confirmar inhabilitación?',
    `¿Desea inactivar el producto "${producto.nombre}"?`,
    'Inactivar'
  )
  if (!confirmado) return

  const id = producto.producto_id

  try {
    await inactivarProducto(id)
    const idx = listaProductos.value.findIndex(p => p.producto_id === id)
    if (idx !== -1) listaProductos.value[idx].activo = false
    alerta.exito('Producto inactivado', `El producto "${producto.nombre}" fue inactivado correctamente.`)
  } catch (error) {
    alerta.error('Error al inactivar', mensajeErrorApi(error))
  }
}

async function guardarProducto(datos: any) {
  if (guardando.value) return
  guardando.value = true
  try {
    if (datos.producto_id) {
      const actualizado = await actualizarProducto(datos.producto_id, datos)
      const idx = listaProductos.value.findIndex(p => p.producto_id === datos.producto_id)
      if (idx !== -1) {
        listaProductos.value[idx] = actualizado
      }
      cerrarModal()
      alerta.exito('Producto actualizado', 'Producto actualizado correctamente.')
    } else {
      const nuevoProd = await crearProducto(datos)
      listaProductos.value.unshift(nuevoProd)
      cerrarModal()
      alerta.exito('Producto creado', 'Producto creado correctamente.')
    }
  } catch (error) {
    alerta.error('Error al guardar producto', mensajeErrorApi(error))
  } finally {
    guardando.value = false
  }
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

    <!-- Banner de error de carga -->
    <div
      v-if="errorCarga"
      class="alert alert-danger d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-4"
      role="alert"
    >
      <span>{{ errorCarga }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline-danger fw-semibold flex-shrink-0"
        @click="cargarDatos"
      >
        Reintentar
      </button>
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
                  <span class="badge badge-rubro small">{{ obtenerNombreRubro(producto.rubro_id, producto.rubro_nombre) }}</span>
                </div>
              </td>
              <td class="text-secondary small text-truncate d-none d-md-table-cell" style="max-width: 250px;">
                {{ producto.descripcion }}
              </td>
              <td class="d-none d-lg-table-cell">
                <span class="badge badge-rubro">
                  {{ obtenerNombreRubro(producto.rubro_id, producto.rubro_nombre) }}
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
                <span v-if="cargando">Cargando productos...</span>
                <span v-else>No se encontraron productos...</span>
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

  </div>
</template>

<style scoped>
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
