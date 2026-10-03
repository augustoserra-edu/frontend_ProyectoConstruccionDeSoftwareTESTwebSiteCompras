<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  type Producto, 
  type MovimientoInventario 
} from '../types/producto'
import { RUBROS_MOCK, type Rubro } from '../types/rubro'
import { 
  obtenerProductos, 
  crearProducto, 
  actualizarProducto, 
  inactivarProducto, 
  obtenerMovimientosPorProducto 
} from '../services/productosService'
import { obtenerRubros } from '../services/rubrosService'
import ModalProducto from '../components/ModalProducto.vue'
import ModalMovimientos from '../components/ModalMovimientos.vue'

const listaProductos = ref<Producto[]>([])
const listaRubros = ref<Rubro[]>([...RUBROS_MOCK])
const filtroBusqueda = ref('')
const productoSeleccionado = ref<Producto | null>(null)

const mostrarModal = ref(false)
const productoParaEditar = ref<Producto | null>(null)

// Modal de Movimientos
const mostrarModalMovimientos = ref(false)
const movimientosProductoSeleccionado = ref<MovimientoInventario[]>([])

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

function seleccionarFila(producto: Producto) {
  if (productoSeleccionado.value?.producto_id === producto.producto_id) {
    productoSeleccionado.value = null
  } else {
    productoSeleccionado.value = producto
  }
}

function abrirModalCrear() {
  productoParaEditar.value = null
  mostrarModal.value = true
}

function abrirModalEditar() {
  if (!productoSeleccionado.value) return
  productoParaEditar.value = { ...productoSeleccionado.value }
  mostrarModal.value = true
}

function cerrarModal() {
  mostrarModal.value = false
  productoParaEditar.value = null
}

async function verMovimientos() {
  if (!productoSeleccionado.value) return
  movimientosProductoSeleccionado.value = await obtenerMovimientosPorProducto(productoSeleccionado.value.producto_id)
  mostrarModalMovimientos.value = true
}

async function darDeBaja() {
  if (!productoSeleccionado.value) return
  const id = productoSeleccionado.value.producto_id
  const confirmacion = confirm(`¿Estás seguro de inactivar el producto "${productoSeleccionado.value.nombre}"?`)
  if (!confirmacion) return

  try {
    await inactivarProducto(id)
  } catch (error) {
    console.warn('Inactivación aplicada localmente.', error)
  }

  const idx = listaProductos.value.findIndex(p => p.producto_id === id)
  if (idx !== -1) {
    listaProductos.value[idx].activo = false
  }
  productoSeleccionado.value = null
}

async function guardarProducto(datos: any) {
  if (datos.producto_id) {
    try {
      await actualizarProducto(datos.producto_id, datos)
    } catch (e) {
      console.warn('Edición guardada localmente.', e)
    }
    const idx = listaProductos.value.findIndex(p => p.producto_id === datos.producto_id)
    if (idx !== -1) {
      listaProductos.value[idx] = { ...listaProductos.value[idx], ...datos }
      productoSeleccionado.value = listaProductos.value[idx]
    }
  } else {
    let nuevoProd: Producto
    try {
      nuevoProd = await crearProducto(datos)
    } catch (e) {
      const nuevoId = listaProductos.value.length > 0 
        ? Math.max(...listaProductos.value.map(p => p.producto_id)) + 1 
        : 1
      nuevoProd = {
        ...datos,
        producto_id: nuevoId,
        stockactual: 0,
        activo: true
      }
    }
    listaProductos.value.unshift(nuevoProd)
  }
  cerrarModal()
}
</script>

<template>
  <div class="container-fluid py-2">
    <!-- Header y Acciones -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">Catálogo de Productos</h3>
        <p class="text-muted small mb-0">Gestión de inventario, precios y catálogo del corralón</p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <!-- Ver Movimientos -->
        <button 
          class="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 fw-semibold"
          :disabled="!productoSeleccionado"
          @click="verMovimientos"
        >
          <span>👁 Ver Movimientos</span>
        </button>

        <!-- Inactivar (Baja lógica) -->
        <button 
          class="btn btn-outline-danger d-flex align-items-center gap-2 px-3 fw-semibold"
          :disabled="!productoSeleccionado"
          @click="darDeBaja"
        >
          <span>✕ Inactivar</span>
        </button>

        <!-- Botón Editar -->
        <button 
          class="btn btn-outline-coralon d-flex align-items-center gap-2 px-3 fw-semibold"
          :disabled="!productoSeleccionado"
          @click="abrirModalEditar"
        >
          <span>Editar Seleccionado</span>
        </button>

        <!-- Botón Nuevo Producto -->
        <button 
          class="btn btn-coralon d-flex align-items-center gap-2 px-3 fw-semibold"
          @click="abrirModalCrear"
        >
          <span>+ Nuevo Producto</span>
        </button>
      </div>
    </div>

    <!-- Buscador -->
    <div class="card shadow-sm border-0 mb-4 search-card">
      <div class="card-body p-3">
        <div class="row">
          <div class="col-md-6">
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

    <!-- Tabla -->
    <div class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark-custom">
            <tr>
              <th class="ps-3 py-3">ID</th>
              <th class="py-3">Producto</th>
              <th class="py-3">Descripción</th>
              <th class="py-3">Rubro</th>
              <th class="py-3">Precio Unit.</th>
              <th class="py-3">Stock Actual</th>
              <th class="py-3 pe-3">Stock Mín.</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="producto in productosFiltrados"
              :key="producto.producto_id"
              :class="{ 'fila-seleccionada': productoSeleccionado?.producto_id === producto.producto_id }"
              style="cursor: pointer;"
              @click="seleccionarFila(producto)"
            >
              <td class="ps-3 fw-bold">{{ producto.producto_id }}</td>
              <td class="fw-semibold">{{ producto.nombre }}</td>
              <td class="text-secondary small text-truncate" style="max-width: 250px;">
                {{ producto.descripcion }}
              </td>
              <td>
                <span class="badge badge-rubro">
                  {{ obtenerNombreRubro(producto.rubro_id) }}
                </span>
              </td>
              <td class="fw-bold text-dark">${{ producto.preciounitario.toLocaleString('es-AR') }}</td>
              <td>
                <span 
                  class="badge" 
                  :class="producto.stockactual <= producto.stockminreposicion ? 'bg-danger' : 'bg-success'"
                >
                  {{ producto.stockactual }} un.
                </span>
              </td>
              <td class="pe-3 text-muted">{{ producto.stockminreposicion }} un.</td>
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

    <!-- Modales -->
    <ModalProducto
      :mostrar="mostrarModal"
      :producto-a-editar="productoParaEditar"
      @cerrar="cerrarModal"
      @guardar="guardarProducto"
    />

    <ModalMovimientos
      :mostrar="mostrarModalMovimientos"
      :producto="productoSeleccionado"
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
.btn-outline-coralon:disabled {
  border-color: #d1cfcc;
  color: #a8a5a0;
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
.fila-seleccionada {
  background-color: #fff1eb !important;
  border-left: 4px solid #b33e14;
}
.fila-seleccionada td {
  background-color: #fff1eb !important;
}
</style>