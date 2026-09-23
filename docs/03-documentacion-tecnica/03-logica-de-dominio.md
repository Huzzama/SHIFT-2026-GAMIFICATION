# 3. La lógica de dominio (`src/lib/`)

Todo lo que FARO *decide* vive aquí, en funciones puras. Este capítulo documenta cada módulo con sus entradas, sus reglas exactas y sus salidas. Los números son los del código; si el código cambia, este capítulo debe cambiar con él.

## 3.1 `friction.ts` — el motor de fricción

**Entrada:** un `CourseSnapshot` y si el estudiante está regresando tras una ausencia.
**Salida:** un `FrictionSignal` con estado, días sin actividad, pendientes, impulso y un titular de apoyo.

**Umbrales** (`frictionRules`, configurables):

| Constante | Valor | Uso |
|---|---|---|
| `frictionDays` | 3 | A partir de aquí, FRICTION |
| `disconnectionDays` | 7 | A partir de aquí, DISCONNECTION |
| `overwhelmPendingCount` | 4 | Pendientes vencidos para POSSIBLE_OVERWHELM |
| `momentumDecayWindow` | 14 | Días de inactividad que llevan el impulso de 100 a su piso |
| `momentumFloor` | 20 | El impulso nunca baja de aquí |

**Estados**, en orden de evaluación:

```text
returning                                   → RECOVERY
days ≥ 7                                    → DISCONNECTION
pending ≥ 4  y  days ≥ 3                    → POSSIBLE_OVERWHELM
days ≥ 3                                    → FRICTION
en otro caso                                → FLOWING
```

**Días sin actividad:** la marca de tiempo más reciente en `snapshot.activity`. Si no hay ninguna, se asume `disconnectionDays` (7): sin evidencia de actividad, FARO trata al estudiante como desconectado, no como al corriente.

**Pendientes:** actividades sin entrega cuya fecha límite ya pasó.

**Impulso:**

```text
decay = min(1, days / 14)
load  = min(1, pending / 8) × 0.2
raw   = (1 − decay) × 100 − load × 100
momentum = max(20, round(raw))
```

Un día sin actividad cuesta ~7 puntos. Ocho pendientes vencidos restan 20. Nada lo lleva a cero.

**Regla de producto:** el titular (`headline`) sale del diccionario por estado y es siempre lenguaje de apoyo. No existe un campo de "riesgo".

## 3.2 `journey.ts` — la ruta y la siguiente mejor acción

**`buildJourney(snapshot, friction)`** ordena las actividades por posición del módulo y luego por id, y asigna a cada una un estado:

```text
tiene entrega                              → completed
sin entrega y fecha vencida                → missed
sin entrega y módulo bloqueado             → locked
la primera que no cae en lo anterior       → current
las demás                                  → upcoming
```

La última actividad de cada módulo es un **punto de control** (`checkpoint: true`). `progressPercent` = completadas ÷ total. `currentIndex` es la primera `missed` o `current`. `recalculated` es verdadero cuando el estado de fricción no es FLOWING.

**`nextBestAction(journey, availableMinutes)`** — la regla de cuatro pasos:

1. Abiertas = `missed` + `current` + `upcoming`.
2. De esas, las que caben en `availableMinutes`.
3. De esas, la más corta.
4. Si ninguna cabe, la más corta de todas las abiertas.

La razón mostrada depende del caso: *reabre la ruta* si es `missed`, *cabe en tu tiempo* si cabe, *la más corta* si no.

**`comebackMilestone(journey)`** — la abierta más corta, sin condición de tiempo. Es la misión de regreso: no la más importante, sino la que menos probabilidad tiene de posponerse otra vez.

**`recoveryRoute(journey)`** — tres pasos (hoy / mañana / próxima sesión) tomados de la ruta.

## 3.3 `recoveryPlanner.ts` — factibilidad y plan

El módulo responde con números a *"¿todavía puedo terminar?"*.

**`remainingWork(snapshot, journey)`** — todo lo no completado, **incluidos los módulos bloqueados**. Ignorarlos sería la mentira tranquilizadora que este archivo existe para evitar. Devuelve actividades, minutos, módulos, días hasta el cierre y la fecha de cierre.

**`capacityFor(stated, profile)`** — lo que el estudiante sostiene por día. Lo que declaró gana; si no declaró nada, el ritmo medido repartido en la semana: `(minutosPorSesión × díasPorSemana) ÷ 7`, redondeado a 5. Sin ninguno de los dos, 0.

**`feasibility(work, capacity)`** — el veredicto:

```text
activities = 0                              → comfortable (terminado)
sin deadline, o daysLeft ≤ 0, o capacity ≤ 0 → unknown (no se adivina)
required = minutes / daysLeft
load     = required / capacity
load ≤ 0.85                                 → comfortable
load ≤ 1.40                                 → tight
en otro caso                                → not_realistic
```

`feasibilityRules = { comfortableLoad: 0.85, stretchLoad: 1.4 }`. `not_realistic` existe a propósito.

**`strategies(work, capacity)`** — tres ritmos sobre el mismo trabajo, con `PACE = { comfortable: 1, balanced: 1.35, intensive: 2 }` multiplicando los minutos diarios requeridos. Cada estrategia calcula sus días necesarios y su margen (`buffer = daysLeft − days`). **A lo sumo una** lleva `suggested: true`: la factible más cercana a la capacidad del estudiante. Sin capacidad conocida, ninguna se sugiere.

**`buildPlan(journey, work, dailyMinutes, strategy)`** — empaqueta el trabajo en días:

- Prioridad: primero lo `missed`; luego fecha límite más próxima; luego el orden del curso.
- Presupuesto mínimo por día: 10 minutos.
- Cargado al frente: terminar antes deja el margen *antes* del cierre.
- Una actividad más larga que un día entero se programa igual, ocupando su día.
- Lo que no cabe antes del cierre va a `overflow`. Se muestra, nunca se descarta en silencio.

**`todaysOneThing(plan)`** — el primer ítem del primer día.

## 3.4 `lifeHappened.ts` — el estado de vida y la intervención

Seis estados, cada uno con un tipo de intervención y un presupuesto de minutos:

| Estado | Intervención | Minutos |
|---|---|---|
| `less_time` | `shrink_session` | 10 |
| `overwhelmed` | `single_action` | 15 |
| `dont_understand` | `mentor` | 15 |
| `lost_routine` | `comeback_mission` | 10 |
| `need_break` | `pause` | conserva el actual |
| `ready` | `continue` | 20 |

Nada aquí toca fechas ni reglas académicas. Solo cambia el tamaño y la forma del siguiente paso.

## 3.5 `points.ts` y `rhythm.ts` — puntos

`pointsConfig` (escala semestral):

| Constante | Valor |
|---|---|
| `POINTS_PER_ACTIVITY` | 50 por actividad completada de la ruta (entregada en Canvas o terminada en FARO) |
| `POINTS_PER_MODULE` | 250 por módulo con todas sus actividades completadas |
| `STREAK_BONUS` | 25 (cada 3 días consecutivos, `rhythmMilestoneEvery = 3`) |
| `COMEBACK_BONUS` | 125 (una vez, si hay al menos una sesión en FARO y `awayGap ≥ frictionDays`) |
| `REVIEW_SET_BONUS` | 75 por juego de tarjetas de reconexión terminado |

`computePoints` también devuelve `thisWeek`: lo ganado en los últimos 7 días por acciones hechas en FARO (sesiones, tarjetas y el bono de regreso si lo ganó una de ellas).

`learningRhythm(sessions)` cuenta días consecutivos con sesión, terminando hoy. Romper la racha deja de sumar; nunca resta.

## 3.5b `rewards.ts` — la recompensa del semestre

`rewardsConfig = { SEMESTER_GOAL: 10_000, SEMESTER_CAP_MXN: 200 }` y tres niveles sobre una sola pista:

| Nivel | Puntos |
|---|---|
| $50 MXN | 2,500 |
| $100 MXN | 5,000 |
| $200 MXN | 10,000 |

- `semesterStatus({ currentCourse, previousCourses, redemption })` → total, porcentaje (tope 100), nivel alcanzado, siguiente nivel y puntos que faltan.
- Los niveles **se desbloquean, no se compran**: alcanzar uno no descuenta nada.
- `canRedeem(tier, status)` — el nivel está alcanzado y no se ha canjeado nada este semestre. **Un canje por semestre**: canjear cierra la recompensa en ese nivel.
- `remainingCoursePoints(journey)` — lo mínimo que vale terminar el curso actual (actividades + módulos restantes; los bonos van aparte).

Los cursos anteriores del semestre viven en `data/rewards.mock.ts` (simulados, etiquetados en pantalla). Calibración del demo: 7,700 de cursos anteriores + 850 del curso actual = 8,550 (85 %); terminar las actividades y módulos restantes (1,450) lleva exactamente a 10,000.

## 3.5c `reviewCards.ts` — tarjetas de reconexión

- `touchedModules(journey)` — módulos con al menos una actividad completada, el más reciente primero.
- `pickReviewSet(journey, bank)` — 3 preguntas: hasta 2 del módulo más reciente, luego del anterior. Determinista. Devuelve `[]` si no hay suficientes (la oferta se oculta; nunca se inventan preguntas).
- `shouldOfferReview({ awayGap, frictionDays, questions, records })` — se ofrece si `awayGap ≥ 3`, hay 3 preguntas y no se completó un juego hoy.
- `reviewedToday(records)` — un juego premiado por día.

El banco (`data/reviewBank.ts`) es bilingüe y está ligado al curso del demo (`REVIEW_BANK_COURSE_ID`): un curso real sin banco no recibe tarjetas. En producción, el banco lo escribe el docente o lo genera el backend a partir de las páginas del módulo; **un token de estudiante no puede leer las preguntas de los quizzes de Canvas**, y una tarjeta de reconexión nunca debe confundirse con un quiz calificado.

## 3.6 `achievements.ts` — los cinco logros

| Id | Condición exacta |
|---|---|
| `the_comeback` | `awayGap ≥ 3` y existe al menos una sesión |
| `back_on_track` | al menos 2 sesiones y `momentum ≥ 65` |
| `weathered_the_storm` | alguna sesión con `pendingAtStart ≥ 2` |
| `smart_session` | alguna sesión con `fitAvailableTime` |
| `finisher` | `progressPercent ≥ 100` |

Mientras no se gana, se muestra `hint`, nunca un reproche.

## 3.7 `sessions.ts` — el registro propio de FARO

Una `StudySession` es lo que FARO anota cuando el estudiante marca un paso como hecho. Guarda minutos, cuántos pendientes había al empezar y si cupo en el tiempo declarado. `applySessions` superpone las sesiones sobre la ruta para que impulso, puntos y logros respondan al instante, sin esperar a que Canvas registre la entrega.

## 3.8 `community.ts` — orden del feed y ruteo del SOS

**`rankFeed(posts, ctx)`** ordena por: relevancia para el curso y módulo del estudiante, si alguien pide ayuda y no tiene respuesta, y recencia. **Ignora las reacciones a propósito.** `KIND_WEIGHT` pone `help: 5` por encima de `achievement: 2`.

**`sosRouting`**: `topic → mentor`, `time → recovery`, `people → community`. Tres tipos de atorado, tres sistemas.

**`communityPointsConfig`**: `POINTS_PER_HELPFUL_MARK: 25`, `POINTS_PER_COMPLETED_ROOM: 100`. Entrar a una sala no da puntos; terminarla sí.

## 3.9 `mentorContext.ts` — la frontera de privacidad

Una función, `buildMentorContext`, que produce los once campos del `MentorContext`. Si un dato no se construye aquí, el mentor no lo recibe. No lee `Profile`. Es el único archivo que el Libro 1 cita como contrato de datos del mentor.
