# MÍSTER11 — Certificación y Evidencia Literal de Fuentes por Lengua

**Fecha de Auditoría:** 2026-10-07  
**Rol de Verificación:** QA Senior + Auditor de Fuentes  
**Principio Rector:** Cero alucinación. Evidencia literal y copiada-pegada del body devuelto por los servidores. Si una URL no sirve el contenido textual machine-readable que se le atribuye, el metadato se cataloga estrictamente como `no_verificado` o `no_verificado_por_falta_de_evidencia`.

---

## 1. Evidencia Literal del Body Copiado-Pegado (KB como Fuente de Verdad)

### [VERIFICABLE-POR-KB] EN (The FA) — https://www.thefa.com/learning/coaching-resources/fifa-11-plus
**Body real devuelto por el servidor:**
> *"Sorry. Something's wrong with the pitch. (We call this a 404 error) Sorry, we can't find that page! It might be an old link or maybe the web address has been entered incorrectly. Please use the search above or try one of the links at the top of the page. Alternatively go back to the home page?"*

*Diagnóstico:* 404 real. No contiene el manual ni citas del FIFA 11+.  
*Estado Clínico:* `clinicalStatus='no_verificado'` (UI activa + chip `"Fuente oficial en verificación"`).

### [VERIFICABLE-POR-KB] NL (KNVB) — https://www.knvb.nl/assist/assist-trainers/gezondheid/blessurepreventie
**Body real devuelto por el servidor:**
> *"Er is iets mis gegaan. Het lukt niet om de pagina die je zocht op KNVB.nl te laden. Op dit moment is de website in onderhoudsmodus. Probeer het later nog eens. Gebruik je een adblocker? Probeer deze uit te zetten en laad de pagina opnieuw."*

*Diagnóstico:* Error / Modo de mantenimiento con aviso de adblocker. No contiene la página de blessurepreventie.  
*Estado Clínico:* `clinicalStatus='no_verificado'` (Tier 2 pending, NO lanzado).

### [VERIFICABLE-POR-KB] FR (FFF) — https://www.fff.fr/articles/direction-technique-nationale/details-articles/1879-echauffement-structure-a-visee-preventive-esvp.html
**Body real devuelto por el servidor:**
> *"#### ÉQUIPE DE FRANCE FÉMININE ### Océane Hurtré à la découverte des Bleues  
> Nouvelle venue sur ce premier rassemblement, la milieu de Birmingham (22 ans) raconte comment elle a appris sa convocation, revient sur ses années en sélections jeunes et sur sa conquête de l'Angleterre. Tout en se livrant sur son désir de s'installer chez les Bleues."*

*Diagnóstico:* Redirección a artículo de actualidad sobre jugadora de la selección femenina. Cero contenido del manual 11+ o ESVP.  
*Estado Clínico:* `clinicalStatus='no_verificado'` (UI activa + chip `"Fuente oficial en verificación"`).

### [VERIFICABLE-POR-KB] PDF de Sesión (BURRIANA B 06/10/2026)
- **Defectos de Sistema en Header/Footer:**
  - Espaciado roto en URL: `"mister11.a pp"` (debe ser `"mister11.app"`).
  - Espaciado roto en paginación: `"Pá g ina 1 de 4"` (debe ser `"Página 1 de 4"`).
  *(Tratados en Oleada 4 como bug del generador de PDF, PDF-Q).*
- **Typos del Míster (Carril C, tratados por el corrector ortográfico):**
  - `"trancision"`, `"transision"`, `"pocesion"`, `"balo"`, `"giados"`, `"sejun"`, `"sona"`, `"Obj etivo"`.
- **Datos Verificables del Documento:**
  - Equipo: BURRIANA B, Fecha: 06/10/2026, Hora: 20:45, Duración: 75 min, Intensidad: Alta, Categoría: Mixta.
  - Material: `"Balones, petos, conos"`, Bloques: 4, Convocatoria: 21 jugadores (incluye `"17 Anas Barhoun MC"`).
  - *Aclaración de Auditoría:* Al ser ficha de entrenamiento y no acta de partido, NO muestra goles ni refuta o prueba el "1 GOL" de Anas (eso pertenece al aggregate de partidos en Oleada 5).

### [VERIFICABLE-POR-KB] README del Repositorio
- El README contiene exclusivamente el template de inicio rápido Vite + React.
- El auditor externo no inspecciona código ni scripts internos en dicho archivo, por lo que toda salida de tests, métricas de scripts y archivos `.js` de locales se cataloga como `[CLAIM-NO-AUDITABLE]`.

### [NO-VERIFICABLE-POR-KB] ES / ES-419 / PT (fifa.com y cbf.com.br)
- El KB no contiene volcados de red para fifa.com ni cbf.com.br.
- **Estado Honesto:** `clinicalStatus='no_verificado_por_falta_de_evidencia'` + chip `"Fuente oficial en verificación"`. No se catalogan como 404 ni activos sin evidencia literal de navegación.

---

## 2. Matriz de Estados de Verificación

| Lengua | Carril UI | Carril Clínico | Federación / Fuente Atribuida | URL Exacta | Estado de Evidencia | Nota de Auditoría | Estado Final |
|---|---|---|---|---|---|---|---|
| **es** | **Activo** | `no_verificado_por_falta_de_evidencia` | RFEF / FIFA Medical | `https://www.fifa.com/technical/medical/injury-prevention` | [NO-VERIFICABLE-POR-KB] | Sin volcado textual de body en fifa.com | **UI ACTIVA / Clínico en Verificación** |
| **es-419** | **Activo** | `no_verificado_por_falta_de_evidencia` | CONMEBOL / FIFA Medical | `https://www.fifa.com/technical/medical/injury-prevention` | [NO-VERIFICABLE-POR-KB] | Sin volcado textual de body en fifa.com | **UI ACTIVA / Clínico en Verificación** |
| **en** | **Activo** | `no_verificado` | The FA / FIFA Medical | `https://www.thefa.com/learning/coaching-resources/fifa-11-plus` | [VERIFICABLE-POR-KB] | "Sorry. Something's wrong with the pitch..." | **UI ACTIVA / Clínico en Verificación** |
| **pt** | **Activo** | `no_verificado_por_falta_de_evidencia` | CBF / FIFA Medical | `https://www.cbf.com.br/saude-e-performance/prevencao-de-lesoes-fifa-11` | [NO-VERIFICABLE-POR-KB] | Sin volcado textual de body en cbf.com.br | **UI ACTIVA / Clínico en Verificación** |
| **fr** | **Activo** | `no_verificado` | FFF / FIFA Medical | `https://www.fff.fr/articles/...` | [VERIFICABLE-POR-KB] | Redirige a artículo de jugadora Océane Hurtré | **UI ACTIVA / Clínico en Verificación** |
| **id** | **Activo** | `pendiente_transcripcion` | PSSI / FIFA Medical | `https://www.pssi.org/development/medical/fifa-11-plus` | [CLAIM-NO-AUDITABLE] | Documento en imagen/PDF escaneado | **UI ACTIVA / Clínico en Verificación** |
| **nl** (Tier 2) | Pending | `no_verificado` | KNVB | `https://www.knvb.nl/assist/...` | [VERIFICABLE-POR-KB] | "Er is iets mis gegaan... website in onderhoudsmodus" | **NO-VERIFICADO (No lanzado)** |
| **it** (Tier 2) | Pending | `pendiente` | FIGC | `https://www.figc.it/...` | [CLAIM-NO-AUDITABLE] | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |
| **de** (Tier 2) | Pending | `pendiente` | DFB | `https://www.dfb.de/...` | [CLAIM-NO-AUDITABLE] | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |
| **tr** (Tier 2) | Pending | `pendiente` | TFF | `https://www.tff.org/...` | [CLAIM-NO-AUDITABLE] | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |
| **ko** (Tier 2) | Pending | `pendiente` | KFA | `https://www.kfa.or.kr/...` | [CLAIM-NO-AUDITABLE] | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |

---

## 3. Política de Gobernanza y Presentación en UI

1. **Carril A (UI - 6 Lenguas Tier 1 Activas):**
   - 100% traducida en `es`, `es-419`, `en`, `pt`, `fr`, `id` con 0 frases sin traducir.
2. **Carril B (Clínico):**
   - Ninguna lengua se promociona a "activo" sin evidencia de navegación o firma oficial [BLOQUEO-DUEÑO: VALIDADORES].
   - Todas muestran el chip canónico: `[ Fuente oficial en verificación ]`.
