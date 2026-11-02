<script setup lang="ts">
// Vista de bienvenida institucional neutra
</script>

<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-10 col-xl-9">
        <div class="card border-0 shadow-sm hero-banner text-white overflow-hidden">
          <div class="card-body p-4 p-md-5 text-center">
            <div class="badge-logo rounded-2 d-inline-flex align-items-center justify-content-center fw-bold mb-3">
              EC
            </div>
            <div class="mb-2">
              <span class="badge badge-institucional text-uppercase fw-semibold px-3 py-1">
                Panel Principal
              </span>
            </div>
            <h2 class="fw-bold mb-3">Bienvenido al Sistema de Gestión del Corralón</h2>
            <p class="mb-0 text-white-50 fs-6 mx-auto subtitulo-bienvenida">
              Utilice la barra de navegación superior para acceder al módulo de trabajo correspondiente a su área operativa.
            </p>
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

.badge-logo {
  background-color: #c9881e;
  color: #1a1a1a;
  width: 52px;
  height: 52px;
  font-size: 1.25rem;
}

.badge-institucional {
  background-color: #b33e14;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.subtitulo-bienvenida {
  max-width: 640px;
}
</style>
