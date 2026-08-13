import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { getSharedSession, exportSessionToJSONFile, exportSessionToICSFile } from '../utils/sessionSharing';
import { addDocument, createNotification } from '../firebase/db';
import { Share2, Download, Calendar, ArrowRight, Check, Shield, Copy } from 'lucide-react';
import './SharedSession.css';

const SharedSession = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user, getTeamPath } = useAuth();
  const { teams } = useTeams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await getSharedSession(shareId);
        if (data) {
          setSession(data);
        } else {
          setError('La sesión solicitada no existe o el enlace ha caducado.');
        }
      } catch (err) {
        console.error('Error al cargar la sesión compartida:', err);
        setError('Error al conectar con Míster11 para cargar la sesión.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [shareId]);

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const handleImportToTeam = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!selectedTeamId) {
      alert('Por favor, selecciona un equipo para importar la sesión.');
      return;
    }

    try {
      setImporting(true);
      const teamPath = getTeamPath(selectedTeamId);
      
      const sessionPayload = {
        title: session.title || 'Sesión Compartida',
        category: session.category || 'Táctica',
        duration: Number(session.duration || 90),
        intensity: session.intensity || 'Media',
        materials: session.materials || '',
        objectives: session.objectives || '',
        date: new Date().toISOString().split('T')[0],
        time: '18:00',
        blocks: session.blocks || [],
        importedFromShareId: shareId,
        importedAt: new Date().toISOString(),
      };

      await addDocument(`${teamPath}/sessions`, sessionPayload);
      await createNotification('success', `Sesión "${sessionPayload.title}" importada con éxito`).catch(() => {});
      
      setImportedSuccess(true);
      setTimeout(() => {
        navigate('/sesiones');
      }, 1200);
    } catch (err) {
      console.error('Error al importar sesión:', err);
      alert('Error al guardar la sesión en tu equipo.');
    } finally {
      setImporting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="shared-session-container">
        <div className="ss-loader">
          <div className="ss-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Cargando sesión de entrenamiento compartida...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="shared-session-container">
        <div className="ss-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Shield size={48} color="#dc2626" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#ffffff', marginBottom: '0.5rem' }}>Sesión no encontrada</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{error}</p>
          <button className="ss-btn-primary" style={{ margin: '0 auto' }} onClick={() => navigate('/')}>
            Ir a Míster11
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-session-container">
      <div className="ss-card">
        {/* Cabecera */}
        <div className="ss-header">
          <div>
            <span className="ss-badge-shared">
              <Share2 size={14} /> Sesión Compartida por {session.sharedByName || 'Entrenador'}
            </span>
            <h1 className="ss-title">{session.title}</h1>
            <p className="ss-subtitle">
              {session.teamName} • Creada el {new Date(session.sharedAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <button className="ss-btn-secondary" onClick={handleCopyLink} title="Copiar enlace">
            {copiedLink ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
            {copiedLink ? '¡Copiado!' : 'Compartir Link'}
          </button>
        </div>

        {/* Metadatos */}
        <div className="ss-meta-grid">
          <div className="ss-meta-item">
            <div className="ss-meta-label">Categoría</div>
            <div className="ss-meta-value">{session.category || 'General'}</div>
          </div>
          <div className="ss-meta-item">
            <div className="ss-meta-label">Duración</div>
            <div className="ss-meta-value">{session.duration || 90} min</div>
          </div>
          <div className="ss-meta-item">
            <div className="ss-meta-label">Intensidad</div>
            <div className="ss-meta-value">{session.intensity || 'Media'}</div>
          </div>
          <div className="ss-meta-item">
            <div className="ss-meta-label">Bloques</div>
            <div className="ss-meta-value">{(session.blocks || []).length} ejercicios</div>
          </div>
        </div>

        {/* Objetivos & Materiales */}
        {session.objectives && (
          <div className="ss-objectives-box">
            <strong>🎯 Objetivo Táctico / Principal:</strong>
            <p style={{ margin: '0.4rem 0 0 0' }}>{session.objectives}</p>
            {session.materials && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                📦 Material necesario: {session.materials}
              </p>
            )}
          </div>
        )}

        {/* Bloques de la Sesión */}
        <div className="ss-section-title">
          <Calendar size={20} /> Bloques y Tareas de Entrenamiento
        </div>

        <div className="ss-blocks-list">
          {(session.blocks || []).map((block, idx) => (
            <div key={block.id || idx} className="ss-block-card">
              <div className="ss-block-header">
                <div className="ss-block-name">
                  <span className="ss-block-num">{idx + 1}</span>
                  {block.name}
                </div>
                <div className="ss-block-type">
                  {block.type} • {block.duration} min
                </div>
              </div>
              <p className="ss-block-desc">{block.description}</p>
              {block.imageUrl && (
                <img src={block.imageUrl} alt={block.name} className="ss-block-img" />
              )}
            </div>
          ))}
        </div>

        {/* Barra de Acciones / Importación */}
        <div className="ss-actions-bar">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="ss-btn-secondary" onClick={() => exportSessionToJSONFile(session)}>
              <Download size={16} /> JSON (.m11session)
            </button>
            <button className="ss-btn-secondary" onClick={() => exportSessionToICSFile(session)}>
              <Calendar size={16} /> iCalendar (.ics)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user && teams && teams.length > 0 && (
              <select
                className="ss-select-team"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre || t.name}
                  </option>
                ))}
              </select>
            )}

            <button
              className="ss-btn-primary"
              disabled={importing || importedSuccess}
              onClick={handleImportToTeam}
            >
              {importedSuccess ? (
                <>
                  <Check size={18} /> ¡Guardado en tu Equipo!
                </>
              ) : importing ? (
                'Importando...'
              ) : (
                <>
                  📥 Importar a mi Equipo <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedSession;
