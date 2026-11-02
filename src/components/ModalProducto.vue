<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Producto, NuevoProducto } from '../types/producto'
import { obtenerRubros } from '../services/rubrosService'
import type { Rubro } from '../types/rubro'

interface Props {
  mostrar: boolean
  productoAEditar: Producto | null
  guardando?: boolean
  error?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', producto: NuevoProducto & { producto_id?: number; stockactual?: number; activo?: boolean }): void
}>()

const listaRubros = ref<Rubro[]>([])

const formulario = ref<{
  producto_id?: number
  nombre: string
  descripcion: string
  rubro_id: number
  stockminreposicion: number
  stockactual?: number
  activo?: boolean
}>({
  nombre: '',
  descripcion: '',
  rubro_id: 0,
  stockminreposicion: 0
})

async function cargarRubros() {
  try {
    const rubrosCargados = await obtenerRubros()
    listaRubros.value = rubrosCargados
    if (!props.productoAEditar && rubrosCargados.length > 0 && !formulario.value.rubro_id) {
      formulario.value.rubro_id = rubrosCargados[0].rubro_id
    }
  } catch {
    listaRubros.value = []
  }
}

onMounted(() => {
  cargarRubros()
})

watch(
  () => props.mostrar,
  (abierto) => {
    if (abierto && listaRubros.value.length === 0) {
      cargarRubros()
    }
  }
)

watch(
  () => props.productoAEditar,
  (nuevoValor) => {
    if (nuevoValor) {
      formulario.value = {
        producto_id: nuevoValor.producto_id,
        nombre: nuevoValor.nombre,
        descripcion: nuevoValor.descripcion,
        rubro_id: nuevoValor.rubro_id,
        stockminreposicion: nuevoValor.stockminreposicion,
        stockactual: nuevoValor.stockactual,
        activo: nuevoValor.activo
      }
    } else {
      formulario.value = {
        nombre: '',
        descripcion: '',
        rubro_id: listaRubros.value[0]?.rubro_id || 0,
        stockminreposicion: 0
      }
    }
  },
  { immediate: true }
)

function cerrarModal() {
  emit('cerrar')
}

function guardarProducto() {
  emit('guardar', { ...formulario.value })
}
</script>

<template>
  <div v-if="mostrar">
    <div class="modal-backdrop fade show"></div>

    <div
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow border-0 overflow-hidden">
          
          <!-- Encabezado Institucional -->
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <h5 class="modal-title fw-bold">
              {{ productoAEditar ? 'Editar Producto' : 'Nuevo Producto' }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Cerrar"
              @click="cerrarModal"
            ></button>
          </div>

          <!-- Formulario -->
          <form @submit.prevent="guardarProducto">
            <div class="modal-body p-4 bg-white">
              <div class="row g-3">
                
                <!-- ID bloqueado en edición -->
                <div v-if="productoAEditar" class="col-md-12">
                  <label class="form-label fw-semibold text-dark">ID Producto</label>
                  <input
                    type="text"
                    class="form-control bg-light"
                    :value="formulario.producto_id"
                    disabled
                  />
                </div>

                <!-- Nombre -->
                <div class="col-md-7">
                  <label class="form-label fw-semibold text-dark">Nombre del Producto *</label>
                  <input
                    v-model="formulario.nombre"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Ej: Cemento Portland 50kg"
                    required
                  />
                </div>

                <!-- Rubro -->
                <div class="col-md-5">
                  <label class="form-label fw-semibold text-dark">Rubro *</label>
                  <select
                    v-model.number="formulario.rubro_id"
                    class="form-select custom-input"
                    required
                  >
                    <option v-if="listaRubros.length === 0" :value="0" disabled>
                      Sin rubros disponibles
                    </option>
                    <option v-for="rubro in listaRubros" :key="rubro.rubro_id" :value="rubro.rubro_id">
                      {{ rubro.nombre }}
                    </option>
                  </select>
                </div>

                <!-- Descripción -->
                <div class="col-md-12">
                  <label class="form-label fw-semibold text-dark">Descripción *</label>
                  <textarea
                    v-model="formulario.descripcion"
                    class="form-control custom-input"
                    rows="3"
                    placeholder="Detalles y especificaciones del material..."
                    required
                  ></textarea>
                </div>

                <!-- Stock Mínimo Reposición -->
                <div class="col-md-12">
                  <label class="form-label fw-semibold text-dark">Stock Mín. Reposición *</label>
                  <input
                    v-model.number="formulario.stockminreposicion"
                    type="number"
                    min="0"
                    class="form-control custom-input"
                    placeholder="0"
                    required
                  />
                  <div class="form-text text-muted">
                    El precio se administra directamente en base a las listas de cada proveedor asociado.
                  </div>
                </div>

              </div>
            </div>

            <!-- Footer con Acciones -->
            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button
                type="button"
                class="btn btn-secondary px-4"
                :disabled="props.guardando"
                @click="cerrarModal"
              >
                Cancelar
              </button>
              <button type="submit" class="btn btn-coralon px-4 fw-semibold" :disabled="props.guardando">
                <span v-if="props.guardando" class="spinner-border spinner-border-sm me-2" role="status"></span>
                {{ productoAEditar ? 'Guardar Cambios' : 'Crear Producto' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  opacity: 0.6;
}

.modal-header-custom {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14;
}

.custom-input:focus {
  border-color: #b33e14;
  box-shadow: 0 0 0 0.25rem rgba(179, 62, 20, 0.2);
}

.btn-coralon {
  background-color: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
  transition: background-color 0.2s, border-color 0.2s;
}

.btn-coralon:hover {
  background-color: #ff7a45;
  border-color: #ff7a45;
  color: #ffffff;
}
</style>
