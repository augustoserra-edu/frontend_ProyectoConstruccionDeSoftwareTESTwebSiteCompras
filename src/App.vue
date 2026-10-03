<script setup lang="ts">
import { ref, computed } from 'vue'
import Navbar from './components/Navbar.vue'
import SideBar, { type AccionSidebar } from './components/SideBar.vue'
import LoginView from './views/LoginView.vue'
import ProveedoresView from './views/ProveedoresView.vue'
import OrdenesDeCompras from './views/OrdenesDeCompras.vue'
import ProductosView from './views/ProductosView.vue'
import CargarStockView from './views/CargarStockView.vue'
import ClientesView from './views/ClientesView.vue'
import RegistrarVentaView from './views/RegistrarVentaView.vue'
import DevolucionesView from './views/DevolucionesView.vue'
import FinanzasFacturacionView from './views/FinanzasFacturacionView.vue'
import FinanzasCierreView from './views/FinanzasCierreView.vue'
import FinanzasPeriodosView from './views/FinanzasPeriodosView.vue'

const estaAutenticado = ref(!!localStorage.getItem('access_token'))

function alIniciarSesion() {
  estaAutenticado.value = true
}

const moduloActivo = ref('administrativos')

const subVistaActiva = ref<'opcion1' | 'opcion2' | 'opcion3'>('opcion2')

function cambiarModulo(nuevoModulo: string) {
  moduloActivo.value = nuevoModulo
  subVistaActiva.value = 'opcion1'
}

const accionesSidebar = computed<{
  accion1: AccionSidebar
  accion2: AccionSidebar
  accion3?: AccionSidebar
}>(() => {
  if (moduloActivo.value === 'finanzas') {
    return {
      accion1: {
        titulo: 'Facturar Órdenes',
        descripcion: 'Emisión de comprobantes contables'
      },
      accion2: {
        titulo: 'Cierre y Libro Diario',
        descripcion: 'Cierre mensual y asientos contables'
      },
      accion3: {
        titulo: 'Crear Período',
        descripcion: 'Gestión de períodos contables'
      }
    }
  }

  if (moduloActivo.value === 'administrativos') {
    return {
      accion1: {
        titulo: 'Catálogo de Productos',
        descripcion: 'Gestión de artículos, precios y stock mínimo'
      },
      accion2: {
        titulo: 'Cargar Stock',
        descripcion: 'Ingreso manual de mercadería a inventario'
      },
      accion3: undefined
    }
  }

  if (moduloActivo.value === 'proveedores') {
    return {
      accion1: {
        titulo: 'Gestión de Proveedores',
        descripcion: 'Alta, consulta y modificación de proveedores'
      },
      accion2: {
        titulo: 'Órdenes de Compra',
        descripcion: 'Consultar y registrar compras a proveedores'
      },
      accion3: undefined
    }
  }

  if (moduloActivo.value === 'ventas') {
    return {
      accion1: {
        titulo: 'ABM de clientes',
        descripcion: 'Alta, baja y modificación'
      },
      accion2: {
        titulo: 'Registrar venta / Nueva factura',
        descripcion: 'Buscar cliente por CUIL y facturar'
      },
      accion3: {
        titulo: 'Devoluciones',
        descripcion: 'Historial, anulaciones y notas de crédito'
      }
    }
  }

  return {
    accion1: {
      titulo: 'Acción Principal',
      descripcion: 'Detalle de la acción'
    },
    accion2: {
      titulo: 'Acción Secundaria',
      descripcion: 'Detalle de la acción secundaria'
    },
    accion3: undefined
  }
})
</script>

<template>
  <LoginView v-if="!estaAutenticado" @sesion-iniciada="alIniciarSesion" />

  <div v-else class="d-flex flex-column min-vh-100 bg-light">
    <Navbar
      :modulo-activo="moduloActivo"
      @cambiar-modulo="cambiarModulo"
    />

    <div class="d-flex flex-grow-1">
      <SideBar
        :accion1="accionesSidebar.accion1"
        :accion2="accionesSidebar.accion2"
        :accion3="accionesSidebar.accion3"
        :sub-vista-activa="subVistaActiva"
        @seleccionar-accion="(opcion) => subVistaActiva = opcion"
      />

      <main class="flex-grow-1 p-4">
        <template v-if="moduloActivo === 'finanzas'">
          <FinanzasFacturacionView v-if="subVistaActiva === 'opcion1'" />
          <FinanzasCierreView v-else-if="subVistaActiva === 'opcion2'" />
          <FinanzasPeriodosView v-else-if="subVistaActiva === 'opcion3'" />
        </template>

        <template v-else-if="moduloActivo === 'administrativos'">
          <ProductosView v-if="subVistaActiva === 'opcion1'" />
          <CargarStockView v-else />
        </template>

        <template v-else-if="moduloActivo === 'proveedores'">
          <ProveedoresView v-if="subVistaActiva === 'opcion1'" />
          <OrdenesDeCompras v-else-if="subVistaActiva === 'opcion2'" />
        </template>

        <template v-else-if="moduloActivo === 'ventas'">
          <ClientesView v-if="subVistaActiva === 'opcion1'" />
          <RegistrarVentaView v-else-if="subVistaActiva === 'opcion2'" />
          <DevolucionesView v-else-if="subVistaActiva === 'opcion3'" />
        </template>

        <div v-else class="text-center py-5">
          <h4 class="text-muted">Módulo en construcción</h4>
        </div>
      </main>
    </div>
  </div>
</template>
