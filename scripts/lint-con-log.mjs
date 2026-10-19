import { ESLint } from 'eslint'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { archivosAplicacion, archivosHerramientas } from './alcance-calidad.mjs'

const raiz = fileURLToPath(new URL('../', import.meta.url))
const inicio = new Date()
const carpeta = join(raiz, 'logs', 'lint')
await mkdir(carpeta, { recursive: true })
await mkdir(join(raiz, 'reports'), { recursive: true })
const archivo = join(carpeta, `${inicio.toISOString().replace(/[:.]/g, '-')}-${process.pid}.log`)
let revision = 'No disponible'
try {
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: raiz, encoding: 'utf8' }).trim()
  const cambios = execFileSync('git', ['status', '--porcelain'], { cwd: raiz, encoding: 'utf8' }).trim()
  revision = `${commit}${cambios ? ' (con cambios locales)' : ''}`
} catch { /* También funciona sin un checkout Git. */ }

let registro = ''
function escribir(texto) {
  registro += texto
  process.stdout.write(texto)
}
escribir(`Inicio (UTC): ${inicio.toISOString()}\nNode: ${process.version}\nESLint: ${ESLint.version}\nRevisión: ${revision}\nAlcance: Compras/Proveedores y sus herramientas de pruebas\nLog: ${archivo}\n\n`)
try {
  const eslint = new ESLint({ cwd: raiz })
  const resultados = await eslint.lintFiles([...archivosAplicacion, ...archivosHerramientas])
  const formato = await eslint.loadFormatter('stylish')
  escribir(formato.format(resultados))
  const errores = resultados.reduce((suma, resultado) => suma + resultado.errorCount, 0)
  const advertencias = resultados.reduce((suma, resultado) => suma + resultado.warningCount, 0)
  const resumen = {
    inicio: inicio.toISOString(), revision, eslint: ESLint.version,
    archivos: resultados.length, errores, advertencias,
    aprobado: errores === 0 && advertencias === 0
  }
  await writeFile(join(raiz, 'reports/eslint.json'), JSON.stringify(resultados, null, 2))
  await writeFile(join(raiz, 'reports/eslint-summary.json'), JSON.stringify(resumen, null, 2))
  escribir(`Archivos analizados: ${resumen.archivos}\nErrores: ${errores}\nAdvertencias: ${advertencias}\nResultado: ${resumen.aprobado ? 'APROBADO' : 'FALLIDO'}\n`)
  process.exitCode = resumen.aprobado ? 0 : 1
} catch (error) {
  escribir(`No se pudo completar el análisis: ${error instanceof Error ? error.stack : String(error)}\nResultado: FALLIDO\n`)
  process.exitCode = 1
} finally {
  escribir(`Fin (UTC): ${new Date().toISOString()}\nDuración: ${Date.now() - inicio.getTime()} ms\nCódigo de salida: ${process.exitCode}\n`)
  await writeFile(archivo, registro, { flag: 'wx' })
}
