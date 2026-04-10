---
name: frontend
description: Conocimiento del frontend React + TypeScript + MUI del proyecto Francachela World Cup 2026 — estructura de páginas, hooks de datos, apiClient, autenticación JWT en cliente, convenciones de componentes, theming y ruteo. Usar cuando se trabaje en pages/, components/, hooks/, services/ del directorio app/.
---

# Frontend — Francachela World Cup 2026

SPA en React 18 + TypeScript + Vite + Material UI servida por Azure Static Web Apps.

## Ubicación

Todo el frontend vive en [app/](app/). Comandos típicos desde `app/`:
- `npm run dev` — servidor Vite local (puerto 5173)
- `npm run build` — build de producción
- `npm run lint` — ESLint

## Estructura

```
app/src/
├── main.tsx              # Entry point
├── App.tsx               # Root con ThemeProvider, AuthProvider, Router
├── router.tsx            # React Router v6 — rutas y guards
├── theme.ts              # MUI theme custom (paleta Francachela)
├── pages/                # Una página por ruta principal
├── components/
│   ├── Layout/           # Header, Footer, Navbar
│   ├── sections/         # Hero* + secciones grandes de páginas
│   ├── ui/               # Componentes reutilizables pequeños
│   ├── matches/          # Tarjetas de partidos, modal predicción
│   ├── raffles/          # Cards/forms de rifas
│   ├── admin/            # UI panel admin
│   └── auth/             # Login form, guards
├── hooks/                # Hooks de fetching/estado
├── services/
│   ├── apiClient.ts      # Todas las llamadas HTTP centralizadas
│   └── auth.ts           # getStoredToken, setToken, logout
├── types/                # Tipos TS por dominio (match, prediction, ranking, admin)
├── data/                 # Datos estáticos (logos, constantes)
└── utils/                # Helpers
```

## Páginas y rutas

| Ruta | Página | Descripción |
|---|---|---|
| `/` o `/partidos` | `MatchesPage` | Lista de partidos con tabs Disponibles/En Vivo/Resultados/Campeón. Modal de predicción por partido. |
| `/posiciones` | `RankingPage` | Hero con stats (Líder, Ronda, Jugadores) + tabla de leaderboard. |
| `/participantes` | `ParticipantsPage` | Lista de jugadores. |
| `/rifas` | `RafflesPage` | Listado de rifas activas, unirse, ganadores. |
| `/info` | `InfoPage` | Reglas y sistema de puntos. |
| `/admin` | `AdminPage` | Panel admin (sync, usuarios, invitaciones, rifas). |
| `/login` | `LoginPage` | Login email/password. |
| `/payment-result` | `PaymentResultPage` | Retorno de Wompi. |

## API client (`services/apiClient.ts`)

**Reglas críticas:**

- `getApiBase()` detecta hostname: en `localhost`/`127.0.0.1` apunta a `http://localhost:7071/api`, en producción usa `/api` (proxy de SWA).
- `request()` adjunta automáticamente `Authorization: Bearer <token>` si hay token en storage.
- Las respuestas del backend pueden venir en PascalCase (.NET) o camelCase. Los mappers de cada endpoint normalizan a camelCase usando `item.Foo || item.foo`.
- **No instanciar fetch directo en componentes** — siempre pasar por `apiClient.ts`.

Endpoints principales exportados: `getMatches`, `upsertPrediction`, `getMyPredictions`, `getRanking`, `getParticipants`, `getRaffles`, `joinRaffle`, `syncMatches`, `syncResults`, `getUsers`, `sendInvitation`, etc.

## Autenticación en el cliente

- El token JWT se guarda con `services/auth.ts::setStoredToken()` tras login.
- `getStoredToken()` lo recupera para cada request.
- `useAuthUser` expone usuario actual y estado de autenticación.
- **NO** existe Azure EasyAuth en este deploy: el header `Authorization: Bearer` es la única forma.
- Logout = limpiar token + redirigir a `/login`.

## Hooks de datos

Convención: un hook por dominio, nombre `useXxx`. Todos siguen el patrón `{ data, loading, error, refetch }`.

| Hook | Propósito |
|---|---|
| `useMatches` | Lista de partidos (incluye live/scheduled/finished) |
| `useRanking` | Ranking ordenado de jugadores |
| `usePredictions` | Predicciones del usuario actual + `upsertPrediction` |
| `useRaffles` | Rifas y participación |
| `useAuthUser` | Usuario JWT actual |
| `useChampionPrediction` | Predicción especial de campeón |
| `useMatchSync`, `useSyncResults` | Disparan sync al backend al cargar páginas (workaround de SWA sin timers) |
| `useAdmin` | Operaciones admin |

Cuando agregues un endpoint nuevo: añade método en `apiClient.ts`, tipo en `types/`, y un hook en `hooks/` si se va a consumir desde varios lugares.

## Componentes y theming

- **MUI v5** con `useTheme()`. Paleta custom Francachela en `theme.ts`: `primary` (rosa), `secondary` (verde menta), `warning` (mostaza), fondo oscuro.
- Componentes hero usan animaciones CSS keyframes (`fadeUp`, `slideUp`, `pulse`) inline en el `sx` o `style` tags.
- **Folk-art SVG decorations**: varias secciones tienen un sub-componente `FolkArtDecorations` con polígonos y flores marigold para estilo mexicano.
- Avatares del leaderboard usan paleta rotativa con `getAvatarColors(rank)`.
- Mobile-first: usar `{ xs, sm, md }` en `sx` props.

## Convenciones

- **Idioma UI**: español. Etapas del torneo se traducen en cliente (`GROUP_STAGE → "Grupos"`, `ROUND_OF_16 → "Octavos"`, etc).
- **Tiempos**: el backend ya devuelve hora Colombia. NO aplicar timezone offset adicional. Para formatear, usar `Intl.DateTimeFormat` con `timeZone: 'America/Bogota'`.
- **Estado**: NO Redux/Zustand. Sólo hooks + Context (`AuthContext`).
- **TypeScript**: tipos estrictos en `types/`. Evitar `any` salvo al deserializar API (usar `any[]` y mapear inmediatamente).
- **Imports**: rutas relativas (no alias).

## Static Web Apps config

[app/staticwebapp.config.json](app/staticwebapp.config.json):
- Todas las rutas `/api/*` están abiertas como anonymous (la auth real es JWT del lado backend).
- SPA fallback: `/*` → `/index.html` para soportar React Router.
- 404 → reescribe a index.html.

## Patrones a evitar

- Llamar `fetch` directo desde componentes → usar `apiClient.ts`.
- Hardcodear datos de ejemplo en hero/cards → consumir hooks reales (`useRanking`, `useMatches`).
- Asumir formato camelCase del backend sin mapper.
- Calcular puntos en cliente → el backend ya los calcula.
- Aplicar `+5h`/`-5h` a tiempos → ya vienen en hora Colombia.
