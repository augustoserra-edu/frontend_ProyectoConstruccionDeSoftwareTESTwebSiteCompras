<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RubroAPI, NuevoRubro } from '../types/rubro'

interface Props {
  mostrar: boolean
  rubroAEditar: RubroAPI | null
  error?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', rubro: NuevoRubro): void
}>()

const formulario = ref<NuevoRubro>({ nombre: '', descripcion: '' })

watch(
  () => [props.mostrar, props.rubroAEditar] as const,
  () => {
    formulario.value = props.rubroAEditar
      ? { nombre: props.rubroAEditar.nombre, descripcion: props.rubroAEditar.descripcion }
      : { nombre: '', descripcion: '' }
  },
  { immediate: true }
)

function guardarRubro() {
  emit('guardar', { ...formulario.value })
}
</script>

<template>
  <div v-if="mostrar">
    <div class="modal-backdrop fade show"></div>

    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow border-0 overflow-hidden">
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <h5 class="modal-title fw-bold">
              {{ rubroAEditar ? 'Editar Rubro' : 'Nuevo Rubro' }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Cerrar"
              @click="emit('cerrar')"
            ></button>
          </div>

          <form @submit.prevent="guardarRubro">
            <div class="modal-body p-4 bg-white">
              <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

              <div class="mb-3">
                <label class="form-label fw-semibold text-dark">Nombre *</label>
                <input
                  v-model="formulario.nombre"
                  type="text"
                  maxlength="100"
                  class="form-control custom-input"
                  placeholder="Ej: Áridos y Cementos"
                  required
                />
              </div>

              <div>
                <label class="form-label fw-semibold text-dark">Descripción</label>
                <input
                  v-model="formulario.descripcion"
                  type="text"
                  maxlength="200"
                  class="form-control custom-input"
                  placeholder="Detalle opcional del rubro"
                />
              </div>
            </div>

            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button type="button" class="btn btn-secondary px-4" @click="emit('cerrar')">
                Cancelar
              </button>
              <button type="submit" class="btn btn-coralon px-4 fw-semibold">
                {{ rubroAEditar ? 'Guardar Cambios' : 'Crear Rubro' }}
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
