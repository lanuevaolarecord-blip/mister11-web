import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useTranslation } from '../../hooks/useTranslation';
import { getWeekKey } from '../../hooks/useCognitiveSync';
import { RETOS_CATALOG } from '../games/retos/retosConfig';
import { showToast } from '../../utils/toast';
import { Brain, CheckCircle2, Star, TrendingUp, Clock, Target, Plus, X } from 'lucide-react';

const COGNITIVE_GAMES_LIST = [
  { id: 'g1', name: 'Semáforo Pro', icon: '🚦' },
  { id: 'g2', name: 'Freno Impulsivo', icon: '🛑' },
  { id: 'g3', name: 'Ojo Táctico', icon: '👁️' },
  { id: 'g4', name: 'Memoria de Conos', icon: '🔺' },
  { id: 'g5', name: 'Respiración 4-4', icon: '🌬️' },
  { id: 'g6', name: 'Decisión 1 Segundo', icon: '⚡' }
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
    <div style={{
      background: 'var(--bg-card, #ffffff)',
      border: '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '14px',
      padding: '18px 20px',
      marginTop: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(30, 58, 138, 0.1)',
            color: '#1E3A8A',
            padding: '8px',
            borderRadius: '10px'
          }}>
            <Brain size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
              Supervisión Cognitiva y Retos en Casa
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              Semana actual · {sessionsThisWeek.length} sesiones registradas
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            style={{
              background: '#10B981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={handleVerify}
            disabled={verifying}
          >
            <CheckCircle2 size={16} />
            {verifying ? 'Verificando…' : '✔ Verificado (+5 XP)'}
          </button>

          <button
            type="button"
            style={{
              background: '#1E3A8A',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setShowAssignModal(true)}
          >
            <Star size={16} />
            Recomendar Reto
          </button>
        </div>
      </div>

      {/* Grid de Métricas Semanales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div style={{ background: 'var(--bg-surface, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Sesiones semana
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E3A8A', marginTop: '4px' }}>
            {sessionsThisWeek.length}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚡ Reacción mediana
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {medianReaction ? `${medianReaction} ms` : '—'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Target size={12} /> Precisión media
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
            {avgAccuracy ? `${avgAccuracy}%` : '—'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', padding: '10px 12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> Tendencia
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: isImproving ? '#10B981' : '#f59e0b', marginTop: '4px' }}>
            {isImproving ? '↑ En progresión' : '= Estable'}
          </div>
        </div>
      </div>

      {/* Asignaciones activas */}
      {activeAssignments.length > 0 && (
        <div style={{ marginTop: '12px', padding: '8px 12px', background: '#eff6ff', borderRadius: '8px', fontSize: '12px', color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📌 Reto recomendado activo:</span>
          <strong>{activeAssignments[0].gameName}</strong>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
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
