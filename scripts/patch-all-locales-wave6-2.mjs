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
  },
  'attendance.register.excludeTitle': {
    es: 'Excluye esta sesión del cómputo de asistencia de toda la plantilla',
    'es-419': 'Excluye esta sesión del cómputo de asistencia de todo el plantel',
    en: 'Excludes this session from attendance calculation for the entire squad',
    pt: 'Exclui esta sessão do cálculo de presença de todo o elenco',
    fr: "Exclut cette séance du calcul des présences de tout l'effectif",
    id: 'Mengecualikan sesi ini dari perhitungan kehadiran seluruh skuad'
  },
  'attendance.register.prefillTooltip': {
    es: 'Prellenar desde respuestas del jugador sin pisar ediciones manuales',
    'es-419': 'Prellenar desde respuestas del jugador sin sobreescribir ediciones manuales',
    en: 'Pre-fill from player RSVP responses (manual edits preserved)',
    pt: 'Preencher a partir das respostas do jogador sem sobrescrever edições manuais',
    fr: 'Pré-remplir à partir des réponses des joueurs sans écraser les modifications manuelles',
    id: 'Isi otomatis dari tanggapan RSVP pemain tanpa menimpa perubahan manual'
  },
  'attendance.chart.guideCoach': {
    es: 'Guía de Interpretación para el Cuerpo Técnico',
    'es-419': 'Guía de Interpretación para el Cuerpo Técnico',
    en: 'Guide for Coaches (Simple Terms)',
    pt: 'Guia de Interpretação para a Comissão Técnica',
    fr: "Guide d'interprétation pour le staff technique",
    id: 'Panduan Interpretasi untuk Staf Pelatih'
  },
  'attendance.chart.guideStep1': {
    es: '1. Puntos y Cronología',
    'es-419': '1. Puntos y Cronología',
    en: '1. Timeline & Events',
    pt: '1. Pontos e Cronologia',
    fr: '1. Points et Chronologie',
    id: '1. Garis Waktu & Peristiwa'
  },
  'attendance.chart.guideStep2': {
    es: '2. Línea Verde',
    'es-419': '2. Línea Verde',
    en: '2. Green Line',
    pt: '2. Linha Verde',
    fr: '2. Ligne Verte',
    id: '2. Garis Hijau'
  },
  'attendance.chart.guideStep3': {
    es: '3. Cruce de Alerta',
    'es-419': '3. Cruce de Alerta',
    en: '3. Warning Cross',
    pt: '3. Cruzamento de Alerta',
    fr: "3. Croisement d'Alerte",
    id: '3. Persilangan Peringatan'
  },
  'attendance.chart.guideStep4': {
    es: '4. Toca para Detalle',
    'es-419': '4. Toca para Detalle',
    en: '4. Interactive Detail',
    pt: '4. Toque para Detalhes',
    fr: '4. Touchez pour le détail',
    id: '4. Ketuk untuk Rincian'
  },
  'attendance.chart.filtersTitle': {
    es: 'Series de la Gráfica y Explicación (Pulsa para Mostrar/Ocultar)',
    'es-419': 'Series de la Gráfica y Explicación (Pulsa para Mostrar/Ocultar)',
    en: 'Series Filters & Explanations (Click to Show/Hide)',
    pt: 'Séries do Gráfico e Explicação (Clique para Mostrar/Ocultar)',
    fr: 'Séries du Graphique et Explication (Cliquer pour Afficher/Masquer)',
    id: 'Seri Grafik & Penjelasan (Klik untuk Tampilkan/Sembunyikan)'
  },
  'attendance.register.extraSession': {
    es: 'Sesión Extra',
    'es-419': 'Sesión Extra',
    en: 'Extra Session',
    pt: 'Sessão Extra',
    fr: 'Séance Supplémentaire',
    id: 'Sesi Tambahan'
  },
  'attendance.toast.allMarkedPresent': {
    es: 'Todos marcados como presentes (Oficial)',
    'es-419': 'Todos marcados como presentes (Oficial)',
    en: 'All marked as present (Official)',
    pt: 'Todos marcados como presentes (Oficial)',
    fr: 'Tous marqués comme présents (Officiel)',
    id: 'Semua ditandai hadir (Resmi)'
  },
  'attendance.toast.selectFirst': {
    es: 'Selecciona primero una sesión o partido',
    'es-419': 'Selecciona primero una sesión o partido',
    en: 'Select a session or match first',
    pt: 'Selecione primeiro uma sessão ou partida',
    fr: "Sélectionnez d'abord une séance ou un match",
    id: 'Pilih sesi atau pertandingan terlebih dahulu'
  },
  'attendance.toast.suspendedSaved': {
    es: 'Sesión marcada como suspendida y guardada',
    'es-419': 'Sesión marcada como suspendida y guardada',
    en: 'Session marked as suspended and saved',
    pt: 'Sessão marcada como suspensa e salva',
    fr: 'Séance marquée comme suspendue et enregistrée',
    id: 'Sesi ditandai ditangguhkan dan disimpan'
  },
  'attendance.toast.savedSuccess': {
    es: 'Asistencia guardada con éxito',
    'es-419': 'Asistencia guardada con éxito',
    en: 'Attendance saved successfully',
    pt: 'Presença salva com sucesso',
    fr: 'Présences enregistrées avec succès',
    id: 'Kehadiran berhasil disimpan'
  },
  'attendance.toast.errorSaving': {
    es: 'Error al guardar la asistencia',
    'es-419': 'Error al guardar la asistencia',
    en: 'Error saving attendance',
    pt: 'Erro ao salvar a presença',
    fr: "Erreur lors de l'enregistrement des présences",
    id: 'Kesalahan saat menyimpan kehadiran'
  },
  'attendance.toast.sheetClosed': {
    es: 'Acta oficial cerrada y minutos calculados',
    'es-419': 'Acta oficial cerrada y minutos calculados',
    en: 'Match sheet closed and minutes calculated',
    pt: 'Súmula oficial fechada e minutos calculados',
    fr: 'Feuille de match officielle clôturée et minutes calculées',
    id: 'Laporan resmi ditutup dan menit dihitung'
  },
  'attendance.toast.errorClosing': {
    es: 'Error al cerrar el acta oficial',
    'es-419': 'Error al cerrar el acta oficial',
    en: 'Error closing match sheet',
    pt: 'Erro ao fechar a súmula oficial',
    fr: 'Erreur lors de la clôture de la feuille de match',
    id: 'Kesalahan saat menutup laporan resmi'
  },
  'attendance.toast.sheetReopened': {
    es: 'Acta reabierta para edición',
    'es-419': 'Acta reabierta para edición',
    en: 'Match sheet reopened for editing',
    pt: 'Súmula reaberta para edição',
    fr: 'Feuille de match rouverte pour modification',
    id: 'Laporan pertandingan dibuka kembali untuk diedit'
  },
  'attendance.toast.errorReopening': {
    es: 'Error al reabrir el acta',
    'es-419': 'Error al reabrir el acta',
    en: 'Error reopening match sheet',
    pt: 'Erro ao reabrir a súmula',
    fr: 'Erreur lors de la réouverture de la feuille de match',
    id: 'Kesalahan saat membuka kembali laporan'
  },
  'attendance.toast.noResponses': {
    es: 'Ningún jugador ha respondido aún',
    'es-419': 'Ningún jugador ha respondido aún',
    en: 'No player responses yet',
    pt: 'Nenhum jogador respondeu ainda',
    fr: "Aucun joueur n'a encore répondu",
    id: 'Belum ada tanggapan pemain'
  },
  'attendance.register.sessionsAndMatches': {
    es: 'Sesiones y Partidos',
    'es-419': 'Sesiones y Partidos',
    en: 'Sessions and Matches',
    pt: 'Sessões e Partidas',
    fr: 'Séances et Matchs',
    id: 'Sesi dan Pertandingan'
  },
  'exports.report.title': {
    es: 'INFORME OFICIAL POST-PARTIDO',
    'es-419': 'INFORME OFICIAL POST-PARTIDO',
    en: 'OFFICIAL POST-MATCH REPORT',
    pt: 'RELATÓRIO OFICIAL PÓS-JOGO',
    fr: "RAPPORT OFFICIEL D'APRÈS-MATCH",
    id: 'LAPORAN RESMI PASCA PERTANDINGAN'
  },
  'exports.report.match_info': {
    es: 'Ficha del Partido',
    'es-419': 'Ficha del Partido',
    en: 'Match Sheet',
    pt: 'Ficha do Jogo',
    fr: 'Fiche du Match',
    id: 'Lembar Pertandingan'
  },
  'exports.report.page': {
    es: 'Página',
    'es-419': 'Página',
    en: 'Page',
    pt: 'Página',
    fr: 'Page',
    id: 'Halaman'
  },
  'exports.report.sec1_lineup': {
    es: '1. Alineación Táctica con Fotografías',
    'es-419': '1. Alineación Táctica con Fotografías',
    en: '1. Tactical Lineup with Photos',
    pt: '1. Escalação Tática com Fotografias',
    fr: '1. Composition Tactique avec Photos',
    id: '1. Susunan Taktis dengan Foto'
  },
  'exports.report.sec2_timeline': {
    es: '2. Marcador y Cronología de Eventos',
    'es-419': '2. Marcador y Cronología de Eventos',
    en: '2. Scoreboard & Event Timeline',
    pt: '2. Placar e Linha do Tempo de Eventos',
    fr: "2. Tableau d'Affichage et Chronologie des Événements",
    id: '2. Papan Skor & Kronologi Pertandingan'
  },
  'exports.report.sec3_momentum': {
    es: "3. Momentum y Posesión por Bloques 15'",
    'es-419': "3. Momentum y Posesión por Bloques 15'",
    en: "3. Momentum & 15-Minute Possession Blocks",
    pt: "3. Momentum e Posse por Blocos de 15'",
    fr: "3. Momentum et Possession par Tranches de 15'",
    id: "3. Momentum & Penguasaan Bola per Blok 15 Menit"
  },
  'exports.report.sec4_bars': {
    es: '4. Barras Comparativas (10 Métricas)',
    'es-419': '4. Barras Comparativas (10 Métricas)',
    en: '4. Comparative Bars (10 Metrics)',
    pt: '4. Barras Comparativas (10 Métricas)',
    fr: '4. Barres Comparatives (10 Métriques)',
    id: '4. Batang Komparatif (10 Metrik)'
  },
  'exports.report.sec5_radar': {
    es: '5. Radar Comparativo Propio vs Rival',
    'es-419': '5. Radar Comparativo Propio vs Rival',
    en: '5. Comparative Radar (Own vs Opponent)',
    pt: '5. Radar Comparativo (Próprio vs Rival)',
    fr: '5. Radar Comparatif (Équipe vs Adversaire)',
    id: '5. Radar Komparatif (Tim Sendiri vs Lawan)'
  },
  'exports.report.sec6_top5': {
    es: '6. Métricas Top-5 Diferenciales',
    'es-419': '6. Métricas Top-5 Diferenciales',
    en: '6. Top-5 Differential Metrics',
    pt: '6. Top 5 Métricas Diferenciais',
    fr: '6. Top 5 Métriques Différencielles',
    id: '6. 5 Metrik Pembeda Teratas'
  },
  'exports.report.sec7_shots': {
    es: '7. Mapas de Tiros y Modelo xG-Lite',
    'es-419': '7. Mapas de Tiros y Modelo xG-Lite',
    en: '7. Shot Maps & xG-Lite Model',
    pt: '7. Mapas de Finalizações e Modelo xG-Lite',
    fr: '7. Cartes des Tirs et Modèle xG-Lite',
    id: '7. Peta Tembakan & Model xG-Lite'
  },
  'exports.report.sec8_tactics': {
    es: '8. Campo y Táctica (Pasillos, ABP y Territorio)',
    'es-419': '8. Campo y Táctica (Pasillos, ABP y Territorio)',
    en: '8. Pitch & Tactics (Corridors, Set Pieces & Territory)',
    pt: '8. Campo e Tática (Corredores, Bolas Paradas e Território)',
    fr: '8. Terrain et Tactique (Couloirs, Coups de Pied Arrêtés et Territoire)',
    id: '8. Lapangan & Taktik (Koridor, Bola Mati & Teritori)'
  },
  'exports.report.sec9_gk': {
    es: '9. Exigencia y Rendimiento de Portería',
    'es-419': '9. Exigencia y Rendimiento de Portería',
    en: '9. Goalkeeping Exertion & Performance',
    pt: '9. Exigência e Desempenho dos Goleiros',
    fr: '9. Exigence et Performance des Gardiens',
    id: '9. Beban Kerja & Kinerja Penjaga Gawang'
  },
  'exports.report.sec10_players': {
    es: '10. Rendimiento Individual y Plantilla',
    'es-419': '10. Rendimiento Individual y Plantilla',
    en: '10. Individual Player Stats & Squad Performance',
    pt: '10. Desempenho Individual e do Elenco',
    fr: "10. Performance Individuelle et de l'Effectif",
    id: '10. Kinerja Individu Pemain & Skuad'
  },
  'exports.report.sec11_swot': {
    es: '11. Análisis DAFO Táctico y Recomendaciones',
    'es-419': '11. Análisis DAFO Táctico y Recomendaciones',
    en: '11. Tactical SWOT Analysis & Recommendations',
    pt: '11. Análise SWOT Tática e Recomendações',
    fr: '11. Analyse SWOT Tactique et Recommandations',
    id: '11. Analisis SWOT Taktis & Rekomendasi'
  },
  'exports.report.sec_photos': {
    es: 'Fotografías y Capturas del Encuentro',
    'es-419': 'Fotografías y Capturas del Encuentro',
    en: 'Match Photos & Evidence',
    pt: 'Fotos e Registros da Partida',
    fr: 'Photos et Captures du Match',
    id: 'Foto & Bukti Pertandingan'
  },
  'exports.report.tactical_analysis': {
    es: 'Análisis Táctico',
    'es-419': 'Análisis Táctico',
    en: 'Tactical Analysis',
    pt: 'Análise Tática',
    fr: 'Analyse Tactique',
    id: 'Analisis Taktis'
  },
  'exports.test.title': {
    es: 'INFORME DE EVALUACIÓN Y TESTS',
    'es-419': 'INFORME DE EVALUACIÓN Y TESTS',
    en: 'EVALUATION & TESTS REPORT',
    pt: 'RELATÓRIO DE AVALIAÇÃO E TESTES',
    fr: "RAPPORT D'ÉVALUATION ET DE TESTS",
    id: 'LAPORAN EVALUASI & TES'
  },
  'exports.test.physical': {
    es: 'Test Físico',
    'es-419': 'Test Físico',
    en: 'Physical Test',
    pt: 'Teste Físico',
    fr: 'Test Physique',
    id: 'Tes Fisik'
  },
  'exports.test.technical': {
    es: 'Test Técnico',
    'es-419': 'Test Técnico',
    en: 'Technical Test',
    pt: 'Teste Técnico',
    fr: 'Test Technique',
    id: 'Tes Teknis'
  },
  'exports.test.tactical': {
    es: 'Test Táctico',
    'es-419': 'Test Táctico',
    en: 'Tactical Test',
    pt: 'Teste Tático',
    fr: 'Test Tactique',
    id: 'Tes Taktis'
  },
  'exports.test.mental': {
    es: 'Test Mental / Psicosocial',
    'es-419': 'Test Mental / Psicosocial',
    en: 'Mental / Psychosocial Test',
    pt: 'Teste Mental / Psicossocial',
    fr: 'Test Mental / Psychosocial',
    id: 'Tes Mental / Psikososial'
  },
  'exports.test.attendance': {
    es: 'Asistencia',
    'es-419': 'Asistencia',
    en: 'Attendance',
    pt: 'Presença',
    fr: 'Présence',
    id: 'Kehadiran'
  },
  'exports.test.radar_title': {
    es: 'Perfil Integral de Rendimiento',
    'es-419': 'Perfil Integral de Rendimiento',
    en: 'Comprehensive Performance Profile',
    pt: 'Perfil Integral de Desempenho',
    fr: 'Profil Global de Performance',
    id: 'Profil Kinerja Komprehensif'
  },
  'exports.test.recommendation_title': {
    es: 'Recomendaciones Individuales',
    'es-419': 'Recomendaciones Individuales',
    en: 'Individual Recommendations',
    pt: 'Recomendações Individuais',
    fr: 'Recommandations Individuelles',
    id: 'Rekomendasi Individu'
  },
  'exports.test.table_test': {
    es: 'Test',
    'es-419': 'Test',
    en: 'Test',
    pt: 'Teste',
    fr: 'Test',
    id: 'Tes'
  },
  'exports.test.table_score': {
    es: 'Puntuación',
    'es-419': 'Puntuación',
    en: 'Score',
    pt: 'Pontuação',
    fr: 'Score',
    id: 'Skor'
  },
  'exports.test.table_interp': {
    es: 'Interpretación',
    'es-419': 'Interpretación',
    en: 'Interpretation',
    pt: 'Interpretação',
    fr: 'Interprétation',
    id: 'Interpretasi'
  },
  'exports.gk.title': {
    es: 'RENDIMIENTO DE PORTERÍA',
    'es-419': 'RENDIMIENTO DE PORTERÍA',
    en: 'GOALKEEPING PERFORMANCE',
    pt: 'DESEMPENHO DO GOLEIRO',
    fr: 'PERFORMANCE DU GARDIEN',
    id: 'KINERJA PENJAGA GAWANG'
  },
  'exports.gk.goalkeeper': {
    es: 'Portero',
    'es-419': 'Portero',
    en: 'Goalkeeper',
    pt: 'Goleiro',
    fr: 'Gardien',
    id: 'Kiper'
  },
  'exports.gk.saves': {
    es: 'Paradas',
    'es-419': 'Paradas',
    en: 'Saves',
    pt: 'Defesas',
    fr: 'Arrêts',
    id: 'Penyelamatan'
  },
  'exports.gk.conceded': {
    es: 'Encajados',
    'es-419': 'Encajados',
    en: 'Goals Conceded',
    pt: 'Gols Sofridos',
    fr: 'Buts Encaissés',
    id: 'Kebobolan'
  },
  'exports.gk.cleanSheets': {
    es: 'Porterías a Cero',
    'es-419': 'Porterías a Cero',
    en: 'Clean Sheets',
    pt: 'Jogos sem Sofrer Gols',
    fr: 'Clean Sheets',
    id: 'Clean Sheet'
  },
  'exports.gk.savePct': {
    es: '% Eficacia',
    'es-419': '% Eficacia',
    en: '% Save Efficiency',
    pt: '% Eficácia',
    fr: '% Efficacité',
    id: '% Efisiensi'
  },
  'exports.gk.penaltySaves': {
    es: 'Pen. Parados',
    'es-419': 'Pen. Parados',
    en: 'Penalties Saved',
    pt: 'Pênaltis Defendidos',
    fr: 'Penaltys Arrêtés',
    id: 'Penalti Diselamatkan'
  },
  'exports.gk.claims': {
    es: 'Salidas / Rechaces',
    'es-419': 'Salidas / Rechaces',
    en: 'Claims / Punches',
    pt: 'Saídas / Rebatidas',
    fr: 'Sorties / Dégagements',
    id: 'Tangkap / Tinju Bola'
  },
  'exports.gk.errors': {
    es: 'Errores',
    'es-419': 'Errores',
    en: 'Errors',
    pt: 'Erros',
    fr: 'Erreurs',
    id: 'Kesalahan'
  },
  'exports.gk.rating': {
    es: 'Nota GK',
    'es-419': 'Nota GK',
    en: 'GK Rating',
    pt: 'Nota Goleiro',
    fr: 'Note Gardien',
    id: 'Nilai Kiper'
  },
  'attendance.register.closingSheet': {
    es: 'Cerrando Acta...',
    'es-419': 'Cerrando Acta...',
    en: 'Closing Sheet...',
    pt: 'Fechando Súmula...',
    fr: 'Clôture de la Feuille...',
    id: 'Menutup Laporan...'
  },
  'common.player': {
    es: 'Jugador',
    'es-419': 'Jugador',
    en: 'Player',
    pt: 'Jogador',
    fr: 'Joueur',
    id: 'Pemain'
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
