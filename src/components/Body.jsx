// Silueta humana con regiones por músculo (mismo string que `muscle` en el catálogo).
// viewBox 0 0 120 260. `levels` = { [muscle]: 0..3 } → clase lvl-N.
const E = (cx, cy, rx, ry) => ({ t: 'e', cx, cy, rx, ry })
const P = (d) => ({ t: 'p', d })

export const FRONT = [
  { muscle: 'Hombro', shapes: [E(31, 56, 10, 9), E(89, 56, 10, 9)] },
  { muscle: 'Pecho', shapes: [P('M41 50 C49 47 57 49 59 51 L59 80 C50 83 41 76 40 62 Z'), P('M79 50 C71 47 63 49 61 51 L61 80 C70 83 79 76 80 62 Z')] },
  { muscle: 'Bíceps', shapes: [E(24, 84, 7.5, 17), E(96, 84, 7.5, 17)] },
  { muscle: 'Abdomen', shapes: [P('M47 86 H73 Q76 86 76 89 V128 Q70 134 60 134 Q50 134 44 128 V89 Q44 86 47 86 Z')] },
  { muscle: 'Aductores', shapes: [E(53, 160, 5, 20), E(67, 160, 5, 20)] },
  { muscle: 'Cuádriceps', shapes: [E(43, 172, 10.5, 36), E(77, 172, 10.5, 36)] },
  { muscle: 'Pantorrilla', shapes: [E(44, 232, 7, 22), E(76, 232, 7, 22)] },
]
export const BACK = [
  { muscle: 'Espalda', shapes: [P('M37 58 C36 84 44 106 50 128 L59 130 V70 Z'), P('M83 58 C84 84 76 106 70 128 L61 130 V70 Z')] },
  { muscle: 'Trapecio', shapes: [P('M60 38 L36 54 Q40 56 44 58 L60 88 L76 58 Q80 56 84 54 Z')] },
  { muscle: 'Hombro posterior', shapes: [E(31, 56, 10, 9), E(89, 56, 10, 9)] },
  { muscle: 'Tríceps', shapes: [E(24, 84, 7.5, 17), E(96, 84, 7.5, 17)] },
  { muscle: 'Glúteo', shapes: [E(48, 143, 12, 14), E(72, 143, 12, 14)] },
  { muscle: 'Isquiotibiales', shapes: [E(45, 186, 10.5, 32), E(75, 186, 10.5, 32)] },
  { muscle: 'Pantorrilla', shapes: [E(44, 234, 7.5, 22), E(76, 234, 7.5, 22)] },
]
export const ALL_MUSCLES = [...new Set([...FRONT, ...BACK].map((r) => r.muscle))]
const FRONT_SET = new Set(FRONT.map((r) => r.muscle))
export const viewFor = (muscle) => (FRONT_SET.has(muscle) && muscle !== 'Pantorrilla' ? 'front' : 'back')

const SIL = 'M40 44 H80 Q94 44 96 58 L98 90 Q99 106 96 118 L92 150 H86 L84 118 Q82 108 84 96 L85 82 Q80 94 80 108 V130 Q80 138 78 146 L80 190 Q80 214 78 232 L76 256 H62 L64 232 Q66 210 62 190 V150 H58 V190 Q54 210 56 232 L58 256 H44 L42 232 Q40 214 40 190 L42 146 Q40 138 40 130 V108 Q40 94 35 82 L36 96 Q38 108 36 118 L34 150 H28 L24 118 Q21 106 22 90 L24 58 Q26 44 40 44 Z'

export function Body({ view = 'front', levels = {}, width = 120, title }) {
  const regions = view === 'front' ? FRONT : BACK
  return (
    <svg className="body" viewBox="0 0 120 260" width={width} height={Math.round((width * 260) / 120)} role="img" aria-label={title || (view === 'front' ? 'Frente' : 'Espalda')}>
      <g className="body-base"><circle cx="60" cy="20" r="13" /><rect x="54" y="30" width="12" height="12" rx="3" /><path d={SIL} /></g>
      {regions.map((r) => (
        <g key={r.muscle} className={`body-m lvl-${levels[r.muscle] || 0}`} data-muscle={r.muscle}>
          <title>{r.muscle}</title>
          {r.shapes.map((s, i) => (s.t === 'e' ? <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} /> : <path key={i} d={s.d} />))}
        </g>
      ))}
    </svg>
  )
}

export function Legend() {
  return (
    <div className="cov-legend">
      <span><i className="lvl-0" />sin tocar</span><span><i className="lvl-1" />1–5</span><span><i className="lvl-2" />6–11</span><span><i className="lvl-3" />12+</span>
    </div>
  )
}
