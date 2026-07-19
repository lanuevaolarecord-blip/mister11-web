/**
 * DemoMode.jsx
 * Ruta /demo — Carga datos mock realistas para capturar screenshots de Google Play Store.
 * NO modifica la base de datos real. Solo datos locales en memoria.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DemoMode.css';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const DEMO_TEAM = {
  nombre: 'FC Atlético Juvenil A',
  categoria: 'Juvenil',
  temporada: '2025-26',
  colorLocal: '#1B3A2D',
  colorVisitante: '#D4A843',
};

const DEMO_PLAYERS = [
  { id: 1, nombre: 'Carlos Rodríguez', posicion: 'Portero',      dorsal: 1,  estado: 'disponible', edad: 16 },
  { id: 2, nombre: 'David Martínez',   posicion: 'Defensa',       dorsal: 2,  estado: 'disponible', edad: 17 },
  { id: 3, nombre: 'Sergio López',     posicion: 'Defensa',       dorsal: 4,  estado: 'disponible', edad: 16 },
  { id: 4, nombre: 'Pablo Sánchez',    posicion: 'Defensa',       dorsal: 5,  estado: 'disponible', edad: 17 },
  { id: 5, nombre: 'Adrián Torres',    posicion: 'Defensa',       dorsal: 3,  estado: 'disponible', edad: 16 },
  { id: 6, nombre: 'Miguel García',    posicion: 'Centrocampista', dorsal: 6, estado: 'disponible', edad: 17 },
  { id: 7, nombre: 'Álvaro Jiménez',   posicion: 'Centrocampista', dorsal: 8, estado: 'disponible', edad: 16 },
  { id: 8, nombre: 'Rubén Moreno',     posicion: 'Centrocampista', dorsal: 10, estado: 'lesionado', edad: 17 },
  { id: 9, nombre: 'Iván Fernández',   posicion: 'Delantero',     dorsal: 7,  estado: 'disponible', edad: 16 },
  { id: 10, nombre: 'Marcos Díaz',     posicion: 'Delantero',     dorsal: 9,  estado: 'disponible', edad: 17 },
  { id: 11, nombre: 'Luis Herrero',    posicion: 'Delantero',     dorsal: 11, estado: 'disponible', edad: 16 },
];

const DEMO_STATS = [
  { label: 'Jugadores', value: 11, icon: '👥', color: '#1B3A2D' },
  { label: 'Partidos',  value: 18, icon: '⚽', color: '#4CAF7D' },
  { label: 'Victorias', value: 12, icon: '🏆', color: '#D4A843' },
  { label: 'Sesiones',  value: 34, icon: '📋', color: '#2196F3' },
];

const DEMO_NEXT_MATCH = {
  rival: 'Real Deportivo CF',
  fecha: '2026-07-20',
  hora: '11:00',
  lugar: 'Campo Municipal Norte',
};

const DEMO_IA_EXERCISE = {
  titulo: 'Rondo 4v2 con Transición',
  objetivo: 'Posesión y presión tras pérdida',
  duracion: '15 minutos',
  jugadores: '12-16',
  material: ['8 conos', '2 petos', '1 balón'],
  descripcion: 'Cuadrado de 10×10m. 4 atacantes intentan mantener posesión contra 2 defensores. Tras pérdida, los defensores se convierten en atacantes inmediatamente. Énfasis en la presión colectiva tras pérdida y la transición rápida.',
  variante: 'Aumentar a 5v2 para equipos con mayor nivel técnico.',
};

const DEMO_MODULES = [
  { id: 'dashboard',    label: 'Dashboard',      icon: '🏠', desc: 'Resumen del equipo y próximo partido' },
  { id: 'equipo',       label: 'Mi Equipo',       icon: '👥', desc: 'Plantilla de 11 jugadores con estados' },
  { id: 'pizarra',      label: 'Pizarra Táctica', icon: '📊', desc: 'Alineación 4-3-3 lista para captura' },
  { id: 'ia',           label: 'IA Generadora',   icon: '🤖', desc: 'Ejercicio de posesión generado por IA' },
  { id: 'tests',        label: 'Tests Físicos',   icon: '🏃', desc: 'Resultados de Cooper y Course Navette' },
  { id: 'planificacion', label: 'Planificación',  icon: '📅', desc: 'Mesociclo julio 2026 estructurado' },
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
        <h3>⚽ Próximo Partido</h3>
        <div className="demo-match-info">
          <div className="demo-match-rival">vs. {DEMO_NEXT_MATCH.rival}</div>
          <div className="demo-match-details">
            📅 {DEMO_NEXT_MATCH.fecha} · 🕐 {DEMO_NEXT_MATCH.hora}
          </div>
          <div className="demo-match-place">📍 {DEMO_NEXT_MATCH.lugar}</div>
        </div>
      </div>
    </div>
  );
}

function EquipoView() {
  return (
    <div className="demo-view">
      <h2>👥 Plantilla — {DEMO_TEAM.nombre}</h2>
      <div className="demo-players-list">
        {DEMO_PLAYERS.map(p => (
          <div key={p.id} className={`demo-player-row ${p.estado}`}>
            <span className="demo-player-dorsal">#{p.dorsal}</span>
            <span className="demo-player-name">{p.nombre}</span>
            <span className="demo-player-pos">{p.posicion}</span>
            <span className={`demo-player-estado ${p.estado}`}>
              {p.estado === 'disponible' ? '✅' : '🔴'} {p.estado}
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
      <h2>📊 Pizarra Táctica — 4-3-3</h2>
      <div className="demo-field">
        {/* Líneas del campo */}
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

function IAView() {
  return (
    <div className="demo-view">
      <h2>🤖 IA Generadora de Ejercicios</h2>
      <div className="demo-ia-chat">
        <div className="demo-ia-bubble user">
          💬 "Genera un ejercicio de posesión para 15 minutos con 14 jugadores"
        </div>
        <div className="demo-ia-bubble ai">
          <div className="demo-ia-exercise">
            <h3>⚡ {DEMO_IA_EXERCISE.titulo}</h3>
            <p><strong>🎯 Objetivo:</strong> {DEMO_IA_EXERCISE.objetivo}</p>
            <p><strong>⏱ Duración:</strong> {DEMO_IA_EXERCISE.duracion}</p>
            <p><strong>👥 Jugadores:</strong> {DEMO_IA_EXERCISE.jugadores}</p>
            <p><strong>🧰 Material:</strong> {DEMO_IA_EXERCISE.material.join(', ')}</p>
            <p><strong>📋 Descripción:</strong> {DEMO_IA_EXERCISE.descripcion}</p>
            <p><strong>🔄 Variante:</strong> {DEMO_IA_EXERCISE.variante}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestsView() {
  const results = [
    { nombre: 'Carlos R.',  cooper: 2800, navette: 9.2, color: '#4CAF7D' },
    { nombre: 'David M.',   cooper: 2650, navette: 8.5, color: '#4CAF7D' },
    { nombre: 'Sergio L.',  cooper: 2920, navette: 10.1, color: '#1B3A2D' },
    { nombre: 'Pablo S.',   cooper: 2400, navette: 7.8, color: '#FF9800' },
    { nombre: 'Adrián T.',  cooper: 2750, navette: 9.0, color: '#4CAF7D' },
    { nombre: 'Miguel G.',  cooper: 2600, navette: 8.3, color: '#4CAF7D' },
  ];
  const maxCooper = Math.max(...results.map(r => r.cooper));
  return (
    <div className="demo-view">
      <h2>🏃 Tests Físicos — Cooper 12min</h2>
      <div className="demo-tests-list">
        {results.map(r => (
          <div key={r.nombre} className="demo-test-row">
            <span className="demo-test-name">{r.nombre}</span>
            <div className="demo-test-bar-wrap">
              <div className="demo-test-bar" style={{ width: `${(r.cooper / maxCooper) * 100}%`, background: r.color }} />
            </div>
            <span className="demo-test-value">{r.cooper}m</span>
            <span className="demo-test-navette">Navette: {r.navette}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanificacionView() {
  const weeks = [
    { week: 'Semana 1 (Jul 1-6)',  sessions: ['Técnica individual', 'Pressing alto', 'Partido 8v8', 'Recuperación activa'] },
    { week: 'Semana 2 (Jul 7-13)', sessions: ['Transiciones', 'Juego combinado', 'Partido 11v11', 'Fuerza + movilidad'] },
    { week: 'Semana 3 (Jul 14-20)', sessions: ['Estrategia córners', 'Ataque posicional', '⚽ Partido oficial', 'Análisis vídeo'] },
    { week: 'Semana 4 (Jul 21-27)', sessions: ['Basculación defensiva', 'Contragolpe', 'Partido 7v7', 'Test físicos'] },
  ];
  return (
    <div className="demo-view">
      <h2>📅 Planificación — Julio 2026</h2>
      <div className="demo-plan-grid">
        {weeks.map(w => (
          <div key={w.week} className="demo-week-card">
            <h4>{w.week}</h4>
            <ul>
              {w.sessions.map(s => <li key={s}>✔ {s}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const VIEWS = {
  dashboard:    <DashboardView />,
  equipo:       <EquipoView />,
  pizarra:      <PizarraView />,
  ia:           <IAView />,
  tests:        <TestsView />,
  planificacion: <PlanificacionView />,
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
          <span className="demo-badge">📸 MODO DEMO — Screenshots Play Store</span>
          <span className="demo-subtitle">Datos simulados · Sin conexión a Firestore</span>
        </div>
        <button className="demo-exit-btn" onClick={() => navigate('/')}>
          ✕ Salir del Demo
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

      {/* Footer con instrucciones */}
      <div className="demo-footer">
        📸 Captura esta pantalla en resolución <strong>1080×1920</strong> para Google Play Store
      </div>
    </div>
  );
}
