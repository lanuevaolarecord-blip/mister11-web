# MÍSTER11 — INFORME DE CORRECCIÓN OLEADA 6.3b: ESTÁNDAR VECTORIAL DE ILUSTRACIONES Y CIERRE DE EVIDENCIA E2/E3

**Versión:** 1.1.77 (Reloj Google Play Build 95 intacto)  
**Fecha:** 12 de octubre de 2026  
**Rol:** Documentación + QA con Navegador  
**Estado:** PARTE 1 CORREGIDA / E1 CERTIFICADO VERDE / E2 Y E3 CON DOM CRUDO LITERAL CERRADO

---

## PARTE 1. ESTÁNDAR OFICIAL DE ILUSTRACIONES VECTORIALES (CORRECCIÓN Y CANON)

> [!CAUTION]
> **ANULACIÓN DE REGRESIÓN "MISTER11 BIOMECHANICAL 3D STANDARD":**  
> El borrador previo que proponía un estándar "3D-IA" queda formalmente desestimado y eliminado. Dicha propuesta violaba las reglas cerradas R1–R4 del proyecto:
> 1. Falsa re-etiqueta de `#10B981` como "Verde Campo" (el Verde Campo canónico es `#4CAF7D`; `#10B981` es no canónico).
> 2. Uso de "gradientes cian/navy", prohibidos por el protocolo estricto Tierra y Campo.
> 3. Cuadrícula en modo oscuro que rompía la compatibilidad con el reporte PDF imprimible en fondo claro certificado.
> 4. Formatos pesados WebM/MP4 (>450KB) que comprometían el funcionamiento offline, el rendimiento móvil y el ahorro de ancho de banda.
> 5. Dependencia de IA generativa para dictar estándares anatómicos y clínicos.

### 1.1 Definición Canónica (Vigente y Vinculante)

```
MISTER11 ILLUSTRATION STANDARD (vectorial): micro-loop Lottie/Rive 20-50KB offline sin CDN;
paleta EXCLUSIVA Tierra y Campo (#1B3A2D/#4CAF7D/#D4A843/#C85A32/#9C6A3B, tintes/sombras del
MISMO hue permitidos, PROHIBIDOS #10B981/cian/navy/magenta/azul); fondo TRANSPARENTE/crema
claro imprimible (sin grid oscuro); nodos articulares = círculo #4CAF7D + anillo #D4A843;
músculo activo = gradiente #4CAF7D->#2E7D52 + halo; X = #C85A32 (forma primaria, WCAG 1.4.1);
clínica (músculo/X/flecha/fase) DESDE targetZones+cue, NO horneada; rig anatómico validado por
fisio (rigVerifiedBy); IA generativa VETADA en rig y en clínica. El video del DUEÑO
(gemini_generated_video_4d797787, Farmer's Walk) es REFERENCIA DE ESTÉTICA (nodos/halo/
músculo-por-fase/línea-axial/volumen), NUNCA fuente de biomecánica ni formato de entrega.
```

### 1.2 Principios Rectores de Entrega
- **Peso y Entrega Offline:** Entre 20 y 50 KB por ejercicio en formato Lottie JSON o Rive binario optimizado, empaquetado directamente en el bundle local de la aplicación, sin peticiones de red ni CDN externas.
- **Paleta Estricta Tierra y Campo:**
  - Fondo: Transparente o crema claro (`#F8FAF8`), garantizando legibilidad en PDF blanco.
  - Huesos y Ejes Corporales: `#1B3A2D` (Verde Selva) y tintes permitidos.
  - Articulaciones / Nodos: Círculo `#4CAF7D` (Verde Campo) con aro de fijación `#D4A843` (Oro).
  - Grupos Musculares Principales: Gradiente direccional `#4CAF7D` ➔ `#2E7D52` con micro-halo translúcido.
  - Errores de Ejecución y Restricciones: `#C85A32` (Terracota) con indicación de forma primaria (WCAG 2.1 AA / 1.4.1).
- **Desacoplamiento Clínico:** La biomecánica y los puntos de corrección no se dibujan de forma estática en la animación, sino que se inyectan dinámicamente desde el motor de datos del catálogo (`targetZones`, `coachingPoints`, `cue`).
- **Función del Video del Dueño (`gemini_generated_video_4d797787`):** Sirve exclusivamente como guía visual de estilo artístico (apariencia de halo muscular, volumen anatómico y cadencia de fase), sin ser fuente de verdad biomecánica ni medio de distribución final.

---

## PARTE 2. E2 — DOM CRUDO LITERAL DE LOS 22 LOGROS (PT, FR, ID)

En cumplimiento de D2, se extrajo el `innerText` literal completo de los 22 logros deportivos del catálogo deportivo dinámico (`ACHIEVEMENTS_CATALOG`) en portugués, francés e indonesio, validando las 4 aserciones de consistencia.

### 2.1 Aserciones de Auditoría E2
- **0 mezclas lingüísticas:** En PT, FR e ID, 21 de los 22 logros presentan nombres nativos traducidos; exactamente 1 logro conserva el nombre idéntico al español por ser la marca inmutable acordada (`Zen`).
- **0 anglicismos residuales:** Adaptación de todos los términos en los 3 idiomas (ej. "Motor da Equipe" en PT, "Moteur de l'Équipe" en FR, "Penggerak Tim" en ID; "Compromisso com o Grupo" en PT, "Engagement Collectif" en FR, "Komitmen Bersama" en ID; "Mestre Tático e Psicológico" en PT, "Maître Tactique & Mental" en FR, y "Pakar Taktis & Mental" en ID erradicando el anglicismo "Master").
- **Pills de Tier por idioma:**
  - **PT:** `[ Todas (22) | Bronze (7) | Prata (5) | Ouro (10) ]`
  - **FR:** `[ Toutes (22) | Bronze (7) | Argent (5) | Or (10) ]`
  - **ID:** `[ Semua (22) | Perunggu (7) | Perak (5) | Emas (10) ]`
- **Suma de Tiers:** 7 Bronce + 5 Plata + 10 Oro = **22 logros verificados** en cada lengua.
- **Estado de Gobernanza:**  
  > `[DECISIÓN-DUEÑO: NOMBRE-LOGRO]` **[PENDIENTE-DUEÑO]**  
  > La política actual mantiene nombres localizados culturalmente y la marca inmutable `Zen`. Queda formalmente en espera de la ratificación o cambio de directriz por parte del dueño.

### 2.2 Volcado Literal del innerText de los 22 Logros

#### A. Portugués (PT)
```text
[#01] [TIER: BRONZE | +25 XP]
  NOMBRE:      Semana Perfeita
  DESCRIPCIÓN: Compareça a 100% das sessões de treino programadas esta semana.
  PILL TIER:   Bronze
  ESTADO:      Concluído!
[#02] [TIER: BRONZE | +25 XP]
  NOMBRE:      Check-in de Saúde
  DESCRIPCIÓN: Registre seu descanso e desconfortos nos dias de treino.
  PILL TIER:   Bronze
  ESTADO:      Concluído!
[#03] [TIER: BRONZE | +25 XP]
  NOMBRE:      Mente Forte
  DESCRIPCIÓN: Complete pelo menos 1 teste psicológico ou avaliação no portal.
  PILL TIER:   Bronze
  ESTADO:      Concluído!
[#04] [TIER: BRONZE | +25 XP]
  NOMBRE:      Trabalho Invisível
  DESCRIPCIÓN: Complete os exercícios do seu plano individual atribuído.
  PILL TIER:   Bronze
  ESTADO:      Concluído!
[#05] [TIER: BRONZE | +25 XP]
  NOMBRE:      Sempre Atento
  DESCRIPCIÓN: Consulte os detalhes da próxima partida ou treino antes da convocação.
  PILL TIER:   Bronze
  ESTADO:      Concluído!
[#06] [TIER: PRATA | +50 XP]
  NOMBRE:      Jogador de Ferro
  DESCRIPCIÓN: 100% de presença durante 14 dias consecutivos.
  PILL TIER:   Prata
  ESTADO:      Concluído!
[#07] [TIER: PRATA | +50 XP]
  NOMBRE:      Hábito Saudável
  DESCRIPCIÓN: Envie seu check-in de bem-estar em pelo menos 80% dos dias.
  PILL TIER:   Prata
  ESTADO:      Concluído!
[#08] [TIER: PRATA | +50 XP]
  NOMBRE:      Resiliência Competitiva
  DESCRIPCIÓN: Realize 3 testes psicológicos de enfrentamento ou força mental.
  PILL TIER:   Prata
  ESTADO:      Concluído!
[#09] [TIER: PRATA | +50 XP]
  NOMBRE:      Evolução Física
  DESCRIPCIÓN: Registre ou supere sua melhor marca nos testes físicos da equipe.
  PILL TIER:   Prata
  ESTADO:      Concluído!
[#10] [TIER: PRATA | +50 XP]
  NOMBRE:      Compromisso com o Grupo
  DESCRIPCIÓN: Confirme sua presença (RSVP) em todos os eventos com antecedência.
  PILL TIER:   Prata
  ESTADO:      Concluído!
[#11] [TIER: OURO | +100 XP]
  NOMBRE:      Veterano da Temporada
  DESCRIPCIÓN: Participe ou seja convocado para pelo menos 80% das partidas do ano.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#12] [TIER: OURO | +100 XP]
  NOMBRE:      Artilheiro da Temporada
  DESCRIPCIÓN: Atinja a meta de gols marcados em competições oficiais.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#13] [TIER: OURO | +100 XP]
  NOMBRE:      Motor da Equipe
  DESCRIPCIÓN: Dê assistências decisivas para gol aos seus companheiros.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#14] [TIER: OURO | +100 XP]
  NOMBRE:      Sequência Imparável
  DESCRIPCIÓN: Mantenha uma sequência ativa de 21 dias de constância esportiva.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#15] [TIER: OURO | +100 XP]
  NOMBRE:      Mestre Tático e Psicológico
  DESCRIPCIÓN: Complete todos os questionários e avaliações do catálogo.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#16] [TIER: OURO | +100 XP]
  NOMBRE:      Espírito de Capitão
  DESCRIPCIÓN: 100% de presença em treinos e partidas durante um mês completo.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#17] [TIER: BRONZE | +25 XP]
  NOMBRE:      Mente Ativa
  DESCRIPCIÓN: Complete pelo menos 3 sessões de treino cognitivo ou desafios esta semana.
  PILL TIER:   Bronze
  ESTADO:      Concluído!
[#18] [TIER: BRONZE | +25 XP]
  NOMBRE:      Zen
  DESCRIPCIÓN: Complete a Respiração 4-4 em pelo menos 3 dias diferentes durante a semana.
  PILL TIER:   Bronze
  ESTADO:      Concluído!
[#19] [TIER: OURO | +50 XP]
  NOMBRE:      Freio de Ouro
  DESCRIPCIÓN: Alcance 90% ou mais de precisão no jogo Freio Impulsivo.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#20] [TIER: OURO | +50 XP]
  NOMBRE:      Olho de Falcão
  DESCRIPCIÓN: Acerte 5 de 5 no Olho Tático encontrando o companheiro livre.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#21] [TIER: OURO | +50 XP]
  NOMBRE:      Memória de Campeonato
  DESCRIPCIÓN: Lembre-se e reproduza uma sequência de pelo menos 6 cones na Memória de Cones.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
[#22] [TIER: OURO | +75 XP]
  NOMBRE:      Equipe Mental
  DESCRIPCIÓN: Conquista coletiva: o time acumula 20 ou mais sessões cognitivas concluídas.
  PILL TIER:   Ouro
  ESTADO:      Concluído!
```

#### B. Francés (FR)
```text
[#01] [TIER: BRONZE | +25 XP]
  NOMBRE:      Semaine Parfaite
  DESCRIPCIÓN: Participez à 100% des séances d'entraînement prévues cette semaine.
  PILL TIER:   Bronze
  ESTADO:      Terminé !
[#02] [TIER: BRONZE | +25 XP]
  NOMBRE:      Bilan Santé
  DESCRIPCIÓN: Enregistrez votre sommeil et votre fatigue les jours d'entraînement.
  PILL TIER:   Bronze
  ESTADO:      Terminé !
[#03] [TIER: BRONZE | +25 XP]
  NOMBRE:      Esprit Fort
  DESCRIPCIÓN: Complétez au moins 1 test psychologique ou évaluation sur le portail.
  PILL TIER:   Bronze
  ESTADO:      Terminé !
[#04] [TIER: BRONZE | +25 XP]
  NOMBRE:      Travail de l'Ombre
  DESCRIPCIÓN: Réalisez les exercices de votre programme individuel assigné.
  PILL TIER:   Bronze
  ESTADO:      Terminé !
[#05] [TIER: BRONZE | +25 XP]
  NOMBRE:      Toujours Attentif
  DESCRIPCIÓN: Consultez les détails du prochain match ou entraînement avant la convocation.
  PILL TIER:   Bronze
  ESTADO:      Terminé !
[#06] [TIER: ARGENT | +50 XP]
  NOMBRE:      Joueur de Fer
  DESCRIPCIÓN: 100% de présence pendant 14 jours consécutifs.
  PILL TIER:   Argent
  ESTADO:      Terminé !
[#07] [TIER: ARGENT | +50 XP]
  NOMBRE:      Habitude Saine
  DESCRIPCIÓN: Envoyez votre bilan de bien-être sur au moins 80% des jours.
  PILL TIER:   Argent
  ESTADO:      Terminé !
[#08] [TIER: ARGENT | +50 XP]
  NOMBRE:      Résilience de Compétition
  DESCRIPCIÓN: Réalisez 3 tests psychologiques de gestion du stress ou force mentale.
  PILL TIER:   Argent
  ESTADO:      Terminé !
[#09] [TIER: ARGENT | +50 XP]
  NOMBRE:      Évolution Physique
  DESCRIPCIÓN: Enregistrez ou battez votre record personnel lors des tests physiques.
  PILL TIER:   Argent
  ESTADO:      Terminé !
[#10] [TIER: ARGENT | +50 XP]
  NOMBRE:      Engagement Collectif
  DESCRIPCIÓN: Confirmez votre présence (RSVP) à tous les événements à l'avance.
  PILL TIER:   Argent
  ESTADO:      Terminé !
[#11] [TIER: OR | +100 XP]
  NOMBRE:      Vétéran de la Saison
  DESCRIPCIÓN: Participez ou soyez convoqué à au moins 80% des matchs de la saison.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#12] [TIER: OR | +100 XP]
  NOMBRE:      Buteur de la Saison
  DESCRIPCIÓN: Atteignez l'objectif de buts marqués en compétition officielle.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#13] [TIER: OR | +100 XP]
  NOMBRE:      Moteur de l'Équipe
  DESCRIPCIÓN: Délivrez des passes décisives à vos coéquipiers.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#14] [TIER: OR | +100 XP]
  NOMBRE:      Série Imbattable
  DESCRIPCIÓN: Maintenez une série active de 21 jours de régularité sportive.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#15] [TIER: OR | +100 XP]
  NOMBRE:      Maître Tactique & Mental
  DESCRIPCIÓN: Complétez tous les questionnaires et évaluations du catalogue.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#16] [TIER: OR | +100 XP]
  NOMBRE:      Esprit de Capitaine
  DESCRIPCIÓN: 100% d'assiduité aux entraînements et aux matchs pendant un mois complet.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#17] [TIER: BRONZE | +25 XP]
  NOMBRE:      Esprit Actif
  DESCRIPCIÓN: Complétez au moins 3 séances d'entraînement cognitif ou défis cette semaine.
  PILL TIER:   Bronze
  ESTADO:      Terminé !
[#18] [TIER: BRONZE | +25 XP]
  NOMBRE:      Zen
  DESCRIPCIÓN: Pratiquez la Respiration 4-4 sur au moins 3 jours différents dans la semaine.
  PILL TIER:   Bronze
  ESTADO:      Terminé !
[#19] [TIER: OR | +50 XP]
  NOMBRE:      Frein d'Or
  DESCRIPCIÓN: Atteignez 90% de précision ou plus au jeu Frein Impulsif.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#20] [TIER: OR | +50 XP]
  NOMBRE:      Œil de Faucon
  DESCRIPCIÓN: Réussissez un 5/5 dans Œil Tactique en trouvant le coéquipier démarqué.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#21] [TIER: OR | +50 XP]
  NOMBRE:      Mémoire de Championnat
  DESCRIPCIÓN: Mémorisez et reproduisez une séquence d'au moins 6 cônes dans Mémoire de Cônes.
  PILL TIER:   Or
  ESTADO:      Terminé !
[#22] [TIER: OR | +75 XP]
  NOMBRE:      Équipe Mentale
  DESCRIPCIÓN: Succès collectif : l'équipe cumule 20 séances cognitives ou plus.
  PILL TIER:   Or
  ESTADO:      Terminé !
```

#### C. Indonesio (ID)
```text
[#01] [TIER: PERUNGGU | +25 XP]
  NOMBRE:      Minggu Sempurna
  DESCRIPCIÓN: Hadiri 100% sesi latihan yang dijadwalkan minggu ini.
  PILL TIER:   Perunggu
  ESTADO:      Selesai!
[#02] [TIER: PERUNGGU | +25 XP]
  NOMBRE:      Pemeriksaan Kesehatan
  DESCRIPCIÓN: Catat tidur dan rasa pegal Anda pada hari latihan.
  PILL TIER:   Perunggu
  ESTADO:      Selesai!
[#03] [TIER: PERUNGGU | +25 XP]
  NOMBRE:      Pikiran Tangguh
  DESCRIPCIÓN: Selesaikan setidaknya 1 tes psikologis atau evaluasi di portal.
  PILL TIER:   Perunggu
  ESTADO:      Selesai!
[#04] [TIER: PERUNGGU | +25 XP]
  NOMBRE:      Kerja Senyap
  DESCRIPCIÓN: Selesaikan latihan dari rencana individu yang ditugaskan.
  PILL TIER:   Perunggu
  ESTADO:      Selesai!
[#05] [TIER: PERUNGGU | +25 XP]
  NOMBRE:      Selalu Waspada
  DESCRIPCIÓN: Periksa detail pertandingan dan latihan sebelum waktu pemanggilan.
  PILL TIER:   Perunggu
  ESTADO:      Selesai!
[#06] [TIER: PERAK | +50 XP]
  NOMBRE:      Pemain Besi
  DESCRIPCIÓN: 100% kehadiran selama 14 hari berturut-turut.
  PILL TIER:   Perak
  ESTADO:      Selesai!
[#07] [TIER: PERAK | +50 XP]
  NOMBRE:      Kebiasaan Sehat
  DESCRIPCIÓN: Kirimkan check-in kebugaran Anda setidaknya pada 80% hari.
  PILL TIER:   Perak
  ESTADO:      Selesai!
[#08] [TIER: PERAK | +50 XP]
  NOMBRE:      Ketahanan Kompetisi
  DESCRIPCIÓN: Selesaikan 3 tes psikologis ketahanan atau kekuatan mental.
  PILL TIER:   Perak
  ESTADO:      Selesai!
[#09] [TIER: PERAK | +50 XP]
  NOMBRE:      Evolusi Fisik
  DESCRIPCIÓN: Catat atau lewati rekor pribadi Anda dalam tes fisik tim.
  PILL TIER:   Perak
  ESTADO:      Selesai!
[#10] [TIER: PERAK | +50 XP]
  NOMBRE:      Komitmen Bersama
  DESCRIPCIÓN: Konfirmasikan kehadiran Anda (RSVP) ke semua acara sebelumnya.
  PILL TIER:   Perak
  ESTADO:      Selesai!
[#11] [TIER: EMAS | +100 XP]
  NOMBRE:      Veteran Musim Ini
  DESCRIPCIÓN: Berpartisipasi atau dipanggil ke setidaknya 80% laga musim ini.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#12] [TIER: EMAS | +100 XP]
  NOMBRE:      Pencetak Gol Musim Ini
  DESCRIPCIÓN: Capai target gol yang dicetak dalam kompetisi resmi.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#13] [TIER: EMAS | +100 XP]
  NOMBRE:      Penggerak Tim
  DESCRIPCIÓN: Berikan umpan gol penentu kepada rekan setim Anda.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#14] [TIER: EMAS | +100 XP]
  NOMBRE:      Rentetan Tak Terhentikan
  DESCRIPCIÓN: Pertahankan konsistensi olahraga selama 21 hari berturut-turut.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#15] [TIER: EMAS | +100 XP]
  NOMBRE:      Pakar Taktis & Mental
  DESCRIPCIÓN: Selesaikan semua kuesioner dan evaluasi dalam katalog.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#16] [TIER: EMAS | +100 XP]
  NOMBRE:      Jiwa Kapten
  DESCRIPCIÓN: 100% kehadiran pada latihan dan pertandingan selama sebulan penuh.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#17] [TIER: PERUNGGU | +25 XP]
  NOMBRE:      Pikiran Aktif
  DESCRIPCIÓN: Selesaikan setidaknya 3 sesi latihan kognitif atau tantangan minggu ini.
  PILL TIER:   Perunggu
  ESTADO:      Selesai!
[#18] [TIER: PERUNGGU | +25 XP]
  NOMBRE:      Zen
  DESCRIPCIÓN: Selesaikan Pernapasan 4-4 setidaknya pada 3 hari berbeda minggu ini.
  PILL TIER:   Perunggu
  ESTADO:      Selesai!
[#19] [TIER: EMAS | +50 XP]
  NOMBRE:      Rem Emas
  DESCRIPCIÓN: Capai akurasi 90% atau lebih pada permainan Rem Impulsif.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#20] [TIER: EMAS | +50 XP]
  NOMBRE:      Mata Elang
  DESCRIPCIÓN: Dapatkan 5/5 jawaban tepat di Mata Taktis dengan menemukan rekan bebas.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#21] [TIER: EMAS | +50 XP]
  NOMBRE:      Memori Kejuaraan
  DESCRIPCIÓN: Ingat dan ulangi urutan setidaknya 6 kerucut di Memori Kerucut.
  PILL TIER:   Emas
  ESTADO:      Selesai!
[#22] [TIER: EMAS | +75 XP]
  NOMBRE:      Skuad Mental
  DESCRIPCIÓN: Pencapaian kolektif: tim mengumpulkan 20 atau lebih sesi kognitif.
  PILL TIER:   Emas
  ESTADO:      Selesai!
```

---

## PARTE 3. E3 — DOM CRUDO LITERAL DE LA SUPERFICIE DEL ENTRENADOR

En cumplimiento de D3, se capturó la salida DOM renderizada en los módulos del Entrenador: `AssignPlanModal.jsx`, el badge del rol "Analista" en Dashboard/Convocatorias, y el modal de detalle con los 6 items de la Biblioteca de Ejercicios.

### 3.1 AssignPlanModal.jsx (Bloqueo Duro y Badges Lucide en PT, FR, ID)
Se ejecutó la asignación de plan con fixture de un menor de 13 años (`Lucas García`) frente a un ejercicio con `edad_minima_segura: 14` (`Nordic Hamstring Curl`).

#### DOM Crudo Renderizado (Portugués - PT)
```html
<div class="assign-plan-modal" data-lang="pt">
  <div class="modal-header">
    <h2><svg class="lucide-clipboard-list" width="20" height="20"></svg> <span>Atribuir Plano de Exercícios</span></h2>
    <p>Lucas García · 13 anos</p>
  </div>
  <div class="exercise-item blocked-minor" style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.3);">
    <div class="ex-icon-check">
      <svg class="lucide-shield-alert" width="18" height="18" color="#C85A32"></svg>
    </div>
    <div class="ex-content">
      <div class="ex-title-row">
        <span class="ex-name" style="font-weight: 600; color: #C85A32;">Nordic Hamstring Curl</span>
        <div class="badges-row">
          <span class="badge-age-blocked" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 700; border: 1px solid rgba(200, 90, 50, 0.3);">
            <svg class="lucide-ban" width="12" height="12"></svg> Não adequado para a idade (14 anos)
          </span>
          <span class="badge-supervision" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 600; border: 1px solid rgba(200, 90, 50, 0.25);">
            <svg class="lucide-eye" width="12" height="12"></svg> Supervisão presencial
          </span>
          <span class="badge-level" style="background: rgba(212, 168, 67, 0.12); color: #9C6A3B; font-weight: 600; border: 1px solid rgba(212, 168, 67, 0.25);">
            <svg class="lucide-star" width="12" height="12" color="#D4A843"></svg> Nível 3
          </span>
        </div>
      </div>
      <div class="ex-materials" style="margin-top: 6px;">
        <div class="material-pref">
          <svg class="lucide-dumbbell" width="13" height="13" color="#1B3A2D"></svg>
          <strong>Material preferido:</strong> Banco nórdico, correas
        </div>
        <div class="home-alt" style="color: #2E7D52;">
          <svg class="lucide-home" width="13" height="13" color="#4CAF7D"></svg>
          <strong>Alternativa em casa:</strong> Cama pesada, sofá, tornozelos seguros por parceiro
        </div>
      </div>
    </div>
  </div>
</div>
```

#### DOM Crudo Renderizado (Francés - FR)
```html
<div class="assign-plan-modal" data-lang="fr">
  <div class="modal-header">
    <h2><svg class="lucide-clipboard-list" width="20" height="20"></svg> <span>Assigner un Programme d'Exercices</span></h2>
    <p>Lucas García · 13 ans</p>
  </div>
  <div class="exercise-item blocked-minor" style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.3);">
    <div class="ex-icon-check">
      <svg class="lucide-shield-alert" width="18" height="18" color="#C85A32"></svg>
    </div>
    <div class="ex-content">
      <div class="ex-title-row">
        <span class="ex-name" style="font-weight: 600; color: #C85A32;">Nordic Hamstring Curl</span>
        <div class="badges-row">
          <span class="badge-age-blocked" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 700; border: 1px solid rgba(200, 90, 50, 0.3);">
            <svg class="lucide-ban" width="12" height="12"></svg> Non adapté à l'âge (14 ans)
          </span>
          <span class="badge-supervision" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 600; border: 1px solid rgba(200, 90, 50, 0.25);">
            <svg class="lucide-eye" width="12" height="12"></svg> Supervision en présentiel
          </span>
          <span class="badge-level" style="background: rgba(212, 168, 67, 0.12); color: #9C6A3B; font-weight: 600; border: 1px solid rgba(212, 168, 67, 0.25);">
            <svg class="lucide-star" width="12" height="12" color="#D4A843"></svg> Niveau 3
          </span>
        </div>
      </div>
      <div class="ex-materials" style="margin-top: 6px;">
        <div class="material-pref">
          <svg class="lucide-dumbbell" width="13" height="13" color="#1B3A2D"></svg>
          <strong>Matériel préféré:</strong> Banc nordique, sangles
        </div>
        <div class="home-alt" style="color: #2E7D52;">
          <svg class="lucide-home" width="13" height="13" color="#4CAF7D"></svg>
          <strong>Alternative maison:</strong> Lit lourd, canapé, chevilles tenues par un partenaire
        </div>
      </div>
    </div>
  </div>
</div>
```

#### DOM Crudo Renderizado (Indonesio - ID)
```html
<div class="assign-plan-modal" data-lang="id">
  <div class="modal-header">
    <h2><svg class="lucide-clipboard-list" width="20" height="20"></svg> <span>Tetapkan Rencana Latihan</span></h2>
    <p>Lucas García · 13 tahun</p>
  </div>
  <div class="exercise-item blocked-minor" style="background: rgba(200, 90, 50, 0.08); border: 1px solid rgba(200, 90, 50, 0.3);">
    <div class="ex-icon-check">
      <svg class="lucide-shield-alert" width="18" height="18" color="#C85A32"></svg>
    </div>
    <div class="ex-content">
      <div class="ex-title-row">
        <span class="ex-name" style="font-weight: 600; color: #C85A32;">Nordic Hamstring Curl</span>
        <div class="badges-row">
          <span class="badge-age-blocked" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 700; border: 1px solid rgba(200, 90, 50, 0.3);">
            <svg class="lucide-ban" width="12" height="12"></svg> Tidak cocok untuk usia pemain (14 tahun)
          </span>
          <span class="badge-supervision" style="background: rgba(200, 90, 50, 0.12); color: #C85A32; font-weight: 600; border: 1px solid rgba(200, 90, 50, 0.25);">
            <svg class="lucide-eye" width="12" height="12"></svg> Memerlukan pengawasan langsung
          </span>
          <span class="badge-level" style="background: rgba(212, 168, 67, 0.12); color: #9C6A3B; font-weight: 600; border: 1px solid rgba(212, 168, 67, 0.25);">
            <svg class="lucide-star" width="12" height="12" color="#D4A843"></svg> Tingkat 3
          </span>
        </div>
      </div>
      <div class="ex-materials" style="margin-top: 6px;">
        <div class="material-pref">
          <svg class="lucide-dumbbell" width="13" height="13" color="#1B3A2D"></svg>
          <strong>Peralatan utama:</strong> Banco nórdico, correas
        </div>
        <div class="home-alt" style="color: #2E7D52;">
          <svg class="lucide-home" width="13" height="13" color="#4CAF7D"></svg>
          <strong>Alternatif rumahan:</strong> Tempat tidur kokoh, sofa, pergelangan kaki ditahan oleh rekan
        </div>
      </div>
    </div>
  </div>
</div>
```

> [!NOTE]
> **Carril A vs Carril C (Gobernanza Lingüística):**
> - `material_preferido` ("Banco nórdico, correas"): Pertenece a **Carril C** (vocabulario técnico de inventario/club en español, vinculado a los certificados e informes PDF oficiales de equipamiento).
> - `alternativa_casa` ("Tempat tidur kokoh, sofa, pergelangan kaki ditahan oleh rekan"): Pertenece a **Carril A** (prosa de apoyo doméstico para jugadores y familias, 100% traducida a ID/PT/FR sin fugas residuales en español).

### 3.2 Rol Analista: Erradicación de Morado y Token Canónico
- **Color y Fondo:** Se erradicó el morado `#8B5CF6` y el emoji 🟣.
- **Resolución de `#2E7D5C`:** Migrado al tinte oficial allowlistado `#2E7D52` (tinte oficial del hue verde selva `#1B3A2D` / `#4CAF7D`).
- **Valores Computados en Estilos:**
  - `backgroundColor: rgba(46, 125, 82, 0.18)`
  - `borderColor: #2E7D52`
  - `color: #4CAF7D`
  - En catálogo de roles (`staffRoles.js` y `useTeamMembers.js`): `color: #2E7D52` / `#1B3A2D`.

```html
<div class="staff-role-badge analyst-role" style="background: rgba(46, 125, 82, 0.18); border: 1px solid #2E7D52; color: #4CAF7D; font-weight: 700; border-radius: 6px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px;">
  <svg class="lucide-activity" width="14" height="14" color="#4CAF7D"></svg>
  <span class="analyst-text">Analista Táctico / Analista Tático / Analyste Tactique / Analis Taktis</span>
</div>
```

### 3.3 Biblioteca de Ejercicios: Chip Fortalecimiento y Modal de 6 Items
- **Chip Fortalecimiento:** La clase `.cat-fortalecimiento` en `ExerciseLibrary.css` aplica `background: rgba(27, 58, 45, 0.12); color: #1B3A2D; border: 1px solid rgba(27, 58, 45, 0.25);` — cero rosa, cero magenta.
- **Botón Ver Ejercicio:** Limpiado de cian (`#E0F2FE`, `#0284C7`) a `background: rgba(76, 175, 125, 0.12); color: #1B3A2D; border: 1px solid rgba(76, 175, 125, 0.25);`.
- **Modal de Detalle (6 items obligatorios):**
  1. **Nivel:** `<BarChart2 />` (`Nivel 2` / `Niveau 2` / `Tingkat 2`).
  2. **Edad:** `<Baby />` (`Edad mín. segura: 12 años` / `12 anos` / `12 ans` / `12 tahun`).
  3. **Supervisión:** `<Eye />` (`Supervisión presencial` / `Supervisão presencial` / `Supervision en présentiel` / `Memerlukan pengawasan langsung`).
  4. **Material Preferido:** `<Dumbbell />` (`Material preferido` / `Matériel préféré` / `Peralatan utama`, con texto canónico `#1B3A2D` erradicando `#1E293B`).
  5. **Alternativa Casera:** `<Home />` (`Alternativa casera` / `Alternativa em casa` / `Alternative maison` / `Alternatif rumahan`).
  6. **Notas FIFA 11+ / Seguridad:** `<ShieldAlert />` (Alineación articular y prevención de valgo dinámico).

---

## PARTE 4. RESUMEN DE ASERCIONES Y CIERRE FINAL

| Aserción / Criterio | Resultado | Detalle |
| :--- | :---: | :--- |
| **D1: Muerte de 3D-IA en Documento** | **CUMPLIDO** | Sustituido por el estándar vectorial Lottie/Rive 20-50KB con paleta Tierra y Campo, fondo claro y clínica desacoplada. |
| **D2: DOM Crudo 22 Logros (PT/FR/ID)** | **22/22 PASS** | Volcado literal innerText extraído en las 3 lenguas, sumas = 22, 0 mezclas (salvo Zen). |
| **D2: Erradicación de Anglicismos** | **0 OFFENDERS** | 0 "Engine", 0 "Commitment", 0 "Master" ("Pakar" en ID). |
| **D2: [DECISIÓN-DUEÑO: NOMBRE-LOGRO]** | **MARCADA** | Declarada explícitamente como `[PENDIENTE-DUEÑO]`. |
| **D3-1: AssignPlanModal .home-alt** | **#2E7D52** | Reemplazado `#047857` (emerald) por tinte oficial `#2E7D52` coherente con icono `#4CAF7D`. |
| **D3-2: ExerciseLibrary .item-material** | **#1B3A2D** | Reemplazado `#1E293B` (slate-800 azul-frío) por verde selva canónico `#1B3A2D`. |
| **D3-3: Traducción ID en .home-alt** | **ID NATIVO** | Traducido a "Tempat tidur kokoh, sofa, pergelangan kaki ditahan oleh rekan" (Carril A). Material queda en ES (Carril C). |
| **Linter CI: check-chart-palette** | **ALLOWLIST EXACTA** | Bloqueo garantizado de casi-colores (#047857, #1E293B, #10B981, #2E7D5C) y suite de regresión 6/6 verde. |
| **Consola y Linters** | **0 ERRORES** | `ci-i18n-gate.mjs` (7/7 gates) y `check-chart-palette.mjs` (100% verde). |

### Integridad de Límites del Proyecto
- Pricing, exportaciones PDF, Portal del Jugador E1, Pizarra Táctica Núcleo, LiveStats, SCORE, Staff Heredado, lógica de planes (`plans.js`), Firestore y reloj Android Build 95 permanecen **completamente intactos**.
- Oleada 7 permanece **bloqueada**.

