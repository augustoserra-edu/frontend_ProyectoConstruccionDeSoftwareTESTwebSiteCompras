import assert from 'node:assert/strict'
import { test } from 'vitest'
import axios from 'axios'
import api from '../src/api/clienteAxios.ts'
import * as proveedores from '../src/services/proveedoresService.ts'

localStorage.setItem('access_token', 'token-prueba')
let handler
api.defaults.adapter = async config => { assert.equal(config.headers.Authorization, 'Bearer token-prueba'); return handler(config) }
const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })

test('Los catálogos consultan todas las páginas sin seguir direcciones externas', async () => {
  for (const [load, url] of [[proveedores.obtenerProveedores, '/compras/proveedores/'], [proveedores.obtenerCatalogoProductosProveedor, '/scm/productos/']]) {
    const pages = []
    const rows = url.includes('proveedores') ? [{ proveedor_id: 1, productos: [5] }, { proveedor_id: 2, productos: [5, 6] }] : [{ id: 1, nombre: 'Cemento', codigo: 'CEM', precio: 100, rubro: 1 }, { id: 2, nombre: 'Arena', codigo: 'ARE', precio: 200, rubro: 1 }]
    handler = config => {
      assert.equal(config.url, url)
      pages.push(config.params.page)
      return response(config, config.params.page === 1 ? { results: [rows[0]], next: 'http://internal/api/?page=2' } : { results: [rows[1]], next: null })
    }
    assert.deepEqual(await load(), rows)
    assert.deepEqual(pages, [1, 2])
  }
})

test('Los registros del formato anterior conservan sus asociaciones y bloquean escrituras incompatibles', async () => {
  handler = config => response(config, { results: [{ proveedor_id: 4, producto_id: 17 }], next: null })
  assert.deepEqual(await proveedores.obtenerProveedores(), [{ proveedor_id: 4, productos: [17] }])
  assert.equal(proveedores.relacionMultipleDisponible.value, false)
  await assert.rejects(proveedores.crearProveedor({ productos: [17, 18] }))
  handler = config => response(config, { results: [{ proveedor_id: 4, productos: [17, 18] }], next: null })
  await proveedores.obtenerProveedores()
  assert.equal(proveedores.relacionMultipleDisponible.value, true)
})

test('El primer proveedor envía precios de compra aunque el listado esté vacío', async () => {
  handler = config => response(config, { results: [], next: null })
  assert.deepEqual(await proveedores.obtenerProveedores(), [])
  const payload = { nombre: 'Proveedor', apellido: 'SA', cuit: '30111000111', email: '', telefono: '', direccion: '', productos: [2, 7] }
  handler = config => {
    assert.equal(config.method, 'post')
    assert.deepEqual(JSON.parse(config.data), { ...payload, productos: [{ producto_id: 2, precio_compra: '12.50' }, { producto_id: 7, precio_compra: '0.00' }] })
    return response(config, { proveedor_id: 9, ...payload })
  }
  assert.deepEqual((await proveedores.crearProveedor({ ...payload, preciosCompra: { 2: 12.5, 7: 0 } })).productos, [2, 7])
  handler = config => {
    assert.equal(config.method, 'patch')
    assert.equal(config.url, '/compras/proveedores/9/')
    assert.deepEqual(JSON.parse(config.data), { productos: [{ producto_id: 7, precio_compra: '0.00' }, { producto_id: 8, precio_compra: '20.00' }] })
    return response(config, { proveedor_id: 9, ...payload, productos: [7, 8] })
  }
  assert.deepEqual((await proveedores.actualizarProveedor(9, { productos: [7, 8], preciosCompra: { 7: 0, 8: 20 } })).productos, [7, 8])
  handler = config => { throw new axios.AxiosError('Invalid', 'ERR_BAD_REQUEST', config, null, { status: 400, data: { cuit: ['Ya existe un proveedor con ese CUIT.'] } }) }
  await assert.rejects(proveedores.crearProveedor({ ...payload, preciosCompra: { 2: 12.5, 7: 0 } }), error => error.response.status === 400)
})


test('El catálogo conserva identificadores y códigos, normaliza valores y no inventa productos', async () => {
  handler = config => response(config, [{ producto_id: 80, nombre: 'Producto real', codigo: 'REAL-80', precio: '12.50', rubro_nombre: 'Materiales' }])
  assert.deepEqual(await proveedores.obtenerCatalogoProductosProveedor(), [{ id: 80, nombre: 'Producto real', codigo: 'REAL-80', precio: 12.5, rubro: 'Materiales' }])
  handler = config => response(config, { results: [], next: null })
  assert.deepEqual(await proveedores.obtenerCatalogoProductosProveedor(), [])
  handler = () => { throw new Error('No disponible') }
  await assert.rejects(proveedores.obtenerCatalogoProductosProveedor(), /No disponible/)
})

test('La edición normaliza identificadores de productos y conserva precios en el formato de la API', async () => {
  const raw = { proveedor_id: 9, productos: [{ producto_id: '2', precio_compra: '12.50' }, { producto_id: 7, precio_compra: '0.00' }] }
  handler = config => response(config, [raw])
  const [supplier] = await proveedores.obtenerProveedores()
  assert.deepEqual(supplier.productos, [2, 7])
  assert.deepEqual(supplier.preciosCompra, { 2: 12.5, 7: 0 })
  handler = config => {
    assert.equal(config.method, 'patch')
    assert.deepEqual(JSON.parse(config.data), { productos: [{ producto_id: 2, precio_compra: '12.50' }, { producto_id: 7, precio_compra: '0.00' }] })
    return response(config, raw)
  }
  const saved = await proveedores.actualizarProveedor(9, { productos: supplier.productos, preciosCompra: supplier.preciosCompra })
  assert.deepEqual(saved, supplier)
  handler = () => { assert.fail('Los precios inválidos no deben enviarse a la API') }
  await assert.rejects(proveedores.actualizarProveedor(9, { productos: [2], preciosCompra: { 2: null } }), /precio de compra/)
  handler = config => response(config, { proveedor_id: 9, productos: ['2', 7, '2'] })
  assert.deepEqual((await proveedores.obtenerProveedorPorId(9)).productos, [2, 7])
})
