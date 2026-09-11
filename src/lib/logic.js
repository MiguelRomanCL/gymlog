// Lógica compartida: estadísticas por músculo, sugerencia del día, semanas, sesiones nuevas.
import { DAY_TYPES, EX_BY_ID } from '../data/exercises'
import { setIsValid, todayISO, uid, fmtDate } from '../storage'
import { ALL_MUSCLES } from '../components/Body'

export const ORDER = ['push', 'pull', 'legs']
export const emptySet = () => ({ kg: '', reps: '', done: false })
export const nSeries = (n) => `${n} ${n === 1 ? 'serie' : 'series'}`

export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}
export function isoAdd(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return todayISO(new Date(y, m - 1, d + days))
}
// Lunes de la semana que contiene `iso`
export function mondayOf(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = (new Date(y, m - 1, d).getDay() + 6) % 7
  return isoAdd(iso, -wd)
}
export function weekNumber(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const jan1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date - jan1) / 86400000 + 1) / 7)
}

// Nivel de "encendido" por series en una ventana (semana) y dentro de una sesión.
export const level = (n) => (n === 0 ? 0 : n < 6 ? 1 : n < 12 ? 2 : 3)
export const sessionLevel = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : 3)

// Series válidas por músculo en los últimos `days` días antes de `today` (inclusive) y días desde la última vez.
export function muscleStats(workouts, today = todayISO(), days = 7) {
  const m = Object.fromEntries(ALL_MUSCLES.map((k) => [k, { sets: 0, last: null }]))
  for (const w of workouts) {
    if (w.date > today) continue
    const age = daysBetween(w.date, today)
    for (const r of w.exercises) {
      const ex = EX_BY_ID[r.exId]; if (!ex || !m[ex.muscle]) continue
      const n = r.sets.filter(setIsValid).length; if (!n) continue
      const s = m[ex.muscle]
      if (s.last === null || age < s.last) s.last = age
      if (age < days) s.sets += n
    }
  }
  return m
}
export const levelsFrom = (stats, fn = level) => Object.fromEntries(Object.entries(stats).map(([k, v]) => [k, fn(v.sets)]))
export const coveredCount = (stats) => Object.values(stats).filter((s) => s.sets > 0).length

// Músculos de una sesión en orden de aparición: { muscle: { done, total } } (done = series hechas y válidas)
export function sessionMuscles(rows) {
  const out = {}
  for (const r of rows) {
    const ex = EX_BY_ID[r.exId]; if (!ex) continue
    const s = (out[ex.muscle] ||= { done: 0, total: 0 })
    s.total += r.sets.length
    s.done += r.sets.filter((x) => x.done && setIsValid(x)).length
  }
  return out
}

const joinNames = (names) => names.map((n, i) => (i ? n.toLowerCase() : n)).join(' y ')

// Qué toca hoy: siguiente del ciclo, con la razón (músculos de esa rutina más abandonados).
export function suggest(workouts, date, templates) {
  const prev = workouts.filter((w) => w.date < date && ORDER.includes(w.type)).sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null
  const type = prev ? ORDER[(ORDER.indexOf(prev.type) + 1) % ORDER.length] : 'push'
  const stats = muscleStats(workouts, date, 7)
  const muscles = [...new Set((templates[type] || []).map((id) => EX_BY_ID[id]?.muscle).filter((m) => m && stats[m]))]
  const stale = muscles.filter((m) => stats[m].last === null || stats[m].last >= 4).sort((a, b) => (stats[b].last ?? 999) - (stats[a].last ?? 999))
  let reason
  if (stale.length) {
    const top = stale.slice(0, 2), age = stats[top[0]].last
    reason = age === null ? `${joinNames(top)} todavía sin entrenar.` : `${joinNames(top)} ${top.length > 1 ? 'llevan' : 'lleva'} ${age} días sin tocarse.`
  } else {
    reason = prev ? `Sigue el ciclo: lo último fue ${DAY_TYPES[prev.type].label} el ${fmtDate(prev.date)}.` : 'Primera sesión: arranca por Push.'
  }
  const prevSame = workouts.filter((w) => w.date < date && w.type === type).sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null
  return { type, reason, prev, prevSame }
}

export const rowsFromTemplate = (templates, type) =>
  (templates[type] || []).filter((id) => EX_BY_ID[id]).map((exId) => ({ rowId: uid(), exId, plannedId: null, sets: [emptySet()] }))

export const newWorkout = (date, type, exercises) => ({ id: uid(), date, type, note: '', exercises, timer: { startedAt: null, acc: 0 }, finished: false })

// Última vez que se hizo este ejercicio antes de `date`.
export function lastRef(workouts, exId, date, bestSet) {
  const prior = workouts.filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))
  for (const w of prior) {
    const ex = w.exercises.find((e) => e.exId === exId && e.sets.some(setIsValid))
    if (ex) return { date: w.date, best: bestSet(ex.sets), sets: ex.sets.filter(setIsValid).length }
  }
  return null
}
