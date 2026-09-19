/**
 * src/utils/universalPatterns.js
 * MÍSTER11 & UNIVERSAL ARCHITECTURE — Patrones de Código Reutilizables Multi-Proyecto
 * 
 * Plantillas agnósticas y universales listas para transferir o adaptar a cualquier
 * frontend moderno (React, Vite, Next.js, Vue, Svelte, Capacitor).
 */

export const UNIVERSAL_PATTERNS = {
  /**
   * 1. Operación asíncrona con feedback de carga y limpieza garantizada
   */
  ASYNC_UI_OPERATION: `
const handleAsyncAction = async () => {
  setIsLoading(true);
  try {
    const response = await apiService.execute();
    showNotification({ type: 'success', message: t('common.success') });
    return response;
  } catch (error) {
    console.error('[Async Error]:', error);
    showNotification({ type: 'error', message: error.message || t('common.genericError') });
  } finally {
    // REGLA CRÍTICA: Restablecer siempre el estado en finally
    setIsLoading(false);
  }
};
  `.trim(),

  /**
   * 2. Búsqueda en tiempo real con debounce y cancelación
   */
  DEBOUNCED_SEARCH: `
useEffect(() => {
  const cleanQuery = query.trim();
  if (cleanQuery.length < minChars) {
    setResults([]);
    return;
  }

  setIsSearching(true);
  const timer = setTimeout(async () => {
    try {
      const data = await searchService(cleanQuery);
      setResults(data);
    } catch (err) {
      console.error('[Search Error]:', err);
    } finally {
      setIsSearching(false);
    }
  }, 300); // Ventana estándar de 300ms

  return () => clearTimeout(timer);
}, [query]);
  `.trim(),

  /**
   * 3. Componente de imagen resiliente con fallback a iniciales
   */
  SAFE_IMAGE_RENDER: `
const ResilientImage = ({ src, alt, fallbackText = '?', size = 40, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    const initial = (fallbackText.trim().charAt(0) || '?').toUpperCase();
    return (
      <div 
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className={\`rounded-full flex items-center justify-center font-bold select-none \${className}\`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt || fallbackText} 
      onError={() => setHasError(true)}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className={\`rounded-full object-cover \${className}\`}
    />
  );
};
  `.trim(),

  /**
   * 4. Barra de acciones crítica móvil renderizada vía Portal
   */
  PORTAL_FIXED_ACTION_BAR: `
import ReactDOM from 'react-dom';

const FixedActionBarPortal = ({ onConfirm, onCancel, isProcessing, confirmLabel, cancelLabel }) => {
  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-surface border-t border-divider shadow-2xl flex items-center justify-between gap-3 safe-area-pb">
      <button 
        type="button" 
        onClick={onCancel} 
        disabled={isProcessing}
        className="min-h-[48px] px-4 py-2 rounded-lg font-bold border border-subtle flex-1"
      >
        {cancelLabel || 'CANCELAR'}
      </button>
      <button 
        type="button" 
        onClick={onConfirm} 
        disabled={isProcessing}
        className="min-h-[48px] px-4 py-2 rounded-lg font-bold bg-primary text-white flex-1"
      >
        {isProcessing ? 'PROCESANDO...' : (confirmLabel || 'GUARDAR')}
      </button>
    </div>,
    document.body
  );
};
  `.trim(),

  /**
   * 5. Permisos contextuales (Intersección de rol personal y rol del espacio de trabajo)
   */
  CONTEXTUAL_PERMISSION_RESOLVER: `
const resolveContextualPermission = ({ userGlobalPlan, workspaceRole, workspaceOwnerPlan }) => {
  // El permiso efectivo adopta las facultades del plan del espacio si este es superior
  const planPriority = { free: 0, starter: 1, pro: 2, enterprise: 3 };
  const effectivePlanScore = Math.max(
    planPriority[userGlobalPlan] || 0,
    planPriority[workspaceOwnerPlan] || 0
  );

  return {
    canUseAdvancedTools: effectivePlanScore >= planPriority.pro,
    canExportReports: effectivePlanScore >= planPriority.starter,
    isGuestRole: workspaceRole === 'guest',
    isInheritedAccess: (planPriority[workspaceOwnerPlan] || 0) > (planPriority[userGlobalPlan] || 0)
  };
};
  `.trim(),

  /**
   * 6. Exportación de Canvas con watchdog de seguridad y chunks
   */
  RESILIENT_CANVAS_EXPORT: `
const exportCanvasWithWatchdog = async (canvasElement, timeoutMs = 15000) => {
  return new Promise((resolve, reject) => {
    const watchdog = setTimeout(() => {
      reject(new Error('TIMEOUT_EXCEEDED: El renderizado excedió el tiempo límite de seguridad.'));
    }, timeoutMs);

    try {
      // Uso de requestAnimationFrame para asegurar que el renderizado de frames ocurra libre de bloqueo
      requestAnimationFrame(() => {
        const dataUrl = canvasElement.toDataURL('image/png', 0.95);
        clearTimeout(watchdog);
        resolve(dataUrl);
      });
    } catch (err) {
      clearTimeout(watchdog);
      reject(err);
    }
  });
};
  `.trim(),

  /**
   * 7. Peticiones de red abortables con AbortController
   */
  ABORTABLE_FETCH: `
const fetchWithAbort = (url, options = {}) => {
  const controller = new AbortController();
  const { signal } = controller;

  const promise = fetch(url, { ...options, signal })
    .then(res => {
      if (!res.ok) throw new Error(\`HTTP_\${res.status}\`);
      return res.json();
    });

  promise.cancel = () => controller.abort();
  return promise;
};
  `.trim()
};

export default UNIVERSAL_PATTERNS;
