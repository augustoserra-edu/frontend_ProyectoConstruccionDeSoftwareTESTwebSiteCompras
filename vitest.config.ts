import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{mjs,ts}'],
    // Esta suite de upstream usa node:test y se ejecuta con node --test.
    exclude: ['tests/finanzas.test.mjs'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: [
        'src/components/ModalProveedor.vue',
        'src/components/ModalNuevaOrdenCompra.vue',
        'src/components/ModalVerOrdenesCompra.vue',
        'src/views/ProveedoresView.vue',
        'src/views/OrdenesDeCompras.vue',
        'src/services/comprasService.ts',
        'src/services/proveedoresService.ts',
        'src/services/paginacion.ts',
        'src/utils/validacionesCompras.ts',
        'src/directives/textoLimpio.ts'
      ],
      thresholds: { lines: 80 },
      reportsDirectory: 'coverage'
    }
  }
})
