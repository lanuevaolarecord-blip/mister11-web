# MÍSTER11 — Desglose Exhaustivo de Duplicación (PT, FR, ID vs EN)

**Fecha:** 2026-10-07  
**Auditor:** QA Sr. + Especialista en Localización  
**Propósito:** Transparencia radical. Identificar de forma explícita cada clave idéntica al inglés en las lenguas activas, agrupadas por categoría y namespace.

---

## 1. Lengua: `PT` (Total Claves Idénticas a EN: 854)

### Resumen por Categoría:

| Categoría | Conteo | Porcentaje |
|---|---|---|
| **[SIGLA/ACRÓNIMO]** | 75 | 8.8% |
| **[NOMBRE PROPIO/MARCA]** | 4 | 0.5% |
| **[FORMATO FECHA/HORA/NÚMERO]** | 13 | 1.5% |
| **[ABREVIATURA PIZARRA]** | 3 | 0.4% |
| **[FRASE UI SIN TRADUCIR]** | 0 | 0.0% |
| **[OTRO]** | 759 | 88.9% |

### Claves por Namespace:

#### Namespace: `common` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `common.originalBadgeEs` | [OTRO] | "ES original..." |
| `common.originalBadgeEn` | [OTRO] | "EN original..." |

#### Namespace: `dashboard` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `dashboard.workload.week` | [OTRO] | "Wk..." |
| `dashboard.upgrade.resetTrial` | [OTRO] | "Reset..." |

#### Namespace: `block` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `block.warmup` | [OTRO] | "Warm-up..." |
| `block.abp` | [OTRO] | "Set Pieces..." |
| `block.physical` | [OTRO] | "Physical..." |

#### Namespace: `month` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `month.Nov` | [OTRO] | "Nov..." |
| `month.Ene` | [OTRO] | "Jan..." |
| `month.Mar` | [OTRO] | "Mar..." |
| `month.Jun` | [OTRO] | "Jun..." |
| `month.Jul` | [OTRO] | "Jul..." |

#### Namespace: `page` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `page.default` | [OTRO] | "MISTER 11..." |

#### Namespace: `bottomnav` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `bottomnav.home` | [OTRO] | "Home..." |
| `bottomnav.pizarra` | [OTRO] | "Board..." |
| `bottomnav.ia` | [SIGLA/ACRÓNIMO] | "AI..." |
| `bottomnav.tests` | [OTRO] | "Tests..." |
| `bottomnav.admin` | [FORMATO FECHA/HORA/NÚMERO] | "Admin..." |
| `bottomnav.more` | [OTRO] | "More..." |
| `bottomnav.planificacion` | [OTRO] | "Planning..." |

#### Namespace: `paywall` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `paywall.proBadge` | [OTRO] | "PRO PLAN..." |
| `paywall.clubBadge` | [OTRO] | "CLUB PLAN..." |
| `paywall.upgradeClubBtn` | [OTRO] | "View CLUB Plans..." |
| `paywall.androidNotNow` | [OTRO] | "Not now..." |
| `paywall.androidRedeemTitle` | [OTRO] | "Redeem Code..." |

#### Namespace: `auth` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `auth.registerTitle` | [OTRO] | "Create Account..." |
| `auth.password` | [OTRO] | "Password..." |
| `auth.loginLink` | [OTRO] | "Log in..." |
| `auth.joinBtn` | [OTRO] | "Send Request..." |
| `auth.logout` | [OTRO] | "Log Out..." |

#### Namespace: `live` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `live.btn.recovery` | [OTRO] | "Ball Recovery..." |
| `live.btn.loss` | [OTRO] | "Ball Loss..." |
| `live.btn.duel_won` | [OTRO] | "Duel Won..." |
| `live.btn.duel_lost` | [OTRO] | "Duel Lost..." |
| `live.btn.foul_favor` | [OTRO] | "Foul in Favor..." |
| `live.btn.foul_against` | [OTRO] | "Foul Against..." |
| `live.btn.counter_not_cut` | [OTRO] | "Uncut Counter..." |
| `live.btn.player_no_finish` | [OTRO] | "Unfinished Play..." |
| `live.btn.card_red_own` | [OTRO] | "Red Card (Own)..." |
| `live.btn.corner_favor` | [OTRO] | "Corner in Favor..." |
| `live.btn.corner_against` | [OTRO] | "Corner Against..." |
| `live.btn.offside_own` | [OTRO] | "Offside (Own)..." |
| `live.tab.capture` | [OTRO] | "Live Capture..." |
| `live.tab.tactical` | [OTRO] | "Field & Tactics..." |

#### Namespace: `test` (43 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `test.question` | [OTRO] | "Question..." |
| `test.of` | [OTRO] | "of..." |
| `test.dimension` | [OTRO] | "Dimension..." |
| `test.previous` | [OTRO] | "Previous..." |
| `test.lastResult` | [OTRO] | "Last result..." |
| `test.repeatTest` | [OTRO] | "Retake Test..." |
| `test.timeEstimate` | [FORMATO FECHA/HORA/NÚMERO] | "~{minutes} min..." |
| `test.completedBadge` | [OTRO] | "Completed..." |
| `test.opt.almostNever` | [OTRO] | "Almost never..." |
| `test.opt.sometimes` | [OTRO] | "Sometimes..." |
| `test.opt.often` | [OTRO] | "Often..." |
| `test.opt.almostAlways` | [OTRO] | "Almost always..." |
| `test.opt.disagree` | [OTRO] | "Disagree..." |
| `test.opt.agree` | [OTRO] | "Agree..." |
| `test.opt.stronglyAgree` | [OTRO] | "Strongly agree..." |
| *... y 28 claves adicionales en este namespace* | | |

#### Namespace: `admin` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `admin.tab.equipos` | [OTRO] | "Teams..." |
| `admin.tab.club` | [OTRO] | "Club..." |
| `admin.tab.general` | [OTRO] | "General..." |
| `admin.tab.suscripcion` | [OTRO] | "Subscription..." |
| `admin.lang.title` | [OTRO] | "System Language..." |
| `admin.theme.dark` | [OTRO] | "Dark Mode..." |

#### Namespace: `equipo` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `equipo.tab.squad` | [OTRO] | "Squad..." |
| `equipo.tab.attendance` | [OTRO] | "Attendance..." |
| `equipo.tab.staff` | [OTRO] | "Coaching Staff..." |

#### Namespace: `partidos` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `partidos.tab.analisis` | [OTRO] | "Analysis..." |

#### Namespace: `plan` (19 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plan.tab.macrociclo` | [OTRO] | "MACROCYCLE..." |
| `plan.tab.mesociclo` | [OTRO] | "MESOCYCLE..." |
| `plan.tab.microciclo` | [OTRO] | "MICROCYCLE..." |
| `plan.tab.objetivos` | [OTRO] | "OBJECTIVES..." |
| `plan.saving` | [OTRO] | "SAVING......" |
| `plan.dateRange` | [OTRO] | "DATE RANGE..." |
| `plan.start` | [OTRO] | "Start..." |
| `plan.end` | [OTRO] | "End..." |
| `plan.trainingDays` | [OTRO] | "TRAINING DAYS..." |
| `plan.category` | [SIGLA/ACRÓNIMO] | "CATEGORY..." |
| `plan.coach` | [SIGLA/ACRÓNIMO] | "COACH..." |
| `plan.seasonVolume` | [OTRO] | "SEASON VOLUME..." |
| `plan.days.monday` | [SIGLA/ACRÓNIMO] | "M..." |
| `plan.days.tuesday` | [SIGLA/ACRÓNIMO] | "T..." |
| `plan.days.wednesday` | [SIGLA/ACRÓNIMO] | "W..." |
| *... y 4 claves adicionales en este namespace* | | |

#### Namespace: `sesiones` (22 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sesiones.tab.captures` | [OTRO] | "Captures..." |
| `sesiones.tab.animations` | [OTRO] | "Animations..." |
| `sesiones.fieldMode` | [OTRO] | "Field Mode..." |
| `sesiones.views.day` | [SIGLA/ACRÓNIMO] | "DAY..." |
| `sesiones.views.week` | [SIGLA/ACRÓNIMO] | "WEEK..." |
| `sesiones.views.month` | [SIGLA/ACRÓNIMO] | "MONTH..." |
| `sesiones.noDiagram` | [OTRO] | "No diagram..." |
| `sesiones.actions.share` | [OTRO] | "Share..." |
| `sesiones.blockCount.one` | [OTRO] | "{count} Block..." |
| `sesiones.blockCount.other` | [OTRO] | "{count} Blocks..." |
| `sesiones.categories.all` | [OTRO] | "All..." |
| `sesiones.categories.fisica` | [OTRO] | "Physical..." |
| `sesiones.categories.mixta` | [OTRO] | "Mixed..." |
| `sesiones.categories.general` | [OTRO] | "General..." |
| `sesiones.preview.min` | [SIGLA/ACRÓNIMO] | "MIN..." |
| *... y 7 claves adicionales en este namespace* | | |

#### Namespace: `tests` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `tests.tab.fisicos` | [OTRO] | "Fitness Tests..." |
| `tests.tab.psicosociales` | [OTRO] | "Psychosocial..." |
| `tests.tab.historial` | [OTRO] | "History..." |
| `tests.tab.comparativa` | [OTRO] | "Comparison..." |
| `tests.resources.tacticalTest` | [OTRO] | "Tactical Test..." |
| `tests.resources.seasonReport` | [OTRO] | "Season Report..." |
| `tests.resources.myTeam` | [OTRO] | "My Squad..." |
| `tests.rpe.save` | [OTRO] | "SAVE RPE..." |
| `tests.createTest` | [OTRO] | "+ Create Test..." |
| `tests.success` | [OTRO] | "Success..." |
| `tests.error` | [OTRO] | "Error..." |
| `tests.confirm_season_reset` | [OTRO] | "Reset Season..." |
| `tests.attention` | [OTRO] | "⚠️ ATTENTION..." |
| `tests.validation` | [OTRO] | "Validation..." |

#### Namespace: `player` (147 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `player.tab.general` | [SIGLA/ACRÓNIMO] | "GENERAL..." |
| `player.tab.chat` | [SIGLA/ACRÓNIMO] | "CHAT..." |
| `player.tab.physical` | [SIGLA/ACRÓNIMO] | "PHYSICAL..." |
| `player.tab.health` | [SIGLA/ACRÓNIMO] | "HEALTH..." |
| `player.tab.plans` | [SIGLA/ACRÓNIMO] | "PLANS..." |
| `player.tab.attendance` | [OTRO] | "ATTENDANCE..." |
| `player.tab.settings` | [SIGLA/ACRÓNIMO] | "SETTINGS..." |
| `player.nav.home` | [OTRO] | "Home..." |
| `player.nav.schedule` | [OTRO] | "Schedule..." |
| `player.nav.achievements` | [OTRO] | "Achievements..." |
| `player.nav.chat` | [OTRO] | "Coach..." |
| `player.nav.tests` | [OTRO] | "Tests..." |
| `player.nav.stats` | [OTRO] | "Stats..." |
| `player.nav.profile` | [OTRO] | "Profile..." |
| `player.home.nextMatch` | [OTRO] | "Next Call-up..." |
| *... y 132 claves adicionales en este namespace* | | |

#### Namespace: `ach` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ach.weekly_perfect_week.name` | [OTRO] | "Perfect Week..." |
| `ach.weekly_wellness.name` | [OTRO] | "Health Check-in..." |
| `ach.weekly_scholar.name` | [OTRO] | "Strong Mind..." |
| `ach.weekly_committed.name` | [OTRO] | "Invisible Work..." |
| `ach.weekly_attentive.name` | [OTRO] | "Always Ready..." |
| `ach.biweekly_self_care.name` | [OTRO] | "Healthy Habit..." |
| `ach.season_veteran.name` | [OTRO] | "Season Veteran..." |
| `ach.season_captain.name` | [OTRO] | "Captain Spirit..." |
| `ach.weekly_mind_active.name` | [OTRO] | "Active Mind..." |
| `ach.weekly_zen.name` | [OTRO] | "Zen..." |
| `ach.gold_impulse_brake.name` | [OTRO] | "Golden Brake..." |
| `ach.gold_tactical_eye.name` | [OTRO] | "Hawk Eye..." |
| `ach.season_mental_squad.name` | [OTRO] | "Mental Squad..." |

#### Namespace: `games` (86 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `games.intro.whatTitle` | [OTRO] | "What We Train..." |
| `games.intro.howTitle` | [OTRO] | "How to Play..." |
| `games.safety.title` | [OTRO] | "Safety at Home..." |
| `games.limits.available` | [OTRO] | "Available..." |
| `games.limits.minutesLbl` | [OTRO] | "Time played..." |
| `games.btn.play` | [OTRO] | "Play..." |
| `games.status.notPlayed` | [OTRO] | "No record..." |
| `games.g1.skill` | [OTRO] | "Reaction Speed..." |
| `games.g1.step1` | [OTRO] | "Wait on red...." |
| `games.g1.waitGreen` | [OTRO] | "Wait for green…..." |
| `games.g1.tooSlow` | [OTRO] | "Too slow! Miss...." |
| `games.g1.falseStart` | [OTRO] | "🚫 False start...." |
| `games.g1.statMedian` | [OTRO] | "Median..." |
| `games.g1.statBest` | [OTRO] | "Best record..." |
| `games.g1.statFalses` | [OTRO] | "False starts..." |
| *... y 71 claves adicionales en este namespace* | | |

#### Namespace: `attendance` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `attendance.chart.legend.absent` | [OTRO] | "Absent..." |
| `attendance.chart.legend.late` | [OTRO] | "Late..." |
| `attendance.chart.legend.justified` | [OTRO] | "Justified..." |

#### Namespace: `matches` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matches.warnings.showDetails` | [OTRO] | "View list..." |
| `matches.warnings.hideDetails` | [OTRO] | "Hide details..." |
| `matches.warnings.cleansing` | [OTRO] | "Resolving......" |
| `matches.warnings.auditShow` | [OTRO] | "View details..." |
| `matches.warnings.auditHide` | [OTRO] | "Hide audit..." |
| `matches.lineup.downloadPng` | [OTRO] | "DOWNLOAD PNG..." |
| `matches.lineup.exportingPng` | [OTRO] | "EXPORTING......" |
| `matches.lineup.emptySlot` | [OTRO] | "Empty..." |

#### Namespace: `spell` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `spell.missingAccent` | [OTRO] | "Missing accent..." |
| `spell.typo` | [OTRO] | "Typo..." |
| `spell.ignore` | [OTRO] | "Ignore..." |
| `spell.recommended` | [OTRO] | "Suggestions:..." |

#### Namespace: `analisis` (29 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `analisis.shortcuts.title` | [OTRO] | "SHORTCUTS:..." |
| `analisis.shortcuts.last3` | [OTRO] | "Last 3..." |
| `analisis.shortcuts.last5` | [OTRO] | "Last 5..." |
| `analisis.shortcuts.allSeason` | [OTRO] | "Whole Season..." |
| `analisis.mode.title` | [OTRO] | "Metrics:..." |
| `analisis.mode.averages` | [OTRO] | "Averages..." |
| `analisis.mode.totals` | [OTRO] | "Totals..." |
| `analisis.kpi.shots` | [OTRO] | "Shots on Target..." |
| `analisis.kpi.duels` | [OTRO] | "Duels Won..." |
| `analisis.table.result` | [OTRO] | "Result..." |
| `analisis.table.shots` | [OTRO] | "Shots (O / R)..." |
| `analisis.table.duels` | [FORMATO FECHA/HORA/NÚMERO] | "Duels %..." |
| `analisis.table.recLoss` | [OTRO] | "Rec / Loss..." |
| `analisis.table.fouls` | [OTRO] | "Fouls (F / A)..." |
| `analisis.table.cards` | [OTRO] | "Cards (Y / R)..." |
| *... y 14 claves adicionales en este namespace* | | |

#### Namespace: `ia` (49 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ia.categoryAge` | [OTRO] | "Category / Age..." |
| `ia.selectPlaceholder` | [OTRO] | "Select......" |
| `ia.mainObjective` | [OTRO] | "Main Objective..." |
| `ia.materials` | [OTRO] | "Materials..." |
| `ia.space` | [OTRO] | "Pitch Area..." |
| `ia.noRef` | [OTRO] | "No Ref...." |
| `ia.capture` | [OTRO] | "Capture..." |
| `ia.tacticalBoard` | [OTRO] | "🎬 Board..." |
| `ia.dictationStart` | [OTRO] | "Voice dictation..." |
| `ia.dictationStop` | [OTRO] | "Stop dictation..." |
| `ia.age.prebenjamin` | [OTRO] | "Under-10 (8-10)..." |
| `ia.obj.possession` | [OTRO] | "Ball possession..." |
| `ia.obj.positional` | [OTRO] | "Positional play..." |
| `ia.mat.balls` | [OTRO] | "Footballs..." |
| `ia.mat.cones` | [OTRO] | "Cones..." |
| *... y 34 claves adicionales en este namespace* | | |

#### Namespace: `board` (94 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `board.toolbar.fullscreen` | [OTRO] | "Full Screen..." |
| `board.toolbar.sides` | [OTRO] | "Sides..." |
| `board.toolbar.swapSides` | [OTRO] | "Swap team sides..." |
| `board.toolbar.width` | [OTRO] | "Width..." |
| `board.toolbar.height` | [OTRO] | "Height..." |
| `board.toolbar.zoomIn` | [OTRO] | "Zoom In..." |
| `board.toolbar.zoomOut` | [OTRO] | "Zoom Out..." |
| `board.toolbar.resetZoom` | [OTRO] | "Reset Zoom..." |
| `board.toolbar.undo` | [OTRO] | "Undo..." |
| `board.toolbar.redo` | [OTRO] | "Redo..." |
| `board.toolbar.new` | [SIGLA/ACRÓNIMO] | "NEW..." |
| `board.toolbar.exportMp4` | [OTRO] | "EXPORT MP4..." |
| `board.exportModal.speed` | [OTRO] | "Playback Speed..." |
| `board.exportModal.orientation` | [OTRO] | "Orientation..." |
| `board.exportModal.metaTitle` | [OTRO] | "File title..." |
| *... y 79 claves adicionales en este namespace* | | |

#### Namespace: `pos` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pos.all` | [SIGLA/ACRÓNIMO] | "ALL..." |
| `pos.por` | [SIGLA/ACRÓNIMO] | "GK..." |
| `pos.def` | [ABREVIATURA PIZARRA] | "DEF..." |
| `pos.ltd` | [SIGLA/ACRÓNIMO] | "RB..." |
| `pos.lti` | [SIGLA/ACRÓNIMO] | "LB..." |
| `pos.mcd` | [SIGLA/ACRÓNIMO] | "CDM..." |
| `pos.mc` | [SIGLA/ACRÓNIMO] | "CM..." |
| `pos.mco` | [SIGLA/ACRÓNIMO] | "CAM..." |
| `pos.ext` | [SIGLA/ACRÓNIMO] | "W..." |
| `pos.del` | [SIGLA/ACRÓNIMO] | "ST..." |

#### Namespace: `health` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `health.active` | [OTRO] | "Active..." |
| `health.resolved` | [OTRO] | "Recovered..." |
| `health.addInjury` | [OTRO] | "+ Record Injury..." |

#### Namespace: `plans` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plans.badgeTeam` | [SIGLA/ACRÓNIMO] | "TEAM..." |
| `plans.badgeIndividual` | [OTRO] | "INDIVIDUAL..." |
| `plans.sharePlan` | [OTRO] | "🔗 Share Plan..." |

#### Namespace: `staff` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staff.copyCode` | [OTRO] | "Copy Code..." |
| `staff.copied` | [OTRO] | "Copied!..." |
| `staff.shareLink` | [OTRO] | "Share Link..." |
| `staff.you` | [OTRO] | "(You)..." |
| `staff.changeRole` | [OTRO] | "Change Role:..." |
| `staff.role.headCoach` | [OTRO] | "Head Coach..." |
| `staff.role.scout` | [OTRO] | "Scout..." |
| `staff.remove` | [OTRO] | "Remove..." |
| `staff.copyLink` | [OTRO] | "Copy Link..." |
| `staff.sendInvite` | [OTRO] | "Send Invitation..." |
| `staff.copy` | [OTRO] | "Copy..." |
| `staff.sixDigitCode` | [OTRO] | "6-digit code:..." |
| `staff.createdDate` | [OTRO] | "Created: {date}..." |

#### Namespace: `wellness` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `wellness.rpe.scaleMin` | [OTRO] | "1 - Very light..." |
| `wellness.rpe.save` | [OTRO] | "SAVE RPE..." |

#### Namespace: `cognitive` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `cognitive.btn_verifying` | [OTRO] | "Verifying…..." |
| `cognitive.metric_median_reaction` | [OTRO] | "Median reaction..." |
| `cognitive.metric_trend` | [OTRO] | "Trend..." |
| `cognitive.trend_improving` | [OTRO] | "↑ Improving..." |
| `cognitive.trend_stable` | [OTRO] | "= Stable..." |
| `cognitive.category_label` | [OTRO] | "Category: {cat}..." |
| `cognitive.target_team` | [OTRO] | "Entire team..." |
| `cognitive.target_player` | [OTRO] | "Individual..." |
| `cognitive.modal_recipient_label` | [OTRO] | "Recipient:..." |
| `cognitive.modal_only_player` | [OTRO] | "Only {name}..." |
| `cognitive.select_all` | [OTRO] | "Select all..." |
| `cognitive.deselect_all` | [OTRO] | "Deselect all..." |
| `cognitive.cat.benjamin` | [SIGLA/ACRÓNIMO] | "U-10..." |
| `cognitive.cat.alevin` | [SIGLA/ACRÓNIMO] | "U-12..." |
| `cognitive.cat.infantil` | [SIGLA/ACRÓNIMO] | "U-14..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `status` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `status.none` | [OTRO] | "Not Selected..." |

#### Namespace: `install` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `install.instructions` | [OTRO] | "Instructions:..." |
| `install.iosTitle` | [OTRO] | "iOS (Safari):..." |
| `install.btnInstall` | [OTRO] | "Install now..." |

#### Namespace: `consent` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `consent.detailsTitle` | [OTRO] | "Consent Details..." |
| `consent.parentNameLabel` | [OTRO] | "Guardian Name *..." |
| `consent.parentNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.parentDniPlaceholder` | [OTRO] | "e.g. 12345678Z..." |
| `consent.relationLabel` | [OTRO] | "Relationship *..." |
| `consent.relationFather` | [OTRO] | "Father..." |
| `consent.relationMother` | [OTRO] | "Mother..." |
| `consent.parentPhoneLabel` | [OTRO] | "Contact Phone..." |
| `consent.playerNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.playerDobLabel` | [OTRO] | "Date of Birth *..." |
| `consent.coachNamePlaceholder` | [OTRO] | "Coach Name..." |
| `consent.seasonLabel` | [OTRO] | "Season..." |
| `consent.privacyTitle` | [OTRO] | "PRIVACY NOTICE..." |

#### Namespace: `matchSheet` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matchSheet.saving` | [OTRO] | "💾 Saving......" |
| `matchSheet.manual_badge` | [OTRO] | "Manual..." |
| `matchSheet.auto_badge` | [OTRO] | "Auto..." |

#### Namespace: `invite` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `invite.link_copied` | [OTRO] | "Link copied!..." |
| `invite.player.scanQR` | [OTRO] | "Scan team QR..." |

#### Namespace: `planning` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `planning.login_required` | [OTRO] | "Sign in to save..." |
| `planning.save_error` | [OTRO] | "Error saving...." |
| `planning.pdf_exported` | [NOMBRE PROPIO/MARCA] | "PDF exported ✓..." |

#### Namespace: `gk` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `gk.roleBadge` | [OTRO] | "🧤 Goalkeeper..." |
| `gk.saves` | [OTRO] | "Saves..." |
| `gk.savesShort` | [OTRO] | "Saves..." |
| `gk.conceded` | [OTRO] | "Goals Conceded..." |
| `gk.concededShort` | [OTRO] | "Conc...." |
| `gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `gk.cleanSheetsShort` | [OTRO] | "Clean Sh...." |
| `gk.penaltySaves` | [OTRO] | "Penalties Saved..." |
| `gk.penaltySavesShort` | [OTRO] | "Pen. Saved..." |
| `gk.claimsShort` | [OTRO] | "Claims..." |
| `gk.errorGoalShort` | [OTRO] | "Err. Goal..." |
| `gk.perMatch` | [OTRO] | "Per match..." |
| `gk.rating` | [OTRO] | "GK Rating..." |
| `gk.btn.conceded` | [OTRO] | "Conceded Goal..." |
| `gk.btn.penaltySave` | [OTRO] | "Penalty Saved..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `exports` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exports.gk.saves` | [OTRO] | "Saves..." |
| `exports.gk.conceded` | [OTRO] | "Conceded..." |
| `exports.gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `exports.gk.penaltySaves` | [OTRO] | "Pen. Saved..." |
| `exports.gk.errors` | [OTRO] | "Errors..." |
| `exports.gk.rating` | [OTRO] | "GK Rating..." |
| `exports.report.page` | [OTRO] | "Page..." |
| `exports.test.physical` | [OTRO] | "Physical Test..." |
| `exports.test.technical` | [OTRO] | "Technical Test..." |
| `exports.test.tactical` | [OTRO] | "Tactical Test..." |
| `exports.test.attendance` | [OTRO] | "Attendance..." |
| `exports.test.table_test` | [OTRO] | "Test..." |
| `exports.test.table_score` | [OTRO] | "Score..." |
| `exports.test.table_interp` | [OTRO] | "Interpretation..." |

#### Namespace: `shot` (27 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `shot.team_own` | [OTRO] | "Own..." |
| `shot.team_rival` | [OTRO] | "Opponent..." |
| `shot.zone` | [OTRO] | "Shot Zone..." |
| `shot.zone_inside_center` | [OTRO] | "Center (Box)..." |
| `shot.zone_inside_left` | [OTRO] | "Left Wing (Box)..." |
| `shot.zone_penalty` | [OTRO] | "Penalty Spot..." |
| `shot.playType` | [OTRO] | "Play Type..." |
| `shot.playType_jugada` | [OTRO] | "Open Play..." |
| `shot.playType_contra` | [OTRO] | "Counter Attack..." |
| `shot.playType_balon_parado` | [OTRO] | "Set Piece..." |
| `shot.playType_penalti` | [OTRO] | "Penalty..." |
| `shot.result` | [OTRO] | "Shot Result..." |
| `shot.result_gol` | [OTRO] | "Goal..." |
| `shot.result_fuera` | [OTRO] | "Missed..." |
| `shot.result_bloqueado` | [OTRO] | "Blocked..." |
| *... y 12 claves adicionales en este namespace* | | |

#### Namespace: `liveStats` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `liveStats.quickMode.title` | [OTRO] | "Quick Mode..." |
| `liveStats.quickMode.simple` | [OTRO] | "Simple mode..." |
| `liveStats.quickMode.shotSaved` | [OTRO] | "Shot recorded..." |
| `liveStats.quickMode.undo` | [OTRO] | "Undo..." |
| `liveStats.quickMode.undone` | [OTRO] | "Shot undone..." |

#### Namespace: `xg` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `xg.own_xg` | [OTRO] | "Own xG..." |
| `xg.rival_xg` | [OTRO] | "Opponent xG..." |
| `xg.box_center` | [OTRO] | "Central Box..." |
| `xg.box_wings` | [OTRO] | "Lateral Box..." |
| `xg.outside_box` | [OTRO] | "Outside Box..." |
| `xg.penalty_box` | [OTRO] | "Penalty..." |
| `xg.decisive_saves` | [OTRO] | "Decisive Saves..." |
| `xg.normal_saves` | [OTRO] | "Normal Saves..." |
| `xg.total_saves` | [OTRO] | "Total Saves..." |

#### Namespace: `swot` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `swot.origin_metric` | [OTRO] | "Origin metric..." |
| `swot.manual_badge` | [OTRO] | "Manual..." |
| `swot.auto_badge` | [OTRO] | "Rule..." |

#### Namespace: `capture` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `capture.team.shot_own` | [OTRO] | "Own Shot..." |
| `capture.team.shot_rival` | [OTRO] | "Opponent Shot..." |
| `capture.hud.shot` | [OTRO] | "Shot..." |
| `capture.hud.recovery` | [OTRO] | "Recovery..." |
| `capture.hud.duel_won` | [OTRO] | "Duel Won..." |
| `capture.hud.foul` | [OTRO] | "Foul..." |
| `capture.hud.advanced` | [OTRO] | "Advanced..." |
| `capture.hud.key_pass` | [OTRO] | "Key Pass..." |
| `capture.hud.turnover` | [OTRO] | "Turnover..." |
| `capture.hud.duel_lost` | [OTRO] | "Duel Lost..." |
| `capture.hud.unattributed` | [OTRO] | "Unattributed..." |
| `capture.refine_skip` | [OTRO] | "Skip..." |

#### Namespace: `match` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `match.status.finalizado` | [SIGLA/ACRÓNIMO] | "FINISHED..." |
| `match.status.en_edicion` | [OTRO] | "IN EDITING..." |
| `match.status.pendiente` | [SIGLA/ACRÓNIMO] | "PENDING..." |
| `match.status.no_disputado` | [OTRO] | "NOT PLAYED..." |
| `match.sort.label` | [OTRO] | "Sort by..." |
| `match.sort.fecha_asc` | [FORMATO FECHA/HORA/NÚMERO] | "Date (Upcoming)..." |
| `match.sort.fecha_desc` | [OTRO] | "Date (Recent)..." |
| `match.view.cards` | [OTRO] | "Cards..." |
| `match.view.detailed` | [OTRO] | "Detailed..." |

#### Namespace: `stats` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `stats.eventMap.title` | [OTRO] | "Zone Event Map..." |
| `stats.theater.theater_mode` | [OTRO] | "Theater Mode..." |
| `stats.theater.fullscreen` | [OTRO] | "Fullscreen..." |
| `stats.theater.exit_fullscreen` | [OTRO] | "Exit Fullscreen..." |

#### Namespace: `error` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `error.retry_section` | [OTRO] | "Retry..." |
| `error.section_code` | [OTRO] | "Code: {code}..." |

#### Namespace: `charts` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `charts.view.pass_network` | [OTRO] | "Pass Network..." |
| `charts.view.territorial_map` | [OTRO] | "Territorial Map..." |

#### Namespace: `pricing` (25 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pricing.billing.discountBadge` | [OTRO] | "2 MONTHS FREE..." |
| `pricing.billing.monthly` | [OTRO] | "Monthly..." |
| `pricing.plan.free.name` | [OTRO] | "Free Plan..." |
| `pricing.plan.pro.name` | [OTRO] | "PRO Plan..." |
| `pricing.plan.clubStarter.name` | [OTRO] | "Club Starter..." |
| `pricing.plan.clubPro.name` | [OTRO] | "Club PRO..." |
| `pricing.plan.clubPremium.name` | [OTRO] | "Club Premium..." |
| `pricing.freq.forever` | [OTRO] | "/ forever..." |
| `pricing.freq.season` | [OTRO] | "/ season..." |
| `pricing.freq.seasonShort` | [OTRO] | "/ season..." |
| `pricing.freq.month` | [OTRO] | "/ month..." |
| `pricing.vat.included` | [OTRO] | "VAT Included..." |
| `pricing.free.attr3_text` | [OTRO] | "included..." |
| `pricing.btn.startFree` | [OTRO] | "START FREE..." |
| `pricing.pro.attr1_strong` | [OTRO] | "Up to 3 Teams..." |
| *... y 10 claves adicionales en este namespace* | | |

#### Namespace: `playerProfile` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerProfile.physicalStats` | [OTRO] | "Physical Stats..." |
| `playerProfile.heightLabel` | [OTRO] | "Height..." |
| `playerProfile.weightLabel` | [OTRO] | "Weight..." |
| `playerProfile.ageLabel` | [OTRO] | "Age..." |
| `playerProfile.heightUnit` | [OTRO] | "cm..." |
| `playerProfile.weightUnit` | [OTRO] | "kg..." |
| `playerProfile.bmi` | [SIGLA/ACRÓNIMO] | "BMI..." |

#### Namespace: `sessionRating` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sessionRating.rateButton` | [OTRO] | "Rate..." |
| `sessionRating.ratingLabel` | [OTRO] | "Score..." |
| `sessionRating.averageRating` | [OTRO] | "Avg..." |
| `sessionRating.radarAxisTraining` | [OTRO] | "Training..." |

#### Namespace: `notifPrefs` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifPrefs.reminderTime` | [FORMATO FECHA/HORA/NÚMERO] | "Reminder Time..." |
| `notifPrefs.quietHoursTitle` | [OTRO] | "Quiet Hours..." |
| `notifPrefs.quietHoursEnd` | [OTRO] | "Quiet end time..." |
| `notifPrefs.frequencyCapTitle` | [OTRO] | "Frequency Cap..." |
| `notifPrefs.perDay` | [OTRO] | "per day..." |

#### Namespace: `csv` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `csv.stepUpload` | [OTRO] | "Upload..." |
| `csv.stepMapping` | [OTRO] | "Mapping..." |
| `csv.stepPreview` | [OTRO] | "Preview..." |
| `csv.browseFile` | [OTRO] | "Browse File..." |
| `csv.fieldRequired` | [OTRO] | "Required..." |
| `csv.fieldBirthDate` | [OTRO] | "Date of Birth..." |
| `csv.fieldOptional` | [OTRO] | "Optional..." |
| `csv.fieldEmail` | [OTRO] | "Email Address..." |
| `csv.status` | [OTRO] | "Status..." |
| `csv.tagValid` | [OTRO] | "Valid..." |

#### Namespace: `qrScanner` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `qrScanner.uploadQrPhoto` | [OTRO] | "Upload QR photo..." |

#### Namespace: `teamQr` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamQr.teamCodeLabel` | [OTRO] | "Access Code:..." |
| `teamQr.copied` | [OTRO] | "Copied..." |
| `teamQr.copyCode` | [OTRO] | "Copy Code..." |
| `teamQr.shareLink` | [OTRO] | "Share Link..." |

#### Namespace: `staffJoin` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffJoin.linkPlaceholder` | [OTRO] | "https://mister11.com/join-staff?code=ABC123..." |
| `staffJoin.assignedRole` | [OTRO] | "Assigned Role:..." |

#### Namespace: `staffInvite` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffInvite.copyCode` | [OTRO] | "Copy Code..." |
| `staffInvite.shareLink` | [OTRO] | "Share Link..." |
| `staffInvite.qrModal` | [OTRO] | "View Staff QR..." |
| `staffInvite.joinBtn` | [OTRO] | "JOIN TEAM..." |
| `staffInvite.roleLabel` | [OTRO] | "Assigned role:..." |
| `staffInvite.sendBtn` | [OTRO] | "Send Invitation..." |
| `staffInvite.copyLink` | [OTRO] | "Copy Link..." |
| `staffInvite.qrCopied` | [OTRO] | "Link copied..." |

#### Namespace: `convocation` (20 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `convocation.tab` | [OTRO] | "Squad List..." |
| `convocation.downloading` | [OTRO] | "Downloading......" |
| `convocation.sendToPlayers` | [OTRO] | "Send to players..." |
| `convocation.send` | [OTRO] | "Send..." |
| `convocation.sending` | [OTRO] | "Sending......" |
| `convocation.cleanSelection` | [OTRO] | "Clear selection..." |
| `convocation.positions.gk` | [OTRO] | "GOALKEEPERS..." |
| `convocation.positions.def` | [OTRO] | "DEFENDERS..." |
| `convocation.positions.mid` | [OTRO] | "MIDFIELDERS..." |
| `convocation.positions.fwd` | [SIGLA/ACRÓNIMO] | "FORWARDS..." |
| `convocation.positionsEn.gk` | [SIGLA/ACRÓNIMO] | "PORTEROS..." |
| `convocation.positionsEn.def` | [SIGLA/ACRÓNIMO] | "DEFENSAS..." |
| `convocation.positionsEn.mid` | [OTRO] | "MEDIOCAMPISTAS..." |
| `convocation.positionsEn.fwd` | [OTRO] | "DELANTEROS..." |
| `convocation.matchInfo.rival` | [OTRO] | "Opponent..." |
| *... y 5 claves adicionales en este namespace* | | |

#### Namespace: `whiteboard` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `whiteboard.exportRetry` | [OTRO] | "Retry export..." |


---

## 1. Lengua: `FR` (Total Claves Idénticas a EN: 869)

### Resumen por Categoría:

| Categoría | Conteo | Porcentaje |
|---|---|---|
| **[SIGLA/ACRÓNIMO]** | 77 | 8.9% |
| **[NOMBRE PROPIO/MARCA]** | 4 | 0.5% |
| **[FORMATO FECHA/HORA/NÚMERO]** | 13 | 1.5% |
| **[ABREVIATURA PIZARRA]** | 3 | 0.3% |
| **[FRASE UI SIN TRADUCIR]** | 0 | 0.0% |
| **[OTRO]** | 772 | 88.8% |

### Claves por Namespace:

#### Namespace: `nav` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `nav.tests` | [SIGLA/ACRÓNIMO] | "TESTS..." |
| `nav.admin` | [OTRO] | "ADMINISTRATION..." |

#### Namespace: `common` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `common.absent` | [OTRO] | "Absent..." |
| `common.optimal` | [OTRO] | "Optimal..." |
| `common.originalBadgeEs` | [OTRO] | "ES original..." |
| `common.originalBadgeEn` | [OTRO] | "EN original..." |

#### Namespace: `notifications` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifications.title` | [OTRO] | "Notifications..." |

#### Namespace: `dashboard` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `dashboard.workload.week` | [OTRO] | "Wk..." |
| `dashboard.upgrade.resetTrial` | [OTRO] | "Reset..." |

#### Namespace: `block` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `block.warmup` | [OTRO] | "Warm-up..." |
| `block.abp` | [OTRO] | "Set Pieces..." |
| `block.physical` | [OTRO] | "Physical..." |

#### Namespace: `month` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `month.Oct` | [OTRO] | "Oct..." |
| `month.Nov` | [OTRO] | "Nov..." |

#### Namespace: `page` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `page.tests` | [SIGLA/ACRÓNIMO] | "TESTS..." |
| `page.admin` | [OTRO] | "ADMINISTRATION..." |
| `page.default` | [OTRO] | "MISTER 11..." |

#### Namespace: `bottomnav` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `bottomnav.home` | [OTRO] | "Home..." |
| `bottomnav.pizarra` | [OTRO] | "Board..." |
| `bottomnav.ia` | [SIGLA/ACRÓNIMO] | "AI..." |
| `bottomnav.tests` | [OTRO] | "Tests..." |
| `bottomnav.admin` | [FORMATO FECHA/HORA/NÚMERO] | "Admin..." |
| `bottomnav.more` | [OTRO] | "More..." |
| `bottomnav.planificacion` | [OTRO] | "Planning..." |

#### Namespace: `paywall` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `paywall.proBadge` | [OTRO] | "PRO PLAN..." |
| `paywall.clubBadge` | [OTRO] | "CLUB PLAN..." |
| `paywall.upgradeClubBtn` | [OTRO] | "View CLUB Plans..." |
| `paywall.androidNotNow` | [OTRO] | "Not now..." |
| `paywall.androidRedeemTitle` | [OTRO] | "Redeem Code..." |

#### Namespace: `auth` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `auth.registerTitle` | [OTRO] | "Create Account..." |
| `auth.password` | [OTRO] | "Password..." |
| `auth.loginLink` | [OTRO] | "Log in..." |
| `auth.joinBtn` | [OTRO] | "Send Request..." |
| `auth.logout` | [OTRO] | "Log Out..." |

#### Namespace: `live` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `live.btn.recovery` | [OTRO] | "Ball Recovery..." |
| `live.btn.loss` | [OTRO] | "Ball Loss..." |
| `live.btn.duel_won` | [OTRO] | "Duel Won..." |
| `live.btn.duel_lost` | [OTRO] | "Duel Lost..." |
| `live.btn.foul_favor` | [OTRO] | "Foul in Favor..." |
| `live.btn.foul_against` | [OTRO] | "Foul Against..." |
| `live.btn.counter_not_cut` | [OTRO] | "Uncut Counter..." |
| `live.btn.player_no_finish` | [OTRO] | "Unfinished Play..." |
| `live.btn.card_red_own` | [OTRO] | "Red Card (Own)..." |
| `live.btn.corner_favor` | [OTRO] | "Corner in Favor..." |
| `live.btn.corner_against` | [OTRO] | "Corner Against..." |
| `live.btn.offside_own` | [OTRO] | "Offside (Own)..." |
| `live.tab.capture` | [OTRO] | "Live Capture..." |
| `live.tab.tactical` | [OTRO] | "Field & Tactics..." |

#### Namespace: `test` (43 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `test.question` | [OTRO] | "Question..." |
| `test.of` | [OTRO] | "of..." |
| `test.dimension` | [OTRO] | "Dimension..." |
| `test.previous` | [OTRO] | "Previous..." |
| `test.lastResult` | [OTRO] | "Last result..." |
| `test.repeatTest` | [OTRO] | "Retake Test..." |
| `test.timeEstimate` | [FORMATO FECHA/HORA/NÚMERO] | "~{minutes} min..." |
| `test.completedBadge` | [OTRO] | "Completed..." |
| `test.opt.almostNever` | [OTRO] | "Almost never..." |
| `test.opt.sometimes` | [OTRO] | "Sometimes..." |
| `test.opt.often` | [OTRO] | "Often..." |
| `test.opt.almostAlways` | [OTRO] | "Almost always..." |
| `test.opt.disagree` | [OTRO] | "Disagree..." |
| `test.opt.agree` | [OTRO] | "Agree..." |
| `test.opt.stronglyAgree` | [OTRO] | "Strongly agree..." |
| *... y 28 claves adicionales en este namespace* | | |

#### Namespace: `admin` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `admin.tab.equipos` | [OTRO] | "Teams..." |
| `admin.tab.club` | [OTRO] | "Club..." |
| `admin.tab.general` | [OTRO] | "General..." |
| `admin.tab.suscripcion` | [OTRO] | "Subscription..." |
| `admin.lang.title` | [OTRO] | "System Language..." |
| `admin.theme.dark` | [OTRO] | "Dark Mode..." |
| `admin.notif.title` | [OTRO] | "Notifications..." |

#### Namespace: `equipo` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `equipo.tab.squad` | [OTRO] | "Squad..." |
| `equipo.tab.attendance` | [OTRO] | "Attendance..." |
| `equipo.tab.staff` | [OTRO] | "Coaching Staff..." |

#### Namespace: `partidos` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `partidos.tab.analisis` | [OTRO] | "Analysis..." |

#### Namespace: `plan` (20 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plan.tab.macrociclo` | [OTRO] | "MACROCYCLE..." |
| `plan.tab.mesociclo` | [OTRO] | "MESOCYCLE..." |
| `plan.tab.microciclo` | [OTRO] | "MICROCYCLE..." |
| `plan.tab.objetivos` | [OTRO] | "OBJECTIVES..." |
| `plan.saving` | [OTRO] | "SAVING......" |
| `plan.dateRange` | [OTRO] | "DATE RANGE..." |
| `plan.start` | [OTRO] | "Start..." |
| `plan.end` | [OTRO] | "End..." |
| `plan.trainingDays` | [OTRO] | "TRAINING DAYS..." |
| `plan.matchDay` | [OTRO] | "⚽ Match Day:..." |
| `plan.category` | [SIGLA/ACRÓNIMO] | "CATEGORY..." |
| `plan.coach` | [SIGLA/ACRÓNIMO] | "COACH..." |
| `plan.seasonVolume` | [OTRO] | "SEASON VOLUME..." |
| `plan.days.monday` | [SIGLA/ACRÓNIMO] | "M..." |
| `plan.days.tuesday` | [SIGLA/ACRÓNIMO] | "T..." |
| *... y 5 claves adicionales en este namespace* | | |

#### Namespace: `sesiones` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sesiones.tab.captures` | [OTRO] | "Captures..." |
| `sesiones.tab.animations` | [OTRO] | "Animations..." |
| `sesiones.fieldMode` | [OTRO] | "Field Mode..." |
| `sesiones.views.day` | [SIGLA/ACRÓNIMO] | "DAY..." |
| `sesiones.views.week` | [SIGLA/ACRÓNIMO] | "WEEK..." |
| `sesiones.views.month` | [SIGLA/ACRÓNIMO] | "MONTH..." |
| `sesiones.noDiagram` | [OTRO] | "No diagram..." |
| `sesiones.actions.share` | [OTRO] | "Share..." |
| `sesiones.blockCount.one` | [OTRO] | "{count} Block..." |
| `sesiones.blockCount.other` | [OTRO] | "{count} Blocks..." |
| `sesiones.categories.all` | [OTRO] | "All..." |
| `sesiones.categories.fisica` | [OTRO] | "Physical..." |
| `sesiones.categories.mixta` | [OTRO] | "Mixed..." |
| `sesiones.categories.partido` | [OTRO] | "Match..." |
| `sesiones.categories.general` | [OTRO] | "General..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `tests` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `tests.tab.fisicos` | [OTRO] | "Fitness Tests..." |
| `tests.tab.psicosociales` | [OTRO] | "Psychosocial..." |
| `tests.tab.historial` | [OTRO] | "History..." |
| `tests.tab.comparativa` | [OTRO] | "Comparison..." |
| `tests.resources.tacticalTest` | [OTRO] | "Tactical Test..." |
| `tests.resources.seasonReport` | [OTRO] | "Season Report..." |
| `tests.resources.myTeam` | [OTRO] | "My Squad..." |
| `tests.rpe.save` | [OTRO] | "SAVE RPE..." |
| `tests.createTest` | [OTRO] | "+ Create Test..." |
| `tests.success` | [OTRO] | "Success..." |
| `tests.error` | [OTRO] | "Error..." |
| `tests.confirm_season_reset` | [OTRO] | "Reset Season..." |
| `tests.attention` | [OTRO] | "⚠️ ATTENTION..." |
| `tests.validation` | [OTRO] | "Validation..." |

#### Namespace: `player` (149 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `player.tab.general` | [SIGLA/ACRÓNIMO] | "GENERAL..." |
| `player.tab.chat` | [SIGLA/ACRÓNIMO] | "CHAT..." |
| `player.tab.physical` | [SIGLA/ACRÓNIMO] | "PHYSICAL..." |
| `player.tab.health` | [SIGLA/ACRÓNIMO] | "HEALTH..." |
| `player.tab.plans` | [SIGLA/ACRÓNIMO] | "PLANS..." |
| `player.tab.attendance` | [OTRO] | "ATTENDANCE..." |
| `player.tab.settings` | [SIGLA/ACRÓNIMO] | "SETTINGS..." |
| `player.nav.home` | [OTRO] | "Home..." |
| `player.nav.schedule` | [OTRO] | "Schedule..." |
| `player.nav.achievements` | [OTRO] | "Achievements..." |
| `player.nav.chat` | [OTRO] | "Coach..." |
| `player.nav.tests` | [OTRO] | "Tests..." |
| `player.nav.stats` | [OTRO] | "Stats..." |
| `player.nav.profile` | [OTRO] | "Profile..." |
| `player.home.nextMatch` | [OTRO] | "Next Call-up..." |
| *... y 134 claves adicionales en este namespace* | | |

#### Namespace: `ach` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ach.weekly_perfect_week.name` | [OTRO] | "Perfect Week..." |
| `ach.weekly_wellness.name` | [OTRO] | "Health Check-in..." |
| `ach.weekly_scholar.name` | [OTRO] | "Strong Mind..." |
| `ach.weekly_committed.name` | [OTRO] | "Invisible Work..." |
| `ach.weekly_attentive.name` | [OTRO] | "Always Ready..." |
| `ach.biweekly_self_care.name` | [OTRO] | "Healthy Habit..." |
| `ach.season_veteran.name` | [OTRO] | "Season Veteran..." |
| `ach.season_captain.name` | [OTRO] | "Captain Spirit..." |
| `ach.weekly_mind_active.name` | [OTRO] | "Active Mind..." |
| `ach.weekly_zen.name` | [OTRO] | "Zen..." |
| `ach.gold_impulse_brake.name` | [OTRO] | "Golden Brake..." |
| `ach.gold_tactical_eye.name` | [OTRO] | "Hawk Eye..." |
| `ach.season_mental_squad.name` | [OTRO] | "Mental Squad..." |

#### Namespace: `games` (86 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `games.intro.whatTitle` | [OTRO] | "What We Train..." |
| `games.intro.howTitle` | [OTRO] | "How to Play..." |
| `games.safety.title` | [OTRO] | "Safety at Home..." |
| `games.limits.available` | [OTRO] | "Available..." |
| `games.limits.minutesLbl` | [OTRO] | "Time played..." |
| `games.btn.play` | [OTRO] | "Play..." |
| `games.status.notPlayed` | [OTRO] | "No record..." |
| `games.g1.skill` | [OTRO] | "Reaction Speed..." |
| `games.g1.step1` | [OTRO] | "Wait on red...." |
| `games.g1.waitGreen` | [OTRO] | "Wait for green…..." |
| `games.g1.tooSlow` | [OTRO] | "Too slow! Miss...." |
| `games.g1.falseStart` | [OTRO] | "🚫 False start...." |
| `games.g1.statMedian` | [OTRO] | "Median..." |
| `games.g1.statBest` | [OTRO] | "Best record..." |
| `games.g1.statFalses` | [OTRO] | "False starts..." |
| *... y 71 claves adicionales en este namespace* | | |

#### Namespace: `attendance` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `attendance.chart.legend.absent` | [OTRO] | "Absent..." |
| `attendance.chart.legend.late` | [OTRO] | "Late..." |
| `attendance.chart.legend.justified` | [OTRO] | "Justified..." |

#### Namespace: `matches` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matches.warnings.showDetails` | [OTRO] | "View list..." |
| `matches.warnings.hideDetails` | [OTRO] | "Hide details..." |
| `matches.warnings.cleansing` | [OTRO] | "Resolving......" |
| `matches.warnings.auditShow` | [OTRO] | "View details..." |
| `matches.warnings.auditHide` | [OTRO] | "Hide audit..." |
| `matches.lineup.downloadPng` | [OTRO] | "DOWNLOAD PNG..." |
| `matches.lineup.exportingPng` | [OTRO] | "EXPORTING......" |
| `matches.lineup.emptySlot` | [OTRO] | "Empty..." |

#### Namespace: `spell` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `spell.missingAccent` | [OTRO] | "Missing accent..." |
| `spell.typo` | [OTRO] | "Typo..." |
| `spell.ignore` | [OTRO] | "Ignore..." |
| `spell.recommended` | [OTRO] | "Suggestions:..." |

#### Namespace: `analisis` (29 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `analisis.shortcuts.title` | [OTRO] | "SHORTCUTS:..." |
| `analisis.shortcuts.last3` | [OTRO] | "Last 3..." |
| `analisis.shortcuts.last5` | [OTRO] | "Last 5..." |
| `analisis.shortcuts.allSeason` | [OTRO] | "Whole Season..." |
| `analisis.mode.title` | [OTRO] | "Metrics:..." |
| `analisis.mode.averages` | [OTRO] | "Averages..." |
| `analisis.mode.totals` | [OTRO] | "Totals..." |
| `analisis.kpi.shots` | [OTRO] | "Shots on Target..." |
| `analisis.kpi.duels` | [OTRO] | "Duels Won..." |
| `analisis.table.result` | [OTRO] | "Result..." |
| `analisis.table.shots` | [OTRO] | "Shots (O / R)..." |
| `analisis.table.duels` | [FORMATO FECHA/HORA/NÚMERO] | "Duels %..." |
| `analisis.table.recLoss` | [OTRO] | "Rec / Loss..." |
| `analisis.table.fouls` | [OTRO] | "Fouls (F / A)..." |
| `analisis.table.cards` | [OTRO] | "Cards (Y / R)..." |
| *... y 14 claves adicionales en este namespace* | | |

#### Namespace: `ia` (49 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ia.categoryAge` | [OTRO] | "Category / Age..." |
| `ia.selectPlaceholder` | [OTRO] | "Select......" |
| `ia.mainObjective` | [OTRO] | "Main Objective..." |
| `ia.materials` | [OTRO] | "Materials..." |
| `ia.space` | [OTRO] | "Pitch Area..." |
| `ia.noRef` | [OTRO] | "No Ref...." |
| `ia.capture` | [OTRO] | "Capture..." |
| `ia.tacticalBoard` | [OTRO] | "🎬 Board..." |
| `ia.dictationStart` | [OTRO] | "Voice dictation..." |
| `ia.dictationStop` | [OTRO] | "Stop dictation..." |
| `ia.age.prebenjamin` | [OTRO] | "Under-10 (8-10)..." |
| `ia.obj.possession` | [OTRO] | "Ball possession..." |
| `ia.obj.positional` | [OTRO] | "Positional play..." |
| `ia.mat.balls` | [OTRO] | "Footballs..." |
| `ia.mat.cones` | [OTRO] | "Cones..." |
| *... y 34 claves adicionales en este namespace* | | |

#### Namespace: `board` (94 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `board.toolbar.fullscreen` | [OTRO] | "Full Screen..." |
| `board.toolbar.sides` | [OTRO] | "Sides..." |
| `board.toolbar.swapSides` | [OTRO] | "Swap team sides..." |
| `board.toolbar.width` | [OTRO] | "Width..." |
| `board.toolbar.height` | [OTRO] | "Height..." |
| `board.toolbar.zoomIn` | [OTRO] | "Zoom In..." |
| `board.toolbar.zoomOut` | [OTRO] | "Zoom Out..." |
| `board.toolbar.resetZoom` | [OTRO] | "Reset Zoom..." |
| `board.toolbar.undo` | [OTRO] | "Undo..." |
| `board.toolbar.redo` | [OTRO] | "Redo..." |
| `board.toolbar.new` | [SIGLA/ACRÓNIMO] | "NEW..." |
| `board.toolbar.exportMp4` | [OTRO] | "EXPORT MP4..." |
| `board.exportModal.speed` | [OTRO] | "Playback Speed..." |
| `board.exportModal.orientation` | [OTRO] | "Orientation..." |
| `board.exportModal.metaTitle` | [OTRO] | "File title..." |
| *... y 79 claves adicionales en este namespace* | | |

#### Namespace: `pos` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pos.all` | [SIGLA/ACRÓNIMO] | "ALL..." |
| `pos.por` | [SIGLA/ACRÓNIMO] | "GK..." |
| `pos.def` | [ABREVIATURA PIZARRA] | "DEF..." |
| `pos.ltd` | [SIGLA/ACRÓNIMO] | "RB..." |
| `pos.lti` | [SIGLA/ACRÓNIMO] | "LB..." |
| `pos.mcd` | [SIGLA/ACRÓNIMO] | "CDM..." |
| `pos.mc` | [SIGLA/ACRÓNIMO] | "CM..." |
| `pos.mco` | [SIGLA/ACRÓNIMO] | "CAM..." |
| `pos.ext` | [SIGLA/ACRÓNIMO] | "W..." |
| `pos.del` | [SIGLA/ACRÓNIMO] | "ST..." |

#### Namespace: `health` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `health.active` | [OTRO] | "Active..." |
| `health.resolved` | [OTRO] | "Recovered..." |
| `health.addInjury` | [OTRO] | "+ Record Injury..." |

#### Namespace: `plans` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plans.badgeTeam` | [SIGLA/ACRÓNIMO] | "TEAM..." |
| `plans.badgeIndividual` | [OTRO] | "INDIVIDUAL..." |
| `plans.sharePlan` | [OTRO] | "🔗 Share Plan..." |

#### Namespace: `staff` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staff.copyCode` | [OTRO] | "Copy Code..." |
| `staff.copied` | [OTRO] | "Copied!..." |
| `staff.shareLink` | [OTRO] | "Share Link..." |
| `staff.you` | [OTRO] | "(You)..." |
| `staff.changeRole` | [OTRO] | "Change Role:..." |
| `staff.role.headCoach` | [OTRO] | "Head Coach..." |
| `staff.role.scout` | [OTRO] | "Scout..." |
| `staff.remove` | [OTRO] | "Remove..." |
| `staff.copyLink` | [OTRO] | "Copy Link..." |
| `staff.sendInvite` | [OTRO] | "Send Invitation..." |
| `staff.copy` | [OTRO] | "Copy..." |
| `staff.sixDigitCode` | [OTRO] | "6-digit code:..." |
| `staff.createdDate` | [OTRO] | "Created: {date}..." |

#### Namespace: `wellness` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `wellness.rpe.scaleMin` | [OTRO] | "1 - Very light..." |
| `wellness.rpe.save` | [OTRO] | "SAVE RPE..." |

#### Namespace: `cognitive` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `cognitive.btn_verifying` | [OTRO] | "Verifying…..." |
| `cognitive.metric_median_reaction` | [OTRO] | "Median reaction..." |
| `cognitive.metric_trend` | [OTRO] | "Trend..." |
| `cognitive.trend_improving` | [OTRO] | "↑ Improving..." |
| `cognitive.trend_stable` | [OTRO] | "= Stable..." |
| `cognitive.category_label` | [OTRO] | "Category: {cat}..." |
| `cognitive.target_team` | [OTRO] | "Entire team..." |
| `cognitive.target_player` | [OTRO] | "Individual..." |
| `cognitive.modal_recipient_label` | [OTRO] | "Recipient:..." |
| `cognitive.modal_only_player` | [OTRO] | "Only {name}..." |
| `cognitive.select_all` | [OTRO] | "Select all..." |
| `cognitive.deselect_all` | [OTRO] | "Deselect all..." |
| `cognitive.cat.benjamin` | [SIGLA/ACRÓNIMO] | "U-10..." |
| `cognitive.cat.alevin` | [SIGLA/ACRÓNIMO] | "U-12..." |
| `cognitive.cat.infantil` | [SIGLA/ACRÓNIMO] | "U-14..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `status` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `status.none` | [OTRO] | "Not Selected..." |

#### Namespace: `install` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `install.instructions` | [OTRO] | "Instructions:..." |
| `install.iosTitle` | [OTRO] | "iOS (Safari):..." |
| `install.btnInstall` | [OTRO] | "Install now..." |

#### Namespace: `consent` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `consent.detailsTitle` | [OTRO] | "Consent Details..." |
| `consent.parentNameLabel` | [OTRO] | "Guardian Name *..." |
| `consent.parentNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.parentDniPlaceholder` | [OTRO] | "e.g. 12345678Z..." |
| `consent.relationLabel` | [OTRO] | "Relationship *..." |
| `consent.relationFather` | [OTRO] | "Father..." |
| `consent.relationMother` | [OTRO] | "Mother..." |
| `consent.parentPhoneLabel` | [OTRO] | "Contact Phone..." |
| `consent.playerNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.playerDobLabel` | [OTRO] | "Date of Birth *..." |
| `consent.coachNamePlaceholder` | [OTRO] | "Coach Name..." |
| `consent.seasonLabel` | [OTRO] | "Season..." |
| `consent.privacyTitle` | [OTRO] | "PRIVACY NOTICE..." |

#### Namespace: `matchSheet` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matchSheet.saving` | [OTRO] | "💾 Saving......" |
| `matchSheet.manual_badge` | [OTRO] | "Manual..." |
| `matchSheet.auto_badge` | [OTRO] | "Auto..." |

#### Namespace: `invite` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `invite.link_copied` | [OTRO] | "Link copied!..." |
| `invite.player.scanQR` | [OTRO] | "Scan team QR..." |

#### Namespace: `planning` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `planning.login_required` | [OTRO] | "Sign in to save..." |
| `planning.save_error` | [OTRO] | "Error saving...." |
| `planning.pdf_exported` | [NOMBRE PROPIO/MARCA] | "PDF exported ✓..." |

#### Namespace: `gk` (17 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `gk.roleBadge` | [OTRO] | "🧤 Goalkeeper..." |
| `gk.saves` | [OTRO] | "Saves..." |
| `gk.savesShort` | [OTRO] | "Saves..." |
| `gk.conceded` | [OTRO] | "Goals Conceded..." |
| `gk.concededShort` | [OTRO] | "Conc...." |
| `gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `gk.cleanSheetsShort` | [OTRO] | "Clean Sh...." |
| `gk.penaltySaves` | [OTRO] | "Penalties Saved..." |
| `gk.penaltySavesShort` | [OTRO] | "Pen. Saved..." |
| `gk.claimsShort` | [OTRO] | "Claims..." |
| `gk.errorGoalShort` | [OTRO] | "Err. Goal..." |
| `gk.perMatch` | [OTRO] | "Per match..." |
| `gk.history` | [OTRO] | "Match History..." |
| `gk.rating` | [OTRO] | "GK Rating..." |
| `gk.btn.conceded` | [OTRO] | "Conceded Goal..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `exports` (15 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exports.gk.saves` | [OTRO] | "Saves..." |
| `exports.gk.conceded` | [OTRO] | "Conceded..." |
| `exports.gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `exports.gk.penaltySaves` | [OTRO] | "Pen. Saved..." |
| `exports.gk.errors` | [OTRO] | "Errors..." |
| `exports.gk.rating` | [OTRO] | "GK Rating..." |
| `exports.report.page` | [OTRO] | "Page..." |
| `exports.report.match_info` | [OTRO] | "Match Info..." |
| `exports.test.physical` | [OTRO] | "Physical Test..." |
| `exports.test.technical` | [OTRO] | "Technical Test..." |
| `exports.test.tactical` | [OTRO] | "Tactical Test..." |
| `exports.test.attendance` | [OTRO] | "Attendance..." |
| `exports.test.table_test` | [OTRO] | "Test..." |
| `exports.test.table_score` | [OTRO] | "Score..." |
| `exports.test.table_interp` | [OTRO] | "Interpretation..." |

#### Namespace: `shot` (27 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `shot.team_own` | [OTRO] | "Own..." |
| `shot.team_rival` | [OTRO] | "Opponent..." |
| `shot.zone` | [OTRO] | "Shot Zone..." |
| `shot.zone_inside_center` | [OTRO] | "Center (Box)..." |
| `shot.zone_inside_left` | [OTRO] | "Left Wing (Box)..." |
| `shot.zone_penalty` | [OTRO] | "Penalty Spot..." |
| `shot.playType` | [OTRO] | "Play Type..." |
| `shot.playType_jugada` | [OTRO] | "Open Play..." |
| `shot.playType_contra` | [OTRO] | "Counter Attack..." |
| `shot.playType_balon_parado` | [OTRO] | "Set Piece..." |
| `shot.playType_penalti` | [OTRO] | "Penalty..." |
| `shot.result` | [OTRO] | "Shot Result..." |
| `shot.result_gol` | [OTRO] | "Goal..." |
| `shot.result_fuera` | [OTRO] | "Missed..." |
| `shot.result_bloqueado` | [OTRO] | "Blocked..." |
| *... y 12 claves adicionales en este namespace* | | |

#### Namespace: `liveStats` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `liveStats.quickMode.title` | [OTRO] | "Quick Mode..." |
| `liveStats.quickMode.simple` | [OTRO] | "Simple mode..." |
| `liveStats.quickMode.shotSaved` | [OTRO] | "Shot recorded..." |
| `liveStats.quickMode.undo` | [OTRO] | "Undo..." |
| `liveStats.quickMode.undone` | [OTRO] | "Shot undone..." |

#### Namespace: `rendimientoPdf` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `rendimientoPdf.matchDetails` | [OTRO] | "Match Details..." |

#### Namespace: `xg` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `xg.own_xg` | [OTRO] | "Own xG..." |
| `xg.rival_xg` | [OTRO] | "Opponent xG..." |
| `xg.demanding_match` | [OTRO] | "Demanding Match..." |
| `xg.box_center` | [OTRO] | "Central Box..." |
| `xg.box_wings` | [OTRO] | "Lateral Box..." |
| `xg.outside_box` | [OTRO] | "Outside Box..." |
| `xg.penalty_box` | [OTRO] | "Penalty..." |
| `xg.decisive_saves` | [OTRO] | "Decisive Saves..." |
| `xg.normal_saves` | [OTRO] | "Normal Saves..." |
| `xg.total_saves` | [OTRO] | "Total Saves..." |

#### Namespace: `swot` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `swot.origin_metric` | [OTRO] | "Origin metric..." |
| `swot.manual_badge` | [OTRO] | "Manual..." |
| `swot.auto_badge` | [OTRO] | "Rule..." |

#### Namespace: `capture` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `capture.team.shot_own` | [OTRO] | "Own Shot..." |
| `capture.team.shot_rival` | [OTRO] | "Opponent Shot..." |
| `capture.hud.shot` | [OTRO] | "Shot..." |
| `capture.hud.recovery` | [OTRO] | "Recovery..." |
| `capture.hud.duel_won` | [OTRO] | "Duel Won..." |
| `capture.hud.foul` | [OTRO] | "Foul..." |
| `capture.hud.advanced` | [OTRO] | "Advanced..." |
| `capture.hud.key_pass` | [OTRO] | "Key Pass..." |
| `capture.hud.turnover` | [OTRO] | "Turnover..." |
| `capture.hud.duel_lost` | [OTRO] | "Duel Lost..." |
| `capture.hud.unattributed` | [OTRO] | "Unattributed..." |
| `capture.refine_skip` | [OTRO] | "Skip..." |

#### Namespace: `match` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `match.status.finalizado` | [SIGLA/ACRÓNIMO] | "FINISHED..." |
| `match.status.en_edicion` | [OTRO] | "IN EDITING..." |
| `match.status.pendiente` | [SIGLA/ACRÓNIMO] | "PENDING..." |
| `match.status.no_disputado` | [OTRO] | "NOT PLAYED..." |
| `match.sort.label` | [OTRO] | "Sort by..." |
| `match.sort.fecha_asc` | [FORMATO FECHA/HORA/NÚMERO] | "Date (Upcoming)..." |
| `match.sort.fecha_desc` | [OTRO] | "Date (Recent)..." |
| `match.view.cards` | [OTRO] | "Cards..." |
| `match.view.detailed` | [OTRO] | "Detailed..." |

#### Namespace: `stats` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `stats.eventMap.title` | [OTRO] | "Zone Event Map..." |
| `stats.theater.theater_mode` | [OTRO] | "Theater Mode..." |
| `stats.theater.fullscreen` | [OTRO] | "Fullscreen..." |
| `stats.theater.exit_fullscreen` | [OTRO] | "Exit Fullscreen..." |

#### Namespace: `error` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `error.retry_section` | [OTRO] | "Retry..." |
| `error.section_code` | [OTRO] | "Code: {code}..." |

#### Namespace: `charts` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `charts.view.pass_network` | [OTRO] | "Pass Network..." |
| `charts.view.territorial_map` | [OTRO] | "Territorial Map..." |

#### Namespace: `pricing` (25 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pricing.billing.discountBadge` | [OTRO] | "2 MONTHS FREE..." |
| `pricing.billing.monthly` | [OTRO] | "Monthly..." |
| `pricing.plan.free.name` | [OTRO] | "Free Plan..." |
| `pricing.plan.pro.name` | [OTRO] | "PRO Plan..." |
| `pricing.plan.clubStarter.name` | [OTRO] | "Club Starter..." |
| `pricing.plan.clubPro.name` | [OTRO] | "Club PRO..." |
| `pricing.plan.clubPremium.name` | [OTRO] | "Club Premium..." |
| `pricing.freq.forever` | [OTRO] | "/ forever..." |
| `pricing.freq.season` | [OTRO] | "/ season..." |
| `pricing.freq.seasonShort` | [OTRO] | "/ season..." |
| `pricing.freq.month` | [OTRO] | "/ month..." |
| `pricing.vat.included` | [OTRO] | "VAT Included..." |
| `pricing.free.attr3_text` | [OTRO] | "included..." |
| `pricing.btn.startFree` | [OTRO] | "START FREE..." |
| `pricing.pro.attr1_strong` | [OTRO] | "Up to 3 Teams..." |
| *... y 10 claves adicionales en este namespace* | | |

#### Namespace: `playerProfile` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerProfile.physicalStats` | [OTRO] | "Physical Stats..." |
| `playerProfile.heightLabel` | [OTRO] | "Height..." |
| `playerProfile.weightLabel` | [OTRO] | "Weight..." |
| `playerProfile.ageLabel` | [OTRO] | "Age..." |
| `playerProfile.heightUnit` | [OTRO] | "cm..." |
| `playerProfile.weightUnit` | [OTRO] | "kg..." |
| `playerProfile.bmi` | [SIGLA/ACRÓNIMO] | "BMI..." |

#### Namespace: `sessionRating` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sessionRating.rateButton` | [OTRO] | "Rate..." |
| `sessionRating.ratingLabel` | [OTRO] | "Score..." |
| `sessionRating.averageRating` | [OTRO] | "Avg..." |
| `sessionRating.radarAxisTraining` | [OTRO] | "Training..." |

#### Namespace: `notifPrefs` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifPrefs.reminderTime` | [FORMATO FECHA/HORA/NÚMERO] | "Reminder Time..." |
| `notifPrefs.quietHoursTitle` | [OTRO] | "Quiet Hours..." |
| `notifPrefs.quietHoursEnd` | [OTRO] | "Quiet end time..." |
| `notifPrefs.frequencyCapTitle` | [OTRO] | "Frequency Cap..." |
| `notifPrefs.perDay` | [OTRO] | "per day..." |

#### Namespace: `csv` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `csv.stepUpload` | [OTRO] | "Upload..." |
| `csv.stepMapping` | [OTRO] | "Mapping..." |
| `csv.stepPreview` | [OTRO] | "Preview..." |
| `csv.browseFile` | [OTRO] | "Browse File..." |
| `csv.fieldRequired` | [OTRO] | "Required..." |
| `csv.fieldBirthDate` | [OTRO] | "Date of Birth..." |
| `csv.fieldOptional` | [OTRO] | "Optional..." |
| `csv.fieldEmail` | [OTRO] | "Email Address..." |
| `csv.status` | [OTRO] | "Status..." |
| `csv.tagValid` | [OTRO] | "Valid..." |

#### Namespace: `qrScanner` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `qrScanner.uploadQrPhoto` | [OTRO] | "Upload QR photo..." |

#### Namespace: `teamQr` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamQr.teamCodeLabel` | [OTRO] | "Access Code:..." |
| `teamQr.copied` | [OTRO] | "Copied..." |
| `teamQr.copyCode` | [OTRO] | "Copy Code..." |
| `teamQr.shareLink` | [OTRO] | "Share Link..." |

#### Namespace: `staffJoin` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffJoin.linkPlaceholder` | [OTRO] | "https://mister11.com/join-staff?code=ABC123..." |
| `staffJoin.assignedRole` | [OTRO] | "Assigned Role:..." |

#### Namespace: `staffInvite` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffInvite.copyCode` | [OTRO] | "Copy Code..." |
| `staffInvite.shareLink` | [OTRO] | "Share Link..." |
| `staffInvite.qrModal` | [OTRO] | "View Staff QR..." |
| `staffInvite.joinBtn` | [OTRO] | "JOIN TEAM..." |
| `staffInvite.roleLabel` | [OTRO] | "Assigned role:..." |
| `staffInvite.sendBtn` | [OTRO] | "Send Invitation..." |
| `staffInvite.copyLink` | [OTRO] | "Copy Link..." |
| `staffInvite.qrCopied` | [OTRO] | "Link copied..." |

#### Namespace: `convocation` (21 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `convocation.tab` | [OTRO] | "Squad List..." |
| `convocation.downloading` | [OTRO] | "Downloading......" |
| `convocation.sendToPlayers` | [OTRO] | "Send to players..." |
| `convocation.send` | [OTRO] | "Send..." |
| `convocation.sending` | [OTRO] | "Sending......" |
| `convocation.cleanSelection` | [OTRO] | "Clear selection..." |
| `convocation.positions.gk` | [OTRO] | "GOALKEEPERS..." |
| `convocation.positions.def` | [OTRO] | "DEFENDERS..." |
| `convocation.positions.mid` | [OTRO] | "MIDFIELDERS..." |
| `convocation.positions.fwd` | [SIGLA/ACRÓNIMO] | "FORWARDS..." |
| `convocation.positionsEn.gk` | [SIGLA/ACRÓNIMO] | "PORTEROS..." |
| `convocation.positionsEn.def` | [SIGLA/ACRÓNIMO] | "DEFENSAS..." |
| `convocation.positionsEn.mid` | [OTRO] | "MEDIOCAMPISTAS..." |
| `convocation.positionsEn.fwd` | [OTRO] | "DELANTEROS..." |
| `convocation.matchInfo.rival` | [OTRO] | "Opponent..." |
| *... y 6 claves adicionales en este namespace* | | |

#### Namespace: `whiteboard` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `whiteboard.exportRetry` | [OTRO] | "Retry export..." |

#### Namespace: `exerciseCatalog` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exerciseCatalog.sourceLabel` | [OTRO] | "Source..." |


---

## 1. Lengua: `ID` (Total Claves Idénticas a EN: 866)

### Resumen por Categoría:

| Categoría | Conteo | Porcentaje |
|---|---|---|
| **[SIGLA/ACRÓNIMO]** | 77 | 8.9% |
| **[NOMBRE PROPIO/MARCA]** | 4 | 0.5% |
| **[FORMATO FECHA/HORA/NÚMERO]** | 13 | 1.5% |
| **[ABREVIATURA PIZARRA]** | 3 | 0.3% |
| **[FRASE UI SIN TRADUCIR]** | 0 | 0.0% |
| **[OTRO]** | 769 | 88.8% |

### Claves por Namespace:

#### Namespace: `nav` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `nav.ia` | [OTRO] | "AI GENERATOR..." |

#### Namespace: `btn` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `btn.edit` | [SIGLA/ACRÓNIMO] | "EDIT..." |
| `btn.filter` | [SIGLA/ACRÓNIMO] | "FILTER..." |

#### Namespace: `common` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `common.starter` | [OTRO] | "Starter..." |
| `common.optimal` | [OTRO] | "Optimal..." |
| `common.email` | [OTRO] | "Email..." |
| `common.edit` | [OTRO] | "Edit..." |

#### Namespace: `dashboard` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `dashboard.workload.week` | [OTRO] | "Wk..." |
| `dashboard.upgrade.resetTrial` | [OTRO] | "Reset..." |

#### Namespace: `block` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `block.warmup` | [OTRO] | "Warm-up..." |
| `block.abp` | [OTRO] | "Set Pieces..." |
| `block.physical` | [OTRO] | "Physical..." |

#### Namespace: `month` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `month.Sep` | [OTRO] | "Sep..." |
| `month.Nov` | [OTRO] | "Nov..." |
| `month.Ene` | [OTRO] | "Jan..." |
| `month.Feb` | [OTRO] | "Feb..." |
| `month.Mar` | [OTRO] | "Mar..." |
| `month.Abr` | [OTRO] | "Apr..." |
| `month.Jun` | [OTRO] | "Jun..." |
| `month.Jul` | [OTRO] | "Jul..." |

#### Namespace: `page` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `page.ia` | [OTRO] | "AI GENERATOR..." |
| `page.default` | [OTRO] | "MISTER 11..." |

#### Namespace: `bottomnav` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `bottomnav.home` | [OTRO] | "Home..." |
| `bottomnav.pizarra` | [OTRO] | "Board..." |
| `bottomnav.ia` | [SIGLA/ACRÓNIMO] | "AI..." |
| `bottomnav.tests` | [OTRO] | "Tests..." |
| `bottomnav.admin` | [FORMATO FECHA/HORA/NÚMERO] | "Admin..." |
| `bottomnav.more` | [OTRO] | "More..." |
| `bottomnav.planificacion` | [OTRO] | "Planning..." |

#### Namespace: `paywall` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `paywall.proBadge` | [OTRO] | "PRO PLAN..." |
| `paywall.clubBadge` | [OTRO] | "CLUB PLAN..." |
| `paywall.upgradeClubBtn` | [OTRO] | "View CLUB Plans..." |
| `paywall.androidNotNow` | [OTRO] | "Not now..." |
| `paywall.androidRedeemTitle` | [OTRO] | "Redeem Code..." |

#### Namespace: `auth` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `auth.registerTitle` | [OTRO] | "Create Account..." |
| `auth.password` | [OTRO] | "Password..." |
| `auth.loginLink` | [OTRO] | "Log in..." |
| `auth.joinBtn` | [OTRO] | "Send Request..." |
| `auth.logout` | [OTRO] | "Log Out..." |

#### Namespace: `live` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `live.btn.recovery` | [OTRO] | "Ball Recovery..." |
| `live.btn.loss` | [OTRO] | "Ball Loss..." |
| `live.btn.duel_won` | [OTRO] | "Duel Won..." |
| `live.btn.duel_lost` | [OTRO] | "Duel Lost..." |
| `live.btn.foul_favor` | [OTRO] | "Foul in Favor..." |
| `live.btn.foul_against` | [OTRO] | "Foul Against..." |
| `live.btn.counter_not_cut` | [OTRO] | "Uncut Counter..." |
| `live.btn.player_no_finish` | [OTRO] | "Unfinished Play..." |
| `live.btn.card_red_own` | [OTRO] | "Red Card (Own)..." |
| `live.btn.corner_favor` | [OTRO] | "Corner in Favor..." |
| `live.btn.corner_against` | [OTRO] | "Corner Against..." |
| `live.btn.offside_own` | [OTRO] | "Offside (Own)..." |
| `live.tab.capture` | [OTRO] | "Live Capture..." |
| `live.tab.tactical` | [OTRO] | "Field & Tactics..." |

#### Namespace: `test` (43 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `test.question` | [OTRO] | "Question..." |
| `test.of` | [OTRO] | "of..." |
| `test.dimension` | [OTRO] | "Dimension..." |
| `test.previous` | [OTRO] | "Previous..." |
| `test.lastResult` | [OTRO] | "Last result..." |
| `test.repeatTest` | [OTRO] | "Retake Test..." |
| `test.timeEstimate` | [FORMATO FECHA/HORA/NÚMERO] | "~{minutes} min..." |
| `test.completedBadge` | [OTRO] | "Completed..." |
| `test.opt.almostNever` | [OTRO] | "Almost never..." |
| `test.opt.sometimes` | [OTRO] | "Sometimes..." |
| `test.opt.often` | [OTRO] | "Often..." |
| `test.opt.almostAlways` | [OTRO] | "Almost always..." |
| `test.opt.disagree` | [OTRO] | "Disagree..." |
| `test.opt.agree` | [OTRO] | "Agree..." |
| `test.opt.stronglyAgree` | [OTRO] | "Strongly agree..." |
| *... y 28 claves adicionales en este namespace* | | |

#### Namespace: `admin` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `admin.tab.equipos` | [OTRO] | "Teams..." |
| `admin.tab.club` | [OTRO] | "Club..." |
| `admin.tab.general` | [OTRO] | "General..." |
| `admin.tab.suscripcion` | [OTRO] | "Subscription..." |
| `admin.lang.title` | [OTRO] | "System Language..." |
| `admin.theme.dark` | [OTRO] | "Dark Mode..." |

#### Namespace: `equipo` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `equipo.tab.squad` | [OTRO] | "Squad..." |
| `equipo.tab.attendance` | [OTRO] | "Attendance..." |
| `equipo.tab.staff` | [OTRO] | "Coaching Staff..." |

#### Namespace: `partidos` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `partidos.tab.analisis` | [OTRO] | "Analysis..." |

#### Namespace: `plan` (19 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plan.tab.macrociclo` | [OTRO] | "MACROCYCLE..." |
| `plan.tab.mesociclo` | [OTRO] | "MESOCYCLE..." |
| `plan.tab.microciclo` | [OTRO] | "MICROCYCLE..." |
| `plan.tab.objetivos` | [OTRO] | "OBJECTIVES..." |
| `plan.saving` | [OTRO] | "SAVING......" |
| `plan.dateRange` | [OTRO] | "DATE RANGE..." |
| `plan.start` | [OTRO] | "Start..." |
| `plan.end` | [OTRO] | "End..." |
| `plan.trainingDays` | [OTRO] | "TRAINING DAYS..." |
| `plan.category` | [SIGLA/ACRÓNIMO] | "CATEGORY..." |
| `plan.coach` | [SIGLA/ACRÓNIMO] | "COACH..." |
| `plan.seasonVolume` | [OTRO] | "SEASON VOLUME..." |
| `plan.days.monday` | [SIGLA/ACRÓNIMO] | "M..." |
| `plan.days.tuesday` | [SIGLA/ACRÓNIMO] | "T..." |
| `plan.days.wednesday` | [SIGLA/ACRÓNIMO] | "W..." |
| *... y 4 claves adicionales en este namespace* | | |

#### Namespace: `sesiones` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sesiones.tab.captures` | [OTRO] | "Captures..." |
| `sesiones.tab.animations` | [OTRO] | "Animations..." |
| `sesiones.fieldMode` | [OTRO] | "Field Mode..." |
| `sesiones.views.day` | [SIGLA/ACRÓNIMO] | "DAY..." |
| `sesiones.views.week` | [SIGLA/ACRÓNIMO] | "WEEK..." |
| `sesiones.views.month` | [SIGLA/ACRÓNIMO] | "MONTH..." |
| `sesiones.noDiagram` | [OTRO] | "No diagram..." |
| `sesiones.actions.edit` | [OTRO] | "Edit..." |
| `sesiones.actions.share` | [OTRO] | "Share..." |
| `sesiones.blockCount.one` | [OTRO] | "{count} Block..." |
| `sesiones.blockCount.other` | [OTRO] | "{count} Blocks..." |
| `sesiones.categories.all` | [OTRO] | "All..." |
| `sesiones.categories.fisica` | [OTRO] | "Physical..." |
| `sesiones.categories.mixta` | [OTRO] | "Mixed..." |
| `sesiones.categories.general` | [OTRO] | "General..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `tests` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `tests.tab.fisicos` | [OTRO] | "Fitness Tests..." |
| `tests.tab.psicosociales` | [OTRO] | "Psychosocial..." |
| `tests.tab.historial` | [OTRO] | "History..." |
| `tests.tab.comparativa` | [OTRO] | "Comparison..." |
| `tests.resources.tacticalTest` | [OTRO] | "Tactical Test..." |
| `tests.resources.seasonReport` | [OTRO] | "Season Report..." |
| `tests.resources.myTeam` | [OTRO] | "My Squad..." |
| `tests.rpe.save` | [OTRO] | "SAVE RPE..." |
| `tests.createTest` | [OTRO] | "+ Create Test..." |
| `tests.success` | [OTRO] | "Success..." |
| `tests.error` | [OTRO] | "Error..." |
| `tests.confirm_season_reset` | [OTRO] | "Reset Season..." |
| `tests.attention` | [OTRO] | "⚠️ ATTENTION..." |
| `tests.validation` | [OTRO] | "Validation..." |

#### Namespace: `player` (149 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `player.tab.general` | [SIGLA/ACRÓNIMO] | "GENERAL..." |
| `player.tab.chat` | [SIGLA/ACRÓNIMO] | "CHAT..." |
| `player.tab.physical` | [SIGLA/ACRÓNIMO] | "PHYSICAL..." |
| `player.tab.health` | [SIGLA/ACRÓNIMO] | "HEALTH..." |
| `player.tab.plans` | [SIGLA/ACRÓNIMO] | "PLANS..." |
| `player.tab.attendance` | [OTRO] | "ATTENDANCE..." |
| `player.tab.settings` | [SIGLA/ACRÓNIMO] | "SETTINGS..." |
| `player.nav.home` | [OTRO] | "Home..." |
| `player.nav.schedule` | [OTRO] | "Schedule..." |
| `player.nav.achievements` | [OTRO] | "Achievements..." |
| `player.nav.chat` | [OTRO] | "Coach..." |
| `player.nav.tests` | [OTRO] | "Tests..." |
| `player.nav.stats` | [OTRO] | "Stats..." |
| `player.nav.profile` | [OTRO] | "Profile..." |
| `player.home.nextMatch` | [OTRO] | "Next Call-up..." |
| *... y 134 claves adicionales en este namespace* | | |

#### Namespace: `ach` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ach.weekly_perfect_week.name` | [OTRO] | "Perfect Week..." |
| `ach.weekly_wellness.name` | [OTRO] | "Health Check-in..." |
| `ach.weekly_scholar.name` | [OTRO] | "Strong Mind..." |
| `ach.weekly_committed.name` | [OTRO] | "Invisible Work..." |
| `ach.weekly_attentive.name` | [OTRO] | "Always Ready..." |
| `ach.biweekly_self_care.name` | [OTRO] | "Healthy Habit..." |
| `ach.season_veteran.name` | [OTRO] | "Season Veteran..." |
| `ach.season_captain.name` | [OTRO] | "Captain Spirit..." |
| `ach.weekly_mind_active.name` | [OTRO] | "Active Mind..." |
| `ach.weekly_zen.name` | [OTRO] | "Zen..." |
| `ach.gold_impulse_brake.name` | [OTRO] | "Golden Brake..." |
| `ach.gold_tactical_eye.name` | [OTRO] | "Hawk Eye..." |
| `ach.season_mental_squad.name` | [OTRO] | "Mental Squad..." |

#### Namespace: `games` (86 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `games.intro.whatTitle` | [OTRO] | "What We Train..." |
| `games.intro.howTitle` | [OTRO] | "How to Play..." |
| `games.safety.title` | [OTRO] | "Safety at Home..." |
| `games.limits.available` | [OTRO] | "Available..." |
| `games.limits.minutesLbl` | [OTRO] | "Time played..." |
| `games.btn.play` | [OTRO] | "Play..." |
| `games.status.notPlayed` | [OTRO] | "No record..." |
| `games.g1.skill` | [OTRO] | "Reaction Speed..." |
| `games.g1.step1` | [OTRO] | "Wait on red...." |
| `games.g1.waitGreen` | [OTRO] | "Wait for green…..." |
| `games.g1.tooSlow` | [OTRO] | "Too slow! Miss...." |
| `games.g1.falseStart` | [OTRO] | "🚫 False start...." |
| `games.g1.statMedian` | [OTRO] | "Median..." |
| `games.g1.statBest` | [OTRO] | "Best record..." |
| `games.g1.statFalses` | [OTRO] | "False starts..." |
| *... y 71 claves adicionales en este namespace* | | |

#### Namespace: `attendance` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `attendance.chart.legend.absent` | [OTRO] | "Absent..." |
| `attendance.chart.legend.late` | [OTRO] | "Late..." |
| `attendance.chart.legend.justified` | [OTRO] | "Justified..." |

#### Namespace: `matches` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matches.warnings.showDetails` | [OTRO] | "View list..." |
| `matches.warnings.hideDetails` | [OTRO] | "Hide details..." |
| `matches.warnings.cleansing` | [OTRO] | "Resolving......" |
| `matches.warnings.auditShow` | [OTRO] | "View details..." |
| `matches.warnings.auditHide` | [OTRO] | "Hide audit..." |
| `matches.lineup.downloadPng` | [OTRO] | "DOWNLOAD PNG..." |
| `matches.lineup.exportingPng` | [OTRO] | "EXPORTING......" |
| `matches.lineup.emptySlot` | [OTRO] | "Empty..." |

#### Namespace: `spell` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `spell.missingAccent` | [OTRO] | "Missing accent..." |
| `spell.typo` | [OTRO] | "Typo..." |
| `spell.ignore` | [OTRO] | "Ignore..." |
| `spell.recommended` | [OTRO] | "Suggestions:..." |

#### Namespace: `analisis` (29 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `analisis.shortcuts.title` | [OTRO] | "SHORTCUTS:..." |
| `analisis.shortcuts.last3` | [OTRO] | "Last 3..." |
| `analisis.shortcuts.last5` | [OTRO] | "Last 5..." |
| `analisis.shortcuts.allSeason` | [OTRO] | "Whole Season..." |
| `analisis.mode.title` | [OTRO] | "Metrics:..." |
| `analisis.mode.averages` | [OTRO] | "Averages..." |
| `analisis.mode.totals` | [OTRO] | "Totals..." |
| `analisis.kpi.shots` | [OTRO] | "Shots on Target..." |
| `analisis.kpi.duels` | [OTRO] | "Duels Won..." |
| `analisis.table.result` | [OTRO] | "Result..." |
| `analisis.table.shots` | [OTRO] | "Shots (O / R)..." |
| `analisis.table.duels` | [FORMATO FECHA/HORA/NÚMERO] | "Duels %..." |
| `analisis.table.recLoss` | [OTRO] | "Rec / Loss..." |
| `analisis.table.fouls` | [OTRO] | "Fouls (F / A)..." |
| `analisis.table.cards` | [OTRO] | "Cards (Y / R)..." |
| *... y 14 claves adicionales en este namespace* | | |

#### Namespace: `ia` (49 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ia.categoryAge` | [OTRO] | "Category / Age..." |
| `ia.selectPlaceholder` | [OTRO] | "Select......" |
| `ia.mainObjective` | [OTRO] | "Main Objective..." |
| `ia.materials` | [OTRO] | "Materials..." |
| `ia.space` | [OTRO] | "Pitch Area..." |
| `ia.noRef` | [OTRO] | "No Ref...." |
| `ia.capture` | [OTRO] | "Capture..." |
| `ia.tacticalBoard` | [OTRO] | "🎬 Board..." |
| `ia.dictationStart` | [OTRO] | "Voice dictation..." |
| `ia.dictationStop` | [OTRO] | "Stop dictation..." |
| `ia.age.prebenjamin` | [OTRO] | "Under-10 (8-10)..." |
| `ia.obj.possession` | [OTRO] | "Ball possession..." |
| `ia.obj.positional` | [OTRO] | "Positional play..." |
| `ia.mat.balls` | [OTRO] | "Footballs..." |
| `ia.mat.cones` | [OTRO] | "Cones..." |
| *... y 34 claves adicionales en este namespace* | | |

#### Namespace: `board` (94 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `board.toolbar.fullscreen` | [OTRO] | "Full Screen..." |
| `board.toolbar.sides` | [OTRO] | "Sides..." |
| `board.toolbar.swapSides` | [OTRO] | "Swap team sides..." |
| `board.toolbar.width` | [OTRO] | "Width..." |
| `board.toolbar.height` | [OTRO] | "Height..." |
| `board.toolbar.zoomIn` | [OTRO] | "Zoom In..." |
| `board.toolbar.zoomOut` | [OTRO] | "Zoom Out..." |
| `board.toolbar.resetZoom` | [OTRO] | "Reset Zoom..." |
| `board.toolbar.undo` | [OTRO] | "Undo..." |
| `board.toolbar.redo` | [OTRO] | "Redo..." |
| `board.toolbar.new` | [SIGLA/ACRÓNIMO] | "NEW..." |
| `board.toolbar.exportMp4` | [OTRO] | "EXPORT MP4..." |
| `board.exportModal.speed` | [OTRO] | "Playback Speed..." |
| `board.exportModal.orientation` | [OTRO] | "Orientation..." |
| `board.exportModal.metaTitle` | [OTRO] | "File title..." |
| *... y 79 claves adicionales en este namespace* | | |

#### Namespace: `pos` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pos.all` | [SIGLA/ACRÓNIMO] | "ALL..." |
| `pos.por` | [SIGLA/ACRÓNIMO] | "GK..." |
| `pos.def` | [ABREVIATURA PIZARRA] | "DEF..." |
| `pos.ltd` | [SIGLA/ACRÓNIMO] | "RB..." |
| `pos.lti` | [SIGLA/ACRÓNIMO] | "LB..." |
| `pos.mcd` | [SIGLA/ACRÓNIMO] | "CDM..." |
| `pos.mc` | [SIGLA/ACRÓNIMO] | "CM..." |
| `pos.mco` | [SIGLA/ACRÓNIMO] | "CAM..." |
| `pos.ext` | [SIGLA/ACRÓNIMO] | "W..." |
| `pos.del` | [SIGLA/ACRÓNIMO] | "ST..." |

#### Namespace: `health` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `health.active` | [OTRO] | "Active..." |
| `health.resolved` | [OTRO] | "Recovered..." |
| `health.addInjury` | [OTRO] | "+ Record Injury..." |

#### Namespace: `plans` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plans.badgeTeam` | [SIGLA/ACRÓNIMO] | "TEAM..." |
| `plans.badgeIndividual` | [OTRO] | "INDIVIDUAL..." |
| `plans.sharePlan` | [OTRO] | "🔗 Share Plan..." |

#### Namespace: `staff` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staff.copyCode` | [OTRO] | "Copy Code..." |
| `staff.copied` | [OTRO] | "Copied!..." |
| `staff.shareLink` | [OTRO] | "Share Link..." |
| `staff.you` | [OTRO] | "(You)..." |
| `staff.changeRole` | [OTRO] | "Change Role:..." |
| `staff.role.headCoach` | [OTRO] | "Head Coach..." |
| `staff.role.scout` | [OTRO] | "Scout..." |
| `staff.remove` | [OTRO] | "Remove..." |
| `staff.copyLink` | [OTRO] | "Copy Link..." |
| `staff.sendInvite` | [OTRO] | "Send Invitation..." |
| `staff.copy` | [OTRO] | "Copy..." |
| `staff.sixDigitCode` | [OTRO] | "6-digit code:..." |
| `staff.createdDate` | [OTRO] | "Created: {date}..." |

#### Namespace: `wellness` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `wellness.rpe.scaleMin` | [OTRO] | "1 - Very light..." |
| `wellness.rpe.save` | [OTRO] | "SAVE RPE..." |

#### Namespace: `cognitive` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `cognitive.btn_verifying` | [OTRO] | "Verifying…..." |
| `cognitive.metric_median_reaction` | [OTRO] | "Median reaction..." |
| `cognitive.metric_trend` | [OTRO] | "Trend..." |
| `cognitive.trend_improving` | [OTRO] | "↑ Improving..." |
| `cognitive.trend_stable` | [OTRO] | "= Stable..." |
| `cognitive.category_label` | [OTRO] | "Category: {cat}..." |
| `cognitive.target_team` | [OTRO] | "Entire team..." |
| `cognitive.target_player` | [OTRO] | "Individual..." |
| `cognitive.modal_recipient_label` | [OTRO] | "Recipient:..." |
| `cognitive.modal_only_player` | [OTRO] | "Only {name}..." |
| `cognitive.select_all` | [OTRO] | "Select all..." |
| `cognitive.deselect_all` | [OTRO] | "Deselect all..." |
| `cognitive.cat.benjamin` | [SIGLA/ACRÓNIMO] | "U-10..." |
| `cognitive.cat.alevin` | [SIGLA/ACRÓNIMO] | "U-12..." |
| `cognitive.cat.infantil` | [SIGLA/ACRÓNIMO] | "U-14..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `status` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `status.none` | [OTRO] | "Not Selected..." |

#### Namespace: `install` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `install.instructions` | [OTRO] | "Instructions:..." |
| `install.iosTitle` | [OTRO] | "iOS (Safari):..." |
| `install.btnInstall` | [OTRO] | "Install now..." |

#### Namespace: `consent` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `consent.detailsTitle` | [OTRO] | "Consent Details..." |
| `consent.parentNameLabel` | [OTRO] | "Guardian Name *..." |
| `consent.parentNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.parentDniPlaceholder` | [OTRO] | "e.g. 12345678Z..." |
| `consent.relationLabel` | [OTRO] | "Relationship *..." |
| `consent.relationFather` | [OTRO] | "Father..." |
| `consent.relationMother` | [OTRO] | "Mother..." |
| `consent.parentPhoneLabel` | [OTRO] | "Contact Phone..." |
| `consent.playerNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.playerDobLabel` | [OTRO] | "Date of Birth *..." |
| `consent.coachNamePlaceholder` | [OTRO] | "Coach Name..." |
| `consent.seasonLabel` | [OTRO] | "Season..." |
| `consent.privacyTitle` | [OTRO] | "PRIVACY NOTICE..." |

#### Namespace: `matchSheet` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matchSheet.saving` | [OTRO] | "💾 Saving......" |
| `matchSheet.manual_badge` | [OTRO] | "Manual..." |
| `matchSheet.auto_badge` | [OTRO] | "Auto..." |

#### Namespace: `invite` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `invite.link_copied` | [OTRO] | "Link copied!..." |
| `invite.player.scanQR` | [OTRO] | "Scan team QR..." |

#### Namespace: `planning` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `planning.login_required` | [OTRO] | "Sign in to save..." |
| `planning.save_error` | [OTRO] | "Error saving...." |
| `planning.pdf_exported` | [NOMBRE PROPIO/MARCA] | "PDF exported ✓..." |

#### Namespace: `gk` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `gk.roleBadge` | [OTRO] | "🧤 Goalkeeper..." |
| `gk.saves` | [OTRO] | "Saves..." |
| `gk.savesShort` | [OTRO] | "Saves..." |
| `gk.conceded` | [OTRO] | "Goals Conceded..." |
| `gk.concededShort` | [OTRO] | "Conc...." |
| `gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `gk.cleanSheetsShort` | [OTRO] | "Clean Sh...." |
| `gk.penaltySaves` | [OTRO] | "Penalties Saved..." |
| `gk.penaltySavesShort` | [OTRO] | "Pen. Saved..." |
| `gk.claimsShort` | [OTRO] | "Claims..." |
| `gk.errorGoalShort` | [OTRO] | "Err. Goal..." |
| `gk.perMatch` | [OTRO] | "Per match..." |
| `gk.rating` | [OTRO] | "GK Rating..." |
| `gk.btn.conceded` | [OTRO] | "Conceded Goal..." |
| `gk.btn.penaltySave` | [OTRO] | "Penalty Saved..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `exports` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exports.gk.saves` | [OTRO] | "Saves..." |
| `exports.gk.conceded` | [OTRO] | "Conceded..." |
| `exports.gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `exports.gk.penaltySaves` | [OTRO] | "Pen. Saved..." |
| `exports.gk.errors` | [OTRO] | "Errors..." |
| `exports.gk.rating` | [OTRO] | "GK Rating..." |
| `exports.report.page` | [OTRO] | "Page..." |
| `exports.test.physical` | [OTRO] | "Physical Test..." |
| `exports.test.technical` | [OTRO] | "Technical Test..." |
| `exports.test.tactical` | [OTRO] | "Tactical Test..." |
| `exports.test.attendance` | [OTRO] | "Attendance..." |
| `exports.test.table_test` | [OTRO] | "Test..." |
| `exports.test.table_score` | [OTRO] | "Score..." |
| `exports.test.table_interp` | [OTRO] | "Interpretation..." |

#### Namespace: `shot` (27 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `shot.team_own` | [OTRO] | "Own..." |
| `shot.team_rival` | [OTRO] | "Opponent..." |
| `shot.zone` | [OTRO] | "Shot Zone..." |
| `shot.zone_inside_center` | [OTRO] | "Center (Box)..." |
| `shot.zone_inside_left` | [OTRO] | "Left Wing (Box)..." |
| `shot.zone_penalty` | [OTRO] | "Penalty Spot..." |
| `shot.playType` | [OTRO] | "Play Type..." |
| `shot.playType_jugada` | [OTRO] | "Open Play..." |
| `shot.playType_contra` | [OTRO] | "Counter Attack..." |
| `shot.playType_balon_parado` | [OTRO] | "Set Piece..." |
| `shot.playType_penalti` | [OTRO] | "Penalty..." |
| `shot.result` | [OTRO] | "Shot Result..." |
| `shot.result_gol` | [OTRO] | "Goal..." |
| `shot.result_fuera` | [OTRO] | "Missed..." |
| `shot.result_bloqueado` | [OTRO] | "Blocked..." |
| *... y 12 claves adicionales en este namespace* | | |

#### Namespace: `liveStats` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `liveStats.quickMode.title` | [OTRO] | "Quick Mode..." |
| `liveStats.quickMode.simple` | [OTRO] | "Simple mode..." |
| `liveStats.quickMode.shotSaved` | [OTRO] | "Shot recorded..." |
| `liveStats.quickMode.undo` | [OTRO] | "Undo..." |
| `liveStats.quickMode.undone` | [OTRO] | "Shot undone..." |

#### Namespace: `xg` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `xg.own_xg` | [OTRO] | "Own xG..." |
| `xg.rival_xg` | [OTRO] | "Opponent xG..." |
| `xg.box_center` | [OTRO] | "Central Box..." |
| `xg.box_wings` | [OTRO] | "Lateral Box..." |
| `xg.outside_box` | [OTRO] | "Outside Box..." |
| `xg.penalty_box` | [OTRO] | "Penalty..." |
| `xg.decisive_saves` | [OTRO] | "Decisive Saves..." |
| `xg.normal_saves` | [OTRO] | "Normal Saves..." |
| `xg.total_saves` | [OTRO] | "Total Saves..." |

#### Namespace: `swot` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `swot.origin_metric` | [OTRO] | "Origin metric..." |
| `swot.manual_badge` | [OTRO] | "Manual..." |
| `swot.auto_badge` | [OTRO] | "Rule..." |

#### Namespace: `capture` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `capture.team.shot_own` | [OTRO] | "Own Shot..." |
| `capture.team.shot_rival` | [OTRO] | "Opponent Shot..." |
| `capture.hud.shot` | [OTRO] | "Shot..." |
| `capture.hud.recovery` | [OTRO] | "Recovery..." |
| `capture.hud.duel_won` | [OTRO] | "Duel Won..." |
| `capture.hud.foul` | [OTRO] | "Foul..." |
| `capture.hud.advanced` | [OTRO] | "Advanced..." |
| `capture.hud.key_pass` | [OTRO] | "Key Pass..." |
| `capture.hud.turnover` | [OTRO] | "Turnover..." |
| `capture.hud.duel_lost` | [OTRO] | "Duel Lost..." |
| `capture.hud.unattributed` | [OTRO] | "Unattributed..." |
| `capture.refine_skip` | [OTRO] | "Skip..." |

#### Namespace: `match` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `match.status.finalizado` | [SIGLA/ACRÓNIMO] | "FINISHED..." |
| `match.status.en_edicion` | [OTRO] | "IN EDITING..." |
| `match.status.pendiente` | [SIGLA/ACRÓNIMO] | "PENDING..." |
| `match.status.no_disputado` | [OTRO] | "NOT PLAYED..." |
| `match.sort.label` | [OTRO] | "Sort by..." |
| `match.sort.fecha_asc` | [FORMATO FECHA/HORA/NÚMERO] | "Date (Upcoming)..." |
| `match.sort.fecha_desc` | [OTRO] | "Date (Recent)..." |
| `match.view.cards` | [OTRO] | "Cards..." |
| `match.view.detailed` | [OTRO] | "Detailed..." |

#### Namespace: `stats` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `stats.eventMap.title` | [OTRO] | "Zone Event Map..." |
| `stats.theater.theater_mode` | [OTRO] | "Theater Mode..." |
| `stats.theater.fullscreen` | [OTRO] | "Fullscreen..." |
| `stats.theater.exit_fullscreen` | [OTRO] | "Exit Fullscreen..." |

#### Namespace: `error` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `error.retry_section` | [OTRO] | "Retry..." |
| `error.section_code` | [OTRO] | "Code: {code}..." |

#### Namespace: `charts` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `charts.view.pass_network` | [OTRO] | "Pass Network..." |
| `charts.view.territorial_map` | [OTRO] | "Territorial Map..." |

#### Namespace: `pricing` (25 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pricing.billing.discountBadge` | [OTRO] | "2 MONTHS FREE..." |
| `pricing.billing.monthly` | [OTRO] | "Monthly..." |
| `pricing.plan.free.name` | [OTRO] | "Free Plan..." |
| `pricing.plan.pro.name` | [OTRO] | "PRO Plan..." |
| `pricing.plan.clubStarter.name` | [OTRO] | "Club Starter..." |
| `pricing.plan.clubPro.name` | [OTRO] | "Club PRO..." |
| `pricing.plan.clubPremium.name` | [OTRO] | "Club Premium..." |
| `pricing.freq.forever` | [OTRO] | "/ forever..." |
| `pricing.freq.season` | [OTRO] | "/ season..." |
| `pricing.freq.seasonShort` | [OTRO] | "/ season..." |
| `pricing.freq.month` | [OTRO] | "/ month..." |
| `pricing.vat.included` | [OTRO] | "VAT Included..." |
| `pricing.free.attr3_text` | [OTRO] | "included..." |
| `pricing.btn.startFree` | [OTRO] | "START FREE..." |
| `pricing.pro.attr1_strong` | [OTRO] | "Up to 3 Teams..." |
| *... y 10 claves adicionales en este namespace* | | |

#### Namespace: `playerProfile` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerProfile.physicalStats` | [OTRO] | "Physical Stats..." |
| `playerProfile.heightLabel` | [OTRO] | "Height..." |
| `playerProfile.weightLabel` | [OTRO] | "Weight..." |
| `playerProfile.ageLabel` | [OTRO] | "Age..." |
| `playerProfile.heightUnit` | [OTRO] | "cm..." |
| `playerProfile.weightUnit` | [OTRO] | "kg..." |
| `playerProfile.bmi` | [SIGLA/ACRÓNIMO] | "BMI..." |

#### Namespace: `sessionRating` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sessionRating.rateButton` | [OTRO] | "Rate..." |
| `sessionRating.ratingLabel` | [OTRO] | "Score..." |
| `sessionRating.averageRating` | [OTRO] | "Avg..." |
| `sessionRating.radarAxisTraining` | [OTRO] | "Training..." |

#### Namespace: `notifPrefs` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifPrefs.reminderTime` | [FORMATO FECHA/HORA/NÚMERO] | "Reminder Time..." |
| `notifPrefs.quietHoursTitle` | [OTRO] | "Quiet Hours..." |
| `notifPrefs.quietHoursEnd` | [OTRO] | "Quiet end time..." |
| `notifPrefs.frequencyCapTitle` | [OTRO] | "Frequency Cap..." |
| `notifPrefs.perDay` | [OTRO] | "per day..." |

#### Namespace: `csv` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `csv.stepUpload` | [OTRO] | "Upload..." |
| `csv.stepMapping` | [OTRO] | "Mapping..." |
| `csv.stepPreview` | [OTRO] | "Preview..." |
| `csv.browseFile` | [OTRO] | "Browse File..." |
| `csv.fieldRequired` | [OTRO] | "Required..." |
| `csv.fieldBirthDate` | [OTRO] | "Date of Birth..." |
| `csv.fieldOptional` | [OTRO] | "Optional..." |
| `csv.fieldEmail` | [OTRO] | "Email Address..." |
| `csv.status` | [OTRO] | "Status..." |
| `csv.tagValid` | [OTRO] | "Valid..." |

#### Namespace: `qrScanner` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `qrScanner.uploadQrPhoto` | [OTRO] | "Upload QR photo..." |

#### Namespace: `teamQr` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamQr.teamCodeLabel` | [OTRO] | "Access Code:..." |
| `teamQr.copied` | [OTRO] | "Copied..." |
| `teamQr.copyCode` | [OTRO] | "Copy Code..." |
| `teamQr.shareLink` | [OTRO] | "Share Link..." |

#### Namespace: `staffJoin` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffJoin.linkPlaceholder` | [OTRO] | "https://mister11.com/join-staff?code=ABC123..." |
| `staffJoin.assignedRole` | [OTRO] | "Assigned Role:..." |

#### Namespace: `staffInvite` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffInvite.copyCode` | [OTRO] | "Copy Code..." |
| `staffInvite.shareLink` | [OTRO] | "Share Link..." |
| `staffInvite.qrModal` | [OTRO] | "View Staff QR..." |
| `staffInvite.joinBtn` | [OTRO] | "JOIN TEAM..." |
| `staffInvite.roleLabel` | [OTRO] | "Assigned role:..." |
| `staffInvite.sendBtn` | [OTRO] | "Send Invitation..." |
| `staffInvite.copyLink` | [OTRO] | "Copy Link..." |
| `staffInvite.qrCopied` | [OTRO] | "Link copied..." |

#### Namespace: `convocation` (20 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `convocation.tab` | [OTRO] | "Squad List..." |
| `convocation.downloading` | [OTRO] | "Downloading......" |
| `convocation.sendToPlayers` | [OTRO] | "Send to players..." |
| `convocation.send` | [OTRO] | "Send..." |
| `convocation.sending` | [OTRO] | "Sending......" |
| `convocation.cleanSelection` | [OTRO] | "Clear selection..." |
| `convocation.positions.gk` | [OTRO] | "GOALKEEPERS..." |
| `convocation.positions.def` | [OTRO] | "DEFENDERS..." |
| `convocation.positions.mid` | [OTRO] | "MIDFIELDERS..." |
| `convocation.positions.fwd` | [SIGLA/ACRÓNIMO] | "FORWARDS..." |
| `convocation.positionsEn.gk` | [SIGLA/ACRÓNIMO] | "PORTEROS..." |
| `convocation.positionsEn.def` | [SIGLA/ACRÓNIMO] | "DEFENSAS..." |
| `convocation.positionsEn.mid` | [OTRO] | "MEDIOCAMPISTAS..." |
| `convocation.positionsEn.fwd` | [OTRO] | "DELANTEROS..." |
| `convocation.matchInfo.rival` | [OTRO] | "Opponent..." |
| *... y 5 claves adicionales en este namespace* | | |

#### Namespace: `whiteboard` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `whiteboard.exportRetry` | [OTRO] | "Retry export..." |


---

