import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  FileEdit, 
  Bookmark, 
  Video, 
  Check, 
  Copy, 
  X,
  Send
} from 'lucide-react';

export const MatchActionsToolbar = ({
  onExportPdf,
  onShare,
  onAddTacticalNote,
  notesCount = 0,
  onToggleHighlight,
  isHighlighted = false,
  videoUrl = null
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNote = () => {
    if (noteText.trim()) {
      if (onAddTacticalNote) onAddTacticalNote(noteText.trim());
      setNoteText('');
      setShowNoteModal(false);
    }
  };

  return (
    <div className="match-actions-toolbar">
      {/* 📥 1. Exportar PDF */}
      <button 
        type="button" 
        className="action-btn pdf-btn"
        onClick={onExportPdf}
        title="Descargar informe completo en PDF"
      >
        <Download size={16} />
        <span>Exportar PDF</span>
      </button>

      {/* 🔗 2. Compartir */}
      <button 
        type="button" 
        className="action-btn share-btn"
        onClick={() => {
          if (onShare) onShare();
          setShowShareModal(true);
        }}
        title="Compartir estadísticas del partido"
      >
        <Share2 size={16} />
        <span>Compartir</span>
      </button>

      {/* 📝 3. Añadir Nota Táctica */}
      <button 
        type="button" 
        className="action-btn note-btn"
        onClick={() => setShowNoteModal(true)}
        title="Añadir observaciones tácticas del partido"
      >
        <FileEdit size={16} />
        <span>Notas {notesCount > 0 && `(${notesCount})`}</span>
      </button>

      {/* 🔖 4. Marcar Destacado */}
      <button 
        type="button" 
        className={`action-btn bookmark-btn ${isHighlighted ? 'active' : ''}`}
        onClick={onToggleHighlight}
        title={isHighlighted ? 'Partido marcado como clave' : 'Marcar como partido clave'}
      >
        <Bookmark size={16} fill={isHighlighted ? '#D4A843' : 'none'} color={isHighlighted ? '#D4A843' : 'currentColor'} />
        <span>{isHighlighted ? 'Destacado' : 'Marcar'}</span>
      </button>

      {/* 🎬 5. Ver Video */}
      {videoUrl && (
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="action-btn video-btn"
          title="Ver grabación del partido"
        >
          <Video size={16} />
          <span>Ver Video</span>
        </a>
      )}

      {/* ── Modal Compartir ──────────────────────────────────────────────── */}
      {showShareModal && (
        <div className="stats-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="stats-modal-card" onClick={e => e.stopPropagation()}>
            <div className="stats-modal-header">
              <h3>Compartir Estadísticas</h3>
              <button type="button" onClick={() => setShowShareModal(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>
            <div className="stats-modal-body">
              <p>Comparte este enlace para que tu cuerpo técnico o jugadores revisen los análisis y gráficas en vivo:</p>
              <div className="share-link-box">
                <input type="text" readOnly value={window.location.href} />
                <button type="button" onClick={handleCopyLink} className="copy-btn">
                  {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Añadir Nota Táctica ────────────────────────────────────── */}
      {showNoteModal && (
        <div className="stats-modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="stats-modal-card" onClick={e => e.stopPropagation()}>
            <div className="stats-modal-header">
              <h3>Añadir Nota Táctica</h3>
              <button type="button" onClick={() => setShowNoteModal(false)} className="close-btn">
                <X size={18} />
              </button>
            </div>
            <div className="stats-modal-body">
              <textarea
                placeholder="Escribe observaciones tácticas clave (ej: Ajustar presión alta tras pérdida en banda izquierda, mayor repliegue en ABP rival...)"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
            <div className="stats-modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowNoteModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-confirm" onClick={handleSaveNote} disabled={!noteText.trim()}>
                <Send size={14} />
                <span>Guardar Nota</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
