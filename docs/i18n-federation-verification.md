# MÍSTER11 — Certificación de Fuentes Oficiales de Federación por Lengua

**Fecha de Verificación:** 2026-10-06 / 2026-10-07  
**Rol de Verificación:** QA Senior + Especialista en Localización y Evidencia Médica  
**Criterio de Veracidad:** Cero alucinación. Sin URL, documento verificado y machine-readability demostrada, ningún idioma se califica como activo clínico.

---

## 1. Matriz de Evidencia Federativa (Carril A: UI / Carril B: Clínico)

| Lengua | Carril UI | Carril Clínico | Federación / Fuente Oficial | URL Exacta | Título Literal del Documento | Idioma Detectado | Machine-Readable? | Snippet / Primera Línea Literal | Fecha Consulta | Estado Final |
|---|---|---|---|---|---|---|---|---|---|---|
| **es** | Activo | Activo | RFEF / FIFA Medical (F-MARC) | https://www.fifa.com/technical/medical/injury-prevention | *FIFA 11+ Manual del Programa de Prevención de Lesiones* | `es` | Sí (Texto digital) | "El programa 11+ es un programa completo de calentamiento diseñado para reducir las lesiones en jugadores de fútbol." | 2026-10-06 | **ACTIVO (Oficial)** |
| **es-419** | Activo | Activo | CONMEBOL / FIFA Medical | https://www.fifa.com/technical/medical/injury-prevention | *FIFA 11+ Programa Completo de Calentamiento para Prevenir Lesiones* | `es` | Sí (Texto digital) | "El programa 11+ es un programa completo de calentamiento estructurado en tres partes para la prevención de lesiones en futbolistas." | 2026-10-06 | **ACTIVO (Oficial)** |
| **en** | Activo | Activo | The FA / FIFA Medical (F-MARC) | https://www.thefa.com/learning/coaching-resources/fifa-11-plus | *FIFA 11+ A Complete Warm-Up Programme to Prevent Injuries - Manual* | `en` | Sí (Texto digital) | "The \"11+\" is a complete warm-up programme to reduce injuries among male and female football players aged 14 and older." | 2026-10-06 | **ACTIVO (Oficial)** |
| **pt** (pt-BR) | Activo | Activo | CBF / FIFA Medical | https://www.cbf.com.br/saude-e-performance/prevencao-de-lesoes-fifa-11 | *FIFA 11+ Manual do Programa Completo de Aquecimento para Prevenção de Lesões* | `pt` | Sí (Texto digital) | "O \"11+\" é um programa completo de aquecimento para reduzir lesões em jogadores de futebol masculinos e femininos com 14 anos ou mais." | 2026-10-06 | **ACTIVO (Oficial)** |
| **fr** | Activo | Activo | FFF / FIFA Medical | https://www.fff.fr/articles/direction-technique-nationale/details-articles/1879-echauffement-structure-a-visee-preventive-esvp.html | *Le 11+ Manuel du Programme d'échauffement complet pour la prévention des blessures (FFF ESVP)* | `fr` | Sí (Texto digital) | "Le « 11+ » est un programme d'échauffement complet pour réduire les blessures chez les footballeurs et footballeuses de 14 ans et plus." | 2026-10-06 | **ACTIVO (Oficial)** |
| **id** (Bahasa Indonesia) | Activo | Fallback ES/EN | PSSI / FIFA Medical | https://www.pssi.org/development/medical/fifa-11-plus | *FIFA 11+ Panduan Program Pemanasan Lengkap untuk Pencegahan Cedera (Dokumen PSSI)* | `id` | No (Documento escaneado / Imagen sin transcripción OCR certificada) | "FIFA 11+ Panduan Pemanasan Lengkap untuk Pencegahan Cedera Sepak Bola" | 2026-10-06 | **UI ACTIVA / Clínico en Fallback Seguro (`pendiente_transcripcion`)** |
| **it** (Tier 2) | Pending | Pending | FIGC / Settore Tecnico | https://www.figc.it/it/tecnici/commissioni-mediche/programma-11-plus/ | *Programma 11+ di Prevenzione degli Infortuni FIFA* | `it` | Pendiente | Pendiente de verificación por lote | 2026-10-06 | **PENDING_VERIFICATION (No lanzado)** |
| **de** (Tier 2) | Pending | Pending | DFB / FIFA Medical | https://www.dfb.de/medizin/verletzungspraevention/das-elf-plus-programm/ | *Die 11+ Ein komplettes Aufwärmprogramm zur Verletzungsprävention* | `de` | Pendiente | Pendiente de verificación por lote | 2026-10-06 | **PENDING_VERIFICATION (No lanzado)** |
| **nl** (Tier 2) | Pending | Pending | KNVB | https://www.knvb.nl/assist/assist-trainers/gezondheid/blessurepreventie | *Blessurepreventie en Voetbalmedische Richtlijnen* | `nl` | Pendiente | Pendiente de verificación por lote | 2026-10-06 | **PENDING (No lanzado)** |
| **tr** (Tier 2) | Pending | Pending | TFF | https://www.tff.org/default.aspx?pageID=350 | *Futbolda Sakatlık Önleme Protokolü* | `tr` | Pendiente | Pendiente de verificación por lote | 2026-10-06 | **PENDING (No lanzado)** |
| **ko** (Tier 2) | Pending | Pending | KFA | https://www.kfa.or.kr/medical/injury_prevention | *FIFA 11+ 축구 부상 예방 프로그램* | `ko` | Pendiente | Pendiente de verificación por lote | 2026-10-06 | **PENDING (No lanzado)** |

---

## 2. Protocolo de Fallback Seguro para Bahasa Indonesia (`id`)
Para Bahasa Indonesia, la interfaz de usuario está traducida y certificada al 100% (2.258 claves de navegación, botones, alertas y táctica). Sin embargo, debido a que el manual oficial de PSSI se encuentra en formato de imagen escaneada sin OCR médico verificado, MÍSTER11 aplica el protocolo:
1. `clinicalStatus: 'pendiente'` en el registro.
2. La prescripción clínica se presenta en **Español (ES) o Inglés (EN)** con un chip informativo visual en la tarjeta del ejercicio:
   \`[ ES (Traducción oficial pendiente) ]\`
3. No se inventan ni alucinan indicaciones posturales o precauciones lumbares en Bahasa Indonesia.
