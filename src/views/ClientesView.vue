<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { type Cliente, type NuevoCliente } from '../types/cliente'
import {
  obtenerClientes,
  buscarClientePorCuil,
  crearCliente,
  actualizarCliente,
  textoError,
} from '../services/ventasService'
import ModalCliente from '../components/ModalCliente.vue'
import { avisoError } from '../utils/avisos'

const listaClientes = ref<Cliente[]>([])
const cargando = ref(false)
const error = ref('')

const filtroBusqueda = ref('')

// La búsqueda la hace el servidor (?search=): se evita que lleguen respuestas viejas pisando a las nuevas
let numeroPedido = 0
async function cargarClientes() {
  const pedido = ++numeroPedido
  cargando.value = true
  error.value = ''
  try {
    const clientes = await obtenerClientes(filtroBusqueda.value)
    if (pedido === numeroPedido) listaClientes.value = clientes
  } catch (err) {
    console.error(err)
    if (pedido === numeroPedido) {
      error.value = 'Error: no se pudieron cargar los clientes. Verificá que el servidor esté disponible.'
    }
  } finally {
    if (pedido === numeroPedido) cargando.value = false
  }
}

onMounted(cargarClientes)

// Se espera un momento a que termine de escribir antes de consultar al servidor
let temporizador: ReturnType<typeof setTimeout> | undefined
watch(filtroBusqueda, () => {
  clearTimeout(temporizador)
  temporizador = setTimeout(cargarClientes, 350)
})
onBeforeUnmount(() => clearTimeout(temporizador))

const mostrarModal = ref(false)
const clienteParaEditar = ref<Cliente | null>(null)
const guardando = ref(false)

// CUILs que se ven en pantalla, para avisar rápido en el modal si se intenta repetir uno
// (la comprobación definitiva la hace guardarCliente consultando al servidor)
const cuilsExistentes = computed(() => listaClientes.value.map((c) => c.cuil))

function abrirModalCrear() {
  clienteParaEditar.value = null
  mostrarModal.value = true
}

function abrirModalEditar(cliente: Cliente) {
  clienteParaEditar.value = { ...cliente }
  mostrarModal.value = true
}

function cerrarModal() {
  mostrarModal.value = false
  clienteParaEditar.value = null
}

async function guardarCliente(datos: Cliente | NuevoCliente) {
  if (guardando.value) return // un solo guardado a la vez: el botón queda inactivo después del primer clic
  guardando.value = true
  try {
    const idActual = 'cliente_id' in datos ? datos.cliente_id : undefined

    // El CUIL no se puede repetir: se consulta al servidor, no solo a lo que hay en pantalla
    const repetido = await buscarClientePorCuil(datos.cuil)
    if (repetido && repetido.cliente_id !== idActual) {
      avisoError(`Ya existe un cliente con el CUIL ${datos.cuil} (${repetido.nombre}).`, 'CUIL repetido')
      return
    }

    if (idActual) {
      await actualizarCliente(datos as Cliente) // Editar: PUT
    } else {
      await crearCliente(datos as NuevoCliente) // Crear: POST
    }
    cerrarModal()
    await cargarClientes()
  } catch (err) {
    console.error(err)
    avisoError(textoError(err), 'No se pudo guardar el cliente')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="container-fluid py-2">
    <!-- Header y Acciones -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">ABM de Clientes</h3>
        <p class="text-muted small mb-0">Alta, baja y modificación de clientes</p>
      </div>

      <div class="d-flex gap-2">
        <!-- Botón Nuevo Cliente -->
        <button class="btn btn-coralon d-flex align-items-center gap-2 px-3 fw-semibold" @click="abrirModalCrear">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          <span>Nuevo Cliente</span>
        </button>
      </div>
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
                placeholder="Buscar por CUIL o nombre..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de carga / error -->
    <div v-if="cargando && listaClientes.length === 0" class="text-center py-5 text-muted">Cargando clientes...</div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Tabla -->
    <div v-else class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark-custom">
            <tr>
              <th scope="col" class="ps-3 py-3">CUIL / CUIT</th>
              <th scope="col" class="py-3">Nombre / Razón Social</th>
              <th scope="col" class="py-3">Teléfono</th>
              <th scope="col" class="py-3">Condición IVA</th>
              <th scope="col" class="py-3">Estado</th>
              <th scope="col" class="py-3 pe-3 text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in listaClientes" :key="cliente.cliente_id">
              <td class="ps-3 fw-bold">{{ cliente.cuil }}</td>
              <td class="fw-semibold">{{ cliente.nombre }}</td>
              <td class="text-secondary">{{ cliente.telefono }}</td>
              <td><span class="badge badge-rubro font-monospace">{{ cliente.condicion_iva }}</span></td>
              <td>
                <span class="badge" :class="cliente.estado === 'Activo' ? 'bg-success' : 'bg-danger'">
                  {{ cliente.estado }}
                </span>
              </td>
              <td class="pe-3 text-end">
                <button class="btn btn-sm btn-outline-coralon fw-semibold" type="button" @click="abrirModalEditar(cliente)">
                  Editar
                </button>
              </td>
            </tr>
            <tr v-if="listaClientes.length === 0">
              <td colspan="6" class="text-center py-5 text-muted">
                No se encontraron clientes que coincidan con la búsqueda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalCliente
      :mostrar="mostrarModal"
      :cliente-a-editar="clienteParaEditar"
      :cuils-existentes="cuilsExistentes"
      :guardando="guardando"
      @cerrar="cerrarModal"
      @guardar="guardarCliente"
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

.badge-rubro {
  background-color: #332d2a;
  color: #c9881e;
  font-weight: 500;
  padding: 0.4em 0.6em;
}

</style>