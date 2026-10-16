<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Producto } from '../types/producto'
import {
  obtenerProveedores,
  type ProveedorAPI
} from '../services/comprasService'
import { mensajeErrorApi } from '../utils/erroresApi'

const props = defineProps<{
  mostrar: boolean
  producto: Producto | null
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'confirmar', datos: {
    producto_id: number
    proveedor_id: number
    cantidad: number
    precio_unitario: number
    observacion: string
  }): void
}>()

const proveedores = ref<ProveedorAPI[]>([])
const cargandoProveedores = ref(false)
const proveedorSeleccionadoId = ref<number | ''>('')
const cantidad = ref<number>(1)
const observacion = ref<string>('')
const errorValidacion = ref<string>('')

// Al abrir el modal, consulta proveedores y filtra por el producto actual
watch(() => props.mostrar, async (abierto) => {
  if (abierto && props.producto) {
    cantidad.value = 1
    observacion.value = 'Reposición de stock vía orden de compra'
    errorValidacion.value = ''
    proveedorSeleccionadoId.value = ''

    cargandoProveedores.value = true
    try {
      const lista = await obtenerProveedores()
      const prodId = props.producto.id ?? props.producto.producto_id
      
      // Filtra proveedores que suministran este producto
      proveedores.value = lista.filter(prov => 
        Array.isArray(prov.productos) && prov.productos.includes(prodId)
      )

      // Si existe un único proveedor asignado, se autoselecciona
      if (proveedores.value.length === 1) {
        proveedorSeleccionadoId.value = proveedores.value[0].proveedor_id
      }
    } catch (error) {
      errorValidacion.value = mensajeErrorApi(error)
      proveedores.value = []
    } finally {
      cargandoProveedores.value = false
    }
  }
})

const stockFinal = computed(() => {
  if (!props.producto) return 0
  const cant = Number(cantidad.value) || 0
  return props.producto.stockactual + cant
})

function cerrar() {
  errorValidacion.value = ''
  emit('cerrar')
}

function guardar() {
  if (!props.producto) return

  if (!cantidad.value || cantidad.value <= 0 || !Number.isInteger(Number(cantidad.value))) {
    errorValidacion.value = 'Ingrese una cantidad entera mayor a 0.'
    return
  }

  if (!proveedorSeleccionadoId.value) {
    errorValidacion.value = 'Debe seleccionar un proveedor para emitir la orden de compra.'
    return
  }

  const prodId = props.producto.id ?? props.producto.producto_id
  const precioUnitario = typeof props.producto.precio === 'string'
    ? parseFloat(props.producto.precio)
    : (props.producto.precio ?? props.producto.preciounitario ?? 0)

  emit('confirmar', {
    producto_id: prodId,
    proveedor_id: Number(proveedorSeleccionadoId.value),
    cantidad: Number(cantidad.value),
    precio_unitario: precioUnitario,
    observacion: observacion.value.trim()
  })

  cerrar()
}
</script>

<template>
  <div v-if="mostrar && producto">
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content shadow border-0 overflow-hidden">
          
          <div class="modal-header encabezado-custom text-white px-4 py-3">
            <div>
              <h5 class="modal-title fw-bold mb-0">Generar Orden de Reposición</h5>
              <p class="small text-white-50 mb-0">Solicitud de compra a proveedor</p>
            </div>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" @click="cerrar"></button>
          </div>

          <div class="modal-body p-4 bg-white">
            <div v-if="errorValidacion" class="alert alert-danger small py-2 mb-3" role="alert">
              {{ errorValidacion }}
            </div>

            <div class="card bg-light border-0 mb-3">
              <div class="card-body p-3">
                <span class="badge bg-dark mb-1 font-monospace">Código #{{ producto.codigo || (producto.id ?? producto.producto_id) }}</span>
                <h6 class="fw-bold mb-1 text-dark">{{ producto.nombre }}</h6>
                <div class="d-flex justify-content-between text-muted small mt-2">
                  <span>Stock Actual: <strong>{{ producto.stockactual }}</strong> un.</span>
                  <span>Mínimo reposición: <strong>{{ producto.stockminreposicion }}</strong> un.</span>
                </div>
              </div>
            </div>

            <form @submit.prevent="guardar">
              <!-- Selector de Proveedor -->
              <div class="mb-3">
                <label for="proveedorSelect" class="form-label small fw-bold text-dark">
                  Proveedor asignado <span class="text-danger">*</span>
                </label>
                <div v-if="cargandoProveedores" class="small text-muted py-1">
                  Buscando proveedores disponibles...
                </div>
                <select
                  v-else
                  id="proveedorSelect"
                  v-model="proveedorSeleccionadoId"
                  class="form-select"
                  required
                >
                  <option value="" disabled>Seleccione un proveedor...</option>
                  <option
                    v-for="prov in proveedores"
                    :key="prov.proveedor_id"
                    :value="prov.proveedor_id"
                  >
                    {{ prov.nombre }} {{ prov.apellido }} (CUIT: {{ prov.cuit }})
                  </option>
                </select>
                <div v-if="!cargandoProveedores && proveedores.length === 0" class="text-danger small mt-1">
                  No se encontraron proveedores que suministren este producto.
                </div>
              </div>

              <!-- Cantidad a ingresar -->
              <div class="mb-3">
                <label for="cantidadReponer" class="form-label small fw-bold text-dark">
                  Cantidad a solicitar <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <input
                    id="cantidadReponer"
                    v-model.number="cantidad"
                    type="number"
                    min="1"
                    step="1"
                    class="form-control"
                    placeholder="Ej: 50"
                    required
                  />
                  <span class="input-group-text bg-white text-muted">unidades</span>
                </div>
              </div>

              <div class="p-2 mb-3 rounded border border-warning-subtle bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                <span class="small fw-semibold text-dark">Stock proyectado al recibir:</span>
                <span class="badge bg-success fs-6">{{ stockFinal }} un.</span>
              </div>

              <div class="mb-3">
                <label for="obsReponer" class="form-label small fw-bold text-dark">
                  Observación / Motivo
                </label>
                <input
                  id="obsReponer"
                  v-model="observacion"
                  type="text"
                  class="form-control"
                  placeholder="Ej: Reposición programada por stock bajo"
                />
              </div>

              <div class="modal-footer bg-light px-0 pb-0 pt-3 border-top mt-4">
                <button type="button" class="btn btn-secondary px-3" @click="cerrar">Cancelar</button>
                <button 
                  type="submit" 
                  class="btn btn-coralon px-4 fw-semibold"
                  :disabled="cargandoProveedores || proveedores.length === 0"
                >
                  Generar Orden de Compra
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

.encabezado-custom {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14;
}

.btn-coralon {
  background-color: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
  transition: all 0.2s ease-in-out;
}

.btn-coralon:hover:not(:disabled) {
  background-color: #ff7a45;
  border-color: #ff7a45;
  color: #ffffff;
}
</style>