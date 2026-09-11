import { useEffect, useRef, useState } from 'react'
import { DAY_TYPES, EX_BY_ID } from '../data/exercises'
import { bestSet, fmtDate, uid, cap, num, setIsValid, sanitizeDecimal, sanitizeInt, timerElapsed, fmtClock, e1rm } from '../storage'
import { emptySet, sessionMuscles, sessionLevel, lastRef, nSeries } from '../lib/logic'
import { Body, viewFor } from './Body'
import ExercisePicker from './ExercisePicker'

const REST_SECONDS = 90
const hasData = (row) => row.sets.some((s) => s.kg || s.reps)
const rowDone = (row) => row.sets.length > 0 && row.sets.every((s) => s.done)

const Check = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 7l3.5 3.5L12 3" /></svg>

export function Glyph({ muscle, size = 34, lvl = 3 }) {
  if (!muscle) return null
  return <Body view={viewFor(muscle)} levels={{ [muscle]: lvl }} width={size} title={muscle} />
}

// Modo entrenamiento: un ejercicio a la vez, lista desplegable, cronómetro, franja del cuerpo y resumen.
export default function Session({ date, workout, workouts, templates, onChange, onDelete }) {
  const [curId, setCurId] = useState(null) // null = el primero con series pendientes
  const [showList, setShowList] = useState(false)
  const [editType, setEditType] = useState(false)
  const [picker, setPicker] = useState(null) // null | { mode: 'add' } | { mode: 'swap', rowId, exId }
  const [rest, setRest] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [summary, setSummary] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => { setCurId(null); setShowList(false); setEditType(false); setPicker(null); setRest(null); setSummary(false) }, [date, workout.id])

  useEffect(() => {
    if (rest === null) return
    if (rest <= 0) { const t = setTimeout(() => setRest(null), 1500); return () => clearTimeout(t) }
    const t = setTimeout(() => setRest((r) => (r === null ? null : r - 1)), 1000)
    return () => clearTimeout(t)
  }, [rest])

  const running = !!workout.timer?.startedAt
  useEffect(() => {
    if (!running) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [running])

  const rows = workout.exercises
  const type = DAY_TYPES[workout.type] || DAY_TYPES.otro
  const update = (patch) => onChange({ ...workout, ...patch })
  const updateRow = (rowId, fn) => update({ exercises: rows.map((r) => (r.rowId === rowId ? fn(r) : r)) })
  const updateSet = (rowId, i, patch) => updateRow(rowId, (r) => ({ ...r, sets: r.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) }))

  const timer = workout.timer || { startedAt: null, acc: 0 }
  const elapsed = timerElapsed(timer, now)
  const timerToggle = () => update({ timer: timer.startedAt ? { startedAt: null, acc: timerElapsed(timer) } : { ...timer, startedAt: Date.now() } })
  const timerReset = () => { if (elapsed < 60 || confirm('¿Reiniciar el cronómetro de la sesión?')) update({ timer: { startedAt: null, acc: 0 } }) }
  const withTimerStart = (patch) => { if (!timer.startedAt && timer.acc === 0) patch.timer = { startedAt: Date.now(), acc: 0 }; return patch }

  const autoCur = rows.find((r) => !rowDone(r)) || rows[rows.length - 1] || null
  const cur = rows.find((r) => r.rowId === curId) || autoCur
  const curIdx = cur ? rows.indexOf(cur) : -1
  const next = curIdx >= 0 ? rows.slice(curIdx + 1).find((r) => !rowDone(r)) || rows[curIdx + 1] || null : null
  const activeIdx = cur ? cur.sets.findIndex((s) => !s.done) : -1
  const ex = cur ? EX_BY_ID[cur.exId] : null
  const ref = cur ? lastRef(workouts, cur.exId, date, bestSet) : null
  const placeholders = (row, i, rf) => {
    const prev = row.sets[i - 1]
    return { kg: prev?.kg || (rf ? String(rf.best.kg) : ''), reps: prev?.reps || (rf ? String(rf.best.reps) : '') }
  }

  const validSets = rows.flatMap((r) => r.sets.filter(setIsValid))
  const volume = validSets.reduce((n, s) => n + num(s.kg) * num(s.reps), 0)
  const todays = sessionMuscles(rows)
  const todayLevels = Object.fromEntries(Object.entries(todays).map(([k, v]) => [k, sessionLevel(v.done)]))
  const used = rows.map((r) => r.exId)
  const missing = (templates[workout.type] || []).filter((id) => EX_BY_ID[id] && !used.includes(id))

  const setDone = (rowId, i, done) => {
    const exercises = rows.map((r) => (r.rowId === rowId ? { ...r, sets: r.sets.map((s, j) => (j === i ? { ...s, done } : s)) } : r))
    const patch = { exercises }
    update(done ? withTimerStart(patch) : patch)
    setRest(done ? REST_SECONDS : null)
    if (done && rowDone(exercises.find((r) => r.rowId === rowId))) setCurId(null) // ejercicio completo: pasa al siguiente pendiente
  }
  const addSet = (row) => updateRow(row.rowId, (r) => {
    const last = r.sets[r.sets.length - 1]
    return { ...r, sets: [...r.sets, { kg: last?.kg || '', reps: last?.reps || '', done: false }] }
  })
  // "Serie hecha": completa la serie activa con lo escrito o con la referencia (serie anterior / última vez).
  const doneActive = () => {
    if (!cur) return
    if (activeIdx < 0) { addSet(cur); return }
    const s = cur.sets[activeIdx], ph = placeholders(cur, activeIdx, ref)
    const kg = s.kg || ph.kg, reps = s.reps || ph.reps
    if (!(num(kg) > 0 && num(reps) > 0)) { cardRef.current?.querySelector('.set-row.is-active input')?.focus(); return }
    const exercises = rows.map((r) => (r.rowId === cur.rowId ? { ...r, sets: r.sets.map((x, j) => (j === activeIdx ? { ...x, kg, reps, done: true } : x)) } : r))
    update(withTimerStart({ exercises }))
    setRest(REST_SECONDS)
    if (rowDone(exercises.find((r) => r.rowId === cur.rowId))) setCurId(null)
  }
  const step = (field, delta) => {
    if (!cur) return
    const i = activeIdx >= 0 ? activeIdx : cur.sets.length - 1
    if (i < 0) return
    const s = cur.sets[i], ph = placeholders(cur, i, ref)
    if (!s[field] && delta < 0) return
    const c = num(s[field]) || num(ph[field])
    const n = Math.max(0, Math.round((c + delta) * 100) / 100)
    updateSet(cur.rowId, i, { [field]: n ? String(n) : '' })
  }
  const focusNext = (e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const inputs = [...(cardRef.current?.querySelectorAll('input') || [])]
    const i = inputs.indexOf(e.target)
    if (i >= 0 && inputs[i + 1]) inputs[i + 1].focus(); else e.target.blur()
  }

  const changeType = (newType) => {
    setEditType(false)
    if (newType === workout.type) return
    const anyData = rows.some(hasData)
    if (!anyData && (templates[newType] || []).length && confirm(`¿Cargar la rutina de ${DAY_TYPES[newType].label}? Se reemplaza la lista actual (no tiene datos).`)) {
      update({ type: newType, exercises: (templates[newType] || []).filter((id) => EX_BY_ID[id]).map((exId) => ({ rowId: uid(), exId, plannedId: null, sets: [emptySet()] })) })
      setCurId(null)
    } else {
      update({ type: newType })
    }
  }
  const loadMissing = () => update({ exercises: [...rows, ...missing.map((exId) => ({ rowId: uid(), exId, plannedId: null, sets: [emptySet()] }))] })
  const pick = (exId) => {
    if (!EX_BY_ID[exId] || !picker) return
    if (picker.mode === 'add') {
      if (!used.includes(exId)) update({ exercises: [...rows, { rowId: uid(), exId, plannedId: null, sets: [emptySet()] }] })
    } else {
      const row = rows.find((r) => r.rowId === picker.rowId)
      if (!row) { setPicker(null); return }
      if (hasData(row) && !confirm('Este ejercicio ya tiene series con datos. ¿Cambiarlo igual? Se borran las series.')) { setPicker(null); return }
      updateRow(picker.rowId, (r) => ({ ...r, exId, plannedId: exId === r.plannedId ? null : (r.plannedId || r.exId), sets: [emptySet()] }))
    }
    setPicker(null)
  }
  const removeRow = (row) => {
    if (hasData(row) && !confirm(`¿Quitar ${EX_BY_ID[row.exId]?.name || 'este ejercicio'}? Tiene series con datos.`)) return
    update({ exercises: rows.filter((r) => r.rowId !== row.rowId) })
    if (curId === row.rowId) setCurId(null)
  }
  const goTo = (row) => { setCurId(row.rowId); setShowList(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const finish = () => { update({ finished: true, timer: { startedAt: null, acc: timerElapsed(timer) } }); setSummary(false) }

  if (workout.finished || summary) {
    return <Summary workout={workout} workouts={workouts} elapsed={elapsed} todays={todays} todayLevels={todayLevels} validSets={validSets} volume={volume}
      onSave={finish} onReopen={() => { update({ finished: false }); setSummary(false) }} onBack={() => setSummary(false)} />
  }

  const planned = cur?.plannedId ? EX_BY_ID[cur.plannedId] : null
  return (
    <section className="session" style={{ '--c': type.color }}>
      <header className="s-head">
        <div>
          <button className="s-type d" onClick={() => setEditType((v) => !v)} aria-expanded={editType} aria-label="Cambiar tipo de sesión">{type.label}<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l4 4 4-4" /></svg></button>
          <p className="muted">{rows.length ? `Ejercicio ${curIdx + 1} de ${rows.length}` : 'Sin ejercicios'} · {nSeries(validSets.length)} · {Math.round(volume).toLocaleString('es-CL')} kg</p>
        </div>
        <button className={`s-timer ${running ? 'is-running' : ''}`} onClick={timerToggle} aria-label={running ? 'Pausar cronómetro' : 'Iniciar cronómetro'}>
          <b className="d">{fmtClock(elapsed)}</b><span>{running ? 'sesión' : elapsed ? 'pausado' : 'iniciar'}</span>
        </button>
      </header>
      {editType && (
        <div className="type-chips" role="radiogroup" aria-label="Tipo de sesión">
          {Object.entries(DAY_TYPES).map(([k, t]) => (
            <button key={k} type="button" role="radio" aria-checked={workout.type === k} data-type={k} className={workout.type === k ? 'is-on' : ''} style={{ '--c': t.color }} onClick={() => changeType(k)}>{t.label}</button>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="s-progress" aria-label={`${rows.filter(rowDone).length} de ${rows.length} ejercicios completos`}>
          {rows.map((r) => <i key={r.rowId} className={rowDone(r) ? 'is-done' : r === cur ? 'is-cur' : ''} />)}
        </div>
      )}

      <div className="strip">
        <div className="strip-bodies"><Body view="front" levels={todayLevels} width={40} /><Body view="back" levels={todayLevels} width={40} /></div>
        <div className="strip-info">
          <span className="eyebrow">Hoy vas encendiendo</span>
          <div className="chips">
            {Object.keys(todays).length === 0 && <span className="muted">Agrega ejercicios para empezar</span>}
            {Object.entries(todays).map(([m, v]) => <span key={m} className={v.done ? 'is-on' : ''}>{m} {v.done}</span>)}
          </div>
        </div>
      </div>

      {cur ? (
        <div className="ex-card" ref={cardRef}>
          <div className="ex-card-head">
            <div>
              <h2 className="d">{ex?.name || 'Ejercicio desconocido'}</h2>
              {planned && <p className="swap-note">Cambio por {planned.name}</p>}
              <p className="muted">{ref ? `Última vez (${fmtDate(ref.date)}): ${ref.best.kg} kg × ${ref.best.reps} · ${nSeries(ref.sets)}` : 'Primera vez con este ejercicio'}</p>
            </div>
            {ex && <div className="glyph"><Glyph muscle={ex.muscle} /><span>{ex.muscle}</span></div>}
          </div>
          <div className="sets">
            {cur.sets.map((s, i) => {
              const ph = placeholders(cur, i, ref)
              return (
                <div className={`set-row ${s.done ? 'is-done' : ''} ${i === activeIdx ? 'is-active' : ''}`} key={i}>
                  <button className="set-n" aria-pressed={s.done} aria-label={`Serie ${i + 1} ${s.done ? 'hecha' : 'pendiente'}`} onClick={() => setDone(cur.rowId, i, !s.done)}>{s.done ? <Check /> : i + 1}</button>
                  <label className="num"><input type="text" inputMode="decimal" enterKeyHint="next" placeholder={ph.kg || '—'} value={s.kg} aria-label={`Serie ${i + 1} kg`} onKeyDown={focusNext} onChange={(e) => updateSet(cur.rowId, i, { kg: sanitizeDecimal(e.target.value) })} /><small>kg</small></label>
                  <label className="num"><input type="text" inputMode="numeric" enterKeyHint="next" placeholder={ph.reps || '—'} value={s.reps} aria-label={`Serie ${i + 1} reps`} onKeyDown={focusNext} onChange={(e) => updateSet(cur.rowId, i, { reps: sanitizeInt(e.target.value) })} /><small>reps</small></label>
                  <button className="icon-btn small" aria-label="Quitar serie" onClick={() => updateRow(cur.rowId, (r) => ({ ...r, sets: r.sets.filter((_, j) => j !== i) }))}>×</button>
                </div>
              )
            })}
            {cur.sets.length === 0 && <p className="muted">Sin series. Agrega una.</p>}
          </div>
          <div className="steppers">
            <button aria-label="Menos 2,5 kg" onClick={() => step('kg', -2.5)}>−2,5</button>
            <button aria-label="Más 2,5 kg" onClick={() => step('kg', 2.5)}>+2,5</button>
            <button aria-label="Menos 1 rep" onClick={() => step('reps', -1)}>−1</button>
            <button aria-label="Más 1 rep" onClick={() => step('reps', 1)}>+1</button>
          </div>
          <div className="ex-card-foot">
            <button className="text-btn add-set" onClick={() => addSet(cur)}>+ Serie</button>
            <span className="spacer" />
            <button className="text-btn" onClick={() => setPicker({ mode: 'swap', rowId: cur.rowId, exId: cur.exId })}>Cambiar</button>
            <button className="text-btn danger" onClick={() => removeRow(cur)}>Quitar</button>
          </div>
        </div>
      ) : (
        <div className="empty">Sin ejercicios. Agrega el primero o carga la rutina.</div>
      )}

      {next && (
        <button className="next-card" onClick={() => setCurId(next.rowId)}>
          <Glyph muscle={EX_BY_ID[next.exId]?.muscle} size={26} />
          <span><span className="eyebrow">Siguiente</span><b>{EX_BY_ID[next.exId]?.name || 'Ejercicio desconocido'}</b></span>
        </button>
      )}

      <button className="text-btn list-toggle" onClick={() => setShowList((v) => !v)} aria-expanded={showList}>
        {showList ? 'Ocultar lista' : rows.length ? `Ver los ${rows.length} ejercicios · agregar otro` : 'Agregar ejercicios'}
      </button>

      {showList && (
        <div className="ex-list-panel">
          <ol className="ex-list">
            {rows.map((r, i) => {
              const e = EX_BY_ID[r.exId], d = r.sets.filter((s) => s.done).length
              return (
                <li key={r.rowId} className={`${r === cur ? 'is-cur' : ''} ${rowDone(r) ? 'is-done' : ''}`}>
                  <button className="ex-row" onClick={() => goTo(r)}>
                    <span className="ex-i">{rowDone(r) ? <Check /> : i + 1}</span>
                    <span className="ex-name">{e?.name || 'Ejercicio desconocido'}</span>
                    <span className="ex-sets">{d}/{r.sets.length}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          {missing.length > 0 && <button className="btn-secondary wide load-tpl" onClick={loadMissing}>Cargar rutina {type.label} ({missing.length === 1 ? 'falta 1' : `faltan ${missing.length}`})</button>}
          <button className="btn-secondary wide add-ex" onClick={() => setPicker({ mode: 'add' })}>+ Agregar ejercicio</button>
          <textarea className="note" placeholder="Notas de la sesión (cómo te sentiste, qué máquina estaba ocupada, etc.)" value={workout.note} maxLength={2000} onChange={(e) => update({ note: e.target.value })} />
          <div className="row-btns">
            <button className="text-btn timer-reset" onClick={timerReset}>Reiniciar cronómetro</button>
            <button className="text-btn danger delete-session" onClick={() => { if (confirm('¿Borrar esta sesión completa? No se puede deshacer.')) onDelete(workout.id) }}>Borrar sesión</button>
          </div>
        </div>
      )}

      <div className="actions">
        <button className="btn-primary act-done" onClick={doneActive} disabled={!cur}>Serie hecha</button>
        <div className="row-btns">
          <button className={`btn-dark act-rest ${rest !== null ? 'is-on' : ''} ${rest === 0 ? 'is-over' : ''}`} onClick={() => setRest(rest === null ? REST_SECONDS : null)} aria-live="polite">
            {rest === null ? 'Descanso 1:30' : rest > 0 ? `Descanso ${fmtClock(rest)}` : '¡Dale!'}
          </button>
          {next
            ? <button className="btn-dark act-next" onClick={() => setCurId(next.rowId)}>Siguiente ejercicio</button>
            : <button className="btn-dark act-finish" onClick={() => setSummary(true)}>Terminar sesión</button>}
        </div>
      </div>

      {picker && (
        <ExercisePicker replacing={picker.mode === 'swap' ? picker.exId : null}
          exclude={picker.mode === 'add' ? used : used.filter((id) => id !== picker.exId)} onPick={pick} onClose={() => setPicker(null)} />
      )}
    </section>
  )
}

// Resumen al terminar: cuerpo encendido hoy, números y récords.
function Summary({ workout, workouts, elapsed, todays, todayLevels, validSets, volume, onSave, onReopen, onBack }) {
  const type = DAY_TYPES[workout.type] || DAY_TYPES.otro
  const rows = workout.exercises
  const nEx = rows.filter((r) => r.sets.some(setIsValid)).length
  // Récord: mejor e1rm de hoy supera el mejor de cualquier sesión anterior del mismo ejercicio.
  const records = {}
  for (const r of rows) {
    const today = r.sets.filter(setIsValid).map((s) => e1rm(s.kg, s.reps))
    if (!today.length) continue
    const best = Math.max(...today)
    const prior = workouts.filter((w) => w.date < workout.date).flatMap((w) => w.exercises.filter((x) => x.exId === r.exId)).flatMap((x) => x.sets.filter(setIsValid).map((s) => e1rm(s.kg, s.reps)))
    if (prior.length && best > Math.max(...prior)) {
      const m = EX_BY_ID[r.exId]?.muscle
      const kg = Math.max(...r.sets.filter(setIsValid).map((s) => num(s.kg)))
      if (m && (!records[m] || kg > records[m])) records[m] = kg
    }
  }
  const list = Object.entries(todays).filter(([, v]) => v.done > 0).sort((a, b) => b[1].done - a[1].done)
  return (
    <section className="summary" style={{ '--c': type.color }}>
      <header className="s-head">
        <div><h1 className="d">{type.label} listo</h1><p className="muted">{cap(fmtDate(workout.date))}{workout.finished ? ' · guardada' : ''}</p></div>
        <div className="s-timer is-static"><b className="d">{fmtClock(elapsed)}</b><span>duración</span></div>
      </header>
      <div className="bodies card">
        <figure><Body view="front" levels={todayLevels} width={118} /><figcaption>Frente</figcaption></figure>
        <figure><Body view="back" levels={todayLevels} width={118} /><figcaption>Espalda</figcaption></figure>
      </div>
      <div className="stat-grid">
        <div><b className="d">{nEx}</b><span>ejercicios</span></div>
        <div><b className="d">{validSets.length}</b><span>series</span></div>
        <div><b className="d">{Math.round(volume).toLocaleString('es-CL')}</b><span>kg totales</span></div>
      </div>
      {list.length > 0 && (
        <ul className="muscle-list card">
          {list.map(([m, v]) => (
            <li key={m}><span>{m}</span><span className={`lvl-t${sessionLevel(v.done)}`}>{nSeries(v.done)}{records[m] ? ` · récord ${records[m]} kg` : ''}</span></li>
          ))}
        </ul>
      )}
      {workout.finished ? (
        <button className="btn-secondary wide reopen" onClick={onReopen}>Reabrir sesión</button>
      ) : (
        <>
          <button className="btn-primary wide save" onClick={onSave}>Guardar sesión</button>
          <button className="text-btn wide back" onClick={onBack}>Volver a la sesión</button>
        </>
      )}
    </section>
  )
}
