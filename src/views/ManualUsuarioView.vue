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

const guiaVentas: ItemManual[] = [
  {
    id: 'ventas-clientes',
    titulo: '¿Cómo dar de alta o modificar un cliente?',
    contenido:
      'Ingrese al módulo "Ventas" y seleccione "ABM de Clientes". Para cargar uno nuevo presione "Nuevo Cliente" y complete los datos. Para modificar uno existente, presione el botón "Editar" que aparece en la misma fila del cliente.',
    puntosClave: [
      'CUIL / CUIT: debe tener 11 números, sin guiones, y no puede repetirse. Si ya existe un cliente con ese número, el sistema lo avisa y no guarda.',
      'Condición frente al IVA: es obligatoria, hay que elegir una de las opciones del listado.',
      'Al presionar "Guardar Cliente" el botón queda inactivo hasta que termina de guardar, para no cargar el mismo cliente dos veces.',
      'Para buscar, escriba el CUIL o el nombre en el buscador: la búsqueda se hace en el servidor.'
    ]
  },
  {
    id: 'ventas-generar-orden',
    titulo: '¿Cómo generar una orden de venta?',
    contenido:
      'En "Generar orden de venta" busque al cliente por su CUIL (11 números) con la lupa, agregue los productos desde el buscador de "Detalle de ítems", elija el método de pago y presione "Generar orden de venta".',
    puntosClave: [
      'Al buscar el cliente se muestra su nombre y condición frente al IVA. Si modifica el número de CUIL, el cliente anterior se borra y hay que buscarlo de nuevo.',
      'El tipo de comprobante lo define el sistema según la condición frente al IVA del cliente; no se elige a mano.',
      'Cada ítem muestra precio unitario y precio total. La cantidad es un número entero, mínimo 1 y como máximo el stock disponible del producto.',
      'La orden queda en estado "En proceso" y Finanzas la factura desde su sector.'
    ]
  },
  {
    id: 'ventas-boton-inactivo',
    titulo: '¿Por qué el botón "Generar orden de venta" aparece inactivo?',
    contenido:
      'El botón se habilita recién cuando la orden está completa. Debajo del botón el sistema indica qué falta.',
    puntosClave: [
      'Hay que buscar y seleccionar un cliente activo (un cliente dado de baja no puede recibir órdenes).',
      'Hay que agregar al menos un producto.',
      'Todas las cantidades deben estar entre 1 y el stock disponible. Un producto sin stock no se puede agregar.'
    ]
  },
  {
    id: 'ventas-estados',
    titulo: '¿Qué significa cada estado en "Estado orden venta" y cómo filtrar?',
    contenido:
      'La pantalla "Estado orden venta" muestra el historial de órdenes. Cada una tiene un estado: En proceso (todavía no facturada por Finanzas), Confirmada (ya facturada), Devuelta (tiene una nota de crédito) o Anulada.',
    puntosClave: [
      'Use el desplegable "Todos los estados" para ver solo las órdenes de un estado.',
      'El buscador permite encontrar una orden por número de comprobante o por cliente.',
      'El botón con el ojito (al lado de Anular y Devolver) muestra el motivo de la anulación o el detalle de la devolución. Solo se activa en órdenes anuladas o devueltas.'
    ]
  },
  {
    id: 'ventas-anular',
    titulo: '¿Cómo anular una orden de venta?',
    contenido:
      'En "Estado orden venta" presione "Anular" en la fila de la orden, elija el motivo, agregue un detalle si lo desea y confirme.',
    puntosClave: [
      'Solo se pueden anular órdenes "En proceso" o "Confirmada".',
      'Una orden anulada no se puede volver a anular ni devolver.',
      'El motivo queda registrado y se puede consultar después con el ojito.'
    ]
  },
  {
    id: 'ventas-devolver',
    titulo: '¿Cómo registrar una devolución (nota de crédito)?',
    contenido:
      'En "Estado orden venta" presione "Devolver" en una orden Confirmada. Se abre una ventana donde se marcan los productos a devolver, la cantidad y el destino, y se presiona "Generar nota de crédito".',
    puntosClave: [
      'Solo se puede devolver una orden Confirmada, es decir, ya facturada por Finanzas.',
      'La cantidad a devolver va de 1 hasta la cantidad vendida de ese producto.',
      'Destino "Stock disponible": el producto vuelve al inventario. Destino "Producto dañado (baja)": no se repone al stock.',
      'Al terminar la orden pasa a estado "Devuelta".'
    ]
  }
]

// @ts-ignore
const guiaFinanzas: ItemManual[] = [
  {
    id: 'finanzas-flujo',
    titulo: '¿Cuál es el flujo de trabajo mensual en Finanzas?',
    contenido:
      'El módulo "Finanzas" organiza la contabilidad por meses. El circuito habitual de cada mes tiene cuatro pasos: contar con el período del mes, facturar las órdenes de compra y de venta, controlar el libro diario y, al finalizar el mes, ejecutar el cierre.',
    puntosClave: [
      'Facturar Órdenes: transforma las órdenes de compra y de venta en facturas y genera automáticamente su asiento en el libro diario.',
      'Cierre y Libro Diario: permite controlar los asientos del mes y cerrarlo cuando ya no quedan operaciones por registrar.',
      'Crear Período: da de alta el período contable de un mes. Si no se cargó antes, el sistema lo crea solo al emitir la primera factura de ese mes.',
      'Recomendación: cierre el mes recién cuando todas las órdenes del período estén facturadas, porque un mes cerrado ya no admite facturas.'
    ]
  },
  {
    id: 'finanzas-crear-periodo',
    titulo: '¿Cómo crear un período contable?',
    contenido:
      'Ingrese al módulo "Finanzas" y seleccione "Crear Período" en el panel lateral. Presione el botón "Crear Período", elija el mes y el año y confirme con "Guardar Período". El nuevo período aparece en la tabla "Períodos Registrados".',
    puntosClave: [
      'El mes y el año actuales vienen preseleccionados. El año debe estar entre 2000 y 2100.',
      'No pueden existir dos períodos del mismo mes y año: si el período ya existe, el sistema lo avisa y el botón "Guardar Período" queda inactivo.',
      'Al crear un período, el sistema crea automáticamente su cierre mensual en estado "Abierto". Puede consultarlo en "Cierre y Libro Diario".',
      'Desde esta pantalla los períodos solo se crean y se consultan: no se modifican ni se eliminan.'
    ]
  },
  {
    id: 'finanzas-facturar-orden',
    titulo: '¿Cómo facturar una orden de compra o de venta?',
    contenido:
      'Ingrese a "Finanzas" y seleccione "Facturar Órdenes". En la columna derecha elija una orden de la tabla "Órdenes de Compra (Proveedores)" o de "Órdenes de Venta (Clientes)". Si desea revisarla antes, presione "Ver". Luego presione "Facturar Orden".',
    puntosClave: [
      'No hay que cargar datos a mano: el tipo de factura, el número, la fecha del día, el IVA y los ítems los arma el sistema a partir de la orden seleccionada.',
      'Número de factura: en las ventas se usa el número de comprobante de la orden (por ejemplo B-0000002); si no tiene, se arma como FV- seguido del número de orden. En las compras se arma como FC- seguido del número de orden.',
      'Al terminar aparece un mensaje verde con el número y el total de la factura. La orden deja de figurar entre las pendientes y la factura pasa a "Facturas Registradas".',
      'Cada factura genera automáticamente su asiento en el libro diario, en el mes de la fecha de la factura.',
      'Una orden se factura una sola vez: una vez facturada, el sistema no vuelve a ofrecerla.'
    ]
  },
  {
    id: 'finanzas-orden-no-aparece',
    titulo: '¿Por qué no veo una orden en la lista para facturar?',
    contenido:
      'Las tablas de "Facturar Órdenes" muestran solo las órdenes pendientes de facturar: las que todavía no tienen una factura y no están anuladas ni canceladas.',
    puntosClave: [
      'Si la orden ya fue facturada, búsquela en "Facturas Registradas": el detalle de la factura indica su orden de origen.',
      'Las órdenes de venta anuladas no se ofrecen para facturar.',
      'La lista se carga al ingresar a la pantalla. Si acaba de generar una orden en Ventas o en Proveedores y Compra, cambie de opción en el panel lateral y vuelva a ingresar a "Facturar Órdenes" para actualizarla.',
      'En las órdenes de compra, facture únicamente las que ya fueron recibidas. Desde Proveedores y Compra también se puede enviar una orden recibida a Finanzas, y queda marcada como "Contabilizado".'
    ]
  },
  {
    id: 'finanzas-boton-inactivo',
    titulo: '¿Por qué los botones "Ver" y "Facturar Orden" aparecen inactivos?',
    contenido:
      'Los botones se habilitan recién cuando hay una orden seleccionada. El recuadro "Orden seleccionada" indica cuál es: si dice "Ninguna", todavía no eligió ninguna.',
    puntosClave: [
      'Haga clic sobre la fila de la orden para seleccionarla. Si vuelve a hacer clic sobre la misma fila, se deselecciona.',
      'Solo puede haber una orden seleccionada a la vez: al elegir una de compra se reemplaza la de venta, y al revés.',
      'Mientras se emite la factura, el botón cambia a "Facturando…" y queda inactivo para evitar facturar dos veces la misma orden.',
      'El botón "Ver Detalle" de "Facturas Registradas" se habilita al seleccionar una factura.'
    ]
  },
  {
    id: 'finanzas-importes',
    titulo: '¿Cómo se calculan el subtotal, el IVA y el total de una factura?',
    contenido:
      'Los importes los calcula el sistema y no se pueden editar. El subtotal es la suma de los ítems (cantidad por precio unitario), el IVA es el 21 % de ese subtotal y el total es el subtotal más el IVA.',
    puntosClave: [
      'Ejemplo: un ítem de 1 unidad a $10,00 da un subtotal de $10,00, un IVA de $2,10 y un total de $12,10.',
      'Si una orden de venta tiene descuento en un ítem, se factura el precio unitario efectivo: el precio menos el descuento, repartido por unidad.',
      'Ningún importe de una factura puede superar $9.999.999.999,99. Si ocurriera, el sistema muestra un mensaje y no emite la factura.'
    ]
  },
  {
    id: 'finanzas-detalle-factura',
    titulo: '¿Cómo consultar una factura y su detalle?',
    contenido:
      'En "Facturar Órdenes", la tabla "Facturas Registradas" lista las facturas con su número, tipo (Venta o Compra), fecha y total. Seleccione una fila y presione "Ver Detalle" para abrir el comprobante.',
    puntosClave: [
      'El comprobante muestra la fecha de emisión, la orden de origen (por ejemplo "Orden Venta #14"), el número de asiento del libro diario, los ítems y el subtotal, el IVA y el total.',
      'Los productos se identifican por su número (por ejemplo "Producto #2").',
      'En "Asiento Diario N°" figura el asiento del libro diario que generó la factura. Las facturas emitidas antes de que el sistema generara asientos automáticos pueden mostrar "S/N".',
      'Las facturas emitidas no se pueden modificar ni eliminar.'
    ]
  },
  {
    id: 'finanzas-libro-diario',
    titulo: '¿Cómo consultar el libro diario y filtrarlo por mes?',
    contenido:
      'Ingrese a "Cierre y Libro Diario". En la parte inferior, "Libro Diario (Asientos Contables)" muestra los asientos con su número, fecha y descripción. Use el desplegable "Filtrar período" para ver solo los asientos de un mes, o "Ver Histórico Completo" para verlos todos.',
    puntosClave: [
      'Cada factura emitida genera un único asiento, por ejemplo "Factura de venta B-0000002 (orden de venta #2)".',
      'Los asientos los genera el sistema: no se cargan ni se modifican a mano.',
      'El libro diario no muestra importes; para ver el monto, consulte la factura en "Facturar Órdenes".',
      'Si el mes elegido no tiene facturas, la tabla indica "No se registran asientos en este período."'
    ]
  },
  {
    id: 'finanzas-cerrar-mes',
    titulo: '¿Cómo cerrar un mes y qué significa cada estado?',
    contenido:
      'En "Cierre y Libro Diario", la tabla "Períodos Mensuales" muestra cada período con su estado. Seleccione un período en estado "Abierto", presione "Ejecutar Cierre de Período" y confirme con "Confirmar Cierre". El período pasa a "Cerrado" y se registra la fecha de cierre.',
    puntosClave: [
      'Abierto: el mes admite nuevas facturas. Cerrado: el mes quedó protegido y no admite más cambios. Mientras el período está abierto, la fecha de cierre figura como "-".',
      'El botón "Ejecutar Cierre de Período" está inactivo si no hay un período seleccionado o si el seleccionado ya está cerrado.',
      'Antes de confirmar, el sistema advierte que un período cerrado no se puede volver a modificar.',
      'Un cierre no se puede reabrir desde el sistema. Si se cerró un mes por error, solicite su corrección al área técnica.',
      'Se recomienda cerrar el mes recién cuando todas sus órdenes estén facturadas.'
    ]
  },
  {
    id: 'finanzas-mes-cerrado',
    titulo: '¿Qué ocurre cuando un mes ya está cerrado?',
    contenido:
      'Un mes cerrado queda protegido: el sistema no permite registrar nuevas facturas con fecha en ese mes, agregar ítems a sus facturas ni modificar el período.',
    puntosClave: [
      'Si intenta facturar y el mes está cerrado, aparece un mensaje rojo indicando que el período ya está cerrado y la factura no se guarda.',
      'Las facturas se emiten con la fecha del día. Por eso, si el mes en curso ya está cerrado, no se podrán emitir facturas hasta que comience el mes siguiente: el sistema crea el nuevo período automáticamente al facturar.',
      'Las facturas y los asientos de un mes cerrado siguen disponibles para su consulta.'
    ]
  },
  {
    id: 'finanzas-errores',
    titulo: '¿Qué significan los mensajes de error más frecuentes en Finanzas?',
    contenido:
      'Cuando una operación no se puede completar, aparece un recuadro rojo sobre la tabla con el motivo. Los casos más habituales son los siguientes.',
    puntosClave: [
      '"El período MM/AAAA ya está cerrado y no admite cambios": el mes de la factura está cerrado. Consulte la ayuda sobre meses cerrados.',
      '"Los campos tipo, numero deben formar un conjunto único": ya existe una factura con ese número. Suele ocurrir si la orden ya fue facturada; revise "Facturas Registradas".',
      '"Ya existe un período para ese año y mes": el período ya está creado. Búsquelo en la tabla "Períodos Registrados".',
      '"El importe supera el máximo permitido": algún importe de la factura excede $9.999.999.999,99.',
      '"La orden seleccionada no tiene ítems para facturar": la orden no tiene productos cargados; revísela en su módulo de origen.',
      'Si el mensaje indica que no se pudo conectar con el servidor, siga los pasos de las preguntas frecuentes generales (Sección B).'
    ]
  },
  {
    id: 'finanzas-relacion-modulos',
    titulo: '¿Cómo se relaciona Finanzas con Ventas y con Proveedores y Compra?',
    contenido:
      'Finanzas toma las órdenes que generan los otros módulos y las convierte en facturas. No modifica las órdenes: solo las lee y registra la factura correspondiente.',
    puntosClave: [
      'Ventas: una orden "En proceso" pasa a verse como "Confirmada" en Ventas, al actualizar su pantalla, apenas Finanzas la factura.',
      'Proveedores y Compra: las órdenes de compra recibidas se pueden facturar desde Finanzas o enviarse a Finanzas desde ese módulo. En este último caso la orden queda marcada como "Contabilizado".'
    ]
  }
]

const itemAbiertoFinanzas = ref<string>('finanzas-flujo')

// @ts-ignore
function alternarFinanzas(id: string) {
  itemAbiertoFinanzas.value = itemAbiertoFinanzas.value === id ? '' : id
}

const itemAbiertoVentas = ref<string>('ventas-clientes')

function alternarVentas(id: string) {
  itemAbiertoVentas.value = itemAbiertoVentas.value === id ? '' : id
}

const itemAbiertoGuia = ref<string>('guia-alta-producto')
const itemAbiertoFaq = ref<string>('faq-error-conexion')

function alternarGuia(id: string) {
  itemAbiertoGuia.value = itemAbiertoGuia.value === id ? '' : id
}

function alternarFaq(id: string) {
  itemAbiertoFaq.value = itemAbiertoFaq.value === id ? '' : id
}

const guiaProveedoresCompras: { id: string; titulo: string; preguntas: ItemManual[] }[] = [
  {
    "id": "proveedores",
    "titulo": "Proveedores",
    "preguntas": [
      {
        "id": "proveedores-registrar",
        "titulo": "¿Cómo registro un proveedor?",
        "contenido": "Ingrese a Proveedores, presione Nuevo Proveedor y complete los datos. Seleccione los productos que suministra, asigne sus precios de compra y presione Crear Proveedor."
      },
      {
        "id": "proveedores-obligatorios",
        "titulo": "¿Qué datos son obligatorios?",
        "contenido": "Para registrar un proveedor debe completar los siguientes datos:",
        "puntosClave": [
          "Nombre o razón social.",
          "Apellido o denominación.",
          "CUIT.",
          "Al menos un producto suministrado y el precio de compra de cada producto seleccionado.",
          "El email, el teléfono y la dirección son opcionales."
        ]
      },
      {
        "id": "proveedores-cuit",
        "titulo": "¿Cómo debo ingresar el CUIT?",
        "contenido": "Escriba los 11 números. El sistema agrega automáticamente los guiones con el formato XX-XXXXXXXX-X. También puede pegar el CUIT completo."
      },
      {
        "id": "proveedores-cuit-repetido",
        "titulo": "¿Puedo registrar dos proveedores con el mismo CUIT?",
        "contenido": "No. Si el CUIT ya está registrado, aparecerá un mensaje debajo del campo para que lo revise."
      },
      {
        "id": "proveedores-asociar-productos",
        "titulo": "¿Cómo asocio productos a un proveedor?",
        "contenido": "En Productos suministrados, busque los productos por nombre, código o ID y marque los que correspondan. Luego, ingrese el precio de compra de cada producto seleccionado."
      },
      {
        "id": "proveedores-producto-faltante",
        "titulo": "¿Qué hago si el producto no aparece?",
        "contenido": "Verifique que el producto esté registrado y disponible en el catálogo. Si todavía no existe, deberá registrarlo antes de asociarlo al proveedor."
      },
      {
        "id": "proveedores-precios",
        "titulo": "¿El precio de compra puede ser diferente para cada proveedor?",
        "contenido": "Sí. Cada proveedor tiene su propio precio de compra para los productos que suministra. Ese precio se utiliza al crear una orden de compra."
      },
      {
        "id": "proveedores-editar",
        "titulo": "¿Cómo modifico los datos de un proveedor?",
        "contenido": "Seleccione el proveedor en el listado, realice los cambios y presione Guardar Cambios. También puede modificar sus productos asociados y precios de compra."
      },
      {
        "id": "proveedores-buscar",
        "titulo": "¿Cómo encuentro un proveedor?",
        "contenido": "Use el buscador del listado. Puede buscar por nombre, apellido o denominación, CUIT, email o nombre de un producto asociado."
      },
      {
        "id": "proveedores-validaciones",
        "titulo": "¿Qué significa un mensaje debajo de un campo?",
        "contenido": "Indica que ese dato necesita una corrección. Revise el mensaje, modifique el valor y vuelva a guardar."
      }
    ]
  },
  {
    "id": "compras",
    "titulo": "Órdenes de compra",
    "preguntas": [
      {
        "id": "compras-crear",
        "titulo": "¿Cómo creo una orden de compra?",
        "contenido": "Ingrese a Órdenes de Compra y presione Nueva orden. Seleccione un proveedor, elija los productos, indique las cantidades y presione Guardar Orden."
      },
      {
        "id": "compras-seleccionar-proveedor",
        "titulo": "¿Por qué no puedo agregar productos sin seleccionar un proveedor?",
        "contenido": "Primero debe seleccionar un proveedor. Así, el sistema puede mostrar los productos que tiene asociados y sus precios de compra."
      },
      {
        "id": "compras-producto-faltante",
        "titulo": "¿Por qué no aparece el producto que quiero comprar?",
        "contenido": "La orden muestra únicamente los productos asociados al proveedor seleccionado y disponibles en el catálogo. Revise esa asociación en el módulo de Proveedores."
      },
      {
        "id": "compras-varios-proveedores",
        "titulo": "¿Puedo incluir productos de distintos proveedores en una misma orden?",
        "contenido": "Cada orden corresponde a un solo proveedor. Para comprar a distintos proveedores, cree una orden para cada uno."
      },
      {
        "id": "compras-cambiar-proveedor",
        "titulo": "¿Qué pasa si cambio el proveedor mientras preparo la orden?",
        "contenido": "Se eliminan los productos que había agregado. Luego, debe seleccionar los productos del nuevo proveedor."
      },
      {
        "id": "compras-productos-repetidos",
        "titulo": "¿Puedo agregar varias veces el mismo producto?",
        "contenido": "Cada producto debe aparecer una sola vez. Si necesita más unidades, modifique la cantidad de su fila."
      },
      {
        "id": "compras-cantidades",
        "titulo": "¿Qué cantidades puedo ingresar?",
        "contenido": "Las cantidades deben ser números enteros mayores que cero. No se permiten cantidades negativas ni decimales."
      },
      {
        "id": "compras-precio-unitario",
        "titulo": "¿Puedo modificar el precio unitario desde la orden?",
        "contenido": "El precio se obtiene automáticamente del precio de compra asociado al proveedor. Para cambiarlo, revise el producto dentro del módulo de Proveedores."
      },
      {
        "id": "compras-total",
        "titulo": "¿Cómo se calcula el total?",
        "contenido": "El sistema multiplica la cantidad por el precio unitario de cada producto y suma los subtotales."
      },
      {
        "id": "compras-fecha",
        "titulo": "¿Puedo elegir la fecha de la orden?",
        "contenido": "La fecha se asigna automáticamente al crear la orden y se conserva al editarla."
      },
      {
        "id": "compras-consultar",
        "titulo": "¿Cómo consulto una orden?",
        "contenido": "Seleccione la orden en el listado para ver el proveedor, los productos, las cantidades, los importes, el estado y los comprobantes asociados. El listado también muestra el CUIT del proveedor."
      },
      {
        "id": "compras-editar",
        "titulo": "¿Puedo editar una orden después de crearla?",
        "contenido": "Sí, mientras esté en estado Pendiente. Abra su detalle y presione Editar orden."
      },
      {
        "id": "compras-estados",
        "titulo": "¿Qué significa cada estado?",
        "contenido": "El estado indica en qué etapa se encuentra la orden de compra:",
        "puntosClave": [
          "Pendiente: la orden está registrada y puede editarse, aprobarse o rechazarse.",
          "Aprobado: la orden fue aprobada y queda pendiente de recibir o devolver la entrega.",
          "Rechazado: la orden fue rechazada y finalizó su proceso.",
          "Recibido: la entrega fue aceptada y los productos ingresaron al stock.",
          "Devuelto: la entrega fue rechazada sin ingresar los productos al stock.",
          "Contabilizado: la orden tiene una factura de compra registrada y fue contabilizada."
        ]
      },
      {
        "id": "compras-rechazar-devolver",
        "titulo": "¿Cuál es la diferencia entre rechazar y devolver?",
        "contenido": "Rechazar se utiliza cuando la orden todavía está pendiente. Devolver se utiliza después de aprobarla, cuando se rechaza la entrega."
      },
      {
        "id": "compras-stock",
        "titulo": "¿Cuándo se actualiza el stock?",
        "contenido": "Al confirmar la recepción mediante Recibir. Crear o aprobar una orden no agrega productos al stock."
      },
      {
        "id": "compras-factura",
        "titulo": "¿Dónde se registra la factura de compra?",
        "contenido": "La factura se registra en Finanzas cuando la orden está recibida. Luego, la orden pasa a Contabilizado y el comprobante puede consultarse desde su detalle."
      },
      {
        "id": "compras-buscar",
        "titulo": "¿Cómo encuentro una orden?",
        "contenido": "Use el buscador por número de orden, proveedor o fecha. También puede filtrar por estado."
      },
      {
        "id": "compras-orden-listado",
        "titulo": "¿En qué orden se muestran las compras?",
        "contenido": "Por defecto, aparecen de mayor a menor número de orden."
      },
      {
        "id": "compras-cargar-mas",
        "titulo": "¿Para qué sirve Cargar más?",
        "contenido": "El listado muestra inicialmente 20 órdenes. Al presionar Cargar más, se muestran otras 20."
      },
      {
        "id": "compras-error-guardar",
        "titulo": "¿Qué hago si aparece un error al guardar?",
        "contenido": "Revise los mensajes debajo de los campos y corrija los datos indicados. Si el mensaje informa un problema de conexión, intente nuevamente cuando se restablezca el servicio."
      }
    ]
  }
]

const itemAbiertoProveedoresCompras = ref<string>('proveedores-registrar')

function alternarProveedoresCompras(id: string) {
  itemAbiertoProveedoresCompras.value = itemAbiertoProveedoresCompras.value === id ? '' : id
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

      <!-- Sección C: Guía Operativa de Ventas -->
      <div class="col-12">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-header seccion-header text-white py-3 px-4 d-flex align-items-center gap-2">
            <span class="badge badge-acento">Sección C</span>
            <h5 class="fw-bold mb-0 fs-6">Guía Operativa de Ventas (Clientes, Órdenes y Devoluciones)</h5>
          </div>
          <div class="card-body p-3 p-md-4 bg-white">
            <div class="accordion" id="accordionGuiaVentas">
              <div
                v-for="item in guiaVentas"
                :key="item.id"
                class="accordion-item border rounded mb-2 overflow-hidden"
              >
                <h2 class="accordion-header" :id="`heading-${item.id}`">
                  <button
                    class="accordion-button fw-semibold text-dark"
                    :class="{ collapsed: itemAbiertoVentas !== item.id }"
                    type="button"
                    :aria-expanded="itemAbiertoVentas === item.id"
                    :aria-controls="`collapse-${item.id}`"
                    @click="alternarVentas(item.id)"
                  >
                    {{ item.titulo }}
                  </button>
                </h2>
                <div
                  :id="`collapse-${item.id}`"
                  class="accordion-collapse collapse"
                  :class="{ show: itemAbiertoVentas === item.id }"
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

      <!-- Sección D: Guía de Proveedores y Compras -->
      <div class="col-12">
        <div class="card border-0 shadow-sm overflow-hidden">
          <div class="card-header seccion-header text-white py-3 px-4 d-flex align-items-center gap-2">
            <span class="badge badge-acento">Sección D</span>
            <h5 class="fw-bold mb-0 fs-6">Guía de Proveedores y Compras</h5>
          </div>
          <div class="card-body p-3 p-md-4 bg-white">
            <section v-for="grupo in guiaProveedoresCompras" :key="grupo.id" class="mb-4" :aria-labelledby="`titulo-manual-${grupo.id}`">
              <h6 :id="`titulo-manual-${grupo.id}`" class="fw-bold mb-3">{{ grupo.titulo }}</h6>
              <div class="accordion" :id="`accordion-${grupo.id}`">
                <div v-for="item in grupo.preguntas" :key="item.id" class="accordion-item border rounded mb-2 overflow-hidden">
                  <h2 class="accordion-header" :id="`heading-${item.id}`">
                    <button
                      class="accordion-button fw-semibold text-dark"
                      :class="{ collapsed: itemAbiertoProveedoresCompras !== item.id }"
                      type="button"
                      :aria-expanded="itemAbiertoProveedoresCompras === item.id"
                      :aria-controls="`collapse-${item.id}`"
                      @click="alternarProveedoresCompras(item.id)"
                    >{{ item.titulo }}</button>
                  </h2>
                  <div
                    :id="`collapse-${item.id}`"
                    class="accordion-collapse collapse"
                    :class="{ show: itemAbiertoProveedoresCompras === item.id }"
                    :aria-labelledby="`heading-${item.id}`"
                  >
                    <div class="accordion-body bg-light-subtle text-secondary">
                      <p class="mb-3">{{ item.contenido }}</p>
                      <ul v-if="item.puntosClave && item.puntosClave.length" class="mb-0 ps-3 small">
                        <li v-for="(punto, idx) in item.puntosClave" :key="idx" class="mb-1">{{ punto }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
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

