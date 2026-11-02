import type { Component } from 'vue'
import HomeView from '../views/HomeView.vue'
import ManualUsuarioView from '../views/ManualUsuarioView.vue'
import ProductosView from '../views/ProductosView.vue'
import CargarStockView from '../views/CargarStockView.vue'
import ProveedoresView from '../views/ProveedoresView.vue'
import OrdenesDeCompras from '../views/OrdenesDeCompras.vue'
import ClientesView from '../views/ClientesView.vue'
import RegistrarVentaView from '../views/RegistrarVentaView.vue'
import DevolucionesView from '../views/DevolucionesView.vue'
import FinanzasFacturacionView from '../views/FinanzasFacturacionView.vue'
import FinanzasCierreView from '../views/FinanzasCierreView.vue'
import FinanzasPeriodosView from '../views/FinanzasPeriodosView.vue'
import LoginView from '../views/LoginView.vue'

export interface RouteDefinition {
  path: string
  name: string
  component: Component
  meta?: {
    requiresAuth?: boolean
  }
}

export const routes: RouteDefinition[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/ayuda',
    name: 'ayuda',
    component: ManualUsuarioView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/productos',
    name: 'productos',
    component: ProductosView,
    meta: { requiresAuth: true }
  },
  {
    path: '/cargar-stock',
    name: 'cargar-stock',
    component: CargarStockView,
    meta: { requiresAuth: true }
  },
  {
    path: '/proveedores',
    name: 'proveedores',
    component: ProveedoresView,
    meta: { requiresAuth: true }
  },
  {
    path: '/ordenes-compra',
    name: 'ordenes-compra',
    component: OrdenesDeCompras,
    meta: { requiresAuth: true }
  },
  {
    path: '/clientes',
    name: 'clientes',
    component: ClientesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/ventas',
    name: 'ventas',
    component: RegistrarVentaView,
    meta: { requiresAuth: true }
  },
  {
    path: '/devoluciones',
    name: 'devoluciones',
    component: DevolucionesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/finanzas/facturacion',
    name: 'finanzas-facturacion',
    component: FinanzasFacturacionView,
    meta: { requiresAuth: true }
  },
  {
    path: '/finanzas/cierre',
    name: 'finanzas-cierre',
    component: FinanzasCierreView,
    meta: { requiresAuth: true }
  },
  {
    path: '/finanzas/periodos',
    name: 'finanzas-periodos',
    component: FinanzasPeriodosView,
    meta: { requiresAuth: true }
  }
]

export default routes
