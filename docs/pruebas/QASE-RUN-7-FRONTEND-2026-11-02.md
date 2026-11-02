# Registro de ejecución Qase - Frontend de Proveedores y Compras

Fecha: 02/11/2026. Proyecto: El Corralon (EC).

[Abrir test run 7](https://app.qase.io/run/EC/dashboard/7).

## Alcance y resultado

Se creó una ejecución nueva que contiene exclusivamente los **58 casos EC-120
a EC-177**, de la suite **Módulo Proveedores Y Compras (suite 2)**.

| Casos | Cantidad | Estado en Qase | Evidencia |
| --- | --- | --- | --- |
| EC-120 a EC-144 | 25 | Passed | Servicios y funciones con pruebas Vitest aprobadas |
| EC-145 a EC-158 | 14 | Passed | Formularios, componentes y vistas con pruebas aprobadas |
| EC-159 a EC-163 | 5 | Passed | Catálogos y paginación con pruebas aprobadas |
| EC-164 a EC-173 | 10 | Untested | Recorridos E2E pendientes de ejecución en la web |
| EC-174 a EC-177 | 4 | Untested | Integración con API real pendiente de ejecución |
| **Total** | **58** | **44 Passed, 0 Failed, 14 Untested** | **Una sola suite** |

El run permanece **In Progress** para continuar los 14 casos pendientes. No se
presenta como una aprobación completa del sistema. No se modificaron casos de
backend ni otras suites; se registraron resultados en esta ejecución nueva.

## Verificación local

Se ejecutó la suite completa de Compras/Proveedores, excluyendo Finanzas:

```sh
node node_modules/vitest/vitest.mjs run --coverage --reporter=verbose --reporter=junit --outputFile.junit=reports/qase-frontend-junit.xml
```

Resultado: **49 pruebas aprobadas, 0 fallidas**, en seis archivos. Cobertura de
líneas: **92,92% (762/820)**; ramas: **83,19% (827/994)**. La cobertura corresponde
a los diez archivos de Compras/Proveedores declarados en `vitest.config.ts`.

Ambiente: Windows, Node 24.15.0. Revisión base:
`e134b89ef8efd025827b87c7790c61ca71eff20f`, con cambios locales.

Los 44 nombres de los casos Passed exportados de Qase se compararon contra el
JUnit de esta corrida: cada uno tiene una coincidencia única con una prueba
aprobada. Las otras cinco pruebas locales son CP-C08, CP-C09, CP-C10 y dos casos
de validación/errores por campo; aún no tienen un caso dentro del rango de Qase
indicado por el usuario. No se crearon nuevos casos fuera de ese rango.

Se verificó el CSV exportado: 58 IDs únicos, rango 120-177, suite_id=2 en todas
las filas, Passed para 120-163 y Untested para 164-177.

## Evidencias conservadas

Carpeta: `output/qase/frontend-proveedores-compras-2026-11-02/`.

- `qase-run-7.csv`: exportación de Qase con estado individual de los 58 casos.
- `qase-frontend-junit.xml`: resultados de las 49 pruebas automatizadas.
- `qase-frontend-completo.log`: salida de la ejecución local con cobertura.
- `coverage-summary.json`: cobertura por archivo.
- `qase-run-7.png`: captura del panel con 44 de 58 casos ejecutados.

El tiempo registrado en Qase corresponde al registro de los resultados. Los
tiempos de ejecución automatizada se consultan en el JUnit y el log.

## Pendientes

Los diez casos E2E requieren recorrer la interfaz en un navegador y verificar
sus resultados. Los cuatro casos INT requieren sesión y datos controlados en
el ambiente con API real. Las pruebas de esta corrida usan jsdom y HTTP
simulado, por lo que no acreditan esos resultados ni persistencia real.

Las validaciones locales aprobaron en el alcance automatizado; los casos
pendientes se conservan como Untested, sin atribuirles éxito ni fallo.
