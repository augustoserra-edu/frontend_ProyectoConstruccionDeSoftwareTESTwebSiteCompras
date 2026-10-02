<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Proveedor, NuevoProveedor } from '../types/proveedor'
import { obtenerProveedores, crearProveedor, actualizarProveedor, relacionMultipleDisponible } from '../services/proveedoresService'
import { obtenerProductosProveedor, type ProductoProveedor } from '../services/productosService'
import { mensajeErrorApi } from '../utils/erroresApi'
import ModalProveedor from '../components/ModalProveedor.vue'

const listaProveedores = ref<Proveedor[]>([])
const productos = ref<ProductoProveedor[]>([])
const cargando = ref(false)
const guardando = ref(false)
const mensajeError = ref('')
const errorGuardado = ref('')
const mensajeExito = ref('')
const filtroBusqueda = ref('')
const proveedorSeleccionado = ref<Proveedor | null>(null)
const mostrarModal = ref(false)
const proveedorParaEditar = ref<Proveedor | null>(null)
const nombreProducto = (id: number) => productos.value.find(p => p.id === id)?.nombre ?? `Producto #${id}`

async function cargarProveedores() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const [proveedores, catalogo] = await Promise.all([obtenerProveedores(), obtenerProductosProveedor()])
    listaProveedores.value = proveedores
    productos.value = catalogo
  } catch (error) {
    mensajeError.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error))
  } finally {
    cargando.value = false
  }
}

const proveedoresFiltrados = computed(() => {
  const busqueda = filtroBusqueda.value.toLowerCase().trim()
  return listaProveedores.value.filter(p =>
    [p.nombre, p.apellido, p.cuit, p.email, ...p.productos.map(nombreProducto)]
      .some(valor => valor.toLowerCase().includes(busqueda))
  )
})

function seleccionarFila(proveedor: Proveedor) {
  proveedorSeleccionado.value = proveedorSeleccionado.value?.proveedor_id === proveedor.proveedor_id ? null : proveedor
}

function abrirModalCrear() {
  proveedorParaEditar.value = null
  errorGuardado.value = ''
  mostrarModal.value = true
}

function abrirModalEditar() {
  if (!proveedorSeleccionado.value) return
  proveedorParaEditar.value = { ...proveedorSeleccionado.value, productos: [...proveedorSeleccionado.value.productos] }
  errorGuardado.value = ''
  mostrarModal.value = true
}

function cerrarModal() {
  if (guardando.value) return
  mostrarModal.value = false
  proveedorParaEditar.value = null
}

async function guardarProveedor(datos: NuevoProveedor) {
  if (guardando.value) return
  guardando.value = true
  errorGuardado.value = ''
  mensajeExito.value = ''
  try {
    const id = proveedorParaEditar.value?.proveedor_id
    const guardado = id ? await actualizarProveedor(id, datos) : await crearProveedor(datos)
    if (id) {
      const index = listaProveedores.value.findIndex(p => p.proveedor_id === id)
      if (index !== -1) listaProveedores.value[index] = guardado
      proveedorSeleccionado.value = guardado
    } else {
      listaProveedores.value.unshift(guardado)
    }
    mensajeExito.value = id ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.'
    mostrarModal.value = false
    proveedorParaEditar.value = null
  } catch (error) {
    errorGuardado.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error))
  } finally {
    guardando.value = false
  }
}

onMounted(cargarProveedores)
</script>

<template>
  <div class="container-fluid py-2">
    <!-- Header y Acciones -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">Gestión de Proveedores</h3>
        <p class="text-muted small mb-0">Alta, consulta y edición de proveedores del corralón</p>
      </div>

      <div class="d-flex gap-2">
        <button 
          class="btn btn-outline-coralon d-flex align-items-center gap-2 px-3 fw-semibold"
          :disabled="!proveedorSeleccionado || cargando || !relacionMultipleDisponible"
          @click="abrirModalEditar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
          </svg>
          <span>Editar Seleccionado</span>
        </button>

        <button 
          class="btn btn-coralon d-flex align-items-center gap-2 px-3 fw-semibold"
          :disabled="cargando || !!mensajeError || !relacionMultipleDisponible" @click="abrirModalCrear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          <span>Nuevo Proveedor</span>
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="!relacionMultipleDisponible" class="alert alert-warning" role="alert">
      El servidor todavía usa un solo producto por proveedor. Podés consultar los registros existentes; para crear o editar con varios productos es necesario actualizar el backend.
    </div>
    <div v-if="mensajeExito" class="alert alert-success py-2 small mb-3" role="status">
      {{ mensajeExito }}
    </div>
    <div v-if="mensajeError" class="alert alert-danger py-2 small mb-3" role="alert">
      {{ mensajeError }} <button type="button" class="btn btn-sm btn-outline-danger ms-2" :disabled="cargando" @click="cargarProveedores">Reintentar</button>
    </div>

    <!-- Buscador -->
    <div class="card shadow-sm border-0 mb-4 search-card">
      <div class="card-body p-3">
        <div class="row">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0 text-muted pe-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                </svg>
              </span>
              <input
                v-model="filtroBusqueda"
                type="text"
                class="form-control border-start-0 custom-search ps-2"
                placeholder="Buscar por Nombre, CUIT, Email o Producto..."
              />
            </div>
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
              <th scope="col" class="ps-3 py-3">ID</th>
              <th scope="col" class="py-3">Nombre / Razón Social</th>
              <th scope="col" class="py-3">Apellido / Denominación</th>
              <th scope="col" class="py-3">CUIT</th>
              <th scope="col" class="py-3">Productos Suministrados</th>
              <th scope="col" class="py-3">Teléfono</th>
              <th scope="col" class="py-3">Email</th>
              <th scope="col" class="py-3 pe-3">Dirección</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="proveedor in proveedoresFiltrados"
              :key="proveedor.proveedor_id"
              :class="{ 'fila-seleccionada': proveedorSeleccionado?.proveedor_id === proveedor.proveedor_id }"
              style="cursor: pointer;"
              @click="seleccionarFila(proveedor)"
            >
              <td class="ps-3 fw-bold">{{ proveedor.proveedor_id }}</td>
              <td class="fw-semibold">{{ proveedor.nombre }}</td>
              <td>{{ proveedor.apellido }}</td>
              <td><span class="badge badge-cuit font-monospace">{{ proveedor.cuit }}</span></td>
              <td>
                <span v-for="id in proveedor.productos" :key="id" class="badge me-1 mb-1 bg-secondary-subtle text-dark border border-secondary-subtle px-2 py-1">
                  #{{ id }} - {{ nombreProducto(id) }}
                </span>
              </td>
              <td>{{ proveedor.telefono }}</td>
              <td>{{ proveedor.email }}</td>
              <td class="pe-3 text-secondary">{{ proveedor.direccion }}</td>
            </tr>
            <tr v-if="cargando">
              <td colspan="8" class="text-center py-4 text-muted">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Cargando proveedores...
              </td>
            </tr>
            <tr v-else-if="proveedoresFiltrados.length === 0">
              <td colspan="8" class="text-center py-5 text-muted">
                No se encontraron proveedores que coincidan con la búsqueda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalProveedor
      :mostrar="mostrarModal"
      :proveedor-a-editar="proveedorParaEditar" :productos="productos" :guardando="guardando" :error="errorGuardado"
      @cerrar="cerrarModal"
      @guardar="guardarProveedor"
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

.custom-search:focus {
  border-color: #dee2e6;
  box-shadow: none;
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
  letter-spacing: 0.3px;
}

.badge-cuit {
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
