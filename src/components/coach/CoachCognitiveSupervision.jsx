import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTranslation } from '../../hooks/useTranslation';
import { getWeekKey } from '../../hooks/useCognitiveSync';
import { RETOS_CATALOG } from '../games/retos/retosConfig';
import { showToast } from '../../utils/toast';
import { Brain, CheckCircle2, Star, TrendingUp, Clock, Target, Plus, X, Award } from 'lucide-react';
import { NIVEL_LABELS, getCategoria } from '../../utils/cognitiveLevels';
import '../games/Games.css';

const COGNITIVE_GAMES_LIST = [
  { id: 'g1', name: 'Semáforo Pro', icon: '🚦', code: 'semaforo' },
  { id: 'g2', name: 'Freno Impulsivo', icon: '🛑', code: 'freno' },
  { id: 'g3', name: 'Ojo Táctico', icon: '👁️', code: 'ojo' },
  { id: 'g4', name: 'Memoria de Conos', icon: '🔺', code: 'memoria' },
  { id: 'g5', name: 'Respiración 4-4', icon: '🌬️', code: 'respiracion' },
  { id: 'g6', name: 'Decisión 1 Segundo', icon: '⚡', code: 'decision' }
];

const COMPETITIVE_GAMES = [
  { id: 'semaforo', altId: 'g1', name: 'Semáforo', icon: '🚦' },
  { id: 'freno', altId: 'g2', name: 'Freno', icon: '🛑' },
  { id: 'ojo', altId: 'g3', name: 'Ojo Táctico', icon: '👁️' },
  { id: 'memoria', altId: 'g4', name: 'Memoria', icon: '🔺' },
  { id: 'decision', altId: 'g6', name: 'Decisión 1"', icon: '⚡' }
];

export const CoachCognitiveSupervision = ({ player, teamPath, teamId }) => {
  const { t } = useTranslation();
  const cleanPath = teamPath ? teamPath.replace(/^\/+|\/+$/g, '') : '';
  const playerId = player?.id;
  const currentWeek = getWeekKey();

  const [cognitiveSessions, setCognitiveSessions] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('g1');
  const [assignTarget, setAssignTarget] = useState('player'); // 'player' | 'team'
  const [verifying, setVerifying] = useState(false);

  // Escuchar sesiones cognitivas del jugador
  useEffect(() => {
    if (!cleanPath || !playerId) return;

    const colRef = collection(db, `${cleanPath}/players/${playerId}/cognitive`);
    const unsub = onSnapshot(colRef, (snap) => {
      setCognitiveSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('[CoachCognitiveSupervision] Error cargando sesiones:', err);
    });

    return () => unsub();
  }, [cleanPath, playerId]);

  // Escuchar asignaciones activas
  useEffect(() => {
    if (!cleanPath) return;

    const assignRef = collection(db, `${cleanPath}/gameAssignments`);
    const unsub = onSnapshot(assignRef, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const relevant = all.filter(a => a.target === 'team' || a.target === playerId || a.playerId === playerId);
      setActiveAssignments(relevant);
    });

    return () => unsub();
  }, [cleanPath, playerId]);

  // Métricas de la semana actual
  const sessionsThisWeek = cognitiveSessions.filter(s => {
    const d = (s.startedAt || s.endedAt || '').split('T')[0];
    return d && d >= currentWeek;
  });

  const reactionTimes = sessionsThisWeek
    .map(s => s.reactionMs)
    .filter(r => r !== null && r !== undefined && !isNaN(r));
  const medianReaction = reactionTimes.length
    ? Math.round(reactionTimes.sort((a, b) => a - b)[Math.floor(reactionTimes.length / 2)])
    : (player?.cognitive?.best?.g1 || null);

  const accuracies = sessionsThisWeek
    .map(s => s.accuracy)
    .filter(a => a !== null && a !== undefined && !isNaN(a));
  const avgAccuracy = accuracies.length
    ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
    : (player?.cognitive?.best?.g2 || null);

  // Tendencia
  const isImproving = (player?.cognitive?.weekly?.improvement || 0) >= 0;

  // Acción: Verificar retos con +5 XP
  const handleVerify = async () => {
    if (!cleanPath || !playerId || verifying) return;
    setVerifying(true);

    try {
      const pRef = doc(db, `${cleanPath}/players`, playerId);
      await updateDoc(pRef, {
        'cognitive.verifiedByCoach': true,
        'cognitive.lastVerifiedAt': serverTimestamp(),
        'cognitive.verifiedBonusXP': increment(5)
      });

      showToast(`✔ Retos verificados: +5 XP asignados a ${player?.name || 'jugador'}`, 'success');
    } catch (err) {
      console.warn('[CoachCognitiveSupervision] Error al verificar:', err);
      showToast('Error al registrar verificación', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Acción: Crear asignación de juego o reto
  const handleCreateAssignment = async () => {
    if (!cleanPath) return;

    try {
      const assignId = `assign_${Date.now()}`;
      const assignRef = doc(db, `${cleanPath}/gameAssignments`, assignId);

      const allItems = [...COGNITIVE_GAMES_LIST, ...RETOS_CATALOG.map(r => ({ id: r.id, name: r.t, icon: r.em }))];
      const selectedItem = allItems.find(i => i.id === selectedGameId);

      await setDoc(assignRef, {
        id: assignId,
        teamId: teamId || cleanPath,
        target: assignTarget, // 'team' | playerId
        playerId: assignTarget === 'player' ? playerId : null,
        gameId: selectedGameId,
        gameName: selectedItem ? `${selectedItem.icon} ${selectedItem.name}` : selectedGameId,
        weekKey: currentWeek,
        freqPerWeek: 3,
        createdAt: serverTimestamp()
      });

      showToast('Recomendación asignada con éxito al plan semanal', 'success');
      setShowAssignModal(false);
    } catch (err) {
      console.warn('[CoachCognitiveSupervision] Error asignando reto:', err);
      showToast('Error al guardar la asignación', 'error');
    }
  };

  return (
    <div className="coach-cognitive-card">
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="coach-header-icon">
            <Brain size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--games-text-primary, var(--text-primary))' }}>
              Supervisión Cognitiva y Retos en Casa
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--games-text-secondary, var(--text-secondary))' }}>
              Semana actual · {sessionsThisWeek.length} sesiones registradas
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="game-play-btn success"
            style={{ minHeight: '40px', padding: '0 12px', fontSize: '12px' }}
            onClick={handleVerify}
            disabled={verifying}
          >
            <CheckCircle2 size={16} />
            {verifying ? 'Verificando…' : '✔ Verificado (+5 XP)'}
          </button>

          <button
            type="button"
            className="game-play-btn"
            style={{ minHeight: '40px', padding: '0 12px', fontSize: '12px' }}
            onClick={() => setShowAssignModal(true)}
          >
            <Star size={16} />
            Recomendar Reto
          </button>
        </div>
      </div>

      {/* Grid de Métricas Semanales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div className="coach-metric-box">
          <div className="coach-metric-lbl">
            <Clock size={12} /> Sesiones semana
          </div>
          <div className="coach-metric-val">
            {sessionsThisWeek.length}
          </div>
        </div>

        <div className="coach-metric-box">
          <div className="coach-metric-lbl">
            ⚡ Reacción mediana
          </div>
          <div className="coach-metric-val">
            {medianReaction ? `${medianReaction} ms` : '—'}
          </div>
        </div>

        <div className="coach-metric-box">
          <div className="coach-metric-lbl">
            <Target size={12} /> Precisión media
          </div>
          <div className="coach-metric-val">
            {avgAccuracy ? `${avgAccuracy}%` : '—'}
          </div>
        </div>

        <div className="coach-metric-box">
          <div className="coach-metric-lbl">
            <TrendingUp size={12} /> Tendencia
          </div>
          <div className="coach-metric-val" style={{ color: isImproving ? '#10B981' : '#F59E0B' }}>
            {isImproving ? '↑ En progresión' : '= Estable'}
          </div>
        </div>
      </div>

      {/* Bloque: Niveles por Juego Adaptativo (Bronce -> Leyenda) */}
      <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--games-text-primary, var(--text-primary))', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Award size={15} color="#C9A84C" /> Nivel por Juego (Mérito Adaptativo)
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(27,58,45,0.1)', color: 'var(--primary, #1B3A2D)' }}>
            Categoría: {getCategoria(player?.birthDate).toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '8px' }}>
          {COMPETITIVE_GAMES.map(cg => {
            const rawLvl = player?.cognitive?.levels?.[cg.id] || player?.cognitive?.levels?.[cg.altId] || 'bronce';
            const info = NIVEL_LABELS[rawLvl] || NIVEL_LABELS.bronce;
            return (
              <div 
                key={cg.id} 
                style={{ 
                  background: 'var(--bg-card, #f8fafc)', 
                  border: `1px solid ${info.color}50`, 
                  borderRadius: '8px', 
                  padding: '8px 6px', 
                  textAlign: 'center' 
                }}
              >
                <div style={{ fontSize: '18px' }}>{cg.icon}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, margin: '2px 0', color: 'var(--text-primary, #0f172a)' }}>
                  {cg.name}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: info.color }}>
                  {info.badge} {info.es}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asignaciones activas */}
      {activeAssignments.length > 0 && (
        <div className="coach-active-assignment">
          <span>📌 Reto recomendado activo:</span>
          <strong>{activeAssignments[0].gameName}</strong>
          <span style={{ fontSize: '11px', opacity: 0.85 }}>
            ({activeAssignments[0].target === 'team' ? 'Todo el equipo' : 'Individual'})
          </span>
        </div>
      )}

      {/* Modal Recomendar Reto */}
      {showAssignModal && (
        <div className="game-shell-modal" role="dialog">
          <div className="game-shell-card" style={{ maxWidth: '420px' }}>
            <div className="game-shell-header">
              <h4 style={{ margin: 0, color: '#ffffff' }}>⭐ Asignar Reto o Juego</h4>
              <button 
                type="button" 
                className="game-shell-close-btn"
                onClick={() => setShowAssignModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Destinatario:
                </label>
                <select
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  value={assignTarget}
                  onChange={(e) => setAssignTarget(e.target.value)}
                >
                  <option value="player">Solo {player?.name || 'este jugador'}</option>
                  <option value="team">Toda la plantilla del equipo</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Seleccionar Juego o Reto:
                </label>
                <select
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  value={selectedGameId}
                  onChange={(e) => setSelectedGameId(e.target.value)}
                >
                  <optgroup label="🧠 Juegos Cognitivos">
                    {COGNITIVE_GAMES_LIST.map(g => (
                      <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="⚽ Retos en Casa">
                    {RETOS_CATALOG.map(r => (
                      <option key={r.id} value={r.id}>{r.em} {r.t} ({r.sk})</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <button
                type="button"
                className="game-play-btn"
                style={{ marginTop: '8px', width: '100%' }}
                onClick={handleCreateAssignment}
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CoachCognitiveSupervision;
