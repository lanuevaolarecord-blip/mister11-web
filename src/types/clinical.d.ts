/**
 * src/types/clinical.d.ts
 * Míster 11 — Tipado Estricto del Núcleo Clínico y Gobernanza de Seguridad (P9 / B8)
 *
 * Contratos formales para exerciseSafety.js y catálogos de ejercicios.
 * Previene bugs de drift (B3), edad (B2) y dosificación (B7) en tiempo de compilación.
 * Prohibido el uso de 'any'.
 */

export type RiskTier = 'alto' | 'bajo' | 'PENDIENTE-FISIO';

export type ExerciseCategory = 'prevencion' | 'recuperacion' | 'fortalecimiento' | 'movilidad';

export type ExerciseContext = 'casa' | 'campo_only' | 'gym';

export type IllustrationType = 'vector_svg' | 'pendiente' | 'foto_licenciada';

export interface LocalizedString {
  es?: string;
  en?: string;
  pt?: string;
  fr?: string;
  id?: string;
  'es-419'?: string;
  [locale: string]: string | undefined;
}

export interface ExerciseIllustration {
  type: IllustrationType;
  status?: 'pilot_pending_review' | 'certified' | 'pending';
  author?: string;
  reviewed_by_human: boolean;
  rigVerifiedBy?: string;
  url?: string | null;
  alt?: LocalizedString;
  source?: string | null;
}

export interface ExerciseSource {
  type: 'guia_fifa' | 'estudio_peer_reviewed' | 'consenso_fisio_colegiado' | 'manual_tecnico';
  citation: string;
}

export interface CanonicalExercise {
  id: string;
  name: string;
  nameEs?: string;
  nameEn?: string;
  namePt?: string;
  nameFr?: string;
  nameId?: string;
  category: ExerciseCategory;
  targetZones: string[];
  injuryTypes?: string[];
  difficulty: number;
  description: string;
  descriptionEs?: string;
  descriptionEn?: string;
  durationSeconds?: number;
  reps?: number;
  series?: number;
  material_preferido?: string[];
  alternativa_casa?: {
    option?: string[];
    nota?: LocalizedString;
  };
  contexto: ExerciseContext;
  edad_minima_segura: number;
  requiere_supervision_presencial: boolean;
  tier_riesgo?: RiskTier;
  tier_rationale?: string;
  safety_notes?: LocalizedString;
  source: ExerciseSource;
  illustration: ExerciseIllustration;
  duplicateOf?: string;
}

export interface ExerciseSafetyEntry {
  id: string;
  nombreEs: string;
  targetZones: string[];
  source: string;
  edadMin: number;
  supervision: boolean;
  tier_riesgo: RiskTier;
  tier_rationale: string;
  rigVerifiedBy?: string;
  duplicateOf?: string;
}

export interface PrescriptionValidationOptions {
  edadJugador?: number | null;
  contexto?: ExerciseContext;
  materialDisponible?: string[];
  modo?: 'preferido' | 'alternativa';
}

export interface PrescriptionValidationResult {
  prescribable: boolean;
  reason?: string;
  badge?: string | null;
  message?: string;
  materialMode?: 'preferred' | 'alternative';
  selectedMaterial?: string[];
  nota?: string | null;
}

/**
 * Firmas de funciones del motor puro de seguridad clínica (exerciseSafety.js)
 */
export declare function assertAgeSafe(edad: number | null | undefined, exercise: CanonicalExercise | ExerciseSafetyEntry): boolean;

export declare function validateExercisePrescription(
  exercise: CanonicalExercise,
  options?: PrescriptionValidationOptions
): PrescriptionValidationResult;

export declare function isHighRiskExercise(exercise: CanonicalExercise | ExerciseSafetyEntry): boolean;

export declare function requiresSpecialistSupervision(exercise: CanonicalExercise | ExerciseSafetyEntry): boolean;

export declare function resolveToGroups(exerciseId: string): string[];
