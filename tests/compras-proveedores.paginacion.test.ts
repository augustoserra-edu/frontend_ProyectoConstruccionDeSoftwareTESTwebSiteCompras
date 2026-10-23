import { afterEach, describe, expect, it, vi } from 'vitest'
import api from '../src/api/clienteAxios'
import { obtenerTodasLasPaginas } from '../src/services/paginacion'

afterEach(() => vi.restoreAllMocks())

describe('Paginación compartida de Compras y Proveedores', () => {
  it.each([
    { formato: 'arreglo', data: [] },
    { formato: 'página', data: { results: [], next: null } }
  ])('devuelve un catálogo vacío sin pedir otra página ($formato)', async ({ data }) => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data })
    await expect(obtenerTodasLasPaginas('/compras/proveedores/')).resolves.toEqual([])
    expect(get).toHaveBeenCalledExactlyOnceWith('/compras/proveedores/', { params: { page: 1 } })
  })

  it('rechaza un listado mal formado en vez de mostrarlo como vacío', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { results: {}, next: null } })
    await expect(obtenerTodasLasPaginas('/compras/proveedores/')).rejects.toThrow('Respuesta de listado inválida.')
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('propaga el error de la segunda página sin devolver un catálogo incompleto', async () => {
    const error = new Error('API no disponible')
    const get = vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { results: [{ id: 1 }], next: 'https://proxy.invalid/?page=2' } })
      .mockRejectedValueOnce(error)
    await expect(obtenerTodasLasPaginas('/scm/productos/')).rejects.toBe(error)
    expect(get).toHaveBeenCalledTimes(2)
    expect(get).toHaveBeenNthCalledWith(2, '/scm/productos/', { params: { page: 2 } })
  })

  it('conserva los registros si la última página usa el formato de arreglo', async () => {
    const get = vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { results: [{ id: 1 }], next: '?page=2' } })
      .mockResolvedValueOnce({ data: [{ id: 2 }] })
    await expect(obtenerTodasLasPaginas('/scm/productos/')).resolves.toEqual([{ id: 1 }, { id: 2 }])
    expect(get).toHaveBeenCalledTimes(2)
  })
})
