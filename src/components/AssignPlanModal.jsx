import React, { useState } from 'react';
import { useExercises } from '../hooks/useExercises';
import { usePlayerPlans } from '../hooks/usePlayerPlans';
import { useTranslation } from '../hooks/useTranslation';
import { assertAgeSafe } from '../utils/exerciseSafety';
import { calcularEdad } from '../utils/calcularEdad';
import { X, Search, CheckSquare, Square, AlertTriangle, ShieldAlert } from 'lucide-react';

const AssignPlanModal = ({ player, activeTeamId, onClose }) => {
  const { t, isEn, language } = useTranslation();

  const FREQUENCY_OPTIONS = [
    { value: 'daily', label: isEn ? 'Daily' : (language === 'pt' ? 'Diário' : language === 'fr' ? 'Quotidien' : 'Diario') },
    { value: 'mon-wed-fri', label: isEn ? 'Monday, Wednesday and Friday' : (language === 'pt' ? 'Segunda, Quarta e Sexta' : language === 'fr' ? 'Lundi, Mercredi et Vendredi' : 'Lunes, Miércoles y Viernes') },
    { value: 'weekly', label: isEn ? 'Once a week' : (language === 'pt' ? 'Uma vez por semana' : language === 'fr' ? 'Une fois par semaine' : 'Una vez por semana') },
    { value: 'pre-match', label: isEn ? 'Pre-match' : (language === 'pt' ? 'Pré-jogo' : language === 'fr' ? 'Avant-match' : 'Pre-partido') },
  ];

  const REASON_OPTIONS = [
    { value: 'prevencion', label: isEn ? 'Prevention' : (language === 'pt' ? 'Prevenção' : language === 'fr' ? 'Prévention' : 'Prevención') },
    { value: 'recuperacion', label: isEn ? 'Recovery / Injury' : (language === 'pt' ? 'Recuperação / Lesão' : language === 'fr' ? 'Récupération / Blessure' : 'Recuperación / Lesión') },
    { value: 'fortalecimiento', label: isEn ? 'General strengthening' : (language === 'pt' ? 'Fortalecimento geral' : language === 'fr' ? 'Renforcement général' : 'Fortalecimiento general') },
  ];

  const { exercises } = useExercises(activeTeamId);
  const { addPlayerPlan } = usePlayerPlans(activeTeamId);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [frequency, setFrequency] = useState('daily');
  const [reason, setReason] = useState('prevencion');
  const [planName, setPlanName] = useState('');
  const [saving, setSaving] = useState(false);

  // Cálculo de edad del jugador para C2 (Bloqueo duro)
  const playerAge = calcularEdad(player?.fechaNacimiento || player?.birthDate || player?.edad || player?.age)?.years;

  const validExercises = exercises.filter(ex => {
    const rawName = (ex.name || ex.titulo || ex.title || ex.nombre || '').trim();
    return rawName.length > 0 && rawName !== '<think>' && rawName !== '</think>';
  });

  const filtered = validExercises.filter(ex => {
    const name = (ex.name || ex.titulo || ex.title || ex.nombre || '').toLowerCase();
    const cat = (ex.category || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || cat.includes(q);
  });

  const toggleSelect = (ex) => {
    const ageCheck = assertAgeSafe(playerAge, ex);
    if (!ageCheck.safe) {
      // Bloqueo duro: no se permite seleccionar si la edad no es apta
      return;
    }
    const id = ex.id;
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      alert(isEn ? 'Please select at least one exercise.' : (language === 'pt' ? 'Selecione pelo menos um exercício.' : language === 'fr' ? 'Veuillez sélectionner au moins un exercice.' : 'Selecciona al menos un ejercicio.'));
      return;
    }

    // Doble verificación de seguridad antes de persistir
    const unsafeSelected = selectedIds.some(id => {
      const ex = exercises.find(e => e.id === id);
      return ex && !assertAgeSafe(playerAge, ex).safe;
    });

    if (unsafeSelected) {
      alert(t('plans.assignModal.ageBlocked', 'No apto para la edad del jugador'));
      return;
    }

    setSaving(true);
    await addPlayerPlan({
      playerId: player.id,
      teamId: activeTeamId,
      name: planName || `Plan de ${reason} — ${player.name || player.nombre}`,
      reason,
      createdBy: 'trainer',
      exercises: selectedIds.map(id => ({
        exerciseId: id,
        frequency,
        completedDates: [],
        assignedDate: new Date().toISOString(),
      })),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{
          background: '#1B3A2D', color: '#fff', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
              📋 {t('plans.assignModal.title', 'Asignar Plan de Ejercicios')}
            </h2>
            <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
              {player.name || player.nombre}
              {playerAge !== null && playerAge !== undefined ? ` · ${playerAge} ${isEn ? 'years old' : (language === 'pt' ? 'anos' : language === 'fr' ? 'ans' : 'años')}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
            borderRadius: '8px', padding: '8px', cursor: 'pointer'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                {t('plans.assignModal.planName', 'Nombre del Plan (opcional)')}
              </label>
              <input
                type="text"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder={isEn ? "e.g. Hamstrings prevention" : "Ej: Prevención isquios"}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                {t('plans.assignModal.reason', 'Motivo')}
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit' }}
              >
                {REASON_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              {t('plans.assignModal.frequency', 'Frecuencia')}
            </label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit' }}
            >
              {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              {t('plans.assignModal.selectExercises', 'Seleccionar Ejercicios')} ({selectedIds.length} {isEn ? 'selected' : (language === 'pt' ? 'selecionados' : language === 'fr' ? 'sélectionnés' : 'seleccionados')})
            </label>
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder={t('plans.assignModal.searchPlaceholder', 'Buscar ejercicio...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 34px', border: '1px solid #E5E7EB', borderRadius: '8px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '10px' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: '0.88rem' }}>
                  {isEn ? 'No exercises available.' : 'No se encontraron ejercicios disponibles.'}
                </div>
              ) : (
                filtered.map(ex => {
                  const isSelected = selectedIds.includes(ex.id);
                  const displayName = (ex.name || ex.titulo || ex.title || ex.nombre || 'Ejercicio').replace(/<\/?think>/gi, '').trim();
                  
                  // Seguridad Biomecánica y Prescripción
                  const minAge = ex.edad_minima_segura ?? ex.age_min ?? 0;
                  const ageCheck = assertAgeSafe(playerAge, ex);
                  const isBlocked = !ageCheck.safe;
                  const reqSupervision = !!ex.requiere_supervision_presencial;

                  const preferredMaterial = Array.isArray(ex.material_preferido) && ex.material_preferido.length > 0
                    ? ex.material_preferido.join(', ')
                    : (ex.material || null);

                  const altOptions = Array.isArray(ex.alternativa_casa?.option) && ex.alternativa_casa.option.length > 0
                    ? ex.alternativa_casa.option.join(', ')
                    : null;

                  const altNota = ex.alternativa_casa?.nota?.[language] ||
                                  ex.alternativa_casa?.nota?.es ||
                                  ex.alternativa_casa?.nota?.en || '';

                  return (
                    <div
                      key={ex.id}
                      onClick={() => !isBlocked && toggleSelect(ex)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px', borderRadius: '8px',
                        cursor: isBlocked ? 'not-allowed' : 'pointer',
                        background: isBlocked ? '#FEF2F2' : (isSelected ? '#F0FDF4' : '#F8FAFC'),
                        border: isBlocked ? '1px solid #FCA5A5' : (isSelected ? '1px solid #4CAF7D' : '1px solid transparent'),
                        opacity: isBlocked ? 0.8 : 1,
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ paddingTop: '2px' }}>
                        {isBlocked ? (
                          <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                        ) : isSelected ? (
                          <CheckSquare size={18} color="#4CAF7D" style={{ flexShrink: 0 }} />
                        ) : (
                          <Square size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 600, color: isBlocked ? '#991B1B' : '#111827', fontSize: '0.9rem' }}>
                            {displayName}
                          </div>
                          {/* Badges de Seguridad */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {isBlocked && (
                              <span style={{
                                fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                background: '#FEE2E2', color: '#B91C1C', fontWeight: 700,
                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}>
                                ⛔ {t('plans.assignModal.ageBlocked', 'No apto para edad')} ({minAge} {isEn ? 'yrs' : 'años'})
                              </span>
                            )}
                            {!isBlocked && minAge > 0 && (
                              <span style={{
                                fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                background: '#EFF6FF', color: '#1D4ED8', fontWeight: 600
                              }}>
                                👶 {t('plans.assignModal.minAge', 'Edad mín.')}: {minAge} {isEn ? 'yrs' : (language === 'pt' ? 'anos' : language === 'fr' ? 'ans' : 'años')}
                              </span>
                            )}
                            {reqSupervision && (
                              <span style={{
                                fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                                background: '#FEF3C7', color: '#B45309', fontWeight: 600
                              }}>
                                👁️ {t('plans.assignModal.supervisionRequired', 'Supervisión presencial')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                          {ex.category || 'General'} {ex.series > 0 ? (isEn ? `· ${ex.series} sets` : `· ${ex.series} series`) : ''} {ex.durationSeconds > 0 ? `· ${ex.durationSeconds}s` : ''} {ex.reps > 0 ? `· ${ex.reps} reps` : ''}
                        </div>

                        {/* Material Preferido y Alternativa Casera */}
                        {(preferredMaterial || altOptions) && (
                          <div style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {preferredMaterial && (
                              <div>
                                <span style={{ fontWeight: 600 }}>🏋️ {t('plans.assignModal.preferredMaterial', 'Material preferido')}:</span> {preferredMaterial}
                              </div>
                            )}
                            {altOptions && (
                              <div style={{ color: '#047857' }}>
                                <span style={{ fontWeight: 600 }}>🏡 {t('plans.assignModal.homeAlternative', 'Alternativa casera')}:</span> {altOptions}
                                {altNota ? <span style={{ fontStyle: 'italic', color: '#6B7280' }}> ({altNota})</span> : null}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #E5E7EB',
          display: 'flex', gap: '12px', justifyContent: 'flex-end'
        }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB',
            background: 'white', color: '#374151', cursor: 'pointer', fontFamily: 'inherit'
          }}>
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#4CAF7D', color: 'white', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', opacity: saving ? 0.7 : 1
          }}>
            {saving ? (t('common.saving', 'Guardando...')) : (`✅ ${t('plans.assignModal.assignBtn', 'Asignar Plan')}`)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignPlanModal;
