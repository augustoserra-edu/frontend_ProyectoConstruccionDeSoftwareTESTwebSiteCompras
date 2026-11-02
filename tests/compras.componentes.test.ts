import { test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalNuevaOrdenCompra from '../src/components/ModalNuevaOrdenCompra.vue'
import ModalVerOrdenesCompra from '../src/components/ModalVerOrdenesCompra.vue'

const proveedor = { proveedor_id: 1, nombre: 'Materiales', apellido: 'Sur', cuit: '20442152099', email: '', telefono: '', direccion: '', productos: [5, 6], preciosCompra: { 5: 10, 6: 20 } }
const productos = [{ id: 5, nombre: 'Cemento', precio: 100 }, { id: 6, nombre: 'Arena', precio: 200 }]
const props = { mostrar: true, guardando: false, error: '', proveedores: [proveedor], productos }
const boton = (w: ReturnType<typeof mount>, texto: string) => w.findAll('button').find(b => b.text().includes(texto))!

const propsConsulta = {
  mostrar: false, ordenInicialId: 1,
  ordenes: [{ ordencompra_id: 1, proveedor_id: 1, fecha: '2026-10-01', total: 20, estado: 'pendiente' }],
  proveedores: [proveedor], productos, estados: [], facturas: [],
  detalles: [{ ordencompradetalle_id: 1, ordencompra_id: 1, producto_id: 5, cantidad: 2, preciounitario: 10, subtotal: 20 }],
  cargandoFacturas: false, errorFacturas: '', actualizando: false, error: '', mensaje: ''
}

test('CP-C08: comprobantes se muestran y buscan solo en su orden asociada', async () => {
  const factura = { facturacabecera_id: 1, ordencompra_id: 1, numero: 'QA-0001', tipo: 'COMPRA', fecha: '2026-10-02', subtotal: 20, impuesto: 4.2, total: 24.2 }
  const w = mount(ModalVerOrdenesCompra, { props: {
    ...propsConsulta,
    facturas: [factura, { ...factura, facturacabecera_id: 2, ordencompra_id: 99, numero: 'AJENA-0099' }]
  } })
  await w.setProps({ mostrar: true })
  const detalle = w.get('[aria-label="Orden seleccionada"]')
  expect(detalle.text()).toContain('COMPRA · QA-0001')
  expect(detalle.text()).toContain('Impuesto')
  expect(detalle.text()).toContain('24,20')
  expect(w.text()).not.toContain('AJENA-0099')
  await w.get('input[type="search"]').setValue('QA-0001')
  expect(w.findAll('.list-group button')).toHaveLength(1)
  await w.get('input[type="search"]').setValue('AJENA-0099')
  expect(w.findAll('.list-group button')).toHaveLength(0)
})

test('CP-C09: actualizar bloquea cierre por Escape y acciones hasta terminar', async () => {
  const w = mount(ModalVerOrdenesCompra, { props: propsConsulta })
  await w.setProps({ mostrar: true, actualizando: true })
  expect(boton(w, 'Aprobar').attributes('disabled')).toBeDefined()
  expect(boton(w, 'Editar orden').attributes('disabled')).toBeDefined()
  await boton(w, 'Aprobar').trigger('click')
  await boton(w, 'Editar orden').trigger('click')
  await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
  expect(w.emitted('cerrar')).toBeUndefined()
  expect(w.emitted('editar')).toBeUndefined()
  expect(w.emitted('cambiar-estado')).toBeUndefined()
  await w.setProps({ actualizando: false })
  await boton(w, 'Aprobar').trigger('click')
  expect(w.emitted('cambiar-estado')?.[0]).toEqual([1, 'aprobada'])
  await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
  expect(w.emitted('cerrar')).toHaveLength(1)
})

test('CP-C10: orden sin renglones no se aprueba y estado desconocido no ofrece transiciones', async () => {
  const w = mount(ModalVerOrdenesCompra, { props: { ...propsConsulta, detalles: [] } })
  await w.setProps({ mostrar: true })
  expect(w.text()).toContain('Sin productos registrados')
  expect(boton(w, 'Aprobar').attributes('disabled')).toBeDefined()
  await boton(w, 'Aprobar').trigger('click')
  expect(w.emitted('cambiar-estado')).toBeUndefined()
  await w.setProps({ ordenes: [{ ...propsConsulta.ordenes[0]!, estado: 'desconocido' }] })
  expect(w.text()).toContain('No hay acciones disponibles')
  expect(w.findAll('button').some(b => ['Aprobar', 'Rechazar', 'Recibir', 'Devolver', 'Editar orden'].includes(b.text()))).toBe(false)
})

test('CP-C01: nueva orden usa precio de compra, calcula total y emite una sola orden', async () => {
  const w = mount(ModalNuevaOrdenCompra, { props })
  await w.get('form').trigger('submit')
  expect(w.emitted('guardar')).toBeUndefined()
  expect(w.get('#orden-proveedor').attributes('aria-invalid')).toBe('true')
  expect(w.get('#error-orden-proveedor').text()).toContain('Seleccioná un proveedor válido')
  await w.get('#orden-proveedor').setValue(1)
  await w.get('select[id^="producto-"]').setValue(5)
  await w.get('input[id^="cantidad-"]').setValue('3')
  await w.get('form').trigger('submit')
  expect(w.emitted('guardar')?.[0]?.[0]).toMatchObject({ cabecera: { proveedor_id: 1, total: 30 }, detalles: [{ producto_id: 5, cantidad: 3, preciounitario: 10 }] })
  await w.setProps({ guardando: true })
  await w.get('form').trigger('submit')
  expect(w.emitted('guardar')).toHaveLength(1)
})

test('CP-C02: cantidades inválidas, búsqueda y renglones duplicados', async () => {
  const w = mount(ModalNuevaOrdenCompra, { props })
  await w.get('#orden-proveedor').setValue(1)
  await w.get('select[id^="producto-"]').setValue(5)
  const cantidad = w.get('input[id^="cantidad-"]')
  for (const valor of ['1.5', '-1', '2147483648', 'abc']) {
    await cantidad.setValue(valor)
    expect((cantidad.element as HTMLInputElement).value).toBe('1')
  }
  await cantidad.setValue('0')
  await w.get('form').trigger('submit')
  expect(w.emitted('guardar')).toBeUndefined()
  expect(cantidad.attributes('aria-invalid')).toBe('true')
  expect(w.get('#' + cantidad.attributes('aria-describedby')).text()).toContain('Ingresá una cantidad entera de 1 a 2147483647')
  await cantidad.setValue('2')
  expect(cantidad.attributes('aria-invalid')).toBe('false')
  await boton(w, 'Agregar producto').trigger('click')
  expect(w.findAll('select[id^="producto-"]')[1]!.findAll('option').map(o => o.attributes('value'))).not.toContain('5')
  await w.get('#buscar-proveedor').setValue('sin coincidencias')
  expect(w.get('#orden-proveedor').find('option[hidden]').exists()).toBe(true)
  await w.get('input[id^="buscar-producto-"]').setValue('zzzz')
  expect(w.text()).toContain('No se encontraron productos')
  await w.get('[aria-label="Quitar producto 2"]').trigger('click')
  await boton(w, 'Cerrar').trigger('click')
  expect(w.emitted('cerrar')).toHaveLength(1)
})

test('CP-C03: edición conserva precio histórico y rechaza productos repetidos', async () => {
  const detalle = { ordencompradetalle_id: 1, producto_id: 5, cantidad: 2, precio_unitario: '8.00' }
  const orden = { ordencompra_id: 1, proveedor: 1, fecha: '2026-10-01', estado: 1, total: '16.00', detalles: [detalle] }
  const w = mount(ModalNuevaOrdenCompra, { props: { ...props, ordenAEditar: orden } })
  await w.get('form').trigger('submit')
  expect(w.emitted('guardar')?.[0]?.[0]).toMatchObject({ cabecera: { fecha: '2026-10-01', total: 16 } })
  await w.setProps({ mostrar: false })
  await w.setProps({ mostrar: true, ordenAEditar: { ...orden, detalles: [detalle, { ...detalle, ordencompradetalle_id: 2 }] } })
  await w.get('form').trigger('submit')
  expect(w.text()).toContain('Cada producto puede aparecer una sola vez')
  expect(w.emitted('guardar')).toHaveLength(1)
})

test('CP-C04: detalle muestra acciones según estado, factura y filtros', async () => {
  const ordenes = [{ ordencompra_id: 1, proveedor_id: 1, fecha: '2026-10-01', total: 20, estado: 'pendiente' }, { ordencompra_id: 2, proveedor_id: 1, fecha: '2026-10-02', total: 10, estado: 'recibida' }]
  const w = mount(ModalVerOrdenesCompra, { props: {
    mostrar: false, ordenInicialId: 1, ordenes, proveedores: [proveedor], productos,
    estados: [], facturas: [], detalles: [{ ordencompradetalle_id: 1, ordencompra_id: 1, producto_id: 5, cantidad: 2, preciounitario: 10, subtotal: 20 }],
    cargandoFacturas: false, errorFacturas: '', actualizando: false, error: '', mensaje: ''
  } })
  await w.setProps({ mostrar: true })
  expect(w.text()).toContain('Aprobar')
  await boton(w, 'Aprobar').trigger('click')
  expect(w.emitted('cambiar-estado')?.[0]).toEqual([1, 'aprobada'])
  await boton(w, 'Editar').trigger('click')
  expect(w.emitted('editar')?.[0]).toEqual([1])
  await w.findAll('.list-group button').find(b => b.text().includes('Orden #2'))!.trigger('click')
  expect(w.text()).toContain('La orden está disponible para facturar en Finanzas')
  expect(w.findAll('button').some(b => b.text() === 'Contabilizar')).toBe(false)
  await w.setProps({ errorFacturas: 'Error de conexión' })
  await boton(w, 'Reintentar').trigger('click')
  expect(w.emitted('reintentar-facturas')).toHaveLength(1)
  await w.get('input[type="search"]').setValue('ninguna')
  expect(w.findAll('.list-group button')).toHaveLength(0)
  await w.get('[aria-label="Cerrar"]').trigger('click')
  expect(w.emitted('cerrar')).toHaveLength(1)
})
