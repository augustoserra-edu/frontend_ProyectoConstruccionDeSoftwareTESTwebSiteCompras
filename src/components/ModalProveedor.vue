<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  busquedaProducto.value = ''
  errorValidacion.value = ''
}, { immediate: true })

function cerrarModal() {
  if (!props.guardando) emit('cerrar')
}

function guardarProveedor() {
  if (props.guardando) return
  errorValidacion.value = ''
  if (!formulario.value.nombre.trim() || !formulario.value.apellido.trim()) {
    errorValidacion.value = 'Completá nombre y apellido o denominación.'
    return
  }
  if (!formulario.value.productos.length) {
    errorValidacion.value = 'Seleccioná al menos un producto.'
    return
  }
  emit('guardar', {
    ...formulario.value,
    nombre: formulario.value.nombre.trim(), apellido: formulario.value.apellido.trim(),
    productos: [...new Set(formulario.value.productos)]
  })
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
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div class="modal-content shadow border-0 overflow-hidden">
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
          <form @submit.prevent="guardarProveedor">
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
                  <input
                    v-model="formulario.nombre" maxlength="150"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Ej: Loma Negra"
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Apellido / Denominación *</label>
                  <input
                    v-model="formulario.apellido" maxlength="150"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Ej: S.A."
                    required
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">CUIT *</label>
                  <input
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
                  <input
                    v-model="formulario.email" maxlength="150"
                    type="email"
                    class="form-control custom-input"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Teléfono</label>
                  <input
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
                  <input
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
                    <input id="buscar-producto-proveedor" v-model="busquedaProducto" type="search" class="form-control mb-2" @keydown.enter.prevent />
                    <p class="small text-muted" role="status">{{ formulario.productos.length }} producto(s) seleccionado(s). Seleccioná al menos uno.</p>
                    <div class="border rounded p-3" style="max-height: 220px; overflow-y: auto">
                      <div v-for="producto in productosFiltrados" :key="producto.id" class="form-check mb-2">
                        <input :id="`proveedor-producto-${producto.id}`" v-model="formulario.productos" :value="producto.id" type="checkbox" class="form-check-input" />
                        <label :for="`proveedor-producto-${producto.id}`" class="form-check-label">{{ producto.nombre }} — {{ producto.codigo }} (#{{ producto.id }})</label>
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
