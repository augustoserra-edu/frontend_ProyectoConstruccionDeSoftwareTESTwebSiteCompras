from pathlib import Path
from html import escape
import re
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak, Image, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from PIL import Image as PILImage
from pypdf import PdfReader

root = Path(__file__).resolve().parents[2]
source = root / 'docs/pruebas/PRUEBAS-HOSTEADAS-2026-11-02.md'
output = root / 'output/pdf/Pruebas-hosteadas-Proveedores-y-Compras-2026-11-02.pdf'
output.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverTitle', fontName='Helvetica-Bold', fontSize=23, leading=28, textColor=colors.HexColor('#19384c'), spaceAfter=16))
styles.add(ParagraphStyle(name='ReportBody', fontName='Helvetica', fontSize=9, leading=13, spaceAfter=8))
styles.add(ParagraphStyle(name='ReportCell', fontName='Helvetica', fontSize=7.8, leading=10.5))
styles.add(ParagraphStyle(name='Caption', fontName='Helvetica', fontSize=8, leading=11, spaceAfter=8, textColor=colors.HexColor('#546370')))
styles['Heading2'].textColor = colors.HexColor('#19384c')
styles['Heading2'].spaceBefore = 14
styles['Heading2'].spaceAfter = 10

def clean(s):
    s = re.sub(r'\[([^]]+)\]\(([^)]+)\)', r'\1', s)
    s = s.replace('**', '').replace('`', '').replace('→', ' a ').replace('…','...')
    return escape(s)

def para(s, style='ReportBody'):
    return Paragraph(clean(s), styles[style])

def make_table(lines):
    rows = [[c.strip() for c in line.strip().strip('|').split('|')] for line in lines]
    rows = [r for r in rows if not all(re.fullmatch(r'[: -]+', c) for c in r)]
    widths = [55,169,222,65] if len(rows[0]) == 4 else [70,75,366]
    t = Table([[para(c,'ReportCell') for c in row] for row in rows], colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('VALIGN',(0,0),(-1,-1),'TOP'), ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e3edf3')),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f8fa')]),
        ('LINEBELOW',(0,0),(-1,-1),0.3,colors.HexColor('#d5dfe6')),
        ('TOPPADDING',(0,0),(-1,-1),7), ('BOTTOMPADDING',(0,0),(-1,-1),7),
        ('LEFTPADDING',(0,0),(-1,-1),6), ('RIGHTPADDING',(0,0),(-1,-1),6)
    ]))
    return t

text = source.read_text(encoding='utf-8')
assert len(re.findall(r'^\| HOST-\d+', text, re.M)) == 28
story = [para('EL CORRALÓN / REGISTRO DE PRUEBAS', 'Caption'),
         para('Frontend alojado<br/>Proveedores y Compras'.replace('<br/>',' - '),'CoverTitle'),
         para('FE-HOST-2026-11-02 | Ejecución del 02/11/2026','Caption')]
lines = text.splitlines()
i = 1
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1
        continue
    if line.startswith('## '):
        title = line[3:]
        if title in ('Resultados observados', 'Datos creados y conservados'):
            story.append(PageBreak())
        story.append(para(title, 'Heading2'))
        i += 1
    elif line.startswith('|'):
        batch=[]
        while i < len(lines) and lines[i].startswith('|'):
            batch.append(lines[i]); i += 1
        story.extend([make_table(batch), Spacer(1,10)])
    else:
        batch=[line]
        i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(('## ', '|', '- ')):
            batch.append(lines[i]); i += 1
        story.append(para(' '.join(batch)))

for filename, heading, caption in [
    ('proveedor-qa.png', 'Evidencia: proveedor QA', 'Proveedor ID 8 con la denominación editada y Arena asociada. Captura del entorno alojado.'),
    ('ordenes-qa-final.png', 'Evidencia: órdenes QA', 'Consulta final: #34 Devuelto, #33 Rechazado y #32 Recibido. Las capturas acreditan el estado visible al cierre.')
]:
    path = root / 'output/pruebas-hosteadas-2026-11-02' / filename
    with PILImage.open(path) as img:
        w,h=img.size
    scale = min(511/w, 650/h)
    story.extend([PageBreak(), para(heading,'Heading2'), para(caption,'Caption'), Image(str(path),width=w*scale,height=h*scale)])

def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor('#d5dfe6'))
    canvas.line(42,39,553,39)
    canvas.setFont('Helvetica',8)
    canvas.setFillColor(colors.HexColor('#546370'))
    canvas.drawString(42,26,'FE-HOST-2026-11-02 | Proveedores y Compras')
    canvas.drawRightString(553,26,f'Página {doc.page}')

SimpleDocTemplate(str(output),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=40,bottomMargin=53,
                  title='Pruebas del frontend alojado - Proveedores y Compras',author='Proyecto Construcción de Software').build(story,onFirstPage=footer,onLaterPages=footer)
pdf=PdfReader(output)
joined='\n'.join(p.extract_text() for p in pdf.pages)
for n in range(1,29):
    assert f'HOST-{n:02}' in joined
print(f'PDF: {output}')
print(f'Páginas: {len(pdf.pages)}. Verificados: 28 IDs de controles y dos capturas incorporadas.')
