<script setup lang="ts">
import { ref } from 'vue'

const mostrarManual = ref(false)
</script>

<template>
  <div class="container py-4">
    <!-- Encabezado Principal Institucional -->
    <div class="card border-0 shadow-sm mb-4 hero-banner text-white overflow-hidden">
      <div class="card-body p-4 p-md-5">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <span class="badge badge-institucional text-uppercase fw-semibold mb-2 px-3 py-1">
              Panel Principal
            </span>
            <h2 class="fw-bold mb-2">Bienvenido al Sistema de Gestión del Corralón</h2>
            <p class="mb-0 text-white-50 fs-6">
              Utilice la barra de navegación superior para acceder al módulo correspondiente a su área operativa (Finanzas, Sistemas Administrativos, Proveedores y Compra o Ventas).
            </p>
          </div>
          <div class="col-lg-4 text-lg-end">
            <div class="d-inline-flex flex-column gap-2 bg-dark bg-opacity-50 p-3 rounded-3 border border-secondary border-opacity-25 text-start">
              <div class="d-flex align-items-center gap-2 small">
                <span class="indicador-estado bg-success rounded-circle"></span>
                <span class="text-white-50">Estado del Sistema:</span>
                <strong class="text-white">Operativo</strong>
              </div>
              <div class="d-flex align-items-center gap-2 small">
                <span class="indicador-estado bg-success rounded-circle"></span>
                <span class="text-white-50">Sesión Actual:</span>
                <strong class="text-white">Activa</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado General del Sistema -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm h-100 estado-card">
          <div class="card-body d-flex align-items-center gap-3 p-3">
            <div class="icono-estado rounded-2 d-flex align-items-center justify-content-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
            </div>
            <div>
              <div class="text-muted small">Servicios Centrales</div>
              <div class="fw-bold text-dark">Sistema Operativo</div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm h-100 estado-card">
          <div class="card-body d-flex align-items-center gap-3 p-3">
            <div class="icono-estado rounded-2 d-flex align-items-center justify-content-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
              </svg>
            </div>
            <div>
              <div class="text-muted small">Credenciales</div>
              <div class="fw-bold text-dark">Sesión Activa</div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm h-100 estado-card">
          <div class="card-body d-flex align-items-center gap-3 p-3">
            <div class="icono-estado rounded-2 d-flex align-items-center justify-content-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z"/>
              </svg>
            </div>
            <div>
              <div class="text-muted small">Navegación Superior</div>
              <div class="fw-bold text-dark">4 Módulos Habilitados</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel Informativo Institucional -->
    <div class="card border-0 shadow-sm overflow-hidden">
      <div class="card-header encabezado-tarjeta text-white py-3 px-4 border-0 d-flex align-items-center justify-content-between">
        <span class="fw-bold">Orientación General del Sistema</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" class="acento-icono">
          <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
        </svg>
      </div>
      <div class="card-body p-4 bg-white">
        <p class="text-secondary mb-4">
          Para comenzar a operar, diríjase a la <strong>barra de navegación superior</strong> y seleccione el módulo correspondiente a su sector. Cada área dispone de su propio menú lateral de acciones específicas:
        </p>

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="p-3 rounded bg-light border h-100">
              <h6 class="fw-bold text-dark mb-1">Finanzas</h6>
              <p class="small text-muted mb-0">
                Facturación de órdenes pendientes, consulta del libro diario, cierres contables y gestión de períodos.
              </p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 rounded bg-light border h-100">
              <h6 class="fw-bold text-dark mb-1">Sistemas Administrativos</h6>
              <p class="small text-muted mb-0">
                Administración del catálogo de productos, control de stock mínimo, movimientos de inventario y reposiciones.
              </p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 rounded bg-light border h-100">
              <h6 class="fw-bold text-dark mb-1">Proveedores y Compra</h6>
              <p class="small text-muted mb-0">
                Gestión integral de proveedores, catálogo suministrado y seguimiento de órdenes de compra.
              </p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 rounded bg-light border h-100">
              <h6 class="fw-bold text-dark mb-1">Ventas</h6>
              <p class="small text-muted mb-0">
                Padrones de clientes, registración de órdenes de venta y gestión de devoluciones o notas de crédito.
              </p>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end">
          <button
            type="button"
            class="btn btn-outline-coralon px-4 fw-semibold"
            @click="mostrarManual = true"
          >
            Ver Manual de Usuario
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Informativo: Manual de Usuario -->
    <div v-if="mostrarManual">
      <div class="modal-backdrop fade show"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow overflow-hidden">
            <div class="modal-header encabezado-tarjeta text-white px-4 py-3">
              <h5 class="modal-title fw-bold mb-0">Manual de Usuario — Guía Operativa</h5>
              <button
                type="button"
                class="btn-close btn-close-white"
                aria-label="Cerrar"
                @click="mostrarManual = false"
              ></button>
            </div>
            <div class="modal-body p-4 bg-white">
              <p class="text-muted small mb-3">
                Recuerde que puede cambiar de módulo en cualquier momento desde la barra superior o regresar a esta pantalla haciendo clic en el logo <strong>EL CORRALON</strong>.
              </p>
              <ul class="list-group list-group-flush small">
                <li class="list-group-item px-0 py-2">
                  <strong>Navegación Superior:</strong> Permite alternar entre los módulos de <em>Finanzas</em>, <em>Sistemas Administrativos</em>, <em>Proveedores y Compra</em> y <em>Ventas</em>.
                </li>
                <li class="list-group-item px-0 py-2">
                  <strong>Menú Lateral (Sidebar):</strong> Una vez dentro de un módulo, utilice el panel izquierdo para elegir la operación específica de su área.
                </li>
                <li class="list-group-item px-0 py-2">
                  <strong>Cierre de Sesión:</strong> Al finalizar sus tareas, utilice el botón <em>Cerrar sesión</em> ubicado en el extremo superior derecho.
                </li>
              </ul>
            </div>
            <div class="modal-footer bg-light px-4 py-3 border-top">
              <button
                type="button"
                class="btn btn-coralon px-4 fw-semibold"
                @click="mostrarManual = false"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-banner {
  background-color: #231f1d;
  border-bottom: 4px solid #b33e14 !important;
}

.badge-institucional {
  background-color: #b33e14;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.indicador-estado {
  width: 10px;
  height: 10px;
  display: inline-block;
}

.estado-card {
  border-left: 4px solid #b33e14 !important;
}

.icono-estado {
  width: 44px;
  height: 44px;
  background-color: rgba(179, 62, 20, 0.12);
  color: #b33e14;
  flex-shrink: 0;
}

.encabezado-tarjeta {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14 !important;
}

.acento-icono {
  color: #ff7a45;
}

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

.btn-outline-coralon:hover {
  background-color: #b33e14;
  color: #ffffff;
}

.modal-backdrop {
  opacity: 0.6;
}
</style>
