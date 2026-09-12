/**
 * DemoMode.jsx
 * Ruta /demo — Carga datos mock realistas para capturar screenshots de Google Play Store.
 * NO modifica la base de datos real. Solo datos locales en memoria.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShotCaptureModal } from '../components/ShotCaptureModal';
import { UnattributedEventsManager } from '../components/UnattributedEventsManager';
import { CaptureCriteriaModal } from '../components/CaptureCriteriaModal';
import { RadarCompareSVG } from '../components/canonical/RadarCompareSVG.js';
import SectionErrorBoundary from '../components/common/SectionErrorBoundary';
import ZoneEventMap from '../components/MatchStats/ZoneEventMap';
import HeatMap from '../components/MatchStats/HeatMap';
import ShotMap from '../components/MatchStats/ShotMap';
import { getMatchDerivedStatus } from './Partidos';
import { useLanguage } from '../context/LanguageContext';
import './DemoMode.css';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const DEMO_TEAM = {
  nombre: 'FC Atlético Juvenil A',
  categoria: 'Juvenil A · Liga Nacional',
  temporada: 'Temporada 2025-26',
  colorLocal: '#1B3A2D',
  colorVisitante: '#D4A843',
};

const DEMO_PLAYERS = [
  { id: 1,  nombre: 'Carlos Rodríguez', posicion: 'Portero',        dorsal: 1,  estado: 'disponible', edad: 17 },
  { id: 2,  nombre: 'David Martínez',   posicion: 'Defensa',         dorsal: 2,  estado: 'disponible', edad: 17 },
  { id: 3,  nombre: 'Sergio López',     posicion: 'Defensa Central', dorsal: 4,  estado: 'disponible', edad: 18 },
  { id: 4,  nombre: 'Pablo Sánchez',    posicion: 'Defensa Central', dorsal: 5,  estado: 'disponible', edad: 17 },
  { id: 5,  nombre: 'Adrián Torres',    posicion: 'Lateral Izq.',    dorsal: 3,  estado: 'disponible', edad: 17 },
  { id: 6,  nombre: 'Miguel García',    posicion: 'Mediocentro',     dorsal: 6,  estado: 'disponible', edad: 18 },
  { id: 7,  nombre: 'Álvaro Jiménez',   posicion: 'Interior Dcho.',  dorsal: 8,  estado: 'disponible', edad: 17 },
  { id: 8,  nombre: 'Rubén Moreno',     posicion: 'Mediapunta',      dorsal: 10, estado: 'disponible', edad: 18 },
  { id: 9,  nombre: 'Iván Fernández',   posicion: 'Extremo Dcho.',   dorsal: 7,  estado: 'disponible', edad: 17 },
  { id: 10, nombre: 'Marcos Díaz',      posicion: 'Delantero Centro',dorsal: 9,  estado: 'disponible', edad: 18 },
  { id: 11, nombre: 'Luis Herrero',     posicion: 'Extremo Izq.',    dorsal: 11, estado: 'disponible', edad: 17 },
  { id: 12, nombre: 'Hugo Romero',      posicion: 'Portero Suplente',dorsal: 13, estado: 'disponible', edad: 17 },
  { id: 13, nombre: 'Alejandro Cano',   posicion: 'Mediocentro',     dorsal: 14, estado: 'disponible', edad: 18 },
  { id: 14, nombre: 'Javier Morales',   posicion: 'Extremo Dcho.',   dorsal: 15, estado: 'disponible', edad: 17 },
  { id: 15, nombre: 'Mateo Ruiz',       posicion: 'Delantero Centro',dorsal: 16, estado: 'disponible', edad: 17 },
  { id: 16, nombre: 'Gonzalo Castillo', posicion: 'Defensa Central', dorsal: 17, estado: 'disponible', edad: 18 },
  { id: 17, nombre: 'Lucas Navarro',    posicion: 'Lateral Dcho.',    dorsal: 18, estado: 'disponible', edad: 17 },
  { id: 18, nombre: 'Daniel Gil',       posicion: 'Interior Izq.',    dorsal: 19, estado: 'disponible', edad: 18 },
];

const DEMO_STATS = [
  { label: 'Plantilla',  value: 22, icon: '👥', color: '#1B3A2D' },
  { label: 'Partidos',   value: 18, icon: '⚽', color: '#4CAF7D' },
  { label: 'Victorias',  value: 14, icon: '🏆', color: '#D4A843' },
  { label: 'Sesiones',   value: 48, icon: '📋', color: '#2196F3' },
];

const DEMO_NEXT_MATCH = {
  rival: 'Real Deportivo CF',
  fecha: 'Domingo 15 de Octubre',
  hora: '11:30 H',
  lugar: 'Campo Municipal El Naranjo',
  competicion: 'Jornada 9 · Liga Nacional'
};

const DEMO_MODULES = [
  { id: 'dashboard',     label: 'Dashboard',       icon: '🏠', desc: 'Resumen del equipo y métricas' },
  { id: 'pizarra',       label: 'Pizarra Táctica', icon: '📊', desc: 'Sistema 4-3-3 y jugadas ensayadas' },
  { id: 'equipo',        label: 'Mi Equipo',        icon: '👥', desc: 'Plantilla completa y estado físico' },
  { id: 'planificacion', label: 'Planificación',   icon: '📅', desc: 'Macrociclo y programación semanal' },
  { id: 'sesiones',      label: 'Sesiones',        icon: '📋', desc: 'Catálogo de ejercicios y rondos' },
  { id: 'partidos',      label: 'Match-Day',       icon: '⏱️', desc: 'Control en directo y cambios' },
  { id: 'ia',            label: 'IA Generadora',    icon: '🤖', desc: 'Asistente táctico inteligente' },
  { id: 'tests',         label: 'Tests Físicos',    icon: '🏃', desc: 'Batería de pruebas y evolución' },
];

// ── Vistas ────────────────────────────────────────────────────────────────────
function DashboardView() {
  return (
    <div className="demo-view">
      <h2 className="demo-team-name">⚽ {DEMO_TEAM.nombre}</h2>
      <p className="demo-team-sub">{DEMO_TEAM.categoria} · {DEMO_TEAM.temporada}</p>

      <div className="demo-stats-grid">
        {DEMO_STATS.map(s => (
          <div key={s.label} className="demo-stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
            <span className="demo-stat-icon">{s.icon}</span>
            <span className="demo-stat-value">{s.value}</span>
            <span className="demo-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="demo-next-match">
        <h3>⚽ Próximo Partido Oficial</h3>
        <div className="demo-match-info">
          <div className="demo-match-rival">vs. {DEMO_NEXT_MATCH.rival}</div>
          <div className="demo-match-details">
            📅 {DEMO_NEXT_MATCH.fecha} · 🕐 {DEMO_NEXT_MATCH.hora}
          </div>
          <div className="demo-match-place">📍 {DEMO_NEXT_MATCH.lugar} ({DEMO_NEXT_MATCH.competicion})</div>
        </div>
      </div>
    </div>
  );
}

function EquipoView() {
  return (
    <div className="demo-view">
      <h2>👥 Plantilla Oficial — {DEMO_TEAM.nombre}</h2>
      <div className="demo-players-list">
        {DEMO_PLAYERS.map(p => (
          <div key={p.id} className={`demo-player-row ${p.estado}`}>
            <span className="demo-player-dorsal">#{p.dorsal}</span>
            <span className="demo-player-name">{p.nombre}</span>
            <span className="demo-player-pos">{p.posicion}</span>
            <span className={`demo-player-estado ${p.estado}`}>
              ✅ Disponible
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PizarraView() {
  const positions433 = [
    { n: '1',  name: 'C. Rodríguez', x: '50%',  y: '88%' },
    { n: '2',  name: 'D. Martínez',  x: '20%',  y: '70%' },
    { n: '4',  name: 'S. López',     x: '37%',  y: '72%' },
    { n: '5',  name: 'P. Sánchez',   x: '63%',  y: '72%' },
    { n: '3',  name: 'A. Torres',    x: '80%',  y: '70%' },
    { n: '6',  name: 'M. García',    x: '30%',  y: '52%' },
    { n: '8',  name: 'Á. Jiménez',   x: '50%',  y: '50%' },
    { n: '10', name: 'R. Moreno',    x: '70%',  y: '52%' },
    { n: '7',  name: 'I. Fernández', x: '20%',  y: '32%' },
    { n: '9',  name: 'M. Díaz',      x: '50%',  y: '28%' },
    { n: '11', name: 'L. Herrero',   x: '80%',  y: '32%' },
  ];
  return (
    <div className="demo-view">
      <h2>📊 Pizarra Táctica & Dibujo 2D — 4-3-3 Alta Presión</h2>
      <div className="demo-field">
        <div className="demo-field-center-circle" />
        <div className="demo-field-center-line" />
        <div className="demo-field-penalty-top" />
        <div className="demo-field-penalty-bottom" />
        {positions433.map(p => (
          <div key={p.n} className="demo-player-token" style={{ left: p.x, top: p.y }}>
            <div className="demo-token-circle">{p.n}</div>
            <div className="demo-token-name">{p.name.split(' ')[1] || p.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanificacionView() {
  const weeks = [
    { week: 'Microciclo 1: Pretemporada & Cargas', sessions: ['✔ Evaluación física inicial', '✔ Posesión 4v4 + comodines', '✔ Partido de aplicación'] },
    { week: 'Microciclo 2: Salida de Balón 4-3-3', sessions: ['✔ Presión alta en bloque medio', '✔ Transición ofensiva rápida', '✔ Estrategia a balón parado'] },
    { week: 'Microciclo 3: Competición Jornada 1', sessions: ['✔ Basculación en zona defensiva', '✔ Finalización centros laterales', '✔ ⚽ Partido Oficial vs Real'] },
  ];
  return (
    <div className="demo-view">
      <h2>📅 Planificación de Entrenamientos — Macrociclo</h2>
      <div className="demo-plan-grid">
        {weeks.map(w => (
          <div key={w.week} className="demo-week-card">
            <h4>{w.week}</h4>
            <ul>
              {w.sessions.map(s => <li key={s}>{s}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SesionesView() {
  const tareas = [
    { titulo: 'Rondo 4v2 con Transición Rápida', tipo: 'Posesión', duracion: '15 min', intensidad: 'Alta' },
    { titulo: 'Salida de Balón ante Bloque Alto', tipo: 'Táctica', duracion: '25 min', intensidad: 'Alta' },
    { titulo: 'Finalización en Centro y Remate', tipo: 'Técnica', duracion: '20 min', intensidad: 'Media' },
    { titulo: 'Partido Modificado 8v8 a 2 Toques', tipo: 'Juego Real', duracion: '30 min', intensidad: 'Máxima' }
  ];
  return (
    <div className="demo-view">
      <h2>📋 Diseñador de Sesiones & Ejercicios</h2>
      <div className="demo-plan-grid">
        {tareas.map(t => (
          <div key={t.titulo} className="demo-week-card" style={{ borderLeft: '4px solid #1B3A2D' }}>
            <h4>⚡ {t.titulo}</h4>
            <p style={{ margin: '6px 0', fontSize: '13px', color: '#2e7d32' }}>📌 {t.tipo} · ⏱️ {t.duracion} · 🔥 {t.intensidad}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuggySection() {
  throw new Error('Simulated Section Error (Cannot access a before initialization)');
}

function PartidosView() {
  const { t } = useLanguage();
  const [shotModalOpen, setShotModalOpen] = useState(false);
  const [unattrModalOpen, setUnattrModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('matchday'); // 'matchday' | 'stats'
  const [statsSubTab, setStatsSubTab] = useState('tactical'); // 'overview' | 'tactical'

  const demoMatches = [
    {
      id: 'm1',
      rival: 'Real Deportivo CF',
      fecha: '2026-09-10',
      hora: '18:00',
      marcadorPropio: 3,
      marcadorRival: 1,
      status: 'Terminado',
      finishedAt: '2026-09-10T19:50:00Z',
      lugar: 'Local'
    },
    {
      id: 'm2',
      rival: 'UD Los Rosales',
      fecha: '2026-09-11',
      hora: '17:00',
      marcadorPropio: 2,
      marcadorRival: 2,
      status: 'En Edicion',
      actaReabierta: true,
      lugar: 'Visitante'
    },
    {
      id: 'm3',
      rival: 'CD Esperanza',
      fecha: '2026-10-15',
      hora: '12:00',
      status: 'Programado',
      lugar: 'Local'
    },
    {
      id: 'm4',
      rival: 'Atlético San Telmo',
      fecha: '2026-08-15',
      hora: '10:00',
      status: 'Programado',
      lugar: 'Visitante'
    }
  ];

  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);
  const [simularErrorRadar, setSimularErrorRadar] = useState(false);
  const [mockUnattributed, setMockUnattributed] = useState([
    { id: 'evt-1', type: 'recovery', minute: 14, timestamp: Date.now() - 40000 },
    { id: 'evt-2', type: 'duel_won', minute: 28, timestamp: Date.now() - 30000 },
    { id: 'evt-3', type: 'shot_on_target_own', minute: 35, timestamp: Date.now() - 20000 },
    { id: 'evt-4', type: 'foul_against', minute: 42, timestamp: Date.now() - 10000 }
  ]);

  const mockEventsForZone = [
    { id: 'z1', type: 'tiro', team: 'own', x: 85, y: 50, minute: 23 },
    { id: 'z2', type: 'tiro', team: 'own', x: 90, y: 45, minute: 58 },
    { id: 'z3', type: 'recuperacion', team: 'own', x: 45, y: 30, minute: 12 },
    { id: 'z4', type: 'recuperacion', team: 'own', x: 52, y: 70, minute: 34 },
    { id: 'z5', type: 'duelo', team: 'own', x: 30, y: 50, minute: 18 },
    { id: 'z6', type: 'falta', team: 'own', x: 50, y: 20, minute: 41 },
    { id: 'z7', type: 'recuperacion', team: 'own', x: 25, y: 80, minute: 61 }
  ];

  const handleSaveAttribution = (eventId, playerId) => {
    setMockUnattributed(prev => prev.filter(e => e.id !== eventId));
  };

  return (
    <div className="demo-view">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e0e0e0', paddingBottom: '8px' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'matchday' ? 'active' : ''}`}
          onClick={() => setActiveTab('matchday')}
          style={{
            minHeight: '48px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'matchday' ? '#1B3A2D' : '#f5f5f5',
            color: activeTab === 'matchday' ? '#ffffff' : '#333333',
            border: 'none'
          }}
        >
          ⏱️ MATCH-DAY & PARTIDOS
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
          style={{
            minHeight: '48px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'stats' ? '#1B3A2D' : '#f5f5f5',
            color: activeTab === 'stats' ? '#ffffff' : '#333333',
            border: 'none'
          }}
        >
          📊 ESTADÍSTICAS
        </button>
      </div>

      {activeTab === 'matchday' && (
        <>
          <h2>⏱️ Match-Day en Vivo — 2ª Parte (67')</h2>
          <div className="demo-stats-grid">
            <div className="demo-stat-card" style={{ borderLeft: '4px solid #4CAF7D' }}>
              <span className="demo-stat-icon">⚽</span>
              <span className="demo-stat-value">2 - 1</span>
              <span className="demo-stat-label">Marcador en Directo</span>
            </div>
            <div className="demo-stat-card" style={{ borderLeft: '4px solid #D4A843' }}>
              <span className="demo-stat-icon">⏱️</span>
              <span className="demo-stat-value">67:42</span>
              <span className="demo-stat-label">Minuto de Juego</span>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Botón de Refinamiento Opcional con touch target >= 48dp y color neutro */}
            <button
              type="button"
              id="livestats-unattributed-counter-btn"
              className="jugador-unattributed-btn"
              onClick={() => setUnattrModalOpen(true)}
              style={{
                minHeight: '48px',
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1.5px solid #D4A843',
                color: '#1E293B',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>⚙️</span>
              <span>{mockUnattributed.length > 0 ? `Refinar atribución (${mockUnattributed.length} opcionales)` : 'Nada pendiente ✅'}</span>
            </button>

            <button
              type="button"
              className="demo-open-shotmodal-btn"
              onClick={() => setShotModalOpen(true)}
              style={{
                minHeight: '48px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#1B3A2D',
                color: '#FFFFFF',
                border: '1.5px solid #D4A843',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🎯 Abrir ShotModal (Prueba de Chips)
            </button>

            <button
              type="button"
              id="demo-open-criteria-btn"
              className="livestats-criteria-btn"
              onClick={() => setCriteriaModalOpen(true)}
              style={{
                minHeight: '48px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#1B3A2D',
                color: '#FFFFFF',
                border: '1.5px solid #D4A843',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              📖 Manual de Criterios (Filtros Estilizados)
            </button>
          </div>

          <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>📋 Lista de Partidos (Badges Derivados)</h3>
          <div className="matches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {demoMatches.map(m => {
              const derivedStatus = getMatchDerivedStatus(m);
              const statusKey = derivedStatus === 'FINALIZADO' ? 'finalizado'
                : derivedStatus === 'EN_EDICION' ? 'en-edicion'
                : derivedStatus === 'PENDIENTE' ? 'pendiente'
                : 'no-disputado';
              const statusLabel = derivedStatus === 'FINALIZADO' ? (t('match.status.finalizado') || 'FINALIZADO')
                : derivedStatus === 'EN_EDICION' ? (t('match.status.en_edicion') || 'EN EDICIÓN')
                : derivedStatus === 'PENDIENTE' ? (t('match.status.pendiente') || 'PENDIENTE')
                : (t('match.status.no_disputado') || 'NO DISPUTADO');
              return (
                <div key={m.id} className="match-card" style={{ padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>📅 {m.fecha} · {m.hora}</span>
                    <span className={`status-badge ${statusKey}`} style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      backgroundColor: statusKey === 'finalizado' ? '#E2E8F0' : statusKey === 'en-edicion' ? '#FEF3C7' : statusKey === 'pendiente' ? '#DCFCE7' : '#F1F5F9',
                      color: statusKey === 'finalizado' ? '#475569' : statusKey === 'en-edicion' ? '#B45309' : statusKey === 'pendiente' ? '#15803D' : '#94A3B8'
                    }}>
                      {statusLabel}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#0F172A' }}>vs. {m.rival}</h4>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    {m.marcadorPropio !== undefined ? `Resultado: ${m.marcadorPropio} - ${m.marcadorRival}` : 'Sin disputar'}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'stats' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className={`sub-tab-btn ${statsSubTab === 'tactical' ? 'active' : ''}`}
              onClick={() => setStatsSubTab('tactical')}
              style={{
                minHeight: '48px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statsSubTab === 'tactical' ? '#1B3A2D' : '#e2e8f0',
                color: statsSubTab === 'tactical' ? '#ffffff' : '#333333',
                border: 'none'
              }}
            >
              📍 Campo & Táctica
            </button>
            <button
              type="button"
              id="demo-tab-radar-btn"
              className={`sub-tab-btn ${statsSubTab === 'radar' ? 'active' : ''}`}
              onClick={() => setStatsSubTab('radar')}
              style={{
                minHeight: '48px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                background: statsSubTab === 'radar' ? '#1B3A2D' : '#e2e8f0',
                color: statsSubTab === 'radar' ? '#ffffff' : '#333333',
                border: 'none'
              }}
            >
              🕸️ Radar Comparativo (6 Ejes)
            </button>
          </div>

          {statsSubTab === 'tactical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <HeatMap
                events={mockEventsForZone}
                players={DEMO_PLAYERS}
                teamName={DEMO_TEAM.nombre}
              />
              <ZoneEventMap
                events={mockEventsForZone}
                teamName={DEMO_TEAM.nombre}
                t={t}
              />
              <ShotMap
                events={mockEventsForZone}
                teamName={DEMO_TEAM.nombre}
                players={DEMO_PLAYERS}
              />
            </div>
          )}

          {statsSubTab === 'radar' && (
            <div>
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  id="demo-toggle-radar-error-btn"
                  onClick={() => setSimularErrorRadar(prev => !prev)}
                  style={{
                    minHeight: '40px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: simularErrorRadar ? '#EF4444' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🧪 {simularErrorRadar ? 'Restaurar Radar Normal' : 'Simular Fallo Aislado en Sección'}
                </button>
              </div>

              <SectionErrorBoundary sectionCode="SEC_RADAR" sectionTitle="4. Radar Comparativo Propio vs Rival (6 Ejes)">
                {simularErrorRadar ? <BuggySection /> : (
                  <div id="sec_radar" className="post-match-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <RadarCompareSVG
                      homeStats={{ posesion: 58, tiros: 12, tirosPuerta: 6, corners: 5, faltas: 8, amarillas: 1, duelosGanados: 54, expectedGoals: 1.85 }}
                      awayStats={{ posesion: 42, tiros: 7, tirosPuerta: 4, corners: 3, faltas: 14, amarillas: 3, duelosGanados: 46, expectedGoals: 0.95 }}
                      homeTeamName={DEMO_TEAM.nombre}
                      awayTeamName={DEMO_NEXT_MATCH.rival}
                      isEn={false}
                    />
                  </div>
                )}
              </SectionErrorBoundary>
            </div>
          )}
        </div>
      )}

      <ShotCaptureModal
        isOpen={shotModalOpen}
        onClose={() => setShotModalOpen(false)}
        onConfirmShot={() => setShotModalOpen(false)}
        origin="team"
        initialTeam="own"
        playersList={DEMO_PLAYERS}
      />

      <UnattributedEventsManager
        isOpen={unattrModalOpen}
        onClose={() => setUnattrModalOpen(false)}
        events={mockUnattributed}
        onAttributeEvents={handleSaveAttribution}
        playersList={DEMO_PLAYERS}
      />

      <CaptureCriteriaModal
        isOpen={criteriaModalOpen}
        onClose={() => setCriteriaModalOpen(false)}
        isEn={false}
      />
    </div>
  );
}

function IAView() {
  return (
    <div className="demo-view">
      <h2>🤖 IA Generadora de Ejercicios Tácticos</h2>
      <div className="demo-ia-chat">
        <div className="demo-ia-bubble user">
          💬 "Genera un ejercicio de posesión 5v5+2 para mejorar la basculación defensiva"
        </div>
        <div className="demo-ia-bubble ai">
          <div className="demo-ia-exercise">
            <h3>⚡ Rondo de Basculación 5v5 con Comodines</h3>
            <p><strong>🎯 Objetivo:</strong> Ocupación de espacios y cambio de orientación rápida</p>
            <p><strong>⏱ Duración:</strong> 20 minutos (4 series de 4 min)</p>
            <p><strong>👥 Jugadores:</strong> 12 futbolistas (5v5 + 2 comodines por fuera)</p>
            <p><strong>📋 Descripción:</strong> Mantenimiento de posesión en espacio de 25x20m. Al conseguir 6 pases consecutivos, el equipo atacante puede conectar con el comodín lejano para puntuar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestsView() {
  const results = [
    { nombre: 'Carlos R.',  cooper: 2850, navette: 9.5, color: '#4CAF7D' },
    { nombre: 'David M.',   cooper: 2700, navette: 8.8, color: '#4CAF7D' },
    { nombre: 'Sergio L.',  cooper: 2950, navette: 10.2, color: '#1B3A2D' },
    { nombre: 'Pablo S.',   cooper: 2500, navette: 8.0, color: '#FF9800' },
    { nombre: 'Adrián T.',  cooper: 2800, navette: 9.2, color: '#4CAF7D' },
    { nombre: 'Miguel G.',  cooper: 2650, navette: 8.5, color: '#4CAF7D' },
  ];
  const maxCooper = Math.max(...results.map(r => r.cooper));
  return (
    <div className="demo-view">
      <h2>🏃 Tests Físicos & Gráfica de Rendimiento</h2>
      <div className="demo-tests-list">
        {results.map(r => (
          <div key={r.nombre} className="demo-test-row">
            <span className="demo-test-name">{r.nombre}</span>
            <div className="demo-test-bar-wrap">
              <div className="demo-test-bar" style={{ width: `${(r.cooper / maxCooper) * 100}%`, background: r.color }} />
            </div>
            <span className="demo-test-value">{r.cooper}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const VIEWS = {
  dashboard:     <DashboardView />,
  pizarra:       <PizarraView />,
  equipo:        <EquipoView />,
  planificacion: <PlanificacionView />,
  sesiones:      <SesionesView />,
  partidos:      <PartidosView />,
  ia:            <IAView />,
  tests:         <TestsView />,
};

// ── Componente Principal ──────────────────────────────────────────────────────
export default function DemoMode() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('dashboard');

  return (
    <div className="demo-container">
      {/* Header */}
      <div className="demo-header">
        <div className="demo-header-left">
          <span className="demo-badge">⚽ MÍSTER 11 — PANEL DE ENTRENADOR</span>
        </div>
        <button className="demo-exit-btn" onClick={() => navigate('/')}>
          ✕ Salir
        </button>
      </div>

      {/* Navegación de módulos */}
      <nav className="demo-nav">
        {DEMO_MODULES.map(m => (
          <button
            key={m.id}
            className={`demo-nav-btn ${activeModule === m.id ? 'active' : ''}`}
            onClick={() => setActiveModule(m.id)}
          >
            <span className="demo-nav-icon">{m.icon}</span>
            <span className="demo-nav-label">{m.label}</span>
          </button>
        ))}
      </nav>

      {/* Contenido de la vista activa */}
      <main className="demo-content">
        {VIEWS[activeModule]}
      </main>
    </div>
  );
}
