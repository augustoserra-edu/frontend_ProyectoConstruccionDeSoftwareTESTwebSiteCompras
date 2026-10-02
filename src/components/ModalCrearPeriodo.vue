<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PeriodoApi } from '../types/finanzasApi'

const props = defineProps<{
  mostrar: boolean
  periodosExistentes: PeriodoApi[]
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'crear', datos: { anio: number; mes: number }): void
}>()

const meses = [
  { id: 1, nombre: 'Enero' },
  { id: 2, nombre: 'Febrero' },
  { id: 3, nombre: 'Marzo' },
  { id: 4, nombre: 'Abril' },
  { id: 5, nombre: 'Mayo' },
  { id: 6, nombre: 'Junio' },
  { id: 7, nombre: 'Julio' },
  { id: 8, nombre: 'Agosto' },
  { id: 9, nombre: 'Septiembre' },
  { id: 10, nombre: 'Octubre' },
  { id: 11, nombre: 'Noviembre' },
  { id: 12, nombre: 'Diciembre' }
]

const hoy = new Date()
const anioSeleccionado = ref<number>(hoy.getFullYear())
const mesSeleccionado = ref<number>(hoy.getMonth() + 1)
const errorValidacion = ref<string>('')

// Validación protegida contra tipos no-array
const esPeriodoDuplicado = computed(() => {
  if (!Array.isArray(props.periodosExistentes)) return false

  return props.periodosExistentes.some(
    p => p.anio === Number(anioSeleccionado.value) && p.mes === Number(mesSeleccionado.value)
  )
})

function cerrar() {
  errorValidacion.value = ''
  emit('cerrar')
}

function guardar() {
  if (!anioSeleccionado.value || anioSeleccionado.value < 2000 || anioSeleccionado.value > 2100) {
    errorValidacion.value = 'Por favor ingrese un año válido.'
    return
  }

  if (esPeriodoDuplicado.value) {
    errorValidacion.value = 'El período seleccionado ya existe. No se pueden duplicar períodos.'
    return
  }

  emit('crear', {
    anio: Number(anioSeleccionado.value),
    mes: Number(mesSeleccionado.value)
  })

  cerrar()
}
</script>

<template>
  <div v-if="mostrar">
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow border-0 overflow-hidden">
          
          <!-- Encabezado con estilo del proyecto -->
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <h5 class="modal-title fw-bold mb-0">Crear Período Contable</h5>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" @click="cerrar"></button>
          </div>

          <!-- Formulario -->
          <div class="modal-body p-4 bg-white">
            <div v-if="errorValidacion || esPeriodoDuplicado" class="alert alert-danger small mb-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="me-1 mb-1" viewBox="0 0 16 16">
                <path d="M7.938 2.016a.13.13 0 0 1 .125 0l6.857 11.856c.026.045.026.102 0 .147A.13.13 0 0 1 14.8 14.1H1.2a.13.13 0 0 1-.12-.081.13.13 0 0 1 0-.147l6.858-11.856zM8 4c-.535 0-.954.462-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4m.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/>
              </svg>
              {{ errorValidacion || 'Ya existe un período registrado para este mes y año.' }}
            </div>

            <form @submit.prevent="guardar">
              <div class="mb-3">
                <label for="mesSelect" class="form-label small fw-bold text-dark">Mes</label>
                <select id="mesSelect" v-model="mesSeleccionado" class="form-select" required>
                  <option v-for="mes in meses" :key="mes.id" :value="mes.id">
                    {{ mes.nombre }}
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="anioInput" class="form-label small fw-bold text-dark">Año</label>
                <input
                  id="anioInput"
                  v-model.number="anioSeleccionado"
                  type="number"
                  min="2000"
                  max="2100"
                  class="form-control"
                  required
                />
              </div>

              <div class="modal-footer bg-light px-0 pb-0 pt-3 border-top mt-4">
                <button type="button" class="btn btn-secondary px-3" @click="cerrar">Cancelar</button>
                <button 
                  type="submit" 
                  class="btn btn-coralon px-4 fw-semibold"
                  :disabled="esPeriodoDuplicado"
                >
                  Guardar Período
                </button>
              </div>
            </form>
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
.modal-header-custom {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14;
}
.btn-coralon {
  background-color: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
}
.btn-coralon:hover:not(:disabled) {
  background-color: #ff7a45;
  border-color: #ff7a45;
}
</style>