<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Producto } from '../types/producto'
import { obtenerProductos } from '../services/productosService'
import { crearOrdenCompra } from '../services/comprasService'
import { mensajeErrorApi } from '../utils/erroresApi'
import { alerta } from '../utils/alertas'
import ModalReponerStock from '../components/ModalReponerStock.vue'

// Estado reactivo conectado
const productos = ref<Producto[]>([])
const cargando = ref(false)
const errorCarga = ref('')
const filtroBusqueda = ref('')
const productoSeleccionado = ref<Producto | null>(null)
const mostrarModalReponer = ref(false)

async function cargarListaProductos() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const data = await obtenerProductos()
    productos.value = data
  } catch {
    productos.value = []
    errorCarga.value = 'No se pudo conectar con el servidor o cargar los datos. Verifique que el servicio esté disponible.'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarListaProductos()
})

// Filtrado reactivo por código o nombre
const productosFiltrados = computed(() => {
  const termino = filtroBusqueda.value.toLowerCase().trim()
  if (!termino) return productos.value

  return productos.value.filter(p => {
    const idCoincide = (p.id ?? p.producto_id).toString().includes(termino)
    const codigoCoincide = p.codigo ? p.codigo.toLowerCase().includes(termino) : false
    const nombreCoincide = p.nombre.toLowerCase().includes(termino)
    return idCoincide || codigoCoincide || nombreCoincide
  })
})

function seleccionarProducto(producto: Producto) {
  const prodId = producto.id ?? producto.producto_id
  const selId = productoSeleccionado.value?.id ?? productoSeleccionado.value?.producto_id

  if (selId === prodId) {
    productoSeleccionado.value = null
  } else {
    productoSeleccionado.value = producto
  }
}

function abrirModalReponer() {
  if (!productoSeleccionado.value) return
  mostrarModalReponer.value = true
}

function cerrarModalReponer() {
  mostrarModalReponer.value = false
}

async function confirmarReposicion(datos: {
  producto_id: number
  proveedor_id: number
  cantidad: number
  precio_unitario: number
  observacion: string
}) {
  const prod = productos.value.find(p => (p.id ?? p.producto_id) === datos.producto_id)
  if (!prod) return

  try {
    const hoy = new Date().toISOString().split('T')[0]

    // Emite la Orden de Compra formal al módulo Compras (POST /api/compras/ordenes-compra/)
    await crearOrdenCompra({
      cabecera: {
        proveedor_id: datos.proveedor_id,
        fecha: hoy
      } as any,
      detalles: [
        {
          producto_id: datos.producto_id,
          cantidad: datos.cantidad,
          preciounitario: datos.precio_unitario
        } as any
      ]
    })

    productoSeleccionado.value = null
    cerrarModalReponer()
    alerta.exito(
      'Orden de compra creada',
      `Orden de compra creada con éxito para "${prod.nombre}" (${datos.cantidad} un.). Quedó registrada en Compras para su aprobación.`
    )
  } catch (error) {
    alerta.error('Error al generar orden de compra', mensajeErrorApi(error))
  }
}
</script>

<template>
  <div class="container-fluid p-0">
    <!-- Encabezado con Botón General de Acción Adaptable -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">Carga y Reposición de Stock</h3>
        <p class="text-muted small mb-0">Seleccione un producto de la tabla para gestionar su reposición</p>
      </div>
      <div class="w-100 w-md-auto">
        <button
          type="button"
          class="btn btn-coralon d-flex align-items-center justify-content-center gap-2 px-3 fw-semibold shadow-sm w-100 w-md-auto"
          :disabled="!productoSeleccionado"
          @click="abrirModalReponer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          <span>Reponer Stock</span>
          <span v-if="productoSeleccionado" class="badge bg-light text-dark ms-1">
            #{{ productoSeleccionado.codigo || (productoSeleccionado.id ?? productoSeleccionado.producto_id) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Barra de búsqueda adaptada -->
    <div class="card shadow-sm border-0 mb-4 search-card">
      <div class="card-body p-3">
        <div class="row">
          <div class="col-12 col-md-6 col-lg-5">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0 text-muted pe-1">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                </svg>
              </span>
              <input
                v-model="filtroBusqueda"
                type="text"
                class="form-control border-start-0 ps-2"
                placeholder="Buscar por código o nombre del producto..."
              />
            </div>
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
        @click="cargarListaProductos"
      >
        Reintentar
      </button>
    </div>

    <!-- Tabla Principal de Stock con selección de fila y ocultamiento progresivo -->
    <div class="card shadow-sm border-0 overflow-hidden">
      <div class="card-header encabezado-custom text-white py-3 d-flex justify-content-between align-items-center">
        <h5 class="fw-bold mb-0 fs-6">Inventario de Mercadería</h5>
        <span class="small text-white-50 d-none d-sm-inline">Haga clic en una fila para seleccionarla</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="ps-3 py-2" style="width: 45px;">Sel.</th>
              <th scope="col" class="py-2" style="width: 80px;">Código</th>
              <th scope="col" class="py-2">Producto</th>
              <th scope="col" class="py-2 text-center">Stock Mín.</th>
              <th scope="col" class="py-2 text-center">Stock Actual</th>
              <th scope="col" class="pe-3 py-2 text-end d-none d-sm-table-cell">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="producto in productosFiltrados"
              :key="producto.id ?? producto.producto_id"
              class="fila-producto"
              :class="{ 'fila-seleccionada': (productoSeleccionado?.id ?? productoSeleccionado?.producto_id) === (producto.id ?? producto.producto_id) }"
              @click="seleccionarProducto(producto)"
            >
              <td class="ps-3">
                <input
                  type="radio"
                  class="form-check-input"
                  :checked="(productoSeleccionado?.id ?? productoSeleccionado?.producto_id) === (producto.id ?? producto.producto_id)"
                  @click.stop="seleccionarProducto(producto)"
                />
              </td>
              <td class="font-monospace fw-bold text-muted">
                {{ producto.codigo || `#${producto.id ?? producto.producto_id}` }}
              </td>
              <td>
                <div class="fw-semibold text-dark">{{ producto.nombre }}</div>
                <div class="text-muted small text-truncate d-none d-md-block" style="max-width: 380px;">
                  {{ producto.descripcion }}
                </div>
              </td>
              <td class="text-center text-muted">
                {{ producto.stockminreposicion }} un.
              </td>
              <td class="text-center">
                <span
                  class="fw-bold fs-6"
                  :class="producto.stockactual <= producto.stockminreposicion ? 'text-danger' : 'text-dark'"
                >
                  {{ producto.stockactual }} un.
                </span>
              </td>
              <td class="pe-3 text-end d-none d-sm-table-cell">
                <span
                  v-if="producto.stockactual <= producto.stockminreposicion"
                  class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"
                >
                  Reponer Urgente
                </span>
                <span
                  v-else
                  class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"
                >
                  Stock Normal
                </span>
              </td>
            </tr>
            <tr v-if="productosFiltrados.length === 0">
              <td colspan="6" class="text-center py-4 text-muted">
                <span v-if="cargando">Cargando productos del inventario...</span>
                <span v-else>No se encontraron productos...</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de reposición -->
    <ModalReponerStock
      :mostrar="mostrarModalReponer"
      :producto="productoSeleccionado"
      @cerrar="cerrarModalReponer"
      @confirmar="confirmarReposicion"
    />
  </div>
</template>

<style scoped>
.encabezado-custom {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14;
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

.fila-producto {
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.fila-seleccionada {
  background-color: #fbeee8 !important;
  border-left: 4px solid #b33e14;
}
</style>
