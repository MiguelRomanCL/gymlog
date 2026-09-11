import { useState } from 'react'
import { DAY_TYPES, EX_BY_ID } from '../data/exercises'
import { fmtDate, cap, setIsValid, uid } from '../storage'
import { suggest, muscleStats, levelsFrom, coveredCount, weekNumber, mondayOf, isoAdd, emptySet } from '../lib/logic'
import { Body, Legend, ALL_MUSCLES } from './Body'

// Día sin sesión: el cuerpo con la semana y la sugerencia de qué toca.
export default function StartDay({ date, workouts, templates, onStart }) {
  const [choosing, setChoosing] = useState(false)
  const s = suggest(workouts, date, templates)
  const stats = muscleStats(workouts, date, 7)
  const levels = levelsFrom(stats)
  const monday = mondayOf(date), sunday = isoAdd(monday, 6)
  const weekSessions = workouts.filter((w) => w.date >= monday && w.date <= sunday).length
  const tpl = (templates[s.type] || []).filter((id) => EX_BY_ID[id])
  const preview = tpl.slice(0, 3).map((id) => EX_BY_ID[id].name).join(' · ') + (tpl.length > 3 ? ` · +${tpl.length - 3}` : '')
  const label = DAY_TYPES[s.type].label

  return (
    <section className="start">
      <header className="s-head">
        <div>
          <h1 className="d">{cap(fmtDate(date, { weekday: 'long', day: 'numeric' }))}</h1>
          <p className="muted">Semana {weekNumber(date)} · {weekSessions} {weekSessions === 1 ? 'sesión' : 'sesiones'} · {coveredCount(stats)} de {ALL_MUSCLES.length} grupos en 7 días</p>
        </div>
      </header>
      <div className="bodies card">
        <figure><Body view="front" levels={levels} width={118} /><figcaption>Frente</figcaption></figure>
        <figure><Body view="back" levels={levels} width={118} /><figcaption>Espalda</figcaption></figure>
        <Legend />
      </div>

      {!choosing ? (
        <div className="suggest card" style={{ '--c': DAY_TYPES[s.type].color }}>
          <div className="suggest-head"><h2 className="d">Te toca {label}</h2><span className="muted">{tpl.length} ejercicios</span></div>
          <p>{s.reason}{tpl.length ? ` ${preview}` : ''}</p>
          <div className="row-btns">
            <button className="btn-primary start-btn" onClick={() => onStart(s.type)}>Empezar {label}</button>
            <button className="btn-dark other-btn" onClick={() => setChoosing(true)}>Otro</button>
          </div>
        </div>
      ) : (
        <>
          <p className="muted">¿Qué toca?</p>
          <div className="type-grid">
            {Object.entries(DAY_TYPES).map(([k, t]) => (
              <button key={k} data-type={k} className={`type-btn ${k === s.type ? 'is-suggested' : ''}`} style={{ '--c': t.color }} onClick={() => onStart(k)}>
                <strong className="d">{t.label}</strong><span>{t.long}</span>
              </button>
            ))}
          </div>
          {s.prevSame && (
            <button className="btn-secondary wide repeat-btn" onClick={() => onStart(s.type, s.prevSame.exercises.map((r) => {
              const n = Math.max(1, r.sets.filter(setIsValid).length)
              return { rowId: uid(), exId: r.exId, plannedId: null, sets: Array.from({ length: n }, emptySet) }
            }))}>
              Repetir {label} del {fmtDate(s.prevSame.date)} ({s.prevSame.exercises.length} ejercicios)
            </button>
          )}
        </>
      )}
    </section>
  )
}
