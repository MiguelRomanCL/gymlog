import { useMemo, useState } from 'react'
import { todayISO } from '../storage'
import { muscleStats, levelsFrom, level, coveredCount, weekNumber, nSeries } from '../lib/logic'
import { Body, Legend, ALL_MUSCLES } from './Body'

// Pestaña Cuerpo: mapa de calor a 7/14/30 días y lista por músculo.
export default function BodyMap({ workouts }) {
  const [days, setDays] = useState(7)
  const today = todayISO()
  const stats = useMemo(() => muscleStats(workouts, today, days), [workouts, today, days])
  const levels = levelsFrom(stats)
  const covered = coveredCount(stats)
  const rows = ALL_MUSCLES.map((k) => ({ muscle: k, ...stats[k] })).sort((a, b) => b.sets - a.sets || (a.last ?? 999) - (b.last ?? 999))
  const maxSets = Math.max(1, ...rows.map((r) => r.sets))

  return (
    <section className="coverage">
      <header className="s-head">
        <div><h1 className="d">Cuerpo</h1><p className="muted">Semana {weekNumber(today)} · <b>{covered}</b> de {ALL_MUSCLES.length} grupos en {days} días</p></div>
      </header>
      <div className="seg small">
        {[7, 14, 30].map((d) => <button key={d} className={days === d ? 'is-on' : ''} onClick={() => setDays(d)}>{d} días</button>)}
      </div>
      <div className="bodies card">
        <figure><Body view="front" levels={levels} width={118} /><figcaption>Frente</figcaption></figure>
        <figure><Body view="back" levels={levels} width={118} /><figcaption>Espalda</figcaption></figure>
        <Legend />
      </div>
      <ul className="cov-list card">
        {rows.map((r) => (
          <li key={r.muscle} className={r.sets === 0 ? 'is-missing' : ''}>
            <span className="cov-name">{r.muscle}</span>
            <span className="cov-bar"><i className={`lvl-${level(r.sets)}`} style={{ width: `${(r.sets / maxSets) * 100}%` }} /></span>
            <span className="cov-meta">{r.sets ? nSeries(r.sets) : r.last === null ? 'nunca' : r.last === 0 ? 'hoy' : `${r.last} días sin tocar`}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
