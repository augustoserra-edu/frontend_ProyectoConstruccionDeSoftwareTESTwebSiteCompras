import { vi, afterEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import axios from 'axios'

// Ninguna prueba unitaria puede salir a Render ni a otro servidor.
vi.stubEnv('VITE_API_BASE_URL', 'http://unit-tests.invalid/api')
axios.defaults.adapter = async () => { throw new Error('Solicitud HTTP sin simular en una prueba unitaria') }

enableAutoUnmount(afterEach)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn()
  }))
})
