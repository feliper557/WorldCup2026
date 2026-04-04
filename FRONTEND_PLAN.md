# Frontend Plan — World Cup 2026 Predictor

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | React 18 + TypeScript |
| Bundler | Vite |
| Routing | React Router v6 |
| Estilos | MUI (Material UI v6) |
| HTTP | Fetch nativo vía `apiClient.ts` |
| Auth | Azure Static Web Apps (built-in) |
| Deploy | Azure Static Web Apps |

---

## Estructura de directorios

```
app/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Proveedor de router
│   ├── router.tsx                # Definición central de rutas
│   ├── types/
│   │   ├── match.ts              # Match, MatchStatus
│   │   ├── prediction.ts         # Prediction, PredictionRequest
│   │   └── ranking.ts            # Score (tabla de posiciones)
│   ├── services/
│   │   ├── apiClient.ts          # Todas las llamadas HTTP al backend
│   │   └── auth.ts               # Usuario autenticado vía SWA
│   ├── hooks/
│   │   ├── useAuthUser.ts        # Usuario autenticado (nombre, id, roles)
│   │   ├── useMatches.ts         # GET /api/matches
│   │   ├── usePredictions.ts     # GET/POST /api/predictions
│   │   └── useRanking.ts         # GET /api/ranking
│   │   └── useParticipants.ts    # GET /api/participants (perfiles + stats)
│   ├── theme.ts                  # Tema MUI personalizado (colores, tipografía)
│   ├── components/
│   │   ├── auth/
│   │   │   └── RequireAuth.tsx   # Guard: redirige a /login si no hay sesión
│   │   ├── Layout/
│   │   │   ├── Layout.tsx        # Shell con AppBar + Drawer + Outlet
│   │   │   └── Navbar.tsx        # MUI AppBar con tabs de navegación
│   │   ├── matches/
│   │   │   ├── MatchCard.tsx     # MUI Card con equipos, hora y estado del partido
│   │   │   ├── MatchList.tsx     # MUI Grid de partidos con filtros
│   │   │   └── PredictionForm.tsx# MUI Dialog con TextField numérico para marcador
│   │   ├── ranking/
│   │   │   └── RankingTable.tsx  # MUI Table / DataGrid con posiciones
│   │   └── results/
│   │       ├── ResultCard.tsx    # MUI Card con marcador final y puntos ganados
│   │       └── ResultList.tsx    # MUI List/Grid de resultados con filtro por etapa
│   ├── components/
│   │   ... (igual que antes)
│   │   ├── matches/
│   │   │   ├── MatchCard.tsx         # MUI Card: partido disponible + formulario predicción
│   │   │   ├── ResultCard.tsx        # MUI Card: partido finalizado con marcador + puntos
│   │   │   ├── MatchList.tsx         # Lista de partidos disponibles (SCHEDULED/LIVE)
│   │   │   ├── ResultList.tsx        # Lista de partidos finalizados (FINISHED)
│   │   │   └── PredictionForm.tsx    # MUI Dialog con TextField numérico para marcador
│   │   ├── ranking/
│   │   │   ├── RankingTable.tsx      # MUI Table / DataGrid con posiciones
│   │   │   └── ParticipantRow.tsx    # Fila expandible con detalle de un participante
│   │   └── info/
│   │       ├── RulesSection.tsx      # Sección de reglas del juego
│   │       └── EventCard.tsx         # Tarjeta de evento/novedad del torneo
│   └── pages/
│       ├── LoginPage.tsx         # Vista 0 — Pantalla de inicio de sesión
│       ├── MatchesPage.tsx       # Vista 1 — Partidos (próximos + resultados)
│       ├── RankingPage.tsx       # Vista 2 — Tabla de posiciones competitiva
│       ├── ParticipantsPage.tsx  # Vista 4 — Tabla general de participantes
│       └── InfoPage.tsx          # Vista 3 — Reglas e información general
```

---

## Las 5 Vistas (Login + 4 principales)

### Vista 0 — Login (`/login`)

**Propósito**: Punto de entrada para usuarios no autenticados. No se puede acceder a las otras vistas sin iniciar sesión.

**Comportamiento**:
- Si el usuario ya está autenticado (Azure SWA inyecta `/.auth/me`), redirige automáticamente a `/matches`
- Muestra la pantalla de bienvenida con el logo del Mundial 2026 y un botón de login
- El botón redirige a `/.auth/login/github` (o el proveedor configurado en SWA)
- Al volver del proveedor, Azure SWA devuelve al usuario autenticado y se redirige a `/matches`

**Componentes MUI**:
- `Box` full-screen centrado con fondo de color primario
- `Paper` central con sombra (`elevation={6}`) conteniendo:
  - Logo / título con `Typography variant="h4"`
  - Subtítulo descriptivo con `Typography variant="subtitle1"`
  - `Divider`
  - Botón `Button variant="contained" size="large"` con icono de GitHub (`GitHubIcon` de `@mui/icons-material`)
  - Texto secundario: "Solo participantes invitados"

**Flujo de autenticación (Azure SWA)**:
```
Usuario no autenticado
  ↓
  GET /.auth/me  →  { clientPrincipal: null }
  ↓
  Redirigir a /login
  ↓
  Click "Iniciar sesión"
  ↓
  Redirigir a /.auth/login/github
  ↓
  GitHub OAuth → callback de SWA
  ↓
  GET /.auth/me  →  { clientPrincipal: { userId, userDetails, userRoles } }
  ↓
  Redirigir a /matches
```

**Guard `RequireAuth.tsx`**:
```tsx
// Envuelve todas las rutas protegidas
// Si clientPrincipal es null → <Navigate to="/login" />
// Si clientPrincipal existe  → <Outlet />
```

---

### Vista 1 — Partidos (`/matches`)

**Propósito**: Vista unificada de partidos. El usuario puede **ver resultados de partidos anteriores** y **realizar predicciones en los partidos disponibles**, todo desde un mismo lugar.

**Estructura interna con `Tabs` de MUI**:

```
[ Disponibles ]  [ En Vivo ]  [ Resultados ]
```

---

#### Pestaña A — Disponibles (`SCHEDULED`)

- Carga partidos con estado `SCHEDULED` desde `GET /api/matches`
- Muestra `MatchCard` por cada partido con:
  - Equipos (local vs visitante) con `Avatar` + `Typography`
  - Fecha y hora local con `Chip` de fecha
  - Etapa del torneo (`Chip` secundario)
  - Si ya tien predicción: muestra el marcador predicho en un `Badge` verde
  - Botón **"Predecir"** / **"Editar predicción"** que abre un `Dialog`
- El `Dialog` de predicción contiene:
  - Nombre de los equipos como cabecera
  - Dos `TextField type="number"` (Mín: 0) para marcador local y visitante
  - Botón **Guardar** → llama `POST /api/predictions` con `{ matchId, home, away }`
  - Botón Cancelar
- Partidos ordenados por fecha ascendente (el más próximo primero)
- Si no hay partidos disponibles: `Alert severity="info"` con mensaje informativo

---

#### Pestaña B — En Vivo (`LIVE`)

- Carga partidos con estado `LIVE`
- `Chip` parpadeante rojo **● EN VIVO** junto al marcador actual (si disponible)
- Muestra la predicción del usuario en modo solo lectura (`disabled`)
- Marcador en tiempo real (si el backend lo expone); de lo contrario muestra el último conocido
- Si no hay partidos en vivo: `Alert severity="info"` con "No hay partidos en curso"

---

#### Pestaña C — Resultados (`FINISHED`)

- Carga partidos con estado `FINISHED` desde `GET /api/matches`
- Muestra `ResultCard` por cada partido con:
  - Equipos y **marcador final oficial** (`HomeScoreFinal` - `AwayScoreFinal`) en `Typography variant="h5"` centrado
  - Ganador resaltado en negrita o con `Chip` de color
  - Etapa del torneo y fecha como `Chip`
  - Si el usuario realizó predicción: bloque con fondo gris mostrando:
    - Marcador predicho: `X - Y`
    - Puntos obtenidos: `+3 pts` / `+1 pt` / `0 pts` con color verde/amarillo/gris
  - Si no hizo predicción: `Chip` gris "Sin predicción"
- Filtro por etapa: `ToggleButtonGroup` de MUI (Grupos / Octavos / Cuartos / Semis / Final)
- Partidos ordenados por fecha descendente (el más reciente primero)

**Resumen de estados por pestaña**:
| Pestaña | Estado del partido | Acción disponible |
|---------|--------------------|-------------------|
| Disponibles | `SCHEDULED` | Ingresar / editar predicción |
| En Vivo | `LIVE` | Ver predicción bloqueada + marcador en curso |
| Resultados | `FINISHED` | Ver resultado oficial + predicción + puntos |

---

### Vista 2 — Tabla de Posiciones (`/ranking`)

**Propósito**: Ranking competitivo — el usuario ve su posición respecto a los demás participantes ordenado por puntos.

**Comportamiento**:
- Carga el ranking desde `GET /api/ranking`
- Muestra una `Table` de MUI con columnas:
  - `#` Posición
  - Nombre del usuario
  - Puntos totales
  - Predicciones realizadas
  - Marcadores exactos acertados
  - Ganadores correctos
- La fila del usuario autenticado se resalta con `sx={{ backgroundColor: 'primary.light' }}`
- Ordenado por puntos descendente (backend ya ordena)
- En móvil cambia a `List` de MUI con `ListItem` + `ListItemText`
- Podio top 3 con íconos de medalla (`EmojiEventsIcon` dorado/plata/bronce)

**Campos mapeados al modelo `Score`**:
```
Score.Rank            → columna #
Score.DisplayName     → Nombre
Score.TotalPoints     → Puntos
Score.TotalPredictions→ Predicciones
Score.ExactScores     → Exactos ✓
Score.CorrectWinners  → Ganador ✓
```

---

### Vista 4 — Tabla General de Participantes (`/participants`)

**Propósito**: Vista completa con el listado de todos los participantes del torneo predictor. A diferencia del ranking (enfocado en puntos), esta vista permite explorar el perfil y estadísticas detalladas de cada jugador, buscar por nombre y comparar métricas.

**Comportamiento**:
- Carga todos los participantes desde `GET /api/participants` (o `GET /api/ranking` reutilizado)
- Barra de búsqueda con `TextField` + `InputAdornment (SearchIcon)` para filtrar por nombre en tiempo real
- Selector de ordenamiento con `Select` de MUI: por Puntos / por Predicciones / por Exactos / Alfabético
- Muestra la tabla con `Paper` + `Table` de MUI:

| Columna | Descripción | Componente |
|---------|-------------|------------|
| Avatar | Inicial del nombre o foto | `Avatar` |
| Nombre | `DisplayName` del usuario | `Typography` |
| Partidos predichos | `TotalPredictions` | `Typography` |
| Exactos | `ExactScores` (marcador exacto) | `Chip color="success"` |
| Ganadores | `CorrectWinners` | `Chip color="warning"` |
| Puntos | `TotalPoints` | `Typography variant="h6"` |
| Posición | `Rank` | `Badge` o `Chip` |

- Cada fila es expandible (`Collapse` de MUI / `TableRow` expandido) mostrando:
  - Mini-gráfico de barras con puntos por jornada (futuro)
  - % de participación (`TotalPredictions` / total de partidos jugados)
  - Racha actual (futuro, cuando el backend lo exponga)
- El propio usuario autenticado aparece resaltado con borde `primary`
- Vista tarjetas en móvil: `Grid` de `Card` con `Avatar`, nombre y stats

**Tipo TypeScript adicional** (`src/types/participant.ts`):
```ts
export interface Participant {
  userId: string;
  displayName: string;
  totalPoints: number;
  totalPredictions: number;
  exactScores: number;
  correctWinners: number;
  rank: number;
  joinedAtUtc: string;        // desde UserProfile
  lastActiveAtUtc: string;    // desde UserProfile
}
```

**Componentes MUI**:
- `TextField` con `SearchIcon` como `InputAdornment` para búsqueda
- `Select` + `MenuItem` para ordenamiento
- `Table` con `TableRow` expandible usando `Collapse`
- `Avatar` con color generado desde el nombre del usuario
- `LinearProgress` mostrando % de participación en la fila expandida
- En móvil: `Grid` de `Card` con `CardHeader` (Avatar + nombre) + `CardContent` (stats)

---

**Propósito**: Explicar cómo funciona el juego y mostrar novedades o eventos relevantes del torneo.

**Comportamiento**:
- Página estática + sección de eventos dinámica (puede alimentarse desde backend o hardcoded inicialmente)
- Dividida en dos secciones principales con `Tabs` de MUI:
  - **Pestaña 1 — Reglas del juego**
  - **Pestaña 2 — Eventos / Novedades**

---

### Vista 3 — Reglas e Información (`/info`)

#### Pestaña 1 — Reglas del juego

Contenido estático explicado con `Accordion` de MUI (cada regla es un ítem expandible):

| # | Regla |
|---|-------|
| 1 | Cómo hacer una predicción (marcador local - visitante) |
| 2 | Cuándo cierra una predicción (al inicio del partido) |
| 3 | Sistema de puntos: exacto = 3 pts / ganador correcto = 1 pt / incorrecto = 0 pts |
| 4 | Cómo se calcula el ranking (suma de puntos) |
| 5 | Desempate: mayor cantidad de exactos → mayor cantidad de ganadores correctos |
| 6 | Predicciones no enviadas no suman puntos |

**Componentes MUI**:
- `Typography variant="h5"` como título de sección
- `Accordion` + `AccordionSummary` + `AccordionDetails` para cada regla
- `Table` compacta con el resumen del sistema de puntos:

```
┌─────────────────────────┬─────────┐
│ Resultado predicho      │ Puntos  │
├─────────────────────────┼─────────┤
│ Marcador exacto ✓✓     │  3 pts  │
│ Ganador / empate ✓      │  1 pt   │
│ Incorrecto              │  0 pts  │
└─────────────────────────┴─────────┘
```
- `Alert severity="info"` destacando la regla de cierre de predicciones

---

#### Pestaña 2 — Eventos / Novedades

Información sobre el torneo Mundial 2026 y avisos del juego predictor:

**Sección A — Datos del torneo** (estáticos):
- Sede: Canadá, México y Estados Unidos
- Fechas: 11 de junio – 19 de julio 2026
- Equipos participantes: 48 selecciones
- Número de partidos: 104
- `Card` con `CardMedia` (imagen de estadio) + `CardContent` con datos clave
- `Stepper` horizontal de MUI mostrando las fases: Grupos → Octavos → Cuartos → Semis → Final

**Sección B — Novedades / Avisos** (dinámicos, a futuro desde backend):
- Lista de `Alert` o `Card` con avisos del administrador (ej: "Se abre predicción para cuartos de final")
- Inicialmente hardcoded en el frontend como array de objetos
- Estructura preparada para consumir un endpoint `GET /api/announcements` en el futuro

```ts
// Estructura de un aviso (hardcoded por ahora)
interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'success';
  publishedAt: string; // ISO 8601
}
```

**Componentes MUI**:
- `Tabs` + `TabPanel` para alternar entre las dos pestañas
- `Timeline` de `@mui/lab` para mostrar los avisos ordenados por fecha
- `Chip` con fecha de publicación en cada aviso

---

## Tipos TypeScript (`src/types/`)

### `match.ts`
```ts
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface Match {
  id: string;
  tournamentId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAtUtc: string;       // ISO 8601
  stage: string;
  status: MatchStatus;
  homeScoreFinal: number | null;
  awayScoreFinal: number | null;
}
```

### `prediction.ts`
```ts
export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScorePred: number;
  awayScorePred: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  lockedAt: string | null;
  pointsAwarded: number | null;
}

export interface PredictionRequest {
  matchId: string;
  home: number;
  away: number;
}
```

### `ranking.ts`
```ts
export interface Score {
  userId: string;
  displayName: string;
  totalPoints: number;
  totalPredictions: number;
  exactScores: number;
  correctWinners: number;
  rank: number;
}
```

---

## `apiClient.ts` — Endpoints que se deben implementar

```ts
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:7071/api';

// Vista 1 y 3
export const getMatches   = (): Promise<Match[]>       => get('/matches');

// Vista 1 — enviar predicción
export const upsertPrediction = (body: PredictionRequest): Promise<Prediction>
  => post('/predictions', body);

// Vista 1 — leer mis predicciones
export const getMyPredictions = (): Promise<Prediction[]>
  => get('/predictions/me');

// Vista 2
export const getRanking   = (): Promise<Score[]>       => get('/ranking');
```

> Todas las funciones pasan el token de Azure SWA en el header `X-MS-CLIENT-PRINCIPAL-*` automáticamente (el browser lo inyecta en el dominio SWA). En local, se puede mockear.

---

## Navegación (`router.tsx`)

```tsx
<Route path="/login"  element={<LoginPage />} />

<Route element={<RequireAuth />}>           {/* Guard: exige autenticación */}
  <Route path="/" element={<Layout />}>
    <Route index               element={<Navigate to="/matches" />} />
    <Route path="matches"      element={<MatchesPage />} />     {/* Disponibles + En Vivo + Resultados */}
    <Route path="ranking"      element={<RankingPage />} />     {/* Posiciones competitivas */}
    <Route path="participants" element={<ParticipantsPage />} />{/* Tabla general de participantes */}
    <Route path="info"         element={<InfoPage />} />        {/* Reglas + Eventos */}
  </Route>
</Route>
```

La `Navbar` es un `AppBar` de MUI con `Tabs` para las **cuatro secciones principales**: **Partidos | Posiciones | Participantes | Info**. En móvil se convierte en `BottomNavigation` con 4 íconos. Incluye `Avatar` + nombre de usuario y botón de cerrar sesión (`/.auth/logout`).

**Íconos MUI para la navegación**:
| Sección | Ícono |
|---------|-------|
| Partidos | `SportsSoccerIcon` |
| Posiciones | `LeaderboardIcon` |
| Participantes | `GroupIcon` |
| Info / Reglas | `InfoOutlinedIcon` |

---

## Sistema de Puntos (referencia para la UI)

| Resultado predicho | Puntos |
|--------------------|--------|
| Marcador exacto | **3 pts** |
| Ganador/empate correcto | **1 pt** |
| Incorrecto | **0 pts** |

Fuente: `api/Services/ScoringService.cs → CalculatePoints()`

---

## Setup inicial

```powershell
# Desde la raíz del repo
npm create vite@latest app -- --template react-ts
cd app
npm install react-router-dom
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm run dev   # http://localhost:5173
```

### Configuración del tema MUI (`src/theme.ts`)
```ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary:   { main: '#1a237e' }, // azul FIFA
    secondary: { main: '#d32f2f' }, // rojo
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
```

En `main.tsx` envolver con `ThemeProvider`:
```tsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
```

Variable de entorno para apuntar al backend local:

```
# app/.env.local
VITE_API_URL=http://localhost:7071/api
```

---

## Pasos de implementación sugeridos

1. [ ] Scaffold con Vite (`npm create vite@latest app -- --template react-ts`)
2. [ ] Instalar dependencias (`react-router-dom`, `@mui/material`, `@mui/icons-material`)
3. [ ] Crear `src/types/` (match.ts, prediction.ts, ranking.ts)
4. [ ] Crear `src/services/apiClient.ts` y `src/services/auth.ts`
5. [ ] Crear `useAuthUser.ts` + `RequireAuth.tsx` (guard de autenticación)
6. [ ] Implementar `LoginPage.tsx`
7. [ ] Crear `router.tsx` + `Layout.tsx` + `Navbar.tsx`
8. [ ] Implementar `MatchesPage` con `Tabs` internos (Disponibles / En Vivo / Resultados)
9. [ ] Implementar `MatchCard` + `PredictionForm` (pestaña Disponibles)
10. [ ] Implementar `ResultCard` + `ResultList` (pestaña Resultados)
11. [ ] Implementar `RankingPage` + `RankingTable` (podio top 3)
12. [ ] Implementar `ParticipantsPage` + `ParticipantRow` (búsqueda + ordenamiento + expandible)
13. [ ] Implementar `InfoPage` + `RulesSection` + `EventCard`
14. [ ] Conectar con el backend local (CORS ya configurado en `Program.cs`)
15. [ ] Deploy en Azure Static Web Apps
