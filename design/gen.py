# Genera los artboards de la dirección B + cuerpo. Ejecutar desde gymlog/design.
import os

HEAD = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Archivo:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; font-family: 'Archivo', system-ui, sans-serif; color: #F2F3F5; }
    a { color: #C8F04A; } a:hover { color: #E3FF7A; }
    .d { font-family: 'Bebas Neue', 'Archivo Narrow', Impact, sans-serif; letter-spacing: .02em; }
    .m { fill: #33383F; stroke: #181B20; stroke-width: 1; }
    .l1 { fill: #5A6B22; } .l2 { fill: #93AD3A; } .l3 { fill: #C8F04A; }
  </style>
</helmet>
'''
TAIL = '''</x-dc>
</body>
</html>
'''

SIL = '<g fill="{base}"><circle cx="60" cy="20" r="13"/><rect x="54" y="30" width="12" height="12" rx="3"/><path d="M40 44 H80 Q94 44 96 58 L98 90 Q99 106 96 118 L92 150 H86 L84 118 Q82 108 84 96 L85 82 Q80 94 80 108 V130 Q80 138 78 146 L80 190 Q80 214 78 232 L76 256 H62 L64 232 Q66 210 62 190 V150 H58 V190 Q54 210 56 232 L58 256 H44 L42 232 Q40 214 40 190 L42 146 Q40 138 40 130 V108 Q40 94 35 82 L36 96 Q38 108 36 118 L34 150 H28 L24 118 Q21 106 22 90 L24 58 Q26 44 40 44 Z"/></g>'

FRONT = {
  'hombro': '<ellipse class="m {c}" cx="31" cy="56" rx="10" ry="9"/><ellipse class="m {c}" cx="89" cy="56" rx="10" ry="9"/>',
  'pecho': '<path class="m {c}" d="M41 50 C49 47 57 49 59 51 L59 80 C50 83 41 76 40 62 Z"/><path class="m {c}" d="M79 50 C71 47 63 49 61 51 L61 80 C70 83 79 76 80 62 Z"/>',
  'biceps': '<ellipse class="m {c}" cx="24" cy="84" rx="7.5" ry="17"/><ellipse class="m {c}" cx="96" cy="84" rx="7.5" ry="17"/>',
  'abdomen': '<path class="m {c}" d="M47 86 H73 Q76 86 76 89 V128 Q70 134 60 134 Q50 134 44 128 V89 Q44 86 47 86 Z"/>',
  'aductores': '<ellipse class="m {c}" cx="53" cy="160" rx="5" ry="20"/><ellipse class="m {c}" cx="67" cy="160" rx="5" ry="20"/>',
  'cuadriceps': '<ellipse class="m {c}" cx="43" cy="172" rx="10.5" ry="36"/><ellipse class="m {c}" cx="77" cy="172" rx="10.5" ry="36"/>',
  'pantorrilla': '<ellipse class="m {c}" cx="44" cy="232" rx="7" ry="22"/><ellipse class="m {c}" cx="76" cy="232" rx="7" ry="22"/>',
}
BACK = {
  'espalda': '<path class="m {c}" d="M37 58 C36 84 44 106 50 128 L59 130 V70 Z"/><path class="m {c}" d="M83 58 C84 84 76 106 70 128 L61 130 V70 Z"/>',
  'trapecio': '<path class="m {c}" d="M60 38 L36 54 Q40 56 44 58 L60 88 L76 58 Q80 56 84 54 Z"/>',
  'posterior': '<ellipse class="m {c}" cx="31" cy="56" rx="10" ry="9"/><ellipse class="m {c}" cx="89" cy="56" rx="10" ry="9"/>',
  'triceps': '<ellipse class="m {c}" cx="24" cy="84" rx="7.5" ry="17"/><ellipse class="m {c}" cx="96" cy="84" rx="7.5" ry="17"/>',
  'gluteo': '<ellipse class="m {c}" cx="48" cy="143" rx="12" ry="14"/><ellipse class="m {c}" cx="72" cy="143" rx="12" ry="14"/>',
  'isquios': '<ellipse class="m {c}" cx="45" cy="186" rx="10.5" ry="32"/><ellipse class="m {c}" cx="75" cy="186" rx="10.5" ry="32"/>',
  'pantorrilla': '<ellipse class="m {c}" cx="44" cy="234" rx="7.5" ry="22"/><ellipse class="m {c}" cx="76" cy="234" rx="7.5" ry="22"/>',
}

def body(view, lit, w, base='#262A30'):
    parts = FRONT if view == 'front' else BACK
    h = round(w * 260 / 120)
    inner = ''.join(p.format(c=lit.get(k, '')) for k, p in parts.items())
    return f'<svg viewBox="0 0 120 260" width="{w}" height="{h}" style="display: block;">{SIL.format(base=base)}{inner}</svg>'

def phone(inner, pad_bottom=160):
    return f'<div style="width: 390px; min-height: 844px; background: #0F1114; display: flex; flex-direction: column; box-sizing: border-box; position: relative;">\n<div style="padding: 20px 20px {pad_bottom}px; display: flex; flex-direction: column; gap: 18px;">\n{inner}\n</div>\n'

def nav(active):
    items = [('Hoy', '<path d="M4 6h16M4 12h16M4 18h10"/>'), ('Cuerpo', '<circle cx="12" cy="5" r="3"/><path d="M8 22v-7l-2-6h12l-2 6v7"/>'), ('Progreso', '<path d="M4 19L10 12l4 4 6-8"/>')]
    out = []
    for name, ico in items:
        col = '#C8F04A' if name == active else '#8A9099'
        out.append(f'<span style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: {col};"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2" stroke-linecap="round">{ico}</svg>{name}</span>')
    return '<div style="position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-around; padding: 12px 16px 22px; background: #0F1114; border-top: 1px solid #22262C;">' + ''.join(out) + '</div>\n</div>\n'

def legend():
    return ('<div style="display: flex; justify-content: center; gap: 14px; font-size: 12px; color: #8A9099;">'
            '<span style="display: flex; align-items: center; gap: 5px;"><i style="width: 10px; height: 10px; border-radius: 2px; background: #33383F;"></i>sin tocar</span>'
            '<span style="display: flex; align-items: center; gap: 5px;"><i style="width: 10px; height: 10px; border-radius: 2px; background: #5A6B22;"></i>1–5</span>'
            '<span style="display: flex; align-items: center; gap: 5px;"><i style="width: 10px; height: 10px; border-radius: 2px; background: #93AD3A;"></i>6–11</span>'
            '<span style="display: flex; align-items: center; gap: 5px;"><i style="width: 10px; height: 10px; border-radius: 2px; background: #C8F04A;"></i>12+</span></div>')

def set_row(kg, reps, done, active=False, n=''):
    chk = ('<span style="width: 28px; height: 28px; border-radius: 50%; background: #C8F04A; display: flex; align-items: center; justify-content: center;"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0F1114" stroke-width="2.2"><path d="M2 7l3.5 3.5L12 3"/></svg></span>' if done else
           f'<span style="width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid #4A5059; color: #8A9099; display: flex; align-items: center; justify-content: center; font-size: 13px;">{n}</span>')
    border = ' border: 1.5px solid #C8F04A;' if active else ''
    small = '<small style="font-size: 14px; color: #8A9099; font-family: \'Archivo\', sans-serif; letter-spacing: 0;">'
    return (f'<div style="display: grid; grid-template-columns: 36px minmax(0, 1fr) minmax(0, 1fr); gap: 10px; align-items: center; padding: 8px 10px; background: #22262C;{border} border-radius: 12px;">{chk}'
            f'<span class="d" style="font-size: 28px;">{kg} {small}kg</small></span><span class="d" style="font-size: 28px;">{reps} {small}reps</small></span></div>')

def steppers():
    b = 'text-align: center; padding: 12px 0; border-radius: 10px; background: #22262C; font-weight: 600; font-size: 15px;'
    return f'<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px;"><span style="{b}">−2,5</span><span style="{b}">+2,5</span><span style="{b}">−1</span><span style="{b}">+1</span></div>'

def bottom_actions():
    return ('<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 20px 24px; background: linear-gradient(180deg, rgba(15,17,20,0) 0%, #0F1114 30%); display: flex; flex-direction: column; gap: 10px;">'
            '<span style="text-align: center; padding: 18px; border-radius: 14px; background: #C8F04A; color: #0F1114; font-weight: 600; font-size: 18px;">Serie hecha</span>'
            '<div style="display: flex; gap: 10px;"><span style="flex: 1; text-align: center; padding: 14px; border-radius: 14px; background: #181B20; font-weight: 500;">Descanso 1:30</span><span style="flex: 1; text-align: center; padding: 14px; border-radius: 14px; background: #181B20; font-weight: 500;">Siguiente ejercicio</span></div></div>\n</div>\n')

def progress_bar(done, total):
    return '<div style="display: flex; gap: 4px;">' + ''.join(f'<i style="flex: 1; height: 4px; border-radius: 2px; background: {"#C8F04A" if i < done else "#2A2E34"};"></i>' for i in range(total)) + '</div>'

def header(title, sub, right_big, right_small):
    return (f'<div style="display: flex; justify-content: space-between; align-items: flex-start;"><div style="display: flex; flex-direction: column; gap: 2px;">'
            f'<span class="d" style="font-size: 44px; line-height: .95; color: #C8F04A;">{title}</span><span style="font-size: 13px; color: #8A9099;">{sub}</span></div>'
            f'<div style="display: flex; flex-direction: column; align-items: flex-end;"><span class="d" style="font-size: 36px; line-height: 1;">{right_big}</span><span style="font-size: 12px; color: #8A9099;">{right_small}</span></div></div>')

# ---------- Main: sesión B base (sin cuerpo) ----------
def main_session(extra_top='', card_icon=None, next_icon=''):
    icon = card_icon or '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A9099" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>'
    card = ('<div style="background: #181B20; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px;">'
            '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;"><div style="display: flex; flex-direction: column; gap: 4px;">'
            '<span class="d" style="font-size: 34px; line-height: 1;">Jalón con triángulo</span><span style="font-size: 13px; color: #8A9099;">Última vez: 50 kg × 10 · 3 series</span></div>' + icon + '</div>'
            '<div style="display: flex; flex-direction: column; gap: 8px;">' + set_row(50, 10, True) + set_row(50, 10, True) + set_row(55, '<span style="color: #4A5059;">8</span>', False, True, 3) + '</div>' + steppers() + '</div>')
    nxt = ('<div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #181B20; border-radius: 12px;">'
           '<div style="display: flex; align-items: center; gap: 12px;">' + next_icon + '<div style="display: flex; flex-direction: column; gap: 2px;"><span style="font-size: 11px; color: #8A9099; text-transform: uppercase; letter-spacing: .08em;">Siguiente</span><span style="font-size: 16px; font-weight: 500;">Curl con barra</span></div></div>'
           '<a style="font-size: 14px; font-weight: 600; text-decoration: none;">Cambiar orden</a></div>'
           '<a style="font-size: 14px; text-align: center; text-decoration: none; color: #8A9099;">Ver los 9 ejercicios · agregar otro</a>')
    return HEAD + phone(header('PULL', 'Jueves 10 · ejercicio 3 de 9', '12:34', 'sesión') + progress_bar(3, 9) + extra_top + card + nxt) + bottom_actions() + TAIL

# ---------- Variante 1: Inicio con cuerpo ----------
def inicio():
    week = {'espalda': '', 'biceps': '', 'pecho': 'l2', 'hombro': 'l1', 'triceps': 'l1', 'cuadriceps': 'l1', 'aductores': 'l1', 'pantorrilla': 'l1', 'abdomen': ''}
    bodies = ('<div style="background: #181B20; border-radius: 16px; padding: 16px 12px 12px; display: flex; flex-direction: column; gap: 12px;">'
              '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">'
              '<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">' + body('front', week, 118) + '<span style="font-size: 12px; color: #8A9099;">Frente</span></div>'
              '<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">' + body('back', week, 118) + '<span style="font-size: 12px; color: #8A9099;">Espalda</span></div></div>' + legend() + '</div>')
    sugg = ('<div style="background: #181B20; border: 1.5px solid #C8F04A; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px;">'
            '<div style="display: flex; justify-content: space-between; align-items: baseline;"><span class="d" style="font-size: 36px; line-height: 1; color: #C8F04A;">TE TOCA PULL</span><span style="font-size: 12px; color: #8A9099;">9 ejercicios</span></div>'
            '<span style="font-size: 14px; color: #B8BEC7; line-height: 1.45;">Espalda y bíceps llevan 6 días sin tocarse. Dominadas · Remo en máquina · Jalón con triángulo · +6</span>'
            '<div style="display: flex; gap: 8px;"><span style="flex: 1; text-align: center; padding: 14px; border-radius: 12px; background: #C8F04A; color: #0F1114; font-weight: 600; font-size: 16px;">Empezar Pull</span>'
            '<span style="padding: 14px 16px; border-radius: 12px; background: #22262C; font-weight: 500;">Otro</span></div></div>')
    return HEAD + phone(header('JUEVES 10', 'Semana 37 · 3 sesiones · 8 de 13 grupos', '', '') + bodies + sugg, 100) + nav('Hoy') + TAIL

# ---------- Variante 2: franja de cuerpo dentro de la sesión ----------
def sesion_franja():
    today = {'espalda': 'l3', 'biceps': '', 'triceps': '', 'posterior': ''}
    strip = ('<div style="display: flex; align-items: center; gap: 14px; padding: 10px 14px; background: #181B20; border-radius: 12px;">'
             '<div style="display: flex; gap: 6px;">' + body('front', {'biceps': 'l1'}, 40) + body('back', {'espalda': 'l3', 'triceps': ''}, 40) + '</div>'
             '<div style="display: flex; flex-direction: column; gap: 4px; flex: 1;"><span style="font-size: 11px; color: #8A9099; text-transform: uppercase; letter-spacing: .08em;">Hoy vas encendiendo</span>'
             '<div style="display: flex; flex-wrap: wrap; gap: 6px;">'
             '<span style="padding: 4px 10px; border-radius: 999px; background: #C8F04A; color: #0F1114; font-size: 12px; font-weight: 600;">Espalda 6</span>'
             '<span style="padding: 4px 10px; border-radius: 999px; background: #22262C; color: #8A9099; font-size: 12px; font-weight: 600;">Bíceps 0</span>'
             '<span style="padding: 4px 10px; border-radius: 999px; background: #22262C; color: #8A9099; font-size: 12px; font-weight: 600;">Tríceps 0</span>'
             '<span style="padding: 4px 10px; border-radius: 999px; background: #22262C; color: #8A9099; font-size: 12px; font-weight: 600;">Hombro post. 0</span></div></div></div>')
    return main_session(extra_top=strip)

# ---------- Variante 3: músculo por ejercicio ----------
def sesion_glifo():
    icon = ('<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">' + body('back', {'espalda': 'l3'}, 34) + '<span style="font-size: 10px; color: #C8F04A; font-weight: 600;">Espalda</span></div>')
    nxt = body('front', {'biceps': 'l3'}, 26)
    return main_session(card_icon=icon, next_icon=nxt)

# ---------- Variante 4: resumen al terminar ----------
def resumen():
    lit = {'espalda': 'l3', 'biceps': 'l2', 'triceps': 'l1', 'posterior': 'l1', 'pecho': 'l1', 'hombro': 'l1', 'cuadriceps': 'l1', 'pantorrilla': 'l1'}
    bodies = ('<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; background: #181B20; border-radius: 16px; padding: 16px 12px;">'
              '<div style="display: flex; justify-content: center;">' + body('front', lit, 118) + '</div><div style="display: flex; justify-content: center;">' + body('back', lit, 118) + '</div></div>')
    stats = ('<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px;">'
             '<div style="display: flex; flex-direction: column; align-items: center; padding: 12px 0; background: #181B20; border-radius: 12px;"><span class="d" style="font-size: 30px; line-height: 1;">9</span><span style="font-size: 12px; color: #8A9099;">ejercicios</span></div>'
             '<div style="display: flex; flex-direction: column; align-items: center; padding: 12px 0; background: #181B20; border-radius: 12px;"><span class="d" style="font-size: 30px; line-height: 1;">27</span><span style="font-size: 12px; color: #8A9099;">series</span></div>'
             '<div style="display: flex; flex-direction: column; align-items: center; padding: 12px 0; background: #181B20; border-radius: 12px;"><span class="d" style="font-size: 30px; line-height: 1;">8.450</span><span style="font-size: 12px; color: #8A9099;">kg totales</span></div></div>')
    lst = ('<div style="display: flex; flex-direction: column; gap: 2px; background: #181B20; border-radius: 12px; padding: 6px 14px;">'
           '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #22262C;"><span style="font-weight: 500;">Espalda</span><span style="color: #C8F04A; font-weight: 600;">12 series · récord 60 kg</span></div>'
           '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #22262C;"><span style="font-weight: 500;">Bíceps</span><span style="color: #93AD3A; font-weight: 600;">9 series</span></div>'
           '<div style="display: flex; justify-content: space-between; padding: 8px 0;"><span style="font-weight: 500;">Tríceps</span><span style="color: #5A6B22; font-weight: 600;">6 series</span></div></div>')
    cta = '<span style="text-align: center; padding: 16px; border-radius: 14px; background: #C8F04A; color: #0F1114; font-weight: 600; font-size: 17px;">Guardar sesión</span>'
    return HEAD + phone(header('PULL LISTO', 'Jueves 10 · semana: 9 de 13 grupos', '48:12', 'duración') + bodies + stats + lst + cta, 40) + TAIL

# ---------- Variante 5: pestaña Cuerpo (mapa de calor + lista) ----------
def cuerpo_tab():
    week = {'espalda': 'l3', 'biceps': 'l2', 'pecho': 'l2', 'hombro': 'l1', 'triceps': 'l1', 'cuadriceps': 'l1', 'aductores': 'l1', 'pantorrilla': 'l1'}
    seg = ('<div style="display: flex; background: #181B20; border-radius: 999px; padding: 4px; gap: 2px;">'
           '<span style="flex: 1; text-align: center; padding: 8px 0; border-radius: 999px; background: #F2F3F5; color: #0F1114; font-size: 14px; font-weight: 600;">7 días</span>'
           '<span style="flex: 1; text-align: center; padding: 8px 0; border-radius: 999px; color: #8A9099; font-size: 14px; font-weight: 600;">14 días</span>'
           '<span style="flex: 1; text-align: center; padding: 8px 0; border-radius: 999px; color: #8A9099; font-size: 14px; font-weight: 600;">30 días</span></div>')
    bodies = ('<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; background: #181B20; border-radius: 16px; padding: 16px 12px 10px;">'
              '<div style="display: flex; justify-content: center;">' + body('front', week, 118) + '</div><div style="display: flex; justify-content: center;">' + body('back', week, 118) + '</div>'
              '<div style="grid-column: 1 / -1;">' + legend() + '</div></div>')
    rows = [('Espalda', 14, 'l3'), ('Pecho', 9, 'l2'), ('Bíceps', 7, 'l2'), ('Cuádriceps', 4, 'l1'), ('Isquiotibiales', 0, ''), ('Glúteo', 0, '')]
    col = {'l3': '#C8F04A', 'l2': '#93AD3A', 'l1': '#5A6B22', '': '#33383F'}
    lst = '<div style="display: flex; flex-direction: column; background: #181B20; border-radius: 12px; padding: 4px 14px;">'
    for name, n, lv in rows:
        w = round(n / 14 * 100)
        meta = f'{n} series' if n else '<span style="color: #E05A3A;">6 días sin tocar</span>'
        lst += (f'<div style="display: grid; grid-template-columns: 110px minmax(0, 1fr) 96px; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #22262C;">'
                f'<span style="font-size: 14px; font-weight: 500; color: {"#F2F3F5" if n else "#8A9099"};">{name}</span>'
                f'<span style="display: block; height: 6px; border-radius: 3px; background: #22262C; overflow: hidden;"><i style="display: block; height: 100%; width: {w}%; background: {col[lv]};"></i></span>'
                f'<span style="font-size: 12px; color: #8A9099; text-align: right;">{meta}</span></div>')
    lst += '</div>'
    return HEAD + phone(header('CUERPO', 'Semana 37 · 9 de 13 grupos', '', '') + seg + bodies + lst, 100) + nav('Cuerpo') + TAIL

files = {
  'Main.dc.html': main_session(),
  'CuerpoInicio.dc.html': inicio(),
  'CuerpoFranja.dc.html': sesion_franja(),
  'CuerpoGlifo.dc.html': sesion_glifo(),
  'CuerpoResumen.dc.html': resumen(),
  'CuerpoTab.dc.html': cuerpo_tab(),
}
for name, html in files.items():
    open(name, 'w', encoding='utf-8').write(html)
print('ok', list(files))
