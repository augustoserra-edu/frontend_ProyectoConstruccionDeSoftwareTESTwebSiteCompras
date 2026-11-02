from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
xml = ET.parse(ROOT / 'reports/junit.xml').getroot()
cov = json.loads((ROOT / 'coverage/coverage-summary.json').read_text(encoding='utf-8'))
lint = json.loads((ROOT / 'reports/eslint-summary.json').read_text(encoding='utf-8'))
log = (ROOT / 'logs/revision-completa.log').read_text(encoding='utf-8')
suites = [(s.attrib['name'], [t.attrib['name'] for t in s.findall('testcase')]) for s in xml.findall('testsuite')]
finance = re.findall(r'^✔ (.*?) \([\d.]+ms\)\s*$', log, re.M)
assert len(finance) == 29 and int(xml.attrib['tests']) == 49
assert not xml.findall('.//failure') and not xml.findall('.//error') and not xml.findall('.//skipped')
assert lint['aprobado'] and 'ℹ pass 29' in log and 'ℹ fail 0' in log and '✓ built in' in log
suites.append(('tests/finanzas.test.mjs', finance))
summary = [
    ['Pruebas ejecutadas', '78'], ['Aprobadas / fallidas / omitidas', '78 / 0 / 0'],
    ['Compras y Proveedores (Vitest)', '49 aprobadas, 6 archivos'],
    ['Servicios de Finanzas (Node)', '29 aprobadas, 1 archivo'],
    ['ESLint', '23 archivos; 0 errores y 0 advertencias'],
    ['Tipos y compilación', 'Aprobados'],
    ['Cobertura de líneas', '92,92% (762/820); mínimo 80%'],
    ['Cobertura de ramas', '83,19% (827/994)'],
]
scope = ('Registro de la ejecución local del 02/11/2026, aproximadamente a las 12:18 h '
         '(Argentina, UTC-3). Frontend Vue y TypeScript, Windows, Node 24.15.0. '
         'Comando: npm run check. Revisión base: e134b89ef8efd025827b87c7790c61ca71eff20f, '
         'con cambios locales. Este documento consolida la corrida existente; no representa una nueva ejecución.')
method = ('Se ejecutaron pruebas unitarias de servicios y funciones, pruebas de componentes con Vue Test Utils '
          'y jsdom, análisis estático y validación de tipos y compilación. Las solicitudes HTTP de las pruebas '
          'están simuladas. Las comprobaciones de contratos describen lo que envía y procesa el cliente.')
changes = [
    'CP-C08: verifica comprobantes y búsqueda de la orden seleccionada, excluyendo comprobantes de otras órdenes.',
    'CP-C09: verifica bloqueo de acciones y cierre con Escape durante actualización y recuperación al finalizar.',
    'CP-C10: verifica que una orden sin renglones no se apruebe y que estados desconocidos no ofrezcan transiciones.',
    'Las 29 pruebas de Finanzas ahora se incluyen en npm test y npm run check. Antes requerían ejecución separada.',
]
pending = [
    'INT-01: listado con API real; INT-02: sincronización contable; INT-03: orden sin factura; INT-04: desconexión y recuperación.',
    'E2E-P01: alta y consulta de proveedor; E2E-P02: validaciones; E2E-C01: orden, recepción y facturación; E2E-C02: cancelar confirmación.',
    'Los ocho recorridos anteriores están diseñados y pendientes de ejecución. No se acredita ejecución en navegador real ni Qase.',
    'La cobertura se limita a diez archivos de Compras/Proveedores. No mide todo el frontend. Finanzas acredita pruebas de servicios, no cobertura de sus vistas.',
]
evidence = [
    ('logs/revision-completa.log', 'Salida completa de lint, las dos suites y compilación.'),
    ('reports/junit.xml', 'Detalle de las 49 pruebas Vitest; no incluye las 29 de Node.'),
    ('reports/eslint-summary.json', 'Resumen verificable del análisis estático.'),
    ('coverage/coverage-summary.json', 'Métricas por archivo de Compras/Proveedores.'),
    ('coverage/index.html', 'Reporte de cobertura navegable.'),
    ('docs/pruebas/CASOS-DE-PRUEBA.md', 'Entradas, pasos y resultados esperados de los casos diseñados.'),
]
coverage = []
for path, data in cov.items():
    if path == 'total':
        continue
    name = path.replace('\\', '/').split('/src/')[-1]
    lines = data['lines']
    coverage.append([name, f"{lines['covered']}/{lines['total']}", str(lines['pct']).replace('.', ',') + '%'])

md = ['# Registro de ejecución de pruebas del frontend', '', '**Identificador:** FE-REG-2026-11-02', '', scope, '',
      '## Resultado de la ejecución', '', '| Verificación | Resultado |', '| --- | --- |']
md += [f'| {a} | {b} |' for a, b in summary]
md += ['', method, '', '## Casos incorporados y ajuste de ejecución', ''] + ['- ' + x for x in changes]
md += ['', '## Cobertura por archivo', '', '| Archivo dentro de src | Líneas | Cobertura |', '| --- | --- | --- |']
md += ['| ' + ' | '.join(row) + ' |' for row in coverage]
md += ['', '## Alcance pendiente', ''] + ['- ' + x for x in pending]
md += ['', '## Evidencias y reproducción', '', 'Comando completo: `npm run check`.', '',
       'Para reproducir con dependencias recién instaladas: `npm ci` y luego `npm run check`.', '',
       'Los archivos generados se reemplazan al ejecutar nuevamente. Conservar una copia junto a la entrega.', '']
md += [f'- `{name}`: {desc}' for name, desc in evidence]
md += ['', '## Registro individual de pruebas', '', 'Los identificadores REG-FE son propios de este registro. Se conservan los nombres originales para rastrear cada resultado en los reportes.', '']

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCustom', fontName='Helvetica-Bold', fontSize=24, leading=29, textColor=colors.HexColor('#17324d'), spaceAfter=16))
styles.add(ParagraphStyle(name='BodyCustom', fontName='Helvetica', fontSize=9, leading=13, spaceAfter=9))
styles.add(ParagraphStyle(name='CellCustom', fontName='Helvetica', fontSize=8, leading=11))
styles.add(ParagraphStyle(name='SmallCustom', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#526070'), spaceAfter=8))
def p(text, style='BodyCustom'):
    return Paragraph(escape(str(text)), styles[style])
def table(rows, widths, header=True):
    data = [[p(c, 'CellCustom') for c in row] for row in rows]
    t = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign='LEFT')
    commands = [('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),8),
                ('RIGHTPADDING',(0,0),(-1,-1),8), ('TOPPADDING',(0,0),(-1,-1),6),
                ('BOTTOMPADDING',(0,0),(-1,-1),6), ('LINEBELOW',(0,0),(-1,-1),0.35,colors.HexColor('#dce2e8'))]
    if header:
        commands += [('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8eff5'))]
    t.setStyle(TableStyle(commands))
    return t
story = [p('REGISTRO DE PRUEBAS / FRONTEND', 'SmallCustom'), p('Ejecución de pruebas\ndel frontend'.replace('\n', ' '), 'TitleCustom'),
         p('FE-REG-2026-11-02 | 02 de noviembre de 2026', 'SmallCustom'), p(scope),
         table([['Verificación', 'Resultado']] + summary, [225, 286]), Spacer(1,14),
         p('Método y alcance', 'Heading2'), p(method), p('Casos incorporados y ajuste de ejecución', 'Heading2')]
story += [p(x) for x in changes]
story += [PageBreak(), p('Cobertura y alcance pendiente', 'TitleCustom'),
          p('Cobertura de líneas por archivo de Compras/Proveedores', 'Heading2'),
          table([['Archivo dentro de src', 'Líneas', 'Cobertura']] + coverage, [345,80,86]),
          Spacer(1,12), p('Pruebas pendientes y límites del resultado', 'Heading2')]
story += [p(x) for x in pending]
story += [PageBreak(), p('Registro individual', 'TitleCustom'),
          p('Los identificadores REG-FE son propios de este registro. Se conservan los nombres originales de las pruebas para rastrear cada resultado. Todas las filas siguientes tienen resultado Aprobado.')]
counter = 0
for name, tests in suites:
    md += [f'### {name}', '', f'**Resultado: {len(tests)} aprobadas.**', '', '| ID de registro | Prueba ejecutada | Resultado |', '| --- | --- | --- |']
    story += [p(name, 'Heading2')]
    rows = [['ID', 'Prueba ejecutada', 'Resultado']]
    for test in tests:
        counter += 1
        ident = f'REG-FE-{counter:03}'
        md.append(f'| {ident} | {test.replace("|", "/")} | Aprobado |')
        rows.append([ident, test, 'Aprobado'])
    md.append('')
    story += [table(rows, [78, 374, 59]), Spacer(1,12)]
assert counter == 78
story += [PageBreak(), p('Evidencias y reproducción', 'TitleCustom'),
          p('Comando completo: npm run check. Para reproducir desde una instalación limpia de dependencias: npm ci y luego npm run check.'),
          p('Las rutas siguientes son relativas a la raíz del repositorio frontend. Los reportes generados se reemplazan en futuras corridas; conservar una copia junto a la entrega.')]
for name, desc in evidence:
    story += [p(name, 'Heading3'), p(desc)]
story += [Spacer(1,12), p('Resultado registrado', 'Heading2'),
          p('La corrida registrada aprobó las 78 pruebas automatizadas disponibles del frontend, el análisis estático y la compilación. Se superó el umbral de 80% de líneas en el alcance de Compras/Proveedores. Los casos pendientes deben ejecutarse antes de acreditar integración y aceptación en navegador real.')]

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#dce2e8'))
    canvas.line(42, 39, 553, 39)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#526070'))
    canvas.drawString(42, 26, 'FE-REG-2026-11-02 | Registro de pruebas del frontend')
    canvas.drawRightString(553, 26, str(doc.page))

pdf = OUT / 'Registro-pruebas-frontend-2026-11-02.pdf'
SimpleDocTemplate(str(pdf), pagesize=A4, rightMargin=42, leftMargin=42, topMargin=40, bottomMargin=52,
                  title='Registro de pruebas del frontend - 02/11/2026', author='Proyecto Construcción de Software').build(story, onFirstPage=footer, onLaterPages=footer)
(ROOT / 'docs/pruebas/REGISTRO-PRUEBAS-FRONTEND-2026-11-02.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
reader = PdfReader(pdf)
print(f'PDF creado: {pdf}; páginas: {len(reader.pages)}; pruebas registradas: {counter}')
for i, page in enumerate(reader.pages, 1):
    print(f'Página {i}: {len(page.extract_text())} caracteres')
