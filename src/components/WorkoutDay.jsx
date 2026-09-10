import { useEffect, useRef, useState } from 'react'
import { DAY_TYPES, EX_BY_ID } from '../data/exercises'
import { bestSet, fmtDate, uid, cap, num, setIsValid, sanitizeDecimal, sanitizeInt, timerElapsed, fmtClock } from '../storage'
import ExercisePicker from './ExercisePicker'

const ORDER = ['push', 'pull', 'legs']
const emptySet = () => ({ kg: '', reps: '', done: false })
const REST_SECONDS = 90

// Sugerencia: el siguiente del ciclo según la última sesión registrada.
export function suggestType(workouts, date) {
  const prev = workouts.filter((w) => w.date < date && ORDER.includes(w.type)).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
  if (!prev) return 'push'
  return ORDER[(ORDER.indexOf(prev.type) + 1) % ORDER.length]
}

function prevOfType(workouts, type, date) {
  return workouts.filter((w) => w.date < date && w.type === type).sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null
}

// Última vez que se hizo este ejercicio antes de `date`.
function lastRef(workouts, exId, date) {
  const prior = workouts.filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))
  for (const w of prior) {
    const ex = w.exercises.find((e) => e.exId === exId && e.sets.some(setIsValid))
    if (ex) return { date: w.date, best: bestSet(ex.sets), sets: ex.sets.filter(setIsValid).length }
  }
  return null
}

function hasData(row) { return row.sets.some((s) => s.kg || s.reps) }

export default function WorkoutDay({ date, workout, workouts, templates, onChange, onDelete }) {
  const [picker, setPicker] = useState(null) // null | { mode: 'add' } | { mode: 'swap', rowId, exId }
  const [rest, setRest] = useState(null) // segundos restantes o null
  const [now, setNow] = useState(Date.now())
  const listRef = useRef(null)

  // Cronómetro de sesión: tic por segundo mientras corre
  const running = !!workout?.timer?.startedAt
  useEffect(() => {
    if (!running) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [running])

  // Descanso: cuenta regresiva
  useEffect(() => {
    if (rest === null) return
    if (rest <= 0) { const t = setTimeout(() => setRest(null), 1500); return () => clearTimeout(t) }
    const t = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000)
    return () => clearTimeout(t)
  }, [rest])

  // Al cambiar de día, cerrar hoja y timer
  useEffect(() => { setPicker(null); setRest(null) }, [date])

  const rowsFromTemplate = (type) => (templates[type] || []).filter((id) => EX_BY_ID[id]).map((exId) => ({ rowId: uid(), exId, plannedId: null, sets: [emptySet()] }))
  const start = (type, exercises) => onChange({ id: uid(), date, type, note: '', exercises: exercises ?? rowsFromTemplate(type), timer: { startedAt: null, acc: 0 } })

  if (!workout) {
    const suggested = suggestType(workouts, date)
    const prev = prevOfType(workouts, suggested, date)
    return (
      <section className="day">
        <h2 className="day-title">{cap(fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
        <p className="muted">Sin sesión registrada. ¿Qué toca?</p>
        <div className="type-grid">
          {Object.entries(DAY_TYPES).map(([k, t]) => (
            <button key={k} className={`type-btn ${k === suggested ? 'is-suggested' : ''}`} style={{ '--c': t.color }} onClick={() => start(k)}>
              <strong>{t.label}</strong>
              <span>{t.long}</span>
              {k === suggested && <em>siguiente en el ciclo</em>}
            </button>
          ))}
        </div>
        {prev && (
          <button className="btn-secondary wide" onClick={() => start(suggested, prev.exercises.map((r) => {
            const n = Math.max(1, r.sets.filter(setIsValid).length)
            return { rowId: uid(), exId: r.exId, plannedId: null, sets: Array.from({ length: n }, emptySet) }
          }))}>
            Repetir {DAY_TYPES[suggested].label} del {fmtDate(prev.date)} ({prev.exercises.length} ejercicios)
          </button>
        )}
      </section>
    )
  }

  const update = (patch) => onChange({ ...workout, ...patch })
  const updateRow = (rowId, fn) => update({ exercises: workout.exercises.map((r) => (r.rowId === rowId ? fn(r) : r)) })
  const updateSet = (rowId, i, patch) => updateRow(rowId, (r) => ({ ...r, sets: r.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))
  const type = DAY_TYPES[workout.type] || DAY_TYPES.otro
  const used = workout.exercises.map((r) => r.exId)

  const changeType = (newType) => {
    if (newType === workout.type) return
    const anyData = workout.exercises.some(hasData)
    if (!anyData && (templates[newType] || []).length && confirm(`¿Cargar la rutina de ${DAY_TYPES[newType].label}? Se reemplaza la lista actual (no tiene datos).`)) {
      update({ type: newType, exercises: rowsFromTemplate(newType) })
    } else {
      update({ type: newType })
    }
  }

  const pick = (exId) => {
    if (!EX_BY_ID[exId] || !picker) return
    if (picker.mode === 'add') {
      if (!used.includes(exId)) update({ exercises: [...workout.exercises, { rowId: uid(), exId, plannedId: null, sets: [emptySet()] }] })
    } else {
      const row = workout.exercises.find((r) => r.rowId === picker.rowId)
      if (!row) { setPicker(null); return }
      if (hasData(row) && !confirm('Este ejercicio ya tiene series con datos. ¿Cambiarlo igual? Se borran las series.')) { setPicker(null); return }
      updateRow(picker.rowId, (r) => ({ ...r, exId, plannedId: exId === r.plannedId ? null : (r.plannedId || r.exId), sets: [emptySet()] }))
    }
    setPicker(null)
  }

  const removeRow = (row) => {
    if (hasData(row) && !confirm(`¿Quitar ${EX_BY_ID[row.exId]?.name || 'este ejercicio'}? Tiene series con datos.`)) return
    update({ exercises: workout.exercises.filter((r) => r.rowId !== row.rowId) })
  }

  const timer = workout.timer || { startedAt: null, acc: 0 }
  const elapsed = timerElapsed(timer, now)
  const timerToggle = () => update({ timer: timer.startedAt ? { startedAt: null, acc: timerElapsed(timer) } : { ...timer, startedAt: Date.now() } })
  const timerReset = () => { if (elapsed < 60 || confirm('¿Reiniciar el cronómetro de la sesión?')) update({ timer: { startedAt: null, acc: 0 } }) }

  const toggleDone = (rowId, i, s) => {
    const done = !s.done
    const patch = { exercises: workout.exercises.map((r) => (r.rowId === rowId ? { ...r, sets: r.sets.map((x, j) => (j === i ? { ...x, done } : x)) } : r)) }
    // La primera serie hecha arranca el cronómetro si nunca se inició
    if (done && !timer.startedAt && timer.acc === 0) patch.timer = { startedAt: Date.now(), acc: 0 }
    update(patch)
    setRest(done ? REST_SECONDS : null)
  }

  // Enter / "Siguiente" en el teclado: pasa al siguiente campo numérico
  const focusNext = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const inputs = [...(listRef.current?.querySelectorAll('input') || [])]
    const i = inputs.indexOf(e.target)
    if (i >= 0 && inputs[i + 1]) inputs[i + 1].focus(); else e.target.blur()
  }

  const step = (rowId, i, s, field, delta, placeholder) => {
    if (!s[field] && delta < 0) return // vacío y restar: nada que restar
    const cur = num(s[field]) || num(placeholder)
    const next = Math.max(0, Math.round((cur + delta) * 100) / 100)
    updateSet(rowId, i, { [field]: next ? String(next) : '' })
  }

  const validSets = workout.exercises.flatMap((r) => r.sets.filter(setIsValid))
  const volume = validSets.reduce((n, s) => n + num(s.kg) * num(s.reps), 0)

  return (
    <section className="day">
      <header className="day-head" style={{ '--c': type.color }}>
        <div>
          <h2 className="day-title">{cap(fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
          <p className="muted">{type.long}</p>
        </div>
        <div className="day-stats">
          <span><b>{validSets.length}</b> series</span>
          <span><b>{Math.round(volume).toLocaleString('es-CL')}</b> kg totales</span>
        </div>
      </header>

      <div className="day-tools">
        <div className="type-chips" role="radiogroup" aria-label="Tipo de sesión">
          {Object.entries(DAY_TYPES).map(([k, t]) => (
            <button key={k} type="button" role="radio" aria-checked={workout.type === k} data-type={k} className={workout.type === k ? 'is-on' : ''} style={{ '--c': t.color }} onClick={() => changeType(k)}>{t.label}</button>
          ))}
        </div>
        <div className={`timer ${running ? 'is-running' : ''}`}>
          <button type="button" className="timer-main" onClick={timerToggle} aria-label={running ? 'Pausar cronómetro' : 'Iniciar cronómetro'}>
            <span className="timer-ico">{running ? '❚❚' : '▶'}</span><b>{fmtClock(elapsed)}</b>
          </button>
          {!running && elapsed > 0 && <button type="button" className="timer-reset" onClick={timerReset} aria-label="Reiniciar cronómetro">×</button>}
        </div>
      </div>

      <ol className="ex-list" ref={listRef}>
        {workout.exercises.length === 0 && <li className="empty muted">Sin ejercicios. Agrega el primero abajo.</li>}
        {workout.exercises.map((row) => {
          const ex = EX_BY_ID[row.exId]
          const planned = row.plannedId ? EX_BY_ID[row.plannedId] : null
          const ref = lastRef(workouts, row.exId, date)
          const allDone = row.sets.length > 0 && row.sets.every((s) => s.done)
          return (
            <li key={row.rowId} className={`ex ${allDone ? 'is-done' : ''}`}>
              <div className="ex-head">
                <div>
                  <h3>{ex?.name || 'Ejercicio desconocido'}</h3>
                  {planned && <p className="swap-note">Cambio por {planned.name}</p>}
                  {ref ? (
                    <p className="muted">Última vez ({fmtDate(ref.date)}): {ref.best.kg} kg × {ref.best.reps}, {ref.sets} series</p>
                  ) : (
                    <p className="muted">Primera vez con este ejercicio</p>
                  )}
                </div>
                <div className="ex-actions">
                  <button className="text-btn" onClick={() => setPicker({ mode: 'swap', rowId: row.rowId, exId: row.exId })}>Cambiar</button>
                  <button className="text-btn danger" onClick={() => removeRow(row)}>Quitar</button>
                </div>
              </div>
              <div className="sets">
                <div className="set-row set-head"><span>Serie</span><span>kg</span><span>reps</span><span /></div>
                {row.sets.map((s, i) => {
                  const prev = row.sets[i - 1]
                  const phKg = prev?.kg || (ref ? String(ref.best.kg) : '')
                  const phReps = prev?.reps || (ref ? String(ref.best.reps) : '')
                  return (
                    <div className={`set-row ${s.done ? 'is-done' : ''}`} key={i}>
                      <button className="set-n" aria-pressed={s.done} aria-label={`Serie ${i + 1} ${s.done ? 'hecha' : 'pendiente'}`} onClick={() => toggleDone(row.rowId, i, s)}>{s.done ? '✓' : i + 1}</button>
                      <div className="stepper">
                        <button tabIndex={-1} aria-label="Menos 2,5 kg" onClick={() => step(row.rowId, i, s, 'kg', -2.5, phKg)}>−</button>
                        <input type="text" inputMode="decimal" enterKeyHint="next" placeholder={phKg || '—'} value={s.kg}
                          aria-label={`Serie ${i + 1} kg`} onKeyDown={focusNext}
                          onChange={(e) => updateSet(row.rowId, i, { kg: sanitizeDecimal(e.target.value) })} />
                        <button tabIndex={-1} aria-label="Más 2,5 kg" onClick={() => step(row.rowId, i, s, 'kg', 2.5, phKg)}>+</button>
                      </div>
                      <div className="stepper">
                        <button tabIndex={-1} aria-label="Menos 1 rep" onClick={() => step(row.rowId, i, s, 'reps', -1, phReps)}>−</button>
                        <input type="text" inputMode="numeric" enterKeyHint="next" placeholder={phReps || '—'} value={s.reps}
                          aria-label={`Serie ${i + 1} reps`} onKeyDown={focusNext}
                          onChange={(e) => updateSet(row.rowId, i, { reps: sanitizeInt(e.target.value) })} />
                        <button tabIndex={-1} aria-label="Más 1 rep" onClick={() => step(row.rowId, i, s, 'reps', 1, phReps)}>+</button>
                      </div>
                      <button className="icon-btn small" aria-label="Quitar serie" onClick={() => updateRow(row.rowId, (r) => ({ ...r, sets: r.sets.filter((_, j) => j !== i) }))}>×</button>
                    </div>
                  )
                })}
                <button className="text-btn add-set" onClick={() => updateRow(row.rowId, (r) => {
                  const last = r.sets[r.sets.length - 1]
                  return { ...r, sets: [...r.sets, { kg: last?.kg || '', reps: last?.reps || '', done: false }] }
                })}>+ Serie</button>
              </div>
            </li>
          )
        })}
      </ol>

      <button className="btn-secondary wide" onClick={() => setPicker({ mode: 'add' })}>+ Agregar ejercicio</button>

      <textarea className="note" placeholder="Notas de la sesión (cómo te sentiste, qué máquina estaba ocupada, etc.)" value={workout.note} maxLength={2000} onChange={(e) => update({ note: e.target.value })} />

      <button className="text-btn danger wide" onClick={() => { if (confirm('¿Borrar esta sesión completa? No se puede deshacer.')) onDelete(workout.id) }}>Borrar sesión</button>

      {rest !== null && (
        <button className={`rest ${rest <= 0 ? 'is-over' : ''}`} onClick={() => setRest(null)} aria-live="polite">
          {rest > 0 ? <><b>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</b> descanso · tocar para cerrar</> : <b>¡Dale!</b>}
        </button>
      )}

      {picker && (
        <ExercisePicker
          replacing={picker.mode === 'swap' ? picker.exId : null}
          exclude={picker.mode === 'add' ? used : used.filter((id) => id !== picker.exId)}
          onPick={pick}
          onClose={() => setPicker(null)}
        />
      )}
    </section>
  )
}
