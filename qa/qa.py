# Suite QA end-to-end (Playwright). Ejecutar con el preview corriendo en 127.0.0.1:4173.
import json, sys, datetime, re
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

def start_push(pg):
    start_type(pg, 'push')
def start_type(pg, t):
    pg.click('.other-btn'); pg.click(f'.type-btn[data-type={t}]'); pg.wait_for_selector('.session')
def set_row(pg, i=0):
    return pg.locator('.ex-card .set-row').nth(i)
def kg_input(pg, i=0):
    return set_row(pg, i).locator('input').nth(0)
def reps_input(pg, i=0):
    return set_row(pg, i).locator('input').nth(1)
def today():
    return datetime.date.today().isoformat()
def dshift(days):
    return (datetime.date.today() + datetime.timedelta(days=days)).isoformat()
def wk(date, type_, ex, sets, done=True):
    return {"id": date, "date": date, "type": type_, "note": "", "exercises": [{"rowId": "r"+date, "exId": ex, "plannedId": None, "sets": [dict(s, done=done) for s in sets]}]}
def st(*ws, **extra):
    return {"workouts": list(ws), "templates": {}, "tv": 2, **extra}

@case('carga limpia: inicio con cuerpo y sugerencia Push, Cuerpo 0 de 13, progreso vacío, rutinas 7')
def t(pg):
    fresh(pg)
    expect(pg.locator('.start')).to_be_visible()
    expect(pg.locator('.suggest-head h2')).to_have_text('Te toca Push')
    expect(pg.locator('.start .body-m.lvl-0')).to_have_count(14)
    pg.click('nav >> text=Cuerpo'); expect(pg.locator('.coverage')).to_contain_text('0 de 13')
    pg.click('nav >> text=Progreso'); expect(pg.locator('.progress')).to_contain_text('Todavía no hay')
    pg.click('nav >> text=Rutinas'); expect(pg.locator('.tpl-list li')).to_have_count(7)

@case('empezar desde la sugerencia: 7 ejercicios, foco en el primero, siguiente, franja')
def t(pg):
    fresh(pg); pg.click('.start-btn'); pg.wait_for_selector('.session')
    expect(pg.locator('.s-progress i')).to_have_count(7)
    expect(pg.locator('.ex-card h2')).to_have_text('Shoulder press (máquina)')
    expect(pg.locator('.ex-card .glyph span')).to_have_text('Hombro')
    expect(pg.locator('.next-card b')).to_have_text('Chest press (máquina)')
    expect(pg.locator('.strip .chips')).to_contain_text('Hombro 0')
    expect(pg.locator('.s-head .muted')).to_contain_text('Ejercicio 1 de 7')

@case('inputs: coma decimal, letras, negativos, reps enteros, stats en cabecera')
def t(pg):
    fresh(pg); start_push(pg)
    kg_input(pg).fill('40,5'); expect(kg_input(pg)).to_have_value('40.5')
    kg_input(pg).fill('abc'); expect(kg_input(pg)).to_have_value('')
    kg_input(pg).fill('-5'); expect(kg_input(pg)).to_have_value('5')
    kg_input(pg).fill('1.2.3'); expect(kg_input(pg)).to_have_value('1.23')
    reps_input(pg).fill('10.7'); expect(reps_input(pg)).to_have_value('107')
    kg_input(pg).fill('40'); reps_input(pg).fill('12')
    expect(pg.locator('.s-head .muted')).to_contain_text('1 serie ·'); expect(pg.locator('.s-head .muted')).to_contain_text('480 kg')

@case('steppers: desde vacío usa la referencia, clamp a cero')
def t(pg):
    fresh(pg, st(wk(dshift(-2), 'push', 'shoulder-press-machine', [{"kg": 50, "reps": 8}]))); start_push(pg)
    expect(kg_input(pg)).to_have_attribute('placeholder', '50')
    expect(pg.locator('.ex-card')).to_contain_text('Última vez')
    pg.click('button[aria-label="Más 2,5 kg"]'); expect(kg_input(pg)).to_have_value('52.5')
    for _ in range(25): pg.click('button[aria-label="Menos 2,5 kg"]')
    expect(kg_input(pg)).to_have_value('')
    pg.click('button[aria-label="Más 1 rep"]'); expect(reps_input(pg)).to_have_value('9')
    for _ in range(12): pg.click('button[aria-label="Menos 1 rep"]')
    expect(reps_input(pg)).to_have_value('')

@case('Enter pasa al siguiente campo')
def t(pg):
    fresh(pg); start_push(pg)
    kg_input(pg).click(); pg.keyboard.type('40'); pg.keyboard.press('Enter')
    expect(reps_input(pg)).to_be_focused()

@case('Serie hecha: completa con la referencia, arranca cronómetro y descanso; sin referencia enfoca el input')
def t(pg):
    fresh(pg, st(wk(dshift(-2), 'push', 'shoulder-press-machine', [{"kg": 50, "reps": 8}]))); start_push(pg)
    pg.click('.act-done')
    # ejercicio completo (1 serie) → pasa solo al siguiente
    expect(pg.locator('.ex-card h2')).to_have_text('Chest press (máquina)')
    expect(pg.locator('.s-timer.is-running')).to_have_count(1)
    expect(pg.locator('.act-rest')).to_contain_text('Descanso 1:')
    expect(pg.locator('.strip .chips')).to_contain_text('Hombro 1')
    pg.click('.act-rest'); expect(pg.locator('.act-rest')).to_have_text('Descanso 1:30')
    # sin referencia ni datos: no marca, enfoca kg
    pg.click('.act-done')
    expect(kg_input(pg)).to_be_focused()
    expect(pg.locator('.ex-card .set-row.is-done')).to_have_count(0)
    # volver al primero: quedó hecho con 50 × 8; desmarcar desde el círculo
    pg.locator('.list-toggle').click(); pg.locator('.ex-list .ex-row').first.click()
    expect(pg.locator('.ex-card h2')).to_have_text('Shoulder press (máquina)')
    expect(set_row(pg, 0)).to_have_class(re.compile('is-done'))
    expect(kg_input(pg)).to_have_value('50'); expect(reps_input(pg)).to_have_value('8')
    pg.locator('.set-n').first.click(); expect(pg.locator('.ex-card .set-row.is-done')).to_have_count(0)

@case('series: + Serie copia valores, Serie hecha con todo hecho agrega otra, quitar todas y volver')
def t(pg):
    fresh(pg); start_push(pg)
    kg_input(pg).fill('30'); reps_input(pg).fill('10')
    pg.click('.add-set'); expect(pg.locator('.ex-card .set-row')).to_have_count(2)
    expect(kg_input(pg, 1)).to_have_value('30'); expect(reps_input(pg, 1)).to_have_value('10')
    pg.click('.act-done'); pg.click('.act-done')
    expect(pg.locator('.ex-card h2')).to_have_text('Chest press (máquina)')  # completo → siguiente
    pg.locator('.list-toggle').click(); pg.locator('.ex-list .ex-row').first.click()
    expect(pg.locator('.ex-card .set-row.is-done')).to_have_count(2)
    pg.click('.act-done'); expect(pg.locator('.ex-card .set-row')).to_have_count(3)  # todo hecho → agrega serie
    expect(pg.locator('.ex-card .set-row.is-active')).to_have_count(1)
    for _ in range(3): pg.locator('button[aria-label="Quitar serie"]').first.click()
    expect(pg.locator('.ex-card')).to_contain_text('Sin series')
    pg.click('.add-set'); expect(pg.locator('.ex-card .set-row')).to_have_count(1)
    expect(kg_input(pg)).to_have_value('')

@case('flujo completo: siguiente, terminar, resumen, guardar, reabrir')
def t(pg):
    fresh(pg); start_push(pg)
    pg.click('.act-next'); expect(pg.locator('.ex-card h2')).to_have_text('Chest press (máquina)')
    expect(pg.locator('.s-head .muted')).to_contain_text('Ejercicio 2 de 7')
    pg.locator('.list-toggle').click(); pg.locator('.ex-list .ex-row').first.click()
    for i in range(7):
        kg_input(pg).fill('10'); reps_input(pg).fill('10'); pg.click('.act-done')
    expect(pg.locator('.s-progress i.is-done')).to_have_count(7)
    expect(pg.locator('.act-finish')).to_be_visible()
    pg.click('.act-finish'); expect(pg.locator('.summary')).to_be_visible()
    expect(pg.locator('.summary h1')).to_have_text('Push listo')
    expect(pg.locator('.stat-grid')).to_contain_text('7')
    expect(pg.locator('.stat-grid')).to_contain_text('700')
    expect(pg.locator('.muscle-list li')).to_have_count(3)  # Hombro, Pecho, Tríceps
    pg.click('.back'); expect(pg.locator('.session')).to_be_visible()
    pg.click('.act-finish'); pg.click('.save')
    expect(pg.locator('.reopen')).to_be_visible(); expect(pg.locator('.cal-day.is-finished')).to_have_count(1)
    pg.reload(); pg.wait_for_selector('.summary')
    pg.click('.reopen'); expect(pg.locator('.session')).to_be_visible()

@case('cambiar ejercicio: mismo músculo primero, nota de cambio, volver al original')
def t(pg):
    fresh(pg); start_push(pg)
    pg.locator('.ex-card-foot >> text=Cambiar').click()
    expect(pg.locator('.sheet h3')).to_have_text('Reemplazar por')
    expect(pg.locator('.picker-muscle').first).to_have_text('Hombro')
    assert pg.locator('.picker-item', has_text='Shoulder press').count() == 0
    assert pg.locator('.picker-item', has_text='Elevaciones laterales con mancuernas').count() == 0  # ya está en la sesión
    pg.locator('.picker-item', has_text='Press militar en Smith').click()
    expect(pg.locator('.ex-card h2')).to_have_text('Press militar en Smith')
    expect(pg.locator('.swap-note')).to_contain_text('Cambio por Shoulder press')
    pg.locator('.ex-card-foot >> text=Cambiar').click()
    pg.locator('.picker-item', has_text='Shoulder press').click()
    expect(pg.locator('.swap-note')).to_have_count(0)

@case('cambiar ejercicio con datos pide confirmación')
def t(pg):
    fresh(pg); start_push(pg)
    kg_input(pg).fill('40'); reps_input(pg).fill('10')
    pg.once('dialog', lambda d: d.dismiss())
    pg.locator('.ex-card-foot >> text=Cambiar').click()
    pg.locator('.picker-item').first.click()
    expect(pg.locator('.sheet')).to_have_count(0)
    expect(kg_input(pg)).to_have_value('40')
    expect(pg.locator('.ex-card h2')).to_have_text('Shoulder press (máquina)')

@case('agregar ejercicio: búsqueda sin tildes, sin resultados, Escape y backdrop cierran, no duplica')
def t(pg):
    fresh(pg); start_push(pg)
    pg.locator('.list-toggle').click(); pg.click('.add-ex')
    expect(pg.locator('.sheet h3')).to_have_text('Agregar ejercicio')
    pg.fill('.search', 'jalon'); expect(pg.locator('.picker-item').first).to_contain_text('Jalón')
    pg.fill('.search', 'zzz'); expect(pg.locator('.picker-list')).to_contain_text('Nada con ese nombre')
    pg.keyboard.press('Escape'); expect(pg.locator('.sheet')).to_have_count(0)
    pg.click('.add-ex'); pg.locator('.sheet-backdrop').click(position={'x': 5, 'y': 5}); expect(pg.locator('.sheet')).to_have_count(0)
    pg.click('.add-ex'); pg.locator('.picker-item', has_text='Jalón al pecho').click()
    expect(pg.locator('.ex-list li')).to_have_count(8)
    pg.click('.add-ex'); assert pg.locator('.picker-item', has_text='Jalón al pecho').count() == 0
    pg.keyboard.press('Escape')

@case('quitar ejercicio: sin datos directo, con datos pide confirmación, sin ejercicios')
def t(pg):
    fresh(pg); start_push(pg)
    pg.locator('.ex-card-foot >> text=Quitar').click(); expect(pg.locator('.s-progress i')).to_have_count(6)
    kg_input(pg).fill('1')
    pg.once('dialog', lambda d: d.dismiss())
    pg.locator('.ex-card-foot >> text=Quitar').click(); expect(pg.locator('.s-progress i')).to_have_count(6)
    pg.once('dialog', lambda d: d.accept())
    pg.locator('.ex-card-foot >> text=Quitar').click(); expect(pg.locator('.s-progress i')).to_have_count(5)
    for _ in range(5): pg.locator('.ex-card-foot >> text=Quitar').click()
    expect(pg.locator('.empty')).to_be_visible()
    expect(pg.locator('.act-done')).to_be_disabled()
    expect(pg.locator('.act-finish')).to_be_visible()

@case('cambiar tipo: sin datos ofrece recargar rutina; con datos conserva; cargar los que faltan')
def t(pg):
    fresh(pg); start_push(pg)
    pg.click('.s-type'); pg.once('dialog', lambda d: d.accept())
    pg.click('.type-chips [data-type=pull]')
    expect(pg.locator('.ex-card h2')).to_have_text('Dominadas'); expect(pg.locator('.s-type')).to_have_text('Pull')
    kg_input(pg).fill('30')
    dialogs = []
    pg.on('dialog', lambda d: (dialogs.append(d.message), d.dismiss()))
    pg.click('.s-type'); pg.click('.type-chips [data-type=legs]')
    expect(pg.locator('.ex-card h2')).to_have_text('Dominadas'); expect(pg.locator('.s-type')).to_have_text('Legs')
    assert dialogs == [], dialogs
    pg.locator('.list-toggle').click()
    expect(pg.locator('.load-tpl')).to_contain_text('faltan 8')
    pg.click('.load-tpl'); expect(pg.locator('.ex-list li')).to_have_count(17)
    expect(pg.locator('.load-tpl')).to_have_count(0)

@case('calendario: semana por defecto, mes al tocar, navegar, ir a hoy, otro día, tab Hoy vuelve')
def t(pg):
    fresh(pg)
    expect(pg.locator('.cal-day')).to_have_count(7)
    expect(pg.locator('.cal-day.is-today.is-selected')).to_have_count(1)
    pg.click('button[aria-label="Siguiente"]'); expect(pg.locator('.cal-day.is-today')).to_have_count(0)
    expect(pg.locator('.today-btn')).to_be_visible(); pg.click('.today-btn')
    expect(pg.locator('.cal-day.is-today.is-selected')).to_have_count(1)
    pg.click('.cal-toggle'); assert pg.locator('.cal-day').count() >= 28
    for _ in range(30): pg.click('button[aria-label="Siguiente"]')
    for _ in range(60): pg.click('button[aria-label="Anterior"]')
    pg.click('.today-btn'); expect(pg.locator('.cal-day.is-today.is-selected')).to_have_count(1)
    y, m = map(int, today().split('-')[:2])
    lead = datetime.date(y, m, 1).weekday()
    cells = pg.locator('.cal-grid > *').all_text_contents()[7:]
    assert cells[lead] == '1' and all(c == '' for c in cells[:lead]), cells[:8]
    pg.click('.cal-toggle'); expect(pg.locator('.cal-day')).to_have_count(7)
    pg.click('button[aria-label="Siguiente"]'); pg.locator('.cal-day').nth(3).click()
    expect(pg.locator('.start h1')).not_to_have_text('')
    pg.click('nav >> text=Hoy'); expect(pg.locator('.cal-day.is-today.is-selected')).to_have_count(1)

@case('varias sesiones: puntos, borrar sesión, progreso cae al siguiente ejercicio')
def t(pg):
    fresh(pg, st(wk(dshift(-7), 'push', 'chest-press', [{"kg": 40, "reps": 10}]), wk(dshift(-6), 'pull', 'lat-pulldown', [{"kg": 50, "reps": 10}]), wk(dshift(-5), 'pull', 'lat-pulldown', [{"kg": 55, "reps": 10}])))
    pg.click('.cal-toggle')
    dots = pg.locator('.cal-dot').count()
    pg.click('button[aria-label="Anterior"]'); dots += pg.locator('.cal-dot').count()
    assert dots == 3, dots
    pg.click('nav >> text=Progreso')
    expect(pg.locator('.progress select')).to_have_value('lat-pulldown')
    pg.select_option('.progress select', 'chest-press'); expect(pg.locator('.big-number b')).to_have_text('40')
    pg.click('nav >> text=Hoy'); pg.click('.cal-toggle')
    if pg.locator('.cal-day', has=pg.locator('.cal-dot')).count() == 0: pg.click('button[aria-label="Anterior"]')
    pg.locator('.cal-day', has=pg.locator('.cal-dot')).first.click()
    pg.wait_for_selector('.session'); pg.locator('.list-toggle').click()
    pg.once('dialog', lambda d: d.accept()); pg.click('.delete-session')
    expect(pg.locator('.start')).to_be_visible()
    pg.click('nav >> text=Progreso'); expect(pg.locator('.progress select option')).to_have_count(1)

@case('persistencia: recarga conserva; localStorage corrupto o basura no rompe')
def t(pg):
    fresh(pg); start_push(pg); kg_input(pg).fill('33'); reps_input(pg).fill('8')
    pg.reload(); pg.wait_for_selector('.session'); expect(kg_input(pg)).to_have_value('33')
    fresh(pg, 'not json'); expect(pg.locator('.start')).to_be_visible()
    fresh(pg, '{"workouts": "nope"}'); expect(pg.locator('.start')).to_be_visible()
    garbage = {"workouts": [
        {"id": 1, "date": "2026-09-01", "type": "yoga", "exercises": [{"exId": "chest-press", "sets": [None, "x", {"kg": "40,5", "reps": 8.9, "done": 1}]}]},
        {"date": "not-a-date"}, "string", None,
        {"date": "2026-09-02", "type": "legs", "exercises": [{"exId": "no-existe", "sets": [{"kg": 10, "reps": 10}]}]}],
        "tv": 2, "templates": {"push": ["chest-press", "no-existe", "chest-press", 5], "legs": "nope"}}
    fresh(pg, garbage)
    s = json.loads(pg.evaluate("localStorage.getItem('sesion:v1')"))
    assert len(s['workouts']) == 2 and s['workouts'][0]['type'] == 'otro' and s['workouts'][0]['finished'] is False
    assert s['workouts'][0]['exercises'][0]['sets'] == [{"kg": "", "reps": "", "done": False}, {"kg": "", "reps": "", "done": False}, {"kg": "40.5", "reps": "8", "done": True}]
    assert s['templates']['push'] == ['chest-press'] and len(s['templates']['legs']) == 8

@case('importar: archivo inválido avisa, válido reemplaza tras confirmar')
def t(pg):
    fresh(pg); pg.click('nav >> text=Rutinas')
    msgs = []
    pg.on('dialog', lambda d: (msgs.append(d.message), d.accept()))
    pg.set_input_files('input[type=file]', {'name': 'x.json', 'mimeType': 'application/json', 'buffer': b'{"nope":1}'})
    pg.wait_for_timeout(300); assert any('formato' in m for m in msgs), msgs
    pg.set_input_files('input[type=file]', {'name': 'x.json', 'mimeType': 'application/json', 'buffer': b'not json'})
    pg.wait_for_timeout(300); assert sum('formato' in m for m in msgs) == 2, msgs
    good = json.dumps(st(wk(dshift(-1), 'legs', 'leg-press', [{"kg": 100, "reps": 12}]), templates={"push": ["pec-fly"]})).encode()
    pg.set_input_files('input[type=file]', {'name': 'x.json', 'mimeType': 'application/json', 'buffer': good})
    pg.wait_for_timeout(300)
    expect(pg.locator('.tpl-list li')).to_have_count(1)
    pg.click('nav >> text=Cuerpo'); expect(pg.locator('.coverage')).to_contain_text('1 de 13')

@case('rutinas: mover en bordes, quitar, agregar; nueva sesión refleja cambios')
def t(pg):
    fresh(pg); pg.click('nav >> text=Rutinas')
    first = pg.locator('.tpl-list li').first
    first.locator('button[aria-label="Subir"]').click()
    expect(pg.locator('.tpl-list li').first).to_contain_text('Shoulder press')
    first.locator('button[aria-label="Bajar"]').click()
    expect(pg.locator('.tpl-list li').nth(1)).to_contain_text('Shoulder press')
    pg.locator('.tpl-list li').last.locator('button[aria-label="Bajar"]').click()
    for _ in range(7): pg.locator('.tpl-list li button[aria-label="Quitar"]').first.click()
    expect(pg.locator('.tpl-list')).to_contain_text('Vacío')
    pg.click('text=+ Agregar ejercicio'); pg.fill('.search', 'hack'); pg.locator('.picker-item').first.click()
    expect(pg.locator('.tpl-list li')).to_have_count(1)
    pg.click('.seg >> text=Legs'); expect(pg.locator('.tpl-list li')).to_have_count(8)
    pg.click('nav >> text=Hoy'); start_push(pg)
    expect(pg.locator('.s-progress i')).to_have_count(1); expect(pg.locator('.ex-card h2')).to_have_text('Hack squat')

@case('cronómetro: arranca con la primera serie, pausa desde la cabecera, persiste, reinicia')
def t(pg):
    fresh(pg); start_push(pg)
    expect(pg.locator('.s-timer b')).to_have_text('0:00')
    kg_input(pg).fill('10'); reps_input(pg).fill('10'); pg.click('.act-done')
    expect(pg.locator('.s-timer.is-running')).to_have_count(1)
    pg.wait_for_timeout(2200); assert pg.locator('.s-timer b').inner_text() != '0:00'
    pg.click('.s-timer'); expect(pg.locator('.s-timer.is-running')).to_have_count(0)
    shown = pg.locator('.s-timer b').inner_text()
    pg.reload(); pg.wait_for_selector('.s-timer'); expect(pg.locator('.s-timer b')).to_have_text(shown)
    pg.locator('.list-toggle').click(); pg.click('.timer-reset'); expect(pg.locator('.s-timer b')).to_have_text('0:00')
    pg.click('.s-timer'); pg.reload(); pg.wait_for_selector('.s-timer.is-running')

@case('cobertura: cuerpo gris sin datos, se pinta con series, faltantes, ventanas 14 y 30 días')
def t(pg):
    fresh(pg); pg.click('nav >> text=Cuerpo')
    expect(pg.locator('.coverage .body-m.lvl-0')).to_have_count(14)
    fresh(pg, st(wk(dshift(-2), 'push', 'chest-press', [{"kg": 40, "reps": 10}] * 3), wk(dshift(-10), 'legs', 'leg-press', [{"kg": 100, "reps": 10}] * 7), wk(dshift(-20), 'pull', 'lat-pulldown', [{"kg": 50, "reps": 10}] * 12)))
    pg.click('nav >> text=Cuerpo')
    expect(pg.locator('.coverage')).to_contain_text('1 de 13')
    expect(pg.locator('.coverage .body-m.lvl-1')).to_have_count(1)
    expect(pg.locator('.cov-list li.is-missing')).to_have_count(12)
    expect(pg.locator('.cov-list li.is-missing').first).to_contain_text('10 días sin tocar')
    pg.click('.seg.small >> text=14 días'); expect(pg.locator('.coverage')).to_contain_text('2 de 13')
    expect(pg.locator('.coverage .body-m.lvl-2')).to_have_count(1)
    pg.click('.seg.small >> text=30 días'); expect(pg.locator('.coverage')).to_contain_text('3 de 13')
    expect(pg.locator('.coverage .body-m.lvl-3')).to_have_count(1)

@case('rutinas por defecto: clásicos primero y migración de versión')
def t(pg):
    fresh(pg, {"workouts": [], "templates": {"push": ["skullcrusher"]}})  # sin tv → se reemplaza
    pg.click('nav >> text=Rutinas')
    expect(pg.locator('.tpl-list li').nth(0)).to_contain_text('Shoulder press')
    expect(pg.locator('.tpl-list li').nth(1)).to_contain_text('Chest press')
    expect(pg.locator('.tpl-list li').nth(2)).to_contain_text('Fondos de tríceps')
    fresh(pg, {"workouts": [], "templates": {"push": ["skullcrusher"]}, "tv": 2})
    pg.click('nav >> text=Rutinas'); expect(pg.locator('.tpl-list li')).to_have_count(1)

@case('resumen: récord cuando el 1RM de hoy supera el anterior')
def t(pg):
    fresh(pg, st(wk(dshift(-2), 'push', 'chest-press', [{"kg": 40, "reps": 10}]))); start_push(pg)
    pg.click('.act-next'); expect(pg.locator('.ex-card h2')).to_have_text('Chest press (máquina)')
    kg_input(pg).fill('45'); reps_input(pg).fill('10'); pg.click('.act-done')
    pg.locator('.list-toggle').click(); expect(pg.locator('.ex-list li.is-done')).to_have_count(1)
    pg.locator('.ex-list .ex-row').last.click()
    expect(pg.locator('.act-finish')).to_be_visible(); pg.click('.act-finish')
    expect(pg.locator('.muscle-list')).to_contain_text('Pecho')
    expect(pg.locator('.muscle-list')).to_contain_text('récord 45 kg')
    expect(pg.locator('.summary .body-m.lvl-1')).to_have_count(1)

@case('inicio: sugerencia sigue el ciclo con razón, Otro muestra tipos, repetir sesión anterior')
def t(pg):
    fresh(pg, st(wk(dshift(-1), 'push', 'chest-press', [{"kg": 40, "reps": 10}]), wk(dshift(-4), 'pull', 'lat-pulldown', [{"kg": 50, "reps": 10}, {"kg": 50, "reps": 10}])))
    expect(pg.locator('.suggest-head h2')).to_have_text('Te toca Pull')
    txt = pg.locator('.suggest p').inner_text(); assert 'sin' in txt, txt
    expect(pg.locator('.start')).to_contain_text('2 de 13 grupos')
    pg.click('.other-btn'); expect(pg.locator('.type-btn')).to_have_count(4)
    expect(pg.locator('.type-btn.is-suggested strong')).to_have_text('Pull')
    expect(pg.locator('.repeat-btn')).to_contain_text('Repetir Pull')
    pg.click('.repeat-btn'); pg.wait_for_selector('.session')
    expect(pg.locator('.s-progress i')).to_have_count(1); expect(pg.locator('.ex-card .set-row')).to_have_count(2)
    expect(pg.locator('.ex-card h2')).to_have_text('Jalón al pecho (lat pulldown)')

@case('clics rápidos: 40 series, quitar todo, agregar/quitar ejercicios en ráfaga')
def t(pg):
    fresh(pg); start_push(pg)
    for _ in range(40): pg.click('.add-set')
    expect(pg.locator('.ex-card .set-row')).to_have_count(41)
    for _ in range(41): pg.locator('button[aria-label="Quitar serie"]').first.click()
    expect(pg.locator('.ex-card')).to_contain_text('Sin series')
    pg.locator('.list-toggle').click()
    for _ in range(5):
        pg.click('.add-ex'); pg.locator('.picker-item').first.click()
    expect(pg.locator('.ex-list li')).to_have_count(12)

@case('nota: límite de 2000 caracteres')
def t(pg):
    fresh(pg); start_push(pg); pg.locator('.list-toggle').click()
    pg.fill('.note', 'x' * 2500); assert len(pg.input_value('.note')) == 2000

@case('escritorio 1280px renderiza sin errores')
def t(pg):
    pg.set_viewport_size({'width': 1280, 'height': 800}); fresh(pg); start_type(pg, 'pull')
    expect(pg.locator('.s-progress i')).to_have_count(9); pg.set_viewport_size({'width': 390, 'height': 844})

# ---- runner ----
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='es-CL')
    passed = failed = 0
    for name, fn in results:
        pg = ctx.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        before = 0
        try:
            fn(pg)
            if len(errors) > before: raise AssertionError('errores JS: ' + '; '.join(errors[before:]))
            passed += 1; print('PASS', name)
        except Exception as e:
            failed += 1; print('FAIL', name, '->', (str(e).splitlines() or [repr(e)])[0][:300])
        pg.close()
    print(f'\n{passed} pasaron, {failed} fallaron')
    b.close()
    sys.exit(1 if failed else 0)
