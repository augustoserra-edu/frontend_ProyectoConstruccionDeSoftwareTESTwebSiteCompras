<script setup lang="ts">
interface Props {
  moduloActivo?: string
}

withDefaults(defineProps<Props>(), {
  moduloActivo: 'inicio'
})

const emit = defineEmits<{
  (e: 'cambiarModulo', modulo: string): void
  (e: 'cerrarSesion'): void
}>()

function setModule(modulo: string) {
  emit('cambiarModulo', modulo)
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark custom-navbar p-0">
    <div class="container-fluid p-0">
      
      <!-- Marca / Nombre del Sistema -->
      <a
        class="navbar-brand d-flex align-items-center gap-2 px-3 py-3 m-0 text-white text-uppercase fw-black letter-spacing"
        href="#"
        @click.prevent="setModule('inicio')"
      >
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

        <!-- Acciones extremas derechas: Ayuda / Manual y Cerrar Sesión -->
        <div class="d-flex flex-wrap align-items-center gap-2 px-3 py-2 py-lg-0">
          <button
            type="button"
            class="btn btn-help d-flex align-items-center gap-2"
            :class="{ 'btn-help-active': moduloActivo === 'ayuda' }"
            @click="setModule('ayuda')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
            </svg>
            <span>Ayuda / Manual</span>
          </button>

          <button
            class="btn btn-logout d-flex align-items-center gap-2"
            @click="emit('cerrarSesion')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
              <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
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

.btn-help {
  background-color: #2c2724;
  border: 1px solid #5a5450;
  color: #e0ddd8;
  font-size: 0.875rem;
  padding: 0.35rem 0.85rem;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.btn-help:hover {
  background-color: #332d2a;
  border-color: #c9881e;
  color: #ffffff;
}

.btn-help-active {
  background-color: #b33e14 !important;
  border-color: #ff7a45 !important;
  color: #ffffff !important;
}

.btn-logout {
  background-color: transparent;
  border: 1px solid #5a5450;
  color: #b0ada8;
  font-size: 0.875rem;
  padding: 0.35rem 0.85rem;
  transition: border-color 0.2s, color 0.2s;
}

.btn-logout:hover {
  border-color: #b33e14;
  color: #ffffff;
}
</style>
