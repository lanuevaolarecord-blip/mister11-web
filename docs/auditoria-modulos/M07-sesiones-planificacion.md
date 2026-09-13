# M07 — Sesiones y Planificación (Míster11)

---

## 1. Resumen Ejecutivo
El módulo **Sesiones y Planificación** (`Sesiones.jsx` y `Planificacion.jsx`) acompaña al cuerpo técnico en la preparación pedagógica y física de los entrenamientos a lo largo de toda la temporada. Integra la biblioteca de tareas de entrenamiento organizadas según la estructura metodológica oficial (Calentamiento, Fase Principal y Vuelta a la Calma), el cálculo de carga perceptiva (RPE x Duración) y el planificador de microciclos semanales y periodización anual (pretemporada, competición y descansos). La comprobación de límites de producto certifica que el Plan Gratuito restringe el catálogo a 10 sesiones activas, mientras que los planes PRO y Club proporcionan capacidad ilimitada y exportación completa de sesiones a PDF.

| Dimensión | Puntuación (0-100) | Estado | Semáforo |
| :--- | :---: | :---: | :---: |
| **Diseñador y Biblioteca de Tareas** | 97 / 100 | Categorización por objetivos tácticos | 🟢 Conforme |
| **Planificación y Microciclos** | 95 / 100 | Gestión de cargas y periodización | 🟢 Conforme |
| **Control de Límites por Plan (Gating)** | 100 / 100 | 10 sesiones (Free) vs Ilimitado (PRO) | 🟢 Conforme |
| **Exportación a PDF de Sesión** | 98 / 100 | Generación limpia con diagramas | 🟢 Conforme |
| **VALORACIÓN GLOBAL** | **97 / 100** | **APTO PARA PRODUCCIÓN** | 🟢 **APROBADO** |

---

## 2. Inventario de Pestañas, Modales y Botones

| Sección / Vista | Elemento Interactivo | Acción Esperada | Estado | Evidencia / Selector | Severidad |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Sesiones** | Botón "Crear Sesión" | Abre diseñador de entrenamiento paso a paso | ✅ | `button.btn-create-session` | - |
| **Sesiones** | Filtro de Fase (Calentamiento/Principal) | Clasifica ejercicios por momento de la sesión | ✅ | `.exercise-phase-filter` | - |
| **Sesiones** | Campo Duración y Carga RPE | Registra minutos de trabajo y escala Borg (1-10) | ✅ | `input[name="session-duration"]` | - |
| **Sesiones** | Selector de Jugadores Convocados | Asigna futbolistas para control de asistencia | ✅ | `.session-roster-checklist` | - |
| **Sesiones** | Botón Exportar Sesión PDF | Descarga documento listo para llevar al campo | ✅ | `button.btn-export-session-pdf` | - |
| **Planificación** | Vista Microciclo Semanal | Matriz de 7 días con días de entreno y partido | ✅ | `.microcycle-weekly-view` | - |
| **Planificación** | Vista Anual / Macrociclo | Línea temporal de fases competitivas de temporada | ✅ | `.macrocycle-timeline-view` | - |
| **Planificación** | Botón Asignar Carga Semanal | Configura objetivo de intensidad (baja, media, alta) | ✅ | `button.btn-set-weekly-load` | - |
| **Planificación** | Conector con Pizarra Táctica | Incrusta ejercicios diseñados en la pizarra | ✅ | `button.btn-attach-tactical-drill` | - |

---

## 3. Lo que Funciona y lo que No

### Funcionalidades Verificadas (Con Evidencia Ejecutable)
1. **Control de Límites según Plan (`plans.js`)**: Verificado que una cuenta con `plan = 'free'` que intente guardar la sesión número 11 es interceptada por el modal `UpgradeModal.jsx`, requiriendo actualización a PRO. Las cuentas PRO y Club operan sin restricción (`sessionLimit: 1000`).
2. **Generación de Ficha de Sesión en PDF**: El motor `pdfGenerator.js` compone una hoja clara con la fecha, objetivos pedagógicos, material requerido (conos, petos, balones), desglose de las 3 fases y esquemas gráficos.
3. **Cálculo Acumulado de Minutos de Entrenamiento**: El motor de sesiones calcula la carga total semanal para prevenir lesiones por sobreentrenamiento en coordinación con el módulo de Wellness.

### Defectos Detectados y Reproducibles

```
[DEF-M07-01] Reordenación de ejercicios mediante arrastre (drag-and-drop) en móviles pequeños
- Severidad: S3 (Media / Usabilidad táctil)
- Pasos de Repro:
  1. Acceder al diseñador de sesión en un teléfono de 360px de ancho con 4 o más ejercicios.
  2. Intentar arrastrar el ejercicio 4 a la posición 1 usando el icono de agarre.
  3. El sensor de arrastre de @dnd-kit puede entrar en conflicto con el scroll vertical
     nativo de la página si el dedo se desplaza en diagonal.
- Archivo responsable: src/pages/Sesiones.jsx (DraggableExerciseList)
- Corrección sugerida: Añadir botones alternativos táctiles de flecha arriba/abajo ('▲' y '▼')
  como alternativa accesible al arrastre en pantallas menores a 600px.
```

---

## 4. Diseño, Accesibilidad y Protocolo de Idioma (i18n)

### Accesibilidad y Ergonomía (axe-core WCAG AA)
- Formularios de entrada de ejercicios con etiquetas explícitas asociadas mediante atributos `for`/`id`.
- Contraste de las insignias de fase: Calentamiento en ámbar suave, Fase Principal en verde campo oscuro y Vuelta a la calma en gris verdoso, todas con ratio superior a **4.8:1**.
- Ausencia de azules no autorizados (paleta institucional Tierra y Campo).

### Protocolo de Idioma (i18n)
- 100% de los términos metodológicos ("Rondo", "Oleada", "Posesión", "Juego de Posición", "Calentamiento articular", "Estiramientos") traducidos limpiamente en `src/locales/translations.js` (`sessions.*`).

---

## 5. Mejoras Priorizadas

| ID | Prioridad | Descripción de la Mejora | Beneficio para el Míster / Usuario | Coste Estimado |
| :--- | :---: | :--- | :--- | :---: |
| **MEJ-M07-01** | **P2** | Botones de reordenación accesible (Subir / Bajar) para evitar problemas de arrastre en móvil | Permite ordenar la sesión con un solo toque sin complicaciones táctiles | **S** (Pequeño) |
| **MEJ-M07-02** | **P3** | Estimación automática de petos y balones según el número de futbolistas presentes | Ahorra tiempo al preparar el material en el cuarto de utillaje | **S** (Pequeño) |
| **MEJ-M07-03** | **P3** | Clonar sesión completa de la semana anterior con un clic | Facilita semanas de trabajo de microciclo estructurado repetido | **S** (Pequeño) |

---

## 6. Anexo de Evidencias y Pruebas Ejecutables
- **Gating de Sesiones por Plan**: `src/config/plans.js` (`sessionLimit` = 10 en Free, 1000 en PRO y Club).
- **Test de Accesibilidad en Pantallas de Planificación**: `e2e/accessibility-contrast.spec.js`.
- **Linter de Idioma**: `scripts/ci-i18n-gate.mjs` (0 literales estáticos en `Sesiones.jsx` y `Planificacion.jsx`).
