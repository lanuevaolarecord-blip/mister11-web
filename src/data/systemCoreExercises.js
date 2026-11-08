/**
 * src/data/systemCoreExercises.js
 * Míster11 — Núcleo Clínico de Ejercicios del Sistema (10 ejercicios sys-1 a sys-10)
 * Ubicación canónica en el catálogo de datos (B3: Reconciliación de IDs estables).
 */

export const SYSTEM_CORE_EXERCISES = [
  {
    "id": "sys-1",
    "name": "Plancha Frontal",
    "nameEs": "Plancha Frontal",
    "nameEn": "Front Plank",
    "category": "fortalecimiento",
    "targetZones": [
      "core"
    ],
    "injuryTypes": [
      "lumbalgia"
    ],
    "difficulty": 1,
    "description": "Apoyo sobre antebrazos y puntas de los pies. Mantener el cuerpo alineado y contraer el abdomen.",
    "descriptionEs": "Apoyo sobre antebrazos y puntas de los pies. Mantener el cuerpo alineado y contraer el abdomen.",
    "descriptionEn": "Forearm plank on toes. Keep body in a straight line and engage the core.",
    "durationSeconds": 30,
    "series": 3,
    "material_preferido": [
      "peso_corporal",
      "suelo",
      "colchoneta"
    ],
    "alternativa_casa": {
      "option": [
        "suelo"
      ],
      "nota": {
        "es": "Puede realizarse directamente sobre esterilla o suelo con toalla.",
        "en": "Can be done directly on mat or floor with a towel."
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 10,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "Mantener pelvis neutra, no arquear zona lumbar.",
      "en": "Maintain neutral pelvis, avoid arching lower back."
    },
    "source": {
      "type": "guia_fifa",
      "citation": "FIFA 11+ Programme Manual, Part 2 (Core stability)"
    },
    "illustration": {
      "type": "vector_svg",
      "status": "pilot_pending_review",
      "author": "agent",
      "reviewed_by_human": false,
      "url": null,
      "alt": {
        "es": "Ilustración vectorial técnica: Plancha frontal",
        "en": "Technical vector illustration: Front plank",
        "pt": "Ilustração vetorial técnica: Prancha frontal",
        "fr": "Illustration vectorielle technique: Planche frontale",
        "id": "Ilustrasi vektor teknis: Plank depan"
      },
      "source": "pilot_b5a_vectorial"
    },
    "createdBy": "clinical_seed",
    "namePt": "Prancha Frontal",
    "nameFr": "Planche Frontale",
    "nameId": "Plank Depan"
  },
  {
    "id": "sys-2",
    "name": "Puente de Glúteos",
    "nameEs": "Puente de Glúteos",
    "nameEn": "Glute Bridge",
    "category": "fortalecimiento",
    "targetZones": [
      "cadera",
      "core"
    ],
    "injuryTypes": [
      "pubalgia"
    ],
    "difficulty": 1,
    "description": "Tumbado boca arriba, flexionar rodillas y elevar la cadera apretando glúteos.",
    "descriptionEs": "Tumbado boca arriba, flexionar rodillas y elevar la cadera apretando glúteos.",
    "descriptionEn": "Lie on your back, bend knees and raise hips while squeezing glutes.",
    "durationSeconds": 0,
    "reps": 15,
    "series": 3,
    "material_preferido": [
      "peso_corporal",
      "suelo"
    ],
    "alternativa_casa": {
      "option": [
        "suelo"
      ],
      "nota": {
        "es": "",
        "en": ""
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 10,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "Alinear rodilla-cadera-hombro al elevar.",
      "en": "Align knee-hip-shoulder upon hip elevation."
    },
    "source": {
      "type": "guia_fifa",
      "citation": "FIFA 11+ Programme Manual, Part 2"
    },
    "illustration": {
      "type": "vector_svg",
      "status": "pilot_pending_review",
      "author": "agent",
      "reviewed_by_human": false,
      "url": null,
      "alt": {
        "es": "Ilustración vectorial técnica: Puente de glúteos",
        "en": "Technical vector illustration: Glute bridge",
        "pt": "Ilustração vetorial técnica: Ponte de glúteos",
        "fr": "Illustration vectorielle technique: Pont fessier",
        "id": "Ilustrasi vektor teknis: Glute bridge"
      },
      "source": "pilot_b5a_vectorial"
    },
    "createdBy": "clinical_seed",
    "namePt": "Ponte de Glúteos",
    "nameFr": "Pont Fessier",
    "nameId": "Glute Bridge"
  },
  {
    "id": "sys-3",
    "name": "Movilidad de Tobillo",
    "nameEs": "Movilidad de Tobillo",
    "nameEn": "Ankle Mobility",
    "category": "movilidad",
    "targetZones": [
      "tobillo"
    ],
    "injuryTypes": [
      "esguince"
    ],
    "difficulty": 1,
    "description": "De rodillas frente a una pared, adelantar la rodilla sin despegar el talón.",
    "descriptionEs": "De rodillas frente a una pared, adelantar la rodilla sin despegar el talón.",
    "descriptionEn": "Kneel facing a wall, drive knee forward without lifting the heel.",
    "durationSeconds": 0,
    "reps": 10,
    "series": 2,
    "material_preferido": [
      "pared"
    ],
    "alternativa_casa": {
      "option": [
        "peso_corporal"
      ],
      "nota": {
        "es": "Puede usarse marco de puerta o pared de apoyo.",
        "en": "Can use a door frame or wall for support."
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 10,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "No despegar el talón del suelo al avanzar la rodilla.",
      "en": "Do not lift heel from floor while advancing knee."
    },
    "source": {
      "type": "estudio_peer_reviewed",
      "citation": "Verhagen et al. 2004, ankle injury prevention"
    },
    "illustration": {
      "type": "vector_svg",
      "status": "pilot_pending_review",
      "author": "agent",
      "reviewed_by_human": false,
      "url": null,
      "alt": {
        "es": "Ilustración vectorial técnica: Movilidad de tobillo",
        "en": "Technical vector illustration: Ankle mobility",
        "pt": "Ilustração vetorial técnica: Mobilidade de tornozelo",
        "fr": "Illustration vectorielle technique: Mobilité de la cheville",
        "id": "Ilustrasi vektor teknis: Mobilitas pergelangan kaki"
      },
      "source": "pilot_b5a_vectorial"
    },
    "createdBy": "clinical_seed",
    "namePt": "Mobilidade de Tornozelo",
    "nameFr": "Mobilité de la Cheville",
    "nameId": "Mobilitas Pergelangan Kaki"
  },
  {
    "id": "sys-4",
    "name": "Nordic Hamstring",
    "nameEs": "Nordic Hamstring",
    "nameEn": "Nordic Hamstring Curl",
    "category": "prevencion",
    "targetZones": [
      "isquiosural",
      "isquiosurales_excentrico"
    ],
    "injuryTypes": [
      "rotura isquios"
    ],
    "difficulty": 3,
    "description": "De rodillas, un compañero sujeta los tobillos. Dejarse caer hacia adelante controlando la bajada.",
    "descriptionEs": "De rodillas, un compañero sujeta los tobillos. Dejarse caer hacia adelante controlando la bajada.",
    "descriptionEn": "Kneeling with ankles held by a partner. Lean forward slowly controlling the descent.",
    "durationSeconds": 0,
    "reps": 6,
    "series": 3,
    "material_preferido": [
      "anclaje_pies"
    ],
    "alternativa_casa": {
      "option": [
        "sofa_pesado",
        "tope_puerta"
      ],
      "nota": {
        "es": "Variante asistida casera: usar soporte pesado o tope bajo supervisión.",
        "en": "Home assisted variant: use heavy support or strap under supervision."
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 14,
    "requiere_supervision_presencial": true,
    "safety_notes": {
      "es": "No prescribir sin base de fuerza previa. Progresar de isométrico a asistido a full. Supervisión recomendada.",
      "en": "Do not prescribe without baseline strength. Progress isometric to assisted to full. Recommended supervision."
    },
    "source": {
      "type": "estudio_peer_reviewed",
      "citation": "Petersen et al. 2011, Am J Sports Med"
    },
    "illustration": {
      "type": "pendiente",
      "url": null,
      "alt": {
        "es": "Ilustración técnica pendiente",
        "en": "Technical illustration pending",
        "pt": "Ilustração técnica pendente",
        "fr": "Illustration technique en attente",
        "id": "Ilustrasi teknis tertunda"
      },
      "source": null,
      "reviewed_by_human": false
    },
    "createdBy": "clinical_seed",
    "namePt": "Curl Nórdico",
    "nameFr": "Ischio-jambier nordique",
    "nameId": "Hamstring nordik"
  },
  {
    "id": "sys-5",
    "name": "Ejercicio de Copenhague",
    "nameEs": "Ejercicio de Copenhague",
    "nameEn": "Copenhagen Adductor Exercise",
    "category": "prevencion",
    "targetZones": [
      "aductores",
      "pubalgia_prevencion"
    ],
    "injuryTypes": [
      "pubalgia"
    ],
    "difficulty": 2,
    "description": "Plancha lateral con la pierna superior apoyada en un banco, elevando la cadera.",
    "descriptionEs": "Plancha lateral con la pierna superior apoyada en un banco, elevando la cadera.",
    "descriptionEn": "Side plank with top leg resting on a bench, lifting the hips.",
    "durationSeconds": 20,
    "series": 3,
    "material_preferido": [
      "silla_estable"
    ],
    "alternativa_casa": {
      "option": [
        "escalon"
      ],
      "nota": {
        "es": "Uso de escalón o silla baja para reducir palanca aductora.",
        "en": "Use low step or chair to reduce adductor lever."
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 14,
    "requiere_supervision_presencial": true,
    "safety_notes": {
      "es": "Supervisar alineación de cadera para evitar sobrecarga en sínfisis púbica.",
      "en": "Monitor hip alignment to prevent pubic overload."
    },
    "source": {
      "type": "estudio_peer_reviewed",
      "citation": "Thorborg/Hölmich, Copenhagen adduction exercise literature"
    },
    "illustration": {
      "type": "pendiente",
      "url": null,
      "alt": {
        "es": "Ilustración técnica pendiente",
        "en": "Technical illustration pending",
        "pt": "Ilustração técnica pendente",
        "fr": "Illustration technique en attente",
        "id": "Ilustrasi teknis tertunda"
      },
      "source": null,
      "reviewed_by_human": false
    },
    "createdBy": "clinical_seed",
    "namePt": "Exercício de Copenhague",
    "nameFr": "Exercice de Copenhague",
    "nameId": "Latihan Kopenhagen"
  },
  {
    "id": "sys-6",
    "name": "Sentadilla Búlgara",
    "nameEs": "Sentadilla Búlgara",
    "nameEn": "Bulgarian Split Squat",
    "namePt": "Agachamento Búlgaro",
    "nameFr": "Squat Bulgare",
    "nameId": "Squat Bulgaria",
    "category": "fortalecimiento",
    "targetZones": [
      "rodilla",
      "cuadriceps"
    ],
    "injuryTypes": [
      "lca"
    ],
    "difficulty": 2,
    "description": "Un pie apoyado atrás en un banco. Flexionar la pierna delantera controlando que la rodilla no colapse hacia adentro.",
    "descriptionEs": "Un pie apoyado atrás en un banco. Flexionar la pierna delantera controlando que la rodilla no colapse hacia adentro.",
    "descriptionEn": "One foot elevated on a bench behind you. Squat down with front leg keeping knee straight.",
    "durationSeconds": 0,
    "reps": 10,
    "series": 3,
    "material_preferido": [
      "silla_estable"
    ],
    "alternativa_casa": {
      "option": [
        "escalon"
      ],
      "nota": {
        "es": "Escalón reduce altura del pie retrasado.",
        "en": "Step reduces height of rear foot."
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 12,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "Rodilla delantera estable sin colapso en valgo.",
      "en": "Keep front knee stable without valgus collapse."
    },
    "source": {
      "type": "consenso_fisio_colegiado",
      "citation": "ACSM 2022 Guidelines; strength & conditioning principles"
    },
    "illustration": {
      "type": "pendiente",
      "url": null,
      "alt": {
        "es": "Ilustración técnica pendiente",
        "en": "Technical illustration pending",
        "pt": "Ilustração técnica pendente",
        "fr": "Illustration technique en attente",
        "id": "Ilustrasi teknis tertunda"
      },
      "source": null,
      "reviewed_by_human": false
    },
    "createdBy": "clinical_seed"
  },
  {
    "id": "sys-7",
    "name": "Peso Muerto a Una Pierna",
    "nameEs": "Peso Muerto a Una Pierna",
    "nameEn": "Single-Leg Deadlift",
    "category": "prevencion",
    "targetZones": [
      "isquiosural",
      "cadera"
    ],
    "injuryTypes": [
      "rotura isquios"
    ],
    "difficulty": 2,
    "description": "Con ligera flexión de rodilla, bajar el tronco recto elevando la pierna trasera.",
    "descriptionEs": "Con ligera flexión de rodilla, bajar el tronco recto elevando la pierna trasera.",
    "descriptionEn": "With a slight knee bend, hinge forward with straight back while lifting rear leg.",
    "durationSeconds": 0,
    "reps": 10,
    "series": 3,
    "material_preferido": [
      "peso_corporal"
    ],
    "alternativa_casa": {
      "option": [
        "pared"
      ],
      "nota": {
        "es": "Pared de apoyo para equilibrio en fase inicial.",
        "en": "Wall support for balance in initial phase."
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 12,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "Espalda neutra, bisagra de cadera sin rotar pelvis.",
      "en": "Neutral spine, hinge at hip without rotating pelvis."
    },
    "source": {
      "type": "consenso_fisio_colegiado",
      "citation": "ACSM 2022 Guidelines; hamstring & glute stabilization"
    },
    "illustration": {
      "type": "pendiente",
      "url": null,
      "alt": {
        "es": "Ilustración técnica pendiente",
        "en": "Technical illustration pending",
        "pt": "Ilustração técnica pendente",
        "fr": "Illustration technique en attente",
        "id": "Ilustrasi teknis tertunda"
      },
      "source": null,
      "reviewed_by_human": false
    },
    "createdBy": "clinical_seed",
    "namePt": "Levantamento Terra Unipodal",
    "nameFr": "Soulevé de Terre Unilatéral",
    "nameId": "Deadlift Satu Kaki"
  },
  {
    "id": "sys-8",
    "name": "Estiramiento Isquiosural",
    "nameEs": "Estiramiento Isquiosural",
    "nameEn": "Hamstring Stretch",
    "category": "recuperacion",
    "targetZones": [
      "isquiosural"
    ],
    "injuryTypes": [
      "sobrecarga"
    ],
    "difficulty": 1,
    "description": "Pierna extendida en alto, inclinar tronco hacia adelante con la espalda recta.",
    "descriptionEs": "Pierna extendida en alto, inclinar tronco hacia adelante con la espalda recta.",
    "descriptionEn": "Leg extended on an elevated surface, hinge torso forward with straight back.",
    "durationSeconds": 30,
    "series": 2,
    "material_preferido": [
      "toalla"
    ],
    "alternativa_casa": {
      "option": [
        "peso_corporal"
      ],
      "nota": {
        "es": "Puede realizarse de pie o sentado sin toalla manteniendo columna neutra.",
        "en": "Can be performed standing or seated without towel keeping neutral spine."
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 10,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "Evitar flexión lumbar excesiva; tensión suave sin dolor.",
      "en": "Avoid excessive lumbar flexion; mild stretch without pain."
    },
    "source": {
      "type": "consenso_fisio_colegiado",
      "citation": "ACSM 2022 flexibility; Page 2012 stretching concepts"
    },
    "illustration": {
      "type": "vector_svg",
      "status": "pilot_pending_review",
      "author": "agent",
      "reviewed_by_human": false,
      "url": null,
      "alt": {
        "es": "Ilustración vectorial técnica: Estiramiento isquiosural",
        "en": "Technical vector illustration: Hamstring stretch",
        "pt": "Ilustração vetorial técnica: Alongamento de isquiotibiais",
        "fr": "Illustration vectorielle technique: Étirement des ischio-jambiers",
        "id": "Ilustrasi vektor teknis: Peregangan hamstring"
      },
      "source": "pilot_b5a_vectorial"
    },
    "createdBy": "clinical_seed",
    "namePt": "Alongamento de Isquiotibiais",
    "nameFr": "Étirement des Ischio-jambiers",
    "nameId": "Peregangan Hamstring"
  },
  {
    "id": "sys-9",
    "name": "Plancha Lateral",
    "nameEs": "Plancha Lateral",
    "nameEn": "Side Plank",
    "category": "fortalecimiento",
    "targetZones": [
      "core"
    ],
    "injuryTypes": [
      "lumbalgia"
    ],
    "difficulty": 2,
    "description": "Apoyo sobre un antebrazo y lateral del pie. Elevar cadera alineando el cuerpo.",
    "descriptionEs": "Apoyo sobre un antebrazo y lateral del pie. Elevar cadera alineando el cuerpo.",
    "descriptionEn": "Support on one forearm and side of foot. Raise hips to align body in straight line.",
    "durationSeconds": 30,
    "series": 3,
    "material_preferido": [
      "peso_corporal",
      "suelo"
    ],
    "alternativa_casa": {
      "option": [
        "suelo"
      ],
      "nota": {
        "es": "",
        "en": ""
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 10,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "Codo justo debajo del hombro para proteger articulación.",
      "en": "Elbow directly under shoulder to protect joint."
    },
    "source": {
      "type": "guia_fifa",
      "citation": "FIFA 11+ Programme Manual, Part 2"
    },
    "illustration": {
      "type": "vector_svg",
      "status": "pilot_pending_review",
      "author": "agent",
      "reviewed_by_human": false,
      "url": null,
      "alt": {
        "es": "Ilustración vectorial técnica: Plancha lateral",
        "en": "Technical vector illustration: Side plank",
        "pt": "Ilustração vetorial técnica: Prancha lateral",
        "fr": "Illustration vectorielle technique: Planche latérale",
        "id": "Ilustrasi vektor teknis: Plank samping"
      },
      "source": "pilot_b5a_vectorial"
    },
    "createdBy": "clinical_seed",
    "namePt": "Prancha Lateral",
    "nameFr": "Planche Latérale",
    "nameId": "Plank Samping"
  },
  {
    "id": "sys-10",
    "name": "Rotación Torácica",
    "nameEs": "Rotación Torácica",
    "nameEn": "Thoracic Rotation",
    "category": "movilidad",
    "targetZones": [
      "espalda"
    ],
    "injuryTypes": [
      "lumbalgia"
    ],
    "difficulty": 1,
    "description": "Cuadrupedia, mano en la nuca y rotar el tronco abriendo el pecho hacia arriba.",
    "descriptionEs": "Cuadrupedia, mano en la nuca y rotar el tronco abriendo el pecho hacia arriba.",
    "descriptionEn": "On all fours, hand behind head, rotate torso opening chest upward.",
    "durationSeconds": 0,
    "reps": 10,
    "series": 2,
    "material_preferido": [
      "peso_corporal",
      "suelo"
    ],
    "alternativa_casa": {
      "option": [
        "suelo"
      ],
      "nota": {
        "es": "",
        "en": ""
      }
    },
    "contexto": "casa",
    "edad_minima_segura": 10,
    "requiere_supervision_presencial": false,
    "safety_notes": {
      "es": "Rotar desde la caja torácica, no forzar cuello.",
      "en": "Rotate from ribcage, do not yank neck."
    },
    "source": {
      "type": "guia_fifa",
      "citation": "FIFA 11+ Programme Manual, Part 1"
    },
    "illustration": {
      "type": "pendiente",
      "url": null,
      "alt": {
        "es": "Ilustración técnica pendiente",
        "en": "Technical illustration pending",
        "pt": "Ilustração técnica pendente",
        "fr": "Illustration technique en attente",
        "id": "Ilustrasi teknis tertunda"
      },
      "source": null,
      "reviewed_by_human": false
    },
    "createdBy": "clinical_seed",
    "namePt": "Rotação Torácica",
    "nameFr": "Rotation Thoracique",
    "nameId": "Rotasi Toraks"
  }
];

export default SYSTEM_CORE_EXERCISES;
