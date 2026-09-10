import { useEffect, useMemo, useState } from 'react'
import { EXERCISES, alternativesFor } from '../data/exercises'

// Hoja para elegir un ejercicio. Si `replacing` viene con un id, muestra primero las alternativas del mismo músculo.
export default function ExercisePicker({ replacing, exclude = [], onPick, onClose }) {
  const [q, setQ] = useState('')
  // Escape cierra; bloquear scroll del fondo mientras está abierta
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])
  const list = useMemo(() => {
    const base = replacing ? alternativesFor(replacing) : EXERCISES
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const words = norm(q).split(/\s+/).filter(Boolean)
    return base.filter((e) => !exclude.includes(e.id) && words.every((w) => norm(e.name + ' ' + e.muscle + ' ' + e.kind).includes(w)))
  }, [q, replacing, exclude])

  // Agrupar por músculo manteniendo el orden
  const groups = []
  for (const e of list) {
    let g = groups.find((x) => x.muscle === e.muscle)
    if (!g) groups.push((g = { muscle: e.muscle, items: [] }))
    g.items.push(e)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-handle" />
        <h3>{replacing ? 'Reemplazar por' : 'Agregar ejercicio'}</h3>
        <input className="search" autoFocus placeholder="Buscar por nombre o músculo" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="picker-list">
          {groups.length === 0 && <p className="muted">Nada con ese nombre.</p>}
          {groups.map((g) => (
            <div key={g.muscle}>
              <p className="picker-muscle">{g.muscle}</p>
              {g.items.map((e) => (
                <button key={e.id} className="picker-item" onClick={() => onPick(e.id)}>
                  <span>{e.name}</span>
                  <small className="muted">{e.kind}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
