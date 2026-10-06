/**
 * scripts/generate-tier1-locales.mjs
 * Generador y validador de diccionarios Tier 1 para Míster11
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const esPath = path.resolve(rootDir, 'src/i18n/locales/es.js');
const enPath = path.resolve(rootDir, 'src/i18n/locales/en.js');

async function main() {
  const { es } = await import('file:///' + esPath.replace(/\\/g, '/'));
  const { en } = await import('file:///' + enPath.replace(/\\/g, '/'));

  // Claves obligatorias del catálogo clínico y de ejercicios
  const catalogKeys = {
    es: {
      'exerciseCatalog.categories.warmup': 'Calentamiento',
      'exerciseCatalog.categories.main': 'Parte Principal',
      'exerciseCatalog.categories.cooldown': 'Vuelta a la calma',
      'exerciseCatalog.phases.fase1': 'Fase 1: Carrera y Calentamiento Dinámico',
      'exerciseCatalog.phases.fase2': 'Fase 2: Fuerza, Pliometría y Equilibrio',
      'exerciseCatalog.phases.fase3': 'Fase 3: Carrera a Alta Velocidad y Cambios de Dirección',
      'exerciseCatalog.sourceLabel': 'Fuente',
      'exerciseCatalog.clinicalFallbackNotice': 'Contenido clínico oficial en español'
    },
    es419: {
      'exerciseCatalog.categories.warmup': 'Calentamiento',
      'exerciseCatalog.categories.main': 'Parte Principal',
      'exerciseCatalog.categories.cooldown': 'Vuelta a la calma',
      'exerciseCatalog.phases.fase1': 'Fase 1: Carrera y Calentamiento Dinámico',
      'exerciseCatalog.phases.fase2': 'Fase 2: Fuerza, Pliometría y Equilibrio',
      'exerciseCatalog.phases.fase3': 'Fase 3: Carrera a Alta Velocidad y Cambios de Dirección',
      'exerciseCatalog.sourceLabel': 'Fuente',
      'exerciseCatalog.clinicalFallbackNotice': 'Contenido clínico oficial en español'
    },
    en: {
      'exerciseCatalog.categories.warmup': 'Warm-Up',
      'exerciseCatalog.categories.main': 'Main Part',
      'exerciseCatalog.categories.cooldown': 'Cool-Down',
      'exerciseCatalog.phases.fase1': 'Phase 1: Running & Dynamic Warm-Up',
      'exerciseCatalog.phases.fase2': 'Phase 2: Strength, Plyometrics & Balance',
      'exerciseCatalog.phases.fase3': 'Phase 3: High-Speed Running & Cutting Movements',
      'exerciseCatalog.sourceLabel': 'Source',
      'exerciseCatalog.clinicalFallbackNotice': 'Clinical content shown in English'
    },
    pt: {
      'exerciseCatalog.categories.warmup': 'Aquecimento',
      'exerciseCatalog.categories.main': 'Parte Principal',
      'exerciseCatalog.categories.cooldown': 'Volta à calma',
      'exerciseCatalog.phases.fase1': 'Fase 1: Corrida e Aquecimento Dinâmico',
      'exerciseCatalog.phases.fase2': 'Fase 2: Força, Pliometria e Equilíbrio',
      'exerciseCatalog.phases.fase3': 'Fase 3: Corrida em Alta Velocidade e Mudanças de Direção',
      'exerciseCatalog.sourceLabel': 'Fonte',
      'exerciseCatalog.clinicalFallbackNotice': 'Conteúdo clínico oficial em português (CBF / FIFA 11+)'
    },
    fr: {
      'exerciseCatalog.categories.warmup': 'Échauffement',
      'exerciseCatalog.categories.main': 'Partie Principale',
      'exerciseCatalog.categories.cooldown': 'Retour au calme',
      'exerciseCatalog.phases.fase1': 'Phase 1 : Course & Échauffement Dynamique',
      'exerciseCatalog.phases.fase2': 'Phase 2 : Force, Pliométrie & Équilibre',
      'exerciseCatalog.phases.fase3': 'Phase 3 : Course à Haute Vitesse & Changements de Direction',
      'exerciseCatalog.sourceLabel': 'Source',
      'exerciseCatalog.clinicalFallbackNotice': 'Contenu clinique officiel en français (FFF ESVP / FIFA 11+)'
    },
    id: {
      'exerciseCatalog.categories.warmup': 'Pemanasan',
      'exerciseCatalog.categories.main': 'Menu Utama',
      'exerciseCatalog.categories.cooldown': 'Pendinginan',
      'exerciseCatalog.phases.fase1': 'Fase 1: Lari & Pemanasan Dinamis',
      'exerciseCatalog.phases.fase2': 'Fase 2: Kekuatan, Pliometrik & Keseimbangan',
      'exerciseCatalog.phases.fase3': 'Fase 3: Lari Cepat & Gerakan Memotong',
      'exerciseCatalog.sourceLabel': 'Sumber',
      'exerciseCatalog.clinicalFallbackNotice': 'Konten klinis ditampilkan dalam bahasa Spanyol (dokumen PSSI sedang ditranskripsi)'
    }
  };

  // Inyectar en ES y EN base
  Object.assign(es, catalogKeys.es);
  Object.assign(en, catalogKeys.en);

  // 1. GENERAR ES-419
  const es419 = { ...es, ...catalogKeys.es419 };
  const latamReplacements = [
    [/petos/gi, 'casacas'],
    [/peto/gi, 'casaca'],
    [/colchoneta/gi, 'tapete'],
    [/mancuernas/gi, 'pesas'],
    [/mancuerna/gi, 'pesa'],
    [/botellín/gi, 'termo'],
    [/ordenador/gi, 'computadora'],
    [/móvil/gi, 'celular']
  ];

  for (const [key, val] of Object.entries(es419)) {
    if (typeof val === 'string') {
      let mod = val;
      if (!key.includes('code') && !key.includes('url')) {
        for (const [re, rep] of latamReplacements) {
          mod = mod.replace(re, rep);
        }
      }
      es419[key] = mod;
    }
  }

  // 2. Glosarios
  const glossaryPT = {
    'DASHBOARD': 'PAINEL DE CONTROLE',
    'PIZARRA TÁCTICA': 'QUADRO TÁTICO',
    'MI EQUIPO': 'MEU TIME',
    'SESIONES': 'SESSÕES',
    'PLANIFICACIÓN': 'PLANEJAMENTO',
    'TESTS': 'TESTES',
    'PARTIDOS': 'JOGOS',
    'IA GENERADORA': 'IA GERADORA',
    'ADMINISTRACIÓN': 'ADMINISTRAÇÃO',
    'GUARDAR': 'SALVAR',
    'ELIMINAR': 'EXCLUIR',
    'AÑADIR': 'ADICIONAR',
    'CANCELAR': 'CANCELAR',
    'CONFIRMAR': 'CONFIRMAR',
    'EDITAR': 'EDITAR',
    'CERRAR': 'FECHAR',
    'EXPORTAR PDF': 'EXPORTAR PDF',
    'VOLVER': 'VOLTAR',
    'FILTRAR': 'FILTRAR',
    'BUSCAR': 'BUSCAR',
    'Sí': 'Sim',
    'No': 'Não',
    'Titular': 'Titular',
    'Suplente': 'Reserva',
    'Local': 'Mandante',
    'Visitante': 'Visitante',
    'Presente': 'Presente',
    'Ausente': 'Ausente',
    'Justificado': 'Justificado',
    'Lesionado': 'Lesionado',
    'Oficial': 'Oficial',
    'Amistoso': 'Amistoso',
    'Sin datos': 'Sem dados',
    'Óptimo': 'Ótimo',
    'Riesgo': 'Risco',
    'Guardando...': 'Salvando...',
    'Correo electrónico': 'E-mail',
    'Notificaciones': 'Notificações',
    'Exportar': 'Exportar',
    'Importar': 'Importar',
    'Configuración': 'Configurações',
    'Idioma': 'Idioma',
    'Jugadores': 'Jogadores',
    'Entrenador': 'Treinador',
    'Segundo Entrenador': 'Auxiliar Técnico',
    'Preparador Físico': 'Preparador Físico',
    'Fisioterapeuta': 'Fisioterapeuta',
    'Delegado': 'Diretor / Delegado',
    'Calentamiento': 'Aquecimento',
    'Parte Principal': 'Parte Principal',
    'Vuelta a la calma': 'Volta à calma',
    'Fuerza': 'Força',
    'Resistencia': 'Resistência',
    'Velocidad': 'Velocidade',
    'Flexibilidad': 'Flexibilidade',
    'Coordinación': 'Coordenação',
    'Técnica': 'Técnica',
    'Táctica': 'Tática',
    'Fútbol 11': 'Futebol 11',
    'Fútbol 7': 'Futebol 7',
    'Fútbol 8': 'Futebol 8',
    'Fútbol Sala': 'Futsal',
    'Portero': 'Goleiro',
    'Defensa': 'Defensor',
    'Centrocampista': 'Meio-campista',
    'Delantero': 'Atacante'
  };

  const glossaryFR = {
    'DASHBOARD': 'TABLEAU DE BORD',
    'PIZARRA TÁCTICA': 'TABLEAU TACTIQUE',
    'MI EQUIPO': 'MON ÉQUIPE',
    'SESIONES': 'SÉANCES',
    'PLANIFICACIÓN': 'PLANIFICATION',
    'TESTS': 'TESTS',
    'PARTIDOS': 'MATCHS',
    'IA GENERADORA': 'IA GÉNÉRATIVE',
    'ADMINISTRACIÓN': 'ADMINISTRATION',
    'GUARDAR': 'ENREGISTRER',
    'ELIMINAR': 'SUPPRIMER',
    'AÑADIR': 'AJOUTER',
    'CANCELAR': 'ANNULER',
    'CONFIRMAR': 'CONFIRMER',
    'EDITAR': 'MODIFIER',
    'CERRAR': 'FERMER',
    'EXPORTAR PDF': 'EXPORTER PDF',
    'VOLVER': 'RETOUR',
    'FILTRAR': 'FILTRER',
    'BUSCAR': 'RECHERCHER',
    'Sí': 'Oui',
    'No': 'Non',
    'Titular': 'Titulaire',
    'Suplente': 'Remplaçant',
    'Local': 'Domicile',
    'Visitante': 'Extérieur',
    'Presente': 'Présent',
    'Ausente': 'Absent',
    'Justificado': 'Excusé',
    'Lesionado': 'Blessé',
    'Oficial': 'Officiel',
    'Amistoso': 'Amical',
    'Sin datos': 'Aucune donnée',
    'Óptimo': 'Optimal',
    'Riesgo': 'Risque',
    'Guardando...': 'Enregistrement...',
    'Correo electrónico': 'E-mail',
    'Notificaciones': 'Notifications',
    'Exportar': 'Exporter',
    'Importar': 'Importer',
    'Configuración': 'Paramètres',
    'Idioma': 'Langue',
    'Jugadores': 'Joueurs',
    'Entrenador': 'Entraîneur',
    'Segundo Entrenador': 'Entraîneur Adjoint',
    'Preparador Físico': 'Préparateur Physique',
    'Fisioterapeuta': 'Kinésithérapeute',
    'Delegado': 'Délégué',
    'Calentamiento': 'Échauffement',
    'Parte Principal': 'Partie Principale',
    'Vuelta a la calma': 'Retour au calme',
    'Fuerza': 'Force',
    'Resistencia': 'Endurance',
    'Velocidad': 'Vitesse',
    'Flexibilidad': 'Souplesse',
    'Coordinación': 'Coordination',
    'Técnica': 'Technique',
    'Táctica': 'Tactique',
    'Fútbol 11': 'Football à 11',
    'Fútbol 7': 'Football à 7',
    'Fútbol 8': 'Football à 8',
    'Fútbol Sala': 'Futsal',
    'Portero': 'Gardien',
    'Defensa': 'Défenseur',
    'Centrocampista': 'Milieu de terrain',
    'Delantero': 'Attaquant'
  };

  const glossaryID = {
    'DASHBOARD': 'DASBOR',
    'PIZARRA TÁCTICA': 'PAPAN TAKTIK',
    'MI EQUIPO': 'TIM SAYA',
    'SESIONES': 'SESI LATIHAN',
    'PLANIFICACIÓN': 'PERENCANAAN',
    'TESTS': 'TES & EVALUASI',
    'PARTIDOS': 'PERTANDINGAN',
    'IA GENERADORA': 'AI GENERATOR',
    'ADMINISTRACIÓN': 'ADMINISTRASI',
    'GUARDAR': 'SIMPAN',
    'ELIMINAR': 'HAPUS',
    'AÑADIR': 'TAMBAH',
    'CANCELAR': 'BATAL',
    'CONFIRMAR': 'KONFIRMASI',
    'EDITAR': 'EDIT',
    'CERRAR': 'TUTUP',
    'EXPORTAR PDF': 'EKSPOR PDF',
    'VOLVER': 'KEMBALI',
    'FILTRAR': 'FILTER',
    'BUSCAR': 'CARI',
    'Sí': 'Ya',
    'No': 'Tidak',
    'Titular': 'Starter',
    'Suplente': 'Cadangan',
    'Local': 'Kandang',
    'Visitante': 'Tandang',
    'Presente': 'Hadir',
    'Ausente': 'Absen',
    'Justificado': 'Izin',
    'Lesionado': 'Cedera',
    'Oficial': 'Resmi',
    'Amistoso': 'Persahabatan',
    'Sin datos': 'Tidak ada data',
    'Óptimo': 'Optimal',
    'Riesgo': 'Risiko',
    'Guardando...': 'Menyimpan...',
    'Correo electrónico': 'Email',
    'Notificaciones': 'Notifikasi',
    'Exportar': 'Ekspor',
    'Importar': 'Impor',
    'Configuración': 'Pengaturan',
    'Idioma': 'Bahasa',
    'Jugadores': 'Pemain',
    'Entrenador': 'Pelatih Kepala',
    'Segundo Entrenador': 'Asisten Pelatih',
    'Preparador Físico': 'Pelatih Fisik',
    'Fisioterapeuta': 'Fisioterapis',
    'Delegado': 'Manajer Tim',
    'Calentamiento': 'Pemanasan',
    'Parte Principal': 'Menu Utama',
    'Vuelta a la calma': 'Pendinginan',
    'Fuerza': 'Kekuatan',
    'Resistencia': 'Daya Tahan',
    'Velocidad': 'Kecepatan',
    'Flexibilidad': 'Kelenturan',
    'Coordinación': 'Koordinasi',
    'Técnica': 'Teknik',
    'Táctica': 'Taktik',
    'Fútbol 11': 'Sepak Bola 11',
    'Fútbol 7': 'Sepak Bola 7',
    'Fútbol 8': 'Sepak Bola 8',
    'Fútbol Sala': 'Futsal',
    'Portero': 'Kiper',
    'Defensa': 'Bek',
    'Centrocampista': 'Gelandang',
    'Delantero': 'Penyerang'
  };

  function translateDict(baseDict, glossary, targetLang) {
    const result = {};
    for (const [key, enText] of Object.entries(en)) {
      const esText = es[key] || '';
      
      if (glossary[esText]) {
        result[key] = glossary[esText];
        continue;
      }

      let translated = enText;
      if (targetLang === 'pt') {
        translated = translated
          .replace(/\bSave\b/g, 'Salvar')
          .replace(/\bDelete\b/g, 'Excluir')
          .replace(/\bCancel\b/g, 'Cancelar')
          .replace(/\bConfirm\b/g, 'Confirmar')
          .replace(/\bEdit\b/g, 'Editar')
          .replace(/\bClose\b/g, 'Fechar')
          .replace(/\bBack\b/g, 'Voltar')
          .replace(/\bSearch\b/g, 'Buscar')
          .replace(/\bFilter\b/g, 'Filtrar')
          .replace(/\bDownload\b/g, 'Baixar')
          .replace(/\bExport\b/g, 'Exportar')
          .replace(/\bImport\b/g, 'Importar')
          .replace(/\bTeam\b/g, 'Time')
          .replace(/\bPlayers\b/g, 'Jogadores')
          .replace(/\bPlayer\b/g, 'Jogador')
          .replace(/\bMatches\b/g, 'Jogos')
          .replace(/\bMatch\b/g, 'Jogo')
          .replace(/\bSessions\b/g, 'Sessões')
          .replace(/\bSession\b/g, 'Sessão')
          .replace(/\bExercises\b/g, 'Exercícios')
          .replace(/\bExercise\b/g, 'Exercício')
          .replace(/\bTactical Board\b/g, 'Quadro Tático')
          .replace(/\bSettings\b/g, 'Configurações')
          .replace(/\bLoading\.\.\.\b/g, 'Carregando...')
          .replace(/\bSaving\.\.\.\b/g, 'Salvando...');
      } else if (targetLang === 'fr') {
        translated = translated
          .replace(/\bSave\b/g, 'Enregistrer')
          .replace(/\bDelete\b/g, 'Supprimer')
          .replace(/\bCancel\b/g, 'Annuler')
          .replace(/\bConfirm\b/g, 'Confirmer')
          .replace(/\bEdit\b/g, 'Modifier')
          .replace(/\bClose\b/g, 'Fermer')
          .replace(/\bBack\b/g, 'Retour')
          .replace(/\bSearch\b/g, 'Rechercher')
          .replace(/\bFilter\b/g, 'Filtrer')
          .replace(/\bDownload\b/g, 'Télécharger')
          .replace(/\bExport\b/g, 'Exporter')
          .replace(/\bImport\b/g, 'Importer')
          .replace(/\bTeam\b/g, 'Équipe')
          .replace(/\bPlayers\b/g, 'Joueurs')
          .replace(/\bPlayer\b/g, 'Joueur')
          .replace(/\bMatches\b/g, 'Matchs')
          .replace(/\bMatch\b/g, 'Match')
          .replace(/\bSessions\b/g, 'Séances')
          .replace(/\bSession\b/g, 'Séance')
          .replace(/\bExercises\b/g, 'Exercices')
          .replace(/\bExercise\b/g, 'Exercice')
          .replace(/\bTactical Board\b/g, 'Tableau Tactique')
          .replace(/\bSettings\b/g, 'Paramètres')
          .replace(/\bLoading\.\.\.\b/g, 'Chargement...')
          .replace(/\bSaving\.\.\.\b/g, 'Enregistrement...');
      } else if (targetLang === 'id') {
        translated = translated
          .replace(/\bSave\b/g, 'Simpan')
          .replace(/\bDelete\b/g, 'Hapus')
          .replace(/\bCancel\b/g, 'Batal')
          .replace(/\bConfirm\b/g, 'Konfirmasi')
          .replace(/\bEdit\b/g, 'Edit')
          .replace(/\bClose\b/g, 'Tutup')
          .replace(/\bBack\b/g, 'Kembali')
          .replace(/\bSearch\b/g, 'Cari')
          .replace(/\bFilter\b/g, 'Filter')
          .replace(/\bDownload\b/g, 'Unduh')
          .replace(/\bExport\b/g, 'Ekspor')
          .replace(/\bImport\b/g, 'Impor')
          .replace(/\bTeam\b/g, 'Tim')
          .replace(/\bPlayers\b/g, 'Pemain')
          .replace(/\bPlayer\b/g, 'Pemain')
          .replace(/\bMatches\b/g, 'Pertandingan')
          .replace(/\bMatch\b/g, 'Pertandingan')
          .replace(/\bSessions\b/g, 'Sesi Latihan')
          .replace(/\bSession\b/g, 'Sesi Latihan')
          .replace(/\bExercises\b/g, 'Latihan')
          .replace(/\bExercise\b/g, 'Latihan')
          .replace(/\bTactical Board\b/g, 'Papan Taktik')
          .replace(/\bSettings\b/g, 'Pengaturan')
          .replace(/\bLoading\.\.\.\b/g, 'Memuat...')
          .replace(/\bSaving\.\.\.\b/g, 'Menyimpan...');
      }

      result[key] = translated || enText;
    }
    return result;
  }

  const pt = { ...translateDict(en, glossaryPT, 'pt'), ...catalogKeys.pt };
  const fr = { ...translateDict(en, glossaryFR, 'fr'), ...catalogKeys.fr };
  const id = { ...translateDict(en, glossaryID, 'id'), ...catalogKeys.id };

  // Escribir todos los archivos
  fs.writeFileSync(esPath, 'export const es = ' + JSON.stringify(es, null, 2) + ';\nexport default es;\n', 'utf8');
  fs.writeFileSync(enPath, 'export const en = ' + JSON.stringify(en, null, 2) + ';\nexport default en;\n', 'utf8');
  fs.writeFileSync(path.resolve(rootDir, 'src/i18n/locales/es-419.js'), 'export const es419 = ' + JSON.stringify(es419, null, 2) + ';\nexport default es419;\n', 'utf8');
  fs.writeFileSync(path.resolve(rootDir, 'src/i18n/locales/pt.js'), 'export const pt = ' + JSON.stringify(pt, null, 2) + ';\nexport default pt;\n', 'utf8');
  fs.writeFileSync(path.resolve(rootDir, 'src/i18n/locales/fr.js'), 'export const fr = ' + JSON.stringify(fr, null, 2) + ';\nexport default fr;\n', 'utf8');
  fs.writeFileSync(path.resolve(rootDir, 'src/i18n/locales/id.js'), 'export const id = ' + JSON.stringify(id, null, 2) + ';\nexport default id;\n', 'utf8');

  console.log(`✅ Diccionarios Tier 1 sincronizados (Total claves por lengua: ${Object.keys(es).length})`);
}

main().catch(err => {
  console.error('Error generando locales Tier 1:', err);
  process.exit(1);
});
