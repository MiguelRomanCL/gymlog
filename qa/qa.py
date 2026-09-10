# Suite QA end-to-end (Playwright). Ejecutar con el preview corriendo en 127.0.0.1:4173.
import json, sys, traceback, datetime
from playwright.sync_api import sync_playwright, expect

URL = 'http://127.0.0.1:4173/'
results = []

def case(name):
    def deco(fn):
        results.append((name, fn)); return fn
    return deco

def fresh(pg, state=None):
    pg.goto(URL)
    pg.evaluate("localStorage.clear()")
    if state is not None:
        pg.evaluate("s => localStorage.setItem('sesion:v1', s)", state if isinstance(state, str) else json.dumps(state))
    pg.reload(); pg.wait_for_selector('.cal')

def kg_input(pg, ex=0, set_=0):
    return pg.locator('.ex').nth(ex).locator('.set-row:not(.set-head)').nth(set_).locator('input').nth(0)
def reps_input(pg, ex=0, set_=0):
    return pg.locator('.ex').nth(ex).locator('.set-row:not(.set-head)').nth(set_).locator('input').nth(1)
def today():
    return datetime.date.today().isoformat()
def dshift(days):
    return (datetime.date.today() + datetime.timedelta(days=days)).isoformat()
def wk(date, type_, ex, sets):
    return {"id": date, "date": date, "type": type_, "note": "", "exercises": [{"rowId": "r"+date, "exId": ex, "plannedId": None, "sets": sets}]}

@case('carga limpia sin errores, progreso vacío, rutinas visibles')
def t(pg):
    fresh(pg)
    expect(pg.locator('.type-btn')).to_have_count(4)
    expect(pg.locator('.type-btn.is-suggested strong')).to_have_text('Push')
    pg.click('nav >> text=Progreso'); expect(pg.locator('.progress')).to_contain_text('Todavía no hay')
    pg.click('nav >> text=Rutinas'); expect(pg.locator('.tpl-list li')).to_have_count(7)

@case('inputs: coma decimal, letras, negativos, reps enteros')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    expect(pg.locator('.ex')).to_have_count(7)
    kg_input(pg).fill('40,5'); expect(kg_input(pg)).to_have_value('40.5')
    kg_input(pg).fill('-12abc'); expect(kg_input(pg)).to_have_value('12')
    kg_input(pg).fill('1.2.3'); expect(kg_input(pg)).to_have_value('1.23')
    reps_input(pg).fill('10.7x'); expect(reps_input(pg)).to_have_value('107')
    reps_input(pg).fill('12'); kg_input(pg).fill('40')
    expect(pg.locator('.day-stats')).to_contain_text('1 series'); expect(pg.locator('.day-stats')).to_contain_text('480')

@case('steppers: desde vacío usa placeholder, clamp a cero')
def t(pg):
    fresh(pg, {"workouts": [wk(dshift(-2), 'push', 'chest-press', [{"kg": 50, "reps": 8}])], "templates": {}})
    pg.click('.type-btn >> nth=0')
    row = pg.locator('.ex').nth(0).locator('.set-row:not(.set-head)').nth(0)
    expect(kg_input(pg)).to_have_attribute('placeholder', '50')
    row.locator('button[aria-label="Más 2,5 kg"]').click(); expect(kg_input(pg)).to_have_value('52.5')
    for _ in range(25): row.locator('button[aria-label="Menos 2,5 kg"]').click()
    expect(kg_input(pg)).to_have_value('')
    row.locator('button[aria-label="Más 1 rep"]').click(); expect(reps_input(pg)).to_have_value('9')
    for _ in range(12): row.locator('button[aria-label="Menos 1 rep"]').click()
    expect(reps_input(pg)).to_have_value('')

@case('Enter pasa al siguiente campo')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    kg_input(pg).fill('40'); kg_input(pg).press('Enter')
    assert pg.evaluate("document.activeElement.getAttribute('aria-label')") == 'Serie 1 reps'
    reps_input(pg).press('Enter')
    assert pg.evaluate("document.activeElement.getAttribute('aria-label')") == 'Serie 1 kg'  # del segundo ejercicio

@case('series: agregar copia valores, quitar todas, volver a agregar')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    kg_input(pg).fill('40'); reps_input(pg).fill('10')
    ex = pg.locator('.ex').nth(0)
    ex.locator('text=+ Serie').click()
    expect(kg_input(pg, 0, 1)).to_have_value('40'); expect(reps_input(pg, 0, 1)).to_have_value('10')
    expect(pg.locator('.day-stats')).to_contain_text('2 series')
    for _ in range(2): ex.locator('button[aria-label="Quitar serie"]').first.click()
    expect(ex.locator('.set-row:not(.set-head)')).to_have_count(0)
    ex.locator('text=+ Serie').click(); expect(ex.locator('.set-row:not(.set-head)')).to_have_count(1)
    expect(kg_input(pg)).to_have_value('')

@case('marcar serie hecha muestra descanso; desmarcar lo cierra')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    btn = pg.locator('.ex').nth(0).locator('.set-n').first
    btn.click(); expect(pg.locator('.rest')).to_be_visible(); expect(pg.locator('.rest')).to_contain_text('1:')
    pg.wait_for_timeout(1200); expect(pg.locator('.rest')).to_contain_text('1:2')
    btn.click(); expect(pg.locator('.rest')).to_have_count(0)
    btn.click(); pg.locator('.rest').click(); expect(pg.locator('.rest')).to_have_count(0)
    expect(pg.locator('.set-row.is-done')).to_have_count(1)

@case('cambiar ejercicio: mismo músculo primero, nota de cambio, volver al original')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    pg.locator('.ex').nth(0).locator('text=Cambiar').click()
    expect(pg.locator('.sheet h3')).to_have_text('Reemplazar por')
    expect(pg.locator('.picker-muscle').first).to_have_text('Pecho')
    assert pg.locator('.picker-item', has_text='Chest press').count() == 0  # el actual no aparece
    assert pg.locator('.picker-item', has_text='Press inclinado con mancuernas').count() == 0  # ya está en la sesión
    pg.locator('.picker-item', has_text='Pec fly').count()  # pec fly está en plantilla -> excluido
    pg.locator('.picker-item', has_text='Press banca con barra').click()
    expect(pg.locator('.ex').nth(0).locator('h3')).to_have_text('Press banca con barra')
    expect(pg.locator('.ex').nth(0).locator('.swap-note')).to_contain_text('Cambio por Chest press')
    # volver al original
    pg.locator('.ex').nth(0).locator('text=Cambiar').click()
    pg.locator('.picker-item', has_text='Chest press').click()
    expect(pg.locator('.ex').nth(0).locator('.swap-note')).to_have_count(0)

@case('cambiar ejercicio con datos pide confirmación')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    kg_input(pg).fill('40'); reps_input(pg).fill('10')
    pg.once('dialog', lambda d: d.dismiss())
    pg.locator('.ex').nth(0).locator('text=Cambiar').click()
    pg.locator('.picker-item').first.click()
    expect(pg.locator('.sheet')).to_have_count(0)
    expect(kg_input(pg)).to_have_value('40')
    expect(pg.locator('.ex').nth(0).locator('h3')).to_have_text('Chest press (máquina)')
    pg.once('dialog', lambda d: d.accept())
    pg.locator('.ex').nth(0).locator('text=Cambiar').click()
    pg.locator('.picker-item').first.click()
    expect(kg_input(pg)).to_have_value('')

@case('agregar ejercicio: búsqueda sin tildes, sin resultados, Escape y backdrop cierran, no duplica')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    pg.click('text=+ Agregar ejercicio')
    pg.fill('.search', 'triceps'); assert pg.locator('.picker-item').count() >= 2
    pg.fill('.search', 'TRÍCEPS press'); expect(pg.locator('.picker-item', has_text='Tricep press')).to_have_count(1)
    pg.fill('.search', 'zzzz'); expect(pg.locator('.picker-list')).to_contain_text('Nada con ese nombre')
    pg.keyboard.press('Escape'); expect(pg.locator('.sheet')).to_have_count(0)
    pg.click('text=+ Agregar ejercicio'); pg.locator('.sheet-backdrop').click(position={'x': 5, 'y': 5}); expect(pg.locator('.sheet')).to_have_count(0)
    pg.click('text=+ Agregar ejercicio'); pg.fill('.search', 'chest press'); expect(pg.locator('.picker-item')).to_have_count(0)  # ya está
    pg.fill('.search', 'sentadilla'); pg.locator('.picker-item').first.click()
    expect(pg.locator('.ex')).to_have_count(8)

@case('quitar ejercicio: sin datos directo, con datos pide confirmación')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    pg.locator('.ex').nth(6).locator('text=Quitar').click(); expect(pg.locator('.ex')).to_have_count(6)
    kg_input(pg).fill('1')
    pg.once('dialog', lambda d: d.dismiss())
    pg.locator('.ex').nth(0).locator('text=Quitar').click(); expect(pg.locator('.ex')).to_have_count(6)
    pg.once('dialog', lambda d: d.accept())
    pg.locator('.ex').nth(0).locator('text=Quitar').click(); expect(pg.locator('.ex')).to_have_count(5)
    for _ in range(5): pg.locator('.ex').nth(0).locator('text=Quitar').click()
    expect(pg.locator('.empty')).to_be_visible()
    expect(pg.locator('.day-stats')).to_contain_text('0 series')

@case('cambiar tipo de día: sin datos ofrece recargar rutina; con datos conserva ejercicios')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    pg.once('dialog', lambda d: d.accept())
    pg.select_option('.type-select', 'pull')
    expect(pg.locator('.ex').nth(0).locator('h3')).to_contain_text('Jalón')
    kg_input(pg).fill('30')
    dialogs = []
    pg.on('dialog', lambda d: (dialogs.append(d.message), d.dismiss()))
    pg.select_option('.type-select', 'legs')
    expect(pg.locator('.ex').nth(0).locator('h3')).to_contain_text('Jalón')
    assert dialogs == [], dialogs
    kg_input(pg).fill('')
    pg.select_option('.type-select', 'push')
    expect(pg.locator('.ex').nth(0).locator('h3')).to_contain_text('Jalón')  # rechazó recargar
    expect(pg.locator('.type-select')).to_have_value('push')

@case('calendario: 30 meses adelante/atrás, cruzar año, seleccionar en otro mes, Ir a hoy, tab Sesiones vuelve a hoy')
def t(pg):
    fresh(pg)
    for _ in range(30): pg.click('button[aria-label="Mes siguiente"]')
    for _ in range(60): pg.click('button[aria-label="Mes anterior"]')
    expect(pg.locator('.today-btn')).to_be_visible()
    pg.locator('.cal-day').nth(0).click()
    expect(pg.locator('.cal-day.is-selected')).to_have_count(1)
    pg.click('.today-btn')
    expect(pg.locator('.cal-day.is-today.is-selected')).to_have_count(1)
    expect(pg.locator('.today-btn')).to_have_count(0)
    pg.click('button[aria-label="Mes siguiente"]'); pg.locator('.cal-day').nth(3).click()
    pg.click('nav >> text=Sesiones')
    expect(pg.locator('.cal-day.is-today.is-selected')).to_have_count(1)
    # día del mes: primer día cae en la columna correcta (lunes=0)
    y, m = map(int, today().split('-')[:2])
    lead = (datetime.date(y, m, 1).weekday())
    cells = pg.locator('.cal-grid > *').all_text_contents()[7:]
    assert cells[lead] == '1' and all(c == '' for c in cells[:lead]), cells[:8]

@case('varias sesiones: una por fecha, puntos, borrar, progreso cae al siguiente ejercicio')
def t(pg):
    fresh(pg, {"workouts": [wk(dshift(-7), 'push', 'chest-press', [{"kg": 40, "reps": 10}]), wk(dshift(-6), 'pull', 'lat-pulldown', [{"kg": 50, "reps": 10}]), wk(dshift(-5), 'pull', 'lat-pulldown', [{"kg": 55, "reps": 10}])], "templates": {}})
    expect(pg.locator('.cal-dot')).to_have_count(3)
    pg.click('nav >> text=Progreso')
    expect(pg.locator('.progress select')).to_have_value('lat-pulldown')
    pg.select_option('.progress select', 'chest-press'); expect(pg.locator('.big-number b')).to_have_text('40')
    pg.click('nav >> text=Sesiones')
    pg.locator('.cal-day', has=pg.locator('.cal-dot')).first.click()
    pg.once('dialog', lambda d: d.accept()); pg.click('text=Borrar sesión')
    expect(pg.locator('.cal-dot')).to_have_count(2)
    pg.click('nav >> text=Progreso')
    expect(pg.locator('.big-number b')).to_have_text('55')
    pg.click('text=1RM est.'); expect(pg.locator('.big-number b')).to_have_text('73,3')
    pg.click('text=Volumen'); expect(pg.locator('.big-number b')).to_have_text('550')
    expect(pg.locator('.chart')).to_be_visible()

@case('persistencia: recarga conserva; localStorage corrupto o basura no rompe')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0'); kg_input(pg).fill('40'); reps_input(pg).fill('10')
    pg.fill('.note', 'máquina ocupada')
    pg.reload(); pg.wait_for_selector('.cal')
    expect(kg_input(pg)).to_have_value('40'); expect(pg.locator('.note')).to_have_value('máquina ocupada')
    fresh(pg, '{bad json'); expect(pg.locator('.type-btn')).to_have_count(4)
    garbage = {"workouts": [
        {"date": "2026-09-01", "type": "xxx", "exercises": [{"exId": "chest-press", "sets": [None, {"kg": -5, "reps": "abc"}, {"kg": "40,5", "reps": 8.9}]}, {"exId": 42}, None]},
        {"date": "2026-09-01", "type": "push", "exercises": []},  # duplicado de fecha
        {"date": "not-a-date"}, "string", None,
        {"date": "2026-09-02", "type": "legs", "exercises": [{"exId": "no-existe", "sets": [{"kg": 10, "reps": 10}]}]}],
        "templates": {"push": ["chest-press", "no-existe", "chest-press", 5], "legs": "nope"}}
    fresh(pg, garbage)
    st = json.loads(pg.evaluate("localStorage.getItem('sesion:v1')"))
    assert len(st['workouts']) == 2 and st['workouts'][0]['type'] == 'otro'
    assert st['workouts'][0]['exercises'][0]['sets'] == [{"kg": "", "reps": "", "done": False}, {"kg": "", "reps": "", "done": False}, {"kg": "40.5", "reps": "8", "done": False}]
    assert st['templates']['push'] == ['chest-press'] and len(st['templates']['legs']) == 7
    pg.click('button[aria-label="Mes anterior"]') if today() < '2026-09-01' else None
    pg.locator('.cal-day', has_text='2').first.click()
    expect(pg.locator('.ex h3').first).to_have_text('Ejercicio desconocido')
    pg.click('nav >> text=Progreso'); expect(pg.locator('.progress')).to_be_visible()

@case('importar: archivo inválido avisa, válido reemplaza tras confirmar')
def t(pg):
    fresh(pg); pg.click('nav >> text=Rutinas')
    msgs = []
    pg.on('dialog', lambda d: (msgs.append(d.message), d.accept()))
    pg.set_input_files('input[type=file]', {'name': 'x.json', 'mimeType': 'application/json', 'buffer': b'{"nope":1}'})
    pg.wait_for_timeout(300); assert any('formato' in m for m in msgs), msgs
    pg.set_input_files('input[type=file]', {'name': 'x.json', 'mimeType': 'application/json', 'buffer': b'not json'})
    pg.wait_for_timeout(300); assert sum('formato' in m for m in msgs) == 2, msgs
    good = json.dumps({"workouts": [wk(dshift(-1), 'legs', 'leg-press', [{"kg": 100, "reps": 12}])], "templates": {"push": ["pec-fly"]}}).encode()
    pg.set_input_files('input[type=file]', {'name': 'x.json', 'mimeType': 'application/json', 'buffer': good})
    pg.wait_for_timeout(300)
    expect(pg.locator('.tpl-list li')).to_have_count(1)
    pg.click('nav >> text=Sesiones'); expect(pg.locator('.cal-dot')).to_have_count(1)

@case('rutinas: mover en bordes, quitar, agregar; nueva sesión refleja cambios')
def t(pg):
    fresh(pg); pg.click('nav >> text=Rutinas')
    first = pg.locator('.tpl-list li').first
    first.locator('button[aria-label="Subir"]').click()  # borde: no cambia
    expect(pg.locator('.tpl-list li').first).to_contain_text('Chest press')
    first.locator('button[aria-label="Bajar"]').click()
    expect(pg.locator('.tpl-list li').nth(1)).to_contain_text('Chest press')
    pg.locator('.tpl-list li').last.locator('button[aria-label="Bajar"]').click()
    for _ in range(7): pg.locator('.tpl-list li button[aria-label="Quitar"]').first.click()
    expect(pg.locator('.tpl-list')).to_contain_text('Vacío')
    pg.click('text=+ Agregar ejercicio'); pg.fill('.search', 'hack'); pg.locator('.picker-item').first.click()
    expect(pg.locator('.tpl-list li')).to_have_count(1)
    pg.click('.seg >> text=Legs'); expect(pg.locator('.tpl-list li')).to_have_count(7)
    pg.click('nav >> text=Sesiones'); pg.click('.type-btn >> nth=0')
    expect(pg.locator('.ex')).to_have_count(1); expect(pg.locator('.ex h3')).to_have_text('Hack squat')

@case('repetir sesión anterior del mismo tipo')
def t(pg):
    fresh(pg, {"workouts": [wk(dshift(-3), 'legs', 'leg-press', [{"kg": 100, "reps": 12}, {"kg": 100, "reps": 10}, {"kg": "", "reps": ""}])], "templates": {}})
    expect(pg.locator('.type-btn.is-suggested strong')).to_have_text('Push')
    assert pg.locator('text=Repetir').count() == 0  # no hay push previo
    pg.evaluate("localStorage.clear()")
    fresh(pg, {"workouts": [wk(dshift(-3), 'pull', 'seated-row', [{"kg": 1, "reps": 1}]), wk(dshift(-2), 'legs', 'leg-press', [{"kg": 100, "reps": 12}, {"kg": 100, "reps": 10}])], "templates": {}})
    expect(pg.locator('.type-btn.is-suggested strong')).to_have_text('Push')
    pg.evaluate("localStorage.clear()")
    fresh(pg, {"workouts": [wk(dshift(-2), 'pull', 'seated-row', [{"kg": 1, "reps": 1}]), wk(dshift(-3), 'legs', 'leg-press', [{"kg": 100, "reps": 12}, {"kg": 100, "reps": 10}])], "templates": {}})
    expect(pg.locator('.type-btn.is-suggested strong')).to_have_text('Legs')
    pg.click('text=Repetir Legs')
    expect(pg.locator('.ex')).to_have_count(1)
    expect(pg.locator('.ex .set-row:not(.set-head)')).to_have_count(2)
    expect(kg_input(pg)).to_have_attribute('placeholder', '100')

@case('clics rápidos: 40 series, quitar todo, agregar/quitar ejercicios en ráfaga')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    ex = pg.locator('.ex').nth(0)
    for _ in range(40): ex.locator('text=+ Serie').click(no_wait_after=True)
    expect(ex.locator('.set-row:not(.set-head)')).to_have_count(41)
    while ex.locator('button[aria-label="Quitar serie"]').count(): ex.locator('button[aria-label="Quitar serie"]').first.click()
    for _ in range(3):
        pg.click('text=+ Agregar ejercicio'); pg.locator('.picker-item').first.click()
    expect(pg.locator('.ex')).to_have_count(10)
    for _ in range(10): pg.locator('.ex').first.locator('text=Quitar').click()
    expect(pg.locator('.ex')).to_have_count(0)

@case('nota: límite de 2000 caracteres')
def t(pg):
    fresh(pg); pg.click('.type-btn >> nth=0')
    pg.fill('.note', 'a' * 2500)
    assert len(pg.locator('.note').input_value()) == 2000

@case('escritorio 1280px renderiza sin errores')
def t(pg):
    pg.set_viewport_size({'width': 1280, 'height': 800}); fresh(pg); pg.click('.type-btn >> nth=1')
    expect(pg.locator('.ex')).to_have_count(7); pg.set_viewport_size({'width': 390, 'height': 844})

# ---- runner ----
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CL')
    passed = failed = 0
    for name, fn in results:
        pg = ctx.new_page()  # página nueva por caso: sin handlers de diálogo heredados
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append('console.error: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        before = 0
        try:
            fn(pg)
            if len(errors) > before: raise AssertionError('errores JS: ' + '; '.join(errors[before:]))
            passed += 1; print('PASS', name)
        except Exception as e:
            failed += 1; print('FAIL', name, '->', str(e).splitlines()[0][:300])
        pg.close()
    print(f'\n{passed} pasaron, {failed} fallaron')
    b.close()
    sys.exit(1 if failed else 0)
