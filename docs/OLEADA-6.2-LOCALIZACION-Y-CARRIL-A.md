# MISTER11 — INFORME DE CIERRE OLEADA 6.2: LOCALIZACIÓN REAL, GOBERNANZA VISUAL Y SEGURIDAD BIOMECÁNICA

**Versión:** 1.1.77 (Reloj Google Build 95 intacto)  
**Fecha:** 9 de octubre de 2026  
**Rol:** Arquitecto Full-Stack + Ingeniero de localización + QA Sr.  
**Estado:** LISTO PARA REVISIÓN VISUAL DEL DUEÑO (Carril A reparado)

---

## 1. Contexto y Causa Raíz

En la Oleada 6.1, el gate de CI `G1 ("idéntico a EN")` resultó ser **ciego al español y a las mezclas lingüísticas**: al comparar únicamente si una clave difería de la versión inglesa, permitía que cadenas en portugués o francés retuvieran valores en español o construcciones híbridas (portuñol/frañol) heredadas sin traducción. Además, erratas ortográficas graves (como `Execrcices` en el menú francés) demostraron que se habían importado cadenas automáticas sin supervisión humana.

En la Oleada 6.2 se adopta la **Prueba Visual del Dueño como criterio supremo de aceptación**: la evidencia fotográfica de producción aportada por el dueño se convierte en el conjunto de casos de prueba obligatorios.

---

## 2. Erratas Corregidas y Política de Revisión Humana

### 2.1 Erratas Identificadas y Subsanadas
- **FR Menú Lateral:** `Execrcices` ➔ `Exercices` (errata tipográfica no revisada).
- **FR Header Admin:** `ADMINISTRACIÓN` ➔ `ADMINISTRATION`.
- **FR Sección XP:** `ENREGISTRER Configuración de XP` ➔ `Enregistrer Configuration XP`.
- **PT Dashboard:** `UNIRSE A UN EQUIPO COMO STAFF` ➔ `JUNTE-SE A UMA EQUIPE COMO STAFF`.
- **PT Fecha Mes:** `OCTUBRE DE 2026` ➔ `OUTUBRO DE 2026` (mediante locale `pt-BR` dinámico).
- **PT Cuenta Dev:** `Tu conta tiene acceso permanente de por vida con todos os limites removidos.` ➔ `Sua conta tem acesso permanente vitalício com todos os limites removidos.`.
- **PT Workload Index:** `Time Workload Index` ➔ `Índice de Carga de Trabalho`.
- **PT Próximas Sesiones:** `Upcoming Sessões` ➔ `Próximas Sessões`.
- **PT Estado Vacío:** `No hay sessões próximas.` ➔ `Não há sessões próximas.`.
- **PT/FR Registros de Asistencia:** Cadenas híbridas como `Aún no hay sessões ni partidas registrados.` eliminadas y reemplazadas por portugués/francés nativo.

### 2.2 Política Estricta de Revisión Humana
Queda terminantemente prohibido publicar o marcar como `activo` en el selector de idiomas cualquier idioma que no cuente con una **auditoría y validación humana cadena por cadena**. Aquellas lenguas que no alcancen el estándar de revisión humana nativa permanecerán en el registro como `status: 'pending'` y serán filtradas del selector de producción.

---

## 3. Matriz de Auditoría de las 4 Pantallas Auditadas

| Pantalla Auditada | Estado Previo (Foto Dueño) | Estado Reparado (Oleada 6.2) | Criterio de Verificación Visual |
| :--- | :--- | :--- | :--- |
| **1. Dashboard (PT)** | Español en banner staff, mes en ES ("OCTUBRE"), mezclas ("Upcoming Sessões", "No hay sessões") | 100% Portugués nativo: "JUNTE-SE A UMA EQUIPE COMO STAFF", "OUTUBRO DE 2026", "Próximas Sessões", "Não há sessões próximas." | Dueño verifica visualmente banner, fecha, métricas y estado vacío en PT. |
| **2. Admin / Paramètres (FR)** | Header "ADMINISTRACIÓN", menú "Execrcices", bloques XP, Preferencias, APK e IA en español. | 100% Francés nativo: "ADMINISTRATION", "Exercices", "Saison et Tableau d'XP Différencié", "TÉLÉCHARGER L'APK", "Configuration de l'IA (Groq)". | Dueño verifica títulos, botones, inputs y menú lateral en FR sin español ni erratas. |
| **3. Admin / Configurações (PT)** | Bloques de XP, Preferencias, APK e IA en español / portuñol. | 100% Portugués nativo: "Temporada e Tabela de XP Diferenciada", "Preferências", "BAIXAR APK", "Configuração de IA (Groq)". | Dueño verifica configuración completa y descripciones en PT. |
| **4. Modal Asignar Plan** | Faltaban badges de edad mínima, supervisión y materiales; permitía prescribir a menores sin control. | Expone badges `👶 Mín. X años`, `👁️ Supervisión presencial`, `🏋️ Material preferido`, `🏡 Alternativa casera` y aplica **bloqueo duro** (`⛔ No apto`) según `assertAgeSafe`. | Dueño verifica que ejercicios no aptos por edad aparecen bloqueados y no seleccionables. |

---

## 4. Gobernanza Visual y Paleta Tierra y Campo (Cero Azul)

1. **Botón DESCARGAR APK:**
   - El inline style anterior `linear-gradient(135deg, #4CAF7D, #2196F3)` contenía azul de Material Design (`#2196F3`).
   - Se migró al degradado canónico Tierra y Campo `linear-gradient(135deg, #4CAF7D, #1B3A2D)`, con bordes y fondos en `rgba(76,175,125,...)`.
2. **Botón Blindar Identidades:**
   - El botón de blindaje de identidades en `AdminPanel.jsx` contenía `border: 1.5px solid #3B82F6` y fondo azul eléctrico.
   - Se migró a verde canónico `#4CAF7D` y fondo `rgba(76, 175, 125, 0.12)`.
3. **Ampliación del Linter de Paleta (`scripts/check-chart-palette.mjs`):**
   - Incorpora `src/pages/AdminPanel.jsx` al escaneo regular de CI.
   - Añade `#2196F3` y variantes a la lista de patrones prohibidos.
   - Incorpora test de regresión activo: simula la inyección de `#3B82F6` en el botón APK y comprueba que el linter falla de manera garantizada.

---

## 5. Canonización de Marca

- Se creó `src/utils/brand.js` como **única fuente de verdad**:
  - `BRAND_NAME = 'Mister11'` (texto regular en oraciones).
  - `BRAND_NAME_UPPER = 'MISTER11'` (logos, cabeceras y mayúsculas).
  - `BRAND_DOMAIN = 'mister11.app'` (dominio web).
- Prohibición estricta de `Mister 11` con espacio y de tildes en nombres de sistema (`Míster11`).
- Aplicado en diccionarios, cabeceras de reportes, componentes y generadores.

---

## 6. Saneamiento del Cuerpo de Reportes PDF

- Se implementó en `src/utils/pdfTheme.js` (`cleanPdfText`) la corrección y transliteración de kerning roto:
  - `Obj etivo` / `Obj etivos` ➔ `Objetivo` / `Objetivos`
  - `Mej orar` / `Mej ora` / `M ejorar` ➔ `Mejorar` / `Mejora`
- Se aplicó `cleanPdfText` a `session.objectives`, descripciones de bloques y nombres de ejercicios en `src/utils/pdfGenerator.js`.
- La suite `scripts/assert-pdf-quality.mjs` valida 15/15 pruebas, incluyendo la ausencia de huecos en el cuerpo generado.

---

## 7. Nuevo Instrumento de CI: Detector de Cadena Multi-Lengua (P1)

El script `scripts/detect-string-cross-leakage.mjs` fue integrado en `scripts/ci-i18n-gate.mjs` (ahora 7 gates de CI):
1. **Igualdad cruzada con cualquier lengua activa (PT === ES, FR === ES):** Detecta posibles copias sin traducir y genera inventario para inspección.
2. **Tokens cruzados imposibles:** Busca stopwords y caracteres españoles en PT, FR y EN (` y `, `de la`, `sesión`, `configuración`, `ñ`, `¿`, `¡`).
3. **Mezclas lingüísticas:** Bloquea de forma crítica en CI construcciones híbridas como `Upcoming Sessões`, `ENREGISTRER Configuración`, `No hay sessões`.

---

## 8. Verificación de Suites de CI

- `node scripts/ci-i18n-gate.mjs` ➔ **APROBADO (7/7 gates)**
- `node scripts/check-chart-palette.mjs` ➔ **APROBADO (0 violaciones + test inyección azul verde)**
- `node scripts/ci-exercise-catalog.mjs` ➔ **APROBADO (G1 a G9 clínicos certificados)**
- `node scripts/assert-pdf-quality.mjs` ➔ **APROBADO (15/15 tests)**
- `npm run build` ➔ **APROBADO (0 errores Vite/Rolldown)**
- **Reloj Google Build 95 (v1.1.77):** **INTACTO** (cero archivos modificados en Android/AAB/APK/Play).
