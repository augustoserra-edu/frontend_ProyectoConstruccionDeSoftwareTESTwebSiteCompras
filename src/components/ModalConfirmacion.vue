<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{ mensaje: string }>()
const emit = defineEmits<{ (e: 'resolver', confirmado: boolean): void }>()
const dialogo = ref<HTMLDialogElement | null>(null)

onMounted(() => dialogo.value?.showModal())

function resolver(confirmado: boolean) {
  dialogo.value?.close()
  emit('resolver', confirmado)
}
</script>

<template>
  <dialog ref="dialogo" class="confirmacion border-0 rounded shadow p-0" aria-labelledby="titulo-confirmacion" aria-describedby="mensaje-confirmacion" @cancel.prevent="resolver(false)">
    <div class="encabezado px-4 py-3">
      <h5 id="titulo-confirmacion" class="mb-0 fw-bold">Confirmar cambio de estado</h5>
    </div>
    <div class="p-4">
      <p id="mensaje-confirmacion" class="mb-0">{{ mensaje }}</p>
    </div>
    <div class="d-flex justify-content-end gap-2 px-4 py-3 bg-light border-top">
      <button type="button" class="btn btn-secondary" autofocus @click="resolver(false)">Cancelar</button>
      <button type="button" class="btn btn-confirmar fw-semibold" @click="resolver(true)">Confirmar</button>
    </div>
  </dialog>
</template>

<style scoped>
.confirmacion { width: min(480px, calc(100vw - 32px)); color: #231f1d; }
.confirmacion::backdrop { background: rgb(0 0 0 / 60%); }
.encabezado { background: #231f1d; color: white; border-bottom: 3px solid #b33e14; }
.btn-confirmar { background: #b33e14; border-color: #b33e14; color: white; }
.btn-confirmar:hover { background: #963410; border-color: #963410; }
.btn-confirmar:focus-visible { outline: 3px solid #b33e14; outline-offset: 3px; }
</style>
