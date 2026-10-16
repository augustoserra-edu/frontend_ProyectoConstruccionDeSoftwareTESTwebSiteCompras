<script setup lang="ts">
import { vTextoLimpio } from '../directives/textoLimpio'
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { limpiarTexto, importeValido, fechaValida } from '../utils/validacionesCompras'
import { normalizarBusqueda } from '../utils/busqueda'
import type { OrdenCompraCabecera, OrdenCompraDetalle } from '../types/compra'
import type { FacturaCompra, EstadoCompra } from '../types/compra'
import { claseEstadoCompra, normalizarEstadoCompra, transicionPermitida, estadoCompraReconocido, etiquetaEstadoCompra, type DatosFacturaCompra } from '../services/comprasService'
import type { Proveedor } from '../types/proveedor'
import type { ProductoProveedor } from '../services/productosService'

const props = defineProps<{
  mostrar: boolean
  ordenInicialId?: number | null
  ordenes: OrdenCompraCabecera[]
  facturas: FacturaCompra[]
  proveedores: Proveedor[]
  productos: ProductoProveedor[]
  estados: EstadoCompra[]
  cargandoFacturas: boolean
  errorFacturas: string
  detalles: OrdenCompraDetalle[]
  actualizando: boolean
  error: string
  mensaje: string
}>()
const emit = defineEmits<{
  (e: 'enviar-a-finanzas', ordenId: number, datos: DatosFacturaCompra): void
  (e: 'editar', ordenId: number): void
  (e: 'cerrar'): void
  (e: 'reintentar-facturas'): void
  (e: 'cambiar-estado', ordenId: number, estado: OrdenCompraCabecera['estado']): void
}>()

const accionesEstado = [
  { estado: 'aprobada', etiqueta: 'Aprobar', clase: 'btn-outline-success' },
  { estado: 'rechazada', etiqueta: 'Rechazar', clase: 'btn-outline-danger' },
  { estado: 'recibida', etiqueta: 'Recibir', clase: 'btn-outline-primary' },
  { estado: 'contabilizado', etiqueta: 'Contabilizar', clase: 'btn-outline-success' },
  { estado: 'devuelto', etiqueta: 'Devolver', clase: 'btn-outline-danger' }
]
const accionesDisponibles = computed(() => seleccionada.value
  ? accionesEstado.filter(accion => transicionPermitida(seleccionada.value!.estado, accion.estado))
  : [])

const numeroFactura = ref('')
const fechaFactura = ref('')
const impuestosFactura = ref<number | string>(0)
const errorFactura = ref('')
function enviarFactura() {
  if (!seleccionada.value || seleccionada.value.estado !== 'recibida' || props.actualizando || props.cargandoFacturas || props.errorFacturas || facturasSeleccionadas.value.length) return
  const impuestos = Number(impuestosFactura.value)
  const numero = limpiarTexto(numeroFactura.value)
  if (!numero || numero.length > 50 || !fechaValida(fechaFactura.value) || String(impuestosFactura.value).trim() === '' || !importeValido(impuestos) || !importeValido(Math.round((seleccionada.value.total + impuestos) * 100) / 100)) {
    errorFactura.value = 'Completá número, fecha e importe de impuestos válido.'
    return
  }
  errorFactura.value = ''
  emit('enviar-a-finanzas', seleccionada.value.ordencompra_id, { numero, fecha: fechaFactura.value, impuestos })
}

const consultaMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 991.98px)') : null
const esMobile = ref(consultaMobile?.matches ?? false)
function actualizarMobile() { esMobile.value = consultaMobile?.matches ?? false }
onMounted(() => consultaMobile?.addEventListener('change', actualizarMobile))
onBeforeUnmount(() => consultaMobile?.removeEventListener('change', actualizarMobile))

const busqueda = ref('')
const filtroEstado = ref<OrdenCompraCabecera['estado'] | ''>('')
const ordenId = ref<number | null>(null)
watch(() => [props.mostrar, ordenId.value], () => {
  numeroFactura.value = ''
  const hoy = new Date()
  fechaFactura.value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  impuestosFactura.value = 0
  errorFactura.value = ''
})

const buscador = ref<HTMLInputElement | null>(null)
let focoAnterior: HTMLElement | null = null
const dialogo = ref<HTMLElement | null>(null)
const moneda = (valor: number) => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const proveedor = (id: number) => props.proveedores.find(item => item.proveedor_id === id)
const nombreProducto = (id: number) => props.productos.find(item => item.id === id)?.nombre ?? `Producto #${id}`
const facturasDeOrden = (id: number) => props.facturas.filter(item => item.ordencompra_id === id)

const ordenesFiltradas = computed(() => {
  const texto = normalizarBusqueda(busqueda.value)
  return props.ordenes.filter(orden => {
    if (filtroEstado.value !== '' && orden.estado !== filtroEstado.value) return false
    const proveedorOrden = proveedor(orden.proveedor_id)
    return normalizarBusqueda([
      orden.ordencompra_id, orden.fecha,
      proveedorOrden?.nombre, proveedorOrden?.apellido,
      facturasDeOrden(orden.ordencompra_id).map(factura => factura.numero).join(' ')
    ].join(' ')).includes(texto)
  })
})

const seleccionada = computed(() => ordenesFiltradas.value.find(item => item.ordencompra_id === ordenId.value))
const ordenesVisibles = computed(() => esMobile.value && seleccionada.value ? [seleccionada.value] : ordenesFiltradas.value)
function seleccionarOrden(id: number) {
  if (props.actualizando) return
  ordenId.value = esMobile.value && ordenId.value === id ? null : id
}
const detallesSeleccionados = computed(() => props.detalles.filter(item => item.ordencompra_id === seleccionada.value?.ordencompra_id))
const proveedorSeleccionado = computed(() => seleccionada.value ? proveedor(seleccionada.value.proveedor_id) : undefined)
const facturasSeleccionadas = computed(() => seleccionada.value ? facturasDeOrden(seleccionada.value.ordencompra_id) : [])

function cambiarEstado(estado: OrdenCompraCabecera['estado']) {
  if (!seleccionada.value || props.actualizando) return
  const actual = seleccionada.value.estado
  if (!transicionPermitida(actual, estado)) return
  emit('cambiar-estado', seleccionada.value.ordencompra_id, estado)
}

function cerrar() {
  if (!props.actualizando) emit('cerrar')
}

watch(ordenesFiltradas, ordenes => {
  if (!ordenes.some(item => item.ordencompra_id === ordenId.value)) {
    ordenId.value = esMobile.value ? null : ordenes[0]?.ordencompra_id ?? null
  }
})

watch(() => props.mostrar, async mostrar => {
  if (mostrar) {
    focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    busqueda.value = ''
    filtroEstado.value = ''
    ordenId.value = props.ordenes.find(orden => orden.ordencompra_id === props.ordenInicialId)?.ordencompra_id
      ?? props.ordenes[0]?.ordencompra_id ?? null
    await nextTick()
    if (esMobile.value) {
      const botonSeleccionado = dialogo.value?.querySelector<HTMLButtonElement>('.list-group button[aria-pressed="true"]')
      ;(botonSeleccionado ?? dialogo.value)?.focus()
    } else buscador.value?.focus()
  } else {
    focoAnterior?.focus()
  }
})

function mantenerFoco(event: KeyboardEvent) {
  const controles = dialogo.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')
  if (!controles?.length) return
  const primero = controles[0]
  const ultimo = controles[controles.length - 1]
  if (event.shiftKey && document.activeElement === primero) {
    event.preventDefault()
    ultimo?.focus()
  } else if (!event.shiftKey && document.activeElement === ultimo) {
    event.preventDefault()
    primero?.focus()
  }
}
</script>

<template>
  <div v-if="mostrar">
    <div class="modal-backdrop fade show"></div>
    <div ref="dialogo" class="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby="titulo-ver-ordenes" tabindex="-1" @keydown.esc="cerrar" @keydown.tab="mantenerFoco">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
        <div class="modal-content border-0 shadow overflow-hidden">
          <div class="modal-header encabezado text-white px-4 py-3">
            <div>
              <h5 id="titulo-ver-ordenes" class="modal-title fw-bold">Órdenes de Compra</h5>
              <p class="small text-white-50 mb-0">Consulta de órdenes, productos y comprobantes asociados</p>
            </div>
            <button type="button" class="btn-close btn-close-white" aria-label="Cerrar" :disabled="actualizando" @click="cerrar"></button>
          </div>
          <div class="modal-body bg-light p-4">
            <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
            <div v-if="mensaje" class="alert alert-success" role="status">{{ mensaje }}</div>
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <label for="buscar-orden-consulta" class="form-label small fw-semibold">Buscar orden</label>
                <input maxlength="150" v-texto-limpio id="buscar-orden-consulta" ref="buscador" v-model="busqueda" type="search" class="form-control" :disabled="actualizando" placeholder="Número de orden, proveedor, fecha o comprobante..." />
                <label for="estado-orden-consulta" class="form-label small fw-semibold mt-3">Filtrar por estado</label>
                <select id="estado-orden-consulta" v-model="filtroEstado" class="form-select" :disabled="actualizando">
                  <option value="">Todos los estados</option>
<option v-for="estado in estados" :key="estado.estadoordencompra_id" :value="normalizarEstadoCompra(estado.nombre)">{{ etiquetaEstadoCompra(estado.nombre.toLowerCase()) }}</option>
                </select>
                <small class="text-muted" role="status">{{ ordenesFiltradas.length }} orden(es) encontradas</small>
              </div>
            </div>
            <div class="row g-4">
              <div class="col-lg-5">
                <div class="card border-0 shadow-sm overflow-hidden">
                  <div class="card-header encabezado text-white fw-semibold py-3">Órdenes registradas</div>
                  <div class="list-group list-group-flush">
                    <button v-for="orden in ordenesVisibles" :key="orden.ordencompra_id" type="button" class="list-group-item list-group-item-action p-3" :disabled="actualizando" :class="{ seleccionada: ordenId === orden.ordencompra_id }" :aria-pressed="ordenId === orden.ordencompra_id" @click="seleccionarOrden(orden.ordencompra_id)">
                      <span class="d-flex justify-content-between gap-2 mb-2">
                        <strong>Orden #{{ orden.ordencompra_id }}</strong>
                        <span class="badge align-self-start" :class="claseEstadoCompra(orden.estado)">{{ etiquetaEstadoCompra(orden.estado) }}</span>
                      </span>
                      <span class="d-block fw-semibold">{{ proveedor(orden.proveedor_id)?.nombre }} {{ proveedor(orden.proveedor_id)?.apellido }}</span>
                      <span class="d-flex justify-content-between gap-2 small mt-2"><span class="text-muted">{{ orden.fecha }}</span><strong>{{ moneda(orden.total) }}</strong></span>
                      <span class="d-block small text-muted mt-2">{{ cargandoFacturas ? 'Cargando comprobantes…' : errorFacturas ? 'Comprobantes no disponibles' : facturasDeOrden(orden.ordencompra_id).length ? facturasDeOrden(orden.ordencompra_id).map(factura => factura.numero).join(', ') : 'Sin factura asociada' }}</span>
                      <span v-if="esMobile && ordenId === orden.ordencompra_id" class="d-block small text-coralon fw-semibold mt-2">Tocá nuevamente para ver las demás órdenes</span>
                    </button>
                    <p v-if="!ordenesFiltradas.length" class="text-muted text-center p-4 mb-0">No se encontraron órdenes.</p>
                  </div>
                </div>
              </div>
              <div class="col-lg-7">
                <section v-if="seleccionada" class="card border-0 shadow-sm overflow-hidden" aria-label="Orden seleccionada">
                  <div class="card-header encabezado text-white py-3 fw-semibold">Orden #{{ seleccionada.ordencompra_id }} · Información de compra</div>
                  <div class="card-body">
                    <button v-if="seleccionada.estado === 'pendiente'" type="button" class="btn btn-coralon mb-3" :disabled="actualizando" @click="emit('editar', seleccionada.ordencompra_id)">Editar orden</button>
                    <div class="border rounded p-3 mb-4 bg-light">
                      <span class="small text-muted d-block mb-2">Estado de la orden</span>
                      <div class="d-flex flex-wrap align-items-center gap-2">
                        <span class="badge me-auto" :class="claseEstadoCompra(seleccionada.estado)">
                          {{ etiquetaEstadoCompra(seleccionada.estado) }}
                        </span>

                        <button
                          v-for="accion in accionesDisponibles"
                          :key="accion.estado"
                          type="button"
                          class="btn btn-sm"
                          :class="accion.clase"
                          :disabled="actualizando || (accion.estado === 'aprobada' && !detallesSeleccionados.length) || (accion.estado === 'contabilizado' && (cargandoFacturas || !!errorFacturas || !facturasSeleccionadas.length))"
                          @click="cambiarEstado(accion.estado)"
                        >{{ accion.etiqueta }}</button>
                        <span v-if="!accionesDisponibles.length" class="text-muted small fst-italic">
                          {{ estadoCompraReconocido(seleccionada.estado) ? 'Estado final (no editable)' : 'Este estado no tiene transiciones configuradas. No hay acciones disponibles.' }}
                        </span>
                      </div>
                    </div>
                    <form v-if="seleccionada.estado === 'recibida' && !cargandoFacturas && !errorFacturas && !facturasSeleccionadas.length" class="border rounded p-3 mb-4" @submit.prevent="enviarFactura">
                      <h6 class="fw-bold">Enviar a Finanzas</h6>
                      <p class="small text-muted">Ingresá los datos de la factura de compra. Al enviarla, la orden quedará contabilizada.</p>
                      <div v-if="errorFactura" class="alert alert-danger" role="alert">{{ errorFactura }}</div>
                      <fieldset :disabled="actualizando">
                        <div class="row g-2">
                          <div class="col-12"><label for="compra-factura-numero" class="form-label">Número de factura</label><input v-texto-limpio id="compra-factura-numero" v-model="numeroFactura" class="form-control" maxlength="50" required /></div>
                          <div class="col-sm-6"><label for="compra-factura-fecha" class="form-label">Fecha</label><input id="compra-factura-fecha" v-model="fechaFactura" type="date" class="form-control" required /></div>
                          <div class="col-sm-6"><label for="compra-factura-impuestos" class="form-label">Impuestos (importe en $)</label><input id="compra-factura-impuestos" v-model="impuestosFactura" type="number" min="0" max="9999999999.99" step="0.01" class="form-control" required /></div>
                        </div>
                        <button type="submit" class="btn btn-success mt-3">{{ actualizando ? 'Enviando…' : 'Enviar a Finanzas y contabilizar' }}</button>
                      </fieldset>
                    </form>
                    <div class="row g-3 mb-4">
                      <div class="col-sm-6"><span class="small text-muted d-block">Fecha de la orden</span><strong>{{ seleccionada.fecha }}</strong></div>
                      <div class="col-12 bg-light rounded p-3">
                        <span class="small text-muted d-block">Proveedor</span>
                        <strong>{{ proveedorSeleccionado ? `${proveedorSeleccionado.nombre} ${proveedorSeleccionado.apellido}` : `Proveedor #${seleccionada.proveedor_id}` }}</strong>
                        <span v-if="proveedorSeleccionado" class="small text-muted d-block mt-1">CUIT {{ proveedorSeleccionado.cuit }} · {{ proveedorSeleccionado.email }} · {{ proveedorSeleccionado.telefono }}</span>
                      </div>
                    </div>
                    <h6 class="fw-bold">Productos de la orden</h6>
                    <div class="table-responsive border rounded">
                      <table class="table align-middle mb-0">
                        <thead class="table-light"><tr><th scope="col">Producto</th><th scope="col" class="text-end">Cantidad</th><th scope="col" class="text-end">Precio unit.</th><th scope="col" class="text-end">Importe</th></tr></thead>
                        <tbody>
                          <tr v-for="item in detallesSeleccionados" :key="item.ordencompradetalle_id">
                            <td>{{ nombreProducto(item.producto_id) }}</td><td class="text-end">{{ item.cantidad.toLocaleString('es-AR') }}</td><td class="text-end text-nowrap">{{ moneda(item.preciounitario) }}</td>
                            <td class="text-end text-nowrap fw-semibold">{{ moneda(Math.round(item.cantidad * item.preciounitario * 100) / 100) }}</td>
                          </tr>
                          <tr v-if="!detallesSeleccionados.length"><td colspan="4" class="text-center text-muted py-3">Sin productos registrados.</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <p class="text-end fw-bold mt-3">Total de la orden: <span class="text-coralon">{{ moneda(seleccionada.total) }}</span></p>
                    <h6 class="fw-bold border-top pt-3">Comprobantes asociados</h6><p v-if="cargandoFacturas" role="status">Cargando comprobantes…</p><div v-if="errorFacturas" class="alert alert-warning" role="alert">{{ errorFacturas }} <button class="btn btn-sm btn-outline-secondary" @click="emit('reintentar-facturas')">Reintentar</button></div>
                    <div v-for="factura in facturasSeleccionadas" :key="factura.facturacabecera_id" class="bg-light border rounded p-3 mt-2">
                      <div class="d-flex flex-wrap justify-content-between gap-2 mb-3"><strong>{{ factura.tipo }} · {{ factura.numero }}</strong><span class="small text-muted">{{ factura.fecha }}</span></div>
                      <div class="d-flex justify-content-between"><span>Subtotal</span><span>{{ moneda(factura.subtotal) }}</span></div>
                      <div class="d-flex justify-content-between"><span>Impuesto</span><span>{{ moneda(factura.impuesto) }}</span></div>
                      <div class="d-flex justify-content-between fw-bold border-top pt-2 mt-2"><span>Total del comprobante</span><span class="text-coralon">{{ moneda(factura.total) }}</span></div>
                    </div>
                    <p v-if="!cargandoFacturas && !errorFacturas && !facturasSeleccionadas.length" class="text-muted small mb-0">Esta orden todavía no tiene una factura asociada.</p>
                  </div>
                </section>
                <div v-else class="card border-0 shadow-sm p-5 text-center text-muted">Seleccioná una orden para consultar sus productos y comprobantes.</div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-light px-4"><button type="button" class="btn btn-secondary px-4" :disabled="actualizando" @click="cerrar">Cerrar</button></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop { opacity: 0.6; }
.encabezado { background-color: #231f1d; border-bottom: 3px solid #b33e14; }
.text-coralon { color: #b33e14; }
.btn-coralon { background-color: #b33e14; border-color: #b33e14; color: #fff; }
.btn-coralon:hover { background-color: #ff7a45; border-color: #ff7a45; color: #fff; }
.seleccionada { background-color: #fff1eb; border-left: 4px solid #b33e14; }
.form-control:focus { border-color: #b33e14; box-shadow: 0 0 0 0.15rem #b33e1420; }
.list-group-item:focus-visible { outline: 2px solid #b33e14; outline-offset: -2px; }
</style>
