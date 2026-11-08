/**
 * src/types/clinical.d.ts
 * Míster11 — Definición de Tipos Clínicos y de Seguridad (B8)
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
  [locale: string]: string | undefined;
}

export interface ExerciseIllustration {
  type: IllustrationType;
  status?: 'pilot_pending_review' | 'certified' | 'pending';
  author?: string;
  reviewed_by_human: boolean;
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
  duplicateOf?: string;
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
