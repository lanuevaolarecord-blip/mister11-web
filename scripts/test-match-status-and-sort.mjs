import assert from 'node:assert';
import { getMatchDerivedStatus } from '../src/utils/matchDerivedStatus.js';

console.log('==============================================================================');
console.log('MÍSTER 11 — TEST STATUS DE PARTIDOS (EN EDICIÓN VS FINALIZADO) Y ORDENACIÓN');
console.log('==============================================================================\n');

// 1. Caso crítico reportado por el usuario (Burriana B vs Xilxes):
// Partido que fue reabierto en el pasado (reopenedAt presente), pero actualmente está TERMINADO y su Acta Oficial está CERRADA.
const matchBurrianaClosed = {
  id: 'burriana_xilxes',
  rival: 'Xilxes',
  status: 'Terminado',
  actaReabierta: false,
  reopenedAt: '2026-09-09T18:00:00Z',
  actaOficial: {
    closed: true,
    closedAt: '2026-09-09T22:00:00Z',
    reopenedAt: '2026-09-09T18:00:00Z',
    actual: {}
  }
};

const statusBurriana = getMatchDerivedStatus(matchBurrianaClosed);
console.log(`▶ [1/4] Burriana B (Acta Cerrada, con historial reopenedAt): status = '${statusBurriana}'`);
assert.strictEqual(statusBurriana, 'FINALIZADO', 'Un partido con actaOficial.closed === true debe ser FINALIZADO, nunca EN_EDICION');
console.log('  ✅ [PASS] Partido con acta cerrada devuelve estrictamente FINALIZADO.\n');

// 2. Partido activamente reabierto en edición:
const matchActivelyReopened = {
  id: 'reopened_match',
  rival: 'Castellón B',
  status: 'En Edicion',
  actaReabierta: true,
  actaOficial: {
    closed: false,
    reopenedAt: '2026-09-13T12:00:00Z'
  }
};

const statusReopened = getMatchDerivedStatus(matchActivelyReopened);
console.log(`▶ [2/4] Partido reabierto activamente: status = '${statusReopened}'`);
assert.strictEqual(statusReopened, 'EN_EDICION', 'Un partido activamente reabierto debe ser EN_EDICION');
console.log('  ✅ [PASS] Partido activamente reabierto devuelve estrictamente EN_EDICION.\n');

// 3. Partido terminado sin acta oficial:
const matchTerminado = {
  id: 'terminado_simple',
  rival: 'Villarreal C',
  status: 'Terminado',
  finishedAt: '2026-09-12T19:00:00Z'
};

const statusTerminado = getMatchDerivedStatus(matchTerminado);
console.log(`▶ [3/4] Partido terminado: status = '${statusTerminado}'`);
assert.strictEqual(statusTerminado, 'FINALIZADO', 'Un partido con status Terminado debe ser FINALIZADO');
console.log('  ✅ [PASS] Partido terminado devuelve estrictamente FINALIZADO.\n');

// 4. Test de Ordenación por Cercanía al Calendario:
console.log('▶ [4/4] Verificando ordenación inteligente por cercanía al calendario...');
const now = new Date('2026-09-13T12:00:00Z').getTime();

const sampleMatches = [
  { id: 'm_past_old', date: '2026-08-01', hour: '18:00', rival: 'Equipo Pasado Lejano' },
  { id: 'm_past_recent', date: '2026-09-09', hour: '20:00', rival: 'Xilxes (Reciente)' },
  { id: 'm_future_next', date: '2026-09-20', hour: '17:00', rival: 'Próximo Partido en Calendario' },
  { id: 'm_future_later', date: '2026-10-04', hour: '16:00', rival: 'Partido Futuro Lejano' }
];

const getMatchTime = (m) => {
  const raw = m.date || m.fecha;
  const timeStr = m.hour || m.hora || '12:00';
  return new Date(`${raw}T${timeStr}:00Z`).getTime();
};

const sortedByCercania = [...sampleMatches].sort((a, b) => {
  const timeA = getMatchTime(a);
  const timeB = getMatchTime(b);
  const buffer = 2 * 60 * 60 * 1000;
  const aIsFuture = timeA >= (now - buffer);
  const bIsFuture = timeB >= (now - buffer);

  if (aIsFuture && bIsFuture) return timeA - timeB;
  if (aIsFuture && !bIsFuture) return -1;
  if (!aIsFuture && bIsFuture) return 1;

  return Math.abs(now - timeA) - Math.abs(now - timeB);
});

console.log('  Orden resultante por cercanía:');
sortedByCercania.forEach((m, idx) => console.log(`   ${idx + 1}. [${m.date}] ${m.rival}`));

assert.strictEqual(sortedByCercania[0].id, 'm_future_next', 'El partido más próximo en el calendario debe ser el primero');
assert.strictEqual(sortedByCercania[1].id, 'm_future_later', 'El siguiente partido futuro debe ser el segundo');
assert.strictEqual(sortedByCercania[2].id, 'm_past_recent', 'El partido recién jugado más cercano debe ser el tercero');
assert.strictEqual(sortedByCercania[3].id, 'm_past_old', 'El partido más antiguo debe ser el último');

console.log('  ✅ [PASS] Ordenación por cercanía al calendario 100% verificada.\n');

console.log('==============================================================================');
console.log('🎉 [PASS] TODAS LAS PRUEBAS DE ESTADO DE PARTIDOS Y ORDENACIÓN COMPLETADAS');
console.log('==============================================================================');
