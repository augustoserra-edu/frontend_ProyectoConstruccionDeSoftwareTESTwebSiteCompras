import Swal from 'sweetalert2'

const COLOR_CONFIRMAR = '#b33e14'
const COLOR_CANCELAR = '#6c757d'

export function exito(titulo: string, texto?: string) {
  return Swal.fire({
    icon: 'success',
    title: titulo,
    text: texto,
    confirmButtonColor: COLOR_CONFIRMAR,
    confirmButtonText: 'Aceptar'
  })
}

export function error(titulo: string, texto?: string) {
  return Swal.fire({
    icon: 'error',
    title: titulo,
    text: texto,
    confirmButtonColor: COLOR_CONFIRMAR,
    confirmButtonText: 'Aceptar'
  })
}

export function advertencia(titulo: string, texto?: string) {
  return Swal.fire({
    icon: 'warning',
    title: titulo,
    text: texto,
    confirmButtonColor: COLOR_CONFIRMAR,
    confirmButtonText: 'Aceptar'
  })
}

export async function confirmar(
  titulo: string,
  texto: string,
  textoConfirmar = 'Confirmar'
): Promise<boolean> {
  const resultado = await Swal.fire({
    icon: 'warning',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonColor: COLOR_CONFIRMAR,
    cancelButtonColor: COLOR_CANCELAR,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar'
  })

  return Boolean(resultado.isConfirmed)
}

export const alerta = {
  exito,
  error,
  advertencia,
  confirmar
}

export default alerta
