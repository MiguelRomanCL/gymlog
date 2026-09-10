import { DEFAULT_TEMPLATES, TEMPLATES_VERSION, EX_BY_ID } from './data/exercises'

const KEY = 'sesion:v1'

// ---- Normalización: todo lo que entra (localStorage o import) pasa por acá ----
export function num(v) {
  if (v === '' || v === null || v === undefined) return 0
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function cleanSet(s) {
  if (!s || typeof s !== 'object') return { kg: '', reps: '', done: false }
  const kg = num(s.kg), reps = Math.floor(num(s.reps))
  return { kg: kg ? String(kg) : '', reps: reps ? String(reps) : '', done: !!s.done }
}

function cleanRow(r) {
  if (!r || typeof r !== 'object' || typeof r.exId !== 'string') return null
  return {
    rowId: typeof r.rowId === 'string' && r.rowId ? r.rowId : uid(),
    exId: r.exId,
    plannedId: typeof r.plannedId === 'string' && r.plannedId !== r.exId ? r.plannedId : null,
    sets: Array.isArray(r.sets) ? r.sets.map(cleanSet) : [],
  }
}

const ISO = /^\d{4}-\d{2}-\d{2}$/
const MAX_RUNNING_MS = 4 * 3600 * 1000 // un cronómetro olvidado corriendo más de 4 h se detiene solo

function cleanTimer(t) {
  const acc = t && typeof t === 'object' ? Math.max(0, Math.floor(num(t.acc))) : 0
  let startedAt = t && typeof t === 'object' && Number.isFinite(t.startedAt) ? t.startedAt : null
  if (startedAt !== null && (startedAt > Date.now() || Date.now() - startedAt > MAX_RUNNING_MS)) startedAt = null
  return { startedAt, acc }
}

function cleanWorkout(w) {
  if (!w || typeof w !== 'object' || !ISO.test(w.date || '')) return null
  return {
    id: typeof w.id === 'string' && w.id ? w.id : uid(),
    date: w.date,
    type: ['push', 'pull', 'legs', 'otro'].includes(w.type) ? w.type : 'otro',
    note: typeof w.note === 'string' ? w.note : '',
    exercises: Array.isArray(w.exercises) ? w.exercises.map(cleanRow).filter(Boolean) : [],
    timer: cleanTimer(w.timer),
  }
}

// Segundos transcurridos del cronómetro de sesión.
export function timerElapsed(timer, now = Date.now()) {
  if (!timer) return 0
  return timer.acc + (timer.startedAt ? Math.floor((now - timer.startedAt) / 1000) : 0)
}
export function fmtClock(sec) {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + ':' + String(s).padStart(2, '0')
}

export function normalize(parsed) {
  const out = { workouts: [], templates: { ...DEFAULT_TEMPLATES }, tv: TEMPLATES_VERSION }
  if (parsed && typeof parsed === 'object') {
    const seen = new Set()
    for (const w of Array.isArray(parsed.workouts) ? parsed.workouts : []) {
      const c = cleanWorkout(w)
      if (c && !seen.has(c.date)) { seen.add(c.date); out.workouts.push(c) } // una sesión por día
    }
    // Rutinas guardadas con una versión vieja se reemplazan por las nuevas por defecto.
    if (parsed.tv === TEMPLATES_VERSION && parsed.templates && typeof parsed.templates === 'object') {
      for (const k of Object.keys(out.templates)) {
        if (Array.isArray(parsed.templates[k])) out.templates[k] = [...new Set(parsed.templates[k].filter((id) => typeof id === 'string' && EX_BY_ID[id]))]
      }
    }
  }
  return out
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return normalize(raw ? JSON.parse(raw) : null)
  } catch {
    return normalize(null)
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true } catch { return false }
}

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `sesion-${todayISO()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function importJSON(file) {
  return file.text().then((t) => {
    const parsed = JSON.parse(t)
    if (!parsed || !Array.isArray(parsed.workouts)) throw new Error('Formato inválido')
    return normalize(parsed)
  })
}

export function todayISO(d = new Date()) {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Estimación 1RM (Epley). Para reps=1 devuelve el peso.
export function e1rm(kg, reps) {
  kg = num(kg); reps = num(reps)
  if (!kg || !reps) return 0
  return reps === 1 ? kg : kg * (1 + reps / 30)
}

export function setIsValid(s) {
  return num(s.kg) > 0 && num(s.reps) > 0
}

export function bestSet(sets) {
  return sets.filter(setIsValid).reduce(
    (best, s) => (e1rm(s.kg, s.reps) > e1rm(best.kg, best.reps) ? { kg: num(s.kg), reps: num(s.reps) } : best),
    { kg: 0, reps: 0 }
  )
}

export function fmtDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  if (!ISO.test(iso || '')) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', opts)
}

export function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

// Limpia entrada de texto numérico: permite dígitos y un separador decimal (coma o punto).
export function sanitizeDecimal(v) {
  const s = String(v).replace(/[^\d.,]/g, '').replace(',', '.')
  const [int, ...rest] = s.split('.')
  return rest.length ? `${int}.${rest.join('').slice(0, 2)}` : int
}
export function sanitizeInt(v) {
  return String(v).replace(/\D/g, '').slice(0, 4)
}
