<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MovimientoInventario, Producto } from '../types/producto'

interface Props {
  mostrar: boolean
  producto: Producto | null
  movimientos: MovimientoInventario[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'cerrar'): void }>()

const expandido = ref(false)
const LIMITE_INICIAL = 3

const movimientosVisibles = computed(() => {
  if (expandido.value) {
    return props.movimientos
  }
  return props.movimientos.slice(0, LIMITE_INICIAL)
})

function cerrar() {
  expandido.value = false
  emit('cerrar')
}
</script>

<template>
  <div v-if="mostrar">
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow border-0 overflow-hidden">
          
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <div>
              <h5 class="modal-title fw-bold mb-0">Movimientos de Stock</h5>
              <small class="text-white-50">{{ producto?.nombre }} (Stock Actual: {{ producto?.stockactual }} un.)</small>
            </div>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" @click="cerrar"></button>
          </div>

          <div class="modal-body p-4 bg-white">
            <div v-if="movimientos.length === 0" class="text-center py-4 text-muted">
              No hay movimientos registrados para este producto.
            </div>

            <div v-else class="table-responsive">
              <table class="table table-hover align-middle mb-3">
                <thead class="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="mov in movimientosVisibles" :key="mov.movimientoinventario_id">
                    <td class="small">{{ mov.fecha }}</td>
                    <td>
                      <span 
                        class="badge" 
                        :class="{
                          'bg-success': mov.tipo === 'Ingreso',
                          'bg-danger': mov.tipo === 'Egreso',
                          'bg-warning text-dark': mov.tipo === 'Ajuste'
                        }"
                      >
                        {{ mov.tipo }}
                      </span>
                    </td>
                    <td class="fw-semibold">
                      {{ mov.tipo === 'Ingreso' ? `+${mov.cantidad}` : (mov.tipo === 'Egreso' ? `-${mov.cantidad}` : mov.cantidad) }} un.
                    </td>
                    <td class="text-secondary small">{{ mov.observacion }}</td>
                  </tr>
                </tbody>
              </table>

              <div v-if="movimientos.length > LIMITE_INICIAL" class="text-center mt-3">
                <button 
                  type="button"
                  class="btn btn-sm btn-outline-secondary px-3"
                  @click="expandido = !expandido"
                >
                  {{ expandido ? '▲ Ver menos' : `▼ Ver más (${movimientos.length - LIMITE_INICIAL} anteriores)` }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-light px-4 py-2 border-top">
            <button type="button" class="btn btn-secondary px-4" @click="cerrar">Cerrar</button>
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
</style>