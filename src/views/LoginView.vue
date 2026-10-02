<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits<{
  (e: 'sesion-iniciada'): void
}>()

const usuario = ref('')
const contrasena = ref('')
const estaCargando = ref(false)
const mensajeError = ref('')

async function iniciarSesion() {
  mensajeError.value = ''
  estaCargando.value = true

  try {
    const respuesta = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/auth/login/`,
      { username: usuario.value, password: contrasena.value }
    )
    localStorage.setItem('accessToken', respuesta.data.access)
    localStorage.setItem('refreshToken', respuesta.data.refresh)
    emit('sesion-iniciada')
  } catch {
    mensajeError.value = 'Usuario o contraseña incorrectos.'
  } finally {
    estaCargando.value = false
  }
}
</script>

<template>
  <div class="pantalla-login d-flex align-items-center justify-content-center">
    <div class="tarjeta-login p-4 p-md-5 rounded-2">

      <!-- Logo y título -->
      <div class="text-center mb-4">
        <div class="badge-logo rounded-1 d-inline-flex align-items-center justify-content-center fw-bold mb-3">
          EC
        </div>
        <h1 class="titulo-sistema text-uppercase fw-bold text-white mb-1">El Corralón</h1>
        <p class="subtitulo text-secondary mb-0">Sistema de Gestión</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="iniciarSesion">
        <div class="mb-3">
          <label for="usuario" class="form-label etiqueta">Usuario</label>
          <input
            id="usuario"
            v-model="usuario"
            type="text"
            class="form-control input-oscuro"
            placeholder="Ingresá tu usuario"
            autocomplete="username"
            required
          />
        </div>

        <div class="mb-4">
          <label for="contrasena" class="form-label etiqueta">Contraseña</label>
          <input
            id="contrasena"
            v-model="contrasena"
            type="password"
            class="form-control input-oscuro"
            placeholder="Ingresá tu contraseña"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="mensajeError" class="alerta-error rounded-1 px-3 py-2 mb-3 small">
          {{ mensajeError }}
        </div>

        <button
          type="submit"
          class="btn btn-ingresar w-100 fw-bold"
          :disabled="estaCargando"
        >
          <span v-if="estaCargando" class="spinner-border spinner-border-sm me-2" role="status" />
          {{ estaCargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

    </div>
  </div>
</template>

<style scoped>
.pantalla-login {
  min-height: 100vh;
  background-color: #1a1a1a;
}

.tarjeta-login {
  width: 100%;
  max-width: 420px;
  background-color: #2c2724;
  border: 1px solid #3d3733;
}

.badge-logo {
  background-color: #c9881e;
  color: #1a1a1a;
  width: 48px;
  height: 48px;
  font-size: 1.1rem;
}

.titulo-sistema {
  font-size: 1.4rem;
  letter-spacing: 1px;
}

.subtitulo {
  font-size: 0.85rem;
  color: #b0ada8 !important;
}

.etiqueta {
  font-size: 0.85rem;
  color: #b0ada8;
  margin-bottom: 0.35rem;
}

.input-oscuro {
  background-color: #231f1d;
  border: 1px solid #3d3733;
  color: #ffffff;
  transition: border-color 0.15s;
}

.input-oscuro::placeholder {
  color: #6b6560;
}

.input-oscuro:focus {
  background-color: #231f1d;
  border-color: #c9881e;
  color: #ffffff;
  box-shadow: 0 0 0 0.2rem rgba(201, 136, 30, 0.15);
}

.alerta-error {
  background-color: rgba(179, 62, 20, 0.15);
  border: 1px solid #b33e14;
  color: #ff7a45;
}

.btn-ingresar {
  background-color: #b33e14;
  border: none;
  color: #ffffff;
  padding: 0.6rem;
  transition: background-color 0.2s;
}

.btn-ingresar:hover:not(:disabled) {
  background-color: #c9481a;
}

.btn-ingresar:disabled {
  background-color: #5a2a10;
  color: #b0ada8;
  cursor: not-allowed;
}
</style>
