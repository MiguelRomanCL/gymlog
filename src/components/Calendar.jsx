import { useEffect, useState } from 'react'
import { DAY_TYPES } from '../data/exercises'
import { todayISO, cap } from '../storage'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function Calendar({ workouts, selected, onSelect }) {
  const [cursor, setCursor] = useState(() => {
    const [y, m] = selected.split('-').map(Number)
    return { y, m: m - 1 }
  })
  // Si el día seleccionado cambia desde afuera (p. ej. volver a hoy), el mes lo sigue.
  useEffect(() => {
    const [y, m] = selected.split('-').map(Number)
    setCursor((c) => (c.y === y && c.m === m - 1 ? c : { y, m: m - 1 }))
  }, [selected])
  const byDate = Object.fromEntries(workouts.map((w) => [w.date, w]))
  const today = todayISO()

  const first = new Date(cursor.y, cursor.m, 1)
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // lunes = 0
  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthLabel = first.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  const move = (delta) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }
  const iso = (d) => `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const monthCount = workouts.filter((w) => w.date.startsWith(iso(1).slice(0, 7))).length

  return (
    <section className="cal">
      <header className="cal-head">
        <button className="icon-btn" onClick={() => move(-1)} aria-label="Mes anterior">‹</button>
        <div>
          <h2>{cap(monthLabel)}</h2>
          <p className="muted">{monthCount === 0 ? 'Sin sesiones este mes' : `${monthCount} ${monthCount === 1 ? 'sesión' : 'sesiones'}`}</p>
        </div>
        <button className="icon-btn" onClick={() => move(1)} aria-label="Mes siguiente">›</button>
      </header>
      {!(cursor.y === Number(today.slice(0, 4)) && cursor.m === Number(today.slice(5, 7)) - 1) && (
        <button className="text-btn today-btn" onClick={() => onSelect(today)}>Ir a hoy</button>
      )}
      <div className="cal-grid">
        {WEEKDAYS.map((w, i) => <div key={i} className="cal-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />
          const date = iso(d)
          const w = byDate[date]
          const color = w ? DAY_TYPES[w.type]?.color : null
          return (
            <button
              key={date}
              className={`cal-day ${date === selected ? 'is-selected' : ''} ${date === today ? 'is-today' : ''}`}
              style={w ? { '--dot': color } : undefined}
              onClick={() => onSelect(date)}
            >
              <span>{d}</span>
              {w && <i className="cal-dot" />}
            </button>
          )
        })}
      </div>
      <div className="legend">
        {['push', 'pull', 'legs'].map((k) => (
          <span key={k}><i style={{ background: DAY_TYPES[k].color }} />{DAY_TYPES[k].label}</span>
        ))}
      </div>
    </section>
  )
}
