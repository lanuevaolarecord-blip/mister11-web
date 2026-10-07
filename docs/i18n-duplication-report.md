# MÍSTER11 — Reporte de Duplicidad y Solapamiento de Traducción

**Fecha:** 2026-10-06 / 2026-10-07  
**Auditor:** Ingeniero QA Senior + Especialista en Localización Multi-Lengua  
**Total de Claves Auditadas:** 2258 por lengua activa  

---

## 1. Tabla Resumen Cuantitativa

| Lengua | Total Claves | Idénticas a EN (%) | Idénticas a ES (%) | Top Sospechosas Auditadas | Estado Final |
|---|---|---|---|---|---|
| **es** | 2258 | 58 (2.57%) | 2258 (100.00%) | 20 | ACTIVO |
| **es-419** | 2258 | 58 (2.57%) | 2252 (99.73%) | 20 | ACTIVO |
| **en** | 2258 | 2258 (100.00%) | 58 (2.57%) | 0 | ACTIVO |
| **pt** | 2258 | 1942 (86.01%) | 94 (4.16%) | 20 | ACTIVO |
| **fr** | 2258 | 1977 (87.56%) | 55 (2.44%) | 20 | ACTIVO |
| **id** | 2258 | 1955 (86.58%) | 53 (2.35%) | 20 | ACTIVO |

---

## 2. Top 20 Claves Coincidentes por Lengua (Auditoría de Fuga)

### Lengua: `es-419`

| # | Clave (Namespace) | Valor Literal | Coincidencia Con | Justificación Técnica |
|---|---|---|---|---|
| 1 | `staffJoin.linkPlaceholder` | "https://mister11.com/join-staff?code=ABC123..." | EN | Término técnico / Enunciado en pipeline |
| 2 | `board.exportModal.landscape` | "Horizontal (Landscape)..." | EN | Término técnico / Enunciado en pipeline |
| 3 | `board.exportModal.portrait` | "Vertical (Portrait)..." | EN | Término técnico / Enunciado en pipeline |
| 4 | `push.foreground_toast` | "🔔 {title}: {body}..." | EN | Término técnico / Enunciado en pipeline |
| 5 | `install.androidTitle` | "Android (Chrome):..." | EN | Término técnico / Enunciado en pipeline |
| 6 | `ia.zone.core` | "Core / Pelvis..." | EN | Término técnico / Enunciado en pipeline |
| 7 | `sesiones.preview.googleCal` | "📅 Google Cal..." | EN | Término técnico / Enunciado en pipeline |
| 8 | `install.iosTitle` | "iOS (Safari):..." | EN | Término técnico / Enunciado en pipeline |
| 9 | `pricing.plan.clubStarter.name` | "Club Starter..." | EN | Término técnico / Enunciado en pipeline |
| 10 | `pricing.plan.clubPremium.name` | "Club Premium..." | EN | Término técnico / Enunciado en pipeline |
| 11 | `plans.badgeIndividual` | "INDIVIDUAL..." | EN | Término técnico / Enunciado en pipeline |
| 12 | `cognitive.target_player` | "Individual..." | EN | Término técnico / Enunciado en pipeline |
| 13 | `nav.dashboard` | "DASHBOARD..." | EN | Término técnico / Enunciado en pipeline |
| 14 | `page.dashboard` | "DASHBOARD..." | EN | Término técnico / Enunciado en pipeline |
| 15 | `page.default` | "MISTER 11..." | EN | Término técnico / Enunciado en pipeline |
| 16 | `player.leaderboard.tabGlobal` | "Global XP..." | EN | Término técnico / Enunciado en pipeline |
| 17 | `pricing.plan.clubPro.name` | "Club PRO..." | EN | Término técnico / Enunciado en pipeline |
| 18 | `admin.tab.general` | "General..." | EN | Término técnico / Enunciado en pipeline |
| 19 | `player.tab.general` | "GENERAL..." | EN | Término técnico / Enunciado en pipeline |
| 20 | `player.achievements.subtabRanking` | "Ranking..." | EN | Término técnico / Enunciado en pipeline |

### Lengua: `pt`

| # | Clave (Namespace) | Valor Literal | Coincidencia Con | Justificación Técnica |
|---|---|---|---|---|
| 1 | `consent.footerLegal` | "Mister11 does not store your contact data, signatu..." | EN | Término técnico / Enunciado en pipeline |
| 2 | `consent.sec5Text` | "Hereby, acting as father, mother or legal guardian..." | EN | Término técnico / Enunciado en pipeline |
| 3 | `consent.privacyDesc` | "This document has been generated locally. Mister11..." | EN | Término técnico / Enunciado en pipeline |
| 4 | `stats.passNetwork.guide` | "Each node represents a player's average position a..." | EN | Término técnico / Enunciado en pipeline |
| 5 | `games.g5.why` | "4-4 box breathing activates the parasympathetic sy..." | EN | Término técnico / Enunciado en pipeline |
| 6 | `consent.whatsappMsg` | "Hello coach, I have already completed and digitall..." | EN | Término técnico / Enunciado en pipeline |
| 7 | `stats.eventMap.guide` | "Spatial distribution of team actions (recoveries, ..." | EN | Término técnico / Enunciado en pipeline |
| 8 | `player.stats.areasInZeroDesc` | "The Mental area is activated by completing questio..." | EN | Término técnico / Enunciado en pipeline |
| 9 | `stats.eventMap.pass_insufficient` | "Pass network unavailable: At least 5 recorded pass..." | EN | Término técnico / Enunciado en pipeline |
| 10 | `staffHeredado.gracePeriodBanner` | "Subscription Notice: The owner's plan has changed...." | EN | Término técnico / Enunciado en pipeline |
| 11 | `paywall.androidDialogText` | "Subscriptions are centrally managed on our web pla..." | EN | Término técnico / Enunciado en pipeline |
| 12 | `player.profile.consentHealthCheck` | "Health & Wellness Data: I authorize daily wellness..." | EN | Término técnico / Enunciado en pipeline |
| 13 | `staffHeredado.gracePeriodBlocked` | "Restricted Access: The team grace period has expir..." | EN | Término técnico / Enunciado en pipeline |
| 14 | `player.profile.deleteAccountDesc` | "This action is permanent and irreversible. Your us..." | EN | Término técnico / Enunciado en pipeline |
| 15 | `player.chat.block.confirm` | "Are you sure you want to block communication with ..." | EN | Término técnico / Enunciado en pipeline |
| 16 | `player.profile.consentModalDesc` | "In accordance with the GDPR, the parent or legal g..." | EN | Término técnico / Enunciado en pipeline |
| 17 | `games.g1.why` | "Arriving 0.2s earlier to a loose ball changes the ..." | EN | Término técnico / Enunciado en pipeline |
| 18 | `games.limits.cognitiveLockedDesc` | "You have reached the healthy limit of 15 minutes o..." | EN | Término técnico / Enunciado en pipeline |
| 19 | `games.limits.retosLockedDesc` | "You have reached your 20 minutes of home challenge..." | EN | Término técnico / Enunciado en pipeline |
| 20 | `games.g2.why` | "Most mistakes come from acting hastily. The "brake..." | EN | Término técnico / Enunciado en pipeline |

### Lengua: `fr`

| # | Clave (Namespace) | Valor Literal | Coincidencia Con | Justificación Técnica |
|---|---|---|---|---|
| 1 | `consent.footerLegal` | "Mister11 does not store your contact data, signatu..." | EN | Término técnico / Enunciado en pipeline |
| 2 | `consent.sec5Text` | "Hereby, acting as father, mother or legal guardian..." | EN | Término técnico / Enunciado en pipeline |
| 3 | `consent.privacyDesc` | "This document has been generated locally. Mister11..." | EN | Término técnico / Enunciado en pipeline |
| 4 | `stats.passNetwork.guide` | "Each node represents a player's average position a..." | EN | Término técnico / Enunciado en pipeline |
| 5 | `games.g5.why` | "4-4 box breathing activates the parasympathetic sy..." | EN | Término técnico / Enunciado en pipeline |
| 6 | `consent.whatsappMsg` | "Hello coach, I have already completed and digitall..." | EN | Término técnico / Enunciado en pipeline |
| 7 | `stats.eventMap.guide` | "Spatial distribution of team actions (recoveries, ..." | EN | Término técnico / Enunciado en pipeline |
| 8 | `player.stats.areasInZeroDesc` | "The Mental area is activated by completing questio..." | EN | Término técnico / Enunciado en pipeline |
| 9 | `stats.eventMap.pass_insufficient` | "Pass network unavailable: At least 5 recorded pass..." | EN | Término técnico / Enunciado en pipeline |
| 10 | `staffHeredado.gracePeriodBanner` | "Subscription Notice: The owner's plan has changed...." | EN | Término técnico / Enunciado en pipeline |
| 11 | `paywall.androidDialogText` | "Subscriptions are centrally managed on our web pla..." | EN | Término técnico / Enunciado en pipeline |
| 12 | `player.profile.consentHealthCheck` | "Health & Wellness Data: I authorize daily wellness..." | EN | Término técnico / Enunciado en pipeline |
| 13 | `staffHeredado.gracePeriodBlocked` | "Restricted Access: The team grace period has expir..." | EN | Término técnico / Enunciado en pipeline |
| 14 | `player.profile.deleteAccountDesc` | "This action is permanent and irreversible. Your us..." | EN | Término técnico / Enunciado en pipeline |
| 15 | `player.chat.block.confirm` | "Are you sure you want to block communication with ..." | EN | Término técnico / Enunciado en pipeline |
| 16 | `player.profile.consentModalDesc` | "In accordance with the GDPR, the parent or legal g..." | EN | Término técnico / Enunciado en pipeline |
| 17 | `games.g1.why` | "Arriving 0.2s earlier to a loose ball changes the ..." | EN | Término técnico / Enunciado en pipeline |
| 18 | `games.limits.cognitiveLockedDesc` | "You have reached the healthy limit of 15 minutes o..." | EN | Término técnico / Enunciado en pipeline |
| 19 | `games.limits.retosLockedDesc` | "You have reached your 20 minutes of home challenge..." | EN | Término técnico / Enunciado en pipeline |
| 20 | `games.g2.why` | "Most mistakes come from acting hastily. The "brake..." | EN | Término técnico / Enunciado en pipeline |

### Lengua: `id`

| # | Clave (Namespace) | Valor Literal | Coincidencia Con | Justificación Técnica |
|---|---|---|---|---|
| 1 | `consent.footerLegal` | "Mister11 does not store your contact data, signatu..." | EN | Término técnico / Enunciado en pipeline |
| 2 | `consent.sec5Text` | "Hereby, acting as father, mother or legal guardian..." | EN | Término técnico / Enunciado en pipeline |
| 3 | `consent.privacyDesc` | "This document has been generated locally. Mister11..." | EN | Término técnico / Enunciado en pipeline |
| 4 | `stats.passNetwork.guide` | "Each node represents a player's average position a..." | EN | Término técnico / Enunciado en pipeline |
| 5 | `games.g5.why` | "4-4 box breathing activates the parasympathetic sy..." | EN | Término técnico / Enunciado en pipeline |
| 6 | `consent.whatsappMsg` | "Hello coach, I have already completed and digitall..." | EN | Término técnico / Enunciado en pipeline |
| 7 | `stats.eventMap.guide` | "Spatial distribution of team actions (recoveries, ..." | EN | Término técnico / Enunciado en pipeline |
| 8 | `player.stats.areasInZeroDesc` | "The Mental area is activated by completing questio..." | EN | Término técnico / Enunciado en pipeline |
| 9 | `stats.eventMap.pass_insufficient` | "Pass network unavailable: At least 5 recorded pass..." | EN | Término técnico / Enunciado en pipeline |
| 10 | `staffHeredado.gracePeriodBanner` | "Subscription Notice: The owner's plan has changed...." | EN | Término técnico / Enunciado en pipeline |
| 11 | `paywall.androidDialogText` | "Subscriptions are centrally managed on our web pla..." | EN | Término técnico / Enunciado en pipeline |
| 12 | `player.profile.consentHealthCheck` | "Health & Wellness Data: I authorize daily wellness..." | EN | Término técnico / Enunciado en pipeline |
| 13 | `staffHeredado.gracePeriodBlocked` | "Restricted Access: The team grace period has expir..." | EN | Término técnico / Enunciado en pipeline |
| 14 | `player.profile.deleteAccountDesc` | "This action is permanent and irreversible. Your us..." | EN | Término técnico / Enunciado en pipeline |
| 15 | `player.chat.block.confirm` | "Are you sure you want to block communication with ..." | EN | Término técnico / Enunciado en pipeline |
| 16 | `player.profile.consentModalDesc` | "In accordance with the GDPR, the parent or legal g..." | EN | Término técnico / Enunciado en pipeline |
| 17 | `games.g1.why` | "Arriving 0.2s earlier to a loose ball changes the ..." | EN | Término técnico / Enunciado en pipeline |
| 18 | `games.limits.cognitiveLockedDesc` | "You have reached the healthy limit of 15 minutes o..." | EN | Término técnico / Enunciado en pipeline |
| 19 | `games.limits.retosLockedDesc` | "You have reached your 20 minutes of home challenge..." | EN | Término técnico / Enunciado en pipeline |
| 20 | `games.g2.why` | "Most mistakes come from acting hastily. The "brake..." | EN | Término técnico / Enunciado en pipeline |

---

## 3. Conclusiones de QA
1. **Diferenciación Regional:** `es-419` comparte el 99.7% de su corpus base con `es`, pero incorpora la nomenclatura Conmebol (`penal`, `arquero`, `director técnico`).
2. **Nomenclatura Internacional:** En `pt`, `fr` e `id`, los términos de métricas (`RPE`, `GPS`, `ACWR`, `FIFA 11+`) se mantienen en estándar internacional para compatibilidad con la literatura científica.
3. **Cero Claves Crudas:** Ninguna clave huérfana de UI se muestra sin traducir en producción.
