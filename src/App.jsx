import { useEffect, useState } from 'react'
import Calendar from './components/Calendar'
import WorkoutDay from './components/WorkoutDay'
import Progress from './components/Progress'
import Templates from './components/Templates'
import { load, save, todayISO, normalize } from './storage'

export default function App() {
  const [state, setState] = useState(load)
  const [view, setView] = useState('hoy') // hoy | progreso | rutinas
  const [selected, setSelected] = useState(todayISO())

  const [saveError, setSaveError] = useState(false)
  useEffect(() => { setSaveError(!save(state)) }, [state])

  const workout = state.workouts.find((w) => w.date === selected)
  const upsert = (w) => setState((s) => ({ ...s, workouts: [...s.workouts.filter((x) => x.date !== w.date), w] }))
  const remove = (id) => setState((s) => ({ ...s, workouts: s.workouts.filter((x) => x.id !== id) }))

  return (
    <div className="app">
      {saveError && <div className="banner">No se pudo guardar en este dispositivo (¿modo privado o sin espacio?). Exporta un respaldo.</div>}
      <main>
        {view === 'hoy' && (
          <>
            <Calendar workouts={state.workouts} selected={selected} onSelect={setSelected} />
            <WorkoutDay
              date={selected}
              workout={workout}
              workouts={state.workouts}
              templates={state.templates}
              onChange={upsert}
              onDelete={remove}
            />
          </>
        )}
        {view === 'progreso' && <Progress workouts={state.workouts} />}
        {view === 'rutinas' && (
          <Templates
            state={state}
            onTemplates={(templates) => setState((s) => ({ ...s, templates }))}
            onImport={(data) => { if (confirm('Esto reemplaza los datos actuales. ¿Continuar?')) setState(normalize(data)) }}
          />
        )}
      </main>
      <nav className="tabs">
        {[['hoy', 'Sesiones'], ['progreso', 'Progreso'], ['rutinas', 'Rutinas']].map(([k, t]) => (
          <button key={k} className={view === k ? 'is-on' : ''} onClick={() => { if (k === 'hoy' && view === 'hoy') setSelected(todayISO()); setView(k) }}>{t}</button>
        ))}
      </nav>
    </div>
  )
}
