<script setup lang="ts">
import type { FacturaApi } from '../types/finanzasApi'
import { formatoFecha, formatoMoneda } from '../utils/formatoFinanzas'

interface Props {
  mostrar: boolean
  factura: FacturaApi | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

function cerrar() {
  emit('cerrar')
}
</script>

<template>
  <div v-if="mostrar && factura">
    <div class="modal-backdrop fade show"></div>

    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content shadow border-0 overflow-hidden">
          
          <!-- Header -->
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-warning text-dark fw-bold">{{ factura.tipo === 'VENTA' ? 'Factura de Venta' : 'Factura de Compra' }}</span>
              <h5 class="modal-title fw-bold mb-0">Comprobante {{ factura.numero }}</h5>
            </div>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" @click="cerrar"></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-4 bg-white">
            <!-- Datos de Cabecera -->
            <div class="row g-3 mb-4 p-3 bg-light rounded border">
              <div class="col-md-4">
                <span class="text-muted small d-block">Fecha de Emisión</span>
                <strong class="text-dark">{{ formatoFecha(factura.fecha) }}</strong>
              </div>
              <div class="col-md-4">
                <span class="text-muted small d-block">Origen / Vínculo</span>
                <strong class="text-dark">
                  {{ factura.orden_venta_id ? `Orden Venta #${factura.orden_venta_id}` : factura.orden_compra_id ? `Orden Compra #${factura.orden_compra_id}` : 'Sin orden asociada' }}
                </strong>
              </div>
              <div class="col-md-4">
                <span class="text-muted small d-block">Asiento Diario N°</span>
                <strong class="text-dark">#{{ factura.diario || 'S/N' }}</strong>
              </div>
            </div>

            <!-- Tabla de Detalles -->
            <h6 class="fw-bold text-dark mb-3">Detalle de Ítems / Productos</h6>
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
                  <tr v-for="item in factura.detalles" :key="item.id">
                    <td class="ps-3 fw-semibold">Producto #{{ item.producto_id }}</td>
                    <td class="text-center">{{ item.cantidad }}</td>
                    <td class="text-end">{{ formatoMoneda(item.precio_unitario) }}</td>
                    <td class="pe-3 text-end fw-bold text-dark">{{ formatoMoneda(item.subtotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totales -->
            <div class="row justify-content-end">
              <div class="col-md-5">
                <div class="d-flex justify-content-between py-1 border-bottom">
                  <span class="text-muted">Subtotal Neto:</span>
                  <span class="fw-semibold">{{ formatoMoneda(factura.subtotal) }}</span>
                </div>
                <div class="d-flex justify-content-between py-1 border-bottom">
                  <span class="text-muted">IVA / Impuestos:</span>
                  <span class="fw-semibold">{{ formatoMoneda(factura.impuestos) }}</span>
                </div>
                <div class="d-flex justify-content-between py-2 fs-5">
                  <strong class="text-dark">Total:</strong>
                  <strong class="text-coralon">{{ formatoMoneda(factura.total) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer bg-light px-4 py-3 border-top">
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

.text-coralon {
  color: #b33e14;
}
</style>