/**
 * src/types/engines.d.ts
 * Míster 11 — Tipado Estricto de Motores Puros de Partido (P9 / B8)
 *
 * Contratos formales para lineupEngine.js, minutesEngine.js y ratingFormula.js.
 * 100% libre de 'any'.
 */

// ── 1. MOTOR DE ALINEACIONES (lineupEngine.js) ───────────────────────────────

export type TacticalSystem =
  | '4-3-3'
  | '4-4-2'
  | '3-5-2'
  | '4-2-3-1'
  | '3-4-3'
  | '5-3-2'
  | '7v7-2-3-1'
  | '8v8-3-3-1';

export type TacticalPosition =
  | 'POR'
  | 'DFC'
  | 'LD'
  | 'LI'
  | 'CAD'
  | 'CAI'
  | 'MCD'
  | 'MC'
  | 'MCO'
  | 'MD'
  | 'MI'
  | 'ED'
  | 'EI'
  | 'DC';

export interface LineupPlayer {
  id: string;
  name: string;
  dorsal: number;
  position: TacticalPosition;
  isGoalkeeper: boolean;
  isInjured: boolean;
  isCaptain?: boolean;
}

export interface MatchLineup {
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
  system: TacticalSystem;
  captainId?: string;
}

export interface LineupValidationIssue {
  code: 'INVALID_STARTERS_COUNT' | 'MULTIPLE_GOALKEEPERS' | 'NO_GOALKEEPER' | 'DUPLICATE_DORSAL' | 'INJURED_IN_STARTERS';
  message: string;
  playerId?: string;
}

export interface LineupValidationResult {
  isValid: boolean;
  issues: LineupValidationIssue[];
  warnings: string[];
}

export declare function validateLineup(lineup: MatchLineup): LineupValidationResult;
export declare function sanitizeLineup(lineup: MatchLineup): MatchLineup;

// ── 2. MOTOR DE MINUTOS (minutesEngine.js) ───────────────────────────────────

export type MatchEventType =
  | 'inicio'
  | 'fin'
  | 'gol'
  | 'tarjeta_amarilla'
  | 'tarjeta_roja'
  | 'sustitucion'
  | 'lesion';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number;
  playerId?: string;
  subInPlayerId?: string;
  subOutPlayerId?: string;
  extraInfo?: string;
}

export type MatchProgressStatus = 'programado' | 'en_juego' | 'finalizado' | 'suspendido';

export declare function calculateMinutesFromEvents(
  events: MatchEvent[],
  playerIds: string[],
  matchDurationMinutes?: number
): Record<string, number>;

export declare function cleanseImpossibleMatchEvents(events: MatchEvent[]): MatchEvent[];

export declare function isMatchStartedOrFinished(status: MatchProgressStatus): boolean;

// ── 3. FÓRMULA DE CALIFICACIÓN (ratingFormula.js) ───────────────────────────

export interface RatingCalculationInput {
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  goalsConceded?: number;
  isGoalkeeper?: boolean;
  isDefender?: boolean;
  cleanSheet?: boolean;
  penaltiesSaved?: number;
}

export interface RatingBreakdown {
  baseRating: number;
  minutesContribution: number;
  attackingContribution: number;
  defensiveContribution: number;
  disciplinePenalty: number;
  finalRating: number;
}

export interface RatingResult {
  score: number;
  tier: 'elite' | 'destacado' | 'solido' | 'regular' | 'a_mejorar';
  breakdown: RatingBreakdown;
}

export declare function calculatePlayerRating(input: RatingCalculationInput): RatingResult;
export declare function deriveMatchPerformanceBadge(rating: number): string;
