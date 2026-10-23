import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'
import globals from 'globals'
import { archivosAplicacion, archivosHerramientas } from './scripts/alcance-calidad.mjs'

const archivos = [...archivosAplicacion, ...archivosHerramientas]

export default defineConfig(
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'reports/**', 'logs/**'] },
  {
    files: archivos,
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.browser }
  },
  {
    files: archivosHerramientas,
    languageOptions: { globals: globals.node }
  },
  {
    files: [...archivosAplicacion, 'tests/**/*.ts', 'vitest.config.ts'],
    extends: [ts.configs.recommended]
  },
  {
    files: archivosAplicacion.filter(archivo => archivo.endsWith('.vue')),
    // Reglas de Vue para prevenir errores; el formato existente se conserva.
    extends: [vue.configs['flat/essential']],
    languageOptions: {
      parserOptions: { parser: ts.parser, extraFileExtensions: ['.vue'] }
    }
  }
)
