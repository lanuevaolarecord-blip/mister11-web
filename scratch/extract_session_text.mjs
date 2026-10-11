import { generateSessionPDF, tPdf } from '../src/utils/pdfGenerator.js';
import { PDFParse } from 'pdf-parse';

const sessionMockBurriana = {
  id: 'ses_burriana_01',
  title: 'SESIÓN BURRIANA B - 06/10/2026',
  date: '2026-10-06',
  time: '18:30',
  duration: 90,
  intensity: 'Alta',
  category: 'Juvenil',
  material: 'Conos, balones, petos, porterías reducidas',
  objective: 'Mejorar la trancision ofensiva y la presion tras perdida (sejun plan semanal de balón)',
  blocks: [
    {
      name: 'Rondo 4v2 de presion',
      type: 'Posesión',
      duration: 20,
      description: 'Presion coordinada tras perdida de balon sin giados.',
      clinicalCue: 'Prevención isquiosurales con desaceleración progresiva'
    }
  ],
  players: ['p1', 'p2'],
  notes: '' // Sin notas registradas para auditar Carril A
};

const activeTeamBurriana = {
  id: 'team_burriana',
  nombre: 'BURRIANA B',
  categoria: 'Juvenil B'
};

const playersMock = [
  { id: 'p1', name: 'Héctor Gómez', number: 7, position: 'DEL' },
  { id: 'p2', name: 'Álvaro Ramos', number: 10, position: 'MCO' }
];

async function extractText(loc) {
  const doc = await generateSessionPDF(sessionMockBurriana, activeTeamBurriana, [], [], playersMock, [], loc);
  const buf = Buffer.from(doc.output('arraybuffer'));
  const parser = new PDFParse({ data: buf });
  const res = await parser.getText();
  return res.text;
}

async function main() {
  const locales = ['es', 'pt', 'fr', 'id'];
  const results = {};
  for (const loc of locales) {
    results[loc] = await extractText(loc);
  }

  console.log('=== EXTRACT_RESULTS_START ===');
  for (const loc of locales) {
    console.log(`\n=================== [IDIOMA: ${loc.toUpperCase()}] ===================`);
    console.log(results[loc].trim());
    console.log(`=================== [FIN ${loc.toUpperCase()}] ===================\n`);
  }
  console.log('=== EXTRACT_RESULTS_END ===');
}

main().catch(console.error);
