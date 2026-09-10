// Catálogo de ejercicios. Referencia: máquinas y áreas típicas de Smart Fit.
// group: 'push' | 'pull' | 'legs' | 'core'
// muscle: grupo muscular principal (para sugerir reemplazos)
// kind: 'maquina' | 'polea' | 'libre' | 'peso corporal'
export const EXERCISES = [
  // ---- PUSH ----
  { id: 'chest-press', name: 'Chest press (máquina)', group: 'push', muscle: 'Pecho', kind: 'maquina' },
  { id: 'pec-fly', name: 'Pec fly (máquina)', group: 'push', muscle: 'Pecho', kind: 'maquina' },
  { id: 'incline-press-machine', name: 'Press inclinado (máquina)', group: 'push', muscle: 'Pecho', kind: 'maquina' },
  { id: 'smith-bench', name: 'Press banca en Smith', group: 'push', muscle: 'Pecho', kind: 'maquina' },
  { id: 'db-bench', name: 'Press banca con mancuernas', group: 'push', muscle: 'Pecho', kind: 'libre' },
  { id: 'db-incline', name: 'Press inclinado con mancuernas', group: 'push', muscle: 'Pecho', kind: 'libre' },
  { id: 'bb-bench', name: 'Press banca con barra', group: 'push', muscle: 'Pecho', kind: 'libre' },
  { id: 'cable-cross', name: 'Cruce de poleas', group: 'push', muscle: 'Pecho', kind: 'polea' },
  { id: 'dips-assisted', name: 'Fondos asistidos (máquina)', group: 'push', muscle: 'Pecho', kind: 'maquina' },
  { id: 'shoulder-press-machine', name: 'Shoulder press (máquina)', group: 'push', muscle: 'Hombro', kind: 'maquina' },
  { id: 'db-shoulder-press', name: 'Press militar con mancuernas', group: 'push', muscle: 'Hombro', kind: 'libre' },
  { id: 'smith-ohp', name: 'Press militar en Smith', group: 'push', muscle: 'Hombro', kind: 'maquina' },
  { id: 'lateral-raise-machine', name: 'Elevaciones laterales (máquina)', group: 'push', muscle: 'Hombro', kind: 'maquina' },
  { id: 'db-lateral-raise', name: 'Elevaciones laterales con mancuernas', group: 'push', muscle: 'Hombro', kind: 'libre' },
  { id: 'cable-lateral-raise', name: 'Elevaciones laterales en polea', group: 'push', muscle: 'Hombro', kind: 'polea' },
  { id: 'tricep-pushdown', name: 'Extensión de tríceps en polea (barra)', group: 'push', muscle: 'Tríceps', kind: 'polea' },
  { id: 'tricep-rope', name: 'Extensión de tríceps en polea (cuerda)', group: 'push', muscle: 'Tríceps', kind: 'polea' },
  { id: 'tricep-machine', name: 'Tricep press (máquina)', group: 'push', muscle: 'Tríceps', kind: 'maquina' },
  { id: 'overhead-tricep', name: 'Extensión de tríceps sobre cabeza', group: 'push', muscle: 'Tríceps', kind: 'polea' },
  { id: 'skullcrusher', name: 'Press francés', group: 'push', muscle: 'Tríceps', kind: 'libre' },

  // ---- PULL ----
  { id: 'lat-pulldown', name: 'Jalón al pecho (lat pulldown)', group: 'pull', muscle: 'Espalda', kind: 'polea' },
  { id: 'lat-pulldown-close', name: 'Jalón agarre cerrado', group: 'pull', muscle: 'Espalda', kind: 'polea' },
  { id: 'pullup-assisted', name: 'Dominadas asistidas (máquina)', group: 'pull', muscle: 'Espalda', kind: 'maquina' },
  { id: 'pullup', name: 'Dominadas', group: 'pull', muscle: 'Espalda', kind: 'peso corporal' },
  { id: 'seated-row', name: 'Remo sentado en polea', group: 'pull', muscle: 'Espalda', kind: 'polea' },
  { id: 'row-machine', name: 'Remo en máquina', group: 'pull', muscle: 'Espalda', kind: 'maquina' },
  { id: 'row-hammer', name: 'Remo bajo (máquina, agarre neutro)', group: 'pull', muscle: 'Espalda', kind: 'maquina' },
  { id: 'db-row', name: 'Remo con mancuerna', group: 'pull', muscle: 'Espalda', kind: 'libre' },
  { id: 'bb-row', name: 'Remo con barra', group: 'pull', muscle: 'Espalda', kind: 'libre' },
  { id: 'tbar-row', name: 'Remo T', group: 'pull', muscle: 'Espalda', kind: 'libre' },
  { id: 'straight-arm-pulldown', name: 'Pullover en polea', group: 'pull', muscle: 'Espalda', kind: 'polea' },
  { id: 'rear-delt-fly', name: 'Rear delt fly (máquina)', group: 'pull', muscle: 'Hombro posterior', kind: 'maquina' },
  { id: 'face-pull', name: 'Face pull', group: 'pull', muscle: 'Hombro posterior', kind: 'polea' },
  { id: 'db-rear-fly', name: 'Pájaros con mancuernas', group: 'pull', muscle: 'Hombro posterior', kind: 'libre' },
  { id: 'db-curl', name: 'Curl con mancuernas', group: 'pull', muscle: 'Bíceps', kind: 'libre' },
  { id: 'bb-curl', name: 'Curl con barra', group: 'pull', muscle: 'Bíceps', kind: 'libre' },
  { id: 'preacher-curl', name: 'Curl predicador (máquina)', group: 'pull', muscle: 'Bíceps', kind: 'maquina' },
  { id: 'cable-curl', name: 'Curl en polea', group: 'pull', muscle: 'Bíceps', kind: 'polea' },
  { id: 'hammer-curl', name: 'Curl martillo', group: 'pull', muscle: 'Bíceps', kind: 'libre' },
  { id: 'shrug', name: 'Encogimientos', group: 'pull', muscle: 'Trapecio', kind: 'libre' },

  // ---- LEGS ----
  { id: 'leg-press', name: 'Prensa 45°', group: 'legs', muscle: 'Cuádriceps', kind: 'maquina' },
  { id: 'hack-squat', name: 'Hack squat', group: 'legs', muscle: 'Cuádriceps', kind: 'maquina' },
  { id: 'smith-squat', name: 'Sentadilla en Smith', group: 'legs', muscle: 'Cuádriceps', kind: 'maquina' },
  { id: 'bb-squat', name: 'Sentadilla con barra', group: 'legs', muscle: 'Cuádriceps', kind: 'libre' },
  { id: 'goblet-squat', name: 'Sentadilla goblet', group: 'legs', muscle: 'Cuádriceps', kind: 'libre' },
  { id: 'leg-extension', name: 'Extensión de cuádriceps', group: 'legs', muscle: 'Cuádriceps', kind: 'maquina' },
  { id: 'bulgarian', name: 'Sentadilla búlgara', group: 'legs', muscle: 'Cuádriceps', kind: 'libre' },
  { id: 'lunges', name: 'Zancadas', group: 'legs', muscle: 'Cuádriceps', kind: 'libre' },
  { id: 'leg-curl-lying', name: 'Curl femoral acostado', group: 'legs', muscle: 'Isquiotibiales', kind: 'maquina' },
  { id: 'leg-curl-seated', name: 'Curl femoral sentado', group: 'legs', muscle: 'Isquiotibiales', kind: 'maquina' },
  { id: 'rdl', name: 'Peso muerto rumano', group: 'legs', muscle: 'Isquiotibiales', kind: 'libre' },
  { id: 'deadlift', name: 'Peso muerto', group: 'legs', muscle: 'Isquiotibiales', kind: 'libre' },
  { id: 'hip-thrust', name: 'Hip thrust', group: 'legs', muscle: 'Glúteo', kind: 'libre' },
  { id: 'glute-machine', name: 'Glúteo en máquina (patada)', group: 'legs', muscle: 'Glúteo', kind: 'maquina' },
  { id: 'cable-kickback', name: 'Patada de glúteo en polea', group: 'legs', muscle: 'Glúteo', kind: 'polea' },
  { id: 'abductor', name: 'Abductores (máquina)', group: 'legs', muscle: 'Glúteo', kind: 'maquina' },
  { id: 'adductor', name: 'Aductores (máquina)', group: 'legs', muscle: 'Aductores', kind: 'maquina' },
  { id: 'calf-seated', name: 'Gemelos sentado (máquina)', group: 'legs', muscle: 'Pantorrilla', kind: 'maquina' },
  { id: 'calf-standing', name: 'Gemelos de pie', group: 'legs', muscle: 'Pantorrilla', kind: 'maquina' },
  { id: 'calf-leg-press', name: 'Gemelos en prensa', group: 'legs', muscle: 'Pantorrilla', kind: 'maquina' },

  // ---- CORE ----
  { id: 'ab-crunch-machine', name: 'Abdominal crunch (máquina)', group: 'core', muscle: 'Abdomen', kind: 'maquina' },
  { id: 'cable-crunch', name: 'Crunch en polea', group: 'core', muscle: 'Abdomen', kind: 'polea' },
  { id: 'leg-raise', name: 'Elevación de piernas', group: 'core', muscle: 'Abdomen', kind: 'peso corporal' },
  { id: 'plank', name: 'Plancha', group: 'core', muscle: 'Abdomen', kind: 'peso corporal' },
]

export const EX_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))

export const DAY_TYPES = {
  push: { label: 'Push', long: 'Pecho, hombro, tríceps', color: '#D6321E' },
  pull: { label: 'Pull', long: 'Espalda, hombro posterior, bíceps', color: '#1F5FBF' },
  legs: { label: 'Legs', long: 'Pierna y glúteo', color: '#1E8A5A' },
  otro: { label: 'Otro', long: 'Sesión libre', color: '#6B7078' },
}

// Plantillas iniciales (editables desde la app).
export const DEFAULT_TEMPLATES = {
  push: ['chest-press', 'db-incline', 'pec-fly', 'shoulder-press-machine', 'db-lateral-raise', 'tricep-pushdown', 'overhead-tricep'],
  pull: ['lat-pulldown', 'seated-row', 'row-machine', 'rear-delt-fly', 'face-pull', 'db-curl', 'hammer-curl'],
  legs: ['leg-press', 'hack-squat', 'leg-extension', 'leg-curl-lying', 'rdl', 'hip-thrust', 'calf-seated'],
  otro: [],
}

// Reemplazos sugeridos: mismo músculo primero, luego mismo grupo.
export function alternativesFor(exId) {
  const ex = EX_BY_ID[exId]
  if (!ex) return EXERCISES
  const same = EXERCISES.filter((e) => e.id !== exId && e.muscle === ex.muscle)
  const group = EXERCISES.filter((e) => e.id !== exId && e.muscle !== ex.muscle && e.group === ex.group)
  return [...same, ...group]
}
