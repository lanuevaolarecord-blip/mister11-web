# MÍSTER11 — Desglose Exhaustivo de Duplicación (PT, FR, ID vs EN)

**Fecha:** 2026-10-07  
**Auditor:** QA Sr. + Especialista en Localización  
**Propósito:** Transparencia radical. Identificar de forma explícita cada clave idéntica al inglés en las lenguas activas, agrupadas por categoría y namespace.

---

## 1. Lengua: `PT` (Total Claves Idénticas a EN: 1942)

### Resumen por Categoría:

| Categoría | Conteo | Porcentaje |
|---|---|---|
| **[SIGLA/ACRÓNIMO]** | 76 | 3.9% |
| **[NOMBRE PROPIO/MARCA]** | 26 | 1.3% |
| **[FORMATO FECHA/HORA/NÚMERO]** | 24 | 1.2% |
| **[ABREVIATURA PIZARRA]** | 3 | 0.2% |
| **[FRASE UI SIN TRADUCIR]** | 1006 | 51.8% |
| **[OTRO]** | 807 | 41.6% |

### Claves por Namespace:

#### Namespace: `common` (11 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `common.originalLanguage` | [FRASE UI SIN TRADUCIR] | "Original language..." |
| `common.originalLanguageEs` | [FRASE UI SIN TRADUCIR] | "Original language: Spanish..." |
| `common.originalLanguageEn` | [FRASE UI SIN TRADUCIR] | "Original language: English..." |
| `common.originalBadgeEs` | [OTRO] | "ES original..." |
| `common.originalBadgeEn` | [OTRO] | "EN original..." |
| `common.all` | [SIGLA/ACRÓNIMO] | "ALL..." |
| `common.loading` | [OTRO] | "Loading......" |
| `common.savedSuccess` | [FRASE UI SIN TRADUCIR] | "Saved successfully..." |
| `common.errorGeneral` | [FRASE UI SIN TRADUCIR] | "An unexpected error occurred..." |
| `common.success` | [FRASE UI SIN TRADUCIR] | "Operation completed successfully..." |
| `common.genericError` | [OTRO] | "Operation error..." |

#### Namespace: `notifications` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifications.empty` | [FRASE UI SIN TRADUCIR] | "You have no pending notifications...." |
| `notifications.timeNow` | [OTRO] | "Now..." |
| `notifications.timeJustNow` | [OTRO] | "Just now..." |
| `notifications.timeMinAgo` | [FORMATO FECHA/HORA/NÚMERO] | "{min} min ago..." |
| `notifications.timeHoursAgo` | [FRASE UI SIN TRADUCIR] | "{hours} hours ago..." |
| `notifications.newExerciseSaved` | [FRASE UI SIN TRADUCIR] | "New exercise saved: {name}..." |
| `notifications.predefinedExerciseError` | [FRASE UI SIN TRADUCIR] | "You cannot delete a system predefined exercise...." |
| `notifications.newSessionCreated` | [FRASE UI SIN TRADUCIR] | "New session created: {title}..." |
| `notifications.newPlayerAdded` | [FRASE UI SIN TRADUCIR] | "New player added: {name}..." |
| `notifications.individualPlanAssigned` | [FRASE UI SIN TRADUCIR] | "Individual plan assigned successfully..." |
| `notifications.individualPlanRemoved` | [FRASE UI SIN TRADUCIR] | "Individual plan removed..." |
| `notifications.newMatchRegistered` | [FRASE UI SIN TRADUCIR] | "New match registered vs {opponent}..." |

#### Namespace: `dashboard` (38 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `dashboard.welcome` | [OTRO] | "Hello, {name}..." |
| `dashboard.activity` | [FRASE UI SIN TRADUCIR] | "Here is your team activity ({club}) for this week...." |
| `dashboard.today` | [OTRO] | "Today..." |
| `dashboard.devAccess` | [NOMBRE PROPIO/MARCA] | "Developer Access - Mister11 PRO..." |
| `dashboard.devDesc` | [FRASE UI SIN TRADUCIR] | "Your account has lifetime access with all limits removed...." |
| `dashboard.devUnlimited` | [FRASE UI SIN TRADUCIR] | "✔ UNLIMITED DEVELOPER..." |
| `dashboard.stats.rival` | [OTRO] | "Next Opponent..." |
| `dashboard.stats.noRival` | [OTRO] | "No opponent..." |
| `dashboard.estimatedWorkload` | [FRASE UI SIN TRADUCIR] | "Estimated Workload..." |
| `dashboard.period.session` | [OTRO] | "This session..." |
| `dashboard.period.week` | [OTRO] | "This week..." |
| `dashboard.period.micro` | [OTRO] | "This microcycle..." |
| `dashboard.period.meso` | [OTRO] | "This mesocycle..." |
| `dashboard.period.macro` | [OTRO] | "This macrocycle..." |
| `dashboard.viewAll` | [OTRO] | "View all..." |
| *... y 23 claves adicionales en este namespace* | | |

#### Namespace: `session` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `session.untitled` | [OTRO] | "Untitled..." |

#### Namespace: `day` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `day.Lun` | [OTRO] | "Mon..." |
| `day.Mar` | [OTRO] | "Tue..." |
| `day.Mié` | [OTRO] | "Wed..." |
| `day.Jue` | [OTRO] | "Thu..." |
| `day.Vie` | [OTRO] | "Fri..." |
| `day.Sáb` | [OTRO] | "Sat..." |
| `day.Dom` | [OTRO] | "Sun..." |

#### Namespace: `block` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `block.warmup` | [OTRO] | "Warm-up..." |
| `block.abp` | [OTRO] | "Set Pieces..." |
| `block.physical` | [OTRO] | "Physical..." |

#### Namespace: `month` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `month.Sep` | [OTRO] | "Sep..." |
| `month.Oct` | [OTRO] | "Oct..." |
| `month.Nov` | [OTRO] | "Nov..." |
| `month.Dic` | [OTRO] | "Dec..." |
| `month.Ene` | [OTRO] | "Jan..." |
| `month.Feb` | [OTRO] | "Feb..." |
| `month.Mar` | [OTRO] | "Mar..." |
| `month.Abr` | [OTRO] | "Apr..." |
| `month.May` | [OTRO] | "May..." |
| `month.Jun` | [OTRO] | "Jun..." |
| `month.Jul` | [OTRO] | "Jul..." |
| `month.Ago` | [OTRO] | "Aug..." |

#### Namespace: `page` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `page.default` | [OTRO] | "MISTER 11..." |

#### Namespace: `bottomnav` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `bottomnav.home` | [OTRO] | "Home..." |
| `bottomnav.pizarra` | [OTRO] | "Board..." |
| `bottomnav.ia` | [SIGLA/ACRÓNIMO] | "AI..." |
| `bottomnav.tests` | [OTRO] | "Tests..." |
| `bottomnav.admin` | [FORMATO FECHA/HORA/NÚMERO] | "Admin..." |
| `bottomnav.more` | [OTRO] | "More..." |
| `bottomnav.moreModules` | [FRASE UI SIN TRADUCIR] | "Modules & Management..." |
| `bottomnav.planificacion` | [OTRO] | "Planning..." |

#### Namespace: `paywall` (19 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `paywall.title` | [FRASE UI SIN TRADUCIR] | "Unlock Full Potential..." |
| `paywall.proBadge` | [OTRO] | "PRO PLAN..." |
| `paywall.clubBadge` | [OTRO] | "CLUB PLAN..." |
| `paywall.freeLimitMsg` | [FRASE UI SIN TRADUCIR] | "You have reached the free plan limit...." |
| `paywall.upgradeBtn` | [OTRO] | "Upgrade to PRO..." |
| `paywall.upgradeClubBtn` | [OTRO] | "View CLUB Plans..." |
| `paywall.benefit1` | [FRASE UI SIN TRADUCIR] | "Unlimited training sessions..." |
| `paywall.benefit2` | [FRASE UI SIN TRADUCIR] | "Unlimited AI task generator..." |
| `paywall.benefit4` | [FRASE UI SIN TRADUCIR] | "Advanced statistics and metrics suite..." |
| `paywall.androidDialogTitle` | [FRASE UI SIN TRADUCIR] | "Míster11 PRO Plans..." |
| `paywall.androidDialogText` | [FRASE UI SIN TRADUCIR] | "Subscriptions are centrally managed on our web platform. Vis..." |
| `paywall.androidOpenWeb` | [FRASE UI SIN TRADUCIR] | "Open mister11.app..." |
| `paywall.androidHaveCode` | [FRASE UI SIN TRADUCIR] | "I already have a code..." |
| `paywall.androidNotNow` | [OTRO] | "Not now..." |
| `paywall.androidRedeemTitle` | [OTRO] | "Redeem Code..." |
| *... y 4 claves adicionales en este namespace* | | |

#### Namespace: `auth` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `auth.loginTitle` | [OTRO] | "Sign In..." |
| `auth.registerTitle` | [OTRO] | "Create Account..." |
| `auth.password` | [OTRO] | "Password..." |
| `auth.loginBtn` | [NOMBRE PROPIO/MARCA] | "Enter Mister11..." |
| `auth.googleBtn` | [NOMBRE PROPIO/MARCA] | "Continue with Google..." |
| `auth.noAccount` | [FRASE UI SIN TRADUCIR] | "Don't have an account?..." |
| `auth.hasAccount` | [FRASE UI SIN TRADUCIR] | "Already have an account?..." |
| `auth.registerLink` | [FRASE UI SIN TRADUCIR] | "Sign up for free..." |
| `auth.loginLink` | [OTRO] | "Log in..." |
| `auth.forgotPass` | [FRASE UI SIN TRADUCIR] | "Forgot password?..." |
| `auth.coachRole` | [FRASE UI SIN TRADUCIR] | "I am Coach / Staff..." |
| `auth.parentRole` | [FRASE UI SIN TRADUCIR] | "I am Parent / Guardian..." |
| `auth.teamCode` | [FRASE UI SIN TRADUCIR] | "Invitation Code (6 characters)..." |
| `auth.joinBtn` | [OTRO] | "Send Request..." |
| `auth.logout` | [OTRO] | "Log Out..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `live` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `live.btn.shot_on_own` | [FRASE UI SIN TRADUCIR] | "Shot on Target (Own)..." |
| `live.btn.shot_on_rival` | [FRASE UI SIN TRADUCIR] | "Shot on Target (Opponent)..." |
| `live.btn.shot_off_own` | [FRASE UI SIN TRADUCIR] | "Shot off Target (Own)..." |
| `live.btn.shot_off_rival` | [FRASE UI SIN TRADUCIR] | "Shot off Target (Opponent)..." |
| `live.btn.recovery` | [OTRO] | "Ball Recovery..." |
| `live.btn.loss` | [OTRO] | "Ball Loss..." |
| `live.btn.duel_won` | [OTRO] | "Duel Won..." |
| `live.btn.duel_lost` | [OTRO] | "Duel Lost..." |
| `live.btn.foul_favor` | [OTRO] | "Foul in Favor..." |
| `live.btn.foul_against` | [OTRO] | "Foul Against..." |
| `live.btn.counter_not_cut` | [OTRO] | "Uncut Counter..." |
| `live.btn.player_no_finish` | [OTRO] | "Unfinished Play..." |
| `live.btn.card_yellow_own` | [FRASE UI SIN TRADUCIR] | "Yellow Card (Own)..." |
| `live.btn.card_red_own` | [OTRO] | "Red Card (Own)..." |
| `live.btn.card_yellow_rival` | [FRASE UI SIN TRADUCIR] | "Yellow Card (Opponent)..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `test` (114 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `test.completedSuccess` | [FRASE UI SIN TRADUCIR] | "Test {name} completed successfully! ({pct}%)..." |
| `test.errorSaving` | [FRASE UI SIN TRADUCIR] | "Error saving test. Please try again...." |
| `test.question` | [OTRO] | "Question..." |
| `test.of` | [OTRO] | "of..." |
| `test.dimension` | [OTRO] | "Dimension..." |
| `test.previous` | [OTRO] | "Previous..." |
| `test.finishAndSend` | [FRASE UI SIN TRADUCIR] | "FINISH AND SUBMIT TO COACH..." |
| `test.tabTitle` | [FRASE UI SIN TRADUCIR] | "Tests & Self-Assessments..." |
| `test.tabSubtitle` | [FRASE UI SIN TRADUCIR] | "Complete these questionnaires from your mobile to boost mind..." |
| `test.questionsCount` | [FRASE UI SIN TRADUCIR] | "{count} questions..." |
| `test.lastResult` | [OTRO] | "Last result..." |
| `test.repeatTest` | [OTRO] | "Retake Test..." |
| `test.startTest` | [FRASE UI SIN TRADUCIR] | "Start Questionnaire..." |
| `test.initialEvaluationRegistered` | [FRASE UI SIN TRADUCIR] | "Initial evaluation recorded..." |
| `test.retakeTest` | [FRASE UI SIN TRADUCIR] | "Retake Questionnaire..." |
| *... y 99 claves adicionales en este namespace* | | |

#### Namespace: `admin` (31 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `admin.title` | [FORMATO FECHA/HORA/NÚMERO] | "Admin Dashboard..." |
| `admin.tab.equipos` | [OTRO] | "Teams..." |
| `admin.tab.club` | [OTRO] | "Club..." |
| `admin.tab.general` | [OTRO] | "General..." |
| `admin.tab.suscripcion` | [OTRO] | "Subscription..." |
| `admin.lang.title` | [OTRO] | "System Language..." |
| `admin.theme.dark` | [OTRO] | "Dark Mode..." |
| `admin.manageSubAndroidMsg` | [FRASE UI SIN TRADUCIR] | "Manage your subscription from mister11.app..." |
| `admin.account_deleted` | [FRASE UI SIN TRADUCIR] | "Your coach account and data have been deleted successfully...." |
| `admin.svg_shield_saved` | [FRASE UI SIN TRADUCIR] | "SVG vector shield saved successfully!..." |
| `admin.shield_saved` | [FRASE UI SIN TRADUCIR] | "Shield saved and optimized successfully!..." |
| `admin.shield_error` | [FRASE UI SIN TRADUCIR] | "Could not upload or process the image...." |
| `admin.profile_synced` | [FRASE UI SIN TRADUCIR] | "Coach profile synced across the entire system...." |
| `admin.profile_error` | [FRASE UI SIN TRADUCIR] | "Error saving profile...." |
| `admin.team_identity_error` | [FRASE UI SIN TRADUCIR] | "Error updating team identity...." |
| *... y 16 claves adicionales en este namespace* | | |

#### Namespace: `equipo` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `equipo.tab.squad` | [OTRO] | "Squad..." |
| `equipo.tab.attendance` | [OTRO] | "Attendance..." |
| `equipo.tab.staff` | [OTRO] | "Coaching Staff..." |
| `equipo.loadingSquad` | [FRASE UI SIN TRADUCIR] | "Loading squad......" |
| `equipo.publishAnnouncement` | [FRASE UI SIN TRADUCIR] | "Publish Announcement..." |

#### Namespace: `partidos` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `partidos.tab.analisis` | [OTRO] | "Analysis..." |

#### Namespace: `plan` (24 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plan.tab.macrociclo` | [OTRO] | "MACROCYCLE..." |
| `plan.tab.mesociclo` | [OTRO] | "MESOCYCLE..." |
| `plan.tab.microciclo` | [OTRO] | "MICROCYCLE..." |
| `plan.tab.objetivos` | [OTRO] | "OBJECTIVES..." |
| `plan.strategicPlanning` | [FRASE UI SIN TRADUCIR] | "STRATEGIC PLANNING..." |
| `plan.saving` | [OTRO] | "SAVING......" |
| `plan.dateRange` | [OTRO] | "DATE RANGE..." |
| `plan.start` | [OTRO] | "Start..." |
| `plan.end` | [OTRO] | "End..." |
| `plan.trainingDays` | [OTRO] | "TRAINING DAYS..." |
| `plan.fatigaWarning` | [FRASE UI SIN TRADUCIR] | "⚠️ Training on MD-1 — potential fatigue..." |
| `plan.reubicarBtn` | [FRASE UI SIN TRADUCIR] | "🔄 Reschedule training based on new day..." |
| `plan.category` | [SIGLA/ACRÓNIMO] | "CATEGORY..." |
| `plan.coach` | [SIGLA/ACRÓNIMO] | "COACH..." |
| `plan.seasonVolume` | [OTRO] | "SEASON VOLUME..." |
| *... y 9 claves adicionales en este namespace* | | |

#### Namespace: `sesiones` (26 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sesiones.tab.captures` | [OTRO] | "Captures..." |
| `sesiones.tab.animations` | [OTRO] | "Animations..." |
| `sesiones.fieldMode` | [OTRO] | "Field Mode..." |
| `sesiones.views.day` | [SIGLA/ACRÓNIMO] | "DAY..." |
| `sesiones.views.week` | [SIGLA/ACRÓNIMO] | "WEEK..." |
| `sesiones.views.month` | [SIGLA/ACRÓNIMO] | "MONTH..." |
| `sesiones.clickDayToView` | [FRASE UI SIN TRADUCIR] | "Click a day to view sessions..." |
| `sesiones.noDiagram` | [OTRO] | "No diagram..." |
| `sesiones.actions.share` | [OTRO] | "Share..." |
| `sesiones.blockCount.one` | [OTRO] | "{count} Block..." |
| `sesiones.blockCount.other` | [OTRO] | "{count} Blocks..." |
| `sesiones.categories.all` | [OTRO] | "All..." |
| `sesiones.categories.fisica` | [OTRO] | "Physical..." |
| `sesiones.categories.mixta` | [OTRO] | "Mixed..." |
| `sesiones.categories.general` | [OTRO] | "General..." |
| *... y 11 claves adicionales en este namespace* | | |

#### Namespace: `tests` (17 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `tests.tab.fisicos` | [OTRO] | "Fitness Tests..." |
| `tests.tab.psicosociales` | [OTRO] | "Psychosocial..." |
| `tests.tab.prevencion` | [FRASE UI SIN TRADUCIR] | "Health & Prevention..." |
| `tests.tab.historial` | [OTRO] | "History..." |
| `tests.tab.comparativa` | [OTRO] | "Comparison..." |
| `tests.resources.title` | [FRASE UI SIN TRADUCIR] | "Resources & Tools..." |
| `tests.resources.tacticalTest` | [OTRO] | "Tactical Test..." |
| `tests.resources.seasonReport` | [OTRO] | "Season Report..." |
| `tests.resources.myTeam` | [OTRO] | "My Squad..." |
| `tests.rpe.save` | [OTRO] | "SAVE RPE..." |
| `tests.createTest` | [OTRO] | "+ Create Test..." |
| `tests.success` | [OTRO] | "Success..." |
| `tests.error` | [OTRO] | "Error..." |
| `tests.confirm_season_reset` | [OTRO] | "Reset Season..." |
| `tests.attention` | [OTRO] | "⚠️ ATTENTION..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `player` (352 claves idénticas a EN)
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
| *... y 337 claves adicionales en este namespace* | | |

#### Namespace: `ach` (39 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ach.weekly_perfect_week.name` | [OTRO] | "Perfect Week..." |
| `ach.weekly_perfect_week.desc` | [FRASE UI SIN TRADUCIR] | "Attend 100% of the training sessions scheduled for this week..." |
| `ach.weekly_wellness.name` | [OTRO] | "Health Check-in..." |
| `ach.weekly_wellness.desc` | [FRASE UI SIN TRADUCIR] | "Record your sleep and soreness on training days...." |
| `ach.weekly_scholar.name` | [OTRO] | "Strong Mind..." |
| `ach.weekly_scholar.desc` | [FRASE UI SIN TRADUCIR] | "Complete at least 1 psychological test or evaluation in the ..." |
| `ach.weekly_committed.name` | [OTRO] | "Invisible Work..." |
| `ach.weekly_committed.desc` | [FRASE UI SIN TRADUCIR] | "Complete the assigned exercises from your individual plan...." |
| `ach.weekly_attentive.name` | [OTRO] | "Always Ready..." |
| `ach.weekly_attentive.desc` | [FRASE UI SIN TRADUCIR] | "Check match and training details before the call-up time...." |
| `ach.biweekly_iron.desc` | [FRASE UI SIN TRADUCIR] | "100% attendance during 14 consecutive days...." |
| `ach.biweekly_self_care.name` | [OTRO] | "Healthy Habit..." |
| `ach.biweekly_self_care.desc` | [FRASE UI SIN TRADUCIR] | "Submit your wellness check-in on at least 80% of days...." |
| `ach.biweekly_strong_mind.desc` | [FRASE UI SIN TRADUCIR] | "Complete 3 psychological tests on coping or mental toughness..." |
| `ach.biweekly_fit.name` | [FRASE UI SIN TRADUCIR] | "Physical Evolution..." |
| *... y 24 claves adicionales en este namespace* | | |

#### Namespace: `games` (191 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `games.intro.whatTitle` | [OTRO] | "What We Train..." |
| `games.intro.howTitle` | [OTRO] | "How to Play..." |
| `games.intro.whyTitle` | [FRASE UI SIN TRADUCIR] | "Why It Helps on the Pitch..." |
| `games.safety.title` | [OTRO] | "Safety at Home..." |
| `games.honesty.pact` | [FRASE UI SIN TRADUCIR] | "Honesty pact: record your real repetitions. The effort is yo..." |
| `games.btn.practiceFirst` | [FRASE UI SIN TRADUCIR] | "Try in Practice Mode..." |
| `games.disclaimer` | [FRASE UI SIN TRADUCIR] | "Support cognitive training, not therapy; follow specialist a..." |
| `games.finish.title` | [FRASE UI SIN TRADUCIR] | "Outstanding effort!..." |
| `games.finish.subtitle` | [FRASE UI SIN TRADUCIR] | "You have completed the session with dedication...." |
| `games.finish.healthyClosing` | [FRASE UI SIN TRADUCIR] | "Great mental work! Rest your eyes and body...." |
| `games.limits.title` | [FRASE UI SIN TRADUCIR] | "Healthy Training..." |
| `games.limits.available` | [OTRO] | "Available..." |
| `games.limits.completedToday` | [FRASE UI SIN TRADUCIR] | "Completed for today..." |
| `games.limits.minutesLbl` | [OTRO] | "Time played..." |
| `games.limits.lockedTitle` | [FRASE UI SIN TRADUCIR] | "Well done for today!..." |
| *... y 176 claves adicionales en este namespace* | | |

#### Namespace: `attendance` (22 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `attendance.chart.guide.title` | [FRASE UI SIN TRADUCIR] | "How to interpret this chart?..." |
| `attendance.chart.guide.step1` | [FRASE UI SIN TRADUCIR] | "1. Each point is a training or match: ordered chronologicall..." |
| `attendance.chart.guide.step2` | [FRASE UI SIN TRADUCIR] | "2. The green line is your attendance: above 70% you are on t..." |
| `attendance.chart.guide.step3` | [FRASE UI SIN TRADUCIR] | "3. If red rises while green drops: there is a commitment iss..." |
| `attendance.chart.guide.step4` | [FRASE UI SIN TRADUCIR] | "4. Tap any point to view details and open its register direc..." |
| `attendance.chart.guide.example` | [FRASE UI SIN TRADUCIR] | "Currently your team averages {avg}% attendance across {count..." |
| `attendance.chart.legend.attendance` | [FRASE UI SIN TRADUCIR] | "Actual Attendance (P+L)..." |
| `attendance.chart.legend.absent` | [OTRO] | "Absent..." |
| `attendance.chart.legend.absent.desc` | [FRASE UI SIN TRADUCIR] | "Unexcused absences. Should aim for zero...." |
| `attendance.chart.legend.late` | [OTRO] | "Late..." |
| `attendance.chart.legend.late.desc` | [FRASE UI SIN TRADUCIR] | "Late arrivals. Watch if it rises over several weeks...." |
| `attendance.chart.legend.justified` | [OTRO] | "Justified..." |
| `attendance.chart.legend.justified.desc` | [FRASE UI SIN TRADUCIR] | "Justified notices. Does not penalize the main %...." |
| `attendance.chart.legend.threshold70` | [FRASE UI SIN TRADUCIR] | "Alert threshold (70%): below this, callup risk...." |
| `attendance.chart.legend.official` | [FRASE UI SIN TRADUCIR] | "Official (closed sheet/session)..." |
| *... y 7 claves adicionales en este namespace* | | |

#### Namespace: `matches` (20 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matches.warnings.bannerTitle` | [FRASE UI SIN TRADUCIR] | "This match contained {count} isolated log anomalies or legac..." |
| `matches.warnings.showDetails` | [OTRO] | "View list..." |
| `matches.warnings.hideDetails` | [OTRO] | "Hide details..." |
| `matches.warnings.cleanseBtn` | [FRASE UI SIN TRADUCIR] | "Cleanse & Resolve..." |
| `matches.warnings.cleansing` | [OTRO] | "Resolving......" |
| `matches.warnings.resolvedSuccess` | [FRASE UI SIN TRADUCIR] | "✔ {count} anomaly/anomalies resolved and match sheet synchro..." |
| `matches.warnings.auditNote` | [FRASE UI SIN TRADUCIR] | "Log cleansed on {date}: {count} anomalies isolated and resol..." |
| `matches.warnings.auditShow` | [OTRO] | "View details..." |
| `matches.warnings.auditHide` | [OTRO] | "Hide audit..." |
| `matches.warnings.chipTooltip` | [FRASE UI SIN TRADUCIR] | "{count} anomalies detected in log (click to view and resolve..." |
| `matches.lineup.title` | [FRASE UI SIN TRADUCIR] | "Tactical Lineup & Bench..." |
| `matches.lineup.subtitle` | [FRASE UI SIN TRADUCIR] | "Tactical board with starting XI and substitutes bench..." |
| `matches.lineup.downloadPng` | [OTRO] | "DOWNLOAD PNG..." |
| `matches.lineup.exportingPng` | [OTRO] | "EXPORTING......" |
| `matches.lineup.benchTitle` | [FRASE UI SIN TRADUCIR] | "SUBSTITUTES BENCH..." |
| *... y 5 claves adicionales en este namespace* | | |

#### Namespace: `spell` (11 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `spell.title` | [FRASE UI SIN TRADUCIR] | "Spelling & Grammar..." |
| `spell.observations` | [FRASE UI SIN TRADUCIR] | "{count} spelling observation..." |
| `spell.observationsPlural` | [FRASE UI SIN TRADUCIR] | "{count} spelling observations..." |
| `spell.missingAccent` | [OTRO] | "Missing accent..." |
| `spell.typo` | [OTRO] | "Typo..." |
| `spell.unrecognized` | [FRASE UI SIN TRADUCIR] | "Unrecognized word..." |
| `spell.addToDictionary` | [FRASE UI SIN TRADUCIR] | "Add to dictionary..." |
| `spell.ignore` | [OTRO] | "Ignore..." |
| `spell.recommended` | [OTRO] | "Suggestions:..." |
| `spell.noSuggestions` | [FRASE UI SIN TRADUCIR] | "No direct suggestions..." |
| `spell.allCorrect` | [FRASE UI SIN TRADUCIR] | "No spelling issues..." |

#### Namespace: `analisis` (52 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `analisis.subtitle` | [FRASE UI SIN TRADUCIR] | "Tactical evolution, shots, duels and recoveries throughout t..." |
| `analisis.shortcuts.title` | [OTRO] | "SHORTCUTS:..." |
| `analisis.shortcuts.last3` | [OTRO] | "Last 3..." |
| `analisis.shortcuts.last5` | [OTRO] | "Last 5..." |
| `analisis.shortcuts.allSeason` | [OTRO] | "Whole Season..." |
| `analisis.mode.title` | [OTRO] | "Metrics:..." |
| `analisis.mode.averages` | [OTRO] | "Averages..." |
| `analisis.mode.totals` | [OTRO] | "Totals..." |
| `analisis.loadingData` | [FRASE UI SIN TRADUCIR] | "Loading match events......" |
| `analisis.noMatchesSelected` | [FRASE UI SIN TRADUCIR] | "Select at least 1 match to perform comparative analysis..." |
| `analisis.kpi.shots` | [OTRO] | "Shots on Target..." |
| `analisis.kpi.duels` | [OTRO] | "Duels Won..." |
| `analisis.kpi.recoveries` | [FRASE UI SIN TRADUCIR] | "Recoveries / Losses..." |
| `analisis.kpi.counters` | [FRASE UI SIN TRADUCIR] | "Counterattack Efficiency..." |
| `analisis.chart.trend` | [FRASE UI SIN TRADUCIR] | "Performance Evolution and Trend..." |
| *... y 37 claves adicionales en este namespace* | | |

#### Namespace: `ia` (90 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ia.title` | [OTRO] | "✨ AI Generator..." |
| `ia.subtitle` | [FRASE UI SIN TRADUCIR] | "Smart training session design..." |
| `ia.libraryBtn` | [FRASE UI SIN TRADUCIR] | "☁️ Library ({count})..." |
| `ia.modePrevention` | [FRASE UI SIN TRADUCIR] | "Prevention / Recovery..." |
| `ia.categoryAge` | [OTRO] | "Category / Age..." |
| `ia.selectPlaceholder` | [OTRO] | "Select......" |
| `ia.mainObjective` | [OTRO] | "Main Objective..." |
| `ia.materials` | [OTRO] | "Materials..." |
| `ia.space` | [OTRO] | "Pitch Area..." |
| `ia.tacticalRef` | [FRASE UI SIN TRADUCIR] | "Tactical Reference (Optional)..." |
| `ia.noRef` | [OTRO] | "No Ref...." |
| `ia.capture` | [OTRO] | "Capture..." |
| `ia.animation` | [FRASE UI SIN TRADUCIR] | "Animation ({count}F)..." |
| `ia.tacticalBoard` | [OTRO] | "🎬 Board..." |
| `ia.additionalObs` | [FRASE UI SIN TRADUCIR] | "Additional observations..." |
| *... y 75 claves adicionales en este namespace* | | |

#### Namespace: `board` (119 claves idénticas a EN)
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
| `board.toolbar.clearCanvas` | [FRASE UI SIN TRADUCIR] | "Clear entire canvas..." |
| `board.toolbar.new` | [SIGLA/ACRÓNIMO] | "NEW..." |
| `board.toolbar.exportMp4` | [OTRO] | "EXPORT MP4..." |
| `board.toolbar.exportingMp4` | [FRASE UI SIN TRADUCIR] | "REC... EXPORTING MP4..." |
| `board.export.encodingTitle` | [FRASE UI SIN TRADUCIR] | "Exporting MP4 Video..." |
| *... y 104 claves adicionales en este namespace* | | |

#### Namespace: `team` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `team.squadCount.one` | [FRASE UI SIN TRADUCIR] | "{count} player in squad..." |
| `team.squadCount.other` | [FRASE UI SIN TRADUCIR] | "{count} players in squad..." |

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

#### Namespace: `health` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `health.active` | [OTRO] | "Active..." |
| `health.resolved` | [OTRO] | "Recovered..." |
| `health.addInjury` | [OTRO] | "+ Record Injury..." |
| `health.title` | [FRASE UI SIN TRADUCIR] | "Medical History & Injuries..." |
| `health.noInjuries` | [FRASE UI SIN TRADUCIR] | "No injuries recorded...." |

#### Namespace: `plans` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plans.routinesAndPrevention` | [FRASE UI SIN TRADUCIR] | "Routines & Prevention..." |
| `plans.loadingPlans` | [FRASE UI SIN TRADUCIR] | "Loading plans......" |
| `plans.noPlansAssigned` | [FRASE UI SIN TRADUCIR] | "The player has no assigned plans...." |
| `plans.badgeTeam` | [SIGLA/ACRÓNIMO] | "TEAM..." |
| `plans.badgeIndividual` | [OTRO] | "INDIVIDUAL..." |
| `plans.streakDays.one` | [FRASE UI SIN TRADUCIR] | "Streak: {count} day..." |
| `plans.streakDays.other` | [FRASE UI SIN TRADUCIR] | "Streak: {count} days..." |
| `plans.sharePlan` | [OTRO] | "🔗 Share Plan..." |
| `plans.coachFeedback` | [FRASE UI SIN TRADUCIR] | "Coach Instructions..." |

#### Namespace: `staff` (38 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staff.shareCodeDesc` | [FRASE UI SIN TRADUCIR] | "Share this code so players or parents can join from the Port..." |
| `staff.copyCode` | [OTRO] | "Copy Code..." |
| `staff.copied` | [OTRO] | "Copied!..." |
| `staff.shareLink` | [OTRO] | "Share Link..." |
| `staff.staffTitle` | [FRASE UI SIN TRADUCIR] | "Coaching Staff & Collaborators..." |
| `staff.inviteStaffBtn` | [FRASE UI SIN TRADUCIR] | "Invite Staff ({count}/{limit})..." |
| `staff.you` | [OTRO] | "(You)..." |
| `staff.changeRole` | [OTRO] | "Change Role:..." |
| `staff.role.headCoach` | [OTRO] | "Head Coach..." |
| `staff.role.goalkeeperCoach` | [FRASE UI SIN TRADUCIR] | "Goalkeeper Coach..." |
| `staff.role.analyst` | [FRASE UI SIN TRADUCIR] | "Tactical Analyst..." |
| `staff.role.scout` | [OTRO] | "Scout..." |
| `staff.role.coordinator` | [FRASE UI SIN TRADUCIR] | "Academy Director..." |
| `staff.role.collaborator` | [FRASE UI SIN TRADUCIR] | "Staff Collaborator..." |
| `staff.remove` | [OTRO] | "Remove..." |
| *... y 23 claves adicionales en este namespace* | | |

#### Namespace: `wellness` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `wellness.rpe.title` | [FRASE UI SIN TRADUCIR] | "Rate of Perceived Exertion (RPE)..." |
| `wellness.rpe.desc` | [FRASE UI SIN TRADUCIR] | "Record how {name} perceived the effort...." |
| `wellness.rpe.levelLabel` | [FRASE UI SIN TRADUCIR] | "Exertion Level (RPE 1-10)..." |
| `wellness.rpe.scaleMin` | [OTRO] | "1 - Very light..." |
| `wellness.rpe.scaleMax` | [FRASE UI SIN TRADUCIR] | "10 - Maximum effort..." |
| `wellness.rpe.trainingLoad` | [FRASE UI SIN TRADUCIR] | "Training Load (RPE × Duration):..." |
| `wellness.rpe.save` | [OTRO] | "SAVE RPE..." |

#### Namespace: `cognitive` (40 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `cognitive.supervision_title` | [FRASE UI SIN TRADUCIR] | "Cognitive Supervision & Home Challenges..." |
| `cognitive.week_sessions` | [FRASE UI SIN TRADUCIR] | "Current week · {count} recorded sessions..." |
| `cognitive.btn_verified` | [FRASE UI SIN TRADUCIR] | "✔ Verified (+5 XP)..." |
| `cognitive.btn_verifying` | [OTRO] | "Verifying…..." |
| `cognitive.btn_recommend_challenge` | [FRASE UI SIN TRADUCIR] | "Recommend Challenge..." |
| `cognitive.metric_median_reaction` | [OTRO] | "Median reaction..." |
| `cognitive.metric_avg_accuracy` | [FRASE UI SIN TRADUCIR] | "Average accuracy..." |
| `cognitive.metric_trend` | [OTRO] | "Trend..." |
| `cognitive.trend_improving` | [OTRO] | "↑ Improving..." |
| `cognitive.trend_stable` | [OTRO] | "= Stable..." |
| `cognitive.level_by_game_title` | [FRASE UI SIN TRADUCIR] | "Level per Game (Adaptive Merit)..." |
| `cognitive.category_label` | [OTRO] | "Category: {cat}..." |
| `cognitive.active_challenges_title` | [FRASE UI SIN TRADUCIR] | "Active Recommended Challenges & Games ({count}):..." |
| `cognitive.target_team` | [OTRO] | "Entire team..." |
| `cognitive.target_player` | [OTRO] | "Individual..." |
| *... y 25 claves adicionales en este namespace* | | |

#### Namespace: `header` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `header.logoutConfirm` | [FRASE UI SIN TRADUCIR] | "Do you want to log out or switch accounts?..." |

#### Namespace: `status` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `status.none` | [OTRO] | "Not Selected..." |

#### Namespace: `placeholder` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `placeholder.teamName` | [FRASE UI SIN TRADUCIR] | "e.g. Manchester Youth A..." |

#### Namespace: `app` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `app.slogan` | [FRASE UI SIN TRADUCIR] | "The bench in your pocket..." |
| `app.copyright` | [NOMBRE PROPIO/MARCA] | "2026 Mister11 · {slogan}..." |

#### Namespace: `install` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `install.title` | [FRASE UI SIN TRADUCIR] | "Install Mister 11..." |
| `install.slogan` | [FRASE UI SIN TRADUCIR] | "The bench in your pocket..." |
| `install.alreadyInstalled` | [FRASE UI SIN TRADUCIR] | "The App is already installed on your device!..." |
| `install.instructions` | [OTRO] | "Instructions:..." |
| `install.androidTitle` | [NOMBRE PROPIO/MARCA] | "Android (Chrome):..." |
| `install.androidDesc` | [FRASE UI SIN TRADUCIR] | "Tap the "Install now" button below or open the three dots me..." |
| `install.iosTitle` | [OTRO] | "iOS (Safari):..." |
| `install.iosDesc` | [FRASE UI SIN TRADUCIR] | "Tap the "Share" button (square with arrow) and select "Add t..." |
| `install.btnInstall` | [OTRO] | "Install now..." |
| `install.fallbackNotice` | [FRASE UI SIN TRADUCIR] | "If you do not see the install button, use the "Add to Home S..." |
| `install.metaTitle` | [FRASE UI SIN TRADUCIR] | "Install Mister11 — The Football App for Coaches..." |
| `install.metaDesc` | [FRASE UI SIN TRADUCIR] | "Step-by-step installation instructions for Mister11 PWA on A..." |

#### Namespace: `consent` (50 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `consent.heading` | [FRASE UI SIN TRADUCIR] | "Digital Parental Consent..." |
| `consent.subTitle` | [FRASE UI SIN TRADUCIR] | "Informed authorization for the sports management of the unde..." |
| `consent.detailsTitle` | [OTRO] | "Consent Details..." |
| `consent.instructions` | [FRASE UI SIN TRADUCIR] | "Fill in the required information. Fields marked with (*) are..." |
| `consent.sec1` | [FRASE UI SIN TRADUCIR] | "1. Parent or Legal Guardian Details..." |
| `consent.parentNameLabel` | [OTRO] | "Guardian Name *..." |
| `consent.parentNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.parentDniLabel` | [FRASE UI SIN TRADUCIR] | "ID / NIE / Passport *..." |
| `consent.parentDniPlaceholder` | [OTRO] | "e.g. 12345678Z..." |
| `consent.relationLabel` | [OTRO] | "Relationship *..." |
| `consent.relationFather` | [OTRO] | "Father..." |
| `consent.relationMother` | [OTRO] | "Mother..." |
| `consent.relationGuardian` | [FRASE UI SIN TRADUCIR] | "Legal Guardian / Representative..." |
| `consent.parentPhoneLabel` | [OTRO] | "Contact Phone..." |
| `consent.parentPhonePlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. +34 600 000 000..." |
| *... y 35 claves adicionales en este namespace* | | |

#### Namespace: `download` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `download.saved_in` | [FRASE UI SIN TRADUCIR] | "✅ Saved in: {path}..." |
| `download.cache_hint` | [FRASE UI SIN TRADUCIR] | "Saved to cache. If it does not open, look for "{filename}" i..." |
| `download.pdf_ready` | [NOMBRE PROPIO/MARCA] | "✅ PDF ready: "{filename}"..." |
| `download.pdf_error` | [NOMBRE PROPIO/MARCA] | "Error saving PDF..." |
| `download.json_success` | [FRASE UI SIN TRADUCIR] | "✅ File exported successfully...." |
| `download.image_success` | [FRASE UI SIN TRADUCIR] | "✅ Image exported successfully...." |
| `download.csv_success` | [FRASE UI SIN TRADUCIR] | "✅ Template exported successfully...." |
| `download.video_success` | [FRASE UI SIN TRADUCIR] | "✅ Animation exported successfully...." |
| `download.lineup_saved` | [FRASE UI SIN TRADUCIR] | "✅ Lineup saved to {path}..." |
| `download.lineup_downloading` | [FRASE UI SIN TRADUCIR] | "⬇️ Downloading lineup: {filename}..." |
| `download.save_error_share_fallback` | [FRASE UI SIN TRADUCIR] | "⚠️ Could not save file automatically; please use Share...." |
| `download.lineup_share_title` | [NOMBRE PROPIO/MARCA] | "Mister11 — Lineup {team}..." |
| `download.generic_error` | [FRASE UI SIN TRADUCIR] | "Error exporting lineup..." |

#### Namespace: `push` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `push.foreground_toast` | [FRASE UI SIN TRADUCIR] | "🔔 {title}: {body}..." |

#### Namespace: `achievements` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `achievements.toast_unlocked` | [FRASE UI SIN TRADUCIR] | "🏆 Achievement unlocked: {name}! (+{xp} XP)..." |

#### Namespace: `chat` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `chat.notif_from_player` | [FRASE UI SIN TRADUCIR] | "💬 Message from {playerName}: "{msgText}"..." |

#### Namespace: `matchSheet` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matchSheet.prefill_smart_error` | [FRASE UI SIN TRADUCIR] | "❌ Error in smart pre-filling...." |
| `matchSheet.prefill_rsvp_empty` | [FRASE UI SIN TRADUCIR] | "No pending RSVP responses to pre-fill...." |
| `matchSheet.prefill_rsvp_success` | [FRASE UI SIN TRADUCIR] | "✅ Statuses pre-filled from RSVP...." |
| `matchSheet.prefill_rsvp_error` | [FRASE UI SIN TRADUCIR] | "❌ Error pre-filling from RSVP...." |
| `matchSheet.tactical_grade_saved` | [FRASE UI SIN TRADUCIR] | "⭐ Tactical rating saved..." |
| `matchSheet.log_already_clean` | [FRASE UI SIN TRADUCIR] | "✨ The match log is already clean. Zero impossible events...." |
| `matchSheet.anomalies_resolved` | [FRASE UI SIN TRADUCIR] | "✔ {count} anomaly(ies) resolved and sheet synchronized...." |
| `matchSheet.log_debug_error` | [FRASE UI SIN TRADUCIR] | "❌ Error debugging log...." |
| `matchSheet.close_error` | [FRASE UI SIN TRADUCIR] | "❌ Error closing match sheet. Please try again...." |
| `matchSheet.reopen_error` | [FRASE UI SIN TRADUCIR] | "❌ Error reopening match sheet...." |
| `matchSheet.confirm_save_btn` | [FRASE UI SIN TRADUCIR] | "💾 CONFIRM & SAVE SHEET..." |
| `matchSheet.saving` | [OTRO] | "💾 Saving......" |
| `matchSheet.manual_override_title` | [FORMATO FECHA/HORA/NÚMERO] | "Manual minutes override..." |
| `matchSheet.manual_allowed_closed` | [FRASE UI SIN TRADUCIR] | "allowed even when closed..." |
| `matchSheet.manual_badge` | [OTRO] | "Manual..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `teamMembers` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamMembers.already_member` | [FRASE UI SIN TRADUCIR] | "This user is already a member of the coaching staff...." |
| `teamMembers.invite_generated` | [FRASE UI SIN TRADUCIR] | "Invitation link and code generated successfully...." |
| `teamMembers.role_updated` | [FRASE UI SIN TRADUCIR] | "Role updated to {role}...." |
| `teamMembers.admin_only_remove` | [FRASE UI SIN TRADUCIR] | "Only the Head Coach (Admin) can remove team members...." |
| `teamMembers.member_removed` | [FRASE UI SIN TRADUCIR] | "Member removed from coaching staff...." |
| `teamMembers.invite_cancelled` | [FRASE UI SIN TRADUCIR] | "Invitation cancelled...." |

#### Namespace: `club` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `club.teams_assigned` | [FRASE UI SIN TRADUCIR] | "Teams assigned successfully...." |
| `club.teams_assign_error` | [FRASE UI SIN TRADUCIR] | "Error assigning teams...." |
| `club.team_created` | [FRASE UI SIN TRADUCIR] | "Club team created successfully...." |
| `club.team_create_error` | [FRASE UI SIN TRADUCIR] | "Error creating club team...." |

#### Namespace: `invite` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `invite.already_registered` | [FRASE UI SIN TRADUCIR] | "This email is already registered or invited to the club...." |
| `invite.generated_success` | [FRASE UI SIN TRADUCIR] | "Invitation generated successfully...." |
| `invite.generated_error` | [FRASE UI SIN TRADUCIR] | "Error generating the invitation...." |
| `invite.link_copied` | [OTRO] | "Link copied!..." |
| `invite.coach.title` | [FRASE UI SIN TRADUCIR] | "Join as Coach / Staff..." |
| `invite.coach.codePlaceholder` | [FRASE UI SIN TRADUCIR] | "Invitation code (6 characters)..." |
| `invite.coach.scanQR` | [FRASE UI SIN TRADUCIR] | "Scan invitation QR..." |
| `invite.player.scanQR` | [OTRO] | "Scan team QR..." |

#### Namespace: `livestats` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `livestats.select_player_first` | [FRASE UI SIN TRADUCIR] | "👆 Select a player first..." |
| `livestats.post_match_saved` | [FRASE UI SIN TRADUCIR] | "✅ Post-match counters saved..." |

#### Namespace: `playerDashboard` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerDashboard.new_message` | [FRASE UI SIN TRADUCIR] | "💬 New message from Coach:..." |

#### Namespace: `joinTeam` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `joinTeam.request_approved` | [FRASE UI SIN TRADUCIR] | "Your request has been approved!..." |
| `joinTeam.already_member` | [FRASE UI SIN TRADUCIR] | "You are already on this team! Loading your portal......" |
| `joinTeam.google_sign_in` | [NOMBRE PROPIO/MARCA] | "Signed in with Google..." |
| `joinTeam.account_created` | [FRASE UI SIN TRADUCIR] | "Account created successfully..." |
| `joinTeam.welcome` | [FRASE UI SIN TRADUCIR] | "Welcome to Míster11..." |
| `joinTeam.request_sent` | [FRASE UI SIN TRADUCIR] | "Request sent to the coach!..." |

#### Namespace: `login` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `login.cancelled` | [FRASE UI SIN TRADUCIR] | "Sign-in cancelled by user..." |
| `login.account_created` | [FRASE UI SIN TRADUCIR] | "Account created successfully!..." |
| `login.welcome` | [FRASE UI SIN TRADUCIR] | "Welcome to Míster11!..." |
| `login.write_email_first` | [FRASE UI SIN TRADUCIR] | "Please enter your email first..." |
| `login.recovery_sent` | [FRASE UI SIN TRADUCIR] | "Recovery link sent to your email..." |
| `login.recovery_error` | [FRASE UI SIN TRADUCIR] | "Error sending email..." |

#### Namespace: `planning` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `planning.login_required` | [OTRO] | "Sign in to save..." |
| `planning.saved` | [FRASE UI SIN TRADUCIR] | "Planning saved ✓..." |
| `planning.save_error` | [OTRO] | "Error saving...." |
| `planning.generating_pdf` | [NOMBRE PROPIO/MARCA] | "Generating mesocycle PDF......" |
| `planning.pdf_month_not_found` | [FRASE UI SIN TRADUCIR] | "Error: Month information not found...." |
| `planning.pdf_success` | [FRASE UI SIN TRADUCIR] | "Mesocycle PDF generated successfully ✓..." |
| `planning.pdf_error` | [NOMBRE PROPIO/MARCA] | "Error exporting PDF...." |
| `planning.generating_pdf_generic` | [NOMBRE PROPIO/MARCA] | "Generating PDF......" |
| `planning.pdf_exported` | [NOMBRE PROPIO/MARCA] | "PDF exported ✓..." |

#### Namespace: `gk` (33 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `gk.title` | [FRASE UI SIN TRADUCIR] | "Goalkeeper Metrics..." |
| `gk.roleBadge` | [OTRO] | "🧤 Goalkeeper..." |
| `gk.activeGoalkeeper` | [FRASE UI SIN TRADUCIR] | "GOALKEEPER ON PITCH..." |
| `gk.noActiveGoalkeeper` | [FRASE UI SIN TRADUCIR] | "No active goalkeeper on pitch..." |
| `gk.saves` | [OTRO] | "Saves..." |
| `gk.savesShort` | [OTRO] | "Saves..." |
| `gk.conceded` | [OTRO] | "Goals Conceded..." |
| `gk.concededShort` | [OTRO] | "Conc...." |
| `gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `gk.cleanSheetsShort` | [OTRO] | "Clean Sh...." |
| `gk.penaltySaves` | [OTRO] | "Penalties Saved..." |
| `gk.penaltySavesShort` | [OTRO] | "Pen. Saved..." |
| `gk.claims` | [FRASE UI SIN TRADUCIR] | "Claims & Punches..." |
| `gk.claimsShort` | [OTRO] | "Claims..." |
| `gk.errorGoal` | [FRASE UI SIN TRADUCIR] | "Errors Leading to Goal..." |
| *... y 18 claves adicionales en este namespace* | | |

#### Namespace: `exports` (32 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exports.gk.title` | [FRASE UI SIN TRADUCIR] | "GOALKEEPING PERFORMANCE..." |
| `exports.gk.saves` | [OTRO] | "Saves..." |
| `exports.gk.conceded` | [OTRO] | "Conceded..." |
| `exports.gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `exports.gk.penaltySaves` | [OTRO] | "Pen. Saved..." |
| `exports.gk.claims` | [FRASE UI SIN TRADUCIR] | "Claims / Punches..." |
| `exports.gk.errors` | [OTRO] | "Errors..." |
| `exports.gk.rating` | [OTRO] | "GK Rating..." |
| `exports.report.title` | [FRASE UI SIN TRADUCIR] | "OFFICIAL POST-MATCH REPORT..." |
| `exports.report.sec1_lineup` | [FRASE UI SIN TRADUCIR] | "1. Tactical Lineup with Photos..." |
| `exports.report.sec2_timeline` | [FRASE UI SIN TRADUCIR] | "2. Score & Event Timeline..." |
| `exports.report.sec3_momentum` | [FRASE UI SIN TRADUCIR] | "3. Momentum & 15-Minute Possession Blocks..." |
| `exports.report.sec4_bars` | [FRASE UI SIN TRADUCIR] | "4. Comparative Bars (10 Metrics)..." |
| `exports.report.sec5_radar` | [FRASE UI SIN TRADUCIR] | "5. Normalized Comparative Radar (Own vs Opponent)..." |
| `exports.report.sec6_top5` | [FRASE UI SIN TRADUCIR] | "6. Top-5 Differential KPIs..." |
| *... y 17 claves adicionales en este namespace* | | |

#### Namespace: `shot` (32 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `shot.title` | [FRASE UI SIN TRADUCIR] | "Record Shot with Context..." |
| `shot.team_own` | [OTRO] | "Own..." |
| `shot.team_rival` | [OTRO] | "Opponent..." |
| `shot.zone` | [OTRO] | "Shot Zone..." |
| `shot.zone_inside_center` | [OTRO] | "Center (Box)..." |
| `shot.zone_inside_left` | [OTRO] | "Left Wing (Box)..." |
| `shot.zone_inside_right` | [FRASE UI SIN TRADUCIR] | "Right Wing (Box)..." |
| `shot.zone_outside_center` | [FRASE UI SIN TRADUCIR] | "Center (Outside)..." |
| `shot.zone_outside_left` | [FRASE UI SIN TRADUCIR] | "Left Wing (Outside)..." |
| `shot.zone_outside_right` | [FRASE UI SIN TRADUCIR] | "Right Wing (Outside)..." |
| `shot.zone_penalty` | [OTRO] | "Penalty Spot..." |
| `shot.playType` | [OTRO] | "Play Type..." |
| `shot.playType_jugada` | [OTRO] | "Open Play..." |
| `shot.playType_contra` | [OTRO] | "Counter Attack..." |
| `shot.playType_balon_parado` | [OTRO] | "Set Piece..." |
| *... y 17 claves adicionales en este namespace* | | |

#### Namespace: `liveStats` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `liveStats.quickMode.title` | [OTRO] | "Quick Mode..." |
| `liveStats.quickMode.advanced` | [FRASE UI SIN TRADUCIR] | "Advanced options..." |
| `liveStats.quickMode.simple` | [OTRO] | "Simple mode..." |
| `liveStats.quickMode.shotSaved` | [OTRO] | "Shot recorded..." |
| `liveStats.quickMode.undo` | [OTRO] | "Undo..." |
| `liveStats.quickMode.undone` | [OTRO] | "Shot undone..." |

#### Namespace: `rendimientoPdf` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `rendimientoPdf.title` | [FRASE UI SIN TRADUCIR] | "INDIVIDUAL PERFORMANCE REPORT..." |
| `rendimientoPdf.subtitle` | [FRASE UI SIN TRADUCIR] | "Individual player statistics and canonical metrics..." |
| `rendimientoPdf.generatedBy` | [NOMBRE PROPIO/MARCA] | "Generated by Mister11..." |
| `rendimientoPdf.tableTitle` | [FRASE UI SIN TRADUCIR] | "Complete Performance Table..." |

#### Namespace: `xg` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `xg.title` | [FRASE UI SIN TRADUCIR] | "xG-Lite Model & Exposure..." |
| `xg.own_xg` | [OTRO] | "Own xG..." |
| `xg.rival_xg` | [OTRO] | "Opponent xG..." |
| `xg.gk_exertion` | [FRASE UI SIN TRADUCIR] | "GK Exertion Index..." |
| `xg.normal_match` | [FRASE UI SIN TRADUCIR] | "Controlled Exertion..." |
| `xg.rival_comfort` | [FRASE UI SIN TRADUCIR] | "Opponent Comfort..." |
| `xg.exposure_map` | [FRASE UI SIN TRADUCIR] | "Defensive Exposure Map..." |
| `xg.box_center` | [OTRO] | "Central Box..." |
| `xg.box_wings` | [OTRO] | "Lateral Box..." |
| `xg.outside_box` | [OTRO] | "Outside Box..." |
| `xg.penalty_box` | [OTRO] | "Penalty..." |
| `xg.decisive_saves` | [OTRO] | "Decisive Saves..." |
| `xg.normal_saves` | [OTRO] | "Normal Saves..." |
| `xg.total_saves` | [OTRO] | "Total Saves..." |
| `xg.decisive_pct` | [FORMATO FECHA/HORA/NÚMERO] | "Decisive Success %..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `swot` (26 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `swot.title` | [FRASE UI SIN TRADUCIR] | "Traceable SWOT Matrix..." |
| `swot.strengths` | [OTRO] | "Strengths..." |
| `swot.weaknesses` | [OTRO] | "Weaknesses..." |
| `swot.opportunities` | [OTRO] | "Opportunities..." |
| `swot.threats` | [OTRO] | "Threats..." |
| `swot.origin_metric` | [OTRO] | "Origin metric..." |
| `swot.add_manual` | [FRASE UI SIN TRADUCIR] | "Add manual observation..." |
| `swot.manual_badge` | [OTRO] | "Manual..." |
| `swot.auto_badge` | [OTRO] | "Rule..." |
| `swot.btn_generate_ai` | [FRASE UI SIN TRADUCIR] | "Draft summary with AI..." |
| `swot.generating_ai` | [FRASE UI SIN TRADUCIR] | "Drafting with AI......" |
| `swot.ai_summary_title` | [FRASE UI SIN TRADUCIR] | "Tactical Summary (AI)..." |
| `swot.no_items` | [FRASE UI SIN TRADUCIR] | "No observations recorded for this quadrant...." |
| `swot.rule.high_xg_diff` | [FRASE UI SIN TRADUCIR] | "High attacking creation volume outperforming opponent in cle..." |
| `swot.rule.low_xg_conv` | [FRASE UI SIN TRADUCIR] | "Chances created with low conversion rate, requiring finishin..." |
| *... y 11 claves adicionales en este namespace* | | |

#### Namespace: `capture` (17 claves idénticas a EN)
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
| `capture.criteria.title` | [FRASE UI SIN TRADUCIR] | "Capture Criteria Manual..." |
| `capture.refine_title` | [FRASE UI SIN TRADUCIR] | "Refine individual attribution (optional)..." |
| `capture.refine_empty` | [FRASE UI SIN TRADUCIR] | "Nothing pending ✅..." |
| `capture.refine_skip` | [OTRO] | "Skip..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `sector` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sector.activeZone` | [FRASE UI SIN TRADUCIR] | "Active Zone: {zone}..." |

#### Namespace: `match` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `match.status.finalizado` | [SIGLA/ACRÓNIMO] | "FINISHED..." |
| `match.status.en_edicion` | [OTRO] | "IN EDITING..." |
| `match.status.pendiente` | [SIGLA/ACRÓNIMO] | "PENDING..." |
| `match.status.no_disputado` | [OTRO] | "NOT PLAYED..." |
| `match.sort.label` | [OTRO] | "Sort by..." |
| `match.sort.cercania` | [FRASE UI SIN TRADUCIR] | "Closest to today..." |
| `match.sort.lejania` | [FRASE UI SIN TRADUCIR] | "Farthest from today..." |
| `match.sort.fecha_asc` | [FORMATO FECHA/HORA/NÚMERO] | "Date (Upcoming)..." |
| `match.sort.fecha_desc` | [OTRO] | "Date (Recent)..." |
| `match.sort.estado` | [FRASE UI SIN TRADUCIR] | "By Status / Priority..." |
| `match.view.cards` | [OTRO] | "Cards..." |
| `match.view.detailed` | [OTRO] | "Detailed..." |

#### Namespace: `stats` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `stats.eventMap.title` | [OTRO] | "Zone Event Map..." |
| `stats.eventMap.guide` | [FRASE UI SIN TRADUCIR] | "Spatial distribution of team actions (recoveries, duels, sho..." |
| `stats.eventMap.pass_insufficient` | [FRASE UI SIN TRADUCIR] | "Pass network unavailable: At least 5 recorded passes are req..." |
| `stats.passNetwork.guide` | [FRASE UI SIN TRADUCIR] | "Each node represents a player's average position and line th..." |
| `stats.theater.theater_mode` | [OTRO] | "Theater Mode..." |
| `stats.theater.fullscreen` | [OTRO] | "Fullscreen..." |
| `stats.theater.exit_fullscreen` | [OTRO] | "Exit Fullscreen..." |

#### Namespace: `error` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `error.section_unavailable` | [FRASE UI SIN TRADUCIR] | "Section temporarily unavailable..." |
| `error.section_desc` | [FRASE UI SIN TRADUCIR] | "An isolated anomaly occurred while rendering this section. T..." |
| `error.retry_section` | [OTRO] | "Retry..." |
| `error.section_code` | [OTRO] | "Code: {code}..." |

#### Namespace: `charts` (11 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `charts.guide.radar` | [FRASE UI SIN TRADUCIR] | "Visualizes tactical balance across 6 dimensions between own ..." |
| `charts.guide.bars` | [FRASE UI SIN TRADUCIR] | "Quantitative comparison of the 10 key gameplay metrics...." |
| `charts.guide.momentum` | [FRASE UI SIN TRADUCIR] | "Evolution of match dominance and control in 15-minute interv..." |
| `charts.guide.shots` | [FRASE UI SIN TRADUCIR] | "Shot distribution and expected goals (xG) probability model...." |
| `charts.guide.zones` | [FRASE UI SIN TRADUCIR] | "Territorial distribution of team interventions across 9 pitc..." |
| `charts.insights.finishing_deficit` | [FRASE UI SIN TRADUCIR] | "Finishing Efficiency: High volume of scoring chances with de..." |
| `charts.insights.defensive_alert` | [FRASE UI SIN TRADUCIR] | "Defensive Alert: Opponent generated clear chances with high ..." |
| `charts.insights.dominant_zone` | [FRASE UI SIN TRADUCIR] | "Dominant Zone: Over 40% of actions concentrated in this area..." |
| `charts.pass_insufficient_tooltip` | [FRASE UI SIN TRADUCIR] | "At least 5 recorded passes required to generate tactical pas..." |
| `charts.view.pass_network` | [OTRO] | "Pass Network..." |
| `charts.view.territorial_map` | [OTRO] | "Territorial Map..." |

#### Namespace: `pricing` (59 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pricing.header.title` | [FRASE UI SIN TRADUCIR] | "Transparent Pricing for Coaches & Academies..." |
| `pricing.header.subtitle` | [FRASE UI SIN TRADUCIR] | "All prices include VAT. Annual season pass grants 10 full mo..." |
| `pricing.billing.season` | [FRASE UI SIN TRADUCIR] | "Full Season Pass (10 Months)..." |
| `pricing.billing.discountBadge` | [OTRO] | "2 MONTHS FREE..." |
| `pricing.billing.monthly` | [OTRO] | "Monthly..." |
| `pricing.plan.free.name` | [OTRO] | "Free Plan..." |
| `pricing.plan.free.tagline` | [FRASE UI SIN TRADUCIR] | "To start digitizing your team..." |
| `pricing.plan.pro.name` | [OTRO] | "PRO Plan..." |
| `pricing.plan.pro.tagline` | [FRASE UI SIN TRADUCIR] | "For the coach seeking maximum performance..." |
| `pricing.plan.clubStarter.name` | [OTRO] | "Club Starter..." |
| `pricing.plan.clubStarter.tagline` | [FRASE UI SIN TRADUCIR] | "For growing academies and clubs..." |
| `pricing.plan.clubPro.name` | [OTRO] | "Club PRO..." |
| `pricing.plan.clubPro.tagline` | [FRASE UI SIN TRADUCIR] | "For structured clubs with their own methodology..." |
| `pricing.plan.clubPremium.name` | [OTRO] | "Club Premium..." |
| `pricing.plan.clubPremium.tagline` | [FRASE UI SIN TRADUCIR] | "For high-performance multi-site academies..." |
| *... y 44 claves adicionales en este namespace* | | |

#### Namespace: `staffHeredado` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffHeredado.badgeActive` | [FRASE UI SIN TRADUCIR] | "PRO features active via {ownerName}'s plan..." |
| `staffHeredado.badgeActiveShort` | [FRASE UI SIN TRADUCIR] | "Inherited Plan ({ownerName})..." |
| `staffHeredado.gracePeriodBanner` | [FRASE UI SIN TRADUCIR] | "Subscription Notice: The owner's plan has changed. The team ..." |
| `staffHeredado.gracePeriodBlocked` | [FRASE UI SIN TRADUCIR] | "Restricted Access: The team grace period has expired. The ow..." |
| `staffHeredado.transferLimitExceeded` | [FRASE UI SIN TRADUCIR] | "This user already owns a team on their Free plan. They must ..." |
| `staffHeredado.transferError` | [FRASE UI SIN TRADUCIR] | "Error transferring team ownership...." |
| `staffHeredado.restrictedFeatureStaff` | [FRASE UI SIN TRADUCIR] | "This feature requires the team to have an active PRO plan fr..." |

#### Namespace: `playerProfile` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerProfile.physicalStats` | [OTRO] | "Physical Stats..." |
| `playerProfile.heightLabel` | [OTRO] | "Height..." |
| `playerProfile.weightLabel` | [OTRO] | "Weight..." |
| `playerProfile.ageLabel` | [OTRO] | "Age..." |
| `playerProfile.heightUnit` | [OTRO] | "cm..." |
| `playerProfile.weightUnit` | [OTRO] | "kg..." |
| `playerProfile.heightRangeError` | [FRASE UI SIN TRADUCIR] | "Height must be between 100 and 230 cm...." |
| `playerProfile.weightRangeError` | [FRASE UI SIN TRADUCIR] | "Weight must be between 30 and 150 kg...." |
| `playerProfile.statsSaved` | [FRASE UI SIN TRADUCIR] | "Physical stats updated successfully...." |
| `playerProfile.saveError` | [FRASE UI SIN TRADUCIR] | "Error saving physical stats...." |
| `playerProfile.bmi` | [SIGLA/ACRÓNIMO] | "BMI..." |
| `playerProfile.bmiDesc` | [FRASE UI SIN TRADUCIR] | "Estimated Body Mass Index...." |
| `playerProfile.editTooltip` | [FRASE UI SIN TRADUCIR] | "Tap to edit your measurements..." |
| `playerProfile.readOnlyNotice` | [FRASE UI SIN TRADUCIR] | "Age, shirt number and position can only be modified by coach..." |

#### Namespace: `sessionRating` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sessionRating.subtitle` | [FRASE UI SIN TRADUCIR] | "Rate performance of called-up players (0 to 10)..." |
| `sessionRating.rateButton` | [OTRO] | "Rate..." |
| `sessionRating.savedSuccess` | [FRASE UI SIN TRADUCIR] | "Training session ratings saved successfully...." |
| `sessionRating.saveError` | [FRASE UI SIN TRADUCIR] | "Error saving session ratings...." |
| `sessionRating.commentPlaceholder` | [FRASE UI SIN TRADUCIR] | "Coaching notes or feedback (optional, max 200 chars)..." |
| `sessionRating.ratingLabel` | [OTRO] | "Score..." |
| `sessionRating.performanceTableTitle` | [FRASE UI SIN TRADUCIR] | "Training Performance..." |
| `sessionRating.performanceTableSubtitle` | [FRASE UI SIN TRADUCIR] | "Last 5 rated sessions and accumulated average..." |
| `sessionRating.averageRating` | [OTRO] | "Avg..." |
| `sessionRating.noRatings` | [FRASE UI SIN TRADUCIR] | "No ratings recorded for this session yet...." |
| `sessionRating.evolutionTitle` | [FRASE UI SIN TRADUCIR] | "Training Evolution..." |
| `sessionRating.radarAxisTraining` | [OTRO] | "Training..." |

#### Namespace: `notifPrefs` (15 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifPrefs.savedToast` | [FRASE UI SIN TRADUCIR] | "Notification preferences saved successfully..." |
| `notifPrefs.errorToast` | [FRASE UI SIN TRADUCIR] | "Error saving notification preferences..." |
| `notifPrefs.title` | [FRASE UI SIN TRADUCIR] | "Notification Preferences..." |
| `notifPrefs.wellnessTitle` | [FRASE UI SIN TRADUCIR] | "Wellness Check-in..." |
| `notifPrefs.wellnessDesc` | [FRASE UI SIN TRADUCIR] | "Daily reminder to fill out your health form..." |
| `notifPrefs.reminderTime` | [FORMATO FECHA/HORA/NÚMERO] | "Reminder Time..." |
| `notifPrefs.chatDesc` | [FRASE UI SIN TRADUCIR] | "Alerts for new messages in team squad chat..." |
| `notifPrefs.matchDesc` | [FRASE UI SIN TRADUCIR] | "Alerts for call-up rosters, schedules and upcoming matches..." |
| `notifPrefs.quietHoursTitle` | [OTRO] | "Quiet Hours..." |
| `notifPrefs.quietHoursDesc` | [FRASE UI SIN TRADUCIR] | "Do not receive push notifications during this time window..." |
| `notifPrefs.quietHoursStart` | [FRASE UI SIN TRADUCIR] | "Quiet start time..." |
| `notifPrefs.quietHoursEnd` | [OTRO] | "Quiet end time..." |
| `notifPrefs.frequencyCapTitle` | [OTRO] | "Frequency Cap..." |
| `notifPrefs.frequencyCapDesc` | [FRASE UI SIN TRADUCIR] | "Maximum number of notifications per day..." |
| `notifPrefs.perDay` | [OTRO] | "per day..." |

#### Namespace: `csv` (29 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `csv.errorEmptyFile` | [FRASE UI SIN TRADUCIR] | "The selected file is empty...." |
| `csv.errorParsing` | [FRASE UI SIN TRADUCIR] | "Could not read file. Check CSV or Excel formatting...." |
| `csv.errorUnsupportedFormat` | [FRASE UI SIN TRADUCIR] | "Unsupported format. Use .csv or .xlsx files...." |
| `csv.errorInvalidNumber` | [FRASE UI SIN TRADUCIR] | "Shirt number must be an integer between 1 and 99...." |
| `csv.errorDuplicateNumberTeam` | [FRASE UI SIN TRADUCIR] | "Shirt number is already taken in this team...." |
| `csv.errorDuplicateNumberFile` | [FRASE UI SIN TRADUCIR] | "Duplicate shirt number within the file...." |
| `csv.errorInvalidPosition` | [FRASE UI SIN TRADUCIR] | "Invalid position. Use GK, DEF, MID, FWD or equivalent...." |
| `csv.errorPlanLimitExceeded` | [FRASE UI SIN TRADUCIR] | "You have reached the maximum players allowed by your plan...." |
| `csv.importSuccessToast` | [FRASE UI SIN TRADUCIR] | "{count} players imported successfully...." |
| `csv.importErrorToast` | [FRASE UI SIN TRADUCIR] | "An error occurred while importing players...." |
| `csv.stepUpload` | [OTRO] | "Upload..." |
| `csv.stepMapping` | [OTRO] | "Mapping..." |
| `csv.stepPreview` | [OTRO] | "Preview..." |
| `csv.dropzoneTitle` | [FRASE UI SIN TRADUCIR] | "Drag and drop your file here or click to browse..." |
| `csv.dropzoneDesc` | [FRASE UI SIN TRADUCIR] | "Supported files: .csv, .xlsx, .xls (max 5MB)..." |
| *... y 14 claves adicionales en este namespace* | | |

#### Namespace: `qrScanner` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `qrScanner.unsupportedBrowser` | [FRASE UI SIN TRADUCIR] | "Your browser or device does not support camera access...." |
| `qrScanner.cameraPermissionError` | [FRASE UI SIN TRADUCIR] | "Could not access camera. Please check browser permissions...." |
| `qrScanner.noQrInImage` | [FRASE UI SIN TRADUCIR] | "No QR code detected in the selected image...." |
| `qrScanner.uploadQrPhoto` | [OTRO] | "Upload QR photo..." |
| `qrScanner.hint` | [FRASE UI SIN TRADUCIR] | "Point your camera at the QR code provided by the coach to jo..." |

#### Namespace: `teamQr` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamQr.linkCopiedToast` | [FRASE UI SIN TRADUCIR] | "Invitation link copied to clipboard..." |
| `teamQr.scanInstructions` | [FRASE UI SIN TRADUCIR] | "Show this QR code to your players or share the direct link s..." |
| `teamQr.teamCodeLabel` | [OTRO] | "Access Code:..." |
| `teamQr.copied` | [OTRO] | "Copied..." |
| `teamQr.copyCode` | [OTRO] | "Copy Code..." |
| `teamQr.shareLink` | [OTRO] | "Share Link..." |

#### Namespace: `errors` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `errors.codeInvalid` | [FRASE UI SIN TRADUCIR] | "Invalid code. Must have 6 characters...." |
| `errors.codeExpired` | [FRASE UI SIN TRADUCIR] | "This invitation has expired...." |
| `errors.codeAlreadyUsed` | [FRASE UI SIN TRADUCIR] | "This code has already been used...." |

#### Namespace: `staffJoin` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffJoin.title` | [FRASE UI SIN TRADUCIR] | "Join Technical Staff..." |
| `staffJoin.subtitle` | [FRASE UI SIN TRADUCIR] | "Enter the 6-character code provided by the head coach or pas..." |
| `staffJoin.inputPlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. STF-ABC123 or ABC123..." |
| `staffJoin.orPasteLink` | [FRASE UI SIN TRADUCIR] | "Have an invite link? Paste it here:..." |
| `staffJoin.linkPlaceholder` | [OTRO] | "https://mister11.com/join-staff?code=ABC123..." |
| `staffJoin.searching` | [FRASE UI SIN TRADUCIR] | "Validating code in real time......" |
| `staffJoin.assignedRole` | [OTRO] | "Assigned Role:..." |
| `staffJoin.confirmJoin` | [FRASE UI SIN TRADUCIR] | "CONFIRM AND JOIN STAFF..." |
| `staffJoin.success` | [FRASE UI SIN TRADUCIR] | "You have successfully joined the Technical Staff!..." |
| `staffJoin.errors.invalidCode` | [FRASE UI SIN TRADUCIR] | "Invalid or expired staff code. Contact the head coach...." |

#### Namespace: `staffInvite` (22 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffInvite.cardTitle` | [FRASE UI SIN TRADUCIR] | "ACCESS CODE FOR COACHES / STAFF..." |
| `staffInvite.cardSubtitle` | [FRASE UI SIN TRADUCIR] | "Exclusive code to link assistants, fitness coaches, and anal..." |
| `staffInvite.copyCode` | [OTRO] | "Copy Code..." |
| `staffInvite.codeCopied` | [FRASE UI SIN TRADUCIR] | "Staff code copied..." |
| `staffInvite.shareLink` | [OTRO] | "Share Link..." |
| `staffInvite.linkCopied` | [FRASE UI SIN TRADUCIR] | "Staff link copied..." |
| `staffInvite.qrModal` | [OTRO] | "View Staff QR..." |
| `staffInvite.inviteEmail` | [FRASE UI SIN TRADUCIR] | "Invite via Email..." |
| `staffInvite.joinTitle` | [FRASE UI SIN TRADUCIR] | "ACCESS CODE FOR COACHES / STAFF..." |
| `staffInvite.joinSubtitle` | [FRASE UI SIN TRADUCIR] | "If you were invited by the head coach, enter your code here...." |
| `staffInvite.inputPlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. ABC123 or STF-ABC123..." |
| `staffInvite.joinBtn` | [OTRO] | "JOIN TEAM..." |
| `staffInvite.modalTitle` | [FRASE UI SIN TRADUCIR] | "Invite Technical Staff Member..." |
| `staffInvite.emailLabel` | [FRASE UI SIN TRADUCIR] | "Collaborator email address:..." |
| `staffInvite.roleLabel` | [OTRO] | "Assigned role:..." |
| *... y 7 claves adicionales en este namespace* | | |

#### Namespace: `convocation` (38 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `convocation.title` | [OTRO] | "Convocation..." |
| `convocation.tab` | [OTRO] | "Squad List..." |
| `convocation.selectPlayers` | [FRASE UI SIN TRADUCIR] | "Select called-up players..." |
| `convocation.counter` | [FRASE UI SIN TRADUCIR] | "{count}/18 selected..." |
| `convocation.limitReached` | [FRASE UI SIN TRADUCIR] | "Limit reached: maximum 18 players selected..." |
| `convocation.generate` | [FRASE UI SIN TRADUCIR] | "Generate convocation PNG..." |
| `convocation.generating` | [FRASE UI SIN TRADUCIR] | "Generating PNG......" |
| `convocation.downloading` | [OTRO] | "Downloading......" |
| `convocation.sendToPlayers` | [OTRO] | "Send to players..." |
| `convocation.message` | [FRASE UI SIN TRADUCIR] | "Announcement message..." |
| `convocation.defaultMessage` | [FRASE UI SIN TRADUCIR] | "Call-up squad for the match vs {opponent}. Please check the ..." |
| `convocation.send` | [OTRO] | "Send..." |
| `convocation.sending` | [OTRO] | "Sending......" |
| `convocation.coachLabel` | [FRASE UI SIN TRADUCIR] | "COACH / ENTRENADOR..." |
| `convocation.cleanSelection` | [OTRO] | "Clear selection..." |
| *... y 23 claves adicionales en este namespace* | | |

#### Namespace: `whiteboard` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `whiteboard.exportingFrame` | [FRASE UI SIN TRADUCIR] | "Exporting frame {current} of {total}......" |
| `whiteboard.exportSuccess` | [FRASE UI SIN TRADUCIR] | "MP4 video exported successfully...." |
| `whiteboard.exportError` | [FRASE UI SIN TRADUCIR] | "Error exporting MP4 video. Please try again...." |
| `whiteboard.exportRetry` | [OTRO] | "Retry export..." |


---

## 1. Lengua: `FR` (Total Claves Idénticas a EN: 1977)

### Resumen por Categoría:

| Categoría | Conteo | Porcentaje |
|---|---|---|
| **[SIGLA/ACRÓNIMO]** | 78 | 3.9% |
| **[NOMBRE PROPIO/MARCA]** | 26 | 1.3% |
| **[FORMATO FECHA/HORA/NÚMERO]** | 24 | 1.2% |
| **[ABREVIATURA PIZARRA]** | 3 | 0.2% |
| **[FRASE UI SIN TRADUCIR]** | 1023 | 51.7% |
| **[OTRO]** | 823 | 41.6% |

### Claves por Namespace:

#### Namespace: `nav` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `nav.tests` | [SIGLA/ACRÓNIMO] | "TESTS..." |
| `nav.admin` | [OTRO] | "ADMINISTRATION..." |

#### Namespace: `common` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `common.absent` | [OTRO] | "Absent..." |
| `common.optimal` | [OTRO] | "Optimal..." |
| `common.originalLanguage` | [FRASE UI SIN TRADUCIR] | "Original language..." |
| `common.originalLanguageEs` | [FRASE UI SIN TRADUCIR] | "Original language: Spanish..." |
| `common.originalLanguageEn` | [FRASE UI SIN TRADUCIR] | "Original language: English..." |
| `common.originalBadgeEs` | [OTRO] | "ES original..." |
| `common.originalBadgeEn` | [OTRO] | "EN original..." |
| `common.all` | [SIGLA/ACRÓNIMO] | "ALL..." |
| `common.loading` | [OTRO] | "Loading......" |
| `common.savedSuccess` | [FRASE UI SIN TRADUCIR] | "Saved successfully..." |
| `common.errorGeneral` | [FRASE UI SIN TRADUCIR] | "An unexpected error occurred..." |
| `common.success` | [FRASE UI SIN TRADUCIR] | "Operation completed successfully..." |
| `common.genericError` | [OTRO] | "Operation error..." |

#### Namespace: `notifications` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifications.title` | [OTRO] | "Notifications..." |
| `notifications.empty` | [FRASE UI SIN TRADUCIR] | "You have no pending notifications...." |
| `notifications.timeNow` | [OTRO] | "Now..." |
| `notifications.timeJustNow` | [OTRO] | "Just now..." |
| `notifications.timeMinAgo` | [FORMATO FECHA/HORA/NÚMERO] | "{min} min ago..." |
| `notifications.timeHoursAgo` | [FRASE UI SIN TRADUCIR] | "{hours} hours ago..." |
| `notifications.newExerciseSaved` | [FRASE UI SIN TRADUCIR] | "New exercise saved: {name}..." |
| `notifications.predefinedExerciseError` | [FRASE UI SIN TRADUCIR] | "You cannot delete a system predefined exercise...." |
| `notifications.newSessionCreated` | [FRASE UI SIN TRADUCIR] | "New session created: {title}..." |
| `notifications.newPlayerAdded` | [FRASE UI SIN TRADUCIR] | "New player added: {name}..." |
| `notifications.individualPlanAssigned` | [FRASE UI SIN TRADUCIR] | "Individual plan assigned successfully..." |
| `notifications.individualPlanRemoved` | [FRASE UI SIN TRADUCIR] | "Individual plan removed..." |
| `notifications.newMatchRegistered` | [FRASE UI SIN TRADUCIR] | "New match registered vs {opponent}..." |

#### Namespace: `dashboard` (38 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `dashboard.welcome` | [OTRO] | "Hello, {name}..." |
| `dashboard.activity` | [FRASE UI SIN TRADUCIR] | "Here is your team activity ({club}) for this week...." |
| `dashboard.today` | [OTRO] | "Today..." |
| `dashboard.devAccess` | [NOMBRE PROPIO/MARCA] | "Developer Access - Mister11 PRO..." |
| `dashboard.devDesc` | [FRASE UI SIN TRADUCIR] | "Your account has lifetime access with all limits removed...." |
| `dashboard.devUnlimited` | [FRASE UI SIN TRADUCIR] | "✔ UNLIMITED DEVELOPER..." |
| `dashboard.stats.rival` | [OTRO] | "Next Opponent..." |
| `dashboard.stats.noRival` | [OTRO] | "No opponent..." |
| `dashboard.estimatedWorkload` | [FRASE UI SIN TRADUCIR] | "Estimated Workload..." |
| `dashboard.period.session` | [OTRO] | "This session..." |
| `dashboard.period.week` | [OTRO] | "This week..." |
| `dashboard.period.micro` | [OTRO] | "This microcycle..." |
| `dashboard.period.meso` | [OTRO] | "This mesocycle..." |
| `dashboard.period.macro` | [OTRO] | "This macrocycle..." |
| `dashboard.viewAll` | [OTRO] | "View all..." |
| *... y 23 claves adicionales en este namespace* | | |

#### Namespace: `session` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `session.untitled` | [OTRO] | "Untitled..." |

#### Namespace: `day` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `day.Lun` | [OTRO] | "Mon..." |
| `day.Mar` | [OTRO] | "Tue..." |
| `day.Mié` | [OTRO] | "Wed..." |
| `day.Jue` | [OTRO] | "Thu..." |
| `day.Vie` | [OTRO] | "Fri..." |
| `day.Sáb` | [OTRO] | "Sat..." |
| `day.Dom` | [OTRO] | "Sun..." |

#### Namespace: `block` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `block.warmup` | [OTRO] | "Warm-up..." |
| `block.abp` | [OTRO] | "Set Pieces..." |
| `block.physical` | [OTRO] | "Physical..." |

#### Namespace: `month` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `month.Sep` | [OTRO] | "Sep..." |
| `month.Oct` | [OTRO] | "Oct..." |
| `month.Nov` | [OTRO] | "Nov..." |
| `month.Dic` | [OTRO] | "Dec..." |
| `month.Ene` | [OTRO] | "Jan..." |
| `month.Feb` | [OTRO] | "Feb..." |
| `month.Mar` | [OTRO] | "Mar..." |
| `month.Abr` | [OTRO] | "Apr..." |
| `month.May` | [OTRO] | "May..." |
| `month.Jun` | [OTRO] | "Jun..." |
| `month.Jul` | [OTRO] | "Jul..." |
| `month.Ago` | [OTRO] | "Aug..." |

#### Namespace: `page` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `page.tests` | [SIGLA/ACRÓNIMO] | "TESTS..." |
| `page.admin` | [OTRO] | "ADMINISTRATION..." |
| `page.default` | [OTRO] | "MISTER 11..." |

#### Namespace: `bottomnav` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `bottomnav.home` | [OTRO] | "Home..." |
| `bottomnav.pizarra` | [OTRO] | "Board..." |
| `bottomnav.ia` | [SIGLA/ACRÓNIMO] | "AI..." |
| `bottomnav.tests` | [OTRO] | "Tests..." |
| `bottomnav.admin` | [FORMATO FECHA/HORA/NÚMERO] | "Admin..." |
| `bottomnav.more` | [OTRO] | "More..." |
| `bottomnav.moreModules` | [FRASE UI SIN TRADUCIR] | "Modules & Management..." |
| `bottomnav.planificacion` | [OTRO] | "Planning..." |

#### Namespace: `paywall` (19 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `paywall.title` | [FRASE UI SIN TRADUCIR] | "Unlock Full Potential..." |
| `paywall.proBadge` | [OTRO] | "PRO PLAN..." |
| `paywall.clubBadge` | [OTRO] | "CLUB PLAN..." |
| `paywall.freeLimitMsg` | [FRASE UI SIN TRADUCIR] | "You have reached the free plan limit...." |
| `paywall.upgradeBtn` | [OTRO] | "Upgrade to PRO..." |
| `paywall.upgradeClubBtn` | [OTRO] | "View CLUB Plans..." |
| `paywall.benefit1` | [FRASE UI SIN TRADUCIR] | "Unlimited training sessions..." |
| `paywall.benefit2` | [FRASE UI SIN TRADUCIR] | "Unlimited AI task generator..." |
| `paywall.benefit4` | [FRASE UI SIN TRADUCIR] | "Advanced statistics and metrics suite..." |
| `paywall.androidDialogTitle` | [FRASE UI SIN TRADUCIR] | "Míster11 PRO Plans..." |
| `paywall.androidDialogText` | [FRASE UI SIN TRADUCIR] | "Subscriptions are centrally managed on our web platform. Vis..." |
| `paywall.androidOpenWeb` | [FRASE UI SIN TRADUCIR] | "Open mister11.app..." |
| `paywall.androidHaveCode` | [FRASE UI SIN TRADUCIR] | "I already have a code..." |
| `paywall.androidNotNow` | [OTRO] | "Not now..." |
| `paywall.androidRedeemTitle` | [OTRO] | "Redeem Code..." |
| *... y 4 claves adicionales en este namespace* | | |

#### Namespace: `auth` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `auth.loginTitle` | [OTRO] | "Sign In..." |
| `auth.registerTitle` | [OTRO] | "Create Account..." |
| `auth.password` | [OTRO] | "Password..." |
| `auth.loginBtn` | [NOMBRE PROPIO/MARCA] | "Enter Mister11..." |
| `auth.googleBtn` | [NOMBRE PROPIO/MARCA] | "Continue with Google..." |
| `auth.noAccount` | [FRASE UI SIN TRADUCIR] | "Don't have an account?..." |
| `auth.hasAccount` | [FRASE UI SIN TRADUCIR] | "Already have an account?..." |
| `auth.registerLink` | [FRASE UI SIN TRADUCIR] | "Sign up for free..." |
| `auth.loginLink` | [OTRO] | "Log in..." |
| `auth.forgotPass` | [FRASE UI SIN TRADUCIR] | "Forgot password?..." |
| `auth.coachRole` | [FRASE UI SIN TRADUCIR] | "I am Coach / Staff..." |
| `auth.parentRole` | [FRASE UI SIN TRADUCIR] | "I am Parent / Guardian..." |
| `auth.teamCode` | [FRASE UI SIN TRADUCIR] | "Invitation Code (6 characters)..." |
| `auth.joinBtn` | [OTRO] | "Send Request..." |
| `auth.logout` | [OTRO] | "Log Out..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `live` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `live.btn.shot_on_own` | [FRASE UI SIN TRADUCIR] | "Shot on Target (Own)..." |
| `live.btn.shot_on_rival` | [FRASE UI SIN TRADUCIR] | "Shot on Target (Opponent)..." |
| `live.btn.shot_off_own` | [FRASE UI SIN TRADUCIR] | "Shot off Target (Own)..." |
| `live.btn.shot_off_rival` | [FRASE UI SIN TRADUCIR] | "Shot off Target (Opponent)..." |
| `live.btn.recovery` | [OTRO] | "Ball Recovery..." |
| `live.btn.loss` | [OTRO] | "Ball Loss..." |
| `live.btn.duel_won` | [OTRO] | "Duel Won..." |
| `live.btn.duel_lost` | [OTRO] | "Duel Lost..." |
| `live.btn.foul_favor` | [OTRO] | "Foul in Favor..." |
| `live.btn.foul_against` | [OTRO] | "Foul Against..." |
| `live.btn.counter_not_cut` | [OTRO] | "Uncut Counter..." |
| `live.btn.player_no_finish` | [OTRO] | "Unfinished Play..." |
| `live.btn.card_yellow_own` | [FRASE UI SIN TRADUCIR] | "Yellow Card (Own)..." |
| `live.btn.card_red_own` | [OTRO] | "Red Card (Own)..." |
| `live.btn.card_yellow_rival` | [FRASE UI SIN TRADUCIR] | "Yellow Card (Opponent)..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `test` (114 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `test.completedSuccess` | [FRASE UI SIN TRADUCIR] | "Test {name} completed successfully! ({pct}%)..." |
| `test.errorSaving` | [FRASE UI SIN TRADUCIR] | "Error saving test. Please try again...." |
| `test.question` | [OTRO] | "Question..." |
| `test.of` | [OTRO] | "of..." |
| `test.dimension` | [OTRO] | "Dimension..." |
| `test.previous` | [OTRO] | "Previous..." |
| `test.finishAndSend` | [FRASE UI SIN TRADUCIR] | "FINISH AND SUBMIT TO COACH..." |
| `test.tabTitle` | [FRASE UI SIN TRADUCIR] | "Tests & Self-Assessments..." |
| `test.tabSubtitle` | [FRASE UI SIN TRADUCIR] | "Complete these questionnaires from your mobile to boost mind..." |
| `test.questionsCount` | [FRASE UI SIN TRADUCIR] | "{count} questions..." |
| `test.lastResult` | [OTRO] | "Last result..." |
| `test.repeatTest` | [OTRO] | "Retake Test..." |
| `test.startTest` | [FRASE UI SIN TRADUCIR] | "Start Questionnaire..." |
| `test.initialEvaluationRegistered` | [FRASE UI SIN TRADUCIR] | "Initial evaluation recorded..." |
| `test.retakeTest` | [FRASE UI SIN TRADUCIR] | "Retake Questionnaire..." |
| *... y 99 claves adicionales en este namespace* | | |

#### Namespace: `admin` (33 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `admin.title` | [FORMATO FECHA/HORA/NÚMERO] | "Admin Dashboard..." |
| `admin.tab.equipos` | [OTRO] | "Teams..." |
| `admin.tab.club` | [OTRO] | "Club..." |
| `admin.tab.general` | [OTRO] | "General..." |
| `admin.tab.suscripcion` | [OTRO] | "Subscription..." |
| `admin.lang.title` | [OTRO] | "System Language..." |
| `admin.theme.dark` | [OTRO] | "Dark Mode..." |
| `admin.notif.title` | [OTRO] | "Notifications..." |
| `admin.manageSubAndroidMsg` | [FRASE UI SIN TRADUCIR] | "Manage your subscription from mister11.app..." |
| `admin.account_deleted` | [FRASE UI SIN TRADUCIR] | "Your coach account and data have been deleted successfully...." |
| `admin.svg_shield_saved` | [FRASE UI SIN TRADUCIR] | "SVG vector shield saved successfully!..." |
| `admin.shield_saved` | [FRASE UI SIN TRADUCIR] | "Shield saved and optimized successfully!..." |
| `admin.shield_error` | [FRASE UI SIN TRADUCIR] | "Could not upload or process the image...." |
| `admin.profile_synced` | [FRASE UI SIN TRADUCIR] | "Coach profile synced across the entire system...." |
| `admin.profile_error` | [FRASE UI SIN TRADUCIR] | "Error saving profile...." |
| *... y 18 claves adicionales en este namespace* | | |

#### Namespace: `equipo` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `equipo.tab.squad` | [OTRO] | "Squad..." |
| `equipo.tab.attendance` | [OTRO] | "Attendance..." |
| `equipo.tab.staff` | [OTRO] | "Coaching Staff..." |
| `equipo.loadingSquad` | [FRASE UI SIN TRADUCIR] | "Loading squad......" |
| `equipo.publishAnnouncement` | [FRASE UI SIN TRADUCIR] | "Publish Announcement..." |

#### Namespace: `partidos` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `partidos.tab.analisis` | [OTRO] | "Analysis..." |

#### Namespace: `plan` (25 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plan.tab.macrociclo` | [OTRO] | "MACROCYCLE..." |
| `plan.tab.mesociclo` | [OTRO] | "MESOCYCLE..." |
| `plan.tab.microciclo` | [OTRO] | "MICROCYCLE..." |
| `plan.tab.objetivos` | [OTRO] | "OBJECTIVES..." |
| `plan.strategicPlanning` | [FRASE UI SIN TRADUCIR] | "STRATEGIC PLANNING..." |
| `plan.saving` | [OTRO] | "SAVING......" |
| `plan.dateRange` | [OTRO] | "DATE RANGE..." |
| `plan.start` | [OTRO] | "Start..." |
| `plan.end` | [OTRO] | "End..." |
| `plan.trainingDays` | [OTRO] | "TRAINING DAYS..." |
| `plan.matchDay` | [OTRO] | "⚽ Match Day:..." |
| `plan.fatigaWarning` | [FRASE UI SIN TRADUCIR] | "⚠️ Training on MD-1 — potential fatigue..." |
| `plan.reubicarBtn` | [FRASE UI SIN TRADUCIR] | "🔄 Reschedule training based on new day..." |
| `plan.category` | [SIGLA/ACRÓNIMO] | "CATEGORY..." |
| `plan.coach` | [SIGLA/ACRÓNIMO] | "COACH..." |
| *... y 10 claves adicionales en este namespace* | | |

#### Namespace: `sesiones` (27 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sesiones.tab.captures` | [OTRO] | "Captures..." |
| `sesiones.tab.animations` | [OTRO] | "Animations..." |
| `sesiones.fieldMode` | [OTRO] | "Field Mode..." |
| `sesiones.views.day` | [SIGLA/ACRÓNIMO] | "DAY..." |
| `sesiones.views.week` | [SIGLA/ACRÓNIMO] | "WEEK..." |
| `sesiones.views.month` | [SIGLA/ACRÓNIMO] | "MONTH..." |
| `sesiones.clickDayToView` | [FRASE UI SIN TRADUCIR] | "Click a day to view sessions..." |
| `sesiones.noDiagram` | [OTRO] | "No diagram..." |
| `sesiones.actions.share` | [OTRO] | "Share..." |
| `sesiones.blockCount.one` | [OTRO] | "{count} Block..." |
| `sesiones.blockCount.other` | [OTRO] | "{count} Blocks..." |
| `sesiones.categories.all` | [OTRO] | "All..." |
| `sesiones.categories.fisica` | [OTRO] | "Physical..." |
| `sesiones.categories.mixta` | [OTRO] | "Mixed..." |
| `sesiones.categories.partido` | [OTRO] | "Match..." |
| *... y 12 claves adicionales en este namespace* | | |

#### Namespace: `tests` (17 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `tests.tab.fisicos` | [OTRO] | "Fitness Tests..." |
| `tests.tab.psicosociales` | [OTRO] | "Psychosocial..." |
| `tests.tab.prevencion` | [FRASE UI SIN TRADUCIR] | "Health & Prevention..." |
| `tests.tab.historial` | [OTRO] | "History..." |
| `tests.tab.comparativa` | [OTRO] | "Comparison..." |
| `tests.resources.title` | [FRASE UI SIN TRADUCIR] | "Resources & Tools..." |
| `tests.resources.tacticalTest` | [OTRO] | "Tactical Test..." |
| `tests.resources.seasonReport` | [OTRO] | "Season Report..." |
| `tests.resources.myTeam` | [OTRO] | "My Squad..." |
| `tests.rpe.save` | [OTRO] | "SAVE RPE..." |
| `tests.createTest` | [OTRO] | "+ Create Test..." |
| `tests.success` | [OTRO] | "Success..." |
| `tests.error` | [OTRO] | "Error..." |
| `tests.confirm_season_reset` | [OTRO] | "Reset Season..." |
| `tests.attention` | [OTRO] | "⚠️ ATTENTION..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `player` (354 claves idénticas a EN)
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
| *... y 339 claves adicionales en este namespace* | | |

#### Namespace: `ach` (40 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ach.weekly_perfect_week.name` | [OTRO] | "Perfect Week..." |
| `ach.weekly_perfect_week.desc` | [FRASE UI SIN TRADUCIR] | "Attend 100% of the training sessions scheduled for this week..." |
| `ach.weekly_wellness.name` | [OTRO] | "Health Check-in..." |
| `ach.weekly_wellness.desc` | [FRASE UI SIN TRADUCIR] | "Record your sleep and soreness on training days...." |
| `ach.weekly_scholar.name` | [OTRO] | "Strong Mind..." |
| `ach.weekly_scholar.desc` | [FRASE UI SIN TRADUCIR] | "Complete at least 1 psychological test or evaluation in the ..." |
| `ach.weekly_committed.name` | [OTRO] | "Invisible Work..." |
| `ach.weekly_committed.desc` | [FRASE UI SIN TRADUCIR] | "Complete the assigned exercises from your individual plan...." |
| `ach.weekly_attentive.name` | [OTRO] | "Always Ready..." |
| `ach.weekly_attentive.desc` | [FRASE UI SIN TRADUCIR] | "Check match and training details before the call-up time...." |
| `ach.biweekly_iron.desc` | [FRASE UI SIN TRADUCIR] | "100% attendance during 14 consecutive days...." |
| `ach.biweekly_self_care.name` | [OTRO] | "Healthy Habit..." |
| `ach.biweekly_self_care.desc` | [FRASE UI SIN TRADUCIR] | "Submit your wellness check-in on at least 80% of days...." |
| `ach.biweekly_strong_mind.name` | [FRASE UI SIN TRADUCIR] | "Match Resilience..." |
| `ach.biweekly_strong_mind.desc` | [FRASE UI SIN TRADUCIR] | "Complete 3 psychological tests on coping or mental toughness..." |
| *... y 25 claves adicionales en este namespace* | | |

#### Namespace: `games` (191 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `games.intro.whatTitle` | [OTRO] | "What We Train..." |
| `games.intro.howTitle` | [OTRO] | "How to Play..." |
| `games.intro.whyTitle` | [FRASE UI SIN TRADUCIR] | "Why It Helps on the Pitch..." |
| `games.safety.title` | [OTRO] | "Safety at Home..." |
| `games.honesty.pact` | [FRASE UI SIN TRADUCIR] | "Honesty pact: record your real repetitions. The effort is yo..." |
| `games.btn.practiceFirst` | [FRASE UI SIN TRADUCIR] | "Try in Practice Mode..." |
| `games.disclaimer` | [FRASE UI SIN TRADUCIR] | "Support cognitive training, not therapy; follow specialist a..." |
| `games.finish.title` | [FRASE UI SIN TRADUCIR] | "Outstanding effort!..." |
| `games.finish.subtitle` | [FRASE UI SIN TRADUCIR] | "You have completed the session with dedication...." |
| `games.finish.healthyClosing` | [FRASE UI SIN TRADUCIR] | "Great mental work! Rest your eyes and body...." |
| `games.limits.title` | [FRASE UI SIN TRADUCIR] | "Healthy Training..." |
| `games.limits.available` | [OTRO] | "Available..." |
| `games.limits.completedToday` | [FRASE UI SIN TRADUCIR] | "Completed for today..." |
| `games.limits.minutesLbl` | [OTRO] | "Time played..." |
| `games.limits.lockedTitle` | [FRASE UI SIN TRADUCIR] | "Well done for today!..." |
| *... y 176 claves adicionales en este namespace* | | |

#### Namespace: `attendance` (22 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `attendance.chart.guide.title` | [FRASE UI SIN TRADUCIR] | "How to interpret this chart?..." |
| `attendance.chart.guide.step1` | [FRASE UI SIN TRADUCIR] | "1. Each point is a training or match: ordered chronologicall..." |
| `attendance.chart.guide.step2` | [FRASE UI SIN TRADUCIR] | "2. The green line is your attendance: above 70% you are on t..." |
| `attendance.chart.guide.step3` | [FRASE UI SIN TRADUCIR] | "3. If red rises while green drops: there is a commitment iss..." |
| `attendance.chart.guide.step4` | [FRASE UI SIN TRADUCIR] | "4. Tap any point to view details and open its register direc..." |
| `attendance.chart.guide.example` | [FRASE UI SIN TRADUCIR] | "Currently your team averages {avg}% attendance across {count..." |
| `attendance.chart.legend.attendance` | [FRASE UI SIN TRADUCIR] | "Actual Attendance (P+L)..." |
| `attendance.chart.legend.absent` | [OTRO] | "Absent..." |
| `attendance.chart.legend.absent.desc` | [FRASE UI SIN TRADUCIR] | "Unexcused absences. Should aim for zero...." |
| `attendance.chart.legend.late` | [OTRO] | "Late..." |
| `attendance.chart.legend.late.desc` | [FRASE UI SIN TRADUCIR] | "Late arrivals. Watch if it rises over several weeks...." |
| `attendance.chart.legend.justified` | [OTRO] | "Justified..." |
| `attendance.chart.legend.justified.desc` | [FRASE UI SIN TRADUCIR] | "Justified notices. Does not penalize the main %...." |
| `attendance.chart.legend.threshold70` | [FRASE UI SIN TRADUCIR] | "Alert threshold (70%): below this, callup risk...." |
| `attendance.chart.legend.official` | [FRASE UI SIN TRADUCIR] | "Official (closed sheet/session)..." |
| *... y 7 claves adicionales en este namespace* | | |

#### Namespace: `matches` (21 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matches.warnings.bannerTitle` | [FRASE UI SIN TRADUCIR] | "This match contained {count} isolated log anomalies or legac..." |
| `matches.warnings.showDetails` | [OTRO] | "View list..." |
| `matches.warnings.hideDetails` | [OTRO] | "Hide details..." |
| `matches.warnings.cleanseBtn` | [FRASE UI SIN TRADUCIR] | "Cleanse & Resolve..." |
| `matches.warnings.cleansing` | [OTRO] | "Resolving......" |
| `matches.warnings.resolvedSuccess` | [FRASE UI SIN TRADUCIR] | "✔ {count} anomaly/anomalies resolved and match sheet synchro..." |
| `matches.warnings.auditNote` | [FRASE UI SIN TRADUCIR] | "Log cleansed on {date}: {count} anomalies isolated and resol..." |
| `matches.warnings.auditShow` | [OTRO] | "View details..." |
| `matches.warnings.auditHide` | [OTRO] | "Hide audit..." |
| `matches.warnings.chipTooltip` | [FRASE UI SIN TRADUCIR] | "{count} anomalies detected in log (click to view and resolve..." |
| `matches.lineup.title` | [FRASE UI SIN TRADUCIR] | "Tactical Lineup & Bench..." |
| `matches.lineup.subtitle` | [FRASE UI SIN TRADUCIR] | "Tactical board with starting XI and substitutes bench..." |
| `matches.lineup.downloadPng` | [OTRO] | "DOWNLOAD PNG..." |
| `matches.lineup.exportingPng` | [OTRO] | "EXPORTING......" |
| `matches.lineup.benchTitle` | [FRASE UI SIN TRADUCIR] | "SUBSTITUTES BENCH..." |
| *... y 6 claves adicionales en este namespace* | | |

#### Namespace: `spell` (11 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `spell.title` | [FRASE UI SIN TRADUCIR] | "Spelling & Grammar..." |
| `spell.observations` | [FRASE UI SIN TRADUCIR] | "{count} spelling observation..." |
| `spell.observationsPlural` | [FRASE UI SIN TRADUCIR] | "{count} spelling observations..." |
| `spell.missingAccent` | [OTRO] | "Missing accent..." |
| `spell.typo` | [OTRO] | "Typo..." |
| `spell.unrecognized` | [FRASE UI SIN TRADUCIR] | "Unrecognized word..." |
| `spell.addToDictionary` | [FRASE UI SIN TRADUCIR] | "Add to dictionary..." |
| `spell.ignore` | [OTRO] | "Ignore..." |
| `spell.recommended` | [OTRO] | "Suggestions:..." |
| `spell.noSuggestions` | [FRASE UI SIN TRADUCIR] | "No direct suggestions..." |
| `spell.allCorrect` | [FRASE UI SIN TRADUCIR] | "No spelling issues..." |

#### Namespace: `analisis` (55 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `analisis.title` | [FRASE UI SIN TRADUCIR] | "Comparative Multi-Match Analysis..." |
| `analisis.subtitle` | [FRASE UI SIN TRADUCIR] | "Tactical evolution, shots, duels and recoveries throughout t..." |
| `analisis.shortcuts.title` | [OTRO] | "SHORTCUTS:..." |
| `analisis.shortcuts.last3` | [OTRO] | "Last 3..." |
| `analisis.shortcuts.last5` | [OTRO] | "Last 5..." |
| `analisis.shortcuts.allSeason` | [OTRO] | "Whole Season..." |
| `analisis.mode.title` | [OTRO] | "Metrics:..." |
| `analisis.mode.averages` | [OTRO] | "Averages..." |
| `analisis.mode.totals` | [OTRO] | "Totals..." |
| `analisis.loadingData` | [FRASE UI SIN TRADUCIR] | "Loading match events......" |
| `analisis.noMatchesSelected` | [FRASE UI SIN TRADUCIR] | "Select at least 1 match to perform comparative analysis..." |
| `analisis.kpi.shots` | [OTRO] | "Shots on Target..." |
| `analisis.kpi.duels` | [OTRO] | "Duels Won..." |
| `analisis.kpi.recoveries` | [FRASE UI SIN TRADUCIR] | "Recoveries / Losses..." |
| `analisis.kpi.counters` | [FRASE UI SIN TRADUCIR] | "Counterattack Efficiency..." |
| *... y 40 claves adicionales en este namespace* | | |

#### Namespace: `ia` (90 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ia.title` | [OTRO] | "✨ AI Generator..." |
| `ia.subtitle` | [FRASE UI SIN TRADUCIR] | "Smart training session design..." |
| `ia.libraryBtn` | [FRASE UI SIN TRADUCIR] | "☁️ Library ({count})..." |
| `ia.modePrevention` | [FRASE UI SIN TRADUCIR] | "Prevention / Recovery..." |
| `ia.categoryAge` | [OTRO] | "Category / Age..." |
| `ia.selectPlaceholder` | [OTRO] | "Select......" |
| `ia.mainObjective` | [OTRO] | "Main Objective..." |
| `ia.materials` | [OTRO] | "Materials..." |
| `ia.space` | [OTRO] | "Pitch Area..." |
| `ia.tacticalRef` | [FRASE UI SIN TRADUCIR] | "Tactical Reference (Optional)..." |
| `ia.noRef` | [OTRO] | "No Ref...." |
| `ia.capture` | [OTRO] | "Capture..." |
| `ia.animation` | [FRASE UI SIN TRADUCIR] | "Animation ({count}F)..." |
| `ia.tacticalBoard` | [OTRO] | "🎬 Board..." |
| `ia.additionalObs` | [FRASE UI SIN TRADUCIR] | "Additional observations..." |
| *... y 75 claves adicionales en este namespace* | | |

#### Namespace: `board` (119 claves idénticas a EN)
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
| `board.toolbar.clearCanvas` | [FRASE UI SIN TRADUCIR] | "Clear entire canvas..." |
| `board.toolbar.new` | [SIGLA/ACRÓNIMO] | "NEW..." |
| `board.toolbar.exportMp4` | [OTRO] | "EXPORT MP4..." |
| `board.toolbar.exportingMp4` | [FRASE UI SIN TRADUCIR] | "REC... EXPORTING MP4..." |
| `board.export.encodingTitle` | [FRASE UI SIN TRADUCIR] | "Exporting MP4 Video..." |
| *... y 104 claves adicionales en este namespace* | | |

#### Namespace: `team` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `team.squadCount.one` | [FRASE UI SIN TRADUCIR] | "{count} player in squad..." |
| `team.squadCount.other` | [FRASE UI SIN TRADUCIR] | "{count} players in squad..." |

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

#### Namespace: `health` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `health.active` | [OTRO] | "Active..." |
| `health.resolved` | [OTRO] | "Recovered..." |
| `health.addInjury` | [OTRO] | "+ Record Injury..." |
| `health.title` | [FRASE UI SIN TRADUCIR] | "Medical History & Injuries..." |
| `health.noInjuries` | [FRASE UI SIN TRADUCIR] | "No injuries recorded...." |

#### Namespace: `plans` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plans.routinesAndPrevention` | [FRASE UI SIN TRADUCIR] | "Routines & Prevention..." |
| `plans.loadingPlans` | [FRASE UI SIN TRADUCIR] | "Loading plans......" |
| `plans.noPlansAssigned` | [FRASE UI SIN TRADUCIR] | "The player has no assigned plans...." |
| `plans.badgeTeam` | [SIGLA/ACRÓNIMO] | "TEAM..." |
| `plans.badgeIndividual` | [OTRO] | "INDIVIDUAL..." |
| `plans.streakDays.one` | [FRASE UI SIN TRADUCIR] | "Streak: {count} day..." |
| `plans.streakDays.other` | [FRASE UI SIN TRADUCIR] | "Streak: {count} days..." |
| `plans.sharePlan` | [OTRO] | "🔗 Share Plan..." |
| `plans.coachFeedback` | [FRASE UI SIN TRADUCIR] | "Coach Instructions..." |

#### Namespace: `staff` (39 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staff.shareCodeDesc` | [FRASE UI SIN TRADUCIR] | "Share this code so players or parents can join from the Port..." |
| `staff.copyCode` | [OTRO] | "Copy Code..." |
| `staff.copied` | [OTRO] | "Copied!..." |
| `staff.shareLink` | [OTRO] | "Share Link..." |
| `staff.staffTitle` | [FRASE UI SIN TRADUCIR] | "Coaching Staff & Collaborators..." |
| `staff.inviteStaffBtn` | [FRASE UI SIN TRADUCIR] | "Invite Staff ({count}/{limit})..." |
| `staff.you` | [OTRO] | "(You)..." |
| `staff.changeRole` | [OTRO] | "Change Role:..." |
| `staff.role.headCoach` | [OTRO] | "Head Coach..." |
| `staff.role.goalkeeperCoach` | [FRASE UI SIN TRADUCIR] | "Goalkeeper Coach..." |
| `staff.role.analyst` | [FRASE UI SIN TRADUCIR] | "Tactical Analyst..." |
| `staff.role.scout` | [OTRO] | "Scout..." |
| `staff.role.coordinator` | [FRASE UI SIN TRADUCIR] | "Academy Director..." |
| `staff.role.collaborator` | [FRASE UI SIN TRADUCIR] | "Staff Collaborator..." |
| `staff.remove` | [OTRO] | "Remove..." |
| *... y 24 claves adicionales en este namespace* | | |

#### Namespace: `wellness` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `wellness.rpe.title` | [FRASE UI SIN TRADUCIR] | "Rate of Perceived Exertion (RPE)..." |
| `wellness.rpe.desc` | [FRASE UI SIN TRADUCIR] | "Record how {name} perceived the effort...." |
| `wellness.rpe.levelLabel` | [FRASE UI SIN TRADUCIR] | "Exertion Level (RPE 1-10)..." |
| `wellness.rpe.scaleMin` | [OTRO] | "1 - Very light..." |
| `wellness.rpe.scaleMax` | [FRASE UI SIN TRADUCIR] | "10 - Maximum effort..." |
| `wellness.rpe.trainingLoad` | [FRASE UI SIN TRADUCIR] | "Training Load (RPE × Duration):..." |
| `wellness.rpe.save` | [OTRO] | "SAVE RPE..." |

#### Namespace: `cognitive` (40 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `cognitive.supervision_title` | [FRASE UI SIN TRADUCIR] | "Cognitive Supervision & Home Challenges..." |
| `cognitive.week_sessions` | [FRASE UI SIN TRADUCIR] | "Current week · {count} recorded sessions..." |
| `cognitive.btn_verified` | [FRASE UI SIN TRADUCIR] | "✔ Verified (+5 XP)..." |
| `cognitive.btn_verifying` | [OTRO] | "Verifying…..." |
| `cognitive.btn_recommend_challenge` | [FRASE UI SIN TRADUCIR] | "Recommend Challenge..." |
| `cognitive.metric_median_reaction` | [OTRO] | "Median reaction..." |
| `cognitive.metric_avg_accuracy` | [FRASE UI SIN TRADUCIR] | "Average accuracy..." |
| `cognitive.metric_trend` | [OTRO] | "Trend..." |
| `cognitive.trend_improving` | [OTRO] | "↑ Improving..." |
| `cognitive.trend_stable` | [OTRO] | "= Stable..." |
| `cognitive.level_by_game_title` | [FRASE UI SIN TRADUCIR] | "Level per Game (Adaptive Merit)..." |
| `cognitive.category_label` | [OTRO] | "Category: {cat}..." |
| `cognitive.active_challenges_title` | [FRASE UI SIN TRADUCIR] | "Active Recommended Challenges & Games ({count}):..." |
| `cognitive.target_team` | [OTRO] | "Entire team..." |
| `cognitive.target_player` | [OTRO] | "Individual..." |
| *... y 25 claves adicionales en este namespace* | | |

#### Namespace: `header` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `header.logoutConfirm` | [FRASE UI SIN TRADUCIR] | "Do you want to log out or switch accounts?..." |

#### Namespace: `status` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `status.none` | [OTRO] | "Not Selected..." |

#### Namespace: `placeholder` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `placeholder.teamName` | [FRASE UI SIN TRADUCIR] | "e.g. Manchester Youth A..." |

#### Namespace: `app` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `app.slogan` | [FRASE UI SIN TRADUCIR] | "The bench in your pocket..." |
| `app.copyright` | [NOMBRE PROPIO/MARCA] | "2026 Mister11 · {slogan}..." |

#### Namespace: `install` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `install.title` | [FRASE UI SIN TRADUCIR] | "Install Mister 11..." |
| `install.slogan` | [FRASE UI SIN TRADUCIR] | "The bench in your pocket..." |
| `install.alreadyInstalled` | [FRASE UI SIN TRADUCIR] | "The App is already installed on your device!..." |
| `install.instructions` | [OTRO] | "Instructions:..." |
| `install.androidTitle` | [NOMBRE PROPIO/MARCA] | "Android (Chrome):..." |
| `install.androidDesc` | [FRASE UI SIN TRADUCIR] | "Tap the "Install now" button below or open the three dots me..." |
| `install.iosTitle` | [OTRO] | "iOS (Safari):..." |
| `install.iosDesc` | [FRASE UI SIN TRADUCIR] | "Tap the "Share" button (square with arrow) and select "Add t..." |
| `install.btnInstall` | [OTRO] | "Install now..." |
| `install.fallbackNotice` | [FRASE UI SIN TRADUCIR] | "If you do not see the install button, use the "Add to Home S..." |
| `install.metaTitle` | [FRASE UI SIN TRADUCIR] | "Install Mister11 — The Football App for Coaches..." |
| `install.metaDesc` | [FRASE UI SIN TRADUCIR] | "Step-by-step installation instructions for Mister11 PWA on A..." |

#### Namespace: `consent` (50 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `consent.heading` | [FRASE UI SIN TRADUCIR] | "Digital Parental Consent..." |
| `consent.subTitle` | [FRASE UI SIN TRADUCIR] | "Informed authorization for the sports management of the unde..." |
| `consent.detailsTitle` | [OTRO] | "Consent Details..." |
| `consent.instructions` | [FRASE UI SIN TRADUCIR] | "Fill in the required information. Fields marked with (*) are..." |
| `consent.sec1` | [FRASE UI SIN TRADUCIR] | "1. Parent or Legal Guardian Details..." |
| `consent.parentNameLabel` | [OTRO] | "Guardian Name *..." |
| `consent.parentNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.parentDniLabel` | [FRASE UI SIN TRADUCIR] | "ID / NIE / Passport *..." |
| `consent.parentDniPlaceholder` | [OTRO] | "e.g. 12345678Z..." |
| `consent.relationLabel` | [OTRO] | "Relationship *..." |
| `consent.relationFather` | [OTRO] | "Father..." |
| `consent.relationMother` | [OTRO] | "Mother..." |
| `consent.relationGuardian` | [FRASE UI SIN TRADUCIR] | "Legal Guardian / Representative..." |
| `consent.parentPhoneLabel` | [OTRO] | "Contact Phone..." |
| `consent.parentPhonePlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. +34 600 000 000..." |
| *... y 35 claves adicionales en este namespace* | | |

#### Namespace: `download` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `download.saved_in` | [FRASE UI SIN TRADUCIR] | "✅ Saved in: {path}..." |
| `download.cache_hint` | [FRASE UI SIN TRADUCIR] | "Saved to cache. If it does not open, look for "{filename}" i..." |
| `download.pdf_ready` | [NOMBRE PROPIO/MARCA] | "✅ PDF ready: "{filename}"..." |
| `download.pdf_error` | [NOMBRE PROPIO/MARCA] | "Error saving PDF..." |
| `download.json_success` | [FRASE UI SIN TRADUCIR] | "✅ File exported successfully...." |
| `download.image_success` | [FRASE UI SIN TRADUCIR] | "✅ Image exported successfully...." |
| `download.csv_success` | [FRASE UI SIN TRADUCIR] | "✅ Template exported successfully...." |
| `download.video_success` | [FRASE UI SIN TRADUCIR] | "✅ Animation exported successfully...." |
| `download.lineup_saved` | [FRASE UI SIN TRADUCIR] | "✅ Lineup saved to {path}..." |
| `download.lineup_downloading` | [FRASE UI SIN TRADUCIR] | "⬇️ Downloading lineup: {filename}..." |
| `download.save_error_share_fallback` | [FRASE UI SIN TRADUCIR] | "⚠️ Could not save file automatically; please use Share...." |
| `download.lineup_share_title` | [NOMBRE PROPIO/MARCA] | "Mister11 — Lineup {team}..." |
| `download.generic_error` | [FRASE UI SIN TRADUCIR] | "Error exporting lineup..." |

#### Namespace: `push` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `push.foreground_toast` | [FRASE UI SIN TRADUCIR] | "🔔 {title}: {body}..." |

#### Namespace: `achievements` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `achievements.toast_unlocked` | [FRASE UI SIN TRADUCIR] | "🏆 Achievement unlocked: {name}! (+{xp} XP)..." |

#### Namespace: `chat` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `chat.notif_from_player` | [FRASE UI SIN TRADUCIR] | "💬 Message from {playerName}: "{msgText}"..." |

#### Namespace: `match` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `match.locked_reopen` | [FRASE UI SIN TRADUCIR] | "⚠️ Match completed. Reopen match sheet to record events...." |
| `match.status.finalizado` | [SIGLA/ACRÓNIMO] | "FINISHED..." |
| `match.status.en_edicion` | [OTRO] | "IN EDITING..." |
| `match.status.pendiente` | [SIGLA/ACRÓNIMO] | "PENDING..." |
| `match.status.no_disputado` | [OTRO] | "NOT PLAYED..." |
| `match.sort.label` | [OTRO] | "Sort by..." |
| `match.sort.cercania` | [FRASE UI SIN TRADUCIR] | "Closest to today..." |
| `match.sort.lejania` | [FRASE UI SIN TRADUCIR] | "Farthest from today..." |
| `match.sort.fecha_asc` | [FORMATO FECHA/HORA/NÚMERO] | "Date (Upcoming)..." |
| `match.sort.fecha_desc` | [OTRO] | "Date (Recent)..." |
| `match.sort.estado` | [FRASE UI SIN TRADUCIR] | "By Status / Priority..." |
| `match.view.cards` | [OTRO] | "Cards..." |
| `match.view.detailed` | [OTRO] | "Detailed..." |

#### Namespace: `matchSheet` (20 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matchSheet.prefill_smart_success` | [FRASE UI SIN TRADUCIR] | "⚡ Match sheet smartly pre-filled from lineup and events...." |
| `matchSheet.prefill_smart_error` | [FRASE UI SIN TRADUCIR] | "❌ Error in smart pre-filling...." |
| `matchSheet.prefill_rsvp_empty` | [FRASE UI SIN TRADUCIR] | "No pending RSVP responses to pre-fill...." |
| `matchSheet.prefill_rsvp_success` | [FRASE UI SIN TRADUCIR] | "✅ Statuses pre-filled from RSVP...." |
| `matchSheet.prefill_rsvp_error` | [FRASE UI SIN TRADUCIR] | "❌ Error pre-filling from RSVP...." |
| `matchSheet.tactical_grade_saved` | [FRASE UI SIN TRADUCIR] | "⭐ Tactical rating saved..." |
| `matchSheet.log_already_clean` | [FRASE UI SIN TRADUCIR] | "✨ The match log is already clean. Zero impossible events...." |
| `matchSheet.anomalies_resolved` | [FRASE UI SIN TRADUCIR] | "✔ {count} anomaly(ies) resolved and sheet synchronized...." |
| `matchSheet.log_debug_error` | [FRASE UI SIN TRADUCIR] | "❌ Error debugging log...." |
| `matchSheet.closed_with_warnings` | [FRASE UI SIN TRADUCIR] | "⚠️ Match sheet closed with recorded warnings...." |
| `matchSheet.closed_success` | [FRASE UI SIN TRADUCIR] | "✅ Match sheet closed. Real minutes saved...." |
| `matchSheet.close_error` | [FRASE UI SIN TRADUCIR] | "❌ Error closing match sheet. Please try again...." |
| `matchSheet.reopened_info` | [FRASE UI SIN TRADUCIR] | "🔓 Match sheet and match reopened for corrections...." |
| `matchSheet.reopen_error` | [FRASE UI SIN TRADUCIR] | "❌ Error reopening match sheet...." |
| `matchSheet.confirm_save_btn` | [FRASE UI SIN TRADUCIR] | "💾 CONFIRM & SAVE SHEET..." |
| *... y 5 claves adicionales en este namespace* | | |

#### Namespace: `teamMembers` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamMembers.already_member` | [FRASE UI SIN TRADUCIR] | "This user is already a member of the coaching staff...." |
| `teamMembers.invite_generated` | [FRASE UI SIN TRADUCIR] | "Invitation link and code generated successfully...." |
| `teamMembers.role_updated` | [FRASE UI SIN TRADUCIR] | "Role updated to {role}...." |
| `teamMembers.admin_only_remove` | [FRASE UI SIN TRADUCIR] | "Only the Head Coach (Admin) can remove team members...." |
| `teamMembers.member_removed` | [FRASE UI SIN TRADUCIR] | "Member removed from coaching staff...." |
| `teamMembers.invite_cancelled` | [FRASE UI SIN TRADUCIR] | "Invitation cancelled...." |

#### Namespace: `club` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `club.teams_assigned` | [FRASE UI SIN TRADUCIR] | "Teams assigned successfully...." |
| `club.teams_assign_error` | [FRASE UI SIN TRADUCIR] | "Error assigning teams...." |
| `club.team_created` | [FRASE UI SIN TRADUCIR] | "Club team created successfully...." |
| `club.team_create_error` | [FRASE UI SIN TRADUCIR] | "Error creating club team...." |

#### Namespace: `invite` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `invite.already_registered` | [FRASE UI SIN TRADUCIR] | "This email is already registered or invited to the club...." |
| `invite.generated_success` | [FRASE UI SIN TRADUCIR] | "Invitation generated successfully...." |
| `invite.generated_error` | [FRASE UI SIN TRADUCIR] | "Error generating the invitation...." |
| `invite.link_copied` | [OTRO] | "Link copied!..." |
| `invite.coach.title` | [FRASE UI SIN TRADUCIR] | "Join as Coach / Staff..." |
| `invite.coach.codePlaceholder` | [FRASE UI SIN TRADUCIR] | "Invitation code (6 characters)..." |
| `invite.coach.scanQR` | [FRASE UI SIN TRADUCIR] | "Scan invitation QR..." |
| `invite.player.scanQR` | [OTRO] | "Scan team QR..." |

#### Namespace: `livestats` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `livestats.select_player_first` | [FRASE UI SIN TRADUCIR] | "👆 Select a player first..." |
| `livestats.match_locked_use_reopen` | [FRASE UI SIN TRADUCIR] | "⚠️ Match completed — use Reopen Match Sheet to correct...." |
| `livestats.match_locked_short` | [FRASE UI SIN TRADUCIR] | "⚠️ Match completed..." |
| `livestats.post_match_saved` | [FRASE UI SIN TRADUCIR] | "✅ Post-match counters saved..." |

#### Namespace: `playerDashboard` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerDashboard.new_message` | [FRASE UI SIN TRADUCIR] | "💬 New message from Coach:..." |

#### Namespace: `joinTeam` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `joinTeam.request_approved` | [FRASE UI SIN TRADUCIR] | "Your request has been approved!..." |
| `joinTeam.already_member` | [FRASE UI SIN TRADUCIR] | "You are already on this team! Loading your portal......" |
| `joinTeam.google_sign_in` | [NOMBRE PROPIO/MARCA] | "Signed in with Google..." |
| `joinTeam.account_created` | [FRASE UI SIN TRADUCIR] | "Account created successfully..." |
| `joinTeam.welcome` | [FRASE UI SIN TRADUCIR] | "Welcome to Míster11..." |
| `joinTeam.request_sent` | [FRASE UI SIN TRADUCIR] | "Request sent to the coach!..." |

#### Namespace: `login` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `login.cancelled` | [FRASE UI SIN TRADUCIR] | "Sign-in cancelled by user..." |
| `login.account_created` | [FRASE UI SIN TRADUCIR] | "Account created successfully!..." |
| `login.welcome` | [FRASE UI SIN TRADUCIR] | "Welcome to Míster11!..." |
| `login.write_email_first` | [FRASE UI SIN TRADUCIR] | "Please enter your email first..." |
| `login.recovery_sent` | [FRASE UI SIN TRADUCIR] | "Recovery link sent to your email..." |
| `login.recovery_error` | [FRASE UI SIN TRADUCIR] | "Error sending email..." |

#### Namespace: `planning` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `planning.login_required` | [OTRO] | "Sign in to save..." |
| `planning.saved` | [FRASE UI SIN TRADUCIR] | "Planning saved ✓..." |
| `planning.save_error` | [OTRO] | "Error saving...." |
| `planning.generating_pdf` | [NOMBRE PROPIO/MARCA] | "Generating mesocycle PDF......" |
| `planning.pdf_month_not_found` | [FRASE UI SIN TRADUCIR] | "Error: Month information not found...." |
| `planning.pdf_success` | [FRASE UI SIN TRADUCIR] | "Mesocycle PDF generated successfully ✓..." |
| `planning.pdf_error` | [NOMBRE PROPIO/MARCA] | "Error exporting PDF...." |
| `planning.generating_pdf_generic` | [NOMBRE PROPIO/MARCA] | "Generating PDF......" |
| `planning.pdf_exported` | [NOMBRE PROPIO/MARCA] | "PDF exported ✓..." |

#### Namespace: `gk` (35 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `gk.title` | [FRASE UI SIN TRADUCIR] | "Goalkeeper Metrics..." |
| `gk.roleBadge` | [OTRO] | "🧤 Goalkeeper..." |
| `gk.activeGoalkeeper` | [FRASE UI SIN TRADUCIR] | "GOALKEEPER ON PITCH..." |
| `gk.noActiveGoalkeeper` | [FRASE UI SIN TRADUCIR] | "No active goalkeeper on pitch..." |
| `gk.saves` | [OTRO] | "Saves..." |
| `gk.savesShort` | [OTRO] | "Saves..." |
| `gk.conceded` | [OTRO] | "Goals Conceded..." |
| `gk.concededShort` | [OTRO] | "Conc...." |
| `gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `gk.cleanSheetsShort` | [OTRO] | "Clean Sh...." |
| `gk.penaltySaves` | [OTRO] | "Penalties Saved..." |
| `gk.penaltySavesShort` | [OTRO] | "Pen. Saved..." |
| `gk.claims` | [FRASE UI SIN TRADUCIR] | "Claims & Punches..." |
| `gk.claimsShort` | [OTRO] | "Claims..." |
| `gk.errorGoal` | [FRASE UI SIN TRADUCIR] | "Errors Leading to Goal..." |
| *... y 20 claves adicionales en este namespace* | | |

#### Namespace: `exports` (34 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exports.gk.title` | [FRASE UI SIN TRADUCIR] | "GOALKEEPING PERFORMANCE..." |
| `exports.gk.saves` | [OTRO] | "Saves..." |
| `exports.gk.conceded` | [OTRO] | "Conceded..." |
| `exports.gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `exports.gk.penaltySaves` | [OTRO] | "Pen. Saved..." |
| `exports.gk.claims` | [FRASE UI SIN TRADUCIR] | "Claims / Punches..." |
| `exports.gk.errors` | [OTRO] | "Errors..." |
| `exports.gk.rating` | [OTRO] | "GK Rating..." |
| `exports.report.title` | [FRASE UI SIN TRADUCIR] | "OFFICIAL POST-MATCH REPORT..." |
| `exports.report.sec1_lineup` | [FRASE UI SIN TRADUCIR] | "1. Tactical Lineup with Photos..." |
| `exports.report.sec2_timeline` | [FRASE UI SIN TRADUCIR] | "2. Score & Event Timeline..." |
| `exports.report.sec3_momentum` | [FRASE UI SIN TRADUCIR] | "3. Momentum & 15-Minute Possession Blocks..." |
| `exports.report.sec4_bars` | [FRASE UI SIN TRADUCIR] | "4. Comparative Bars (10 Metrics)..." |
| `exports.report.sec5_radar` | [FRASE UI SIN TRADUCIR] | "5. Normalized Comparative Radar (Own vs Opponent)..." |
| `exports.report.sec6_top5` | [FRASE UI SIN TRADUCIR] | "6. Top-5 Differential KPIs..." |
| *... y 19 claves adicionales en este namespace* | | |

#### Namespace: `shot` (32 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `shot.title` | [FRASE UI SIN TRADUCIR] | "Record Shot with Context..." |
| `shot.team_own` | [OTRO] | "Own..." |
| `shot.team_rival` | [OTRO] | "Opponent..." |
| `shot.zone` | [OTRO] | "Shot Zone..." |
| `shot.zone_inside_center` | [OTRO] | "Center (Box)..." |
| `shot.zone_inside_left` | [OTRO] | "Left Wing (Box)..." |
| `shot.zone_inside_right` | [FRASE UI SIN TRADUCIR] | "Right Wing (Box)..." |
| `shot.zone_outside_center` | [FRASE UI SIN TRADUCIR] | "Center (Outside)..." |
| `shot.zone_outside_left` | [FRASE UI SIN TRADUCIR] | "Left Wing (Outside)..." |
| `shot.zone_outside_right` | [FRASE UI SIN TRADUCIR] | "Right Wing (Outside)..." |
| `shot.zone_penalty` | [OTRO] | "Penalty Spot..." |
| `shot.playType` | [OTRO] | "Play Type..." |
| `shot.playType_jugada` | [OTRO] | "Open Play..." |
| `shot.playType_contra` | [OTRO] | "Counter Attack..." |
| `shot.playType_balon_parado` | [OTRO] | "Set Piece..." |
| *... y 17 claves adicionales en este namespace* | | |

#### Namespace: `liveStats` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `liveStats.quickMode.title` | [OTRO] | "Quick Mode..." |
| `liveStats.quickMode.advanced` | [FRASE UI SIN TRADUCIR] | "Advanced options..." |
| `liveStats.quickMode.simple` | [OTRO] | "Simple mode..." |
| `liveStats.quickMode.shotSaved` | [OTRO] | "Shot recorded..." |
| `liveStats.quickMode.undo` | [OTRO] | "Undo..." |
| `liveStats.quickMode.undone` | [OTRO] | "Shot undone..." |

#### Namespace: `rendimientoPdf` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `rendimientoPdf.title` | [FRASE UI SIN TRADUCIR] | "INDIVIDUAL PERFORMANCE REPORT..." |
| `rendimientoPdf.subtitle` | [FRASE UI SIN TRADUCIR] | "Individual player statistics and canonical metrics..." |
| `rendimientoPdf.matchDetails` | [OTRO] | "Match Details..." |
| `rendimientoPdf.generatedBy` | [NOMBRE PROPIO/MARCA] | "Generated by Mister11..." |
| `rendimientoPdf.tableTitle` | [FRASE UI SIN TRADUCIR] | "Complete Performance Table..." |

#### Namespace: `xg` (17 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `xg.title` | [FRASE UI SIN TRADUCIR] | "xG-Lite Model & Exposure..." |
| `xg.own_xg` | [OTRO] | "Own xG..." |
| `xg.rival_xg` | [OTRO] | "Opponent xG..." |
| `xg.gk_exertion` | [FRASE UI SIN TRADUCIR] | "GK Exertion Index..." |
| `xg.demanding_match` | [OTRO] | "Demanding Match..." |
| `xg.normal_match` | [FRASE UI SIN TRADUCIR] | "Controlled Exertion..." |
| `xg.rival_comfort` | [FRASE UI SIN TRADUCIR] | "Opponent Comfort..." |
| `xg.exposure_map` | [FRASE UI SIN TRADUCIR] | "Defensive Exposure Map..." |
| `xg.box_center` | [OTRO] | "Central Box..." |
| `xg.box_wings` | [OTRO] | "Lateral Box..." |
| `xg.outside_box` | [OTRO] | "Outside Box..." |
| `xg.penalty_box` | [OTRO] | "Penalty..." |
| `xg.decisive_saves` | [OTRO] | "Decisive Saves..." |
| `xg.normal_saves` | [OTRO] | "Normal Saves..." |
| `xg.total_saves` | [OTRO] | "Total Saves..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `swot` (26 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `swot.title` | [FRASE UI SIN TRADUCIR] | "Traceable SWOT Matrix..." |
| `swot.strengths` | [OTRO] | "Strengths..." |
| `swot.weaknesses` | [OTRO] | "Weaknesses..." |
| `swot.opportunities` | [OTRO] | "Opportunities..." |
| `swot.threats` | [OTRO] | "Threats..." |
| `swot.origin_metric` | [OTRO] | "Origin metric..." |
| `swot.add_manual` | [FRASE UI SIN TRADUCIR] | "Add manual observation..." |
| `swot.manual_badge` | [OTRO] | "Manual..." |
| `swot.auto_badge` | [OTRO] | "Rule..." |
| `swot.btn_generate_ai` | [FRASE UI SIN TRADUCIR] | "Draft summary with AI..." |
| `swot.generating_ai` | [FRASE UI SIN TRADUCIR] | "Drafting with AI......" |
| `swot.ai_summary_title` | [FRASE UI SIN TRADUCIR] | "Tactical Summary (AI)..." |
| `swot.no_items` | [FRASE UI SIN TRADUCIR] | "No observations recorded for this quadrant...." |
| `swot.rule.high_xg_diff` | [FRASE UI SIN TRADUCIR] | "High attacking creation volume outperforming opponent in cle..." |
| `swot.rule.low_xg_conv` | [FRASE UI SIN TRADUCIR] | "Chances created with low conversion rate, requiring finishin..." |
| *... y 11 claves adicionales en este namespace* | | |

#### Namespace: `capture` (17 claves idénticas a EN)
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
| `capture.criteria.title` | [FRASE UI SIN TRADUCIR] | "Capture Criteria Manual..." |
| `capture.refine_title` | [FRASE UI SIN TRADUCIR] | "Refine individual attribution (optional)..." |
| `capture.refine_empty` | [FRASE UI SIN TRADUCIR] | "Nothing pending ✅..." |
| `capture.refine_skip` | [OTRO] | "Skip..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `sector` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sector.activeZone` | [FRASE UI SIN TRADUCIR] | "Active Zone: {zone}..." |

#### Namespace: `stats` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `stats.eventMap.title` | [OTRO] | "Zone Event Map..." |
| `stats.eventMap.guide` | [FRASE UI SIN TRADUCIR] | "Spatial distribution of team actions (recoveries, duels, sho..." |
| `stats.eventMap.pass_insufficient` | [FRASE UI SIN TRADUCIR] | "Pass network unavailable: At least 5 recorded passes are req..." |
| `stats.passNetwork.guide` | [FRASE UI SIN TRADUCIR] | "Each node represents a player's average position and line th..." |
| `stats.theater.theater_mode` | [OTRO] | "Theater Mode..." |
| `stats.theater.fullscreen` | [OTRO] | "Fullscreen..." |
| `stats.theater.exit_fullscreen` | [OTRO] | "Exit Fullscreen..." |

#### Namespace: `error` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `error.section_unavailable` | [FRASE UI SIN TRADUCIR] | "Section temporarily unavailable..." |
| `error.section_desc` | [FRASE UI SIN TRADUCIR] | "An isolated anomaly occurred while rendering this section. T..." |
| `error.retry_section` | [OTRO] | "Retry..." |
| `error.section_code` | [OTRO] | "Code: {code}..." |

#### Namespace: `charts` (11 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `charts.guide.radar` | [FRASE UI SIN TRADUCIR] | "Visualizes tactical balance across 6 dimensions between own ..." |
| `charts.guide.bars` | [FRASE UI SIN TRADUCIR] | "Quantitative comparison of the 10 key gameplay metrics...." |
| `charts.guide.momentum` | [FRASE UI SIN TRADUCIR] | "Evolution of match dominance and control in 15-minute interv..." |
| `charts.guide.shots` | [FRASE UI SIN TRADUCIR] | "Shot distribution and expected goals (xG) probability model...." |
| `charts.guide.zones` | [FRASE UI SIN TRADUCIR] | "Territorial distribution of team interventions across 9 pitc..." |
| `charts.insights.finishing_deficit` | [FRASE UI SIN TRADUCIR] | "Finishing Efficiency: High volume of scoring chances with de..." |
| `charts.insights.defensive_alert` | [FRASE UI SIN TRADUCIR] | "Defensive Alert: Opponent generated clear chances with high ..." |
| `charts.insights.dominant_zone` | [FRASE UI SIN TRADUCIR] | "Dominant Zone: Over 40% of actions concentrated in this area..." |
| `charts.pass_insufficient_tooltip` | [FRASE UI SIN TRADUCIR] | "At least 5 recorded passes required to generate tactical pas..." |
| `charts.view.pass_network` | [OTRO] | "Pass Network..." |
| `charts.view.territorial_map` | [OTRO] | "Territorial Map..." |

#### Namespace: `pricing` (59 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pricing.header.title` | [FRASE UI SIN TRADUCIR] | "Transparent Pricing for Coaches & Academies..." |
| `pricing.header.subtitle` | [FRASE UI SIN TRADUCIR] | "All prices include VAT. Annual season pass grants 10 full mo..." |
| `pricing.billing.season` | [FRASE UI SIN TRADUCIR] | "Full Season Pass (10 Months)..." |
| `pricing.billing.discountBadge` | [OTRO] | "2 MONTHS FREE..." |
| `pricing.billing.monthly` | [OTRO] | "Monthly..." |
| `pricing.plan.free.name` | [OTRO] | "Free Plan..." |
| `pricing.plan.free.tagline` | [FRASE UI SIN TRADUCIR] | "To start digitizing your team..." |
| `pricing.plan.pro.name` | [OTRO] | "PRO Plan..." |
| `pricing.plan.pro.tagline` | [FRASE UI SIN TRADUCIR] | "For the coach seeking maximum performance..." |
| `pricing.plan.clubStarter.name` | [OTRO] | "Club Starter..." |
| `pricing.plan.clubStarter.tagline` | [FRASE UI SIN TRADUCIR] | "For growing academies and clubs..." |
| `pricing.plan.clubPro.name` | [OTRO] | "Club PRO..." |
| `pricing.plan.clubPro.tagline` | [FRASE UI SIN TRADUCIR] | "For structured clubs with their own methodology..." |
| `pricing.plan.clubPremium.name` | [OTRO] | "Club Premium..." |
| `pricing.plan.clubPremium.tagline` | [FRASE UI SIN TRADUCIR] | "For high-performance multi-site academies..." |
| *... y 44 claves adicionales en este namespace* | | |

#### Namespace: `staffHeredado` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffHeredado.badgeActive` | [FRASE UI SIN TRADUCIR] | "PRO features active via {ownerName}'s plan..." |
| `staffHeredado.badgeActiveShort` | [FRASE UI SIN TRADUCIR] | "Inherited Plan ({ownerName})..." |
| `staffHeredado.gracePeriodBanner` | [FRASE UI SIN TRADUCIR] | "Subscription Notice: The owner's plan has changed. The team ..." |
| `staffHeredado.gracePeriodBlocked` | [FRASE UI SIN TRADUCIR] | "Restricted Access: The team grace period has expired. The ow..." |
| `staffHeredado.transferLimitExceeded` | [FRASE UI SIN TRADUCIR] | "This user already owns a team on their Free plan. They must ..." |
| `staffHeredado.transferError` | [FRASE UI SIN TRADUCIR] | "Error transferring team ownership...." |
| `staffHeredado.restrictedFeatureStaff` | [FRASE UI SIN TRADUCIR] | "This feature requires the team to have an active PRO plan fr..." |

#### Namespace: `playerProfile` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerProfile.physicalStats` | [OTRO] | "Physical Stats..." |
| `playerProfile.heightLabel` | [OTRO] | "Height..." |
| `playerProfile.weightLabel` | [OTRO] | "Weight..." |
| `playerProfile.ageLabel` | [OTRO] | "Age..." |
| `playerProfile.heightUnit` | [OTRO] | "cm..." |
| `playerProfile.weightUnit` | [OTRO] | "kg..." |
| `playerProfile.heightRangeError` | [FRASE UI SIN TRADUCIR] | "Height must be between 100 and 230 cm...." |
| `playerProfile.weightRangeError` | [FRASE UI SIN TRADUCIR] | "Weight must be between 30 and 150 kg...." |
| `playerProfile.statsSaved` | [FRASE UI SIN TRADUCIR] | "Physical stats updated successfully...." |
| `playerProfile.saveError` | [FRASE UI SIN TRADUCIR] | "Error saving physical stats...." |
| `playerProfile.bmi` | [SIGLA/ACRÓNIMO] | "BMI..." |
| `playerProfile.bmiDesc` | [FRASE UI SIN TRADUCIR] | "Estimated Body Mass Index...." |
| `playerProfile.editTooltip` | [FRASE UI SIN TRADUCIR] | "Tap to edit your measurements..." |
| `playerProfile.readOnlyNotice` | [FRASE UI SIN TRADUCIR] | "Age, shirt number and position can only be modified by coach..." |

#### Namespace: `sessionRating` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sessionRating.subtitle` | [FRASE UI SIN TRADUCIR] | "Rate performance of called-up players (0 to 10)..." |
| `sessionRating.rateButton` | [OTRO] | "Rate..." |
| `sessionRating.savedSuccess` | [FRASE UI SIN TRADUCIR] | "Training session ratings saved successfully...." |
| `sessionRating.saveError` | [FRASE UI SIN TRADUCIR] | "Error saving session ratings...." |
| `sessionRating.commentPlaceholder` | [FRASE UI SIN TRADUCIR] | "Coaching notes or feedback (optional, max 200 chars)..." |
| `sessionRating.ratingLabel` | [OTRO] | "Score..." |
| `sessionRating.performanceTableTitle` | [FRASE UI SIN TRADUCIR] | "Training Performance..." |
| `sessionRating.performanceTableSubtitle` | [FRASE UI SIN TRADUCIR] | "Last 5 rated sessions and accumulated average..." |
| `sessionRating.averageRating` | [OTRO] | "Avg..." |
| `sessionRating.noRatings` | [FRASE UI SIN TRADUCIR] | "No ratings recorded for this session yet...." |
| `sessionRating.evolutionTitle` | [FRASE UI SIN TRADUCIR] | "Training Evolution..." |
| `sessionRating.radarAxisTraining` | [OTRO] | "Training..." |

#### Namespace: `notifPrefs` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifPrefs.savedToast` | [FRASE UI SIN TRADUCIR] | "Notification preferences saved successfully..." |
| `notifPrefs.errorToast` | [FRASE UI SIN TRADUCIR] | "Error saving notification preferences..." |
| `notifPrefs.title` | [FRASE UI SIN TRADUCIR] | "Notification Preferences..." |
| `notifPrefs.wellnessTitle` | [FRASE UI SIN TRADUCIR] | "Wellness Check-in..." |
| `notifPrefs.wellnessDesc` | [FRASE UI SIN TRADUCIR] | "Daily reminder to fill out your health form..." |
| `notifPrefs.reminderTime` | [FORMATO FECHA/HORA/NÚMERO] | "Reminder Time..." |
| `notifPrefs.chatDesc` | [FRASE UI SIN TRADUCIR] | "Alerts for new messages in team squad chat..." |
| `notifPrefs.matchTitle` | [FRASE UI SIN TRADUCIR] | "Match & Call-ups..." |
| `notifPrefs.matchDesc` | [FRASE UI SIN TRADUCIR] | "Alerts for call-up rosters, schedules and upcoming matches..." |
| `notifPrefs.quietHoursTitle` | [OTRO] | "Quiet Hours..." |
| `notifPrefs.quietHoursDesc` | [FRASE UI SIN TRADUCIR] | "Do not receive push notifications during this time window..." |
| `notifPrefs.quietHoursStart` | [FRASE UI SIN TRADUCIR] | "Quiet start time..." |
| `notifPrefs.quietHoursEnd` | [OTRO] | "Quiet end time..." |
| `notifPrefs.frequencyCapTitle` | [OTRO] | "Frequency Cap..." |
| `notifPrefs.frequencyCapDesc` | [FRASE UI SIN TRADUCIR] | "Maximum number of notifications per day..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `csv` (29 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `csv.errorEmptyFile` | [FRASE UI SIN TRADUCIR] | "The selected file is empty...." |
| `csv.errorParsing` | [FRASE UI SIN TRADUCIR] | "Could not read file. Check CSV or Excel formatting...." |
| `csv.errorUnsupportedFormat` | [FRASE UI SIN TRADUCIR] | "Unsupported format. Use .csv or .xlsx files...." |
| `csv.errorInvalidNumber` | [FRASE UI SIN TRADUCIR] | "Shirt number must be an integer between 1 and 99...." |
| `csv.errorDuplicateNumberTeam` | [FRASE UI SIN TRADUCIR] | "Shirt number is already taken in this team...." |
| `csv.errorDuplicateNumberFile` | [FRASE UI SIN TRADUCIR] | "Duplicate shirt number within the file...." |
| `csv.errorInvalidPosition` | [FRASE UI SIN TRADUCIR] | "Invalid position. Use GK, DEF, MID, FWD or equivalent...." |
| `csv.errorPlanLimitExceeded` | [FRASE UI SIN TRADUCIR] | "You have reached the maximum players allowed by your plan...." |
| `csv.importSuccessToast` | [FRASE UI SIN TRADUCIR] | "{count} players imported successfully...." |
| `csv.importErrorToast` | [FRASE UI SIN TRADUCIR] | "An error occurred while importing players...." |
| `csv.stepUpload` | [OTRO] | "Upload..." |
| `csv.stepMapping` | [OTRO] | "Mapping..." |
| `csv.stepPreview` | [OTRO] | "Preview..." |
| `csv.dropzoneTitle` | [FRASE UI SIN TRADUCIR] | "Drag and drop your file here or click to browse..." |
| `csv.dropzoneDesc` | [FRASE UI SIN TRADUCIR] | "Supported files: .csv, .xlsx, .xls (max 5MB)..." |
| *... y 14 claves adicionales en este namespace* | | |

#### Namespace: `qrScanner` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `qrScanner.unsupportedBrowser` | [FRASE UI SIN TRADUCIR] | "Your browser or device does not support camera access...." |
| `qrScanner.cameraPermissionError` | [FRASE UI SIN TRADUCIR] | "Could not access camera. Please check browser permissions...." |
| `qrScanner.noQrInImage` | [FRASE UI SIN TRADUCIR] | "No QR code detected in the selected image...." |
| `qrScanner.uploadQrPhoto` | [OTRO] | "Upload QR photo..." |
| `qrScanner.hint` | [FRASE UI SIN TRADUCIR] | "Point your camera at the QR code provided by the coach to jo..." |

#### Namespace: `teamQr` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamQr.linkCopiedToast` | [FRASE UI SIN TRADUCIR] | "Invitation link copied to clipboard..." |
| `teamQr.scanInstructions` | [FRASE UI SIN TRADUCIR] | "Show this QR code to your players or share the direct link s..." |
| `teamQr.teamCodeLabel` | [OTRO] | "Access Code:..." |
| `teamQr.copied` | [OTRO] | "Copied..." |
| `teamQr.copyCode` | [OTRO] | "Copy Code..." |
| `teamQr.shareLink` | [OTRO] | "Share Link..." |

#### Namespace: `errors` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `errors.codeInvalid` | [FRASE UI SIN TRADUCIR] | "Invalid code. Must have 6 characters...." |
| `errors.codeExpired` | [FRASE UI SIN TRADUCIR] | "This invitation has expired...." |
| `errors.codeAlreadyUsed` | [FRASE UI SIN TRADUCIR] | "This code has already been used...." |

#### Namespace: `staffJoin` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffJoin.title` | [FRASE UI SIN TRADUCIR] | "Join Technical Staff..." |
| `staffJoin.subtitle` | [FRASE UI SIN TRADUCIR] | "Enter the 6-character code provided by the head coach or pas..." |
| `staffJoin.inputPlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. STF-ABC123 or ABC123..." |
| `staffJoin.orPasteLink` | [FRASE UI SIN TRADUCIR] | "Have an invite link? Paste it here:..." |
| `staffJoin.linkPlaceholder` | [OTRO] | "https://mister11.com/join-staff?code=ABC123..." |
| `staffJoin.searching` | [FRASE UI SIN TRADUCIR] | "Validating code in real time......" |
| `staffJoin.assignedRole` | [OTRO] | "Assigned Role:..." |
| `staffJoin.confirmJoin` | [FRASE UI SIN TRADUCIR] | "CONFIRM AND JOIN STAFF..." |
| `staffJoin.success` | [FRASE UI SIN TRADUCIR] | "You have successfully joined the Technical Staff!..." |
| `staffJoin.errors.invalidCode` | [FRASE UI SIN TRADUCIR] | "Invalid or expired staff code. Contact the head coach...." |

#### Namespace: `staffInvite` (22 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffInvite.cardTitle` | [FRASE UI SIN TRADUCIR] | "ACCESS CODE FOR COACHES / STAFF..." |
| `staffInvite.cardSubtitle` | [FRASE UI SIN TRADUCIR] | "Exclusive code to link assistants, fitness coaches, and anal..." |
| `staffInvite.copyCode` | [OTRO] | "Copy Code..." |
| `staffInvite.codeCopied` | [FRASE UI SIN TRADUCIR] | "Staff code copied..." |
| `staffInvite.shareLink` | [OTRO] | "Share Link..." |
| `staffInvite.linkCopied` | [FRASE UI SIN TRADUCIR] | "Staff link copied..." |
| `staffInvite.qrModal` | [OTRO] | "View Staff QR..." |
| `staffInvite.inviteEmail` | [FRASE UI SIN TRADUCIR] | "Invite via Email..." |
| `staffInvite.joinTitle` | [FRASE UI SIN TRADUCIR] | "ACCESS CODE FOR COACHES / STAFF..." |
| `staffInvite.joinSubtitle` | [FRASE UI SIN TRADUCIR] | "If you were invited by the head coach, enter your code here...." |
| `staffInvite.inputPlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. ABC123 or STF-ABC123..." |
| `staffInvite.joinBtn` | [OTRO] | "JOIN TEAM..." |
| `staffInvite.modalTitle` | [FRASE UI SIN TRADUCIR] | "Invite Technical Staff Member..." |
| `staffInvite.emailLabel` | [FRASE UI SIN TRADUCIR] | "Collaborator email address:..." |
| `staffInvite.roleLabel` | [OTRO] | "Assigned role:..." |
| *... y 7 claves adicionales en este namespace* | | |

#### Namespace: `convocation` (39 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `convocation.title` | [OTRO] | "Convocation..." |
| `convocation.tab` | [OTRO] | "Squad List..." |
| `convocation.selectPlayers` | [FRASE UI SIN TRADUCIR] | "Select called-up players..." |
| `convocation.counter` | [FRASE UI SIN TRADUCIR] | "{count}/18 selected..." |
| `convocation.limitReached` | [FRASE UI SIN TRADUCIR] | "Limit reached: maximum 18 players selected..." |
| `convocation.generate` | [FRASE UI SIN TRADUCIR] | "Generate convocation PNG..." |
| `convocation.generating` | [FRASE UI SIN TRADUCIR] | "Generating PNG......" |
| `convocation.downloading` | [OTRO] | "Downloading......" |
| `convocation.sendToPlayers` | [OTRO] | "Send to players..." |
| `convocation.message` | [FRASE UI SIN TRADUCIR] | "Announcement message..." |
| `convocation.defaultMessage` | [FRASE UI SIN TRADUCIR] | "Call-up squad for the match vs {opponent}. Please check the ..." |
| `convocation.send` | [OTRO] | "Send..." |
| `convocation.sending` | [OTRO] | "Sending......" |
| `convocation.coachLabel` | [FRASE UI SIN TRADUCIR] | "COACH / ENTRENADOR..." |
| `convocation.cleanSelection` | [OTRO] | "Clear selection..." |
| *... y 24 claves adicionales en este namespace* | | |

#### Namespace: `whiteboard` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `whiteboard.exportingFrame` | [FRASE UI SIN TRADUCIR] | "Exporting frame {current} of {total}......" |
| `whiteboard.exportSuccess` | [FRASE UI SIN TRADUCIR] | "MP4 video exported successfully...." |
| `whiteboard.exportError` | [FRASE UI SIN TRADUCIR] | "Error exporting MP4 video. Please try again...." |
| `whiteboard.exportRetry` | [OTRO] | "Retry export..." |

#### Namespace: `exerciseCatalog` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exerciseCatalog.sourceLabel` | [OTRO] | "Source..." |


---

## 1. Lengua: `ID` (Total Claves Idénticas a EN: 1955)

### Resumen por Categoría:

| Categoría | Conteo | Porcentaje |
|---|---|---|
| **[SIGLA/ACRÓNIMO]** | 78 | 4.0% |
| **[NOMBRE PROPIO/MARCA]** | 26 | 1.3% |
| **[FORMATO FECHA/HORA/NÚMERO]** | 24 | 1.2% |
| **[ABREVIATURA PIZARRA]** | 3 | 0.2% |
| **[FRASE UI SIN TRADUCIR]** | 1008 | 51.6% |
| **[OTRO]** | 816 | 41.7% |

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

#### Namespace: `common` (15 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `common.starter` | [OTRO] | "Starter..." |
| `common.optimal` | [OTRO] | "Optimal..." |
| `common.email` | [OTRO] | "Email..." |
| `common.originalLanguage` | [FRASE UI SIN TRADUCIR] | "Original language..." |
| `common.originalLanguageEs` | [FRASE UI SIN TRADUCIR] | "Original language: Spanish..." |
| `common.originalLanguageEn` | [FRASE UI SIN TRADUCIR] | "Original language: English..." |
| `common.originalBadgeEs` | [OTRO] | "ES original..." |
| `common.originalBadgeEn` | [OTRO] | "EN original..." |
| `common.all` | [SIGLA/ACRÓNIMO] | "ALL..." |
| `common.edit` | [OTRO] | "Edit..." |
| `common.loading` | [OTRO] | "Loading......" |
| `common.savedSuccess` | [FRASE UI SIN TRADUCIR] | "Saved successfully..." |
| `common.errorGeneral` | [FRASE UI SIN TRADUCIR] | "An unexpected error occurred..." |
| `common.success` | [FRASE UI SIN TRADUCIR] | "Operation completed successfully..." |
| `common.genericError` | [OTRO] | "Operation error..." |

#### Namespace: `notifications` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifications.empty` | [FRASE UI SIN TRADUCIR] | "You have no pending notifications...." |
| `notifications.timeNow` | [OTRO] | "Now..." |
| `notifications.timeJustNow` | [OTRO] | "Just now..." |
| `notifications.timeMinAgo` | [FORMATO FECHA/HORA/NÚMERO] | "{min} min ago..." |
| `notifications.timeHoursAgo` | [FRASE UI SIN TRADUCIR] | "{hours} hours ago..." |
| `notifications.newExerciseSaved` | [FRASE UI SIN TRADUCIR] | "New exercise saved: {name}..." |
| `notifications.predefinedExerciseError` | [FRASE UI SIN TRADUCIR] | "You cannot delete a system predefined exercise...." |
| `notifications.newSessionCreated` | [FRASE UI SIN TRADUCIR] | "New session created: {title}..." |
| `notifications.newPlayerAdded` | [FRASE UI SIN TRADUCIR] | "New player added: {name}..." |
| `notifications.individualPlanAssigned` | [FRASE UI SIN TRADUCIR] | "Individual plan assigned successfully..." |
| `notifications.individualPlanRemoved` | [FRASE UI SIN TRADUCIR] | "Individual plan removed..." |
| `notifications.newMatchRegistered` | [FRASE UI SIN TRADUCIR] | "New match registered vs {opponent}..." |

#### Namespace: `dashboard` (38 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `dashboard.welcome` | [OTRO] | "Hello, {name}..." |
| `dashboard.activity` | [FRASE UI SIN TRADUCIR] | "Here is your team activity ({club}) for this week...." |
| `dashboard.today` | [OTRO] | "Today..." |
| `dashboard.devAccess` | [NOMBRE PROPIO/MARCA] | "Developer Access - Mister11 PRO..." |
| `dashboard.devDesc` | [FRASE UI SIN TRADUCIR] | "Your account has lifetime access with all limits removed...." |
| `dashboard.devUnlimited` | [FRASE UI SIN TRADUCIR] | "✔ UNLIMITED DEVELOPER..." |
| `dashboard.stats.rival` | [OTRO] | "Next Opponent..." |
| `dashboard.stats.noRival` | [OTRO] | "No opponent..." |
| `dashboard.estimatedWorkload` | [FRASE UI SIN TRADUCIR] | "Estimated Workload..." |
| `dashboard.period.session` | [OTRO] | "This session..." |
| `dashboard.period.week` | [OTRO] | "This week..." |
| `dashboard.period.micro` | [OTRO] | "This microcycle..." |
| `dashboard.period.meso` | [OTRO] | "This mesocycle..." |
| `dashboard.period.macro` | [OTRO] | "This macrocycle..." |
| `dashboard.viewAll` | [OTRO] | "View all..." |
| *... y 23 claves adicionales en este namespace* | | |

#### Namespace: `session` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `session.untitled` | [OTRO] | "Untitled..." |

#### Namespace: `day` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `day.Lun` | [OTRO] | "Mon..." |
| `day.Mar` | [OTRO] | "Tue..." |
| `day.Mié` | [OTRO] | "Wed..." |
| `day.Jue` | [OTRO] | "Thu..." |
| `day.Vie` | [OTRO] | "Fri..." |
| `day.Sáb` | [OTRO] | "Sat..." |
| `day.Dom` | [OTRO] | "Sun..." |

#### Namespace: `block` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `block.warmup` | [OTRO] | "Warm-up..." |
| `block.abp` | [OTRO] | "Set Pieces..." |
| `block.physical` | [OTRO] | "Physical..." |

#### Namespace: `month` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `month.Sep` | [OTRO] | "Sep..." |
| `month.Oct` | [OTRO] | "Oct..." |
| `month.Nov` | [OTRO] | "Nov..." |
| `month.Dic` | [OTRO] | "Dec..." |
| `month.Ene` | [OTRO] | "Jan..." |
| `month.Feb` | [OTRO] | "Feb..." |
| `month.Mar` | [OTRO] | "Mar..." |
| `month.Abr` | [OTRO] | "Apr..." |
| `month.May` | [OTRO] | "May..." |
| `month.Jun` | [OTRO] | "Jun..." |
| `month.Jul` | [OTRO] | "Jul..." |
| `month.Ago` | [OTRO] | "Aug..." |

#### Namespace: `page` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `page.ia` | [OTRO] | "AI GENERATOR..." |
| `page.default` | [OTRO] | "MISTER 11..." |

#### Namespace: `bottomnav` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `bottomnav.home` | [OTRO] | "Home..." |
| `bottomnav.pizarra` | [OTRO] | "Board..." |
| `bottomnav.ia` | [SIGLA/ACRÓNIMO] | "AI..." |
| `bottomnav.tests` | [OTRO] | "Tests..." |
| `bottomnav.admin` | [FORMATO FECHA/HORA/NÚMERO] | "Admin..." |
| `bottomnav.more` | [OTRO] | "More..." |
| `bottomnav.moreModules` | [FRASE UI SIN TRADUCIR] | "Modules & Management..." |
| `bottomnav.planificacion` | [OTRO] | "Planning..." |

#### Namespace: `paywall` (19 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `paywall.title` | [FRASE UI SIN TRADUCIR] | "Unlock Full Potential..." |
| `paywall.proBadge` | [OTRO] | "PRO PLAN..." |
| `paywall.clubBadge` | [OTRO] | "CLUB PLAN..." |
| `paywall.freeLimitMsg` | [FRASE UI SIN TRADUCIR] | "You have reached the free plan limit...." |
| `paywall.upgradeBtn` | [OTRO] | "Upgrade to PRO..." |
| `paywall.upgradeClubBtn` | [OTRO] | "View CLUB Plans..." |
| `paywall.benefit1` | [FRASE UI SIN TRADUCIR] | "Unlimited training sessions..." |
| `paywall.benefit2` | [FRASE UI SIN TRADUCIR] | "Unlimited AI task generator..." |
| `paywall.benefit4` | [FRASE UI SIN TRADUCIR] | "Advanced statistics and metrics suite..." |
| `paywall.androidDialogTitle` | [FRASE UI SIN TRADUCIR] | "Míster11 PRO Plans..." |
| `paywall.androidDialogText` | [FRASE UI SIN TRADUCIR] | "Subscriptions are centrally managed on our web platform. Vis..." |
| `paywall.androidOpenWeb` | [FRASE UI SIN TRADUCIR] | "Open mister11.app..." |
| `paywall.androidHaveCode` | [FRASE UI SIN TRADUCIR] | "I already have a code..." |
| `paywall.androidNotNow` | [OTRO] | "Not now..." |
| `paywall.androidRedeemTitle` | [OTRO] | "Redeem Code..." |
| *... y 4 claves adicionales en este namespace* | | |

#### Namespace: `auth` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `auth.loginTitle` | [OTRO] | "Sign In..." |
| `auth.registerTitle` | [OTRO] | "Create Account..." |
| `auth.password` | [OTRO] | "Password..." |
| `auth.loginBtn` | [NOMBRE PROPIO/MARCA] | "Enter Mister11..." |
| `auth.googleBtn` | [NOMBRE PROPIO/MARCA] | "Continue with Google..." |
| `auth.noAccount` | [FRASE UI SIN TRADUCIR] | "Don't have an account?..." |
| `auth.hasAccount` | [FRASE UI SIN TRADUCIR] | "Already have an account?..." |
| `auth.registerLink` | [FRASE UI SIN TRADUCIR] | "Sign up for free..." |
| `auth.loginLink` | [OTRO] | "Log in..." |
| `auth.forgotPass` | [FRASE UI SIN TRADUCIR] | "Forgot password?..." |
| `auth.coachRole` | [FRASE UI SIN TRADUCIR] | "I am Coach / Staff..." |
| `auth.parentRole` | [FRASE UI SIN TRADUCIR] | "I am Parent / Guardian..." |
| `auth.teamCode` | [FRASE UI SIN TRADUCIR] | "Invitation Code (6 characters)..." |
| `auth.joinBtn` | [OTRO] | "Send Request..." |
| `auth.logout` | [OTRO] | "Log Out..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `live` (23 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `live.btn.shot_on_own` | [FRASE UI SIN TRADUCIR] | "Shot on Target (Own)..." |
| `live.btn.shot_on_rival` | [FRASE UI SIN TRADUCIR] | "Shot on Target (Opponent)..." |
| `live.btn.shot_off_own` | [FRASE UI SIN TRADUCIR] | "Shot off Target (Own)..." |
| `live.btn.shot_off_rival` | [FRASE UI SIN TRADUCIR] | "Shot off Target (Opponent)..." |
| `live.btn.recovery` | [OTRO] | "Ball Recovery..." |
| `live.btn.loss` | [OTRO] | "Ball Loss..." |
| `live.btn.duel_won` | [OTRO] | "Duel Won..." |
| `live.btn.duel_lost` | [OTRO] | "Duel Lost..." |
| `live.btn.foul_favor` | [OTRO] | "Foul in Favor..." |
| `live.btn.foul_against` | [OTRO] | "Foul Against..." |
| `live.btn.counter_not_cut` | [OTRO] | "Uncut Counter..." |
| `live.btn.player_no_finish` | [OTRO] | "Unfinished Play..." |
| `live.btn.card_yellow_own` | [FRASE UI SIN TRADUCIR] | "Yellow Card (Own)..." |
| `live.btn.card_red_own` | [OTRO] | "Red Card (Own)..." |
| `live.btn.card_yellow_rival` | [FRASE UI SIN TRADUCIR] | "Yellow Card (Opponent)..." |
| *... y 8 claves adicionales en este namespace* | | |

#### Namespace: `test` (114 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `test.completedSuccess` | [FRASE UI SIN TRADUCIR] | "Test {name} completed successfully! ({pct}%)..." |
| `test.errorSaving` | [FRASE UI SIN TRADUCIR] | "Error saving test. Please try again...." |
| `test.question` | [OTRO] | "Question..." |
| `test.of` | [OTRO] | "of..." |
| `test.dimension` | [OTRO] | "Dimension..." |
| `test.previous` | [OTRO] | "Previous..." |
| `test.finishAndSend` | [FRASE UI SIN TRADUCIR] | "FINISH AND SUBMIT TO COACH..." |
| `test.tabTitle` | [FRASE UI SIN TRADUCIR] | "Tests & Self-Assessments..." |
| `test.tabSubtitle` | [FRASE UI SIN TRADUCIR] | "Complete these questionnaires from your mobile to boost mind..." |
| `test.questionsCount` | [FRASE UI SIN TRADUCIR] | "{count} questions..." |
| `test.lastResult` | [OTRO] | "Last result..." |
| `test.repeatTest` | [OTRO] | "Retake Test..." |
| `test.startTest` | [FRASE UI SIN TRADUCIR] | "Start Questionnaire..." |
| `test.initialEvaluationRegistered` | [FRASE UI SIN TRADUCIR] | "Initial evaluation recorded..." |
| `test.retakeTest` | [FRASE UI SIN TRADUCIR] | "Retake Questionnaire..." |
| *... y 99 claves adicionales en este namespace* | | |

#### Namespace: `admin` (31 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `admin.title` | [FORMATO FECHA/HORA/NÚMERO] | "Admin Dashboard..." |
| `admin.tab.equipos` | [OTRO] | "Teams..." |
| `admin.tab.club` | [OTRO] | "Club..." |
| `admin.tab.general` | [OTRO] | "General..." |
| `admin.tab.suscripcion` | [OTRO] | "Subscription..." |
| `admin.lang.title` | [OTRO] | "System Language..." |
| `admin.theme.dark` | [OTRO] | "Dark Mode..." |
| `admin.manageSubAndroidMsg` | [FRASE UI SIN TRADUCIR] | "Manage your subscription from mister11.app..." |
| `admin.account_deleted` | [FRASE UI SIN TRADUCIR] | "Your coach account and data have been deleted successfully...." |
| `admin.svg_shield_saved` | [FRASE UI SIN TRADUCIR] | "SVG vector shield saved successfully!..." |
| `admin.shield_saved` | [FRASE UI SIN TRADUCIR] | "Shield saved and optimized successfully!..." |
| `admin.shield_error` | [FRASE UI SIN TRADUCIR] | "Could not upload or process the image...." |
| `admin.profile_synced` | [FRASE UI SIN TRADUCIR] | "Coach profile synced across the entire system...." |
| `admin.profile_error` | [FRASE UI SIN TRADUCIR] | "Error saving profile...." |
| `admin.team_identity_error` | [FRASE UI SIN TRADUCIR] | "Error updating team identity...." |
| *... y 16 claves adicionales en este namespace* | | |

#### Namespace: `equipo` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `equipo.tab.squad` | [OTRO] | "Squad..." |
| `equipo.tab.attendance` | [OTRO] | "Attendance..." |
| `equipo.tab.staff` | [OTRO] | "Coaching Staff..." |
| `equipo.loadingSquad` | [FRASE UI SIN TRADUCIR] | "Loading squad......" |
| `equipo.publishAnnouncement` | [FRASE UI SIN TRADUCIR] | "Publish Announcement..." |

#### Namespace: `partidos` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `partidos.tab.analisis` | [OTRO] | "Analysis..." |

#### Namespace: `plan` (24 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plan.tab.macrociclo` | [OTRO] | "MACROCYCLE..." |
| `plan.tab.mesociclo` | [OTRO] | "MESOCYCLE..." |
| `plan.tab.microciclo` | [OTRO] | "MICROCYCLE..." |
| `plan.tab.objetivos` | [OTRO] | "OBJECTIVES..." |
| `plan.strategicPlanning` | [FRASE UI SIN TRADUCIR] | "STRATEGIC PLANNING..." |
| `plan.saving` | [OTRO] | "SAVING......" |
| `plan.dateRange` | [OTRO] | "DATE RANGE..." |
| `plan.start` | [OTRO] | "Start..." |
| `plan.end` | [OTRO] | "End..." |
| `plan.trainingDays` | [OTRO] | "TRAINING DAYS..." |
| `plan.fatigaWarning` | [FRASE UI SIN TRADUCIR] | "⚠️ Training on MD-1 — potential fatigue..." |
| `plan.reubicarBtn` | [FRASE UI SIN TRADUCIR] | "🔄 Reschedule training based on new day..." |
| `plan.category` | [SIGLA/ACRÓNIMO] | "CATEGORY..." |
| `plan.coach` | [SIGLA/ACRÓNIMO] | "COACH..." |
| `plan.seasonVolume` | [OTRO] | "SEASON VOLUME..." |
| *... y 9 claves adicionales en este namespace* | | |

#### Namespace: `sesiones` (27 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sesiones.tab.captures` | [OTRO] | "Captures..." |
| `sesiones.tab.animations` | [OTRO] | "Animations..." |
| `sesiones.fieldMode` | [OTRO] | "Field Mode..." |
| `sesiones.views.day` | [SIGLA/ACRÓNIMO] | "DAY..." |
| `sesiones.views.week` | [SIGLA/ACRÓNIMO] | "WEEK..." |
| `sesiones.views.month` | [SIGLA/ACRÓNIMO] | "MONTH..." |
| `sesiones.clickDayToView` | [FRASE UI SIN TRADUCIR] | "Click a day to view sessions..." |
| `sesiones.noDiagram` | [OTRO] | "No diagram..." |
| `sesiones.actions.edit` | [OTRO] | "Edit..." |
| `sesiones.actions.share` | [OTRO] | "Share..." |
| `sesiones.blockCount.one` | [OTRO] | "{count} Block..." |
| `sesiones.blockCount.other` | [OTRO] | "{count} Blocks..." |
| `sesiones.categories.all` | [OTRO] | "All..." |
| `sesiones.categories.fisica` | [OTRO] | "Physical..." |
| `sesiones.categories.mixta` | [OTRO] | "Mixed..." |
| *... y 12 claves adicionales en este namespace* | | |

#### Namespace: `tests` (17 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `tests.tab.fisicos` | [OTRO] | "Fitness Tests..." |
| `tests.tab.psicosociales` | [OTRO] | "Psychosocial..." |
| `tests.tab.prevencion` | [FRASE UI SIN TRADUCIR] | "Health & Prevention..." |
| `tests.tab.historial` | [OTRO] | "History..." |
| `tests.tab.comparativa` | [OTRO] | "Comparison..." |
| `tests.resources.title` | [FRASE UI SIN TRADUCIR] | "Resources & Tools..." |
| `tests.resources.tacticalTest` | [OTRO] | "Tactical Test..." |
| `tests.resources.seasonReport` | [OTRO] | "Season Report..." |
| `tests.resources.myTeam` | [OTRO] | "My Squad..." |
| `tests.rpe.save` | [OTRO] | "SAVE RPE..." |
| `tests.createTest` | [OTRO] | "+ Create Test..." |
| `tests.success` | [OTRO] | "Success..." |
| `tests.error` | [OTRO] | "Error..." |
| `tests.confirm_season_reset` | [OTRO] | "Reset Season..." |
| `tests.attention` | [OTRO] | "⚠️ ATTENTION..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `player` (355 claves idénticas a EN)
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
| *... y 340 claves adicionales en este namespace* | | |

#### Namespace: `ach` (39 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ach.weekly_perfect_week.name` | [OTRO] | "Perfect Week..." |
| `ach.weekly_perfect_week.desc` | [FRASE UI SIN TRADUCIR] | "Attend 100% of the training sessions scheduled for this week..." |
| `ach.weekly_wellness.name` | [OTRO] | "Health Check-in..." |
| `ach.weekly_wellness.desc` | [FRASE UI SIN TRADUCIR] | "Record your sleep and soreness on training days...." |
| `ach.weekly_scholar.name` | [OTRO] | "Strong Mind..." |
| `ach.weekly_scholar.desc` | [FRASE UI SIN TRADUCIR] | "Complete at least 1 psychological test or evaluation in the ..." |
| `ach.weekly_committed.name` | [OTRO] | "Invisible Work..." |
| `ach.weekly_committed.desc` | [FRASE UI SIN TRADUCIR] | "Complete the assigned exercises from your individual plan...." |
| `ach.weekly_attentive.name` | [OTRO] | "Always Ready..." |
| `ach.weekly_attentive.desc` | [FRASE UI SIN TRADUCIR] | "Check match and training details before the call-up time...." |
| `ach.biweekly_iron.desc` | [FRASE UI SIN TRADUCIR] | "100% attendance during 14 consecutive days...." |
| `ach.biweekly_self_care.name` | [OTRO] | "Healthy Habit..." |
| `ach.biweekly_self_care.desc` | [FRASE UI SIN TRADUCIR] | "Submit your wellness check-in on at least 80% of days...." |
| `ach.biweekly_strong_mind.desc` | [FRASE UI SIN TRADUCIR] | "Complete 3 psychological tests on coping or mental toughness..." |
| `ach.biweekly_fit.name` | [FRASE UI SIN TRADUCIR] | "Physical Evolution..." |
| *... y 24 claves adicionales en este namespace* | | |

#### Namespace: `games` (191 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `games.intro.whatTitle` | [OTRO] | "What We Train..." |
| `games.intro.howTitle` | [OTRO] | "How to Play..." |
| `games.intro.whyTitle` | [FRASE UI SIN TRADUCIR] | "Why It Helps on the Pitch..." |
| `games.safety.title` | [OTRO] | "Safety at Home..." |
| `games.honesty.pact` | [FRASE UI SIN TRADUCIR] | "Honesty pact: record your real repetitions. The effort is yo..." |
| `games.btn.practiceFirst` | [FRASE UI SIN TRADUCIR] | "Try in Practice Mode..." |
| `games.disclaimer` | [FRASE UI SIN TRADUCIR] | "Support cognitive training, not therapy; follow specialist a..." |
| `games.finish.title` | [FRASE UI SIN TRADUCIR] | "Outstanding effort!..." |
| `games.finish.subtitle` | [FRASE UI SIN TRADUCIR] | "You have completed the session with dedication...." |
| `games.finish.healthyClosing` | [FRASE UI SIN TRADUCIR] | "Great mental work! Rest your eyes and body...." |
| `games.limits.title` | [FRASE UI SIN TRADUCIR] | "Healthy Training..." |
| `games.limits.available` | [OTRO] | "Available..." |
| `games.limits.completedToday` | [FRASE UI SIN TRADUCIR] | "Completed for today..." |
| `games.limits.minutesLbl` | [OTRO] | "Time played..." |
| `games.limits.lockedTitle` | [FRASE UI SIN TRADUCIR] | "Well done for today!..." |
| *... y 176 claves adicionales en este namespace* | | |

#### Namespace: `attendance` (22 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `attendance.chart.guide.title` | [FRASE UI SIN TRADUCIR] | "How to interpret this chart?..." |
| `attendance.chart.guide.step1` | [FRASE UI SIN TRADUCIR] | "1. Each point is a training or match: ordered chronologicall..." |
| `attendance.chart.guide.step2` | [FRASE UI SIN TRADUCIR] | "2. The green line is your attendance: above 70% you are on t..." |
| `attendance.chart.guide.step3` | [FRASE UI SIN TRADUCIR] | "3. If red rises while green drops: there is a commitment iss..." |
| `attendance.chart.guide.step4` | [FRASE UI SIN TRADUCIR] | "4. Tap any point to view details and open its register direc..." |
| `attendance.chart.guide.example` | [FRASE UI SIN TRADUCIR] | "Currently your team averages {avg}% attendance across {count..." |
| `attendance.chart.legend.attendance` | [FRASE UI SIN TRADUCIR] | "Actual Attendance (P+L)..." |
| `attendance.chart.legend.absent` | [OTRO] | "Absent..." |
| `attendance.chart.legend.absent.desc` | [FRASE UI SIN TRADUCIR] | "Unexcused absences. Should aim for zero...." |
| `attendance.chart.legend.late` | [OTRO] | "Late..." |
| `attendance.chart.legend.late.desc` | [FRASE UI SIN TRADUCIR] | "Late arrivals. Watch if it rises over several weeks...." |
| `attendance.chart.legend.justified` | [OTRO] | "Justified..." |
| `attendance.chart.legend.justified.desc` | [FRASE UI SIN TRADUCIR] | "Justified notices. Does not penalize the main %...." |
| `attendance.chart.legend.threshold70` | [FRASE UI SIN TRADUCIR] | "Alert threshold (70%): below this, callup risk...." |
| `attendance.chart.legend.official` | [FRASE UI SIN TRADUCIR] | "Official (closed sheet/session)..." |
| *... y 7 claves adicionales en este namespace* | | |

#### Namespace: `matches` (20 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matches.warnings.bannerTitle` | [FRASE UI SIN TRADUCIR] | "This match contained {count} isolated log anomalies or legac..." |
| `matches.warnings.showDetails` | [OTRO] | "View list..." |
| `matches.warnings.hideDetails` | [OTRO] | "Hide details..." |
| `matches.warnings.cleanseBtn` | [FRASE UI SIN TRADUCIR] | "Cleanse & Resolve..." |
| `matches.warnings.cleansing` | [OTRO] | "Resolving......" |
| `matches.warnings.resolvedSuccess` | [FRASE UI SIN TRADUCIR] | "✔ {count} anomaly/anomalies resolved and match sheet synchro..." |
| `matches.warnings.auditNote` | [FRASE UI SIN TRADUCIR] | "Log cleansed on {date}: {count} anomalies isolated and resol..." |
| `matches.warnings.auditShow` | [OTRO] | "View details..." |
| `matches.warnings.auditHide` | [OTRO] | "Hide audit..." |
| `matches.warnings.chipTooltip` | [FRASE UI SIN TRADUCIR] | "{count} anomalies detected in log (click to view and resolve..." |
| `matches.lineup.title` | [FRASE UI SIN TRADUCIR] | "Tactical Lineup & Bench..." |
| `matches.lineup.subtitle` | [FRASE UI SIN TRADUCIR] | "Tactical board with starting XI and substitutes bench..." |
| `matches.lineup.downloadPng` | [OTRO] | "DOWNLOAD PNG..." |
| `matches.lineup.exportingPng` | [OTRO] | "EXPORTING......" |
| `matches.lineup.benchTitle` | [FRASE UI SIN TRADUCIR] | "SUBSTITUTES BENCH..." |
| *... y 5 claves adicionales en este namespace* | | |

#### Namespace: `spell` (11 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `spell.title` | [FRASE UI SIN TRADUCIR] | "Spelling & Grammar..." |
| `spell.observations` | [FRASE UI SIN TRADUCIR] | "{count} spelling observation..." |
| `spell.observationsPlural` | [FRASE UI SIN TRADUCIR] | "{count} spelling observations..." |
| `spell.missingAccent` | [OTRO] | "Missing accent..." |
| `spell.typo` | [OTRO] | "Typo..." |
| `spell.unrecognized` | [FRASE UI SIN TRADUCIR] | "Unrecognized word..." |
| `spell.addToDictionary` | [FRASE UI SIN TRADUCIR] | "Add to dictionary..." |
| `spell.ignore` | [OTRO] | "Ignore..." |
| `spell.recommended` | [OTRO] | "Suggestions:..." |
| `spell.noSuggestions` | [FRASE UI SIN TRADUCIR] | "No direct suggestions..." |
| `spell.allCorrect` | [FRASE UI SIN TRADUCIR] | "No spelling issues..." |

#### Namespace: `analisis` (52 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `analisis.subtitle` | [FRASE UI SIN TRADUCIR] | "Tactical evolution, shots, duels and recoveries throughout t..." |
| `analisis.shortcuts.title` | [OTRO] | "SHORTCUTS:..." |
| `analisis.shortcuts.last3` | [OTRO] | "Last 3..." |
| `analisis.shortcuts.last5` | [OTRO] | "Last 5..." |
| `analisis.shortcuts.allSeason` | [OTRO] | "Whole Season..." |
| `analisis.mode.title` | [OTRO] | "Metrics:..." |
| `analisis.mode.averages` | [OTRO] | "Averages..." |
| `analisis.mode.totals` | [OTRO] | "Totals..." |
| `analisis.loadingData` | [FRASE UI SIN TRADUCIR] | "Loading match events......" |
| `analisis.noMatchesSelected` | [FRASE UI SIN TRADUCIR] | "Select at least 1 match to perform comparative analysis..." |
| `analisis.kpi.shots` | [OTRO] | "Shots on Target..." |
| `analisis.kpi.duels` | [OTRO] | "Duels Won..." |
| `analisis.kpi.recoveries` | [FRASE UI SIN TRADUCIR] | "Recoveries / Losses..." |
| `analisis.kpi.counters` | [FRASE UI SIN TRADUCIR] | "Counterattack Efficiency..." |
| `analisis.chart.trend` | [FRASE UI SIN TRADUCIR] | "Performance Evolution and Trend..." |
| *... y 37 claves adicionales en este namespace* | | |

#### Namespace: `ia` (90 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `ia.title` | [OTRO] | "✨ AI Generator..." |
| `ia.subtitle` | [FRASE UI SIN TRADUCIR] | "Smart training session design..." |
| `ia.libraryBtn` | [FRASE UI SIN TRADUCIR] | "☁️ Library ({count})..." |
| `ia.modePrevention` | [FRASE UI SIN TRADUCIR] | "Prevention / Recovery..." |
| `ia.categoryAge` | [OTRO] | "Category / Age..." |
| `ia.selectPlaceholder` | [OTRO] | "Select......" |
| `ia.mainObjective` | [OTRO] | "Main Objective..." |
| `ia.materials` | [OTRO] | "Materials..." |
| `ia.space` | [OTRO] | "Pitch Area..." |
| `ia.tacticalRef` | [FRASE UI SIN TRADUCIR] | "Tactical Reference (Optional)..." |
| `ia.noRef` | [OTRO] | "No Ref...." |
| `ia.capture` | [OTRO] | "Capture..." |
| `ia.animation` | [FRASE UI SIN TRADUCIR] | "Animation ({count}F)..." |
| `ia.tacticalBoard` | [OTRO] | "🎬 Board..." |
| `ia.additionalObs` | [FRASE UI SIN TRADUCIR] | "Additional observations..." |
| *... y 75 claves adicionales en este namespace* | | |

#### Namespace: `board` (119 claves idénticas a EN)
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
| `board.toolbar.clearCanvas` | [FRASE UI SIN TRADUCIR] | "Clear entire canvas..." |
| `board.toolbar.new` | [SIGLA/ACRÓNIMO] | "NEW..." |
| `board.toolbar.exportMp4` | [OTRO] | "EXPORT MP4..." |
| `board.toolbar.exportingMp4` | [FRASE UI SIN TRADUCIR] | "REC... EXPORTING MP4..." |
| `board.export.encodingTitle` | [FRASE UI SIN TRADUCIR] | "Exporting MP4 Video..." |
| *... y 104 claves adicionales en este namespace* | | |

#### Namespace: `team` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `team.squadCount.one` | [FRASE UI SIN TRADUCIR] | "{count} player in squad..." |
| `team.squadCount.other` | [FRASE UI SIN TRADUCIR] | "{count} players in squad..." |

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

#### Namespace: `health` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `health.active` | [OTRO] | "Active..." |
| `health.resolved` | [OTRO] | "Recovered..." |
| `health.addInjury` | [OTRO] | "+ Record Injury..." |
| `health.title` | [FRASE UI SIN TRADUCIR] | "Medical History & Injuries..." |
| `health.noInjuries` | [FRASE UI SIN TRADUCIR] | "No injuries recorded...." |

#### Namespace: `plans` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `plans.routinesAndPrevention` | [FRASE UI SIN TRADUCIR] | "Routines & Prevention..." |
| `plans.loadingPlans` | [FRASE UI SIN TRADUCIR] | "Loading plans......" |
| `plans.noPlansAssigned` | [FRASE UI SIN TRADUCIR] | "The player has no assigned plans...." |
| `plans.badgeTeam` | [SIGLA/ACRÓNIMO] | "TEAM..." |
| `plans.badgeIndividual` | [OTRO] | "INDIVIDUAL..." |
| `plans.streakDays.one` | [FRASE UI SIN TRADUCIR] | "Streak: {count} day..." |
| `plans.streakDays.other` | [FRASE UI SIN TRADUCIR] | "Streak: {count} days..." |
| `plans.sharePlan` | [OTRO] | "🔗 Share Plan..." |
| `plans.coachFeedback` | [FRASE UI SIN TRADUCIR] | "Coach Instructions..." |

#### Namespace: `staff` (38 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staff.shareCodeDesc` | [FRASE UI SIN TRADUCIR] | "Share this code so players or parents can join from the Port..." |
| `staff.copyCode` | [OTRO] | "Copy Code..." |
| `staff.copied` | [OTRO] | "Copied!..." |
| `staff.shareLink` | [OTRO] | "Share Link..." |
| `staff.staffTitle` | [FRASE UI SIN TRADUCIR] | "Coaching Staff & Collaborators..." |
| `staff.inviteStaffBtn` | [FRASE UI SIN TRADUCIR] | "Invite Staff ({count}/{limit})..." |
| `staff.you` | [OTRO] | "(You)..." |
| `staff.changeRole` | [OTRO] | "Change Role:..." |
| `staff.role.headCoach` | [OTRO] | "Head Coach..." |
| `staff.role.goalkeeperCoach` | [FRASE UI SIN TRADUCIR] | "Goalkeeper Coach..." |
| `staff.role.analyst` | [FRASE UI SIN TRADUCIR] | "Tactical Analyst..." |
| `staff.role.scout` | [OTRO] | "Scout..." |
| `staff.role.coordinator` | [FRASE UI SIN TRADUCIR] | "Academy Director..." |
| `staff.role.collaborator` | [FRASE UI SIN TRADUCIR] | "Staff Collaborator..." |
| `staff.remove` | [OTRO] | "Remove..." |
| *... y 23 claves adicionales en este namespace* | | |

#### Namespace: `wellness` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `wellness.rpe.title` | [FRASE UI SIN TRADUCIR] | "Rate of Perceived Exertion (RPE)..." |
| `wellness.rpe.desc` | [FRASE UI SIN TRADUCIR] | "Record how {name} perceived the effort...." |
| `wellness.rpe.levelLabel` | [FRASE UI SIN TRADUCIR] | "Exertion Level (RPE 1-10)..." |
| `wellness.rpe.scaleMin` | [OTRO] | "1 - Very light..." |
| `wellness.rpe.scaleMax` | [FRASE UI SIN TRADUCIR] | "10 - Maximum effort..." |
| `wellness.rpe.trainingLoad` | [FRASE UI SIN TRADUCIR] | "Training Load (RPE × Duration):..." |
| `wellness.rpe.save` | [OTRO] | "SAVE RPE..." |

#### Namespace: `cognitive` (40 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `cognitive.supervision_title` | [FRASE UI SIN TRADUCIR] | "Cognitive Supervision & Home Challenges..." |
| `cognitive.week_sessions` | [FRASE UI SIN TRADUCIR] | "Current week · {count} recorded sessions..." |
| `cognitive.btn_verified` | [FRASE UI SIN TRADUCIR] | "✔ Verified (+5 XP)..." |
| `cognitive.btn_verifying` | [OTRO] | "Verifying…..." |
| `cognitive.btn_recommend_challenge` | [FRASE UI SIN TRADUCIR] | "Recommend Challenge..." |
| `cognitive.metric_median_reaction` | [OTRO] | "Median reaction..." |
| `cognitive.metric_avg_accuracy` | [FRASE UI SIN TRADUCIR] | "Average accuracy..." |
| `cognitive.metric_trend` | [OTRO] | "Trend..." |
| `cognitive.trend_improving` | [OTRO] | "↑ Improving..." |
| `cognitive.trend_stable` | [OTRO] | "= Stable..." |
| `cognitive.level_by_game_title` | [FRASE UI SIN TRADUCIR] | "Level per Game (Adaptive Merit)..." |
| `cognitive.category_label` | [OTRO] | "Category: {cat}..." |
| `cognitive.active_challenges_title` | [FRASE UI SIN TRADUCIR] | "Active Recommended Challenges & Games ({count}):..." |
| `cognitive.target_team` | [OTRO] | "Entire team..." |
| `cognitive.target_player` | [OTRO] | "Individual..." |
| *... y 25 claves adicionales en este namespace* | | |

#### Namespace: `header` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `header.logoutConfirm` | [FRASE UI SIN TRADUCIR] | "Do you want to log out or switch accounts?..." |

#### Namespace: `status` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `status.none` | [OTRO] | "Not Selected..." |

#### Namespace: `placeholder` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `placeholder.teamName` | [FRASE UI SIN TRADUCIR] | "e.g. Manchester Youth A..." |

#### Namespace: `app` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `app.slogan` | [FRASE UI SIN TRADUCIR] | "The bench in your pocket..." |
| `app.copyright` | [NOMBRE PROPIO/MARCA] | "2026 Mister11 · {slogan}..." |

#### Namespace: `install` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `install.title` | [FRASE UI SIN TRADUCIR] | "Install Mister 11..." |
| `install.slogan` | [FRASE UI SIN TRADUCIR] | "The bench in your pocket..." |
| `install.alreadyInstalled` | [FRASE UI SIN TRADUCIR] | "The App is already installed on your device!..." |
| `install.instructions` | [OTRO] | "Instructions:..." |
| `install.androidTitle` | [NOMBRE PROPIO/MARCA] | "Android (Chrome):..." |
| `install.androidDesc` | [FRASE UI SIN TRADUCIR] | "Tap the "Install now" button below or open the three dots me..." |
| `install.iosTitle` | [OTRO] | "iOS (Safari):..." |
| `install.iosDesc` | [FRASE UI SIN TRADUCIR] | "Tap the "Share" button (square with arrow) and select "Add t..." |
| `install.btnInstall` | [OTRO] | "Install now..." |
| `install.fallbackNotice` | [FRASE UI SIN TRADUCIR] | "If you do not see the install button, use the "Add to Home S..." |
| `install.metaTitle` | [FRASE UI SIN TRADUCIR] | "Install Mister11 — The Football App for Coaches..." |
| `install.metaDesc` | [FRASE UI SIN TRADUCIR] | "Step-by-step installation instructions for Mister11 PWA on A..." |

#### Namespace: `consent` (50 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `consent.heading` | [FRASE UI SIN TRADUCIR] | "Digital Parental Consent..." |
| `consent.subTitle` | [FRASE UI SIN TRADUCIR] | "Informed authorization for the sports management of the unde..." |
| `consent.detailsTitle` | [OTRO] | "Consent Details..." |
| `consent.instructions` | [FRASE UI SIN TRADUCIR] | "Fill in the required information. Fields marked with (*) are..." |
| `consent.sec1` | [FRASE UI SIN TRADUCIR] | "1. Parent or Legal Guardian Details..." |
| `consent.parentNameLabel` | [OTRO] | "Guardian Name *..." |
| `consent.parentNamePlaceholder` | [OTRO] | "Full Name..." |
| `consent.parentDniLabel` | [FRASE UI SIN TRADUCIR] | "ID / NIE / Passport *..." |
| `consent.parentDniPlaceholder` | [OTRO] | "e.g. 12345678Z..." |
| `consent.relationLabel` | [OTRO] | "Relationship *..." |
| `consent.relationFather` | [OTRO] | "Father..." |
| `consent.relationMother` | [OTRO] | "Mother..." |
| `consent.relationGuardian` | [FRASE UI SIN TRADUCIR] | "Legal Guardian / Representative..." |
| `consent.parentPhoneLabel` | [OTRO] | "Contact Phone..." |
| `consent.parentPhonePlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. +34 600 000 000..." |
| *... y 35 claves adicionales en este namespace* | | |

#### Namespace: `download` (13 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `download.saved_in` | [FRASE UI SIN TRADUCIR] | "✅ Saved in: {path}..." |
| `download.cache_hint` | [FRASE UI SIN TRADUCIR] | "Saved to cache. If it does not open, look for "{filename}" i..." |
| `download.pdf_ready` | [NOMBRE PROPIO/MARCA] | "✅ PDF ready: "{filename}"..." |
| `download.pdf_error` | [NOMBRE PROPIO/MARCA] | "Error saving PDF..." |
| `download.json_success` | [FRASE UI SIN TRADUCIR] | "✅ File exported successfully...." |
| `download.image_success` | [FRASE UI SIN TRADUCIR] | "✅ Image exported successfully...." |
| `download.csv_success` | [FRASE UI SIN TRADUCIR] | "✅ Template exported successfully...." |
| `download.video_success` | [FRASE UI SIN TRADUCIR] | "✅ Animation exported successfully...." |
| `download.lineup_saved` | [FRASE UI SIN TRADUCIR] | "✅ Lineup saved to {path}..." |
| `download.lineup_downloading` | [FRASE UI SIN TRADUCIR] | "⬇️ Downloading lineup: {filename}..." |
| `download.save_error_share_fallback` | [FRASE UI SIN TRADUCIR] | "⚠️ Could not save file automatically; please use Share...." |
| `download.lineup_share_title` | [NOMBRE PROPIO/MARCA] | "Mister11 — Lineup {team}..." |
| `download.generic_error` | [FRASE UI SIN TRADUCIR] | "Error exporting lineup..." |

#### Namespace: `push` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `push.foreground_toast` | [FRASE UI SIN TRADUCIR] | "🔔 {title}: {body}..." |

#### Namespace: `achievements` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `achievements.toast_unlocked` | [FRASE UI SIN TRADUCIR] | "🏆 Achievement unlocked: {name}! (+{xp} XP)..." |

#### Namespace: `chat` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `chat.notif_from_player` | [FRASE UI SIN TRADUCIR] | "💬 Message from {playerName}: "{msgText}"..." |

#### Namespace: `matchSheet` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `matchSheet.prefill_smart_error` | [FRASE UI SIN TRADUCIR] | "❌ Error in smart pre-filling...." |
| `matchSheet.prefill_rsvp_empty` | [FRASE UI SIN TRADUCIR] | "No pending RSVP responses to pre-fill...." |
| `matchSheet.prefill_rsvp_success` | [FRASE UI SIN TRADUCIR] | "✅ Statuses pre-filled from RSVP...." |
| `matchSheet.prefill_rsvp_error` | [FRASE UI SIN TRADUCIR] | "❌ Error pre-filling from RSVP...." |
| `matchSheet.tactical_grade_saved` | [FRASE UI SIN TRADUCIR] | "⭐ Tactical rating saved..." |
| `matchSheet.log_already_clean` | [FRASE UI SIN TRADUCIR] | "✨ The match log is already clean. Zero impossible events...." |
| `matchSheet.anomalies_resolved` | [FRASE UI SIN TRADUCIR] | "✔ {count} anomaly(ies) resolved and sheet synchronized...." |
| `matchSheet.log_debug_error` | [FRASE UI SIN TRADUCIR] | "❌ Error debugging log...." |
| `matchSheet.close_error` | [FRASE UI SIN TRADUCIR] | "❌ Error closing match sheet. Please try again...." |
| `matchSheet.reopen_error` | [FRASE UI SIN TRADUCIR] | "❌ Error reopening match sheet...." |
| `matchSheet.confirm_save_btn` | [FRASE UI SIN TRADUCIR] | "💾 CONFIRM & SAVE SHEET..." |
| `matchSheet.saving` | [OTRO] | "💾 Saving......" |
| `matchSheet.manual_override_title` | [FORMATO FECHA/HORA/NÚMERO] | "Manual minutes override..." |
| `matchSheet.manual_allowed_closed` | [FRASE UI SIN TRADUCIR] | "allowed even when closed..." |
| `matchSheet.manual_badge` | [OTRO] | "Manual..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `teamMembers` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamMembers.already_member` | [FRASE UI SIN TRADUCIR] | "This user is already a member of the coaching staff...." |
| `teamMembers.invite_generated` | [FRASE UI SIN TRADUCIR] | "Invitation link and code generated successfully...." |
| `teamMembers.role_updated` | [FRASE UI SIN TRADUCIR] | "Role updated to {role}...." |
| `teamMembers.admin_only_remove` | [FRASE UI SIN TRADUCIR] | "Only the Head Coach (Admin) can remove team members...." |
| `teamMembers.member_removed` | [FRASE UI SIN TRADUCIR] | "Member removed from coaching staff...." |
| `teamMembers.invite_cancelled` | [FRASE UI SIN TRADUCIR] | "Invitation cancelled...." |

#### Namespace: `club` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `club.teams_assigned` | [FRASE UI SIN TRADUCIR] | "Teams assigned successfully...." |
| `club.teams_assign_error` | [FRASE UI SIN TRADUCIR] | "Error assigning teams...." |
| `club.team_created` | [FRASE UI SIN TRADUCIR] | "Club team created successfully...." |
| `club.team_create_error` | [FRASE UI SIN TRADUCIR] | "Error creating club team...." |

#### Namespace: `invite` (8 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `invite.already_registered` | [FRASE UI SIN TRADUCIR] | "This email is already registered or invited to the club...." |
| `invite.generated_success` | [FRASE UI SIN TRADUCIR] | "Invitation generated successfully...." |
| `invite.generated_error` | [FRASE UI SIN TRADUCIR] | "Error generating the invitation...." |
| `invite.link_copied` | [OTRO] | "Link copied!..." |
| `invite.coach.title` | [FRASE UI SIN TRADUCIR] | "Join as Coach / Staff..." |
| `invite.coach.codePlaceholder` | [FRASE UI SIN TRADUCIR] | "Invitation code (6 characters)..." |
| `invite.coach.scanQR` | [FRASE UI SIN TRADUCIR] | "Scan invitation QR..." |
| `invite.player.scanQR` | [OTRO] | "Scan team QR..." |

#### Namespace: `livestats` (2 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `livestats.select_player_first` | [FRASE UI SIN TRADUCIR] | "👆 Select a player first..." |
| `livestats.post_match_saved` | [FRASE UI SIN TRADUCIR] | "✅ Post-match counters saved..." |

#### Namespace: `playerDashboard` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerDashboard.new_message` | [FRASE UI SIN TRADUCIR] | "💬 New message from Coach:..." |

#### Namespace: `joinTeam` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `joinTeam.request_approved` | [FRASE UI SIN TRADUCIR] | "Your request has been approved!..." |
| `joinTeam.already_member` | [FRASE UI SIN TRADUCIR] | "You are already on this team! Loading your portal......" |
| `joinTeam.google_sign_in` | [NOMBRE PROPIO/MARCA] | "Signed in with Google..." |
| `joinTeam.account_created` | [FRASE UI SIN TRADUCIR] | "Account created successfully..." |
| `joinTeam.welcome` | [FRASE UI SIN TRADUCIR] | "Welcome to Míster11..." |
| `joinTeam.request_sent` | [FRASE UI SIN TRADUCIR] | "Request sent to the coach!..." |

#### Namespace: `login` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `login.cancelled` | [FRASE UI SIN TRADUCIR] | "Sign-in cancelled by user..." |
| `login.account_created` | [FRASE UI SIN TRADUCIR] | "Account created successfully!..." |
| `login.welcome` | [FRASE UI SIN TRADUCIR] | "Welcome to Míster11!..." |
| `login.write_email_first` | [FRASE UI SIN TRADUCIR] | "Please enter your email first..." |
| `login.recovery_sent` | [FRASE UI SIN TRADUCIR] | "Recovery link sent to your email..." |
| `login.recovery_error` | [FRASE UI SIN TRADUCIR] | "Error sending email..." |

#### Namespace: `planning` (9 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `planning.login_required` | [OTRO] | "Sign in to save..." |
| `planning.saved` | [FRASE UI SIN TRADUCIR] | "Planning saved ✓..." |
| `planning.save_error` | [OTRO] | "Error saving...." |
| `planning.generating_pdf` | [NOMBRE PROPIO/MARCA] | "Generating mesocycle PDF......" |
| `planning.pdf_month_not_found` | [FRASE UI SIN TRADUCIR] | "Error: Month information not found...." |
| `planning.pdf_success` | [FRASE UI SIN TRADUCIR] | "Mesocycle PDF generated successfully ✓..." |
| `planning.pdf_error` | [NOMBRE PROPIO/MARCA] | "Error exporting PDF...." |
| `planning.generating_pdf_generic` | [NOMBRE PROPIO/MARCA] | "Generating PDF......" |
| `planning.pdf_exported` | [NOMBRE PROPIO/MARCA] | "PDF exported ✓..." |

#### Namespace: `gk` (33 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `gk.title` | [FRASE UI SIN TRADUCIR] | "Goalkeeper Metrics..." |
| `gk.roleBadge` | [OTRO] | "🧤 Goalkeeper..." |
| `gk.activeGoalkeeper` | [FRASE UI SIN TRADUCIR] | "GOALKEEPER ON PITCH..." |
| `gk.noActiveGoalkeeper` | [FRASE UI SIN TRADUCIR] | "No active goalkeeper on pitch..." |
| `gk.saves` | [OTRO] | "Saves..." |
| `gk.savesShort` | [OTRO] | "Saves..." |
| `gk.conceded` | [OTRO] | "Goals Conceded..." |
| `gk.concededShort` | [OTRO] | "Conc...." |
| `gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `gk.cleanSheetsShort` | [OTRO] | "Clean Sh...." |
| `gk.penaltySaves` | [OTRO] | "Penalties Saved..." |
| `gk.penaltySavesShort` | [OTRO] | "Pen. Saved..." |
| `gk.claims` | [FRASE UI SIN TRADUCIR] | "Claims & Punches..." |
| `gk.claimsShort` | [OTRO] | "Claims..." |
| `gk.errorGoal` | [FRASE UI SIN TRADUCIR] | "Errors Leading to Goal..." |
| *... y 18 claves adicionales en este namespace* | | |

#### Namespace: `exports` (32 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `exports.gk.title` | [FRASE UI SIN TRADUCIR] | "GOALKEEPING PERFORMANCE..." |
| `exports.gk.saves` | [OTRO] | "Saves..." |
| `exports.gk.conceded` | [OTRO] | "Conceded..." |
| `exports.gk.cleanSheets` | [OTRO] | "Clean Sheets..." |
| `exports.gk.penaltySaves` | [OTRO] | "Pen. Saved..." |
| `exports.gk.claims` | [FRASE UI SIN TRADUCIR] | "Claims / Punches..." |
| `exports.gk.errors` | [OTRO] | "Errors..." |
| `exports.gk.rating` | [OTRO] | "GK Rating..." |
| `exports.report.title` | [FRASE UI SIN TRADUCIR] | "OFFICIAL POST-MATCH REPORT..." |
| `exports.report.sec1_lineup` | [FRASE UI SIN TRADUCIR] | "1. Tactical Lineup with Photos..." |
| `exports.report.sec2_timeline` | [FRASE UI SIN TRADUCIR] | "2. Score & Event Timeline..." |
| `exports.report.sec3_momentum` | [FRASE UI SIN TRADUCIR] | "3. Momentum & 15-Minute Possession Blocks..." |
| `exports.report.sec4_bars` | [FRASE UI SIN TRADUCIR] | "4. Comparative Bars (10 Metrics)..." |
| `exports.report.sec5_radar` | [FRASE UI SIN TRADUCIR] | "5. Normalized Comparative Radar (Own vs Opponent)..." |
| `exports.report.sec6_top5` | [FRASE UI SIN TRADUCIR] | "6. Top-5 Differential KPIs..." |
| *... y 17 claves adicionales en este namespace* | | |

#### Namespace: `shot` (32 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `shot.title` | [FRASE UI SIN TRADUCIR] | "Record Shot with Context..." |
| `shot.team_own` | [OTRO] | "Own..." |
| `shot.team_rival` | [OTRO] | "Opponent..." |
| `shot.zone` | [OTRO] | "Shot Zone..." |
| `shot.zone_inside_center` | [OTRO] | "Center (Box)..." |
| `shot.zone_inside_left` | [OTRO] | "Left Wing (Box)..." |
| `shot.zone_inside_right` | [FRASE UI SIN TRADUCIR] | "Right Wing (Box)..." |
| `shot.zone_outside_center` | [FRASE UI SIN TRADUCIR] | "Center (Outside)..." |
| `shot.zone_outside_left` | [FRASE UI SIN TRADUCIR] | "Left Wing (Outside)..." |
| `shot.zone_outside_right` | [FRASE UI SIN TRADUCIR] | "Right Wing (Outside)..." |
| `shot.zone_penalty` | [OTRO] | "Penalty Spot..." |
| `shot.playType` | [OTRO] | "Play Type..." |
| `shot.playType_jugada` | [OTRO] | "Open Play..." |
| `shot.playType_contra` | [OTRO] | "Counter Attack..." |
| `shot.playType_balon_parado` | [OTRO] | "Set Piece..." |
| *... y 17 claves adicionales en este namespace* | | |

#### Namespace: `liveStats` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `liveStats.quickMode.title` | [OTRO] | "Quick Mode..." |
| `liveStats.quickMode.advanced` | [FRASE UI SIN TRADUCIR] | "Advanced options..." |
| `liveStats.quickMode.simple` | [OTRO] | "Simple mode..." |
| `liveStats.quickMode.shotSaved` | [OTRO] | "Shot recorded..." |
| `liveStats.quickMode.undo` | [OTRO] | "Undo..." |
| `liveStats.quickMode.undone` | [OTRO] | "Shot undone..." |

#### Namespace: `rendimientoPdf` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `rendimientoPdf.title` | [FRASE UI SIN TRADUCIR] | "INDIVIDUAL PERFORMANCE REPORT..." |
| `rendimientoPdf.subtitle` | [FRASE UI SIN TRADUCIR] | "Individual player statistics and canonical metrics..." |
| `rendimientoPdf.generatedBy` | [NOMBRE PROPIO/MARCA] | "Generated by Mister11..." |
| `rendimientoPdf.tableTitle` | [FRASE UI SIN TRADUCIR] | "Complete Performance Table..." |

#### Namespace: `xg` (16 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `xg.title` | [FRASE UI SIN TRADUCIR] | "xG-Lite Model & Exposure..." |
| `xg.own_xg` | [OTRO] | "Own xG..." |
| `xg.rival_xg` | [OTRO] | "Opponent xG..." |
| `xg.gk_exertion` | [FRASE UI SIN TRADUCIR] | "GK Exertion Index..." |
| `xg.normal_match` | [FRASE UI SIN TRADUCIR] | "Controlled Exertion..." |
| `xg.rival_comfort` | [FRASE UI SIN TRADUCIR] | "Opponent Comfort..." |
| `xg.exposure_map` | [FRASE UI SIN TRADUCIR] | "Defensive Exposure Map..." |
| `xg.box_center` | [OTRO] | "Central Box..." |
| `xg.box_wings` | [OTRO] | "Lateral Box..." |
| `xg.outside_box` | [OTRO] | "Outside Box..." |
| `xg.penalty_box` | [OTRO] | "Penalty..." |
| `xg.decisive_saves` | [OTRO] | "Decisive Saves..." |
| `xg.normal_saves` | [OTRO] | "Normal Saves..." |
| `xg.total_saves` | [OTRO] | "Total Saves..." |
| `xg.decisive_pct` | [FORMATO FECHA/HORA/NÚMERO] | "Decisive Success %..." |
| *... y 1 claves adicionales en este namespace* | | |

#### Namespace: `swot` (26 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `swot.title` | [FRASE UI SIN TRADUCIR] | "Traceable SWOT Matrix..." |
| `swot.strengths` | [OTRO] | "Strengths..." |
| `swot.weaknesses` | [OTRO] | "Weaknesses..." |
| `swot.opportunities` | [OTRO] | "Opportunities..." |
| `swot.threats` | [OTRO] | "Threats..." |
| `swot.origin_metric` | [OTRO] | "Origin metric..." |
| `swot.add_manual` | [FRASE UI SIN TRADUCIR] | "Add manual observation..." |
| `swot.manual_badge` | [OTRO] | "Manual..." |
| `swot.auto_badge` | [OTRO] | "Rule..." |
| `swot.btn_generate_ai` | [FRASE UI SIN TRADUCIR] | "Draft summary with AI..." |
| `swot.generating_ai` | [FRASE UI SIN TRADUCIR] | "Drafting with AI......" |
| `swot.ai_summary_title` | [FRASE UI SIN TRADUCIR] | "Tactical Summary (AI)..." |
| `swot.no_items` | [FRASE UI SIN TRADUCIR] | "No observations recorded for this quadrant...." |
| `swot.rule.high_xg_diff` | [FRASE UI SIN TRADUCIR] | "High attacking creation volume outperforming opponent in cle..." |
| `swot.rule.low_xg_conv` | [FRASE UI SIN TRADUCIR] | "Chances created with low conversion rate, requiring finishin..." |
| *... y 11 claves adicionales en este namespace* | | |

#### Namespace: `capture` (17 claves idénticas a EN)
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
| `capture.criteria.title` | [FRASE UI SIN TRADUCIR] | "Capture Criteria Manual..." |
| `capture.refine_title` | [FRASE UI SIN TRADUCIR] | "Refine individual attribution (optional)..." |
| `capture.refine_empty` | [FRASE UI SIN TRADUCIR] | "Nothing pending ✅..." |
| `capture.refine_skip` | [OTRO] | "Skip..." |
| *... y 2 claves adicionales en este namespace* | | |

#### Namespace: `sector` (1 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sector.activeZone` | [FRASE UI SIN TRADUCIR] | "Active Zone: {zone}..." |

#### Namespace: `match` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `match.status.finalizado` | [SIGLA/ACRÓNIMO] | "FINISHED..." |
| `match.status.en_edicion` | [OTRO] | "IN EDITING..." |
| `match.status.pendiente` | [SIGLA/ACRÓNIMO] | "PENDING..." |
| `match.status.no_disputado` | [OTRO] | "NOT PLAYED..." |
| `match.sort.label` | [OTRO] | "Sort by..." |
| `match.sort.cercania` | [FRASE UI SIN TRADUCIR] | "Closest to today..." |
| `match.sort.lejania` | [FRASE UI SIN TRADUCIR] | "Farthest from today..." |
| `match.sort.fecha_asc` | [FORMATO FECHA/HORA/NÚMERO] | "Date (Upcoming)..." |
| `match.sort.fecha_desc` | [OTRO] | "Date (Recent)..." |
| `match.sort.estado` | [FRASE UI SIN TRADUCIR] | "By Status / Priority..." |
| `match.view.cards` | [OTRO] | "Cards..." |
| `match.view.detailed` | [OTRO] | "Detailed..." |

#### Namespace: `stats` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `stats.eventMap.title` | [OTRO] | "Zone Event Map..." |
| `stats.eventMap.guide` | [FRASE UI SIN TRADUCIR] | "Spatial distribution of team actions (recoveries, duels, sho..." |
| `stats.eventMap.pass_insufficient` | [FRASE UI SIN TRADUCIR] | "Pass network unavailable: At least 5 recorded passes are req..." |
| `stats.passNetwork.guide` | [FRASE UI SIN TRADUCIR] | "Each node represents a player's average position and line th..." |
| `stats.theater.theater_mode` | [OTRO] | "Theater Mode..." |
| `stats.theater.fullscreen` | [OTRO] | "Fullscreen..." |
| `stats.theater.exit_fullscreen` | [OTRO] | "Exit Fullscreen..." |

#### Namespace: `error` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `error.section_unavailable` | [FRASE UI SIN TRADUCIR] | "Section temporarily unavailable..." |
| `error.section_desc` | [FRASE UI SIN TRADUCIR] | "An isolated anomaly occurred while rendering this section. T..." |
| `error.retry_section` | [OTRO] | "Retry..." |
| `error.section_code` | [OTRO] | "Code: {code}..." |

#### Namespace: `charts` (11 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `charts.guide.radar` | [FRASE UI SIN TRADUCIR] | "Visualizes tactical balance across 6 dimensions between own ..." |
| `charts.guide.bars` | [FRASE UI SIN TRADUCIR] | "Quantitative comparison of the 10 key gameplay metrics...." |
| `charts.guide.momentum` | [FRASE UI SIN TRADUCIR] | "Evolution of match dominance and control in 15-minute interv..." |
| `charts.guide.shots` | [FRASE UI SIN TRADUCIR] | "Shot distribution and expected goals (xG) probability model...." |
| `charts.guide.zones` | [FRASE UI SIN TRADUCIR] | "Territorial distribution of team interventions across 9 pitc..." |
| `charts.insights.finishing_deficit` | [FRASE UI SIN TRADUCIR] | "Finishing Efficiency: High volume of scoring chances with de..." |
| `charts.insights.defensive_alert` | [FRASE UI SIN TRADUCIR] | "Defensive Alert: Opponent generated clear chances with high ..." |
| `charts.insights.dominant_zone` | [FRASE UI SIN TRADUCIR] | "Dominant Zone: Over 40% of actions concentrated in this area..." |
| `charts.pass_insufficient_tooltip` | [FRASE UI SIN TRADUCIR] | "At least 5 recorded passes required to generate tactical pas..." |
| `charts.view.pass_network` | [OTRO] | "Pass Network..." |
| `charts.view.territorial_map` | [OTRO] | "Territorial Map..." |

#### Namespace: `pricing` (59 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `pricing.header.title` | [FRASE UI SIN TRADUCIR] | "Transparent Pricing for Coaches & Academies..." |
| `pricing.header.subtitle` | [FRASE UI SIN TRADUCIR] | "All prices include VAT. Annual season pass grants 10 full mo..." |
| `pricing.billing.season` | [FRASE UI SIN TRADUCIR] | "Full Season Pass (10 Months)..." |
| `pricing.billing.discountBadge` | [OTRO] | "2 MONTHS FREE..." |
| `pricing.billing.monthly` | [OTRO] | "Monthly..." |
| `pricing.plan.free.name` | [OTRO] | "Free Plan..." |
| `pricing.plan.free.tagline` | [FRASE UI SIN TRADUCIR] | "To start digitizing your team..." |
| `pricing.plan.pro.name` | [OTRO] | "PRO Plan..." |
| `pricing.plan.pro.tagline` | [FRASE UI SIN TRADUCIR] | "For the coach seeking maximum performance..." |
| `pricing.plan.clubStarter.name` | [OTRO] | "Club Starter..." |
| `pricing.plan.clubStarter.tagline` | [FRASE UI SIN TRADUCIR] | "For growing academies and clubs..." |
| `pricing.plan.clubPro.name` | [OTRO] | "Club PRO..." |
| `pricing.plan.clubPro.tagline` | [FRASE UI SIN TRADUCIR] | "For structured clubs with their own methodology..." |
| `pricing.plan.clubPremium.name` | [OTRO] | "Club Premium..." |
| `pricing.plan.clubPremium.tagline` | [FRASE UI SIN TRADUCIR] | "For high-performance multi-site academies..." |
| *... y 44 claves adicionales en este namespace* | | |

#### Namespace: `staffHeredado` (7 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffHeredado.badgeActive` | [FRASE UI SIN TRADUCIR] | "PRO features active via {ownerName}'s plan..." |
| `staffHeredado.badgeActiveShort` | [FRASE UI SIN TRADUCIR] | "Inherited Plan ({ownerName})..." |
| `staffHeredado.gracePeriodBanner` | [FRASE UI SIN TRADUCIR] | "Subscription Notice: The owner's plan has changed. The team ..." |
| `staffHeredado.gracePeriodBlocked` | [FRASE UI SIN TRADUCIR] | "Restricted Access: The team grace period has expired. The ow..." |
| `staffHeredado.transferLimitExceeded` | [FRASE UI SIN TRADUCIR] | "This user already owns a team on their Free plan. They must ..." |
| `staffHeredado.transferError` | [FRASE UI SIN TRADUCIR] | "Error transferring team ownership...." |
| `staffHeredado.restrictedFeatureStaff` | [FRASE UI SIN TRADUCIR] | "This feature requires the team to have an active PRO plan fr..." |

#### Namespace: `playerProfile` (14 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `playerProfile.physicalStats` | [OTRO] | "Physical Stats..." |
| `playerProfile.heightLabel` | [OTRO] | "Height..." |
| `playerProfile.weightLabel` | [OTRO] | "Weight..." |
| `playerProfile.ageLabel` | [OTRO] | "Age..." |
| `playerProfile.heightUnit` | [OTRO] | "cm..." |
| `playerProfile.weightUnit` | [OTRO] | "kg..." |
| `playerProfile.heightRangeError` | [FRASE UI SIN TRADUCIR] | "Height must be between 100 and 230 cm...." |
| `playerProfile.weightRangeError` | [FRASE UI SIN TRADUCIR] | "Weight must be between 30 and 150 kg...." |
| `playerProfile.statsSaved` | [FRASE UI SIN TRADUCIR] | "Physical stats updated successfully...." |
| `playerProfile.saveError` | [FRASE UI SIN TRADUCIR] | "Error saving physical stats...." |
| `playerProfile.bmi` | [SIGLA/ACRÓNIMO] | "BMI..." |
| `playerProfile.bmiDesc` | [FRASE UI SIN TRADUCIR] | "Estimated Body Mass Index...." |
| `playerProfile.editTooltip` | [FRASE UI SIN TRADUCIR] | "Tap to edit your measurements..." |
| `playerProfile.readOnlyNotice` | [FRASE UI SIN TRADUCIR] | "Age, shirt number and position can only be modified by coach..." |

#### Namespace: `sessionRating` (12 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `sessionRating.subtitle` | [FRASE UI SIN TRADUCIR] | "Rate performance of called-up players (0 to 10)..." |
| `sessionRating.rateButton` | [OTRO] | "Rate..." |
| `sessionRating.savedSuccess` | [FRASE UI SIN TRADUCIR] | "Training session ratings saved successfully...." |
| `sessionRating.saveError` | [FRASE UI SIN TRADUCIR] | "Error saving session ratings...." |
| `sessionRating.commentPlaceholder` | [FRASE UI SIN TRADUCIR] | "Coaching notes or feedback (optional, max 200 chars)..." |
| `sessionRating.ratingLabel` | [OTRO] | "Score..." |
| `sessionRating.performanceTableTitle` | [FRASE UI SIN TRADUCIR] | "Training Performance..." |
| `sessionRating.performanceTableSubtitle` | [FRASE UI SIN TRADUCIR] | "Last 5 rated sessions and accumulated average..." |
| `sessionRating.averageRating` | [OTRO] | "Avg..." |
| `sessionRating.noRatings` | [FRASE UI SIN TRADUCIR] | "No ratings recorded for this session yet...." |
| `sessionRating.evolutionTitle` | [FRASE UI SIN TRADUCIR] | "Training Evolution..." |
| `sessionRating.radarAxisTraining` | [OTRO] | "Training..." |

#### Namespace: `notifPrefs` (15 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `notifPrefs.savedToast` | [FRASE UI SIN TRADUCIR] | "Notification preferences saved successfully..." |
| `notifPrefs.errorToast` | [FRASE UI SIN TRADUCIR] | "Error saving notification preferences..." |
| `notifPrefs.title` | [FRASE UI SIN TRADUCIR] | "Notification Preferences..." |
| `notifPrefs.wellnessTitle` | [FRASE UI SIN TRADUCIR] | "Wellness Check-in..." |
| `notifPrefs.wellnessDesc` | [FRASE UI SIN TRADUCIR] | "Daily reminder to fill out your health form..." |
| `notifPrefs.reminderTime` | [FORMATO FECHA/HORA/NÚMERO] | "Reminder Time..." |
| `notifPrefs.chatDesc` | [FRASE UI SIN TRADUCIR] | "Alerts for new messages in team squad chat..." |
| `notifPrefs.matchDesc` | [FRASE UI SIN TRADUCIR] | "Alerts for call-up rosters, schedules and upcoming matches..." |
| `notifPrefs.quietHoursTitle` | [OTRO] | "Quiet Hours..." |
| `notifPrefs.quietHoursDesc` | [FRASE UI SIN TRADUCIR] | "Do not receive push notifications during this time window..." |
| `notifPrefs.quietHoursStart` | [FRASE UI SIN TRADUCIR] | "Quiet start time..." |
| `notifPrefs.quietHoursEnd` | [OTRO] | "Quiet end time..." |
| `notifPrefs.frequencyCapTitle` | [OTRO] | "Frequency Cap..." |
| `notifPrefs.frequencyCapDesc` | [FRASE UI SIN TRADUCIR] | "Maximum number of notifications per day..." |
| `notifPrefs.perDay` | [OTRO] | "per day..." |

#### Namespace: `csv` (29 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `csv.errorEmptyFile` | [FRASE UI SIN TRADUCIR] | "The selected file is empty...." |
| `csv.errorParsing` | [FRASE UI SIN TRADUCIR] | "Could not read file. Check CSV or Excel formatting...." |
| `csv.errorUnsupportedFormat` | [FRASE UI SIN TRADUCIR] | "Unsupported format. Use .csv or .xlsx files...." |
| `csv.errorInvalidNumber` | [FRASE UI SIN TRADUCIR] | "Shirt number must be an integer between 1 and 99...." |
| `csv.errorDuplicateNumberTeam` | [FRASE UI SIN TRADUCIR] | "Shirt number is already taken in this team...." |
| `csv.errorDuplicateNumberFile` | [FRASE UI SIN TRADUCIR] | "Duplicate shirt number within the file...." |
| `csv.errorInvalidPosition` | [FRASE UI SIN TRADUCIR] | "Invalid position. Use GK, DEF, MID, FWD or equivalent...." |
| `csv.errorPlanLimitExceeded` | [FRASE UI SIN TRADUCIR] | "You have reached the maximum players allowed by your plan...." |
| `csv.importSuccessToast` | [FRASE UI SIN TRADUCIR] | "{count} players imported successfully...." |
| `csv.importErrorToast` | [FRASE UI SIN TRADUCIR] | "An error occurred while importing players...." |
| `csv.stepUpload` | [OTRO] | "Upload..." |
| `csv.stepMapping` | [OTRO] | "Mapping..." |
| `csv.stepPreview` | [OTRO] | "Preview..." |
| `csv.dropzoneTitle` | [FRASE UI SIN TRADUCIR] | "Drag and drop your file here or click to browse..." |
| `csv.dropzoneDesc` | [FRASE UI SIN TRADUCIR] | "Supported files: .csv, .xlsx, .xls (max 5MB)..." |
| *... y 14 claves adicionales en este namespace* | | |

#### Namespace: `qrScanner` (5 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `qrScanner.unsupportedBrowser` | [FRASE UI SIN TRADUCIR] | "Your browser or device does not support camera access...." |
| `qrScanner.cameraPermissionError` | [FRASE UI SIN TRADUCIR] | "Could not access camera. Please check browser permissions...." |
| `qrScanner.noQrInImage` | [FRASE UI SIN TRADUCIR] | "No QR code detected in the selected image...." |
| `qrScanner.uploadQrPhoto` | [OTRO] | "Upload QR photo..." |
| `qrScanner.hint` | [FRASE UI SIN TRADUCIR] | "Point your camera at the QR code provided by the coach to jo..." |

#### Namespace: `teamQr` (6 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `teamQr.linkCopiedToast` | [FRASE UI SIN TRADUCIR] | "Invitation link copied to clipboard..." |
| `teamQr.scanInstructions` | [FRASE UI SIN TRADUCIR] | "Show this QR code to your players or share the direct link s..." |
| `teamQr.teamCodeLabel` | [OTRO] | "Access Code:..." |
| `teamQr.copied` | [OTRO] | "Copied..." |
| `teamQr.copyCode` | [OTRO] | "Copy Code..." |
| `teamQr.shareLink` | [OTRO] | "Share Link..." |

#### Namespace: `errors` (3 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `errors.codeInvalid` | [FRASE UI SIN TRADUCIR] | "Invalid code. Must have 6 characters...." |
| `errors.codeExpired` | [FRASE UI SIN TRADUCIR] | "This invitation has expired...." |
| `errors.codeAlreadyUsed` | [FRASE UI SIN TRADUCIR] | "This code has already been used...." |

#### Namespace: `staffJoin` (10 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffJoin.title` | [FRASE UI SIN TRADUCIR] | "Join Technical Staff..." |
| `staffJoin.subtitle` | [FRASE UI SIN TRADUCIR] | "Enter the 6-character code provided by the head coach or pas..." |
| `staffJoin.inputPlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. STF-ABC123 or ABC123..." |
| `staffJoin.orPasteLink` | [FRASE UI SIN TRADUCIR] | "Have an invite link? Paste it here:..." |
| `staffJoin.linkPlaceholder` | [OTRO] | "https://mister11.com/join-staff?code=ABC123..." |
| `staffJoin.searching` | [FRASE UI SIN TRADUCIR] | "Validating code in real time......" |
| `staffJoin.assignedRole` | [OTRO] | "Assigned Role:..." |
| `staffJoin.confirmJoin` | [FRASE UI SIN TRADUCIR] | "CONFIRM AND JOIN STAFF..." |
| `staffJoin.success` | [FRASE UI SIN TRADUCIR] | "You have successfully joined the Technical Staff!..." |
| `staffJoin.errors.invalidCode` | [FRASE UI SIN TRADUCIR] | "Invalid or expired staff code. Contact the head coach...." |

#### Namespace: `staffInvite` (22 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `staffInvite.cardTitle` | [FRASE UI SIN TRADUCIR] | "ACCESS CODE FOR COACHES / STAFF..." |
| `staffInvite.cardSubtitle` | [FRASE UI SIN TRADUCIR] | "Exclusive code to link assistants, fitness coaches, and anal..." |
| `staffInvite.copyCode` | [OTRO] | "Copy Code..." |
| `staffInvite.codeCopied` | [FRASE UI SIN TRADUCIR] | "Staff code copied..." |
| `staffInvite.shareLink` | [OTRO] | "Share Link..." |
| `staffInvite.linkCopied` | [FRASE UI SIN TRADUCIR] | "Staff link copied..." |
| `staffInvite.qrModal` | [OTRO] | "View Staff QR..." |
| `staffInvite.inviteEmail` | [FRASE UI SIN TRADUCIR] | "Invite via Email..." |
| `staffInvite.joinTitle` | [FRASE UI SIN TRADUCIR] | "ACCESS CODE FOR COACHES / STAFF..." |
| `staffInvite.joinSubtitle` | [FRASE UI SIN TRADUCIR] | "If you were invited by the head coach, enter your code here...." |
| `staffInvite.inputPlaceholder` | [FRASE UI SIN TRADUCIR] | "e.g. ABC123 or STF-ABC123..." |
| `staffInvite.joinBtn` | [OTRO] | "JOIN TEAM..." |
| `staffInvite.modalTitle` | [FRASE UI SIN TRADUCIR] | "Invite Technical Staff Member..." |
| `staffInvite.emailLabel` | [FRASE UI SIN TRADUCIR] | "Collaborator email address:..." |
| `staffInvite.roleLabel` | [OTRO] | "Assigned role:..." |
| *... y 7 claves adicionales en este namespace* | | |

#### Namespace: `convocation` (39 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `convocation.title` | [OTRO] | "Convocation..." |
| `convocation.tab` | [OTRO] | "Squad List..." |
| `convocation.selectPlayers` | [FRASE UI SIN TRADUCIR] | "Select called-up players..." |
| `convocation.counter` | [FRASE UI SIN TRADUCIR] | "{count}/18 selected..." |
| `convocation.limitReached` | [FRASE UI SIN TRADUCIR] | "Limit reached: maximum 18 players selected..." |
| `convocation.generate` | [FRASE UI SIN TRADUCIR] | "Generate convocation PNG..." |
| `convocation.generating` | [FRASE UI SIN TRADUCIR] | "Generating PNG......" |
| `convocation.downloading` | [OTRO] | "Downloading......" |
| `convocation.sendToPlayers` | [OTRO] | "Send to players..." |
| `convocation.regenerate` | [FRASE UI SIN TRADUCIR] | "Regenerate / Edit..." |
| `convocation.message` | [FRASE UI SIN TRADUCIR] | "Announcement message..." |
| `convocation.defaultMessage` | [FRASE UI SIN TRADUCIR] | "Call-up squad for the match vs {opponent}. Please check the ..." |
| `convocation.send` | [OTRO] | "Send..." |
| `convocation.sending` | [OTRO] | "Sending......" |
| `convocation.coachLabel` | [FRASE UI SIN TRADUCIR] | "COACH / ENTRENADOR..." |
| *... y 24 claves adicionales en este namespace* | | |

#### Namespace: `whiteboard` (4 claves idénticas a EN)
| Clave | Categoría | Valor Literal |
|---|---|---|
| `whiteboard.exportingFrame` | [FRASE UI SIN TRADUCIR] | "Exporting frame {current} of {total}......" |
| `whiteboard.exportSuccess` | [FRASE UI SIN TRADUCIR] | "MP4 video exported successfully...." |
| `whiteboard.exportError` | [FRASE UI SIN TRADUCIR] | "Error exporting MP4 video. Please try again...." |
| `whiteboard.exportRetry` | [OTRO] | "Retry export..." |


---

