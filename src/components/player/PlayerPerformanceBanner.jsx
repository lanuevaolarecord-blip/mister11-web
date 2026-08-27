import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import LegendCard from '../LegendCard';
import { SvgRadar } from '../PlayerAnalyticsModal';
import { calculatePlayerPerformanceScores } from '../../utils/testScoreEngine';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import './PlayerPerformanceBanner.css';

// Catálogo canónico de tests para normalización y cálculo de baremos
const CANONICAL_TEST_SPECS = {
  't1': { type: 'fisico', category: 'Resistencia', unit: 'm', name: 'Test de Cooper' },
  't2': { type: 'fisico', category: 'Resistencia', unit: 'nivel', name: 'Course Navette' },
  't3': { type: 'fisico', category: 'Velocidad', unit: 'seg', name: 'Sprint 10m' },
  't4': { type: 'fisico', category: 'Velocidad', unit: 'seg', name: 'Sprint 30m' },
  't5': { type: 'fisico', category: 'Agilidad', unit: 'seg', name: 'T-Test' },
  't6': { type: 'fisico', category: 'Fuerza', unit: 'cm', name: 'Salto CMJ' },
  't7': { type: 'fisico', category: 'Técnica', unit: 'seg', name: 'Conducción conos' },
  't8': { type: 'fisico', category: 'Técnica', unit: 'pts', name: 'Pase a portería' },
  'psi1': { type: 'psicosocial', category: 'Afrontamiento', unit: 'pts', name: 'ACSI-28' },
  'psi2': { type: 'psicosocial', category: 'Fortaleza Mental', unit: 'pts', name: 'MTQ-10' },
  'psi3': { type: 'psicosocial', category: 'Metas', unit: 'pts', name: 'Establecimiento de Metas' },
  'psi4': { type: 'psicosocial', category: 'Liderazgo', unit: 'pts', name: 'Liderazgo' },
  'soc1': { type: 'socioemocional', category: 'Cohesión', unit: 'pts', name: 'GEQ (Cohesión)' },
  'soc2': { type: 'socioemocional', category: 'Bienestar', unit: 'pts', name: 'Bienestar Mental' },
  'soc3': { type: 'socioemocional', category: 'Autoconciencia', unit: 'pts', name: 'Autoconciencia' },
  'psi_acsi28_auto': { type: 'psicosocial', category: 'Afrontamiento', unit: 'pts', name: 'ACSI-28' },
  'psi_mtq10_auto': { type: 'psicosocial', category: 'Fortaleza Mental', unit: 'pts', name: 'MTQ-10' },
  'soc_geq_auto': { type: 'socioemocional', category: 'Cohesión', unit: 'pts', name: 'GEQ (Cohesión)' },
  'soc_mhc_auto': { type: 'socioemocional', category: 'Bienestar', unit: 'pts', name: 'Bienestar Mental' },
};

export const PlayerPerformanceBanner = ({ player, teamPath, onNavigateTab, onOpenSummary }) => {
  const { darkMode } = useTheme();
  const { t, isEn } = useTranslation();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const effectivePlayerId = player?.id || 'player-self';

  // 1. Escuchar evaluaciones en tiempo real sincronizadas con Míster11 (Tests.jsx)
  useEffect(() => {
    if (!cleanPath || !effectivePlayerId) {
      setLoading(false);
      return;
    }

    let evalsList = [];
    let testResultsList = [];

    const rebuildData = () => {
      const allCombined = [...evalsList, ...testResultsList];
      const seen = new Set();
      const unique = [];

      allCombined.forEach(item => {
        const pId = String(item.playerId || item.jugadorId || '');
        if (pId === String(effectivePlayerId)) {
          const key = item.id || `${item.testId}_${item.date || item.fecha}_${item.val || item.score}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
      });

      setEvaluations(unique);
      setLoading(false);
    };

    const unsubEvals = onSnapshot(collection(db, `${cleanPath}/evaluaciones`), (snap) => {
      evalsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildData();
    }, () => setLoading(false));

    const unsubResults = onSnapshot(collection(db, `${cleanPath}/test_results`), (snap) => {
      testResultsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rebuildData();
    }, () => {});

    return () => {
      unsubEvals();
      unsubResults();
    };
  }, [cleanPath, effectivePlayerId]);

  // 2. Calcular baremos y métricas canónicas unificadas
  const scores = calculatePlayerPerformanceScores(evaluations, player);
  const { fis, tec, psi, soc, overall, testCount, stats4: stats, radarData4: radarData } = scores;
  const validDimensions = [fis, tec, psi, soc].filter(v => v > 0);

  return (
    <div className="player-performance-hero-container">
      {/* 1. TARJETA FIFA / LEGEND CARD */}
      <div className="hero-legend-card-col">
        <LegendCard
          player={player}
          overall={overall || '-'}
          position={player?.position || 'POS'}
          streak={testCount}
          type="elite"
          stats={stats}
        />
      </div>

      {/* 2. BANNER TÁCTICO CON CAMPO DE FÚTBOL Y RADAR */}
      <div className="hero-pitch-banner-col">
        {/* SVG Campo de Fútbol de Fondo */}
        <svg width="100%" height="100%" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" className="pitch-svg-bg">
          <rect x="10" y="10" width="380" height="230" fill="none" stroke="#1B3A2D" strokeWidth="2" />
          <line x1="200" y1="10" x2="200" y2="240" stroke="#1B3A2D" strokeWidth="2" />
          <circle cx="200" cy="125" r="40" fill="none" stroke="#1B3A2D" strokeWidth="2" />
          <circle cx="200" cy="125" r="3" fill="#1B3A2D" />
          <rect x="10" y="55" width="50" height="140" fill="none" stroke="#1B3A2D" strokeWidth="2" />
          <rect x="340" y="55" width="50" height="140" fill="none" stroke="#1B3A2D" strokeWidth="2" />
          <rect x="10" y="85" width="20" height="80" fill="none" stroke="#1B3A2D" strokeWidth="1.5" />
          <rect x="370" y="85" width="20" height="80" fill="none" stroke="#1B3A2D" strokeWidth="1.5" />
          <path d="M 60,105 A 25,25 0 0,1 60,145" fill="none" stroke="#1B3A2D" strokeWidth="2" />
          <path d="M 340,105 A 25,25 0 0,0 340,145" fill="none" stroke="#1B3A2D" strokeWidth="2" />
        </svg>

        {/* Balón 3D Wireframe en el centro */}
        <div className="pitch-ball-wireframe">
          <svg width="240" height="240" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
            <polygon points="50,30 38,38 42,54 58,54 62,38" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
            <line x1="50" y1="30" x2="50" y2="12" stroke="#1B3A2D" strokeWidth="0.75" />
            <line x1="38" y1="38" x2="20" y2="32" stroke="#1B3A2D" strokeWidth="0.75" />
            <line x1="42" y1="54" x2="28" y2="68" stroke="#1B3A2D" strokeWidth="0.75" />
            <line x1="58" y1="54" x2="72" y2="68" stroke="#1B3A2D" strokeWidth="0.75" />
            <line x1="62" y1="38" x2="80" y2="32" stroke="#1B3A2D" strokeWidth="0.75" />
            <path d="M50,12 C40,12 30,18 20,32" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
            <path d="M20,32 C12,45 15,58 28,68" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
            <path d="M28,68 C40,80 60,80 72,68" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
            <path d="M72,68 C85,58 88,45 80,32" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
            <path d="M80,32 C70,18 60,12 50,12" stroke="#1B3A2D" strokeWidth="0.75" fill="none" />
          </svg>
        </div>

        {/* Columna Izquierda: Radar Perfil de Rendimiento */}
        <div className="pitch-radar-block">
          <span className="pitch-block-title">PERFIL DE RENDIMIENTO</span>
          {testCount > 0 || validDimensions.length > 0 ? (
            <div className="radar-wrapper">
              <SvgRadar data={radarData} size={220} />
            </div>
          ) : (
            <div className="empty-radar-box">
              <div style={{ fontSize: 36, filter: 'grayscale(1)' }}>📊</div>
              <p style={{ fontSize: 13, marginTop: 6, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isEn ? 'No test data yet' : 'Sin evaluaciones aún'}.
              </p>
            </div>
          )}
          <div className="pitch-medal-badge">
            <span style={{ fontSize: '14px' }}>🎖️</span>
            <span>MEDALLA DE RENDIMIENTO</span>
          </div>
        </div>

        {/* Columna Derecha: TPI Score y Acciones */}
        <div className="pitch-tpi-block">
          <span className="pitch-block-title">TEST PERFORMANCE INDEX</span>
          
          <div className="tpi-score-badge">
            <span className="tpi-number">{overall}</span>
            <span className="tpi-label">TPI SCORE</span>
          </div>

          <div className="pitch-action-buttons">
            <button
              className="btn-pitch-gold"
              onClick={() => onNavigateTab ? onNavigateTab('stats') : null}
            >
              📈 Ver Analíticas Completas
            </button>
            
            <button
              className="btn-pitch-gold"
              onClick={() => onOpenSummary ? onOpenSummary() : null}
            >
              📄 Resumen Técnico
            </button>

            <button
              className="btn-pitch-outline"
              onClick={() => onNavigateTab ? onNavigateTab('tests') : null}
            >
              🔄 Renovar Cuestionarios y Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
