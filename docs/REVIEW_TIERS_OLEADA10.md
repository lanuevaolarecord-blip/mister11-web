# Clasificación de Revisión Humana por Niveles (A / B / C) — Oleada 10 (118 Ejercicios)

> [!IMPORTANT]
> **Modo Read-Only sobre Producto**:
> Este documento y su generador (`scripts/classify-exercise-review-tier.mjs`) leen directamente `src/data/systemCoreExercises.js` (10), `src/data/homeExercisesCatalog.js` (108) y `src/data/exerciseSafetyMap.js` (118) sin modificar ningún archivo de `src/` ni auto-firmar `reviewed_by_human` o `rigVerifiedBy`.

---

## 1. Resumen Ejecutivo y Conteo por Nivel

| Nivel de Revisión | Criterio de Activación | Conteo | % del Catálogo (118) | Acción Requerida |
| :--- | :--- | :---: | :---: | :--- |
| **Nivel C (Revisión Profunda)** | `tier_riesgo === 'alto'`, `tier_riesgo === 'PENDIENTE-FISIO'`, o ejercicio con **salto / caída / aterrizaje pliométrico** o compromiso **cervical / cuello** | **25** | **21.2%** | Revisión biomecánica y clínica detallada (fisio + dueño) antes de promoción |
| **Nivel B (Vistazo Dueño)** | No es Nivel C y activa al menos una bandera biomecánica: **apoyo unipodal**, **rotación**, **cuadrupedia/postura no vertical**, **material que toca cuerpo**, **asimetría entre lados** o **ángulo articular extremo** | **89** | **75.4%** | Vistazo visual rápido del dueño sobre la lámina híbrida (contactos, orientación y lateralidad) |
| **Nivel A (Auto-Validación por Gate)** | El resto del catálogo (bipedestación simétrica sin material de contacto complejo ni banderas B/C), sujeto a las **4 banderas rojas automáticas** de `test-hybrid-media-integrity.mjs` | **4** | **3.4%** | Validación automática por script de integridad píxel-exacta |
| **TOTAL CATÁLOGO** | `10 sys-*` + `108 hex-*` | **118** | **100.0%** | Cobertura 118/118 verificada |

---

## 2. Las 4 Banderas Rojas Automáticas en `scripts/test-hybrid-media-integrity.mjs`

Todo activo híbrido (tanto Nivel A como Niveles B y C) pasa obligatoriamente por las **4 banderas rojas automáticas** implementadas en `scripts/test-hybrid-media-integrity.mjs`:

1. `RED_FLAG_1_ZERO_GREEN_GLOW_PIXELS`: Falla si la máscara `<id>-glow.webp` tiene `0` píxeles verdes bioluminiscentes activos (`g > 135 && g - r > 30 && a > 25`).
2. `RED_FLAG_2_SILHOUETTE_CUT_AT_BORDER`: Falla si la silueta anatómica en `<id>-card.webp` aparece mutilada o cortada contra los bordes superior, izquierdo o derecho del lienzo.
3. `RED_FLAG_3_GLOW_OUTSIDE_BODY`: Falla si los píxeles iluminados de `<id>-glow.webp` caen fuera de la envolvente anatómica del cuerpo/vectores de `<id>-card.webp`.
4. `RED_FLAG_4_INCONSISTENT_ASPECT_RATIO`: Falla si existe discrepancia de proporción (`width / height`) entre `<id>-card.webp`, `<id>-full.webp`, `<id>-glow.webp`, `<id>-microloop.webp` y el `viewBox` de `<id>-overlay.svg`.

---

## 3. Lista Completa — Nivel C (Revisión Profunda: 25 ejercicios)

*Criterio: `C_TIER_ALTO`, `C_PENDIENTE_FISIO`, `C_SALTO_O_CAIDA`, `C_CERVICAL`.*

| ID | Nombre del Ejercicio | `tier_riesgo` | Banderas que Subieron el Ejercicio a Nivel C |
| :--- | :--- | :---: | :--- |
| `sys-4` | **Nordic Hamstring** | `alto` | C_TIER_ALTO |
| `sys-5` | **Ejercicio de Copenhague** | `alto` | C_TIER_ALTO |
| `hex-012` | **Skipping Alto Técnico (A-Skip)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-014` | **Jumping Jacks Rítmicos** | `bajo` | C_SALTO_O_CAIDA |
| `hex-020` | **Saltitos de Tobillo Reactivos (Pogo Jumps)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-022` | **FIFA 11+ Aceleración y Desaceleración Corta** | `PENDIENTE-FISIO` | C_PENDIENTE_FISIO |
| `hex-024` | **Pisas Alternas (Sole Taps)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-033` | **Ruleta de Marsella (Zidane Turn)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-048` | **Salto a la Cuerda con Pies Juntos (Rope Double Bounce)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-049` | **Salto a la Cuerda con Paso de Boxeador (Boxer Skip)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-050` | **Salto a la Cuerda a Pata Coja Alternada** | `bajo` | C_SALTO_O_CAIDA |
| `hex-056` | **Saltos en Cruz Multidireccionales a Pies Juntos** | `bajo` | C_SALTO_O_CAIDA |
| `hex-057` | **Saltos en Cruz a Pata Coja (Unipodal Cross Hops)** | `PENDIENTE-FISIO` | C_PENDIENTE_FISIO, C_SALTO_O_CAIDA |
| `hex-058` | **Paso de Patinador con Frenada (Skater Jumps & Stick)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-059` | **Patinador Continuo Reactivo (Speed Skaters)** | `bajo` | C_SALTO_O_CAIDA |
| `hex-064` | **Caída desde Salto y Clavado (Drop Jump Stick)** | `alto` | C_TIER_ALTO, C_SALTO_O_CAIDA |
| `hex-065` | **Salto Vertical con Caída a Una Pierna (Single-Leg Land)** | `alto` | C_TIER_ALTO, C_SALTO_O_CAIDA |
| `hex-076` | **Ejercicio de Aductores de Copenhague (Nivel Banco/Sofá)** | `alto` | C_TIER_ALTO |
| `hex-077` | **Copenhague Modificado en Suelo con Rodilla Apoyada** | `PENDIENTE-FISIO` | C_PENDIENTE_FISIO |
| `hex-078` | **Nordic Hamstring Curl Casero Asistido con Puerta o Sofá** | `alto` | C_TIER_ALTO |
| `hex-080` | **Sentadilla Búlgara con Peso Corporal (Bulgarian Split Squat)** | `alto` | C_TIER_ALTO |
| `hex-081` | **Peso Muerto Rumano a Una Pierna (Single-Leg RDL)** | `alto` | C_TIER_ALTO |
| `hex-082` | **Sentadilla Pistol Asistida a Silla (Box Pistol Squat)** | `alto` | C_TIER_ALTO |
| `hex-092` | **Sentadilla Profunda con Salto Vertical y Aterrizaje Blando** | `alto` | C_TIER_ALTO, C_SALTO_O_CAIDA |
| `hex-108` | **Isométrico Cervical Multidireccional de Portero** | `alto` | C_TIER_ALTO, C_CERVICAL |

---

## 4. Lista Completa — Nivel B (Vistazo Dueño: 89 ejercicios)

*Criterio: `B_APOYO_UNIPODAL`, `B_ROTACION`, `B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL`, `B_MATERIAL_TOCA_CUERPO`, `B_ASIMETRIA_ENTRE_LADOS`, `B_ANGULO_ARTICULAR_EXTREMO`.*

| ID | Nombre del Ejercicio | `tier_riesgo` | Banderas que Subieron el Ejercicio a Nivel B |
| :--- | :--- | :---: | :--- |
| `sys-1` | **Plancha Frontal** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `sys-2` | **Puente de Glúteos** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `sys-3` | **Movilidad de Tobillo** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_MATERIAL_TOCA_CUERPO(pared) |
| `sys-6` | **Sentadilla Búlgara** | `bajo` | B_APOYO_UNIPODAL, B_MATERIAL_TOCA_CUERPO(silla_estable), B_ASIMETRIA_ENTRE_LADOS |
| `sys-7` | **Peso Muerto a Una Pierna** | `bajo` | B_APOYO_UNIPODAL |
| `sys-8` | **Estiramiento Isquiosural** | `bajo` | B_MATERIAL_TOCA_CUERPO(toalla) |
| `sys-9` | **Plancha Lateral** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `sys-10` | **Rotación Torácica** | `bajo` | B_ROTACION, B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-001` | **Movilidad de Tobillo Dinámica** *(alias de `sys-3`)* | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_MATERIAL_TOCA_CUERPO(pared) |
| `hex-002` | **Balanceo de Pierna Frontal** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared) |
| `hex-003` | **Balanceo de Pierna Lateral** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared), B_ASIMETRIA_ENTRE_LADOS |
| `hex-004` | **Círculos Articulares de Cadera** | `bajo` | B_ROTACION, B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-005` | **Gato-Camello Dinámico** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-006` | **El Mejor Estiramiento del Mundo (World Greatest)** | `bajo` | B_ROTACION, B_ASIMETRIA_ENTRE_LADOS |
| `hex-007` | **Zancada Inversa con Rotación Torácica** | `bajo` | B_ROTACION, B_ASIMETRIA_ENTRE_LADOS |
| `hex-008` | **Zancada Lateral Dinámica (Cossack Parcial)** | `bajo` | B_ASIMETRIA_ENTRE_LADOS |
| `hex-009` | **Gusano (Inchworm) con Toque de Puntera** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-010` | **Carioca Dinámica en el Sitio** | `bajo` | B_ROTACION, B_ASIMETRIA_ENTRE_LADOS |
| `hex-015` | **Paso Ruso (Marcha con Patada Recta)** | `bajo` | B_ASIMETRIA_ENTRE_LADOS |
| `hex-016` | **Aperturas y Cierres de Valla Imaginaria** | `bajo` | B_ASIMETRIA_ENTRE_LADOS |
| `hex-017` | **Desplazamiento Lateral con Toco Suelo** | `bajo` | B_ASIMETRIA_ENTRE_LADOS |
| `hex-018` | **Molino de Viento Dinámico (Windmill)** | `bajo` | B_ROTACION |
| `hex-019` | **Sentadilla Profunda con Extensión Torácica** | `bajo` | B_ANGULO_ARTICULAR_EXTREMO |
| `hex-021` | **Activación de Glúteo en Puente Unipodal Dinámico** | `bajo` | B_APOYO_UNIPODAL, B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-023` | **Campanita (Toques Interior-Interior)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-025` | **Arrastre con Suela y Toque de Interior (V-Pull Inside)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-026` | **Arrastre con Suela y Salida de Exterior (V-Pull Outside)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon), B_ASIMETRIA_ENTRE_LADOS |
| `hex-027` | **Triángulo Técnico con Suela e Interior** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-028` | **La Croqueta de Iniesta en Espacio Reducido** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-029` | **Bicicleta Simple (Step Over Outward)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-030` | **Doble Bicicleta con Salida de Exterior** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-031` | **Bicicleta Inversa (Scissors Inward)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-032` | **El Recorte de Cruyff Clásico** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-034` | **Elástico de Ronaldinho en Corto** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-035` | **Pases Rasos de Precisión contra Pared (Pie Dominante)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared+balon) |
| `hex-036` | **Pases Rasos de Precisión contra Pared (Pie No Dominante)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared+balon) |
| `hex-037` | **Pared Alternada a Dos Toques (Control + Pase)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared+balon) |
| `hex-038` | **Pared al Primer Toque (One-Touch Alterno)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared+balon), B_ASIMETRIA_ENTRE_LADOS |
| `hex-039` | **Control Orientado con Exterior y Pase Cruzado** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared+balon), B_ASIMETRIA_ENTRE_LADOS |
| `hex-040` | **Control Aéreo Amortiguado con Empeine (Drop & Catch)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-041` | **Dominadas Básicas Alternas (Juggling Empeine)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon), B_ASIMETRIA_ENTRE_LADOS |
| `hex-042` | **Dominadas con Muslo y Empeine Combinadas** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-043` | **Circuito Slalom en Conos en Espacio Reducido** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-044` | **Slalom con Doble Suela (Roll-Over Cones)** | `bajo` | B_APOYO_UNIPODAL, B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-045` | **Pase aéreo picado contra pared y control de pecho** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared+balon) |
| `hex-046` | **Control Orientado con Giros de 90 Grados (Cuadrado)** | `bajo` | B_ROTACION, B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-047` | **Reto de Precisión al Cono (Target Striking)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pelota+balon) |
| `hex-051` | **Escalera de Agilidad: 1 Pie por Hueco Rápido** | `bajo` | B_APOYO_UNIPODAL |
| `hex-053` | **Escalera de Agilidad: Icky Shuffle (Dentro-Dentro-Fuera)** | `bajo` | B_ASIMETRIA_ENTRE_LADOS |
| `hex-054` | **Escalera de Agilidad: Pasos Ali (Ali Shuffle)** | `bajo` | B_APOYO_UNIPODAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-055` | **Cruces Dentro-Fuera en Línea Recta (In & Out)** | `bajo` | B_ASIMETRIA_ENTRE_LADOS |
| `hex-060` | **T-Test de Agilidad en Salón (3x3 Metros)** | `bajo` | B_ASIMETRIA_ENTRE_LADOS |
| `hex-061` | **Equilibrio Unipodal en Pata Coja con Ojos Cerrados** | `bajo` | B_APOYO_UNIPODAL |
| `hex-062` | **Equilibrio Unipodal sobre Cojín o Superficie Blanda** | `bajo` | B_APOYO_UNIPODAL, B_MATERIAL_TOCA_CUERPO(wobble_pad+cojin_o_toalla) |
| `hex-063` | **Toques de Reloj Unipodales (Clock Reach)** | `bajo` | B_APOYO_UNIPODAL |
| `hex-067` | **Giro de 180 Grados y Sprint de Espaldas a Frontal** | `bajo` | B_APOYO_UNIPODAL, B_ROTACION |
| `hex-068` | **Plancha Frontal Clásica (Isometric Plank)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-069` | **Plancha Lateral con Apoyo de Codo** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-070` | **Plancha Lateral con Elevación de Pierna (Star Plank)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-071` | **Plancha Frontal con Toques de Hombro (Shoulder Taps)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-072` | **Pájaro-Perro (Bird-Dog Contralateral)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-073` | **Bicho Muerto (Dead Bug Contralateral)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ANGULO_ARTICULAR_EXTREMO |
| `hex-074` | **Puente de Glúteo Bipodal con Pausa Isométrica** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ANGULO_ARTICULAR_EXTREMO |
| `hex-075` | **Puente de Glúteo Unipodal con Pierna Extendida** | `bajo` | B_APOYO_UNIPODAL, B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-079` | **Slide Hamstring Curl con Toalla en Suelo Liso** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_MATERIAL_TOCA_CUERPO(toalla) |
| `hex-083` | **Elevación de Gemelos en Escalón con Fase Excéntrica Lenta** | `bajo` | B_MATERIAL_TOCA_CUERPO(escalon) |
| `hex-084` | **Elevación de Sóleo Unipodal con Rodilla Semiflexionada** | `bajo` | B_APOYO_UNIPODAL, B_MATERIAL_TOCA_CUERPO(pared) |
| `hex-085` | **Dorsiflexión de Tibial Anterior contra Pared (Tibialis Raises)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared) |
| `hex-086` | **La Almeja para Glúteo Medio (Clamshell con Pausa)** | `bajo` | B_ROTACION, B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-087` | **Paseo de Monstruo con Banda o Isométrico (Monster Walk)** | `bajo` | B_MATERIAL_TOCA_CUERPO(banda_elastica), B_ASIMETRIA_ENTRE_LADOS |
| `hex-088` | **Silla Isométrica en Pared (Wall Sit)** | `bajo` | B_MATERIAL_TOCA_CUERPO(pared), B_ANGULO_ARTICULAR_EXTREMO |
| `hex-089` | **Silla Isométrica Unipodal en Pared** | `bajo` | B_APOYO_UNIPODAL, B_MATERIAL_TOCA_CUERPO(pared) |
| `hex-090` | **Flexiones de Brazos con Control Escapular (Scapular Push-Up)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-091` | **El Candado Lumbopélvico (Pallof Press Isométrico con Toalla)** | `bajo` | B_ROTACION, B_MATERIAL_TOCA_CUERPO(toalla+poste_o_pomo_puerta), B_ASIMETRIA_ENTRE_LADOS |
| `hex-093` | **Estiramiento Pasivo de Isquiosurales con Toalla** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_MATERIAL_TOCA_CUERPO(toalla) |
| `hex-094` | **Estiramiento de Cuádriceps y Psoas en Caballero (Couch Stretch)** | `bajo` | B_MATERIAL_TOCA_CUERPO(sofa_o_pared) |
| `hex-095` | **Estiramiento de Glúteo en Figura 4 (Supine Figure Four)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-096` | **La Rana para Aductores (Frog Stretch)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-097` | **Postura de Paloma Modificada (Pigeon Pose)** | `bajo` | B_ROTACION |
| `hex-098` | **Estiramiento de Gemelo y Sóleo contra Pared** | `bajo` | B_APOYO_UNIPODAL, B_MATERIAL_TOCA_CUERPO(pared) |
| `hex-099` | **Postura del Niño con Descarga de Hombros (Child Pose)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-100` | **Torsión Espinal Tumbado (Supine Spinal Twist)** | `bajo` | B_ROTACION, B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-101` | **Enhebrar la Aguja para Espalda Alta (Thread the Needle)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-102` | **Apertura Pectoral en Marco de Puerta** | `bajo` | B_MATERIAL_TOCA_CUERPO(marco_puerta) |
| `hex-103` | **Estiramiento de la Cobra Suave para Cadena Anterior** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |
| `hex-104` | **Perro Boca Abajo con Pedaleo de Talones (Downward Dog)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-105` | **Descompresión Lumbar en Pelota o Rodillas al Pecho** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_ASIMETRIA_ENTRE_LADOS |
| `hex-106` | **Piernas en la Pared para Retorno Venoso (Legs-Up-The-Wall)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL, B_MATERIAL_TOCA_CUERPO(pared) |
| `hex-107` | **Respiración Diafragmática Box Breathing (4-4-4-4)** | `bajo` | B_CUADRUPEDIA_O_POSTURA_NO_VERTICAL |

---

## 5. Lista Completa — Nivel A (Auto-Validación por Gate: 4 ejercicios)

*Criterio: Bipedestación simétrica sin material de contacto directo sobre el cuerpo ni banderas de Nivel B o C.*

| ID | Nombre del Ejercicio | `tier_riesgo` | Estado de Banderas |
| :--- | :--- | :---: | :--- |
| `hex-011` | **Skipping Bajo con Apoyos Rápidos** | `bajo` | A_BIPEDESTACION_SIMETRICA_SIN_BANDERAS |
| `hex-013` | **Talones al Glúteo con Braceo (B-Skip)** | `bajo` | A_BIPEDESTACION_SIMETRICA_SIN_BANDERAS |
| `hex-052` | **Escalera de Agilidad: 2 Pies por Hueco (Two-In)** | `bajo` | A_BIPEDESTACION_SIMETRICA_SIN_BANDERAS |
| `hex-066` | **Arrancadas Explosivas de Reacción Auditiva** | `bajo` | A_BIPEDESTACION_SIMETRICA_SIN_BANDERAS |
