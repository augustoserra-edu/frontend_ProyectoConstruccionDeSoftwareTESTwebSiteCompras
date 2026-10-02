import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const cache = new Map()
function moduleURL(url) {
  if (cache.has(url)) return cache.get(url)
  const source = ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true }
  }).outputText.replace(/from ['"]([^'"]+)['"]/g, (_, name) => {
    assert.notEqual(name, 'axios', 'La simulación no debe cargar el cliente HTTP')
    return `from '${name.startsWith('.') ? moduleURL(new URL(`${name}.ts`, url).href) : import.meta.resolve(name)}'`
  })
  const result = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  cache.set(url, result)
  return result
}
const proveedores = await import(moduleURL(new URL('../src/services/proveedoresService.ts', import.meta.url).href))
const compras = await import(moduleURL(new URL('../src/services/comprasService.ts', import.meta.url).href))
const productos = await import(moduleURL(new URL('../src/services/productosService.ts', import.meta.url).href))

test('proveedor nuevo compartido, orden, estados y consulta funcionan sin API', async () => {
  const catalogo = await productos.obtenerProductosProveedor()
  assert.ok(catalogo.length >= 4)
  const proveedor = await proveedores.crearProveedor({ nombre: 'Prueba', apellido: 'SRL', cuit: '30-12345678-9', email: '', telefono: '', direccion: '', productos: [1, 3] })
  assert.ok((await proveedores.obtenerProveedores()).some(p => p.proveedor_id === proveedor.proveedor_id))
  const datos = { cabecera: { proveedor_id: proveedor.proveedor_id, fecha: '2026-10-02', total: 1 }, detalles: [{ producto_id: 1, cantidad: 2, preciounitario: 9800 }] }
  const orden = await compras.crearOrdenCompra(datos)
  assert.equal(orden.total, '19600.00')
  assert.equal(compras.presentarOrden(orden, await compras.obtenerEstadosCompra()).estado, 'pendiente')
  assert.equal(compras.presentarDetalles(orden)[0].subtotal, 19600)
  assert.equal((await compras.actualizarEstadoCompra(orden.ordencompra_id, 2)).estado, 2)
  assert.equal((await compras.actualizarEstadoCompra(orden.ordencompra_id, 4)).estado, 4)
  await assert.rejects(compras.actualizarEstadoCompra(orden.ordencompra_id, 1))
  assert.equal((await compras.obtenerOrdenesCompra()).find(o => o.ordencompra_id === orden.ordencompra_id).estado, 4)
  await assert.rejects(proveedores.eliminarProveedor(proveedor.proveedor_id))
  assert.ok((await compras.obtenerFacturasCompra()).length)
})

test('rechaza cantidades inválidas, productos ajenos, duplicados y CUIT repetido', async () => {
  const datos = { cabecera: { proveedor_id: 1, fecha: '2026-10-02', total: 100 }, detalles: [{ producto_id: 1, cantidad: 1, preciounitario: 9800 }] }
  const antes = (await compras.obtenerOrdenesCompra()).length
  for (const cantidad of [0, -1, 1.5, NaN, Infinity]) {
    await assert.rejects(compras.crearOrdenCompra({ ...datos, detalles: [{ ...datos.detalles[0], cantidad }] }))
  }
  await assert.rejects(compras.crearOrdenCompra({ ...datos, detalles: [{ ...datos.detalles[0], producto_id: 4 }] }))
  await assert.rejects(compras.crearOrdenCompra({ ...datos, detalles: [datos.detalles[0], datos.detalles[0]] }))
  assert.equal((await compras.obtenerOrdenesCompra()).length, antes)
  const existente = await proveedores.obtenerProveedorPorId(1)
  await assert.rejects(proveedores.crearProveedor(existente), /CUIT/)
  await assert.rejects(proveedores.crearProveedor({ ...existente, cuit: '123' }), /CUIT/)
})

test('editar y consultar devuelve copias sin mutaciones accidentales', async () => {
  const original = await proveedores.obtenerProveedorPorId(1)
  original.productos.length = 0
  assert.ok((await proveedores.obtenerProveedorPorId(1)).productos.length)
  const actualizado = await proveedores.actualizarProveedor(1, { nombre: 'Nombre editado' })
  assert.equal(actualizado.nombre, 'Nombre editado')
  assert.equal((await proveedores.obtenerProveedorPorId(1)).nombre, 'Nombre editado')
})

test('bloquea quitar productos pendientes sin guardar cambios parciales', async () => {
  const anterior = await proveedores.obtenerProveedorPorId(1)
  await assert.rejects(proveedores.actualizarProveedor(1, { nombre: 'No guardar', productos: [3] }), /Cemento.*pendiente de aprobación.*#301/)
  assert.deepEqual(await proveedores.obtenerProveedorPorId(1), anterior)
  await assert.rejects(proveedores.actualizarProveedor(1, { productos: [] }), /pendiente de aprobación/)
})

test('permite quitar productos ajenos a la compra y luego de aprobar o rechazar', async () => {
  assert.deepEqual((await proveedores.actualizarProveedor(2, { productos: [2, 4] })).productos, [2, 4])
  for (const estado of [2, 3]) {
    const proveedor = await proveedores.crearProveedor({ nombre: 'Validación', apellido: 'SRL', cuit: `30-1234567${estado}-0`, email: '', telefono: '', direccion: '', productos: [1, 3, 4] })
    const orden = await compras.crearOrdenCompra({ cabecera: { proveedor_id: proveedor.proveedor_id, fecha: '2026-10-02', total: 9800 }, detalles: [{ producto_id: 1, cantidad: 1, preciounitario: 9800 }] })
    await proveedores.actualizarProveedor(proveedor.proveedor_id, { productos: [1, 3] })
    await assert.rejects(proveedores.actualizarProveedor(proveedor.proveedor_id, { productos: [3] }), /pendiente de aprobación/)
    await compras.actualizarEstadoCompra(orden.ordencompra_id, estado)
    assert.deepEqual((await proveedores.actualizarProveedor(proveedor.proveedor_id, { productos: [3] })).productos, [3])
  }
})
