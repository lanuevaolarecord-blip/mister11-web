# MÍSTER11 — Certificación y Evidencia Literal de Fuentes por Lengua

**Fecha de Auditoría:** 2026-10-07  
**Rol de Verificación:** QA Senior + Auditor de Fuentes  
**Principio Rector:** Cero alucinación. Evidencia literal y copiada-pegada del body devuelto por los servidores. Si una URL no sirve el contenido textual machine-readable que se le atribuye, el metadato se cataloga estrictamente como `no_verificado` o `no_verificado_por_falta_de_evidencia`.

---

## 1. Evidencia Literal del Body Copiado-Pegado (D1)

### EN (The FA) — https://www.thefa.com/learning/coaching-resources/fifa-11-plus
**Body real devuelto por el servidor:**
> *"Sorry. Something's wrong with the pitch. (We call this a 404 error)  
> Sorry, we can't find that page! It might be an old link or maybe the web address has been entered incorrectly."*

*Diagnóstico:* 404 real. No contiene el manual ni citas del FIFA 11+.

### NL (KNVB) — https://www.knvb.nl/assist/assist-trainers/gezondheid/blessurepreventie
**Body real devuelto por el servidor:**
> *"Er is iets mis gegaan. We zijn op de hoogte en werken aan een oplossing. Excuses voor het ongemak! De website is momenteel in onderhoudsmodus."*

*Diagnóstico:* Error / Modo de mantenimiento. No contiene la página de blessurepreventie.

### FR (FFF) — https://www.fff.fr/.../1879-echauffement-structure-a-visee-preventive-esvp.html
**Body real devuelto por el servidor:**
> Redirección a artículo sobre futbolista femenina Océane Hurtré (Équipe de France Féminine, Birmingham, 22 ans). Cero contenido del manual ESVP o 11+.

---

## 2. Matriz de Estados de Verificación (D1 y D2)

| Lengua | Carril UI | Carril Clínico | Federación / Fuente Atribuida | URL Exacta | Estado de Evidencia | Nota de Auditoría | Estado Final |
|---|---|---|---|---|---|---|---|
| **es** | **Activo** | `no_verificado_por_falta_de_evidencia` | RFEF / FIFA Medical | `https://www.fifa.com/technical/medical/injury-prevention` | Sin body capturado de navegación | No verificado por falta de evidencia de navegación con volcado textual de body en fifa.com | **UI ACTIVA / Clínico en Verificación** |
| **es-419** | **Activo** | `no_verificado_por_falta_de_evidencia` | CONMEBOL / FIFA Medical | `https://www.fifa.com/technical/medical/injury-prevention` | Sin body capturado de navegación | No verificado por falta de evidencia de navegación con volcado textual de body en fifa.com | **UI ACTIVA / Clínico en Verificación** |
| **en** | **Activo** | `no_verificado` | The FA / FIFA Medical | `https://www.thefa.com/learning/coaching-resources/fifa-11-plus` | Body copiado-pegado literal (404) | "Sorry. Something's wrong with the pitch..." | **UI ACTIVA / Clínico en Verificación** |
| **pt** | **Activo** | `no_verificado_por_falta_de_evidencia` | CBF / FIFA Medical | `https://www.cbf.com.br/saude-e-performance/prevencao-de-lesoes-fifa-11` | Sin body capturado de navegación | No verificado por falta de evidencia de navegación con volcado textual de body en cbf.com.br | **UI ACTIVA / Clínico en Verificación** |
| **fr** | **Activo** | `no_verificado` | FFF / FIFA Medical | `https://www.fff.fr/articles/...` | Body copiado-pegado literal (artículo jugadora) | Redirige a artículo de jugadora Océane Hurtré | **UI ACTIVA / Clínico en Verificación** |
| **id** | **Activo** | `pendiente_transcripcion` | PSSI / FIFA Medical | `https://www.pssi.org/development/medical/fifa-11-plus` | Documento en imagen/PDF escaneado | Sin OCR médico certificado | **UI ACTIVA / Clínico en Verificación** |
| **nl** (Tier 2) | Pending | `no_verificado` | KNVB | `https://www.knvb.nl/assist/...` | Body copiado-pegado literal (mantenimiento) | "Er is iets mis gegaan... website in onderhoudsmodus" | **NO-VERIFICADO (No lanzado)** |
| **it** (Tier 2) | Pending | `pendiente` | FIGC | `https://www.figc.it/...` | Pendiente de consulta | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |
| **de** (Tier 2) | Pending | `pendiente` | DFB | `https://www.dfb.de/...` | Pendiente de consulta | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |
| **tr** (Tier 2) | Pending | `pendiente` | TFF | `https://www.tff.org/...` | Pendiente de consulta | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |
| **ko** (Tier 2) | Pending | `pendiente` | KFA | `https://www.kfa.or.kr/...` | Pendiente de consulta | Pendiente de lote Tier 2 | **PENDIENTE (No lanzado)** |

---

## 3. Política de Presentación en UI de Míster11

1. **Carril A (UI - Navegación, Pizarra, Táctica, Estadísticas, Notificaciones, Formularios):**
   - 100% de la UI traducida en las 6 lenguas Tier 1 (`es`, `es-419`, `en`, `pt`, `fr`, `id`), con 0 frases largas en inglés huérfanas en los catálogos de `pt`, `fr` e `id`.
2. **Carril B (Clínico):**
   - Todas las lenguas muestran de forma honesta el chip de advertencia médica:
     `[ Fuente oficial en verificación ]` (o su equivalente localizado en cada idioma).
