<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Producto, NuevoProducto } from '../types/producto'
import { obtenerRubros } from '../services/rubrosService'
import { RUBROS_MOCK, type Rubro } from '../types/rubro'

interface Props {
  mostrar: boolean
  productoAEditar: Producto | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', producto: NuevoProducto & { producto_id?: number; stockactual?: number; activo?: boolean }): void
}>()

const listaRubros = ref<Rubro[]>([...RUBROS_MOCK])

const formulario = ref<{
  producto_id?: number
  nombre: string
  descripcion: string
  preciounitario: number
  rubro_id: number
  stockminreposicion: number
  stockactual?: number
  activo?: boolean
}>({
  nombre: '',
  descripcion: '',
  preciounitario: 0,
  rubro_id: 101,
  stockminreposicion: 0
})

onMounted(async () => {
  const rubrosCargados = await obtenerRubros()
  if (rubrosCargados && rubrosCargados.length > 0) {
    listaRubros.value = rubrosCargados
  }
})

watch(
  () => props.productoAEditar,
  (nuevoValor) => {
    if (nuevoValor) {
      formulario.value = {
        producto_id: nuevoValor.producto_id,
        nombre: nuevoValor.nombre,
        descripcion: nuevoValor.descripcion,
        preciounitario: nuevoValor.preciounitario,
        rubro_id: nuevoValor.rubro_id,
        stockminreposicion: nuevoValor.stockminreposicion,
        stockactual: nuevoValor.stockactual,
        activo: nuevoValor.activo
      }
    } else {
      formulario.value = {
        nombre: '',
        descripcion: '',
        preciounitario: 0,
        rubro_id: listaRubros.value[0]?.rubro_id || 101,
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

                <!-- Rubro (Desplegable con nombres en vez de input numérico) -->
                <div class="col-md-5">
                  <label class="form-label fw-semibold text-dark">Rubro *</label>
                  <select
                    v-model.number="formulario.rubro_id"
                    class="form-select custom-input"
                    required
                  >
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
                    rows="2"
                    placeholder="Detalles y especificaciones del material..."
                    required
                  ></textarea>
                </div>

                <!-- Precio Unitario -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Precio Unitario ($) *</label>
                  <input
                    v-model.number="formulario.preciounitario"
                    type="number"
                    step="0.01"
                    min="0"
                    class="form-control custom-input"
                    placeholder="0.00"
                    required
                  />
                </div>

                <!-- Stock Mínimo Reposición (Stock Actual fue removido correctamente) -->
                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Stock Mín. Reposición *</label>
                  <input
                    v-model.number="formulario.stockminreposicion"
                    type="number"
                    min="0"
                    class="form-control custom-input"
                    placeholder="0"
                    required
                  />
                </div>

              </div>
            </div>

            <!-- Footer con Acciones -->
            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button
                type="button"
                class="btn btn-secondary px-4"
                @click="cerrarModal"
              >
                Cancelar
              </button>
              <button type="submit" class="btn btn-coralon px-4 fw-semibold">
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