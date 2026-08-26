import { 
  calculatePlayerAttendanceOnSchedule, 
  determineCallupRecommendation, 
  isEventPast, 
  toDateKey 
} from '../src/utils/attendanceMath.js';
import { 
  calculatePlayerAttendanceStats, 
  getPendingEvents, 
  getRealPct,
  getStreak 
} from '../src/utils/attendanceStatsHelper.js';

console.log('🧪 Iniciando batería exhaustiva de pruebas de asistencia...');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// Escenario 1: Jugador con 2 presentes, 1 ausente en 3 sesiones pasadas
const sessions1 = [
  { id: 's1', date: '2026-08-01', time: '10:00' },
  { id: 's2', date: '2026-08-02', time: '10:00' },
  { id: 's3', date: '2026-08-03', time: '10:00' }
];
const attendance1 = [
  { sessionId: 's1', date: '2026-08-01', records: { p1: { status: 'present' } } },
  { sessionId: 's2', date: '2026-08-02', records: { p1: { status: 'present' } } },
  { sessionId: 's3', date: '2026-08-03', records: { p1: { status: 'absent' } } }
];

const res1 = calculatePlayerAttendanceOnSchedule('p1', {
  sessions: sessions1,
  attendanceRecords: attendance1
});

assert(res1.scheduledPast === 3, '3 sesiones pasadas programadas');
assert(res1.present === 2, '2 presentes');
assert(res1.absent === 1, '1 ausente');
assert(res1.pct === 67, '% calculado: 2/3 = 67%');
assert(res1.status === 'risk', 'Estado: risk (<70%)');

// Escenario 2: Sesión suspendida se excluye de la base
const sessions2 = [
  { id: 's1', date: '2026-08-01', time: '10:00' },
  { id: 's2', date: '2026-08-02', time: '10:00', isSuspended: true },
  { id: 's3', date: '2026-08-03', time: '10:00' }
];
const attendance2 = [
  { sessionId: 's1', date: '2026-08-01', records: { p1: { status: 'present' } } },
  { sessionId: 's3', date: '2026-08-03', records: { p1: { status: 'present' } } }
];

const res2 = calculatePlayerAttendanceOnSchedule('p1', {
  sessions: sessions2,
  attendanceRecords: attendance2
});

assert(res2.scheduledPast === 2, 'Sesión suspendida excluida: base = 2');
assert(res2.pct === 100, '% calculado: 2/2 = 100%');
assert(res2.status === 'optimal', 'Estado: optimal');

// Escenario 3: Justificado y lesionado no penalizan el denominador
const sessions3 = [
  { id: 's1', date: '2026-08-01', time: '10:00' },
  { id: 's2', date: '2026-08-02', time: '10:00' },
  { id: 's3', date: '2026-08-03', time: '10:00' }
];
const attendance3 = [
  { sessionId: 's1', date: '2026-08-01', records: { p1: { status: 'present' } } },
  { sessionId: 's2', date: '2026-08-02', records: { p1: { status: 'justified' } } },
  { sessionId: 's3', date: '2026-08-03', records: { p1: { status: 'injured' } } }
];

const res3 = calculatePlayerAttendanceOnSchedule('p1', {
  sessions: sessions3,
  attendanceRecords: attendance3
});

assert(res3.eligible === 1, 'Eventos evaluables: 3 - 1 (J) - 1 (L) = 1');
assert(res3.pct === 100, '% calculado: 1/1 = 100%');
assert(res3.callupGuidance.recommendation === 'recommended', 'Recomendación: recommended');

// Escenario 4: Jugador suspendido disciplinariamente
const res4 = calculatePlayerAttendanceOnSchedule('p1', {
  sessions: sessions1,
  attendanceRecords: attendance1,
  player: { id: 'p1', isSuspended: true, suspensionReason: 'Tarjeta roja' }
});

assert(res4.callupGuidance.recommendation === 'no_convocar', 'Jugador suspendido -> no_convocar obligatorio');
assert(res4.callupGuidance.isSuspended === true, 'Flag isSuspended true');

// Escenario 5: Cero sesiones pasadas -> null / Sin datos
const sessions5 = [
  { id: 's_fut', date: '2029-01-01', time: '10:00' }
];
const res5 = calculatePlayerAttendanceOnSchedule('p1', {
  sessions: sessions5,
  attendanceRecords: []
});

assert(res5.hasData === false, 'hasData false cuando no hay sesiones pasadas');
assert(res5.pct === null, 'pct null cuando no hay sesiones pasadas');
assert(res5.status === 'no_data', 'status no_data');

// Escenario 6: getPendingEvents detecta sesiones pasadas sin registro
const pending = getPendingEvents(
  [
    { id: 's_past1', date: '2026-08-01', time: '10:00' },
    { id: 's_past2', date: '2026-08-02', time: '10:00' },
    { id: 's_fut', date: '2029-01-01', time: '10:00' }
  ],
  [],
  [
    { sessionId: 's_past1', date: '2026-08-01', records: { p1: { status: 'present' } } }
  ]
);

assert(pending.length === 1, '1 sesión pendiente detectada');
assert(pending[0].id === 's_past2', 's_past2 es la sesión sin registro');

console.log(`\n===========================================`);
console.log(`🏁 Resumen: ${passed} pasados, ${failed} fallados`);
if (failed > 0) process.exit(1);
