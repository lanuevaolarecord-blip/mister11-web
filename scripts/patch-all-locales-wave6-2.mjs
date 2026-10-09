/**
 * scripts/patch-all-locales-wave6-2.mjs
 * Sincronización e inyección masiva de traducciones profesionales en los 6 idiomas activos:
 * ES, ES-419, EN, PT, FR, ID.
 * 
 * Cobertura completa para:
 * - Planificación (pestañas, tarjetas, días, avisos, volumen, macrociclo pills)
 * - Tests (título, botones, categorías, catálogo, registro, plantilla, unidades)
 * - Partidos (título, calendarios, filtros, ordenación, estados, campos, formaciones)
 * - IA Generadora (título, subtítulo, biblioteca, modos, formulario, materiales, canvas placeholder)
 * - Mi Equipo (título, subtítulo plural, publicación anuncio, pestañas, posiciones, métricas tarjeta)
 * - PDFs / Descargables y limpieza de caracteres españoles o tokens cruzados en PT, FR, ID.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.resolve(__dirname, '../src/i18n/locales');

const LOCALES = ['es', 'es-419', 'en', 'pt', 'fr', 'id'];

// Paquete de traducciones canónicas y simétricas
const TRANSLATIONS = {
  // ── PLANIFICACIÓN ──
  'plan.strategicPlanning': {
    es: 'PLANIFICACIÓN ESTRATÉGICA',
    'es-419': 'PLANIFICACIÓN ESTRATÉGICA',
    en: 'STRATEGIC PLANNING',
    pt: 'PLANEJAMENTO ESTRATÉGICO',
    fr: 'PLANIFICATION STRATÉGIQUE',
    id: 'PERENCANAAN STRATEGIS'
  },
  'plan.exportPdf': {
    es: 'EXPORTAR PDF',
    'es-419': 'EXPORTAR PDF',
    en: 'EXPORT PDF',
    pt: 'EXPORTAR PDF',
    fr: 'EXPORTER PDF',
    id: 'EKSPOR PDF'
  },
  'plan.save': {
    es: 'GUARDAR',
    'es-419': 'GUARDAR',
    en: 'SAVE',
    pt: 'SALVAR',
    fr: 'ENREGISTRER',
    id: 'SIMPAN'
  },
  'plan.saving': {
    es: 'GUARDANDO...',
    'es-419': 'GUARDANDO...',
    en: 'SAVING...',
    pt: 'SALVANDO...',
    fr: 'ENREGISTREMENT...',
    id: 'MENYIMPAN...'
  },
  'plan.tab.macrociclo': {
    es: 'MACROCICLO',
    'es-419': 'MACROCICLO',
    en: 'MACROCYCLE',
    pt: 'MACROCICLO',
    fr: 'MACROCYCLE',
    id: 'MAKROSIKLUS'
  },
  'plan.tab.mesociclo': {
    es: 'MESOCICLO',
    'es-419': 'MESOCICLO',
    en: 'MESOCYCLE',
    pt: 'MESOCICLO',
    fr: 'MÉSOCYCLE',
    id: 'MESOSIKLUS'
  },
  'plan.tab.microciclo': {
    es: 'MICROCICLO',
    'es-419': 'MICROCICLO',
    en: 'MICROCYCLE',
    pt: 'MICROCICLO',
    fr: 'MICROCYCLE',
    id: 'MIKROSIKLUS'
  },
  'plan.tab.objetivos': {
    es: 'OBJETIVOS',
    'es-419': 'OBJETIVOS',
    en: 'OBJECTIVES',
    pt: 'OBJETIVOS',
    fr: 'OBJECTIFS',
    id: 'TUJUAN'
  },
  'plan.dateRange': {
    es: 'RANGO DE FECHAS',
    'es-419': 'RANGO DE FECHAS',
    en: 'DATE RANGE',
    pt: 'INTERVALO DE DATAS',
    fr: 'PLAGE DE DATES',
    id: 'RENTANG TANGGAL'
  },
  'plan.start': {
    es: 'Inicio',
    'es-419': 'Inicio',
    en: 'Start',
    pt: 'Início',
    fr: 'Début',
    id: 'Mulai'
  },
  'plan.end': {
    es: 'Fin',
    'es-419': 'Fin',
    en: 'End',
    pt: 'Fim',
    fr: 'Fin',
    id: 'Selesai'
  },
  'plan.trainingDays': {
    es: 'DÍAS DE ENTRENAMIENTO',
    'es-419': 'DÍAS DE ENTRENAMIENTO',
    en: 'TRAINING DAYS',
    pt: 'DIAS DE TREINAMENTO',
    fr: "JOURS D'ENTRAÎNEMENT",
    id: 'HARI LATIHAN'
  },
  'plan.matchDay': {
    es: '⚽ Día de Match:',
    'es-419': '⚽ Día de Match:',
    en: '⚽ Match Day:',
    pt: '⚽ Dia de Jogo:',
    fr: '⚽ Jour de Match :',
    id: '⚽ Hari Pertandingan:'
  },
  'plan.fatigaWarning': {
    es: '⚠️ Entreno en MD-1 — potencial fatiga',
    'es-419': '⚠️ Entreno en MD-1 — potencial fatiga',
    en: '⚠️ Training on MD-1 — potential fatigue',
    pt: '⚠️ Treino em MD-1 — fadiga potencial',
    fr: '⚠️ Entraînement en J-1 — fatigue potentielle',
    id: '⚠️ Latihan di H-1 — potensi kelelahan'
  },
  'plan.reubicarBtn': {
    es: '🔄 Reubicar entreno según nuevo día',
    'es-419': '🔄 Reubicar entreno según nuevo día',
    en: '🔄 Reschedule training based on new day',
    pt: '🔄 Reorganizar treinos conforme novo dia',
    fr: '🔄 Reprogrammer les entraînements selon le nouveau jour',
    id: '🔄 Jadwalkan ulang latihan sesuai hari baru'
  },
  'plan.category': {
    es: 'CATEGORÍA',
    'es-419': 'CATEGORÍA',
    en: 'CATEGORY',
    pt: 'CATEGORIA',
    fr: 'CATÉGORIE',
    id: 'KATEGORI'
  },
  'plan.categoryPlaceholder': {
    es: 'Ej: Infantil A',
    'es-419': 'Ej: Infantil A',
    en: 'e.g.: Under-14 A',
    pt: 'Ex: Infantil A',
    fr: 'Ex. : U14 A',
    id: 'Cth: U-14 A'
  },
  'plan.coach': {
    es: 'COACH',
    'es-419': 'COACH',
    en: 'COACH',
    pt: 'TREINADOR',
    fr: 'ENTRAÎNEUR',
    id: 'PELATIH'
  },
  'plan.coachPlaceholder': {
    es: 'Nombre entrenador',
    'es-419': 'Nombre entrenador',
    en: 'Coach name',
    pt: 'Nome do treinador',
    fr: "Nom de l'entraîneur",
    id: 'Nama pelatih'
  },
  'plan.seasonVolume': {
    es: 'VOLUMEN TEMPORADA',
    'es-419': 'VOLUMEN TEMPORADA',
    en: 'SEASON VOLUME',
    pt: 'VOLUME DA TEMPORADA',
    fr: 'VOLUME DE LA SAISON',
    id: 'VOLUME MUSIM'
  },
  'plan.volumeUnit': {
    es: 'min/sem',
    'es-419': 'min/sem',
    en: 'min/wk',
    pt: 'min/sem',
    fr: 'min/sem',
    id: 'mnt/mgg'
  },
  'plan.totalMinutesLabel': {
    es: 'minutos totales',
    'es-419': 'minutos totales',
    en: 'total minutes',
    pt: 'minutos totais',
    fr: 'minutes totales',
    id: 'menit total'
  },
  'plan.sessionDuration': {
    es: 'Duración sesión:',
    'es-419': 'Duración sesión:',
    en: 'Session duration:',
    pt: 'Duração da sessão:',
    fr: 'Durée de la séance :',
    id: 'Durasi sesi:'
  },
  'plan.seasonObjective': {
    es: 'OBJETIVO GENERAL DE LA TEMPORADA',
    'es-419': 'OBJETIVO GENERAL DE LA TEMPORADA',
    en: 'OVERALL SEASON OBJECTIVE',
    pt: 'OBJETIVO GERAL DA TEMPORADA',
    fr: 'OBJECTIF GÉNÉRAL DE LA SAISON',
    id: 'TUJUAN UMUM MUSIM'
  },
  'plan.seasonObjectivePlaceholder': {
    es: 'Introduce el objetivo general de la temporada...',
    'es-419': 'Introduce el objetivo general de la temporada...',
    en: 'Enter the overall season objective...',
    pt: 'Digite o objetivo geral da temporada...',
    fr: "Entrez l'objectif général de la saison...",
    id: 'Masukkan tujuan umum musim...'
  },
  'plan.metrics.macrocycle': {
    es: 'MACRO-CICLO',
    'es-419': 'MACRO-CICLO',
    en: 'MACROCYCLE',
    pt: 'MACROCICLO',
    fr: 'MACROCYCLE',
    id: 'MAKROSIKLUS'
  },
  'plan.metrics.mesocycle': {
    es: 'MESO-CICLO',
    'es-419': 'MESO-CICLO',
    en: 'MESOCYCLE',
    pt: 'MESOCICLO',
    fr: 'MÉSOCYCLE',
    id: 'MESOSIKLUS'
  },
  'plan.metrics.mesocyclesOverview': {
    es: 'MESO-CICLOS (VISTA GENERAL)',
    'es-419': 'MESO-CICLOS (VISTA GENERAL)',
    en: 'MESOCYCLES (OVERVIEW)',
    pt: 'MESOCICLOS (VISÃO GERAL)',
    fr: "MÉSOCYCLES (VUE D'ENSEMBLE)",
    id: 'MESOSIKLUS (IKHTISAR)'
  },
  'plan.chip.sessions': {
    es: 'Sesiones',
    'es-419': 'Sesiones',
    en: 'Sessions',
    pt: 'Sessões',
    fr: 'Séances',
    id: 'Sesi'
  },
  'plan.chip.work': {
    es: 'Trabajo',
    'es-419': 'Trabajo',
    en: 'Work',
    pt: 'Trabalho',
    fr: 'Travail',
    id: 'Kerja'
  },
  'plan.chip.compet': {
    es: 'Compet.',
    'es-419': 'Compet.',
    en: 'Compet.',
    pt: 'Compet.',
    fr: 'Compét.',
    id: 'Kompet.'
  },
  'plan.metricSessions': {
    es: 'SESIONES',
    'es-419': 'SESIONES',
    en: 'SESSIONS',
    pt: 'SESSÕES',
    fr: 'SÉANCES',
    id: 'SESI'
  },

  // ── TESTS Y EVALUACIONES ──
  'tests.title': {
    es: 'EVALUACIÓN Y TESTS',
    'es-419': 'EVALUACIÓN Y TESTS',
    en: 'EVALUATION & TESTS',
    pt: 'AVALIAÇÃO E TESTES',
    fr: 'ÉVALUATION & TESTS',
    id: 'EVALUASI & TES'
  },
  'tests.resetSeason': {
    es: '🗑️ Reiniciar Temporada',
    'es-419': '🗑️ Reiniciar Temporada',
    en: '🗑️ Reset Season',
    pt: '🗑️ Reiniciar Temporada',
    fr: '🗑️ Réinitialiser la Saison',
    id: '🗑️ Reset Musim'
  },
  'tests.resetSeasonTooltip': {
    es: 'Elimina todos los datos de evaluaciones de los jugadores para iniciar una nueva temporada',
    'es-419': 'Elimina todos los datos de evaluaciones de los jugadores para iniciar una nueva temporada',
    en: 'Deletes all player evaluation data to start a new season',
    pt: 'Exclui todos os dados de avaliação dos jogadores para iniciar uma nova temporada',
    fr: 'Supprime toutes les données d’évaluation des joueurs pour commencer une nouvelle saison',
    id: 'Menghapus semua data evaluasi pemain untuk memulai musim baru'
  },
  'tests.demoData': {
    es: '🎯 Datos Demo',
    'es-419': '🎯 Datos Demo',
    en: '🎯 Demo Data',
    pt: '🎯 Dados de Demonstração',
    fr: '🎯 Données Démo',
    id: '🎯 Data Demo'
  },
  'tests.demoDataTooltip': {
    es: 'Inserta evaluaciones ficticias para ver cómo funcionan las gráficas',
    'es-419': 'Inserta evaluaciones ficticias para ver cómo funcionan las gráficas',
    en: 'Inserts mock evaluations to preview chart functionality',
    pt: 'Insere avaliações fictícias para pré-visualizar os gráficos',
    fr: 'Insère des évaluations fictives pour prévisualiser les graphiques',
    id: 'Memasukkan evaluasi tiruan untuk melihat grafik'
  },
  'tests.exportReport': {
    es: 'Exportar Informe',
    'es-419': 'Exportar Informe',
    en: 'Export Report',
    pt: 'Exportar Relatório',
    fr: 'Exporter le Rapport',
    id: 'Ekspor Laporan'
  },
  'tests.tab.fisicos': {
    es: 'Tests Físicos',
    'es-419': 'Tests Físicos',
    en: 'Physical Tests',
    pt: 'Testes Físicos',
    fr: 'Tests Physiques',
    id: 'Tes Fisik'
  },
  'tests.tab.psicosociales': {
    es: 'Psicosociales',
    'es-419': 'Psicosociales',
    en: 'Psychosocial',
    pt: 'Psicossociais',
    fr: 'Tests Psychosociaux',
    id: 'Psikososial'
  },
  'tests.tab.prevencion': {
    es: 'Prevención y Salud',
    'es-419': 'Prevención y Salud',
    en: 'Prevention & Health',
    pt: 'Prevenção e Saúde',
    fr: 'Prévention et Santé',
    id: 'Pencegahan & Kesehatan'
  },
  'tests.tab.historial': {
    es: 'Historial',
    'es-419': 'Historial',
    en: 'History',
    pt: 'Histórico',
    fr: 'Historique',
    id: 'Riwayat'
  },
  'tests.tab.comparativa': {
    es: 'Comparativa',
    'es-419': 'Comparativa',
    en: 'Comparison',
    pt: 'Comparativo',
    fr: 'Comparatif',
    id: 'Perbandingan'
  },
  'tests.catalogPhysical': {
    es: 'Catálogo de Pruebas: FÍSICOS',
    'es-419': 'Catálogo de Pruebas: FÍSICOS',
    en: 'Test Catalog: PHYSICAL',
    pt: 'Catálogo de Testes: FÍSICOS',
    fr: 'Catalogue de Tests : PHYSIQUES',
    id: 'Katalog Tes: FISIK'
  },
  'tests.catalogPsychosocial': {
    es: 'Catálogo de Pruebas: PSICOSOCIALES',
    'es-419': 'Catálogo de Pruebas: PSICOSOCIALES',
    en: 'Test Catalog: PSYCHOSOCIAL',
    pt: 'Catálogo de Testes: PSICOSSOCIAIS',
    fr: 'Catalogue de Tests : PSYCHOSOCIAUX',
    id: 'Katalog Tes: PSIKOSOSIAL'
  },
  'tests.metricUnit': {
    es: 'Medida: ',
    'es-419': 'Medida: ',
    en: 'Metric: ',
    pt: 'Medida: ',
    fr: 'Unité : ',
    id: 'Satuan: '
  },
  'tests.record': {
    es: 'REGISTRAR',
    'es-419': 'REGISTRAR',
    en: 'RECORD',
    pt: 'REGISTRAR',
    fr: 'ENREGISTRER',
    id: 'CATAT'
  },
  'tests.template': {
    es: 'PLANTILLA',
    'es-419': 'PLANTILLA',
    en: 'TEMPLATE',
    pt: 'MODELO',
    fr: 'MODÈLE',
    id: 'TEMPLAT'
  },

  // ── PARTIDOS ──
  'partidos.tab.lista': {
    es: 'Partidos',
    'es-419': 'Partidos',
    en: 'Matches',
    pt: 'Partidas',
    fr: 'Matchs',
    id: 'Pertandingan'
  },
  'partidos.tab.analisis': {
    es: 'Análisis',
    'es-419': 'Análisis',
    en: 'Analysis',
    pt: 'Análise',
    fr: 'Analyse',
    id: 'Analisis'
  },
  'match.management.title': {
    es: 'GESTIÓN DE PARTIDOS',
    'es-419': 'GESTIÓN DE PARTIDOS',
    en: 'MATCH MANAGEMENT',
    pt: 'GESTÃO DE PARTIDAS',
    fr: 'GESTION DES MATCHS',
    id: 'MANAJEMEN PERTANDINGAN'
  },
  'match.btn.pdfCalendar': {
    es: 'CALENDARIO PDF',
    'es-419': 'CALENDARIO PDF',
    en: 'PDF CALENDAR',
    pt: 'CALENDÁRIO PDF',
    fr: 'CALENDRIER PDF',
    id: 'KALENDER PDF'
  },
  'match.btn.exportIcs': {
    es: 'EXPORTAR ICS',
    'es-419': 'EXPORTAR ICS',
    en: 'EXPORT ICS',
    pt: 'EXPORTAR ICS',
    fr: 'EXPORTER ICS',
    id: 'EKSPOR ICS'
  },
  'match.btn.newMatch': {
    es: '+ NUEVO PARTIDO',
    'es-419': '+ NUEVO PARTIDO',
    en: '+ NEW MATCH',
    pt: '+ NOVA PARTIDA',
    fr: '+ NOUVEAU MATCH',
    id: '+ PERTANDINGAN BARU'
  },
  'match.filter.all': {
    es: 'Todos',
    'es-419': 'Todos',
    en: 'All',
    pt: 'Todos',
    fr: 'Tous',
    id: 'Semua'
  },
  'match.filter.pending': {
    es: 'Pendientes',
    'es-419': 'Pendientes',
    en: 'Pending',
    pt: 'Pendentes',
    fr: 'En attente',
    id: 'Tertunda'
  },
  'match.filter.finished': {
    es: 'Terminados',
    'es-419': 'Terminados',
    en: 'Finished',
    pt: 'Finalizadas',
    fr: 'Terminés',
    id: 'Selesai'
  },
  'match.sort.label': {
    es: 'Ordenar por',
    'es-419': 'Ordenar por',
    en: 'Sort by',
    pt: 'Ordenar por',
    fr: 'Trier par',
    id: 'Urutkan berdasarkan'
  },
  'match.sort.cercania': {
    es: 'Más cercanos a hoy',
    'es-419': 'Más cercanos a hoy',
    en: 'Closest to today',
    pt: 'Mais próxima de hoje',
    fr: "Plus proche d'aujourd'hui",
    id: 'Terdekat dari hari ini'
  },
  'match.sort.lejania': {
    es: 'Más lejanos a hoy',
    'es-419': 'Más lejanos a hoy',
    en: 'Farthest from today',
    pt: 'Mais distante de hoje',
    fr: "Plus éloigné d'aujourd'hui",
    id: 'Paling jauh dari hari ini'
  },
  'match.sort.fecha_asc': {
    es: 'Fecha (Próximos)',
    'es-419': 'Fecha (Próximos)',
    en: 'Date (Upcoming)',
    pt: 'Data (Próximas)',
    fr: 'Date (Prochains)',
    id: 'Tanggal (Mendatang)'
  },
  'match.sort.fecha_desc': {
    es: 'Fecha (Recientes)',
    'es-419': 'Fecha (Recientes)',
    en: 'Date (Recent)',
    pt: 'Data (Recentes)',
    fr: 'Date (Récents)',
    id: 'Tanggal (Terbaru)'
  },
  'match.sort.estado': {
    es: 'Por Estado / Prioridad',
    'es-419': 'Por Estado / Prioridad',
    en: 'By Status / Priority',
    pt: 'Por Status / Prioridade',
    fr: 'Par Statut / Priorité',
    id: 'Berdasarkan Status / Prioritas'
  },
  'match.view.cards': {
    es: 'Tarjetas',
    'es-419': 'Tarjetas',
    en: 'Cards',
    pt: 'Cartões',
    fr: 'Cartes',
    id: 'Kartu'
  },
  'match.view.detailed': {
    es: 'Detallado',
    'es-419': 'Detallado',
    en: 'Detailed',
    pt: 'Detalhado',
    fr: 'Détaillé',
    id: 'Rinci'
  },
  'match.status.finalizado': {
    es: 'FINALIZADO',
    'es-419': 'FINALIZADO',
    en: 'FINISHED',
    pt: 'FINALIZADO',
    fr: 'TERMINÉ',
    id: 'SELESAI'
  },
  'match.status.en_edicion': {
    es: 'EN EDICIÓN',
    'es-419': 'EN EDICIÓN',
    en: 'IN EDITION',
    pt: 'EM EDIÇÃO',
    fr: 'EN ÉDITION',
    id: 'DALAM EDITING'
  },
  'match.status.pendiente': {
    es: 'PENDIENTE',
    'es-419': 'PENDIENTE',
    en: 'PENDING',
    pt: 'PENDENTE',
    fr: 'EN ATTENTE',
    id: 'TERTUNDA'
  },
  'match.status.no_disputado': {
    es: 'NO DISPUTADO',
    'es-419': 'NO DISPUTADO',
    en: 'NOT PLAYED',
    pt: 'NÃO DISPUTADO',
    fr: 'NON DISPUTÉ',
    id: 'BELUM DIMAINKAN'
  },
  'match.defaultMyTeam': {
    es: 'Mi Equipo',
    'es-419': 'Mi Equipo',
    en: 'My Team',
    pt: 'Meu Time',
    fr: 'Mon Équipe',
    id: 'Tim Saya'
  },
  'match.defaultRival': {
    es: 'Rival',
    'es-419': 'Rival',
    en: 'Opponent',
    pt: 'Adversário',
    fr: 'Adversaire',
    id: 'Lawan'
  },
  'match.formationLabel': {
    es: 'Formación: ',
    'es-419': 'Formación: ',
    en: 'Formation: ',
    pt: 'Formação: ',
    fr: 'Formation : ',
    id: 'Formasi: '
  },
  'match.venue.local': {
    es: 'Campo Local',
    'es-419': 'Campo Local',
    en: 'Home Venue',
    pt: 'Campo Mandante',
    fr: 'Terrain Domicile',
    id: 'Kandang'
  },
  'match.venue.municipal': {
    es: 'Campo Municipal',
    'es-419': 'Campo Municipal',
    en: 'Municipal Stadium',
    pt: 'Estádio Municipal',
    fr: 'Stade Municipal',
    id: 'Stadion Kota'
  },
  'match.noVenue': {
    es: 'Sin ubicación',
    'es-419': 'Sin ubicación',
    en: 'No venue',
    pt: 'Sem local',
    fr: 'Sans lieu',
    id: 'Tanpa lokasi'
  },

  // ── IA GENERADORA ──
  'ia.title': {
    es: 'Asistente Táctico de IA',
    'es-419': 'Asistente Táctico de IA',
    en: 'AI Tactical Assistant',
    pt: 'Assistente Tático de IA',
    fr: "Assistant Tactique d'IA",
    id: 'Asisten Taktis AI'
  },
  'ia.subtitle': {
    es: 'DISEÑO INTELIGENTE DE SESIÓN DE ENTRENAMIENTO',
    'es-419': 'DISEÑO INTELIGENTE DE SESIÓN DE ENTRENAMIENTO',
    en: 'SMART TRAINING SESSION DESIGN',
    pt: 'DESIGN INTELIGENTE DE SESSÕES DE TREINO',
    fr: "CONCEPTION INTELLIGENTE DE SÉANCES D'ENTRAÎNEMENT",
    id: 'DESAIN SESI LATIHAN CERDAS'
  },
  'ia.libraryBtn': {
    es: '☁️ Biblioteca ({count})',
    'es-419': '☁️ Biblioteca ({count})',
    en: '☁️ Library ({count})',
    pt: '☁️ Biblioteca ({count})',
    fr: '☁️ Bibliothèque ({count})',
    id: '☁️ Pustaka ({count})'
  },
  'ia.modeTactical': {
    es: 'Ejercicio\nTáctico',
    'es-419': 'Ejercicio\nTáctico',
    en: 'Tactical\nDrill',
    pt: 'Exercício\nTático',
    fr: 'Exercice\nTactique',
    id: 'Latihan\nTaktis'
  },
  'ia.modePrevention': {
    es: 'Prevención /\nRecuperación',
    'es-419': 'Prevención /\nRecuperación',
    en: 'Prevention /\nRecovery',
    pt: 'Prevenção /\nRecuperação',
    fr: 'Prévention /\nRécupération',
    id: 'Pencegahan /\nPemulihan'
  },
  'ia.categoryAge': {
    es: 'CATEGORÍA / EDAD',
    'es-419': 'CATEGORÍA / EDAD',
    en: 'CATEGORY / AGE',
    pt: 'CATEGORIA / IDADE',
    fr: 'CATÉGORIE / ÂGE',
    id: 'KATEGORI / USIA'
  },
  'ia.selectPlaceholder': {
    es: 'Seleccionar...',
    'es-419': 'Seleccionar...',
    en: 'Select...',
    pt: 'Selecionar...',
    fr: 'Sélectionner...',
    id: 'Pilih...'
  },
  'ia.numPlayers': {
    es: 'Nº DE JUGADORES: {count}',
    'es-419': 'Nº DE JUGADORES: {count}',
    en: 'NO. OF PLAYERS: {count}',
    pt: 'Nº DE JOGADORES: {count}',
    fr: 'NB DE JOUEURS : {count}',
    id: 'JML PEMAIN: {count}'
  },
  'ia.mainObjective': {
    es: 'OBJETIVO PRINCIPAL',
    'es-419': 'OBJETIVO PRINCIPAL',
    en: 'MAIN OBJECTIVE',
    pt: 'OBJETIVO PRINCIPAL',
    fr: 'OBJECTIF PRINCIPAL',
    id: 'TUJUAN UTAMA'
  },
  'ia.materials': {
    es: 'MATERIALES',
    'es-419': 'MATERIALES',
    en: 'EQUIPMENT',
    pt: 'MATERIAIS',
    fr: 'MATÉRIEL',
    id: 'PERALATAN'
  },
  'ia.emptyPlaceholder': {
    es: 'Tu ejercicio aparecerá aquí',
    'es-419': 'Tu ejercicio aparecerá aquí',
    en: 'Your exercise will appear here',
    pt: 'Seu exercício aparecerá aqui',
    fr: 'Votre exercice apparaîtra ici',
    id: 'Latihan Anda akan muncul di sini'
  },
  'ia.mat.balls': {
    es: 'Balones',
    'es-419': 'Balones',
    en: 'Footballs',
    pt: 'Bolas',
    fr: 'Ballons',
    id: 'Bola'
  },
  'ia.mat.cones': {
    es: 'Conos',
    'es-419': 'Conos',
    en: 'Cones',
    pt: 'Cones',
    fr: 'Cônes',
    id: 'Kerucut'
  },
  'ia.mat.bibs': {
    es: 'Petos',
    'es-419': 'Petos',
    en: 'Bibs',
    pt: 'Coletes',
    fr: 'Chasubles',
    id: 'Rompi'
  },
  'ia.mat.goals': {
    es: 'Porterías',
    'es-419': 'Porterías',
    en: 'Goals',
    pt: 'Gols',
    fr: 'Buts',
    id: 'Gawang'
  },
  'ia.mat.ladder': {
    es: 'Escalera',
    'es-419': 'Escalera',
    en: 'Agility ladder',
    pt: 'Escada de agilidade',
    fr: "Échelle d'agilité",
    id: 'Tangga ketangkasan'
  },
  'ia.mat.hurdles': {
    es: 'Vallas',
    'es-419': 'Vallas',
    en: 'Hurdles',
    pt: 'Barreiras',
    fr: 'Haies',
    id: 'Rintangan'
  },

  // ── MI EQUIPO ──
  'equipo.title': {
    es: 'Gestión del Equipo',
    'es-419': 'Gestión del Equipo',
    en: 'Team Management',
    pt: 'Gestão da Equipe',
    fr: "Gestion de l'Équipe",
    id: 'Manajemen Tim'
  },
  'team.squadCount.one': {
    es: '{count} jugador en la plantilla',
    'es-419': '{count} jugador en la plantilla',
    en: '{count} player in squad',
    pt: '{count} jogador no elenco',
    fr: "{count} joueur dans l'effectif",
    id: '{count} pemain di skuad'
  },
  'team.squadCount.other': {
    es: '{count} jugadores en la plantilla',
    'es-419': '{count} jugadores en la plantilla',
    en: '{count} players in squad',
    pt: '{count} jogadores no elenco',
    fr: "{count} joueurs dans l'effectif",
    id: '{count} pemain di skuad'
  },
  'equipo.publishAnnouncement': {
    es: 'Publicar Comunicado',
    'es-419': 'Publicar Comunicado',
    en: 'Publish Announcement',
    pt: 'Publicar Comunicado',
    fr: 'Publier un Communiqué',
    id: 'Publikasikan Pengumuman'
  },
  'equipo.tab.squad': {
    es: 'Plantilla',
    'es-419': 'Plantilla',
    en: 'Squad',
    pt: 'Elenco',
    fr: 'Effectif',
    id: 'Skuad'
  },
  'equipo.tab.attendance': {
    es: 'Control de Asistencia',
    'es-419': 'Control de Asistencia',
    en: 'Attendance Tracking',
    pt: 'Controle de Presença',
    fr: 'Présence',
    id: 'Kehadiran'
  },
  'equipo.tab.staff': {
    es: 'Cuerpo Técnico',
    'es-419': 'Cuerpo Técnico',
    en: 'Technical Staff',
    pt: 'Comissão Técnica',
    fr: 'Staff Technique',
    id: 'Staf Pelatih'
  },
  'sessionRating.performanceTableTitle': {
    es: 'Rendimiento en Entrenos',
    'es-419': 'Rendimiento en Entrenos',
    en: 'Training Performance',
    pt: 'Desempenho nos Treinos',
    fr: 'Performance aux Entraînements',
    id: 'Performa Latihan'
  },
  'player.goalAbbr': {
    es: 'GOL',
    'es-419': 'GOL',
    en: 'GOAL',
    pt: 'GOL',
    fr: 'BUT',
    id: 'GOL'
  },
  'player.matchesAbbr': {
    es: 'PJ',
    'es-419': 'PJ',
    en: 'MP',
    pt: 'PJ',
    fr: 'MJ',
    id: 'MP'
  },
  'player.heightAbbr': {
    es: 'Alt',
    'es-419': 'Alt',
    en: 'Ht',
    pt: 'Alt',
    fr: 'Taille',
    id: 'Tinggi'
  },
  'player.noLinkedAccount': {
    es: 'Sin cuenta vinculada',
    'es-419': 'Sin cuenta vinculada',
    en: 'No linked account',
    pt: 'Sem conta vinculada',
    fr: 'Sans compte lié',
    id: 'Tanpa akun tertaut'
  },
  'player.age': {
    es: 'Edad',
    'es-419': 'Edad',
    en: 'Age',
    pt: 'Idade',
    fr: 'Âge',
    id: 'Usia'
  },
  'bottomnav.moreModules': {
    es: 'Módulos y Gestión',
    'es-419': 'Módulos y Gestión',
    en: 'Modules & Management',
    pt: 'Módulos e Gestão',
    fr: 'Modules & Gestion',
    id: 'Modul & Manajemen'
  },
  'tests.resources.title': {
    es: 'Recursos y Herramientas',
    'es-419': 'Recursos y Herramientas',
    en: 'Resources & Tools',
    pt: 'Recursos e Ferramentas',
    fr: 'Ressources & Outils',
    id: 'Sumber Daya & Alat'
  },
  'test.finishAndSend': {
    es: 'FINALIZAR Y ENVIAR AL MÍSTER',
    'es-419': 'FINALIZAR Y ENVIAR AL MÍSTER',
    en: 'FINISH AND SEND TO COACH',
    pt: 'FINALIZAR E ENVIAR AO TREINADOR',
    fr: "FINALISER ET ENVOYER À L'ENTRAÎNEUR",
    id: 'SELESAIKAN & KIRIM KE PELATIH'
  },
  'paywall.promoSectionTitle': {
    es: '🔑 ¿Tienes un código promocional o de prueba beta?',
    'es-419': '🔑 ¿Tienes un código promocional o de prueba beta?',
    en: '🔑 Have a promo or beta trial code?',
    pt: '🔑 Tem um código promocional ou de teste beta?',
    fr: "🔑 Avez-vous un code promotionnel ou d'essai bêta ?",
    id: '🔑 Punya kode promo atau uji coba beta?'
  },
  'auth.noAccount': {
    es: '¿No tienes cuenta?',
    'es-419': '¿No tienes cuenta?',
    en: "Don't have an account?",
    pt: 'Não tem uma conta?',
    fr: "Vous n'avez pas de compte ?",
    id: 'Belum punya akun?'
  },
  'auth.hasAccount': {
    es: '¿Ya tienes cuenta?',
    'es-419': '¿Ya tienes cuenta?',
    en: 'Already have an account?',
    pt: 'Já tem uma conta?',
    fr: 'Vous avez déjà un compte ?',
    id: 'Sudah punya akun?'
  },
  'auth.forgotPass': {
    es: '¿Olvidaste tu contraseña?',
    'es-419': '¿Olvidaste tu contraseña?',
    en: 'Forgot password?',
    pt: 'Esqueceu sua senha?',
    fr: 'Mot de passe oublié ?',
    id: 'Lupa kata sandi?'
  },
  'player.home.rsvpPrompt': {
    es: '¿Asistirás a esta sesión?',
    'es-419': '¿Asistirás a esta sesión?',
    en: 'Will you attend this session?',
    pt: 'Você participará desta sessão?',
    fr: 'Participerez-vous à cette séance ?',
    id: 'Apakah Anda akan menghadiri sesi ini?'
  },
  'player.home.greeting': {
    es: '¡Hola, {name}! 👋',
    'es-419': '¡Hola, {name}! 👋',
    en: 'Hello, {name}! 👋',
    pt: 'Olá, {name}! 👋',
    fr: 'Bonjour, {name} ! 👋',
    id: 'Halo, {name}! 👋'
  },
  'test.completedSuccess': {
    es: '¡Test {name} completado con éxito! ({pct}%)',
    'es-419': '¡Test {name} completado con éxito! ({pct}%)',
    en: 'Test {name} completed successfully! ({pct}%)',
    pt: 'Teste {name} concluído com sucesso! ({pct}%)',
    fr: 'Test {name} complété avec succès ! ({pct}%)',
    id: 'Tes {name} berhasil diselesaikan! ({pct}%)'
  },
  'player.home.almostGold': {
    es: '¡LOGRO CASI CONSEGUIDO! (ORO)',
    'es-419': '¡LOGRO CASI CONSEGUIDO! (ORO)',
    en: 'ACHIEVEMENT ALMOST UNLOCKED! (GOLD)',
    pt: 'CONQUISTA QUASE ALCANÇADA! (OURO)',
    fr: 'SUCCÈS PRESQUE DÉBLOQUÉ ! (OR)',
    id: 'PENCAPAIAN HAMPIR TERCAPAI! (EMAS)'
  },
  'player.home.almostSilver': {
    es: '¡LOGRO CASI CONSEGUIDO! (PLATA)',
    'es-419': '¡LOGRO CASI CONSEGUIDO! (PLATA)',
    en: 'ACHIEVEMENT ALMOST UNLOCKED! (SILVER)',
    pt: 'CONQUISTA QUASE ALCANÇADA! (PRATA)',
    fr: 'SUCCÈS PRESQUE DÉBLOQUÉ ! (ARGENT)',
    id: 'PENCAPAIAN HAMPIR TERCAPAI! (PERAK)'
  },
  'player.home.almostBronze': {
    es: '¡LOGRO CASI CONSEGUIDO! (BRONCE)',
    'es-419': '¡LOGRO CASI CONSEGUIDO! (BRONCE)',
    en: 'ACHIEVEMENT ALMOST UNLOCKED! (BRONZE)',
    pt: 'CONQUISTA QUASE ALCANÇADA! (BRONZE)',
    fr: 'SUCCÈS PRESQUE DÉBLOQUÉ ! (BRONZE)',
    id: 'PENCAPAIAN HAMPIR TERCAPAI! (PERUNGGU)'
  },
  'player.home.noAnnouncements': {
    es: 'No hay avisos recientes del entrenador.',
    'es-419': 'No hay avisos recientes del entrenador.',
    en: 'No recent announcements from coach.',
    pt: 'Não há avisos recentes do treinador.',
    fr: "Aucune annonce récente de l'entraîneur.",
    id: 'Tidak ada pengumuman terbaru dari pelatih.'
  }
};

async function patchAllLocales() {
  console.log('🔄 Sincronizando diccionarios con traducciones profesionales Wave 6.2...');

  for (const loc of LOCALES) {
    const filePath = path.join(localesDir, `${loc}.js`);
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    const mod = await import(fileUrl);
    const exportKey = loc === 'es-419' ? 'es419' : loc;
    const currentDict = { ...(mod[exportKey] || mod[loc] || Object.values(mod)[0]) };

    let updatedCount = 0;
    for (const [key, translations] of Object.entries(TRANSLATIONS)) {
      if (translations[loc]) {
        currentDict[key] = translations[loc];
        updatedCount++;
      }
    }

    // Reconstruir archivo JS manteniendo exports consistentes
    const sortedKeys = Object.keys(currentDict).sort();
    const orderedDict = {};
    for (const k of sortedKeys) {
      orderedDict[k] = currentDict[k];
    }

    const fileContent = `/**
 * Archivo de localización: ${loc.toUpperCase()}
 * Míster 11 - Sistema de Localización Canónico
 */

export const ${exportKey} = ${JSON.stringify(orderedDict, null, 2)};

export default ${exportKey};
`;

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    console.log(`✅ [${loc.toUpperCase()}] Diccionario actualizado con ${updatedCount} claves.`);
  }

  console.log('🎉 Parche de diccionarios finalizado con éxito.');
}

patchAllLocales().catch(err => {
  console.error('❌ Error al parchar diccionarios:', err);
  process.exit(1);
});
