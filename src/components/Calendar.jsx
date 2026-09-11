import { useEffect, useState } from 'react'
import { DAY_TYPES } from '../data/exercises'
import { todayISO, cap } from '../storage'
import { isoAdd, mondayOf } from '../lib/logic'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const monthOf = (iso) => ({ y: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)) - 1 })
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

// Semana compacta por defecto; tocar el mes despliega el calendario completo.
export default function Calendar({ workouts, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const [cursor, setCursor] = useState(() => monthOf(selected))
  const [weekStart, setWeekStart] = useState(() => mondayOf(selected))
  useEffect(() => { setCursor(monthOf(selected)); setWeekStart(mondayOf(selected)) }, [selected])

  const byDate = Object.fromEntries(workouts.map((w) => [w.date, w]))
  const today = todayISO()

  let cells, label, count
  if (expanded) {
    const first = new Date(cursor.y, cursor.m, 1)
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
    const lead = (first.getDay() + 6) % 7
    cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => iso(cursor.y, cursor.m, i + 1))]
    label = first.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    const key = iso(cursor.y, cursor.m, 1).slice(0, 7)
    count = workouts.filter((w) => w.date.startsWith(key)).length
  } else {
    cells = Array.from({ length: 7 }, (_, i) => isoAdd(weekStart, i))
    const [y, m, d] = weekStart.split('-').map(Number)
    label = new Date(y, m - 1, d).toLocaleDateString('es-CL', { month: 'long' })
    count = cells.filter((c) => byDate[c]).length
  }
  const move = (delta) => {
    if (expanded) { const d = new Date(cursor.y, cursor.m + delta, 1); setCursor({ y: d.getFullYear(), m: d.getMonth() }) }
    else setWeekStart((w) => isoAdd(w, delta * 7))
  }
  const showToday = expanded ? !(cursor.y === Number(today.slice(0, 4)) && cursor.m === Number(today.slice(5, 7)) - 1) : selected !== today || !cells.includes(today)

  return (
    <section className={`cal ${expanded ? 'is-expanded' : ''}`}>
      <header className="cal-head">
        <button className="icon-btn" onClick={() => move(-1)} aria-label="Anterior">‹</button>
        <button className="cal-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          <span className="d">{cap(label)}</span>
          <span className="muted">{count === 0 ? (expanded ? 'sin sesiones este mes' : 'sin sesiones esta semana') : `${count} ${count === 1 ? 'sesión' : 'sesiones'}`} · {expanded ? 'ver semana' : 'ver mes'}</span>
        </button>
        <button className="icon-btn" onClick={() => move(1)} aria-label="Siguiente">›</button>
      </header>
      <div className="cal-grid">
        {WEEKDAYS.map((w, i) => <div key={i} className="cal-wd">{w}</div>)}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const w = byDate[date]
          return (
            <button key={date} className={`cal-day ${date === selected ? 'is-selected' : ''} ${date === today ? 'is-today' : ''} ${w?.finished ? 'is-finished' : ''}`}
              style={w ? { '--dot': DAY_TYPES[w.type]?.color } : undefined} onClick={() => onSelect(date)}>
              <span>{Number(date.slice(8, 10))}</span>
              {w && <i className="cal-dot" />}
            </button>
          )
        })}
      </div>
      {showToday && <button className="text-btn today-btn" onClick={() => { onSelect(today); setCursor(monthOf(today)); setWeekStart(mondayOf(today)) }}>Ir a hoy</button>}
    </section>
  )
}
