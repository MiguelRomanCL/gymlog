import { useEffect, useState } from 'react'
import Calendar from './components/Calendar'
import Session from './components/Session'
import StartDay from './components/StartDay'
import BodyMap from './components/BodyMap'
import Progress from './components/Progress'
import Templates from './components/Templates'
import { load, save, todayISO, normalize } from './storage'
import { newWorkout, rowsFromTemplate } from './lib/logic'

const TABS = [
  ['hoy', 'Hoy', <path d="M4 6h16M4 12h16M4 18h10" />],
  ['cuerpo', 'Cuerpo', <><circle cx="12" cy="5" r="3" /><path d="M8 22v-7l-2-6h12l-2 6v7" /></>],
  ['progreso', 'Progreso', <path d="M4 19L10 12l4 4 6-8" />],
  ['rutinas', 'Rutinas', <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 13h10M7 17h6" /></>],
]

export default function App() {
  const [state, setState] = useState(load)
  const [view, setView] = useState('hoy')
  const [selected, setSelected] = useState(todayISO())

  const [saveError, setSaveError] = useState(false)
  useEffect(() => { setSaveError(!save(state)) }, [state])

  const workout = state.workouts.find((w) => w.date === selected)
  const upsert = (w) => setState((s) => ({ ...s, workouts: [...s.workouts.filter((x) => x.date !== w.date), w] }))
  const remove = (id) => setState((s) => ({ ...s, workouts: s.workouts.filter((x) => x.id !== id) }))
  const start = (type, exercises) => upsert(newWorkout(selected, type, exercises ?? rowsFromTemplate(state.templates, type)))

  return (
    <div className="app">
      {saveError && <div className="banner">No se pudo guardar en este dispositivo (¿modo privado o sin espacio?). Exporta un respaldo.</div>}
      <main>
        {view === 'hoy' && (
          <>
            <Calendar workouts={state.workouts} selected={selected} onSelect={setSelected} />
            {workout
              ? <Session date={selected} workout={workout} workouts={state.workouts} templates={state.templates} onChange={upsert} onDelete={remove} />
              : <StartDay date={selected} workouts={state.workouts} templates={state.templates} onStart={start} />}
          </>
        )}
        {view === 'cuerpo' && <BodyMap workouts={state.workouts} />}
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
        {TABS.map(([k, t, icon]) => (
          <button key={k} className={view === k ? 'is-on' : ''} onClick={() => { if (k === 'hoy' && view === 'hoy') setSelected(todayISO()); setView(k) }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
            <span>{t}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
