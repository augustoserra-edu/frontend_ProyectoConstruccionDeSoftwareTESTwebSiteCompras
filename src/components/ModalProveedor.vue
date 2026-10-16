<script setup lang="ts">
import { vTextoLimpio } from '../directives/textoLimpio'
import { computed, ref, watch } from 'vue'
import { importeValido, normalizarProveedor, validarProveedor } from '../utils/validacionesCompras'
import type { Proveedor, NuevoProveedor } from '../types/proveedor'
import type { ProductoProveedor } from '../services/productosService'

interface Props {
  mostrar: boolean
  proveedorAEditar: Proveedor | null
  productos: ProductoProveedor[]
  guardando: boolean
  error: string
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar', proveedor: NuevoProveedor): void
}>()
const formularioVacio = (): NuevoProveedor => ({
  nombre: '', apellido: '', cuit: '', email: '', telefono: '', direccion: '', productos: []
})
const formulario = ref<NuevoProveedor>(formularioVacio())
const preciosCompra = ref<Record<number, number | string | null>>({})
const productosNoDisponibles = computed(() => formulario.value.productos.filter(id => !props.productos.some(p => p.id === id)))
const busquedaProducto = ref('')
const errorValidacion = ref('')
const productosFiltrados = computed(() => {
  const busqueda = busquedaProducto.value.toLowerCase().trim()
  return props.productos.filter(p => `${p.nombre} ${p.codigo} ${p.id}`.toLowerCase().includes(busqueda))
})

watch(() => [props.mostrar, props.proveedorAEditar] as const, ([mostrar, proveedor]) => {
  if (!mostrar) return
  formulario.value = proveedor ? {
    nombre: proveedor.nombre, apellido: proveedor.apellido, cuit: proveedor.cuit,
    email: proveedor.email, telefono: proveedor.telefono, direccion: proveedor.direccion,
    productos: [...proveedor.productos]
  } : formularioVacio()
  preciosCompra.value = { ...proveedor?.preciosCompra }
  busquedaProducto.value = ''
  errorValidacion.value = ''
}, { immediate: true })

function cerrarModal() {
  if (!props.guardando) emit('cerrar')
}

function quitarEspacios(evento: Event) {
  if ((evento as InputEvent).isComposing) return
  const campo = evento.target as HTMLInputElement
  const original = campo.value
  const cursor = campo.selectionStart
  campo.value = original.replace(/[\s\u200B-\u200D\uFEFF]/g, '')
  if (cursor !== null && campo.value !== original) {
    const posicion = original.slice(0, cursor).replace(/[\s\u200B-\u200D\uFEFF]/g, '').length
    campo.setSelectionRange(posicion, posicion)
  }
}

function guardarProveedor() {
  if (props.guardando) return
  const datos = normalizarProveedor(formulario.value)
  errorValidacion.value = validarProveedor(datos, props.productos.map(p => p.id))
  if (errorValidacion.value) return
  if (datos.productos.some(id => preciosCompra.value[id] == null || String(preciosCompra.value[id]).trim() === '' || !importeValido(Number(preciosCompra.value[id])))) {
    errorValidacion.value = 'Ingresá un precio de compra válido para cada producto seleccionado.'
    return
  }
  datos.preciosCompra = Object.fromEntries(datos.productos.map(id => [id, Number(preciosCompra.value[id])]))
  formulario.value = datos
  emit('guardar', datos)
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
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg modal-fullscreen-lg-down">
        <form class="modal-content shadow border-0 overflow-hidden" @submit.prevent="guardarProveedor">
          <!-- Cabecera institucional -->
          <div class="modal-header modal-header-custom text-white px-4 py-3">
            <h5 class="modal-title fw-bold">
              {{ proveedorAEditar ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              aria-label="Cerrar"
              :disabled="guardando" @click="cerrarModal"
            ></button>
          </div>

          <!-- Formulario -->

            <div class="modal-body p-4 bg-white">
              <div v-if="error || errorValidacion" class="alert alert-danger" role="alert">{{ error || errorValidacion }}</div>
              <fieldset :disabled="guardando">
              <div class="row g-3">
                <div v-if="proveedorAEditar" class="col-md-12">
                  <label class="form-label fw-semibold text-dark">ID Proveedor</label>
                  <input
                    type="text"
                    class="form-control bg-light"
                    :value="proveedorAEditar?.proveedor_id"
                    disabled
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Nombre / Razón Social *</label>
                  <input v-texto-limpio
                    v-model="formulario.nombre" maxlength="150"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Ej: Loma Negra"
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Apellido / Denominación *</label>
                  <input v-texto-limpio
                    v-model="formulario.apellido" maxlength="150"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Ej: S.A."
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">CUIT *</label>
                  <input @input.capture="quitarEspacios"
                    v-model="formulario.cuit"
                    type="text"
                    maxlength="13"
                    aria-describedby="proveedor-cuit-ayuda"
                    class="form-control custom-input"
                    placeholder="30-00000000-0"
                    required
                  />
                  <small id="proveedor-cuit-ayuda" class="text-muted">Máximo 13 caracteres: 11 dígitos y guiones opcionales.</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Email</label>
                  <input @input.capture="quitarEspacios"
                    v-model="formulario.email" maxlength="150"
                    type="email"
                    class="form-control custom-input"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Teléfono</label>
                  <input @input.capture="quitarEspacios"
                    v-model="formulario.telefono"
                    type="tel"
                    maxlength="50"
                    aria-describedby="proveedor-telefono-ayuda"
                    class="form-control custom-input"
                    placeholder="011-1234-5678"
                  />
                  <small id="proveedor-telefono-ayuda" class="text-muted">Máximo 50 caracteres.</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Dirección</label>
                  <input v-texto-limpio
                    v-model="formulario.direccion" maxlength="200"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Calle 123, Localidad"
                  />
                </div>

                <div class="col-md-12">
                  <fieldset>
                    <legend class="fs-6 fw-semibold">Productos suministrados *</legend>
                    <label for="buscar-producto-proveedor" class="form-label small">Buscar por nombre, código o ID</label>
                    <input maxlength="150" v-texto-limpio id="buscar-producto-proveedor" v-model="busquedaProducto" type="search" class="form-control mb-2" @keydown.enter.prevent />
                    <p class="small text-muted" role="status">{{ formulario.productos.length }} producto(s) seleccionado(s). Seleccioná al menos uno.</p>
                    <div v-if="productosNoDisponibles.length" class="alert alert-warning">
                      <p>Estos productos asignados no están disponibles en el catálogo actual:</p>
                      <div v-for="id in productosNoDisponibles" :key="id" class="d-flex align-items-center gap-2 mb-1">
                        <span>Producto #{{ id }}</span><button type="button" class="btn btn-sm btn-outline-danger" @click="formulario.productos = formulario.productos.filter(productoId => productoId !== id)">Quitar de la selección</button>
                      </div>
                    </div>
                    <div class="border rounded p-3" style="max-height: 220px; overflow-y: auto">
                      <div v-for="producto in productosFiltrados" :key="producto.id" class="form-check mb-2">
                        <input :id="`proveedor-producto-${producto.id}`" v-model="formulario.productos" :value="producto.id" type="checkbox" class="form-check-input" />
                        <label :for="`proveedor-producto-${producto.id}`" class="form-check-label">{{ producto.nombre }} — COD: {{ producto.codigo || 'Sin código' }} · ID: {{ producto.id }}</label>
                        <div v-if="formulario.productos.includes(producto.id)" class="mt-2 mb-3">
                          <label :for="`proveedor-precio-${producto.id}`" class="form-label small">Precio de compra ($)</label>
                          <input :id="`proveedor-precio-${producto.id}`" v-model="preciosCompra[producto.id]" type="number" min="0" max="9999999999.99" step="0.01" required class="form-control" />
                        </div>
                      </div>
                      <p v-if="!productos.length" class="text-muted mb-0">No hay productos disponibles. Registrá productos en el catálogo antes de crear un proveedor.</p>
                      <p v-else-if="!productosFiltrados.length" class="text-muted mb-0">No se encontraron productos para esa búsqueda.</p>
                    </div>
                  </fieldset>
                </div>
              </div>
              </fieldset>
            </div>

            <!-- Footer con botones institucionales -->
            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button
                type="button"
                class="btn btn-secondary px-4"
                :disabled="guardando" @click="cerrarModal"
              >
                Cancelar
              </button>
              <button type="submit" class="btn btn-coralon px-4 fw-semibold" :disabled="guardando || !formulario.productos.length">
                {{ guardando ? 'Guardando…' : proveedorAEditar ? 'Guardar Cambios' : 'Crear Proveedor' }}
              </button>
            </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-body { min-height: 0; overscroll-behavior: contain; }
.modal-header, .modal-footer { flex-shrink: 0; }
@media (max-width: 991.98px) {
  .modal-dialog { height: 100vh; height: 100dvh; }
  .modal-header, .modal-body, .modal-footer { padding-left: 1rem !important; padding-right: 1rem !important; }
  .modal-footer { padding-bottom: max(1rem, env(safe-area-inset-bottom)) !important; }
  .modal-footer .btn { flex: 1 1 auto; min-height: 44px; }
}

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
