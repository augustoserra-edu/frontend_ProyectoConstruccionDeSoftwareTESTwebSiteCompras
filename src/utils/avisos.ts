import { reactive } from 'vue'

// Avisos tipo "pop up" que reemplazan al alert() del navegador.
// Se muestran con el componente AvisoPopup, que está una sola vez en App.vue.
export type TipoAviso = 'exito' | 'error' | 'info'

export const aviso = reactive({
  visible: false,
  tipo: 'info' as TipoAviso,
  titulo: '',
  mensaje: '',
})

export function mostrarAviso(tipo: TipoAviso, titulo: string, mensaje: string) {
  aviso.tipo = tipo
  aviso.titulo = titulo
  aviso.mensaje = mensaje
  aviso.visible = true
}

export function cerrarAviso() {
  aviso.visible = false
}

export function avisoExito(mensaje: string, titulo = 'Listo') {
  mostrarAviso('exito', titulo, mensaje)
}

// Los mensajes de error de la API empiezan con "Error: ": en el pop up ya va el título, así que se saca
export function avisoError(mensaje: string, titulo = 'No se pudo completar la acción') {
  mostrarAviso('error', titulo, mensaje.replace(/^Error:\s*/i, ''))
}

export function avisoInfo(mensaje: string, titulo = 'Aviso') {
  mostrarAviso('info', titulo, mensaje)
}
