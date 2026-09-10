# Sesión — registro de entrenamiento

App web (PWA) para registrar sesiones de gimnasio con split Push / Pull / Legs.

**App en línea:** https://miguelromancl.github.io/gymlog/ (se despliega sola con cada push a `main`).
Catálogo de ejercicios basado en las máquinas y áreas habituales de Smart Fit.

## Correr en local
```bash
npm install
npm run dev        # http://localhost:5173
```

## Deploy (gratis)
```bash
npm run build      # genera dist/
```
Sube la carpeta `dist/` a Vercel, Netlify o GitHub Pages. Con Vercel:
`npm i -g vercel && vercel` desde la raíz del proyecto (detecta Vite solo).

## Usarla en iPhone
1. Abre la URL deployada en Safari.
2. Compartir → "Agregar a pantalla de inicio".
3. Se abre como app a pantalla completa y funciona sin conexión (service worker).

Los datos viven en `localStorage` del dispositivo. Usa Rutinas → Exportar respaldo
para moverlos entre dispositivos.

## Estructura
- `src/data/exercises.js` — catálogo, tipos de día y plantillas por defecto
- `src/storage.js` — persistencia, export/import, 1RM estimado (Epley)
- `src/components/` — Calendar, WorkoutDay, ExercisePicker, Progress, Templates

## Modelo de datos
```js
{ workouts: [{ id, date: 'YYYY-MM-DD', type: 'push'|'pull'|'legs'|'otro', note,
    exercises: [{ rowId, exId, plannedId /* si hubo cambio */, sets: [{ kg, reps }] }] }],
  templates: { push: [exId...], pull: [...], legs: [...], otro: [] } }
```

## QA automatizado
`qa/qa.py` es una suite end-to-end con Playwright (Python) que cubre 20 flujos:
inputs y validación, steppers, series, cambio/quitar ejercicio, cambio de tipo de día,
calendario, persistencia con datos corruptos, import/export, rutinas y clics en ráfaga.
```bash
pip install playwright && playwright install chromium
npm run build && npx vite preview --port 4173 --host 127.0.0.1 &
python3 qa/qa.py
```
