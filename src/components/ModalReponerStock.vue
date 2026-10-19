<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Producto } from '../types/producto'
import { obtenerProveedores } from '../services/proveedoresService'
import type { Proveedor } from '../types/proveedor'

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

const proveedores = ref<Proveedor[]>([])
const cargandoProveedores = ref(false)
const proveedorSeleccionadoId = ref<number | ''>('')
const cantidad = ref<number>(1)
const observacion = ref<string>('')
const errorValidacion = ref<string>('')

const prodId = computed(() => {
  if (!props.producto) return 0
  return Number(props.producto.id ?? props.producto.producto_id)
})

watch(() => props.mostrar, async (abierto) => {
  if (abierto && props.producto) {
    cantidad.value = 1
    observacion.value = 'Reposición de stock vía orden de compra'
    errorValidacion.value = ''
    proveedorSeleccionadoId.value = ''

    cargandoProveedores.value = true
    try {
      const lista = await obtenerProveedores()
      const targetId = prodId.value
      
      proveedores.value = lista.filter(prov => 
        Array.isArray(prov.productos) && prov.productos.includes(targetId)
      )

      if (proveedores.value.length === 1) {
        proveedorSeleccionadoId.value = proveedores.value[0].proveedor_id
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error)
      proveedores.value = []
    } finally {
      cargandoProveedores.value = false
    }
  }
})

const proveedorActual = computed(() => {
  if (!proveedorSeleccionadoId.value) return null
  return proveedores.value.find(p => p.proveedor_id === Number(proveedorSeleccionadoId.value)) || null
})

// Obtiene el precio del proveedor según la tabla intermedia
const precioUnitarioProveedor = computed<number>(() => {
  if (!proveedorActual.value || !prodId.value) return 0
  const precioPactado = (proveedorActual.value as any).preciosCompra?.[prodId.value]
  if (precioPactado != null && !isNaN(Number(precioPactado))) {
    return Number(precioPactado)
  }
  // Fallback de compatibilidad con precio general del catálogo
  const fallback = typeof props.producto?.precio === 'string'
    ? parseFloat(props.producto.precio)
    : (props.producto?.precio ?? props.producto?.preciounitario ?? 0)
  return Number(fallback) || 0
})

const totalCalculado = computed(() => {
  const cant = Number(cantidad.value) || 0
  return Math.round(cant * precioUnitarioProveedor.value * 100) / 100
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

  if (precioUnitarioProveedor.value <= 0) {
    errorValidacion.value = 'El proveedor seleccionado no tiene un precio de compra configurado para este producto.'
    return
  }

  emit('confirmar', {
    producto_id: prodId.value,
    proveedor_id: Number(proveedorSeleccionadoId.value),
    cantidad: Number(cantidad.value),
    precio_unitario: precioUnitarioProveedor.value,
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
                <span class="badge bg-dark mb-1 font-monospace">Código #{{ producto.codigo || prodId }}</span>
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
                    {{ prov.nombre }} {{ prov.apellido }} 
                    <template v-if="(prov as any).preciosCompra?.[prodId]">
                      - ${{ Number((prov as any).preciosCompra[prodId]).toLocaleString('es-AR', { minimumFractionDigits: 2 }) }} / un.
                    </template>
                  </option>
                </select>
                <div v-if="!cargandoProveedores && proveedores.length === 0" class="text-danger small mt-1">
                  No se encontraron proveedores que suministren este producto.
                </div>
              </div>

              <!-- Detalle de Precio y Cantidad -->
              <div class="row g-2 mb-3">
                <div class="col-sm-6">
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
                    <span class="input-group-text bg-white text-muted">un.</span>
                  </div>
                </div>

                <div class="col-sm-6">
                  <label class="form-label small fw-bold text-dark">Precio de Compra</label>
                  <div class="form-control bg-light text-muted">
                    <span v-if="precioUnitarioProveedor > 0" class="fw-semibold text-dark">
                      ${{ precioUnitarioProveedor.toLocaleString('es-AR', { minimumFractionDigits: 2 }) }}
                    </span>
                    <span v-else class="text-muted small">Seleccione proveedor</span>
                  </div>
                </div>
              </div>

              <!-- Resumen Total Orden de Compra -->
              <div v-if="precioUnitarioProveedor > 0" class="p-3 mb-3 rounded border border-primary-subtle bg-primary bg-opacity-10 d-flex justify-content-between align-items-center">
                <div>
                  <div class="small text-muted">Total proyectado de la orden:</div>
                  <div class="h5 fw-bold text-primary mb-0">
                    ${{ totalCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 }) }}
                  </div>
                </div>
                <div class="text-end">
                  <div class="small text-muted">Stock proyectado:</div>
                  <span class="badge bg-success fs-6">{{ stockFinal }} un.</span>
                </div>
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
                  :disabled="cargandoProveedores || proveedores.length === 0 || !proveedorSeleccionadoId"
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