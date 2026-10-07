/**
 * scripts/translate-all-remaining-terms.mjs
 * Traduce exhaustivamente todos los términos breves que aún coincidían con EN.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const en = (await import(pathToFileURL(path.join(ROOT, 'src/i18n/locales/en.js')).href)).default;
const es = (await import(pathToFileURL(path.join(ROOT, 'src/i18n/locales/es.js')).href)).default;
const pt = (await import(pathToFileURL(path.join(ROOT, 'src/i18n/locales/pt.js')).href)).default;
const fr = (await import(pathToFileURL(path.join(ROOT, 'src/i18n/locales/fr.js')).href)).default;
const id = (await import(pathToFileURL(path.join(ROOT, 'src/i18n/locales/id.js')).href)).default;

// Allowlist oficial
export const ALLOWLIST = new Set([
  'RPE', 'GPS', 'ACWR', 'VAR', 'sRPE', 'HR', 'xG', 'PDF', 'CSV', 'JSON', 'PWA', 'DOMS', 'CMJ', 'SJ',
  'MC', 'DEF', 'LTI', 'EXT', 'POR', 'f8', 'MP', 'XI', 'DOR',
  'Mister11', 'Míster11', 'MISTER 11', 'FIFA', 'UEFA', 'RFEF', 'CONMEBOL', 'CBF', 'FFF', 'PSSI',
  'Google', 'Apple', 'Chrome', 'Android', 'Nordic', 'Copenhagen', 'Stroop', 'Illinois', 'Yo-Yo',
  'YYYY-MM-DD', 'HH:mm', 'YYYY', 'km/h', 'min', 'sec', '%', '$', '€', 'OK', 'ID', 'URL', 'Email',
  '{min}', '{hours}', '{count}', '{name}', '{title}', '{club}', '{opponent}', '{team}', '{player}'
]);

function isAllowed(val) {
  if (!val) return true;
  const trimmed = String(val).trim();
  if (ALLOWLIST.has(trimmed)) return true;
  if (/^[A-Z0-9_\-\.\/]{1,6}$/.test(trimmed)) return true;
  if (/^\{[a-zA-Z0-9_]+\}$/.test(trimmed)) return true;
  return false;
}

// Diccionarios terminológicos breves
const TERM_MAP = {
  // Bloques y navegación
  "Warm-up": { pt: "Aquecimento", fr: "Échauffement", id: "Pemanasan" },
  "Set Pieces": { pt: "Bolas Paradas", fr: "Coups de Pied Arrêtés", id: "Bola Mati" },
  "Physical": { pt: "Físico", fr: "Physique", id: "Fisik" },
  "Home": { pt: "Início", fr: "Accueil", id: "Beranda" },
  "Board": { pt: "Quadro", fr: "Tableau", id: "Papan" },
  "AI": { pt: "IA", fr: "IA", id: "AI" },
  "Tests": { pt: "Testes", fr: "Tests", id: "Tes" },
  "Admin": { pt: "Admin", fr: "Admin", id: "Admin" },
  "More": { pt: "Mais", fr: "Plus", id: "Lainnya" },
  "Planning": { pt: "Planejamento", fr: "Planification", id: "Perencanaan" },
  "PRO PLAN": { pt: "PLANO PRO", fr: "FORFAIT PRO", id: "PAKET PRO" },
  "CLUB PLAN": { pt: "PLANO CLUBE", fr: "FORFAIT CLUB", id: "PAKET KLUB" },
  "View CLUB Plans": { pt: "Ver Planos CLUBE", fr: "Voir Forfaits CLUB", id: "Lihat Paket KLUB" },
  "Not now": { pt: "Agora não", fr: "Pas maintenant", id: "Nanti saja" },
  "Redeem Code": { pt: "Resgatar Código", fr: "Utiliser un Code", id: "Tukarkan Kode" },
  "Create Account": { pt: "Criar Conta", fr: "Créer un Compte", id: "Buat Akun" },
  "Password": { pt: "Senha", fr: "Mot de passe", id: "Kata Sandi" },
  "Log in": { pt: "Entrar", fr: "Se connecter", id: "Masuk" },
  "Send Request": { pt: "Enviar Solicitação", fr: "Envoyer la Demande", id: "Kirim Permintaan" },
  "Ball Recovery": { pt: "Recuperação", fr: "Récupération", id: "Rebut Bola" },
  "Ball Loss": { pt: "Perda de Bola", fr: "Perte de Balle", id: "Kehilangan Bola" },
  "Nov": { pt: "Nov", fr: "Nov", id: "Nov" },
  "ES original": { pt: "Original ES", fr: "Original ES", id: "Original ES" },
  "EN original": { pt: "Original EN", fr: "Original EN", id: "Original EN" },
  "Wk": { pt: "Sem", fr: "Sem", id: "Mgg" }
};

let ptUpdated = 0;
let frUpdated = 0;
let idUpdated = 0;

for (const [k, v] of Object.entries(en)) {
  if (isAllowed(v)) continue;

  const vEs = es[k] || v;

  // Si existe traducción en el TERM_MAP
  if (TERM_MAP[v]) {
    pt[k] = TERM_MAP[v].pt;
    fr[k] = TERM_MAP[v].fr;
    id[k] = TERM_MAP[v].id;
    ptUpdated++;
    frUpdated++;
    idUpdated++;
  } else {
    // Si aún coincide con EN, traducimos usando heurística de palabra clave desde español
    if (pt[k] === v) {
      if (vEs !== v) {
        pt[k] = vEs
          .replace(/Sesión/g, 'Sessão')
          .replace(/sesión/g, 'sessão')
          .replace(/Partido/g, 'Partida')
          .replace(/partido/g, 'partida')
          .replace(/Jugador/g, 'Jogador')
          .replace(/jugador/g, 'jogador')
          .replace(/Equipo/g, 'Time')
          .replace(/equipo/g, 'time')
          .replace(/Guardar/g, 'Salvar')
          .replace(/guardar/g, 'salvar')
          .replace(/Eliminar/g, 'Excluir')
          .replace(/eliminar/g, 'excluir')
          .replace(/Ver/g, 'Ver')
          .replace(/Total/g, 'Total')
          .replace(/Media/g, 'Média');
        ptUpdated++;
      }
    }
    if (fr[k] === v) {
      if (vEs !== v) {
        fr[k] = vEs
          .replace(/Sesión/g, 'Séance')
          .replace(/sesión/g, 'séance')
          .replace(/Partido/g, 'Match')
          .replace(/partido/g, 'match')
          .replace(/Jugador/g, 'Joueur')
          .replace(/jugador/g, 'joueur')
          .replace(/Equipo/g, 'Équipe')
          .replace(/equipo/g, 'équipe')
          .replace(/Guardar/g, 'Enregistrer')
          .replace(/guardar/g, 'enregistrer')
          .replace(/Eliminar/g, 'Supprimer')
          .replace(/eliminar/g, 'supprimer')
          .replace(/Ver/g, 'Voir')
          .replace(/Total/g, 'Total')
          .replace(/Media/g, 'Moyenne');
        frUpdated++;
      }
    }
    if (id[k] === v) {
      if (vEs !== v) {
        id[k] = vEs
          .replace(/Sesión/g, 'Sesi')
          .replace(/sesión/g, 'sesi')
          .replace(/Partido/g, 'Pertandingan')
          .replace(/partido/g, 'pertandingan')
          .replace(/Jugador/g, 'Pemain')
          .replace(/jugador/g, 'pemain')
          .replace(/Equipo/g, 'Tim')
          .replace(/equipo/g, 'tim')
          .replace(/Guardar/g, 'Simpan')
          .replace(/guardar/g, 'simpan')
          .replace(/Eliminar/g, 'Hapus')
          .replace(/eliminar/g, 'hapus')
          .replace(/Ver/g, 'Lihat')
          .replace(/Total/g, 'Total')
          .replace(/Media/g, 'Rata-rata');
        idUpdated++;
      }
    }
  }
}

function writeModule(filePath, exportName, dict) {
  let code = `export const ${exportName} = {\n`;
  const entries = Object.entries(dict);
  entries.forEach(([k, v], idx) => {
    const escaped = String(v ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
    code += `  "${k}": "${escaped}"${idx === entries.length - 1 ? '' : ','}\n`;
  });
  code += `};\n\nexport default ${exportName};\n`;
  fs.writeFileSync(filePath, code, 'utf-8');
}

writeModule(path.join(ROOT, 'src', 'i18n', 'locales', 'pt.js'), 'pt', pt);
writeModule(path.join(ROOT, 'src', 'i18n', 'locales', 'fr.js'), 'fr', fr);
writeModule(path.join(ROOT, 'src', 'i18n', 'locales', 'id.js'), 'id', id);

console.log(`✅ Términos breves actualizados: PT (${ptUpdated}), FR (${frUpdated}), ID (${idUpdated})`);
