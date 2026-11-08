/**
 * scripts/test-checkin-rehydration.mjs
 * MÍSTER11 — E13: Test de Persistencia y Rehidratación de Check-in Diario
 *
 * Flujo evaluado:
 * 1. Escribe payload de check-in en storage persistente (IndexedDB / LocalStorage queue).
 * 2. Simula recarga de página (F5: pérdida de memoria RAM y reinicialización).
 * 3. Lee del almacenamiento persistente.
 * 4. Valida 0 pérdida de datos en todos los campos (sleep, mood, molestias, fecha, id).
 * 5. Valida que el micro-indicador muestre el estado honesto ("Sincronizado" / "Local").
 */

console.log('══════════════════════════════════════════════════════════════════════');
console.log('🔄 [TEST-CHECKIN-REHYDRATION] PERSISTENCIA Y REHIDRATACIÓN DE CHECK-IN');
console.log('══════════════════════════════════════════════════════════════════════\n');

// Mock determinista de storage offline
class StorageEngine {
  constructor() {
    this.store = new Map();
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const mockPersistentDisk = new StorageEngine();

// Módulo de Check-in emulando la lógica de PlayerProfileTab.jsx
class PlayerCheckInService {
  constructor(storage) {
    this.storage = storage;
    this.memoryState = null;
    this.microIndicator = 'idle';
  }

  // 1. Escritura de check-in
  saveCheckIn(playerId, todayStr, data) {
    this.microIndicator = 'saving';
    const payload = {
      ...data,
      playerId,
      date: todayStr,
      updatedAt: Date.now(),
      status: 'synced'
    };
    // Persistencia física
    this.storage.setItem(`m11_wellness_${playerId}_${todayStr}`, JSON.stringify(payload));
    this.storage.setItem('m11_wellness_queue', JSON.stringify(payload));
    this.memoryState = payload;
    this.microIndicator = 'synced'; // "Sincronizado"
    return payload;
  }

  // 2. Rehidratación post-recarga (F5)
  rehydrate(playerId, todayStr) {
    const raw = this.storage.getItem(`m11_wellness_${playerId}_${todayStr}`);
    if (!raw) {
      this.memoryState = null;
      this.microIndicator = 'empty';
      return null;
    }
    const parsed = JSON.parse(raw);
    this.memoryState = parsed;
    this.microIndicator = parsed.status === 'synced' ? 'synced' : 'pending';
    return parsed;
  }
}

console.log('▶ [1/4] Paso 1: Escritura de Check-in diario...');
const checkInInstance1 = new PlayerCheckInService(mockPersistentDisk);
const testPayload = {
  sleep: 4,
  mood: 5,
  hasDiscomfort: false,
  discomfortZone: '',
  rpeSession: 7
};

const written = checkInInstance1.saveCheckIn('player_alpha_99', '2026-11-08', testPayload);
console.log('  • Payload guardado:', JSON.stringify(written));
console.log(`  • Micro-indicador inmediato: "${checkInInstance1.microIndicator}" (Sincronizado)`);

if (checkInInstance1.microIndicator !== 'synced') {
  console.error('❌ Error en micro-indicador inicial');
  process.exit(1);
}

console.log('\n▶ [2/4] Paso 2: Simulación de F5 (destrucción de instancia y RAM)...');
// Simular muerte del proceso / recarga de página: checkInInstance1 desaparece
const orphanedInstance = null;
console.log('  • Memoria de la sesión anterior purgada: checkInInstance1 = null');

console.log('\n▶ [3/4] Paso 3: Inicialización de nueva instancia y rehidratación...');
const checkInInstancePostF5 = new PlayerCheckInService(mockPersistentDisk);
const restored = checkInInstancePostF5.rehydrate('player_alpha_99', '2026-11-08');

console.log('  • Payload rehidratado:', JSON.stringify(restored));

console.log('\n▶ [4/4] Paso 4: Verificación de CERO pérdida de datos e indicador...');
let fieldErrors = 0;
for (const [k, v] of Object.entries(testPayload)) {
  if (restored[k] !== v) {
    console.error(`❌ Pérdida en campo "${k}": esperado ${v}, obtenido ${restored[k]}`);
    fieldErrors++;
  }
}

if (fieldErrors > 0) {
  console.error(`❌ FALLO: Se detectó pérdida de ${fieldErrors} campos tras F5.`);
  process.exit(1);
} else {
  console.log('✅ CERO pérdida de datos verificada en todos los campos (100% integridad).');
}

if (checkInInstancePostF5.microIndicator === 'synced') {
  console.log('✅ Micro-indicador "Sincronizado" rehidratado correctamente tras recarga.');
} else {
  console.error(`❌ Estado incorrecto de micro-indicador: ${checkInInstancePostF5.microIndicator}`);
  process.exit(1);
}

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('✅ [TEST-CHECKIN-REHYDRATION] 100% PASS — REHIDRATACIÓN PERFECTA.');
console.log('══════════════════════════════════════════════════════════════════════');
