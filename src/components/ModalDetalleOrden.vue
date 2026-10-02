<script setup lang="ts">
import type { OrdenComercial } from '../types/finanzas'
import { formatoFecha } from '../utils/formatoFinanzas'

interface Props {
  mostrar: boolean
  orden: OrdenComercial | null
  permitirVolverAPendiente?: boolean
  actualizandoEstado?: boolean
  errorEstado?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'volver-a-pendiente'): void
}>()

function cerrar() {
  if (props.actualizandoEstado) return
  emit('cerrar')
}
</script>

<template>
  <div v-if="mostrar && orden">
    <div class="modal-backdrop fade show"></div>

    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow border-0 overflow-hidden">
          
          <!-- Header -->
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge" :class="orden.tipo_orden === 'Compra' ? 'bg-info text-dark' : 'bg-primary'">
                Orden de {{ orden.tipo_orden }}
              </span>
              <h5 class="modal-title fw-bold mb-0">Orden #{{ orden.orden_id }}</h5>
            </div>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" :disabled="actualizandoEstado" @click="cerrar"></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-4 bg-white">
            <div v-if="errorEstado" class="alert alert-danger" role="alert">{{ errorEstado }}</div>
            <div class="row g-3 mb-4 p-3 bg-light rounded border">
              <div class="col-md-4">
                <span class="text-muted small d-block">Fecha</span>
                <strong class="text-dark">{{ formatoFecha(orden.fecha) }}</strong>
              </div>
              <div class="col-md-5">
                <span class="text-muted small d-block">{{ orden.tipo_orden === 'Compra' ? 'Proveedor' : 'Cliente' }}</span>
                <strong class="text-dark">{{ orden.entidad_nombre }}</strong>
              </div>
              <div class="col-md-3">
                <span class="text-muted small d-block">Estado</span>
                <span class="badge" :class="orden.estado_nombre === 'Aprobada' ? 'bg-success' : 'bg-warning text-dark'">{{ orden.estado_nombre }}</span>
              </div>
            </div>

            <!-- Tabla de Ítems -->
            <h6 class="fw-bold text-dark mb-3">Ítems de la Orden</h6>
            <div class="table-responsive border rounded mb-3">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th scope="col" class="ps-3 py-2">Producto</th>
                    <th scope="col" class="py-2 text-center">Cant.</th>
                    <th scope="col" class="py-2 text-end">Precio Unit.</th>
                    <th scope="col" class="pe-3 py-2 text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in orden.detalles" :key="item.detalle_id">
                    <td class="ps-3 fw-semibold">{{ item.producto_nombre }}</td>
                    <td class="text-center">{{ item.cantidad }}</td>
                    <td class="text-end">${{ item.preciounitario.toLocaleString('es-AR') }}</td>
                    <td class="pe-3 text-end fw-bold text-dark">${{ item.subtotal.toLocaleString('es-AR') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Total General -->
            <div class="text-end">
              <span class="text-muted me-2">Monto Total de Orden:</span>
              <span class="fs-5 fw-bold text-coralon">${{ orden.total.toLocaleString('es-AR') }}</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer bg-light px-4 py-3 border-top">
            <button
              v-if="permitirVolverAPendiente && orden.tipo_orden === 'Compra' && orden.estado_nombre === 'Aprobada'"
              type="button"
              class="btn btn-outline-coralon px-3 fw-semibold"
              :disabled="actualizandoEstado"
              @click="emit('volver-a-pendiente')"
            >
              {{ actualizandoEstado ? 'Actualizando…' : 'Volver a pendiente' }}
            </button>
            <button type="button" class="btn btn-secondary px-4" :disabled="actualizandoEstado" @click="cerrar">Cerrar</button>
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

.text-coralon {
  color: #b33e14;
}

.btn-outline-coralon {
  border-color: #b33e14;
  color: #b33e14;
}

.btn-outline-coralon:hover:not(:disabled) {
  background-color: #b33e14;
  color: #ffffff;
}
</style>
