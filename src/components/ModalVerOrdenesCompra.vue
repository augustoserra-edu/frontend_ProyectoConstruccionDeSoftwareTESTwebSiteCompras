<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { normalizarBusqueda } from '../utils/busqueda'
import type { OrdenCompraCabecera, OrdenCompraDetalle } from '../types/compra'
import type { FacturaCabecera } from '../types/finanzas'
import { PROVEEDORES_MOCK } from '../types/proveedor'
import { PRODUCTOS_MOCK } from '../types/producto'

const props = defineProps<{
  mostrar: boolean
  ordenInicialId?: number | null
  ordenes: OrdenCompraCabecera[]
  facturas: FacturaCabecera[]
  detalles: OrdenCompraDetalle[]
  cambiosHabilitados: boolean
  actualizando: boolean
  error: string
  mensaje: string
}>()
const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'alternar-cambios'): void
  (e: 'cambiar-estado', ordenId: number, estado: OrdenCompraCabecera['estado']): void
}>()

const busqueda = ref('')
const filtroEstado = ref<OrdenCompraCabecera['estado'] | ''>('')
const ordenId = ref<number | null>(null)
const buscador = ref<HTMLInputElement | null>(null)
let focoAnterior: HTMLElement | null = null
const dialogo = ref<HTMLElement | null>(null)
const moneda = (valor: number) => valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const proveedor = (id: number) => PROVEEDORES_MOCK.find(item => item.proveedor_id === id)
const nombreProducto = (id: number) => PRODUCTOS_MOCK.find(item => item.producto_id === id)?.nombre ?? `Producto #${id}`
const facturasDeOrden = (id: number) => props.facturas.filter(item => item.ordencompra_id === id)

const ordenesFiltradas = computed(() => {
  const texto = normalizarBusqueda(busqueda.value)
  return props.ordenes.filter(orden => {
    if (filtroEstado.value !== '' && orden.estado !== filtroEstado.value) return false
    const proveedorOrden = proveedor(orden.proveedor_id)
    return normalizarBusqueda([
      orden.ordencompra_id, orden.solicitante, orden.fecha,
      proveedorOrden?.nombre, proveedorOrden?.apellido,
      facturasDeOrden(orden.ordencompra_id).map(factura => factura.numero).join(' ')
    ].join(' ')).includes(texto)
  })
})

const seleccionada = computed(() => ordenesFiltradas.value.find(item => item.ordencompra_id === ordenId.value))
const detallesSeleccionados = computed(() => props.detalles.filter(item => item.ordencompra_id === seleccionada.value?.ordencompra_id))
const proveedorSeleccionado = computed(() => seleccionada.value ? proveedor(seleccionada.value.proveedor_id) : undefined)
const facturasSeleccionadas = computed(() => seleccionada.value ? facturasDeOrden(seleccionada.value.ordencompra_id) : [])

function cambiarEstado(estado: OrdenCompraCabecera['estado']) {
  if (!seleccionada.value || !props.cambiosHabilitados || props.actualizando) return
  const actual = seleccionada.value.estado
  if (!(actual === 'pendiente' && (estado === 'aprobada' || estado === 'rechazada')) &&
      !(actual === null && estado === 'recibida')) return
  emit('cambiar-estado', seleccionada.value.ordencompra_id, estado)
}

function cerrar() {
  if (!props.actualizando) emit('cerrar')
}

watch(ordenesFiltradas, ordenes => {
  if (!ordenes.some(item => item.ordencompra_id === ordenId.value)) ordenId.value = ordenes[0]?.ordencompra_id ?? null
})

watch(() => props.mostrar, async mostrar => {
  if (mostrar) {
    focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    busqueda.value = ''
    filtroEstado.value = ''
    ordenId.value = props.ordenes.find(orden => orden.ordencompra_id === props.ordenInicialId)?.ordencompra_id
      ?? props.ordenes[0]?.ordencompra_id ?? null
    await nextTick()
    buscador.value?.focus()
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
            <div class="d-flex justify-content-end mb-3">
              <button type="button" class="btn btn-outline-coralon fw-semibold" :disabled="actualizando" :aria-pressed="cambiosHabilitados" @click="emit('alternar-cambios')">
                {{ cambiosHabilitados ? 'Bloquear cambios de estado' : 'Habilitar cambios de estado' }}
              </button>
            </div>
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-body">
                <label for="buscar-orden-consulta" class="form-label small fw-semibold">Buscar orden</label>
                <input id="buscar-orden-consulta" ref="buscador" v-model="busqueda" type="search" class="form-control" :disabled="actualizando" placeholder="Número de orden, solicitante, proveedor, fecha o comprobante..." />
                <label for="estado-orden-consulta" class="form-label small fw-semibold mt-3">Filtrar por estado</label>
                <select id="estado-orden-consulta" v-model="filtroEstado" class="form-select" :disabled="actualizando">
                  <option value="">Todos los estados</option>
                  <option :value="null">Sin recibir</option>
                  <option value="recibida">recibida</option>
                  <option value="pendiente">pendiente</option>
                  <option value="aprobada">aprobada</option>
                  <option value="rechazada">rechazada</option>
                </select>
                <small class="text-muted" role="status">{{ ordenesFiltradas.length }} orden(es) encontradas</small>
              </div>
            </div>
            <div class="row g-4">
              <div class="col-lg-5">
                <div class="card border-0 shadow-sm overflow-hidden">
                  <div class="card-header encabezado text-white fw-semibold py-3">Órdenes registradas</div>
                  <div class="list-group list-group-flush">
                    <button v-for="orden in ordenesFiltradas" :key="orden.ordencompra_id" type="button" class="list-group-item list-group-item-action p-3" :disabled="actualizando" :class="{ seleccionada: ordenId === orden.ordencompra_id }" :aria-pressed="ordenId === orden.ordencompra_id" @click="ordenId = orden.ordencompra_id">
                      <span class="d-flex justify-content-between gap-2 mb-2">
                        <strong>Orden #{{ orden.ordencompra_id }}</strong>
                        <span class="badge align-self-start" :class="orden.estado === 'aprobada' ? 'bg-success' : orden.estado === 'rechazada' ? 'bg-danger' : orden.estado === 'recibida' ? 'bg-primary' : orden.estado === null ? 'bg-secondary' : 'bg-warning text-dark'">{{ orden.estado ?? 'Sin recibir' }}</span>
                      </span>
                      <span class="d-block fw-semibold">{{ orden.solicitante }}</span>
                      <span class="d-flex justify-content-between gap-2 small mt-2"><span class="text-muted">{{ orden.fecha }}</span><strong>{{ moneda(orden.total) }}</strong></span>
                      <span class="d-block small text-muted mt-2">{{ facturasDeOrden(orden.ordencompra_id).length ? facturasDeOrden(orden.ordencompra_id).map(factura => factura.numero).join(', ') : 'Sin factura asociada' }}</span>
                    </button>
                    <p v-if="!ordenesFiltradas.length" class="text-muted text-center p-4 mb-0">No se encontraron órdenes.</p>
                  </div>
                </div>
              </div>
              <div class="col-lg-7">
                <section v-if="seleccionada" class="card border-0 shadow-sm overflow-hidden" aria-label="Orden seleccionada">
                  <div class="card-header encabezado text-white py-3 fw-semibold">Orden #{{ seleccionada.ordencompra_id }} · Información de compra</div>
                  <div class="card-body">
                    <div class="border rounded p-3 mb-4 bg-light">
                      <span class="small text-muted d-block mb-2">Estado de la orden</span>
                      <div class="d-flex flex-wrap align-items-center gap-2">
                        <span class="badge me-auto" :class="seleccionada.estado === 'aprobada' ? 'bg-success' : seleccionada.estado === 'rechazada' ? 'bg-danger' : seleccionada.estado === 'recibida' ? 'bg-primary' : seleccionada.estado === null ? 'bg-secondary' : 'bg-warning text-dark'">
                          {{ seleccionada.estado ?? 'Sin recibir' }}
                        </span>

                        <template v-if="seleccionada.estado === 'pendiente'">
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-success"
                            :disabled="!cambiosHabilitados || actualizando || !detallesSeleccionados.length"
                            @click="cambiarEstado('aprobada')"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            :disabled="!cambiosHabilitados || actualizando"
                            @click="cambiarEstado('rechazada')"
                          >
                            Rechazar
                          </button>
                        </template>

                        <button
                          v-else-if="seleccionada.estado === null"
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          :disabled="!cambiosHabilitados || actualizando"
                          @click="cambiarEstado('recibida')"
                        >Recibir</button>
                        <span v-else class="text-muted small fst-italic">
                          Estado bloqueado (no editable)
                        </span>
                      </div>
                    </div>
                    <div class="row g-3 mb-4">
                      <div class="col-sm-6"><span class="small text-muted d-block">Solicitante interno</span><strong>{{ seleccionada.solicitante }}</strong></div>
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
                    <h6 class="fw-bold border-top pt-3">Comprobantes asociados</h6>
                    <div v-for="factura in facturasSeleccionadas" :key="factura.facturacabecera_id" class="bg-light border rounded p-3 mt-2">
                      <div class="d-flex flex-wrap justify-content-between gap-2 mb-3"><strong>{{ factura.tipo }} · {{ factura.numero }}</strong><span class="small text-muted">{{ factura.fecha }}</span></div>
                      <div class="d-flex justify-content-between"><span>Subtotal</span><span>{{ moneda(factura.subtotal) }}</span></div>
                      <div class="d-flex justify-content-between"><span>Impuesto</span><span>{{ moneda(factura.impuesto) }}</span></div>
                      <div class="d-flex justify-content-between fw-bold border-top pt-2 mt-2"><span>Total del comprobante</span><span class="text-coralon">{{ moneda(factura.total) }}</span></div>
                    </div>
                    <p v-if="!facturasSeleccionadas.length" class="text-muted small mb-0">Esta orden todavía no tiene una factura asociada.</p>
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
.btn-outline-coralon { border-color: #b33e14; color: #b33e14; }
.btn-outline-coralon:hover:not(:disabled) { background-color: #b33e14; color: #fff; }
.seleccionada { background-color: #fff1eb; border-left: 4px solid #b33e14; }
.form-control:focus { border-color: #b33e14; box-shadow: 0 0 0 0.15rem #b33e1420; }
.list-group-item:focus-visible { outline: 2px solid #b33e14; outline-offset: -2px; }
</style>
