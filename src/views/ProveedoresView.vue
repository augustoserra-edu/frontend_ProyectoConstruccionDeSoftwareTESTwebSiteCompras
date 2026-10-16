<script setup lang="ts">
import { vTextoLimpio } from '../directives/textoLimpio'
import { ref, computed, onMounted } from 'vue'
import type { Proveedor, NuevoProveedor } from '../types/proveedor'
import { obtenerProveedores, crearProveedor, actualizarProveedor, relacionMultipleDisponible } from '../services/proveedoresService'
import type { ProductoProveedor } from '../services/productosService'
import { obtenerCatalogoProductosProveedor } from '../services/proveedoresService'
import { mensajeErrorApi } from '../utils/erroresApi'
import ModalProveedor from '../components/ModalProveedor.vue'

const listaProveedores = ref<Proveedor[]>([])
const productos = ref<ProductoProveedor[]>([])
const cargando = ref(false)
const guardando = ref(false)
const mensajeError = ref('')
const errorGuardado = ref('')
const mensajeExito = ref('')
const filtroBusqueda = ref('')
const mostrarModal = ref(false)
const proveedorParaEditar = ref<Proveedor | null>(null)
const nombreProducto = (id: number) => productos.value.find(p => p.id === id)?.nombre ?? `Producto #${id}`
type CampoOrden = 'proveedor_id' | 'nombre' | 'apellido' | 'productos' | 'email' | 'direccion'
const campoOrden = ref<CampoOrden>('proveedor_id')
const sentidoOrden = ref<'asc' | 'desc'>('desc')
const compararTexto = (a: string, b: string) => a.localeCompare(b, 'es-AR', { sensitivity: 'base', numeric: true })
function ordenarPor(campo: CampoOrden) {
  sentidoOrden.value = campoOrden.value === campo && sentidoOrden.value === 'asc' ? 'desc' : 'asc'
  campoOrden.value = campo
}
const indicadorOrden = (campo: CampoOrden) => campoOrden.value === campo ? (sentidoOrden.value === 'asc' ? '↑' : '↓') : '↕'
const ariaOrden = (campo: CampoOrden) => campoOrden.value !== campo ? 'none' : sentidoOrden.value === 'asc' ? 'ascending' : 'descending'
const etiquetaOrden = (campo: CampoOrden, nombre: string) => `Ordenar por ${nombre} ${campoOrden.value === campo && sentidoOrden.value === 'asc' ? 'descendente' : 'ascendente'}`
function textoOrden(proveedor: Proveedor, campo: Exclude<CampoOrden, 'proveedor_id'>) {
  // Comparar el catálogo por nombre, independientemente del orden de asociación.
  return campo === 'productos'
    ? proveedor.productos.map(nombreProducto).sort(compararTexto).join(', ')
    : proveedor[campo] ?? ''
}

async function cargarProveedores() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const [proveedores, catalogo] = await Promise.all([obtenerProveedores(), obtenerCatalogoProductosProveedor()])
    listaProveedores.value = proveedores
    productos.value = catalogo
  } catch (error) {
    mensajeError.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error))
  } finally {
    cargando.value = false
  }
}

const proveedoresFiltrados = computed(() => {
  const busqueda = filtroBusqueda.value.toLowerCase().trim()
  return listaProveedores.value.filter(p =>
    [p.nombre, p.apellido, p.cuit, p.email, ...p.productos.map(nombreProducto)]
      .some(valor => valor.toLowerCase().includes(busqueda))
  ).sort((a, b) => {
    const campo = campoOrden.value
    const comparacion = campo === 'proveedor_id'
      ? a.proveedor_id - b.proveedor_id
      : compararTexto(textoOrden(a, campo), textoOrden(b, campo))
    return (comparacion || a.proveedor_id - b.proveedor_id) * (sentidoOrden.value === 'asc' ? 1 : -1)
  })
})

async function abrirModalCrear() {
  if (cargando.value || guardando.value) return
  await cargarProveedores()
  if (mensajeError.value || !relacionMultipleDisponible.value) return
  proveedorParaEditar.value = null
  errorGuardado.value = ''
  mostrarModal.value = true
}

function abrirModalEditar(proveedor: Proveedor) {
  if (cargando.value || guardando.value || !relacionMultipleDisponible.value) return
  proveedorParaEditar.value = { ...proveedor, productos: [...proveedor.productos] }
  errorGuardado.value = ''
  mostrarModal.value = true
}

function cerrarModal() {
  if (guardando.value) return
  mostrarModal.value = false
  proveedorParaEditar.value = null
}

async function guardarProveedor(datos: NuevoProveedor) {
  if (guardando.value) return
  const cuit = datos.cuit.replace(/[-\s]/g, '')
  if (listaProveedores.value.some(proveedor => proveedor.proveedor_id !== proveedorParaEditar.value?.proveedor_id && proveedor.cuit.replace(/[-\s]/g, '') === cuit)) {
    errorGuardado.value = 'Ya existe un proveedor con ese CUIT.'
    return
  }
  guardando.value = true
  errorGuardado.value = ''
  mensajeExito.value = ''
  try {
    const id = proveedorParaEditar.value?.proveedor_id
    const guardado = id ? await actualizarProveedor(id, datos) : await crearProveedor(datos)
    if (id) {
      const index = listaProveedores.value.findIndex(p => p.proveedor_id === id)
      if (index !== -1) listaProveedores.value[index] = guardado
    } else {
      listaProveedores.value.unshift(guardado)
    }
    mensajeExito.value = id ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.'
    mostrarModal.value = false
    proveedorParaEditar.value = null
  } catch (error) {
    errorGuardado.value = (error instanceof Error && !('isAxiosError' in error) ? error.message : mensajeErrorApi(error))
  } finally {
    guardando.value = false
  }
}

onMounted(cargarProveedores)
</script>

<template>
  <div class="container-fluid py-2">
    <!-- Header y Acciones -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">Gestión de Proveedores</h3>
        <p class="text-muted small mb-0">Alta, consulta y edición de proveedores del corralón</p>
      </div>

      <div class="d-flex flex-wrap gap-2">


        <button 
          class="btn btn-coralon d-flex align-items-center gap-2 px-3 fw-semibold"
          :disabled="cargando || !!mensajeError || !relacionMultipleDisponible" @click="abrirModalCrear"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
          </svg>
          <span>Nuevo Proveedor</span>
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="!relacionMultipleDisponible" class="alert alert-warning" role="alert">
      El servidor todavía usa un solo producto por proveedor. Podés consultar los registros existentes; para crear o editar con varios productos es necesario actualizar el backend.
    </div>
    <div v-if="mensajeExito" class="alert alert-success py-2 small mb-3" role="status">
      {{ mensajeExito }}
    </div>
    <div v-if="mensajeError" class="alert alert-danger py-2 small mb-3" role="alert">
      {{ mensajeError }} <button type="button" class="btn btn-sm btn-outline-danger ms-2" :disabled="cargando" @click="cargarProveedores">Reintentar</button>
    </div>

    <!-- Buscador -->
    <div class="card shadow-sm border-0 mb-4 search-card">
      <div class="card-body p-3">
        <div class="row">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0 text-muted pe-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                </svg>
              </span>
              <input maxlength="150" v-texto-limpio
                v-model="filtroBusqueda"
                type="text"
                class="form-control border-start-0 custom-search ps-2"
                placeholder="Buscar por Nombre, CUIT, Email o Producto..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="d-lg-none" aria-label="Proveedores" :aria-busy="cargando">
      <div class="row g-2 mb-3">
        <div class="col-7">
          <label for="proveedor-mobile-campo" class="form-label small">Ordenar por</label>
          <select id="proveedor-mobile-campo" v-model="campoOrden" class="form-select">
            <option value="proveedor_id">ID</option><option value="nombre">Nombre</option><option value="apellido">Apellido</option>
            <option value="productos">Productos</option><option value="email">Email</option><option value="direccion">Dirección</option>
          </select>
        </div>
        <div class="col-5">
          <label for="proveedor-mobile-sentido" class="form-label small">Sentido</label>
          <select id="proveedor-mobile-sentido" v-model="sentidoOrden" class="form-select">
            <option value="asc">Ascendente</option><option value="desc">Descendente</option>
          </select>
        </div>
      </div>
      <ul class="list-unstyled d-grid gap-3 mb-0">
        <li v-for="proveedor in proveedoresFiltrados" :key="proveedor.proveedor_id">
          <button type="button" class="proveedor-tarjeta card shadow-sm p-3 w-100 text-start"
            :disabled="cargando || guardando || !relacionMultipleDisponible" @click="abrirModalEditar(proveedor)">
            <span class="d-flex flex-wrap justify-content-between align-items-center gap-2 w-100 mb-2">
              <span class="small text-muted">ID: {{ proveedor.proveedor_id }}</span>
              <span class="badge badge-cuit font-monospace">CUIT: {{ proveedor.cuit }}</span>
            </span>
            <span class="fw-bold text-break">{{ proveedor.nombre }}</span>
            <span v-if="proveedor.apellido" class="text-break">{{ proveedor.apellido }}</span>
            <span class="d-block border-top pt-2 mt-3 w-100">
              <span class="small text-muted d-block mb-1">Productos suministrados</span>
              <span v-for="id in proveedor.productos" :key="id" class="d-block small text-break">#{{ id }} — {{ nombreProducto(id) }}</span>
              <span v-if="!proveedor.productos.length" class="small text-muted">Sin productos asociados</span>
            </span>
            <span class="d-block border-top pt-2 mt-3 w-100 small">
              <span class="d-block text-break"><span class="text-muted">Teléfono:</span> {{ proveedor.telefono || 'Sin teléfono' }}</span>
              <span class="d-block text-break mt-1"><span class="text-muted">Email:</span> {{ proveedor.email || 'Sin email' }}</span>
              <span class="d-block text-break mt-1"><span class="text-muted">Dirección:</span> {{ proveedor.direccion || 'Sin dirección' }}</span>
            </span>
            <span class="indicacion-seleccion small fw-semibold mt-3">Tocá para editar</span>
          </button>
        </li>
      </ul>
      <p v-if="cargando" class="text-center py-4 text-muted" role="status">Cargando proveedores…</p>
      <p v-else-if="!mensajeError && !proveedoresFiltrados.length" class="text-center py-4 text-muted">No se encontraron proveedores que coincidan con la búsqueda.</p>
    </section>

    <!-- Tabla -->
    <div class="card shadow-sm border-0 overflow-hidden d-none d-lg-block">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-dark-custom">
            <tr>
              <th scope="col" class="ps-3 py-3" :aria-sort="ariaOrden('proveedor_id')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('proveedor_id', 'ID')" @click="ordenarPor('proveedor_id')">ID <span aria-hidden="true">{{ indicadorOrden('proveedor_id') }}</span></button></th>
              <th scope="col" class="py-3" :aria-sort="ariaOrden('nombre')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('nombre', 'nombre')" @click="ordenarPor('nombre')">Nombre / Razón Social <span aria-hidden="true">{{ indicadorOrden('nombre') }}</span></button></th>
              <th scope="col" class="py-3" :aria-sort="ariaOrden('apellido')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('apellido', 'apellido')" @click="ordenarPor('apellido')">Apellido / Denominación <span aria-hidden="true">{{ indicadorOrden('apellido') }}</span></button></th>
              <th scope="col" class="py-3">CUIT</th>
              <th scope="col" class="py-3" :aria-sort="ariaOrden('productos')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('productos', 'productos suministrados')" @click="ordenarPor('productos')">Productos Suministrados <span aria-hidden="true">{{ indicadorOrden('productos') }}</span></button></th>
              <th scope="col" class="py-3">Teléfono</th>
              <th scope="col" class="py-3" :aria-sort="ariaOrden('email')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('email', 'email')" @click="ordenarPor('email')">Email <span aria-hidden="true">{{ indicadorOrden('email') }}</span></button></th>
              <th scope="col" class="py-3 pe-3" :aria-sort="ariaOrden('direccion')"><button type="button" class="ordenar-columna" :aria-label="etiquetaOrden('direccion', 'dirección')" @click="ordenarPor('direccion')">Dirección <span aria-hidden="true">{{ indicadorOrden('direccion') }}</span></button></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="proveedor in proveedoresFiltrados"
              :key="proveedor.proveedor_id"
              style="cursor: pointer;"
              @click="abrirModalEditar(proveedor)"
            >
              <td class="ps-3 fw-bold"><button type="button" class="btn p-0 fw-bold text-reset text-decoration-none" :disabled="cargando || guardando || !relacionMultipleDisponible" :aria-label="`Editar proveedor ${proveedor.nombre} ${proveedor.apellido}`" @click.stop="abrirModalEditar(proveedor)">{{ proveedor.proveedor_id }}</button></td>
              <td class="fw-semibold">{{ proveedor.nombre }}</td>
              <td>{{ proveedor.apellido }}</td>
              <td><span class="badge badge-cuit font-monospace">{{ proveedor.cuit }}</span></td>
              <td>
                <span v-for="id in proveedor.productos" :key="id" class="badge me-1 mb-1 bg-secondary-subtle text-dark border border-secondary-subtle px-2 py-1">
                  #{{ id }} - {{ nombreProducto(id) }}
                </span>
              </td>
              <td>{{ proveedor.telefono }}</td>
              <td>{{ proveedor.email }}</td>
              <td class="pe-3 text-secondary">{{ proveedor.direccion }}</td>
            </tr>
            <tr v-if="cargando">
              <td colspan="8" class="text-center py-4 text-muted">
                <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                Cargando proveedores...
              </td>
            </tr>
            <tr v-else-if="proveedoresFiltrados.length === 0">
              <td colspan="8" class="text-center py-5 text-muted">
                No se encontraron proveedores que coincidan con la búsqueda.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ModalProveedor
      :mostrar="mostrarModal"
      :proveedor-a-editar="proveedorParaEditar" :productos="productos" :guardando="guardando" :error="errorGuardado"
      @cerrar="cerrarModal"
      @guardar="guardarProveedor"
    />
  </div>
</template>

<style scoped>
.proveedor-tarjeta { border: 1px solid #e4dfdc; color: inherit; font: inherit; }
.proveedor-tarjeta:hover:not(:disabled) { border-color: #b33e14; background-color: #fff8f4; }
.proveedor-tarjeta:focus-visible { outline: 2px solid #b33e14; outline-offset: 3px; }
.proveedor-tarjeta:disabled { opacity: 0.65; }
.indicacion-seleccion { color: #b33e14; }

.ordenar-columna {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.ordenar-columna:hover { color: #ffb38f; }
.ordenar-columna:focus-visible { outline: 2px solid #ffb38f; outline-offset: 3px; }

.btn-coralon {
  background-color: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
  transition: all 0.2s ease-in-out;
}

.btn-coralon:hover {
  background-color: #ff7a45;
  border-color: #ff7a45;
  color: #ffffff;
}

.btn-outline-coralon {
  border: 1px solid #b33e14;
  color: #b33e14;
  background-color: transparent;
  transition: all 0.2s ease-in-out;
}

.btn-outline-coralon:hover:not(:disabled) {
  background-color: #b33e14;
  color: #ffffff;
}

.btn-outline-coralon:disabled {
  border-color: #d1cfcc;
  color: #a8a5a0;
}

.custom-search:focus {
  border-color: #dee2e6;
  box-shadow: none;
}

.table-dark-custom {
  background-color: #231f1d;
  color: #f5f5f5;
  border-bottom: 2px solid #b33e14;
}

.table-dark-custom th {
  background-color: #231f1d;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.88rem;
  letter-spacing: 0.3px;
}

.badge-cuit {
  background-color: #332d2a;
  color: #c9881e;
  font-weight: 500;
  padding: 0.4em 0.6em;
}


</style>
