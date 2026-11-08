/**
 * src/types/catalog.d.ts
 * Míster 11 — Tipado de Catálogos y Glosarios Canónicos (P9 / B8)
 *
 * Contratos formales para homeExercisesCatalog.js, systemCoreExercises.js y materialGlossary.js.
 * 100% libre de 'any'.
 */

import { CanonicalExercise, ExerciseSafetyEntry } from './clinical';
import { SupportedLocale } from './i18n';

export type MaterialKey =
  | 'mat.nordic_bench'
  | 'mat.sofa'
  | 'mat.dumbbell'
  | 'mat.cones'
  | 'mat.rings'
  | 'mat.heavy_bed'
  | 'mat.bodyweight'
  | 'mat.chair'
  | 'mat.towel'
  | 'mat.partner_hold'
  | 'mat.mat'
  | 'mat.wall'
  | 'mat.hurdles'
  | 'mat.ladder'
  | 'mat.bibs'
  | 'mat.balls'
  | 'mat.straps'
  | 'mat.goals';

export type MaterialGlossaryMap = Record<MaterialKey, Record<SupportedLocale, string>>;

export type SafetyMapRegistry = Record<string, ExerciseSafetyEntry>;

export declare const HOME_EXERCISES_108: CanonicalExercise[];
export declare const SYSTEM_CORE_EXERCISES: CanonicalExercise[];
export declare const EXERCISE_SAFETY_MAP: SafetyMapRegistry;
export declare const CANONICAL_MATERIAL_GLOSSARY: MaterialGlossaryMap;
