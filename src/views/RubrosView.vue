<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { RubroAPI, NuevoRubro } from '../types/rubro'
import {
  listarRubros,
  crearRubro,
  actualizarRubro,
  eliminarRubro,
  mensajeDeError
} from '../services/rubrosService'
import ModalRubro from '../components/ModalRubro.vue'
import { alerta } from '../utils/alertas'

const listaRubros = ref<RubroAPI[]>([])
const cargando = ref(false)
const filtroBusqueda = ref('')
const rubroSeleccionado = ref<RubroAPI | null>(null)

const mostrarModal = ref(false)
const rubroParaEditar = ref<RubroAPI | null>(null)
const errorModal = ref('')

const rubrosFiltrados = computed(() => {
  const busqueda = filtroBusqueda.value.toLowerCase().trim()
  if (!busqueda) return listaRubros.value

  return listaRubros.value.filter((r) =>
    r.nombre.toLowerCase().includes(busqueda) ||
    r.descripcion.toLowerCase().includes(busqueda)
  )
})

async function cargarRubros() {
  cargando.value = true
  try {
    listaRubros.value = await listarRubros()
  } catch (error) {
    alerta.error('No se pudieron cargar los rubros', mensajeDeError(error, 'Intentá nuevamente en unos instantes.'))
  } finally {
    cargando.value = false
  }
}

onMounted(cargarRubros)

function seleccionarFila(rubro: RubroAPI) {
  rubroSeleccionado.value = rubroSeleccionado.value?.id === rubro.id ? null : rubro
}

function abrirModalCrear() {
  rubroParaEditar.value = null
  errorModal.value = ''
  mostrarModal.value = true
}

function abrirModalEditar() {
  if (!rubroSeleccionado.value) return
  rubroParaEditar.value = { ...rubroSeleccionado.value }
  errorModal.value = ''
  mostrarModal.value = true
}

function cerrarModal() {
  mostrarModal.value = false
  rubroParaEditar.value = null
  errorModal.value = ''
}

async function guardarRubro(datos: NuevoRubro) {
  errorModal.value = ''
  try {
    if (rubroParaEditar.value) {
      const actualizado = await actualizarRubro(rubroParaEditar.value.id, datos)
      const index = listaRubros.value.findIndex((r) => r.id === actualizado.id)
      if (index !== -1) listaRubros.value[index] = actualizado
      rubroSeleccionado.value = actualizado
      alerta.exito('Rubro actualizado', 'El rubro se actualizó correctamente.')
    } else {
      await crearRubro(datos)
      await cargarRubros()
      alerta.exito('Rubro creado', 'El rubro se creó correctamente.')
    }
    cerrarModal()
  } catch (error) {
    errorModal.value = mensajeDeError(error, 'No se pudo guardar el rubro.')
  }
}

async function eliminarSeleccionado() {
  const rubro = rubroSeleccionado.value
  if (!rubro) return
  const confirmado = await alerta.confirmar(
    'Eliminar rubro',
    `¿Eliminar el rubro "${rubro.nombre}"?`,
    'Eliminar'
  )
  if (!confirmado) return

  try {
    await eliminarRubro(rubro.id)
    listaRubros.value = listaRubros.value.filter((r) => r.id !== rubro.id)
    rubroSeleccionado.value = null
    alerta.exito('Rubro eliminado', 'El rubro se eliminó correctamente.')
  } catch (error) {
    alerta.error(
      'No se pudo eliminar el rubro',
      mensajeDeError(error, 'Verificá que el rubro no tenga productos asociados.')
    )
  }
}
</script>

<template>
  <div class="container-fluid py-2">
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">Rubros</h3>
        <p class="text-muted small mb-0">Alta, baja y modificación de rubros del catálogo</p>
      </div>

      <div class="d-flex gap-2">
        <button
          class="btn btn-outline-danger fw-semibold px-3"
          :disabled="!rubroSeleccionado"
          @click="eliminarSeleccionado"
        >
          Eliminar
        </button>
        <button
          class="btn btn-outline-coralon fw-semibold px-3"
          :disabled="!rubroSeleccionado"
          @click="abrirModalEditar"
        >
          Editar Seleccionado
        </button>
        <button class="btn btn-coralon fw-semibold px-3" @click="abrirModalCrear">
          Nuevo Rubro
        </button>
      </div>
    </div>

    <div class="card shadow-sm border-0 mb-4">
      <div class="card-body p-3">
        <div class="row">
          <div class="col-md-6">
            <input
              v-model="filtroBusqueda"
              type="text"
              class="form-control custom-search"
              placeholder="Buscar por Nombre o Descripción..."
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark-custom">
            <tr>
              <th scope="col" class="ps-3 py-3">ID</th>
              <th scope="col" class="py-3">Nombre</th>
              <th scope="col" class="py-3 pe-3">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="rubro in rubrosFiltrados"
              :key="rubro.id"
              :class="{ 'fila-seleccionada': rubroSeleccionado?.id === rubro.id }"
              style="cursor: pointer;"
              @click="seleccionarFila(rubro)"
            >
              <td class="ps-3 fw-bold">{{ rubro.id }}</td>
              <td class="fw-semibold">{{ rubro.nombre }}</td>
              <td class="text-secondary small pe-3">{{ rubro.descripcion }}</td>
            </tr>
            <tr v-if="cargando">
              <td colspan="3" class="text-center py-5 text-muted">Cargando rubros...</td>
            </tr>
            <tr v-else-if="rubrosFiltrados.length === 0">
              <td colspan="3" class="text-center py-5 text-muted">
                No se encontraron rubros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalRubro
      :mostrar="mostrarModal"
      :rubro-a-editar="rubroParaEditar"
      :error="errorModal"
      @cerrar="cerrarModal"
      @guardar="guardarRubro"
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
  border-color: #b33e14;
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

.fila-seleccionada,
.fila-seleccionada td {
  background-color: #fff1eb !important;
}

.fila-seleccionada {
  border-left: 4px solid #b33e14;
}
</style>
