import { useMemo, useState } from 'react'
import { EX_BY_ID, EXERCISES } from '../data/exercises'
import { bestSet, e1rm, fmtDate, num, setIsValid } from '../storage'

export default function Progress({ workouts }) {
  // Ejercicios con datos, ordenados por frecuencia
  const withData = useMemo(() => {
    const count = {}
    for (const w of workouts) for (const r of w.exercises) if (r.sets.some(setIsValid)) count[r.exId] = (count[r.exId] || 0) + 1
    return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([id]) => id)
  }, [workouts])

  const [chosen, setChosen] = useState(null)
  // Si el elegido ya no tiene datos (p. ej. se borró la sesión), cae al más frecuente.
  const exId = chosen && withData.includes(chosen) ? chosen : withData[0] || EXERCISES[0].id
  const setExId = setChosen
  const [metric, setMetric] = useState('best') // 'best' | 'e1rm' | 'volume'

  const series = useMemo(() => {
    return workouts
      .filter((w) => w.exercises.some((r) => r.exId === exId))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((w) => {
        const r = w.exercises.find((x) => x.exId === exId)
        const sets = r.sets.filter(setIsValid).map((s) => ({ kg: num(s.kg), reps: num(s.reps) }))
        if (!sets.length) return null
        const best = bestSet(sets)
        return {
          date: w.date,
          best: best.kg,
          bestReps: best.reps,
          e1rm: Math.round(e1rm(best.kg, best.reps) * 10) / 10,
          volume: sets.reduce((n, s) => n + s.kg * s.reps, 0),
        }
      })
      .filter(Boolean)
  }, [workouts, exId])

  if (withData.length === 0 || series.length === 0) {
    return (
      <section className="progress">
        <h2>Progreso</h2>
        <p className="muted">Todavía no hay series con peso y reps. Registra una sesión y acá verás cómo avanza cada ejercicio.</p>
      </section>
    )
  }

  const first = series[0], last = series[series.length - 1]
  const delta = last && first ? last[metric] - first[metric] : 0
  const unit = metric === 'e1rm' ? 'kg est.' : 'kg'
  const label = { best: 'Mejor serie (kg)', e1rm: '1RM estimado', volume: 'Volumen (kg × reps)' }[metric]

  return (
    <section className="progress">
      <h2>Progreso</h2>
      <select className="type-select" value={exId} onChange={(e) => setExId(e.target.value)}>
        {withData.map((id) => <option key={id} value={id}>{EX_BY_ID[id]?.name || id}</option>)}
      </select>
      <div className="seg">
        {[['best', 'Mejor serie'], ['e1rm', '1RM est.'], ['volume', 'Volumen']].map(([k, t]) => (
          <button key={k} className={metric === k ? 'is-on' : ''} onClick={() => setMetric(k)}>{t}</button>
        ))}
      </div>

      <div className="big-number">
        <b>{last[metric].toLocaleString('es-CL')}</b>
        <span>{unit}{metric === 'best' ? ` × ${last.bestReps}` : ''}</span>
        {series.length > 1 && (
          <em className={delta > 0 ? 'up' : delta < 0 ? 'down' : ''}>{delta > 0 ? '+' : ''}{delta.toLocaleString('es-CL')} desde {fmtDate(first.date)}</em>
        )}
      </div>

      <Chart points={series.map((p) => ({ x: p.date, y: p[metric] }))} label={label} />

      <table className="hist">
        <thead><tr><th>Fecha</th><th>Mejor serie</th><th>1RM est.</th><th>Volumen</th></tr></thead>
        <tbody>
          {[...series].reverse().map((p) => (
            <tr key={p.date}><td>{fmtDate(p.date)}</td><td>{p.best} × {p.bestReps}</td><td>{p.e1rm}</td><td>{p.volume.toLocaleString('es-CL')}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Chart({ points, label }) {
  const W = 340, H = 160, P = { l: 34, r: 10, t: 12, b: 24 }
  if (points.length < 2) return <p className="muted">Con una segunda sesión aparece el gráfico.</p>
  const ys = points.map((p) => p.y)
  const min = Math.min(...ys), max = Math.max(...ys)
  const span = max - min || 1
  const x = (i) => P.l + (i / (points.length - 1)) * (W - P.l - P.r)
  const y = (v) => P.t + (1 - (v - min) / span) * (H - P.t - P.b)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ')
  const ticks = [min, min + span / 2, max]
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="grid" />
          <text x={P.l - 6} y={y(t) + 4} textAnchor="end" className="tick">{Math.round(t)}</text>
        </g>
      ))}
      <path d={d} className="line" />
      {points.map((p, i) => <circle key={p.x} cx={x(i)} cy={y(p.y)} r="3.5" className="pt" />)}
      <text x={P.l} y={H - 6} className="tick">{fmtDate(points[0].x, { day: 'numeric', month: 'short' })}</text>
      <text x={W - P.r} y={H - 6} textAnchor="end" className="tick">{fmtDate(points[points.length - 1].x, { day: 'numeric', month: 'short' })}</text>
    </svg>
  )
}
