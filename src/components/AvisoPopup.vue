<script setup lang="ts">
import { ref, watch } from 'vue'
import { aviso, cerrarAviso } from '../utils/avisos'

const dialogo = ref<HTMLDialogElement | null>(null)

// Abre o cierra el cuadro según el estado del aviso
watch(
  () => aviso.visible,
  (visible) => {
    const d = dialogo.value
    if (!d) return
    if (visible && !d.open) d.showModal()
    if (!visible && d.open) d.close()
  },
  { flush: 'post' },
)

const ICONOS = { exito: '✓', error: '!', info: 'i' } as const
</script>

<template>
  <dialog
    ref="dialogo"
    class="aviso border-0 rounded shadow p-0"
    :class="`aviso-${aviso.tipo}`"
    aria-labelledby="titulo-aviso"
    aria-describedby="mensaje-aviso"
    @cancel.prevent="cerrarAviso"
    @click.self="cerrarAviso"
  >
    <div class="encabezado px-4 py-3 d-flex align-items-center gap-3">
      <span class="icono" aria-hidden="true">{{ ICONOS[aviso.tipo] }}</span>
      <h5 id="titulo-aviso" class="mb-0 fw-bold">{{ aviso.titulo }}</h5>
    </div>
    <div class="p-4">
      <p id="mensaje-aviso" class="mb-0 mensaje">{{ aviso.mensaje }}</p>
    </div>
    <div class="d-flex justify-content-end px-4 py-3 bg-light border-top">
      <button type="button" class="btn btn-aceptar fw-semibold px-4" autofocus @click="cerrarAviso">Aceptar</button>
    </div>
  </dialog>
</template>

<style scoped>
.aviso {
  width: min(460px, calc(100vw - 32px));
  color: #231f1d;
  --color-aviso: #0d6efd;
}
.aviso::backdrop {
  background: rgb(0 0 0 / 60%);
}
.aviso-exito {
  --color-aviso: #198754;
}
.aviso-error {
  --color-aviso: #dc3545;
}
.encabezado {
  background: #231f1d;
  color: #ffffff;
  border-bottom: 3px solid var(--color-aviso);
}
.icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-aviso);
  color: #ffffff;
  font-weight: 700;
  flex-shrink: 0;
}
.mensaje {
  white-space: pre-line;
}
.btn-aceptar {
  background: #b33e14;
  border-color: #b33e14;
  color: #ffffff;
}
.btn-aceptar:hover {
  background: #963410;
  border-color: #963410;
  color: #ffffff;
}
.btn-aceptar:focus-visible {
  outline: 3px solid #b33e14;
  outline-offset: 3px;
}
</style>
