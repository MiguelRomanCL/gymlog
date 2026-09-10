import { useRef, useState } from 'react'
import { DAY_TYPES, EX_BY_ID } from '../data/exercises'
import { exportJSON, importJSON } from '../storage'
import ExercisePicker from './ExercisePicker'

export default function Templates({ state, onTemplates, onImport }) {
  const [tab, setTab] = useState('push')
  const [adding, setAdding] = useState(false)
  const fileRef = useRef()
  const list = state.templates[tab] || []
  const set = (arr) => onTemplates({ ...state.templates, [tab]: arr })
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const arr = [...list]; [arr[i], arr[j]] = [arr[j], arr[i]]; set(arr)
  }

  return (
    <section className="templates">
      <h2>Rutinas</h2>
      <p className="muted">Lo que se carga por defecto al iniciar cada tipo de día. Cambiarlo no afecta sesiones ya registradas.</p>
      <div className="seg">
        {['push', 'pull', 'legs', 'otro'].map((k) => (
          <button key={k} className={tab === k ? 'is-on' : ''} style={{ '--c': DAY_TYPES[k].color }} onClick={() => setTab(k)}>{DAY_TYPES[k].label}</button>
        ))}
      </div>
      <ol className="tpl-list">
        {list.map((id, i) => (
          <li key={id}>
            <span>{EX_BY_ID[id]?.name || id}</span>
            <div>
              <button className="icon-btn small" onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button className="icon-btn small" onClick={() => move(i, 1)} aria-label="Bajar">↓</button>
              <button className="icon-btn small" onClick={() => set(list.filter((x) => x !== id))} aria-label="Quitar">×</button>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="muted">Vacío. Agrega ejercicios.</li>}
      </ol>
      <button className="btn-secondary wide" onClick={() => setAdding(true)}>+ Agregar ejercicio</button>
      {adding && <ExercisePicker exclude={list} onPick={(id) => { set([...list, id]); setAdding(false) }} onClose={() => setAdding(false)} />}

      <h2 style={{ marginTop: 40 }}>Datos</h2>
      <p className="muted">Todo se guarda en este dispositivo. Exporta un respaldo de vez en cuando o para pasarlo a otro aparato.</p>
      <div className="row-btns">
        <button className="btn-secondary" onClick={() => exportJSON(state)}>Exportar respaldo</button>
        <button className="btn-secondary" onClick={() => fileRef.current.click()}>Importar respaldo</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={async (e) => {
          const f = e.target.files[0]; if (!f) return
          try { onImport(await importJSON(f)) } catch { alert('El archivo no tiene el formato esperado.') }
          e.target.value = ''
        }} />
      </div>
    </section>
  )
}
