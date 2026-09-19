/**
 * src/utils/solutionPatterns.js
 * MÍSTER11 — Catálogo Estructurado de Patrones de Solución Arquitectónicos
 * Sistema de Aprendizaje Continuo para Acelerar y Estandarizar Futuros Desarrollos
 */

export const SOLUTION_PATTERNS = {
  ASYNC_OPERATION_WITH_LOADING: {
    name: "ASYNC_OPERATION_WITH_LOADING",
    description: "Patrón canónico para operaciones asíncronas con feedback de carga inquebrantable",
    template: `
const handleOperation = async () => {
  setIsLoading(true);
  try {
    const result = await asyncServiceCall();
    showToast(t('common.savedSuccess'), 'success');
    return result;
  } catch (err) {
    console.error('[Operation Error]:', err);
    showToast(err.message || t('common.errorGeneral'), 'error');
  } finally {
    setIsLoading(false);
  }
};
    `,
    useCases: ["Guardar asistencia", "Subir archivos multimedia", "Generar informe PDF", "Calificar sesión deportiva"]
  },

  REAL_TIME_SEARCH: {
    name: "REAL_TIME_SEARCH",
    description: "Búsqueda en tiempo real con debounce de 300 ms y cancelación de temporizador",
    template: `
const [searchTerm, setSearchTerm] = useState('');
const [results, setResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);

useEffect(() => {
  const cleanTerm = searchTerm.trim().toUpperCase();
  if (cleanTerm.length < 6) {
    setResults([]);
    return;
  }

  setIsSearching(true);
  const timer = setTimeout(async () => {
    try {
      const data = await searchService(cleanTerm);
      setResults(data);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  return () => clearTimeout(timer);
}, [searchTerm]);
    `,
    useCases: ["Búsqueda de equipo por código", "Filtro de jugadores en plantilla", "Validación de códigos de staff"]
  },

  CONTEXTUAL_PERMISSIONS: {
    name: "CONTEXTUAL_PERMISSIONS",
    description: "Determinación de permisos basada en el contexto del recurso u organización, no del usuario individual",
    template: `
export const useEffectivePlan = (teamId) => {
  const { user } = useAuth();
  const { activeTeam } = useTeams();

  // Si el usuario es miembro de un equipo cuyo dueño tiene Plan Pro/Club, hereda las capacidades
  const isOwner = activeTeam?.ownerId === user?.uid;
  const ownerPlan = activeTeam?.ownerPlan || 'free';
  const effectivePlan = isOwner ? (user?.plan || 'free') : ownerPlan;

  return {
    effectivePlan,
    canExportMP4: ['pro', 'club_pro', 'club_premium'].includes(effectivePlan),
    canUseAI: ['pro', 'club_pro', 'club_premium'].includes(effectivePlan),
    isStaffHeredado: !isOwner && ownerPlan !== 'free'
  };
};
    `,
    useCases: ["Staff Heredado en equipos Pro", "Control de acceso a Pizarra Táctica", "Exportación de informes técnicos"]
  },

  CREATEPORTAL_FOR_FIXED_ELEMENTS: {
    name: "CREATEPORTAL_FOR_FIXED_ELEMENTS",
    description: "Renderizado de barras de acción fijas mediante React Portal para evitar colisiones con la navegación móvil",
    template: `
import ReactDOM from 'react-dom';

export const MobileActionBar = ({ onSave, onCancel, isSaving, children }) => {
  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="mobile-action-bar-portal fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#1B3A2D] border-t border-[#D4A843]/30 shadow-2xl flex items-center justify-between gap-3">
      {children || (
        <>
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 min-h-[48px]">
            CANCELAR
          </button>
          <button type="button" onClick={onSave} disabled={isSaving} className="btn-primary flex-1 min-h-[48px]">
            {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </>
      )}
    </div>,
    document.body
  );
};
    `,
    useCases: ["Barra de guardar asistencia", "Botones de confirmación de convocatoria", "Acciones críticas en móvil"]
  },

  IMAGE_WITH_FALLBACK: {
    name: "IMAGE_WITH_FALLBACK",
    description: "Componente de imagen con fallback automático a avatar con inicial sobre paleta oficial",
    template: `
import React, { useState } from 'react';

export const PlayerAvatar = ({ photoUrl, name = 'J', size = 44, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (!photoUrl || hasError) {
    const initial = name.trim().charAt(0).toUpperCase() || 'J';
    return (
      <div 
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className={\`rounded-full bg-[#1B3A2D] text-[#D4A843] border border-[#D4A843]/40 font-black flex items-center justify-center text-sm shadow-md \${className}\`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img 
      src={photoUrl} 
      alt={name} 
      onError={() => setHasError(true)}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className={\`rounded-full object-cover border border-[#4CAF7D] shadow-md \${className}\`}
    />
  );
};
    `,
    useCases: ["Tarjetas de jugador (PlayerCard)", "Alineaciones en pizarra", "Convocatoria PNG", "Acta oficial en PDF"]
  },

  CANVAS_PNG_GENERATION: {
    name: "CANVAS_PNG_GENERATION",
    description: "Generación canónica de imágenes de alta resolución mediante Canvas con fuentes y fallback cargados",
    template: `
export const generateMatchBannerCanvas = async ({ teamName, rivalName, matchDate, players = [] }) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350; // Ratio estándar vertical 4:5
  const ctx = canvas.getContext('2d');

  // 1. Fondo Pizarra Pizarra Verde
  ctx.fillStyle = '#111B21';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Encabezado con Paleta Oro y Verde Selva
  ctx.fillStyle = '#1B3A2D';
  ctx.fillRect(40, 40, canvas.width - 80, 160);
  ctx.strokeStyle = '#D4A843';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, canvas.width - 80, 160);

  // 3. Título y Contenido con Fuentes Canónicas
  ctx.font = 'bold 42px Outfit, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(\`\${teamName} vs \${rivalName}\`, canvas.width / 2, 130);

  return canvas.toDataURL('image/png');
};
    `,
    useCases: ["Generador de Convocatorias en PNG", "Exportación gráfica de Pizarra Táctica", "Resumen de partido"]
  }
};

export default SOLUTION_PATTERNS;
