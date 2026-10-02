<script setup lang="ts">
interface Props {
  moduloActivo?: string
}

const props = withDefaults(defineProps<Props>(), {
  moduloActivo: 'proveedores'
})

const emit = defineEmits<{
  (e: 'cambiarModulo', modulo: string): void
}>()

function setModule(modulo: string) {
  emit('cambiarModulo', modulo)
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark custom-navbar p-0">
    <div class="container-fluid p-0">
      
      <!-- Marca / Nombre del Sistema -->
      <a class="navbar-brand d-flex align-items-center gap-2 px-3 py-3 m-0 text-white text-uppercase fw-black letter-spacing" href="#">
        <span class="badge-logo rounded-1 d-flex align-items-center justify-content-center fw-bold">
          EC
        </span>
        <span class="brand-text">EL CORRALON</span>
      </a>

      <!-- Botón Hamburguesa Móvil -->
      <button 
        class="navbar-toggler me-3" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target="#navbarContenido" 
        aria-controls="navbarContenido" 
        aria-expanded="false" 
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Menú de navegación -->
      <div class="collapse navbar-collapse" id="navbarContenido">
        <ul class="navbar-nav me-auto mb-0 align-items-stretch">
          
          <!-- Finanzas -->
          <li class="nav-item">
            <a 
              href="#" 
              @click.prevent="setModule('finanzas')"
              class="nav-link d-flex align-items-center gap-2 px-4 py-3 fw-bold"
              :class="moduloActivo === 'finanzas' ? 'active-module' : 'standard-link'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 4H1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/>
                <path d="M5.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5m0-1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
              </svg>
              <span>Finanzas</span>
            </a>
          </li>

          <!-- Sistemas Administrativos -->
          <li class="nav-item">
            <a 
              href="#" 
              @click.prevent="setModule('administrativos')"
              class="nav-link d-flex align-items-center gap-2 px-4 py-3 fw-bold"
              :class="moduloActivo === 'administrativos' ? 'active-module' : 'standard-link'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z"/>
              </svg>
              <span>Sistemas Administrativos</span>
            </a>
          </li>

          <!-- Proveedores y Compra -->
          <li class="nav-item">
            <a 
              href="#" 
              @click.prevent="setModule('proveedores')"
              class="nav-link d-flex align-items-center gap-2 px-4 py-3 fw-bold"
              :class="moduloActivo === 'proveedores' ? 'active-module' : 'standard-link'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732.75V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7c0 .4.15.77.402 1.056M12 6v4h1.5a.5.5 0 0 0 .5-.5V8.5a.5.5 0 0 0-.5-.5zm1.5-1h-1.5V5h1.18zM3 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2m9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
              </svg>
              <span>Proveedores y Compra</span>
            </a>
          </li>

          <!-- Ventas -->
          <li class="nav-item">
            <a 
              href="#" 
              @click.prevent="setModule('ventas')"
              class="nav-link d-flex align-items-center gap-2 px-4 py-3 fw-bold"
              :class="moduloActivo === 'ventas' ? 'active-module' : 'standard-link'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.37 2.37 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.455-.888L12.054 2H3.946L1.532 4.737a1.375 1.375 0 0 0 2.218 1.888M15 8.5a.5.5 0 0 1 .5.5v5.5a1.5 1.5 0 0 1-1.5 1.5H2a1.5 1.5 0 0 1-1.5-1.5V9a.5.5 0 0 1 1 0v5.5a.5.5 0 0 0 .5.5h12a.5.5 0 0 0 .5-.5V9a.5.5 0 0 1 .5-.5"/>
              </svg>
              <span>Ventas</span>
            </a>
          </li>

        </ul>
      </div>

    </div>
  </nav>
</template>

<style scoped>
.custom-navbar {
  background-color: #231f1d;
}

.badge-logo {
  background-color: #c9881e;
  color: #1a1a1a;
  width: 32px;
  height: 32px;
  font-size: 0.95rem;
}

.brand-text {
  font-size: 1.15rem;
  letter-spacing: 0.5px;
}

.active-module {
  background-color: #b33e14;
  border-bottom: 3px solid #ff7a45;
  color: #ffffff !important;
}

.standard-link {
  color: #b0ada8 !important;
  transition: background-color 0.2s, color 0.2s;
}

.standard-link:hover {
  background-color: #332d2a;
  color: #ffffff !important;
}
</style>