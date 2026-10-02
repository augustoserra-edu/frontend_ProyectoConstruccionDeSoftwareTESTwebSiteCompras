<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CierreMensualApi, DiarioApi, PeriodoApi } from '../types/finanzasApi'
import { obtenerCierres, cerrarCierre } from '../services/cierresService'
import { obtenerPeriodos } from '../services/periodosService'
import { obtenerDiarios } from '../services/diariosService'
import { mensajeDeError } from '../services/finanzasApi'
import { etiquetaPeriodo, formatoFecha } from '../utils/formatoFinanzas'

// Datos que vienen del backend
const cierres = ref<CierreMensualApi[]>([])
const periodos = ref<PeriodoApi[]>([])
const asientosDiario = ref<DiarioApi[]>([])

const cargando = ref(false)
const cerrando = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')

// Selecciones y filtros
const periodoSeleccionado = ref<CierreMensualApi | null>(null)
const filtroCierreId = ref<number | 'todos'>('todos')

// Modal de Confirmación de Cierre
const mostrarModalConfirmacion = ref(false)

// El cierre solo trae el id del período: el nombre se arma cruzando con los períodos.
function nombreCierre(cierre: CierreMensualApi): string {
  const periodo = periodos.value.find(p => p.id === cierre.periodo)
  return periodo ? etiquetaPeriodo(periodo.anio, periodo.mes) : `Período #${cierre.periodo}`
}

function textoEstado(cierre: CierreMensualApi): string {
  return cierre.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado'
}

// Libro Diario filtrado
const asientosFiltrados = computed(() => {
  if (filtroCierreId.value === 'todos') {
    return asientosDiario.value
  }
  return asientosDiario.value.filter(a => a.cierre_mensual === filtroCierreId.value)
})

async function cargarDatos() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const [cierresApi, periodosApi, diariosApi] = await Promise.all([
      obtenerCierres(),
      obtenerPeriodos(),
      obtenerDiarios()
    ])
    cierres.value = cierresApi
    periodos.value = periodosApi
    asientosDiario.value = diariosApi

    // Mantener la selección con los datos actualizados
    const seleccionadoId = periodoSeleccionado.value?.id
    periodoSeleccionado.value = cierresApi.find(c => c.id === seleccionadoId) ?? null
  } catch (error) {
    cierres.value = []
    periodos.value = []
    asientosDiario.value = []
    periodoSeleccionado.value = null
    mensajeError.value = mensajeDeError(error)
  } finally {
    cargando.value = false
  }
}

function seleccionarPeriodo(cierre: CierreMensualApi) {
  if (periodoSeleccionado.value?.id === cierre.id) {
    periodoSeleccionado.value = null
  } else {
    periodoSeleccionado.value = cierre
  }
}

function abrirModalCierre() {
  if (periodoSeleccionado.value?.estado === 'ABIERTO') {
    mostrarModalConfirmacion.value = true
  }
}

function mostrarMensajeExito(texto: string) {
  mensajeExito.value = texto
  setTimeout(() => {
    mensajeExito.value = ''
  }, 4000)
}

// PUT: cierra el período en el backend y recién después recarga los datos
async function confirmarCierrePeriodo() {
  const seleccionado = periodoSeleccionado.value
  if (!seleccionado || cerrando.value) return

  const nombre = nombreCierre(seleccionado)
  cerrando.value = true
  mensajeError.value = ''
  try {
    await cerrarCierre(seleccionado.id)
    mostrarModalConfirmacion.value = false
    await cargarDatos()
    mostrarMensajeExito(`El período ${nombre} fue cerrado.`)
  } catch (error) {
    mostrarModalConfirmacion.value = false
    mensajeError.value = mensajeDeError(error)
  } finally {
    cerrando.value = false
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<template>
  <div class="container-fluid py-2">
    <!-- Encabezado -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
      <div>
        <h3 class="fw-bold mb-0 text-dark">Cierre de Período y Libro Diario</h3>
        <p class="text-muted small mb-0">Control de períodos contables y registro de asientos del libro diario</p>
      </div>

      <!-- Botón Cierre de Período -->
      <div>
        <button
          class="btn btn-coralon d-flex align-items-center gap-2 px-3 fw-semibold shadow-sm"
          :disabled="!periodoSeleccionado || periodoSeleccionado.estado !== 'ABIERTO' || cerrando"
          @click="abrirModalCierre"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2"/>
          </svg>
          <span>Ejecutar Cierre de Período</span>
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="mensajeExito" class="alert alert-success py-2 small mb-3" role="status">
      {{ mensajeExito }}
    </div>
    <div v-if="mensajeError" class="alert alert-danger py-2 small mb-3" role="alert">
      {{ mensajeError }}
    </div>

    <!-- Tabla Superior: Períodos / Cierres Mensuales -->
    <div class="card shadow-sm border-0 mb-4 overflow-hidden">
      <div class="card-header bg-dark-custom text-white py-3 d-flex justify-content-between align-items-center">
        <h5 class="fw-bold mb-0 fs-6">Períodos Mensuales</h5>
        <span v-if="cargando" class="spinner-border spinner-border-sm text-light" role="status" aria-label="Cargando"></span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="ps-3 py-2">ID</th>
              <th scope="col" class="py-2">Período / Mes</th>
              <th scope="col" class="py-2">Fecha Cierre</th>
              <th scope="col" class="pe-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cierre in cierres"
              :key="cierre.id"
              :class="{ 'fila-seleccionada': periodoSeleccionado?.id === cierre.id }"
              style="cursor: pointer;"
              @click="seleccionarPeriodo(cierre)"
            >
              <td class="ps-3 fw-bold text-muted">#{{ cierre.id }}</td>
              <td class="fw-semibold">{{ nombreCierre(cierre) }}</td>
              <td class="text-muted small">{{ formatoFecha(cierre.fecha_cierre) }}</td>
              <td class="pe-3">
                <span
                  class="badge px-2 py-1"
                  :class="cierre.estado === 'ABIERTO' ? 'bg-success' : 'bg-secondary'"
                >
                  {{ textoEstado(cierre) }}
                </span>
              </td>
            </tr>
            <tr v-if="!cargando && cierres.length === 0">
              <td colspan="4" class="text-center py-4 text-muted">No hay períodos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tabla Inferior: Libro Diario -->
    <div class="card shadow-sm border-0 overflow-hidden">
      <div class="card-header bg-dark-custom text-white d-flex justify-content-between align-items-center py-3">
        <h5 class="fw-bold mb-0 fs-6">Libro Diario (Asientos Contables)</h5>

        <!-- Filtro por Mes/Período -->
        <div class="d-flex align-items-center gap-2">
          <label class="small text-white-50 text-nowrap">Filtrar período:</label>
          <select v-model="filtroCierreId" class="form-select form-select-sm select-filtro">
            <option value="todos">Ver Histórico Completo</option>
            <option v-for="c in cierres" :key="c.id" :value="c.id">
              {{ nombreCierre(c) }} ({{ textoEstado(c) }})
            </option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col" class="ps-3 py-2">ID Asiento</th>
              <th scope="col" class="py-2">Fecha</th>
              <th scope="col" class="pe-3 py-2">Descripción del Movimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asiento in asientosFiltrados" :key="asiento.id">
              <td class="ps-3 text-muted">#{{ asiento.id }}</td>
              <td class="text-muted small">{{ formatoFecha(asiento.fecha) }}</td>
              <td class="pe-3 fw-semibold text-dark">{{ asiento.descripcion || 'Sin descripción' }}</td>
            </tr>
            <tr v-if="!cargando && asientosFiltrados.length === 0">
              <td colspan="3" class="text-center py-4 text-muted">No se registran asientos en este período.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Confirmación de Cierre -->
    <div v-if="mostrarModalConfirmacion && periodoSeleccionado">
      <div class="modal-backdrop fade show"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow border-0 overflow-hidden">
            <div class="modal-header modal-header-custom text-white px-4 py-3">
              <h5 class="modal-title fw-bold mb-0">Confirmar Cierre de Período</h5>
              <button type="button" class="btn-close btn-close-white" :disabled="cerrando" @click="mostrarModalConfirmacion = false"></button>
            </div>
            <div class="modal-body p-4 bg-white">
              <p class="text-dark mb-2">
                ¿Está seguro de cerrar el período <strong>{{ nombreCierre(periodoSeleccionado) }}</strong>?
              </p>
              <div class="alert alert-warning small mb-0">
                Una vez cerrado el período no se puede volver a modificar.
              </div>
            </div>
            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button type="button" class="btn btn-secondary px-3" :disabled="cerrando" @click="mostrarModalConfirmacion = false">
                Cancelar
              </button>
              <button type="button" class="btn btn-coralon px-4 fw-semibold" :disabled="cerrando" @click="confirmarCierrePeriodo">
                {{ cerrando ? 'Cerrando…' : 'Confirmar Cierre' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-dark-custom {
  background-color: #231f1d;
}

.modal-header-custom {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14;
}

.modal-backdrop {
  opacity: 0.6;
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

.fila-seleccionada {
  background-color: #fff1eb !important;
  border-left: 4px solid #b33e14;
}

.fila-seleccionada td {
  background-color: #fff1eb !important;
}

.select-filtro {
  background-color: #332d2a;
  color: #ffffff;
  border: 1px solid #4a4440;
}

.select-filtro:focus {
  background-color: #332d2a;
  color: #ffffff;
  border-color: #b33e14;
  box-shadow: none;
}
</style>
