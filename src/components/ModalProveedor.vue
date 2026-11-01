<script setup lang="ts">
import { vTextoLimpio } from '../directives/textoLimpio'
import { computed, ref, watch } from 'vue'
import { filtrarContactoProveedor, type CampoContactoProveedor, importeValido, normalizarProveedor, validarCamposProveedor } from '../utils/validacionesCompras'
import type { Proveedor, NuevoProveedor } from '../types/proveedor'
import type { ProductoProveedor } from '../services/productosService'

interface Props {
  mostrar: boolean
  proveedorAEditar: Proveedor | null
  productos: ProductoProveedor[]
  guardando: boolean
  error: string
  erroresCampos?: Record<string, string>
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'limpiar-error', campo: string): void
  (e: 'guardar', proveedor: NuevoProveedor): void
}>()
const formularioVacio = (): NuevoProveedor => ({
  nombre: '', apellido: '', cuit: '', email: '', telefono: '', direccion: '', productos: []
})
const formulario = ref<NuevoProveedor>(formularioVacio())
const preciosCompra = ref<Record<number, number | string | null>>({})
const productosNoDisponibles = computed(() => formulario.value.productos.filter(id => !props.productos.some(p => p.id === id)))
const busquedaProducto = ref('')
const erroresLocales = ref<Record<string, string>>({})
const errores = computed(() => ({ ...props.erroresCampos, ...erroresLocales.value }))
function limpiarError(evento: Event) {
  const campo = (evento.target as HTMLElement).dataset.campoError
  if (!campo) return
  delete erroresLocales.value[campo]
  emit('limpiar-error', campo)
}
const productosFiltrados = computed(() => {
  const busqueda = busquedaProducto.value.toLowerCase().trim()
  return props.productos.filter(p => `${p.nombre} ${p.codigo} ${p.id}`.toLowerCase().includes(busqueda))
})

watch(() => [props.mostrar, props.proveedorAEditar] as const, ([mostrar, proveedor]) => {
  if (!mostrar) return
  formulario.value = proveedor ? {
    nombre: proveedor.nombre, apellido: proveedor.apellido, cuit: filtrarContactoProveedor(proveedor.cuit, 'cuit'),
    email: proveedor.email, telefono: proveedor.telefono, direccion: proveedor.direccion,
    productos: [...proveedor.productos]
  } : formularioVacio()
  preciosCompra.value = { ...proveedor?.preciosCompra }
  busquedaProducto.value = ''
  erroresLocales.value = {}
}, { immediate: true })

function cerrarModal() {
  if (!props.guardando) emit('cerrar')
}

function filtrarContacto(evento: Event, tipo: CampoContactoProveedor) {
  if ((evento as InputEvent).isComposing) return
  const campo = evento.target as HTMLInputElement
  const original = campo.value
  const cursor = campo.selectionStart
  campo.value = filtrarContactoProveedor(original, tipo)
  if (cursor !== null && campo.value !== original) {
    const prefijo = filtrarContactoProveedor(original.slice(0, cursor), tipo)
    // Al borrar un separador, dejar el cursor antes de él para poder seguir borrando.
    const retroceso = tipo === 'cuit' && (evento as InputEvent).inputType === 'deleteContentBackward' && prefijo.endsWith('-')
    const posicion = prefijo.length - (retroceso ? 1 : 0)
    campo.setSelectionRange(posicion, posicion)
  }
}

function guardarProveedor() {
  if (props.guardando) return
  const datos = normalizarProveedor(formulario.value)
  erroresLocales.value = validarCamposProveedor(datos, props.productos.map(p => p.id))
  for (const id of datos.productos) {
    const precio = preciosCompra.value[id]
    if (precio == null || String(precio).trim() === '' || !importeValido(Number(precio))) {
      erroresLocales.value['precio.' + id] = 'Ingresá un precio de compra válido entre $0 y $9.999.999.999,99, con hasta dos decimales.'
    }
  }
  if (Object.keys(erroresLocales.value).length) return
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
        <form novalidate @input="limpiarError" @change="limpiarError" class="modal-content shadow border-0 overflow-hidden" @submit.prevent="guardarProveedor">
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
              <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
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
                    :data-campo-error="'nombre'" :class="{ 'is-invalid': errores['nombre'] }" :aria-invalid="!!errores['nombre']" :aria-describedby="'error-proveedor-nombre'" v-model="formulario.nombre" maxlength="150"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Ej: Loma Negra"
                    required
                  />
                  <p v-if="errores['nombre']" :id="'error-proveedor-nombre'" class="invalid-feedback d-block mb-0" role="alert">{{ errores['nombre'] }}</p>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Apellido / Denominación *</label>
                  <input v-texto-limpio
                    :data-campo-error="'apellido'" :class="{ 'is-invalid': errores['apellido'] }" :aria-invalid="!!errores['apellido']" :aria-describedby="'error-proveedor-apellido'" v-model="formulario.apellido" maxlength="150"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Ej: S.A."
                    required
                  />
                  <p v-if="errores['apellido']" :id="'error-proveedor-apellido'" class="invalid-feedback d-block mb-0" role="alert">{{ errores['apellido'] }}</p>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">CUIT *</label>
                  <input @input.capture="filtrarContacto($event, 'cuit')"
                    :data-campo-error="'cuit'" :class="{ 'is-invalid': errores['cuit'] }" :aria-invalid="!!errores['cuit']" aria-describedby="error-proveedor-cuit proveedor-cuit-ayuda" v-model="formulario.cuit"
                    type="text"
                    maxlength="13"
                    class="form-control custom-input"
                    placeholder="30-00000000-0"
                    required
                  />
                  <p v-if="errores['cuit']" :id="'error-proveedor-cuit'" class="invalid-feedback d-block mb-0" role="alert">{{ errores['cuit'] }}</p>
                  <small id="proveedor-cuit-ayuda" class="text-muted">Ingrese el CUIT sin guiones.</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Email</label>
                  <input @input.capture="filtrarContacto($event, 'email')"
                    :data-campo-error="'email'" :class="{ 'is-invalid': errores['email'] }" :aria-invalid="!!errores['email']" :aria-describedby="'error-proveedor-email'" v-model="formulario.email" maxlength="150"
                    type="email"
                    class="form-control custom-input"
                    placeholder="contacto@empresa.com"
                  />
                  <p v-if="errores['email']" :id="'error-proveedor-email'" class="invalid-feedback d-block mb-0" role="alert">{{ errores['email'] }}</p>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Teléfono</label>
                  <input @input.capture="filtrarContacto($event, 'telefono')"
                    :data-campo-error="'telefono'" :class="{ 'is-invalid': errores['telefono'] }" :aria-invalid="!!errores['telefono']" aria-describedby="error-proveedor-telefono proveedor-telefono-ayuda" v-model="formulario.telefono"
                    type="tel"
                    maxlength="14"
                    class="form-control custom-input"
                    placeholder="+541112345678"
                  />
                  <p v-if="errores['telefono']" :id="'error-proveedor-telefono'" class="invalid-feedback d-block mb-0" role="alert">{{ errores['telefono'] }}</p>
                  <small id="proveedor-telefono-ayuda" class="text-muted">Solo números y un signo + opcional al inicio. Máximo 14 caracteres, incluido el +.</small>
                </div>

                <div class="col-md-6">
                  <label class="form-label fw-semibold text-dark">Dirección</label>
                  <input v-texto-limpio
                    :data-campo-error="'direccion'" :class="{ 'is-invalid': errores['direccion'] }" :aria-invalid="!!errores['direccion']" :aria-describedby="'error-proveedor-direccion'" v-model="formulario.direccion" maxlength="200"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Calle 123, Localidad"
                  />
                  <p v-if="errores['direccion']" :id="'error-proveedor-direccion'" class="invalid-feedback d-block mb-0" role="alert">{{ errores['direccion'] }}</p>
                </div>

                <div class="col-md-12">
                  <fieldset>
                    <legend class="titulo-productos fs-6 fw-semibold d-flex align-items-center gap-2">
                      Productos suministrados *
                      <span class="ayuda-productos">
                        <button type="button" class="ayuda-productos-boton" aria-label="Ayuda sobre productos suministrados" aria-describedby="tooltip-productos-proveedor">?</button>
                        <span id="tooltip-productos-proveedor" role="tooltip" class="ayuda-productos-tooltip">Busque los productos para asociar al proveedor y seleccione los productos que desee, luego introduzca un Precio de Compra de cada producto seleccionado</span>
                      </span>
                    </legend>
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
                        <input :id="`proveedor-producto-${producto.id}`" data-campo-error="productos" :aria-invalid="!!errores.productos" aria-describedby="error-proveedor-productos" v-model="formulario.productos" :value="producto.id" type="checkbox" class="form-check-input" />
                        <label :for="`proveedor-producto-${producto.id}`" class="form-check-label">{{ producto.nombre }} — COD: {{ producto.codigo || 'Sin código' }} · ID: {{ producto.id }}</label>
                        <div v-if="formulario.productos.includes(producto.id)" class="mt-2 mb-3">
                          <label :for="`proveedor-precio-${producto.id}`" class="form-label small">Precio de compra ($)</label>
                          <input :id="`proveedor-precio-${producto.id}`" :data-campo-error="'precio.' + producto.id" :class="{ 'is-invalid': errores['precio.' + producto.id] }" :aria-invalid="!!errores['precio.' + producto.id]" :aria-describedby="'error-precio-' + producto.id" v-model="preciosCompra[producto.id]" type="number" min="0" max="9999999999.99" step="0.01" required class="form-control" /><p v-if="errores['precio.' + producto.id]" :id="'error-precio-' + producto.id" class="invalid-feedback d-block mb-0" role="alert">{{ errores['precio.' + producto.id] }}</p>
                        </div>
                      </div>
                      <p v-if="!productos.length" class="text-muted mb-0">No hay productos disponibles. Registrá productos en el catálogo antes de crear un proveedor.</p>
                      <p v-else-if="!productosFiltrados.length" class="text-muted mb-0">No se encontraron productos para esa búsqueda.</p>
                    </div>
                    <p v-if="errores['productos']" :id="'error-proveedor-productos'" class="invalid-feedback d-block mb-0" role="alert">{{ errores['productos'] }}</p>
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
              <button type="submit" class="btn btn-coralon px-4 fw-semibold" :disabled="guardando">
                {{ guardando ? 'Guardando…' : proveedorAEditar ? 'Guardar Cambios' : 'Crear Proveedor' }}
              </button>
            </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.titulo-productos { position: relative; min-width: 0; }
.ayuda-productos { display: inline-flex; flex-shrink: 0; }
.ayuda-productos-boton {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.5rem; height: 1.5rem; padding: 0; border: 2px solid #231f1d;
  border-radius: 50%; background: white; color: #231f1d; font-size: 1rem; font-weight: 800;
  cursor: help;
}
.ayuda-productos-boton:focus-visible { outline: 2px solid #b33e14; outline-offset: 2px; }
.ayuda-productos-tooltip {
  position: absolute; top: 100%; left: 0; z-index: 5;
  width: min(24rem, 100%); box-sizing: border-box; padding: 0.75rem 1rem;
  white-space: normal; overflow-wrap: anywhere; text-align: left;
  box-shadow: 0 4px 12px rgb(0 0 0 / 20%);
  border-radius: 0.375rem; background: #231f1d; color: white;
  font-size: 0.875rem; font-weight: 400; line-height: 1.5;
  visibility: hidden; opacity: 0;
}
.ayuda-productos:hover .ayuda-productos-tooltip,
.ayuda-productos:focus-within .ayuda-productos-tooltip { visibility: visible; opacity: 1; }

@media (max-width: 575.98px) {
  .titulo-productos { width: 100%; flex-wrap: wrap; }
  .ayuda-productos { display: contents; }
  .ayuda-productos-boton { flex-shrink: 0; }
  .ayuda-productos-tooltip {
    position: static; width: 100%; flex-basis: 100%; display: none;
  }
  .ayuda-productos:hover .ayuda-productos-tooltip,
  .ayuda-productos:focus-within .ayuda-productos-tooltip { display: block; }
}

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
