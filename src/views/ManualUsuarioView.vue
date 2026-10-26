<script setup lang="ts">
import { ref } from 'vue'

interface ItemManual {
  id: string
  titulo: string
  contenido: string
  puntosClave?: string[]
}

const guiaAdministrativos: ItemManual[] = [
  {
    id: 'guia-alta-producto',
    titulo: '1. ¿Cómo dar de alta un producto en el catálogo?',
    contenido:
      'Para registrar un nuevo artículo, ingrese al módulo "Sistemas Administrativos" y seleccione "Catálogo de Productos" en el panel lateral. Haga clic en el botón "+ Nuevo Producto" y complete los datos requeridos: Nombre, Rubro, Descripción y Stock Mínimo de Reposición.',
    puntosClave: [
      'Rubros: Clasifican la mercadería (ej. Obra Gruesa, Hierros y Aceros, Pinturería) para agilizar búsquedas y reportes.',
      'Stock Mínimo y Punto de Reposición: Define el umbral crítico de unidades; cuando el stock actual es igual o inferior a este valor, el sistema alerta visualmente la necesidad de reposición.',
      'Sin Precio Unitario Directo en el Alta: El catálogo general define la ficha técnica del material. Los precios de compra se administran en base a las listas pactadas con cada proveedor asociado, mientras que el precio de venta se gestiona comercialmente.'
    ]
  },
  {
    id: 'guia-historial-movimientos',
    titulo: '2. ¿Cómo consultar el historial de movimientos de un producto?',
    contenido:
      'En la tabla principal del "Catálogo de Productos", ubique el material deseado y presione el botón con el ícono de ojo ("Ver Movimientos") en la columna de Acciones. Se desplegará una ventana con el registro cronológico de entradas, salidas, ajustes de inventario y órdenes vinculadas.',
    puntosClave: [
      'Permite auditar ingresos por órdenes de compra y egresos por ventas o devoluciones.',
      'Muestra fecha, tipo de movimiento, cantidad involucrada y observación respaldatoria.'
    ]
  },
  {
    id: 'guia-inhabilitar-producto',
    titulo: '3. ¿Qué implica inhabilitar un producto y cómo reactivarlo?',
    contenido:
      'Al presionar el botón de baja ("✕") en la fila de un producto y confirmar la acción en el cuadro de diálogo, se realiza una baja lógica del artículo. El producto no se elimina de la base de datos para preservar la integridad histórica de facturas, ventas y movimientos previos.',
    puntosClave: [
      'Efecto inmediato: El artículo deja de figurar en el listado activo de ventas y pedidos nuevos.',
      'Reactivación: Para volver a habilitar un producto inactivo, un administrador o supervisor con acceso al padrón completo puede actualizar su estado activo desde la gestión de catálogo o solicitar su restablecimiento al área de sistemas.'
    ]
  },
  {
    id: 'guia-carga-stock',
    titulo: '4. ¿Cómo funciona la carga de stock y la solicitud de reposición al proveedor?',
    contenido:
      'Desde la opción "Cargar Stock" del menú lateral en Sistemas Administrativos, seleccione haciendo clic en la fila del producto que desea reabastecer y presione el botón superior "Reponer Stock".',
    puntosClave: [
      'Selección de proveedor: El formulario filtra automáticamente los proveedores que suministran ese artículo y muestra el precio unitario pactado.',
      'Proyección automática: Al ingresar la cantidad entera a solicitar, el sistema calcula el costo total proyectado de la orden y el stock resultante.',
      'Integración con Compras: Al confirmar, se emite una Orden de Compra formal que queda registrada en el módulo de Proveedores y Compra para su seguimiento y recepción.'
    ]
  }
]

const preguntasFrecuentes: ItemManual[] = [
  {
    id: 'faq-error-conexion',
    titulo: '¿Qué hacer si el sistema muestra una alerta de error de conexión?',
    contenido:
      'Si al guardar un registro o consultar listados aparece una alerta indicando que no se pudo conectar con el servidor, verifique en primer lugar su conexión de red local y que el servicio backend (API) se encuentre en ejecución.',
    puntosClave: [
      'Intente recargar la operación transcurridos unos segundos.',
      'Si la alerta indica que la sesión venció (Error 401), cierre sesión desde el botón superior derecho y vuelva a ingresar con sus credenciales.',
      'Si el inconveniente persiste (Error 500), comuníquese con el área técnica indicando la acción que intentaba realizar.'
    ]
  },
  {
    id: 'faq-navegacion-modulos',
    titulo: '¿Cómo navegar entre los distintos módulos desde la barra superior?',
    contenido:
      'La barra de navegación superior permanece visible en todo momento y permite alternar directamente entre las cuatro áreas troncales del sistema: Finanzas, Sistemas Administrativos, Proveedores y Compra, y Ventas.',
    puntosClave: [
      'Al seleccionar un módulo en la barra superior, el menú lateral izquierdo (Sidebar) actualiza automáticamente sus opciones con las herramientas específicas de ese sector.',
      'Haciendo clic sobre el logo "EL CORRALON" en la esquina superior izquierda puede regresar en cualquier momento a la pantalla de bienvenida.'
    ]
  },
  {
    id: 'faq-permisos-roles',
    titulo: '¿Cómo se administran los permisos y roles del operador?',
    contenido:
      'Cada operador accede al sistema mediante credenciales individuales autenticadas por token seguro (JWT). Las operaciones críticas —como cierres contables, inhabilitación de registros y emisión de órdenes— quedan asociadas a la sesión activa.',
    puntosClave: [
      'Mantenga la confidencialidad de su usuario y contraseña.',
      'Utilice siempre el botón "Cerrar sesión" al finalizar su turno o al retirarse del puesto de trabajo.'
    ]
  }
]

const itemAbiertoGuia = ref<string>('guia-alta-producto')
const itemAbiertoFaq = ref<string>('faq-error-conexion')

function alternarGuia(id: string) {
  itemAbiertoGuia.value = itemAbiertoGuia.value === id ? '' : id
}

function alternarFaq(id: string) {
  itemAbiertoFaq.value = itemAbiertoFaq.value === id ? '' : id
}
</script>

<template>
  <div class="container py-4">
    <!-- Encabezado Institucional -->
    <div class="card border-0 shadow-sm mb-4 header-manual text-white overflow-hidden">
      <div class="card-body p-4 p-md-5">
        <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <span class="badge badge-acento text-uppercase fw-semibold mb-2 px-3 py-1">
              Centro de Documentación y Ayuda
            </span>
            <h2 class="fw-bold mb-2">Manual de Usuario y Preguntas Frecuentes</h2>
            <p class="mb-0 text-white-50">
              Guía operativa detallada para la gestión de inventario, catálogo de productos y uso general del sistema del corralón.
            </p>
          </div>
          <div class="icono-cabecera d-none d-md-flex align-items-center justify-content-center rounded-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Sección A: Guía Operativa de Sistemas Administrativos -->
      <div class="col-12">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-header seccion-header text-white py-3 px-4 d-flex align-items-center gap-2">
            <span class="badge badge-acento">Sección A</span>
            <h5 class="fw-bold mb-0 fs-6">Guía Operativa de Sistemas Administrativos (Inventario y Catálogo)</h5>
          </div>
          <div class="card-body p-3 p-md-4 bg-white">
            <div class="accordion" id="accordionGuiaAdministrativos">
              <div
                v-for="item in guiaAdministrativos"
                :key="item.id"
                class="accordion-item border rounded mb-2 overflow-hidden"
              >
                <h2 class="accordion-header" :id="`heading-${item.id}`">
                  <button
                    class="accordion-button fw-semibold text-dark"
                    :class="{ collapsed: itemAbiertoGuia !== item.id }"
                    type="button"
                    :aria-expanded="itemAbiertoGuia === item.id"
                    :aria-controls="`collapse-${item.id}`"
                    @click="alternarGuia(item.id)"
                  >
                    {{ item.titulo }}
                  </button>
                </h2>
                <div
                  :id="`collapse-${item.id}`"
                  class="accordion-collapse collapse"
                  :class="{ show: itemAbiertoGuia === item.id }"
                  :aria-labelledby="`heading-${item.id}`"
                >
                  <div class="accordion-body bg-light-subtle text-secondary">
                    <p class="mb-3">{{ item.contenido }}</p>
                    <ul v-if="item.puntosClave && item.puntosClave.length" class="mb-0 ps-3 small">
                      <li v-for="(punto, idx) in item.puntosClave" :key="idx" class="mb-1">
                        {{ punto }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección B: Preguntas Frecuentes Generales (FAQs) -->
      <div class="col-12">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-header seccion-header text-white py-3 px-4 d-flex align-items-center gap-2">
            <span class="badge badge-acento">Sección B</span>
            <h5 class="fw-bold mb-0 fs-6">Preguntas Frecuentes Generales (FAQs)</h5>
          </div>
          <div class="card-body p-3 p-md-4 bg-white">
            <div class="accordion" id="accordionPreguntasFrecuentes">
              <div
                v-for="faq in preguntasFrecuentes"
                :key="faq.id"
                class="accordion-item border rounded mb-2 overflow-hidden"
              >
                <h2 class="accordion-header" :id="`heading-${faq.id}`">
                  <button
                    class="accordion-button fw-semibold text-dark"
                    :class="{ collapsed: itemAbiertoFaq !== faq.id }"
                    type="button"
                    :aria-expanded="itemAbiertoFaq === faq.id"
                    :aria-controls="`collapse-${faq.id}`"
                    @click="alternarFaq(faq.id)"
                  >
                    {{ faq.titulo }}
                  </button>
                </h2>
                <div
                  :id="`collapse-${faq.id}`"
                  class="accordion-collapse collapse"
                  :class="{ show: itemAbiertoFaq === faq.id }"
                  :aria-labelledby="`heading-${faq.id}`"
                >
                  <div class="accordion-body bg-light-subtle text-secondary">
                    <p class="mb-3">{{ faq.contenido }}</p>
                    <ul v-if="faq.puntosClave && faq.puntosClave.length" class="mb-0 ps-3 small">
                      <li v-for="(punto, idx) in faq.puntosClave" :key="idx" class="mb-1">
                        {{ punto }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-manual {
  background-color: #231f1d;
  border-bottom: 4px solid #b33e14 !important;
}

.seccion-header {
  background-color: #231f1d;
  border-bottom: 3px solid #b33e14 !important;
}

.badge-acento {
  background-color: #b33e14;
  color: #ffffff;
  letter-spacing: 0.4px;
}

.icono-cabecera {
  width: 64px;
  height: 64px;
  background-color: rgba(179, 62, 20, 0.2);
  color: #ff7a45;
  border: 1px solid rgba(255, 122, 69, 0.35);
  flex-shrink: 0;
}

.accordion-button:not(.collapsed) {
  background-color: #fbeee8;
  color: #231f1d !important;
  box-shadow: inset 0 -1px 0 rgba(179, 62, 20, 0.2);
  border-left: 4px solid #b33e14;
}

.accordion-button:focus {
  border-color: #b33e14;
  box-shadow: 0 0 0 0.2rem rgba(179, 62, 20, 0.15);
}
</style>

