import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalProveedor from '../src/components/ModalProveedor.vue'

const productos = [{ id: 5, nombre: 'Cemento', codigo: 'CEM', precio: 20 }]
const proveedor = { proveedor_id: 1, nombre: 'Materiales', apellido: 'Sur', cuit: '20442152099', email: 'a@empresa.com', telefono: '+541112345678', direccion: 'Calle 1', productos: [5], preciosCompra: { 5: 10 } }
const props = { mostrar: true, proveedorAEditar: null, productos, guardando: false, error: '' }

describe('Proveedor: formulario aislado', () => {
  test('CP-P01: alta válida emite datos normalizados y precios, sin llamar a la API', async () => {
    const w = mount(ModalProveedor, { props })
    await w.get('input[placeholder="Ej: Loma Negra"]').setValue('  Materiales   Sur  ')
    await w.get('input[placeholder="Ej: S.A."]').setValue('SA')
    await w.get('input[placeholder="30-00000000-0"]').setValue('20-44215209-9')
    await w.get('input[type="email"]').setValue('ventas@empresa.com')
    await w.get('#proveedor-producto-5').setValue(true)
    await w.get('#proveedor-precio-5').setValue('12.50')
    await w.get('form').trigger('submit')
    expect(w.emitted('guardar')?.[0]?.[0]).toMatchObject({ nombre: 'Materiales Sur', cuit: '20442152099', productos: [5], preciosCompra: { 5: 12.5 } })
  })
  test('CP-P02: filtra CUIT y teléfono al escribir o pegar, incluido límite 14', async () => {
    const w = mount(ModalProveedor, { props })
    const cuit = w.get('input[placeholder="30-00000000-0"]')
    await cuit.setValue('xx20-44215209-9')
    expect((cuit.element as HTMLInputElement).value).toBe('20-44215209-9')
    const telefono = w.get('input[type="tel"]')
    await telefono.setValue('++54 (11) 123456789012')
    expect((telefono.element as HTMLInputElement).value).toBe('+5411123456789')
    expect(telefono.attributes('maxlength')).toBe('14')
    const email = w.get('input[type="email"]')
    await email.setValue('a <>@empresa.com')
    expect((email.element as HTMLInputElement).value).toBe('a@empresa.com')
  })
  test('CP-P03: email sin @ bloquea el envío y muestra error', async () => {
    const w = mount(ModalProveedor, { props: { ...props, proveedorAEditar: proveedor } })
    await w.get('input[type="email"]').setValue('sin-arroba.com')
    await w.get('form').trigger('submit')
    expect(w.emitted('guardar')).toBeUndefined()
    expect(w.get('[role="alert"]').text()).toContain('@')
  })
  test('CP-P04: precio vacío o negativo bloquea; cero es válido', async () => {
    const w = mount(ModalProveedor, { props: { ...props, proveedorAEditar: proveedor } })
    for (const valor of ['', '-1']) {
      await w.get('#proveedor-precio-5').setValue(valor)
      await w.get('form').trigger('submit')
      expect(w.emitted('guardar')).toBeUndefined()
      expect(w.text()).toContain('precio de compra válido')
    }
    await w.get('#proveedor-precio-5').setValue('0')
    await w.get('form').trigger('submit')
    expect(w.emitted('guardar')).toHaveLength(1)
  })
  test('CP-P05: catálogo, búsqueda, cierre y estado guardando', async () => {
    const w = mount(ModalProveedor, { props: { ...props, proveedorAEditar: { ...proveedor, productos: [5, 99] } } })
    expect(w.text()).toContain('Producto #99')
    await w.get('.alert-warning button').trigger('click')
    expect(w.text()).not.toContain('Producto #99')
    await w.get('#buscar-producto-proveedor').setValue('inexistente')
    expect(w.text()).toContain('No se encontraron productos')
    await w.setProps({ guardando: true, error: 'CUIT duplicado' })
    await w.get('form').trigger('submit')
    expect(w.emitted('guardar')).toBeUndefined()
    expect(w.get('fieldset').attributes()).toHaveProperty('disabled')
    expect(w.text()).toContain('CUIT duplicado')
    await w.setProps({ guardando: false })
    await w.get('[aria-label="Cerrar"]').trigger('click')
    expect(w.emitted('cerrar')).toHaveLength(1)
    await w.setProps({ mostrar: false })
    expect(w.find('form').exists()).toBe(false)
    await w.setProps({ mostrar: true, proveedorAEditar: null, productos: [] })
    expect(w.text()).toContain('No hay productos disponibles')
  })
})
