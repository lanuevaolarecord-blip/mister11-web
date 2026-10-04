# MÍSTER 11 — Backlog de Integridad y Deuda Técnica

## bug-integridad-status-acta
- **Tipo**: Bug de Integridad de Datos / Cierre de Acta
- **Severidad**: Media-Alta (Historial, estadísticas y conteos acumulados)
- **Alcance / Scope**: Fuera de Fase 2 (Decisión reservada al Product Owner / Dueño del producto)
- **Descripción**:
  El partido frente a Xilxes C.F. (jugado el 2026-09-09 con resultado 0-1 a favor del rival) mantiene persistido en Firestore el campo `status: 'Pendiente'`.
  Esto ocurre por una inconsistencia o fallo en la transacción de cierre de acta deportiva al finalizar el encuentro en la aplicación.
- **Efectos colaterales identificados**:
  1. Afecta el filtrado ingenuo de partidos en módulos dependientes si solo consultan `status === 'Pendiente'`.
  2. Puede alterar conteos históricos si no derivan el estado a través de la presencia de goles (`golesLocal`/`golesRival`) o actas cerradas.
- **Mitigación aplicada en Fase 2 (Bug R)**:
  El selector direccional de "Próximo Rival" (`getNextUpcomingMatch`) en `src/utils/nextUpcomingOpponent.js` ahora ignora los partidos cuya fecha es anterior a hoy (`date < today`), así como partidos con marcador definido o estado finalizado, esquivando el problema en la tarjeta del Dashboard sin alterar los documentos en base de datos.
- **Acción requerida (futura)**:
  Revisar el flujo de cierre de acta en `Partidos.jsx` / `LiveMatch.jsx` y crear una migración o script de reconciliación que actualice el `status` de partidos con marcador final a `'Finalizado'`.
