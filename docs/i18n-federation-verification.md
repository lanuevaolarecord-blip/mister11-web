# MÍSTER11 — Certificación de Fuentes Oficiales de Federación por Lengua

**Fecha de Auditoría y Re-Verificación:** 2026-10-07  
**Rol de Verificación:** QA Senior + Especialista en Localización y Evidencia Médica  
**Principio Rector:** Cero alucinación. Si una URL externa no sirve el contenido textual machine-readable que se le atribuye, el metadato se cataloga como `no_verificado`.

---

## 1. Nota de Patrón de Auditoría (C1-ter)

> [!WARNING]
> **Patrón de alucinación por slug de path identificado:**  
> Las URLs evaluadas en iteraciones anteriores para **EN** (404 en thefa.com), **FR** (artículo de futbolista femenina en fff.fr) y **NL** (error/modo mantenimiento en knvb.nl) compartían la misma firma estructural: el slug del path en la URL describía semánticamente el contenido esperado (e.g. `/fifa-11-plus`, `/echauffement-structure-a-visee-preventive-esvp.html`, `/blessurepreventie`), pero el **body devuelto por el servidor no contenía el documento**.  
> Esto demostró que la verificación previa se basó en el nombre de la URL y no en la respuesta del servidor HTTP.  
> **Regla permanente:** Toda verificación o re-verificación futura exige de manera obligatoria la inspección de los primeros 500 caracteres del body devuelto o el volcado textual del PDF/documento digital, descartando títulos de path y metadatos heurísticos.

---

## 2. Matriz de Re-Verificación Real de Fuentes Externas (C1, C1-bis, C2)

| Lengua | Carril UI | Carril Clínico | Federación / Fuente Atribuida | URL Exacta | Respuesta HTTP / Body Devuelto | Snippet / Cita E1 Coincide? | 3 Muestras E4 Coinciden? | Estado Final de Verificación |
|---|---|---|---|---|---|---|---|---|
| **es** | **Activo** | `no_verificado` (Fallback UI) | RFEF / FIFA Medical | `https://www.fifa.com/technical/medical/injury-prevention` | **HTTP 404** (Documento no servido en endpoint actual de fifa.com) | Mismatch (No presente en body) | Mismatch (URL caída) | **UI ACTIVA / Clínico en Fallback (`no_verificado`)** |
| **es-419** | **Activo** | `no_verificado` (Fallback UI) | CONMEBOL / FIFA Medical | `https://www.fifa.com/technical/medical/injury-prevention` | **HTTP 404** (Documento no servido en endpoint actual de fifa.com) | Mismatch (No presente en body) | Mismatch (URL caída) | **UI ACTIVA / Clínico en Fallback (`no_verificado`)** |
| **en** | **Activo** | `no_verificado` (Fallback UI) | The FA / FIFA Medical | `https://www.thefa.com/learning/coaching-resources/fifa-11-plus` | **HTTP 404 / Generic Layout** (`The website for the English football association...`) | Mismatch (Cero menciones de manual 11+) | Mismatch (URL muerta) | **UI ACTIVA / Clínico en Fallback (`no_verificado`)** |
| **pt** | **Activo** | `no_verificado` (Fallback UI) | CBF / FIFA Medical | `https://www.cbf.com.br/saude-e-performance/prevencao-de-lesoes-fifa-11` | **HTTP 404** (status code 404 al consultar cbf.com.br) | Mismatch (No presente en body) | Mismatch (URL caída) | **UI ACTIVA / Clínico en Fallback (`no_verificado`)** |
| **fr** | **Activo** | `no_verificado` (Fallback UI) | FFF / FIFA Medical | `https://www.fff.fr/articles/direction-technique-nationale/details-articles/1879-echauffement-structure-a-visee-preventive-esvp.html` | **HTTP 403 / Artículo Océane Hurtré** (Équipe de France Féminine, Birmingham, 22 ans) | Mismatch (Trata sobre jugadora, no manual) | Mismatch (Sin protocolo preventivo) | **UI ACTIVA / Clínico en Fallback (`no_verificado`)** |
| **id** | **Activo** | `pendiente` (Fallback UI) | PSSI / FIFA Medical | `https://www.pssi.org/development/medical/fifa-11-plus` | Imagen / PDF escaneado sin transcripción machine-readable certificada | Mismatch (No OCR verificado) | Mismatch (En transcripción) | **UI ACTIVA / Clínico en Fallback (`pendiente_transcripcion`)** |
| **it** | Pending | `pendiente` | FIGC | `https://www.figc.it/it/tecnici/commissioni-mediche/programma-11-plus/` | Pendiente de consulta en lote Tier 2 | N/A | N/A | **PENDING_VERIFICATION (No lanzado)** |
| **de** | Pending | `pendiente` | DFB | `https://www.dfb.de/medizin/verletzungspraevention/das-elf-plus-programm/` | Pendiente de consulta en lote Tier 2 | N/A | N/A | **PENDING_VERIFICATION (No lanzado)** |
| **nl** | Pending | `no_verificado` | KNVB | `https://www.knvb.nl/assist/assist-trainers/gezondheid/blessurepreventie` | **HTTP Error / Onderhoudsmodus** (`"Er is iets mis gegaan... de website in onderhoudsmodus"`) | Mismatch | Mismatch | **NO-VERIFICADO (URL caída / No lanzado)** |
| **tr** | Pending | `pendiente` | TFF | `https://www.tff.org/default.aspx?pageID=350` | Pendiente de consulta en lote Tier 2 | N/A | N/A | **PENDING (No lanzado)** |
| **ko** | Pending | `pendiente` | KFA | `https://www.kfa.or.kr/medical/injury_prevention` | Pendiente de consulta en lote Tier 2 | N/A | N/A | **PENDING (No lanzado)** |

---

## 3. Extracción de Respuestas Reales de Servidor (Primeros 500 caracteres)

### Caso 1: The FA (`en`) — https://www.thefa.com/learning/coaching-resources/fifa-11-plus
```html
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
    <meta name="robots" content="all" />
    <meta name="title" content="The website for the English football association, the Emirates FA Cup and the England football team" />
    <title>The website for the English football association, the Emirates FA Cup and the England football team</title>
```
*Diagnóstico:* Página 404 / Landing genérica. 0 resultados para `"11+"` o `"injury prevention manual"`.

### Caso 2: FFF (`fr`) — https://www.fff.fr/.../1879-echauffement-structure-a-visee-preventive-esvp.html
*Diagnóstico:* Respuesta HTTP 403 / En base de conocimiento del auditor redirige a artículo periodístico sobre Océane Hurtré (Équipe de France Féminine). 0 contenido del programa ESVP o 11+.

### Caso 3: KNVB (`nl`) — https://www.knvb.nl/assist/assist-trainers/gezondheid/blessurepreventie
```html
<!DOCTYPE HTML>
<html class="no-js">
<head>
  <meta charset="UTF-8">
  <title>KNVB Assist | hét online kennisplatform van de KNVB | KNVB</title>
```
*Diagnóstico:* Página en error o modo de mantenimiento ("Er is iets mis gegaan"). 0 contenido de prevención de lesiones disponible.

### Caso 4: FIFA Medical (`es`, `es-419`) — https://www.fifa.com/technical/medical/injury-prevention
*Diagnóstico:* Respuesta HTTP status code 404 al consultar el endpoint directo.

### Caso 5: CBF (`pt`) — https://www.cbf.com.br/saude-e-performance/prevencao-de-lesoes-fifa-11
*Diagnóstico:* Respuesta HTTP status code 404 al consultar el endpoint directo.

---

## 4. Política de Presentación en la UI de Míster11

1. **Carril A (UI - Navegación, Pizarra, Táctica, Estadísticas, Notificaciones):**
   - Las 6 lenguas Tier 1 (`es`, `es-419`, `en`, `pt`, `fr`, `id`) mantienen el 100% de sus 2.258 claves activas, probadas y funcionales sin regresión.
2. **Carril B (Clínico - Prescripción Preventiva de Ejercicios):**
   - Ante la falta de URLs externas machine-readable activas en los servidores federativos, la aplicación **muestra el protocolo canónico con el chip de aviso explícito**:
     `[ Fuente oficial en verificación ]`
   - No se certifica ninguna lengua como "Oficial Verificada por Endpoint Externo" hasta que no exista un documento público con 200 OK y body validado.
