# 📚 Documentación del Proyecto - WorldCup 2026 API

**Nombre del Proyecto:** WorldCup 2026 API  
**Versión:** 1.0.0  
**Estado:** 🟢 En Desarrollo / Beta  
**Última actualización:** 2026-04-03  
**Autor:** Felipe Rodriguez  
**Lenguaje:** C# (.NET 8)

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Características Principales](#2-características-principales)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura](#4-arquitectura)
5. [Estructura del Proyecto](#5-estructura-del-proyecto)
6. [Módulos Implementados](#6-módulos-implementados)
7. [Endpoints Disponibles](#7-endpoints-disponibles)
8. [Base de Datos](#8-base-de-datos)
9. [Seguridad Implementada](#9-seguridad-implementada)
10. [Guía de Configuración Backend](#10-guía-de-configuración-backend)
11. [Documentación del Frontend](#11-documentación-del-frontend)
12. [Próximos Pasos](#12-próximos-pasos)
13. [Documentación Relacionada](#13-documentación-relacionada)

---

## 1. Descripción General

### 1.1 ¿Qué es WorldCup 2026 API?

**WorldCup 2026** es una aplicación web para la **gestión de predicciones del Mundial de Fútbol 2026**. Los usuarios pueden:

- 📝 Registrarse a través de invitaciones (sistema seguro)
- ⚽ Hacer predicciones sobre resultados de partidos
- 🏆 Acumular puntos por predicciones correctas
- 🎲 Participar en rifas y eventos especiales
- 📊 Ver su ranking en el leaderboard

### 1.2 Objetivo Principal

Crear una **plataforma comunitaria segura y escalable** para que un grupo de usuarios pueda:
- Competir haciendo predicciones
- Interactuar en eventos (watch parties, reuniones)
- Participar en sorteos y rifas
- Ver su posición en el ranking

### 1.3 Alcance Actual

✅ **Backend API completo**
- Autenticación y autorización
- Sistema de invitaciones
- Gestión de usuarios
- 16 endpoints para admin
- Base de datos (Cosmos DB)
- Seguridad implementada (JWT + BCrypt + AES-256)

✅ **Frontend implementado**
- 25+ componentes React
- 7 páginas funcionales
- Autenticación integrada
- Panel de administrador
- Sistema de predicciones (UI)
- Clasificación/ranking
- Rifas y eventos

⚠️ **Parcialmente completado**
- Integración Frontend-Backend (en revisión)
- Sistema de puntuación automático (backend)
- Notificaciones en tiempo real

❌ **Pendiente**
- Testing automatizado (Frontend)
- Integración completa con FIFA API
- Notificaciones en tiempo real

---

## 2. Características Principales

### 2.1 Módulo de Autenticación ✅

- ✅ Registro de usuarios con invitación
- ✅ Sistema de invitaciones con token encriptado (AES-256)
- ✅ Invitaciones válidas por 24 horas
- ✅ Login con email/contraseña
- ✅ JWT Token (HMAC-SHA256)
- ✅ Contraseña hasheada con BCrypt
- ✅ Validación de rol (admin/user)
- ✅ Doble verificación de rol contra BD

### 2.2 Módulo de Usuarios ✅

- ✅ Crear usuario (por invitación)
- ✅ Listar usuarios (admin)
- ✅ Activar/desactivar usuarios (admin)
- ✅ Obtener perfil (con JWT)
- ✅ Tracking de puntos y precisión
- ✅ Historial de logins

### 2.3 Módulo de Eventos ✅

- ✅ Crear eventos especiales (admin)
- ✅ Listar eventos
- ✅ Actualizar eventos (admin)
- ✅ Cancelar eventos (soft delete)
- ✅ Tipos: watch party, reunión, actividad
- ✅ Información de ubicación con Google Maps

### 2.4 Módulo de Rifas ✅

- ✅ Crear rifas (admin)
- ✅ Listar rifas
- ✅ 4 modos de participación:
  - `all` → Todos los usuarios activos
  - `first_N` → Primeros N registrados
  - `manual` → Solo participantes agregados
  - `gender` → Filtrado por género
- ✅ Agregar/remover participantes (admin)
- ✅ Ejecutar sorteo aleatorio (Fisher-Yates)
- ✅ Ver ganadores

### 2.5 Módulo de Invitaciones ✅

- ✅ Crear invitaciones (admin)
- ✅ Reenviar invitaciones (admin)
- ✅ Listar invitaciones (admin)
- ✅ Token encriptado (AES-256)
- ✅ Validar token (usuario)
- ✅ Notificación por email/WhatsApp

### 2.6 Módulo de Predicciones ⚠️ (Parcial)

- ✅ Modelo Prediction creado
- ✅ Base de datos preparada
- ❌ Endpoints no implementados
- ❌ Sistema de puntuación automático pendiente

### 2.7 Módulo de Partidos ⚠️ (Parcial)

- ✅ Modelo Match creado
- ✅ Integración con Football-Data API
- ✅ Endpoints de consulta:
  - Fixtures (próximos partidos)
  - Results (resultados)
  - Live (partidos en vivo)
  - Matches por liga
- ❌ Sistema de actualización automática de resultados

---

## 3. Stack Tecnológico

### 3.1 Backend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | Azure Functions | .NET 8 |
| **Lenguaje** | C# | 8.0 |
| **Runtime** | .NET Isolated Worker | 2.0 |
| **ORM** | Cosmos Client SDK | 3.56.0 |
| **Base de Datos** | Azure Cosmos DB | NoSQL |
| **Autenticación** | JWT (HMAC-SHA256) | System.IdentityModel.Tokens.Jwt 8.17.0 |
| **Passwords** | BCrypt | BCrypt.Net-Core 1.6.0 |
| **Encriptación** | AES-256 | Built-in .NET |
| **Email** | SendGrid | 9.29.3 |
| **WhatsApp** | Twilio | 7.14.3 |
| **API Docs** | Swagger/OpenAPI | 1.6.0 |

### 3.2 Infraestructura

| Componente | Tecnología |
|-----------|-----------|
| **Servidor** | Azure Functions (Serverless) |
| **Base de Datos** | Azure Cosmos DB |
| **Almacenamiento** | Azure Blob Storage (opcional) |
| **Notificaciones** | SendGrid + Twilio |
| **Monitoreo** | Application Insights |
| **Deploy** | Azure DevOps / GitHub Actions |

### 3.3 Herramientas de Desarrollo

| Herramienta | Versión |
|-----------|---------|
| **.NET SDK** | 8.0+ |
| **Visual Studio** | 2022+ |
| **VS Code** | Latest |
| **Azure Tools** | Latest |
| **Postman** | Latest |

---

## 4. Arquitectura

### 4.1 Flujo de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Por hacer)                 │
│              (React/Vue/Angular)                        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Azure Functions API (Backend)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Endpoints:                                         │ │
│  │ - Auth (login, register, profile)                 │ │
│  │ - Admin (invitations, users, events, raffles)     │ │
│  │ - Predictions                                      │ │
│  │ - Matches (Football Data)                         │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Services:                                          │ │
│  │ - JwtService                                       │ │
│  │ - TokenService (AES-256)                          │ │
│  │ - SecureTokenService                              │ │
│  │ - FootballDataService                             │ │
│  │ - NotificationService                             │ │
│  └────────────────────────────────────────────────────┘ │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
    ┌────────▼──────────┐       ┌────────▼──────────┐
    │ Azure Cosmos DB   │       │ External APIs    │
    │  (NoSQL)          │       │                  │
    │ - Users           │       │ • Football-Data  │
    │ - Invitations     │       │ • SendGrid       │
    │ - Events          │       │ • Twilio         │
    │ - Raffles         │       └──────────────────┘
    │ - Matches         │
    │ - Predictions     │
    │ - Scores          │
    └───────────────────┘
```

### 4.2 Flujo de Autenticación

```
Usuario intenta login
        ↓
POST /api/auth/login (email + password)
        ↓
Validar contra BD (BCrypt)
        ↓
JwtService.GenerateToken()
        ↓
Retornar JWT + rol
        ↓
Frontend guarda JWT
        ↓
Requests posteriores con Authorization: Bearer JWT
        ↓
SecureTokenService.ValidateToken()
  ├─ Validar firma (HMAC-SHA256)
  ├─ Validar expiration
  └─ Validar rol contra BD
        ↓
Proceder o rechazar con 401/403
```

### 4.3 Capas del Sistema

```
┌─────────────────────────────────────┐
│     CAPA DE PRESENTACIÓN (HTTP)     │
│  (Azure Functions HTTP Triggers)    │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│    CAPA DE LÓGICA DE NEGOCIO        │
│  (Services, Auth, Validation)       │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      CAPA DE DATOS (Models)         │
│   (UserDocument, InvitationDoc...)  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│   CAPA DE PERSISTENCIA (Cosmos DB)  │
│     (Contenedores, Índices)         │
└─────────────────────────────────────┘
```

---

## 5. Estructura del Proyecto

### 5.1 Organización de Carpetas

```
WorldCup2026/
├── api/                          # Backend .NET
│   ├── Models/
│   │   ├── UserDocument.cs
│   │   ├── InvitationDocument.cs
│   │   ├── EventDocument.cs
│   │   ├── RaffleDocument.cs
│   │   ├── AuthenticationRequests.cs
│   │   ├── AdminRequests.cs
│   │   ├── AuthenticationModels.cs
│   │   ├── Match.cs
│   │   ├── Prediction.cs
│   │   └── Score.cs
│   │
│   ├── Services/
│   │   ├── JwtService.cs
│   │   ├── TokenService.cs
│   │   ├── SecureTokenService.cs
│   │   ├── AuthenticationService.cs
│   │   ├── NotificationService.cs
│   │   ├── FootballDataService.cs
│   │   └── ScoringService.cs
│   │
│   ├── Functions/
│   │   ├── Authentication/
│   │   │   ├── LoginFunction.cs
│   │   │   ├── RegisterUserFunction.cs
│   │   │   ├── ValidateInvitationFunction.cs
│   │   │   └── GetProfileFunction.cs
│   │   │
│   │   ├── Admin/
│   │   │   ├── AdminInvitationsFunction.cs
│   │   │   ├── AdminUsersFunction.cs
│   │   │   ├── AdminEventsFunction.cs
│   │   │   └── AdminRafflesFunction.cs
│   │   │
│   │   ├── Public/
│   │   │   ├── FootballDataFunction.cs
│   │   │   ├── MatchesFunction.cs
│   │   │   ├── PredictionsFunction.cs
│   │   │   └── SendNotificationFunction.cs
│   │
│   ├── Infrastructure/
│   │   ├── Repositories/
│   │   ├── CosmosContext.cs
│   │   └── CosmosOptions.cs
│   │
│   ├── Program.cs
│   ├── local.settings.json
│   ├── api.csproj
│   └── .gitignore
│
├── frontend/                     # Frontend (Por hacer)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/
│   ├── DOCUMENTACION_PROYECTO.md   (Este archivo)
│   ├── MODULO_REGISTRO.md
│   ├── ESTRUCTURA_BD.md
│   ├── ESQUEMA_BD.md
│   ├── FRONTEND_CREAR_INVITACION.md
│   ├── SEGURIDAD_JWT.md
│   ├── API_FOOTBALL_GUIDE.md
│   └── README.md
│
└── README.md                    # Overview del proyecto
```

### 5.2 Convenciones de Código

**Namespaces:**
```
WorldCup.Api.Models
WorldCup.Api.Services
WorldCup.Api.Functions
WorldCup.Api.Infrastructure
```

**Clases:**
- PascalCase: `UserDocument`, `LoginFunction`, `JwtService`
- Sufijos: `Document`, `Service`, `Function`, `Repository`

**Métodos:**
- PascalCase: `GetUserById()`, `ValidateToken()`, `CreateInvitation()`

**Propiedades:**
- camelCase: `email`, `displayName`, `createdAt`

---

## 6. Módulos Implementados

### 6.1 ✅ Módulo de Autenticación (COMPLETO)

**Archivos:**
- `Models/AuthenticationRequests.cs`
- `Services/JwtService.cs`
- `Services/TokenService.cs`
- `Services/SecureTokenService.cs`
- `Functions/LoginFunction.cs`
- `Functions/RegisterUserFunction.cs`
- `Functions/ValidateInvitationFunction.cs`
- `Functions/GetProfileFunction.cs`

**Funcionalidades:**
- ✅ Registro con invitación
- ✅ Login
- ✅ JWT token
- ✅ Validación de rol
- ✅ Protección contra escalación de privilegios

**Estado:** 🟢 Listo para producción

---

### 6.2 ✅ Módulo de Administración (COMPLETO)

**Archivos:**
- `Functions/AdminInvitationsFunction.cs` (3 endpoints)
- `Functions/AdminUsersFunction.cs` (2 endpoints)
- `Functions/AdminEventsFunction.cs` (4 endpoints)
- `Functions/AdminRafflesFunction.cs` (7 endpoints)

**Endpoints:**
- 16 endpoints protegidos solo para admin
- Validación doble de rol
- Logging de seguridad

**Estado:** 🟢 Listo para producción

---

### 6.3 ✅ Módulo de Invitaciones (COMPLETO)

**Archivos:**
- `Models/InvitationDocument.cs`
- `Services/TokenService.cs`
- `Functions/AdminInvitationsFunction.cs`
- `Functions/ValidateInvitationFunction.cs`
- `Functions/SendNotificationFunction.cs`

**Funcionalidades:**
- ✅ Crear invitación (admin)
- ✅ Reenviar invitación (admin)
- ✅ Validar token
- ✅ Token encriptado (AES-256)
- ✅ Validez de 24 horas

**Estado:** 🟢 Listo para producción

---

### 6.4 ✅ Módulo de Eventos (COMPLETO)

**Archivos:**
- `Models/EventDocument.cs`
- `Functions/AdminEventsFunction.cs`

**Funcionalidades:**
- ✅ Crear evento (admin)
- ✅ Listar eventos
- ✅ Actualizar evento (admin)
- ✅ Cancelar evento (admin)
- ✅ 4 tipos: watch_party, meeting, activity, other

**Estado:** 🟢 Listo para producción

---

### 6.5 ✅ Módulo de Rifas (COMPLETO)

**Archivos:**
- `Models/RaffleDocument.cs`
- `Functions/AdminRafflesFunction.cs`

**Funcionalidades:**
- ✅ Crear rifa (admin)
- ✅ 4 modos de participación
- ✅ Agregar/remover participantes
- ✅ Sorteo aleatorio (Fisher-Yates)
- ✅ Ver ganadores

**Estado:** 🟢 Listo para producción

---

### 6.6 ⚠️ Módulo de Usuarios (PARCIAL)

**Archivos:**
- `Models/UserDocument.cs`
- `Functions/AdminUsersFunction.cs`

**Funcionalidades:**
- ✅ Listar usuarios (admin)
- ✅ Activar/desactivar usuarios (admin)
- ❌ Editar perfil (usuario)
- ❌ Cambiar contraseña

**Estado:** 🟡 Parcialmente completo

---

### 6.7 ⚠️ Módulo de Predicciones (PARCIAL)

**Archivos:**
- `Models/Prediction.cs`
- `Functions/PredictionsFunction.cs` (básico)

**Funcionalidades:**
- ⚠️ Crear predicción
- ⚠️ Actualizar predicción
- ❌ Validación de lock (antes del match)
- ❌ Asignación automática de puntos

**Estado:** 🟡 En desarrollo

---

### 6.8 ⚠️ Módulo de Partidos (PARCIAL)

**Archivos:**
- `Models/Match.cs`
- `Services/FootballDataService.cs`
- `Functions/FootballDataFunction.cs`
- `Functions/MatchesFunction.cs`

**Funcionalidades:**
- ✅ Obtener fixtures
- ✅ Obtener resultados
- ✅ Obtener partidos en vivo
- ✅ Obtener por liga
- ❌ Actualización automática

**Estado:** 🟡 Integración básica

---

## 7. Endpoints Disponibles

### 7.1 Endpoints de Autenticación (Públicos)

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/validate-invitation?token=...
GET    /api/auth/profile
```

### 7.2 Endpoints de Administrador (Protegidos)

#### Invitaciones
```
POST   /admin/invitations
POST   /admin/invitations/{id}/resend
GET    /admin/invitations
```

#### Usuarios
```
GET    /admin/users
PATCH  /admin/users/{id}/status
```

#### Eventos
```
POST   /admin/events
GET    /admin/events
PUT    /admin/events/{id}
DELETE /admin/events/{id}
```

#### Rifas
```
POST   /admin/raffles
GET    /admin/raffles
GET    /admin/raffles/{id}
POST   /admin/raffles/{id}/participants
DELETE /admin/raffles/{id}/participants/{userId}
POST   /admin/raffles/{id}/draw
```

### 7.3 Endpoints Públicos

#### Partidos
```
GET    /api/footballdata/fixtures
GET    /api/footballdata/results
GET    /api/footballdata/live
GET    /api/footballdata/upcoming
GET    /api/footballdata/match/{matchId}
GET    /api/footballdata/laliga
GET    /api/footballdata/laliga/results
```

#### Predicciones
```
POST   /api/predictions
GET    /api/predictions
```

#### Matches
```
GET    /api/matches
```

---

## 8. Base de Datos

### 8.1 Contenedores

| Contenedor | Partición | Documentos |
|-----------|-----------|-----------|
| `users` | `/partitionKey` | 4 tipos |
| `matches` | `/tournamentId` | Match |
| `predictions` | `/userId` | Prediction |
| `scores` | `/userId` | Score |

### 8.2 Documentos

| Documento | Propósito |
|-----------|----------|
| `UserDocument` | Usuarios registrados |
| `InvitationDocument` | Invitaciones |
| `EventDocument` | Eventos especiales |
| `RaffleDocument` | Rifas |
| `Match` | Partidos |
| `Prediction` | Predicciones |
| `Score` | Leaderboard |

**Documentación completa:** Ver `ESTRUCTURA_BD.md`

---

## 9. Seguridad Implementada

### 9.1 Autenticación

- ✅ JWT (HMAC-SHA256)
- ✅ Tokens válidos por 60 minutos
- ✅ Refresh token (no implementado)
- ✅ Validación de firma
- ✅ Validación de expiración

### 9.2 Autorización

- ✅ Roles (admin, user)
- ✅ Doble verificación de rol contra BD
- ✅ Protección contra escalación de privilegios
- ✅ Endpoints protegidos solo para admin
- ✅ Logging de intentos fallidos

### 9.3 Contraseñas

- ✅ BCrypt (costo 12)
- ✅ ~100ms por hash
- ✅ Salt automático
- ✅ Nunca en texto plano

### 9.4 Tokens de Invitación

- ✅ AES-256 encriptación
- ✅ Base64 URL-safe
- ✅ Válidos por 24 horas
- ✅ Una sola vez
- ✅ Verificación en BD

### 9.5 Validación de Entrada

- ✅ Email válido (regex)
- ✅ Contraseña mínimo 8 caracteres
- ✅ Sanitización de entrada
- ✅ Prevención de XSS/SQL injection

### 9.6 Monitoreo

- ✅ Logging de eventos
- ✅ Application Insights
- ✅ Alertas de seguridad
- ✅ Auditoría de cambios

**Documentación completa:** Ver `SEGURIDAD_JWT.md`

---

## 10. Guía de Configuración

### 10.1 Requisitos

- .NET 8 SDK
- Azure CLI
- Visual Studio 2022 o VS Code
- Cosmos DB Emulator (local) o cuenta Azure

### 10.2 Variables de Entorno

**`local.settings.json`:**

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    
    "CosmosEndpointUri": "https://localhost:8081",
    "CosmosPrimaryKey": "...",
    "CosmosDatabaseId": "worldcup-db",
    
    "Jwt:SecretKey": "clave-secreta-32-caracteres",
    "Jwt:Issuer": "worldcup2026-api",
    "Jwt:Audience": "worldcup2026-app",
    "Jwt:ExpirationMinutes": "60",
    
    "Encryption:Key": "32-caracteres",
    "Encryption:IV": "16-caracteres",
    
    "App:BaseUrl": "http://localhost:3000",
    
    "SENDGRID_API_KEY": "...",
    "SENDGRID_FROM_EMAIL": "noreply@worldcup2026.com",
    
    "TWILIO_ACCOUNT_SID": "...",
    "TWILIO_AUTH_TOKEN": "...",
    "TWILIO_WHATSAPP_NUMBER": "+..."
  }
}
```

### 10.3 Instalación Local

```bash
# Clonar repositorio
git clone <repo-url>
cd api

# Restaurar paquetes
dotnet restore

# Build
dotnet build

# Ejecutar
func start

# API disponible en http://localhost:7071
```

---

## 11. Documentación del Frontend

### 11.1 Descripción General del Frontend

**Frontend:** Aplicación web interactiva para usuarios y administradores  
**Carpeta:** `/app` (en el raíz del proyecto)  
**Stack:** React 18 + TypeScript + Vite  
**Estado:** 🟢 Implementado  
**Archivos:** 60+ archivos TypeScript/TSX  
**Componentes:** 25+ componentes  
**Páginas:** 7 páginas implementadas  
**Hooks:** 8+ hooks personalizados

---

### 11.2 Stack Tecnológico Frontend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | React | 18+ |
| **Lenguaje** | TypeScript | 5+ |
| **Build Tool** | Vite | 4+ |
| **HTTP Client** | Axios o Fetch | Latest |
| **State Management** | Context API / Zustand | Latest |
| **Routing** | React Router | 6+ |
| **UI Components** | Material-UI o Tailwind | Latest |
| **Styling** | Tailwind CSS | 3+ |
| **Form Validation** | React Hook Form | 7+ |
| **API Documentation** | Swagger/OpenAPI | Latest |
| **Testing** | Jest + React Testing Library | Latest |

---

### 11.3 Estructura del Proyecto Frontend (Actual)

```
app/                         # ← Carpeta del frontend
├── src/
│   ├── components/
│   │   ├── admin/          ✅ IMPLEMENTADO
│   │   │   ├── InvitationForm.tsx
│   │   │   ├── RaffleManager.tsx
│   │   │   └── UserTable.tsx
│   │   │
│   │   ├── auth/           ✅ IMPLEMENTADO
│   │   │   └── RequireAuth.tsx
│   │   │
│   │   ├── Layout/         ✅ IMPLEMENTADO
│   │   │   ├── Layout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── matches/        ✅ IMPLEMENTADO
│   │   │   ├── MatchCard.tsx
│   │   │   ├── PredictionForm.tsx
│   │   │   ├── ChampionPicker.tsx
│   │   │   └── ResultCard.tsx
│   │   │
│   │   ├── raffles/        ✅ IMPLEMENTADO
│   │   │   ├── RaffleCard.tsx
│   │   │   └── RaffleJoinDialog.tsx
│   │   │
│   │   ├── sections/       ✅ IMPLEMENTADO
│   │   │   ├── HeroInfo.tsx
│   │   │   ├── HeroLeaderboard.tsx
│   │   │   ├── HeroMatches.tsx
│   │   │   ├── HeroRaffles.tsx
│   │   │   ├── HeroParticipants.tsx
│   │   │   └── LeaderboardTable.tsx
│   │   │
│   │   └── ui/             ✅ IMPLEMENTADO
│   │       ├── AppLogo.tsx
│   │       ├── AppImage.tsx
│   │       └── Icon.tsx
│   │
│   ├── pages/              ✅ IMPLEMENTADO
│   │   ├── LoginPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── MatchesPage.tsx
│   │   ├── RafflesPage.tsx
│   │   ├── ParticipantsPage.tsx
│   │   ├── RankingPage.tsx
│   │   └── InfoPage.tsx
│   │
│   ├── services/           ✅ IMPLEMENTADO
│   │   ├── apiClient.ts (Cliente HTTP)
│   │   ├── auth.ts (Autenticación)
│   │   ├── mockData.ts (Datos mock)
│   │   └── index.ts
│   │
│   ├── hooks/              ✅ IMPLEMENTADO
│   │   ├── useAuthUser.ts
│   │   ├── useAdmin.ts
│   │   ├── useMatches.ts
│   │   ├── usePredictions.ts
│   │   ├── useRaffles.ts
│   │   ├── useChampionPrediction.ts
│   │   └── useRanking.ts
│   │
│   ├── data/               ✅ IMPLEMENTADO
│   │   └── worldcupGroups.ts (Datos del torneo)
│   │
│   ├── App.tsx             ✅ IMPLEMENTADO
│   ├── main.tsx            ✅ IMPLEMENTADO
│   └── style.css           ✅ IMPLEMENTADO
│
├── public/                 ✅ IMPLEMENTADO
│   └── (assets)
│
├── dist/                   (Build compilado)
├── node_modules/          (Dependencias)
├── vite.config.ts         ✅ IMPLEMENTADO
├── tsconfig.json          ✅ IMPLEMENTADO
├── eslint.config.js       ✅ IMPLEMENTADO
├── package.json           ✅ IMPLEMENTADO
├── .env.local             ✅ IMPLEMENTADO
└── README.md              ✅ IMPLEMENTADO
```

---

### 11.4 Páginas Principales

#### 11.4.1 Página de Login

**Ruta:** `/login`  
**Acceso:** Público

**Funcionalidades:**
- Input email/contraseña
- Validación de forma
- Error handling
- Recordar sesión
- Link a registro

**Componentes:**
- `LoginForm.tsx`
- `ErrorAlert.tsx`

---

#### 11.4.2 Página de Registro

**Ruta:** `/register?token=...&code=...`  
**Acceso:** Público (con token válido)

**Funcionalidades:**
- Validar token antes de mostrar
- Formulario: nombre, contraseña
- Validación en tiempo real
- Crear usuario
- Auto-login después de registro

**Componentes:**
- `RegisterForm.tsx`
- `ValidateToken.ts`

---

#### 11.4.3 Dashboard de Usuario

**Ruta:** `/dashboard`  
**Acceso:** Autenticado

**Funcionalidades:**
- Resumen de predicciones
- Puntos y ranking
- Próximos partidos
- Eventos próximos
- Link a predicciones
- Link a leaderboard

**Componentes:**
- `UserDashboard.tsx`
- `ProfileCard.tsx`
- `MatchesList.tsx`
- `EventsList.tsx`

---

#### 11.4.4 Página de Predicciones

**Ruta:** `/predictions`  
**Acceso:** Autenticado

**Funcionalidades:**
- Listar próximos partidos
- Hacer predicción (equipo A vs B)
- Editar predicción (antes del partido)
- Listar historial
- Ver puntos ganados

**Componentes:**
- `PredictionForm.tsx`
- `PredictionsList.tsx`
- `MatchesList.tsx`

---

#### 11.4.5 Página de Leaderboard

**Ruta:** `/leaderboard`  
**Acceso:** Público

**Funcionalidades:**
- Top 100 usuarios
- Ordenar por puntos
- Ver ranking personal
- Filtro por período (semana, mes, todo)
- Mostrar precisión

**Componentes:**
- `Leaderboard.tsx`
- `UserRankRow.tsx`

---

#### 11.4.6 Página de Eventos

**Ruta:** `/events`  
**Acceso:** Público

**Funcionalidades:**
- Listar eventos activos
- Información del evento
- Ubicación en mapa
- Fecha y hora
- Descripción

**Componentes:**
- `EventsList.tsx`
- `EventCard.tsx`

---

#### 11.4.7 Página de Rifas

**Ruta:** `/raffles`  
**Acceso:** Público

**Funcionalidades:**
- Listar rifas activas
- Ver participantes
- Ver ganadores (si ya sorteada)
- Información del premio

**Componentes:**
- `RafflesList.tsx`
- `RaffleCard.tsx`

---

#### 11.4.8 Panel de Administrador

**Ruta:** `/admin`  
**Acceso:** Solo admin

**Secciones:**
- **Invitaciones** - Crear, reenviar, listar
- **Usuarios** - Listar, activar/desactivar
- **Eventos** - CRUD
- **Rifas** - CRUD, sorteos

**Componentes:**
- `AdminDashboard.tsx`
- `InvitationManager.tsx`
- `UserManager.tsx`
- `EventManager.tsx`
- `RaffleManager.tsx`

---

### 11.5 Servicios de API

#### 11.5.1 authService.ts

```typescript
// Login
login(email: string, password: string)
  → { token, user, role }

// Register
register(token: string, name: string, password: string)
  → { userId, token, email }

// Logout
logout()
  → Limpiar localStorage

// Refresh Token
refreshToken()
  → { newToken }

// Validate Invitation
validateInvitation(token: string)
  → { valid, email }
```

#### 11.5.2 userService.ts

```typescript
// Get Profile
getProfile()
  → UserProfile

// Update Profile
updateProfile(data: UserProfile)
  → UserProfile

// Get Leaderboard
getLeaderboard(limit: number = 100)
  → Score[]

// Get User Rank
getUserRank(userId: string)
  → { rank, totalPoints }
```

#### 11.5.3 adminService.ts

```typescript
// Invitations
createInvitation(email, channel)
  → { link, expiresAt, code }

reendInvitation(invitationId)
  → { link, expiresAt }

listInvitations()
  → Invitation[]

// Users
listUsers()
  → User[]

updateUserStatus(userId, status)
  → User

// Events
createEvent(data)
  → Event

listEvents()
  → Event[]

updateEvent(eventId, data)
  → Event

deleteEvent(eventId)
  → success

// Raffles
createRaffle(data)
  → Raffle

listRaffles()
  → Raffle[]

drawRaffle(raffleId)
  → { winners }
```

#### 11.5.4 predictionService.ts

```typescript
// Predictions
makePrediction(matchId, homeScore, awayScore)
  → Prediction

updatePrediction(predictionId, homeScore, awayScore)
  → Prediction

listMyPredictions()
  → Prediction[]

getMatchPrediction(matchId)
  → Prediction | null
```

#### 11.5.5 matchService.ts

```typescript
// Matches
listUpcomingMatches(limit: number = 10)
  → Match[]

listPastMatches(limit: number = 10)
  → Match[]

getMatchDetail(matchId)
  → Match

searchMatches(query)
  → Match[]
```

---

### 11.6 Tipos TypeScript

```typescript
// types/auth.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: UserProfile;
}

export interface RegisterRequest {
  token: string;
  name: string;
  password: string;
}

// types/user.ts
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracyPercentage: number;
  leaderboardRank?: number;
}

// types/prediction.ts
export interface Prediction {
  id: string;
  matchId: string;
  homeScorePred: number;
  awayScorePred: number;
  pointsAwarded?: number;
  createdAt: string;
}

// types/match.ts
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAtUtc: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  homeScoreFinal?: number;
  awayScoreFinal?: number;
}
```

---

### 11.7 Hooks Personalizados

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem("token");
    if (token) {
      // Llamar a /api/auth/profile
      getProfile(token).then(setUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem("token", response.token);
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, isAuthenticated, loading, login, logout };
};

// hooks/useFetch.ts
export const useFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<T>(url);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [url]);

  return { data, loading, error };
};
```

---

### 11.8 Context de Autenticación

```typescript
// context/AuthContext.tsx
export const AuthContext = createContext<{
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  loading: true,
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAdmin, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

---

### 11.9 Configuración de Axios

```typescript
// services/api.ts
import axios from "axios";

const API_BASE_URL = 
  process.env.REACT_APP_API_URL || "http://localhost:7071";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, limpiar y redirigir a login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

### 11.10 Componentes de Protección

```typescript
// components/Auth/AuthGuard.tsx
export const AuthGuard: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};

// components/Auth/AdminGuard.tsx
export const AdminGuard: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuthContext();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
};
```

---

### 11.11 Rutas

```typescript
// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AuthGuard, AdminGuard } from "./components/Auth";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/raffles" element={<RafflesPage />} />

          {/* Protegidas (Usuario) */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />
          <Route
            path="/predictions"
            element={
              <AuthGuard>
                <PredictionsPage />
              </AuthGuard>
            }
          />

          {/* Protegidas (Admin) */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminPage />
              </AdminGuard>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
```

---

### 11.12 Variables de Entorno

```env
# .env.example
VITE_API_URL=http://localhost:7071
VITE_APP_NAME=WorldCup 2026
VITE_APP_VERSION=1.0.0
```

---

### 11.13 Instalación y Ejecución Frontend (Actual)

```bash
# Ir a la carpeta app
cd app

# Instalar dependencias (ya instaladas)
npm install

# Desarrollo (con Vite en hot reload)
npm run dev
# Disponible en: http://localhost:5173

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

### 11.14 Estado de Desarrollo

🟢 **Frontend:** Implementado y funcionando

**Implementado:**
- ✅ Setup (Vite + React + TypeScript)
- ✅ Estructura de carpetas
- ✅ Componentes (25+)
- ✅ Páginas (7)
- ✅ Hooks personalizados (8+)
- ✅ Servicios de API
- ✅ Autenticación
- ✅ Layout (Navbar, Footer)
- ✅ Panel de admin
- ✅ Página de predicciones
- ✅ Página de clasificación
- ✅ Página de rifas
- ✅ Data del torneo

**Por Completar/Mejorar:**
- [ ] Testing (Jest + React Testing Library)
- [ ] Optimizaciones de rendimiento
- [ ] Error boundaries más robustos
- [ ] Mejoras de UI/UX
- [ ] Integración de notificaciones en tiempo real

---

## 12. Próximos Pasos

### 12.1 Corto Plazo (Sprint 1-2)

- [ ] Frontend (React)
  - [ ] Setup inicial (Vite + React + TypeScript)
  - [ ] Página de login
  - [ ] Página de registro
  - [ ] Dashboard de usuario
  - [ ] Panel de admin

- [ ] Sistema de Predicciones
  - [ ] Endpoints frontend para predicciones
  - [ ] Validación de predicciones en cliente
  - [ ] Lock automático antes del match

- [ ] Sistema de Puntuación
  - [ ] Asignación automática de puntos (backend)
  - [ ] Actualización de leaderboard
  - [ ] Cálculo de precisión

### 12.2 Mediano Plazo (Sprint 3-4)

- [ ] Notificaciones en tiempo real (SignalR/WebSocket)
- [ ] Integración automática de resultados
- [ ] Email de recordatorio de partidos
- [ ] Histórico de predicciones detallado
- [ ] Estadísticas por usuario
- [ ] Comparativas entre usuarios
- [ ] Testing del frontend

### 12.3 Largo Plazo (Futuras versiones)

- [ ] Mobile app (iOS/Android)
- [ ] Sistema de chat/comentarios
- [ ] Desafíos entre usuarios
- [ ] Rewards/Badges
- [ ] Integración con redes sociales
- [ ] Analytics avanzado
- [ ] PWA (Progressive Web App)

---

## 13. Documentación Relacionada

Este proyecto incluye la siguiente documentación:

### Backend

| Documento | Descripción |
|-----------|------------|
| **MODULO_REGISTRO.md** | Flujo completo de registro con ejemplos de API |
| **ESTRUCTURA_BD.md** | Esquema técnico de BD con indices y queries |
| **ESQUEMA_BD.md** | Descripción detallada de documentos |
| **SEGURIDAD_JWT.md** | Detalles de seguridad, encriptación y autenticación |
| **API_FOOTBALL_GUIDE.md** | Integración con Football-Data API |

### Frontend

| Documento | Descripción |
|-----------|------------|
| **FRONTEND_CREAR_INVITACION.md** | Guía completa para implementar crear invitación en frontend |
| **DOCUMENTACION_PROYECTO.md** | Este archivo - Documentación general (incluye frontend) |

### General

| Documento | Descripción |
|-----------|------------|
| **README.md** | Overview rápido del proyecto |

---

## Resumen Ejecutivo

### ¿Qué tiene la aplicación?

✅ **Backend completo con:**
- Autenticación segura (JWT + BCrypt)
- Sistema de invitaciones (AES-256)
- 16 endpoints admin
- 4 módulos funcionales (Invitaciones, Eventos, Rifas, Usuarios)
- Base de datos NoSQL (Cosmos DB)
- Integración con Football-Data API
- Notificaciones (Email/WhatsApp)

✅ **Frontend implementado con:**
- 25+ componentes React
- 7 páginas funcionales
- 8+ hooks personalizados
- Servicios de API (apiClient, auth, mockData)
- Autenticación integrada
- Panel de administrador
- Página de predicciones
- Página de clasificación/ranking
- Página de rifas
- Layout completo (Navbar, Footer)
- Data del torneo (grupos, equipos)
- Vite + React 18 + TypeScript

❌ **No tiene:**
- Sistema automático de predicciones (Backend)
- Notificaciones en tiempo real
- Tests unitarios/E2E (Frontend)
- Integración completa con todos los endpoints del backend

### Estado

🟢 **Backend:** Listo para producción (v1.0)  
🟢 **Frontend:** Implementado (v1.0)  
🟡 **Módulos opcionales:** 80% completos  
🟡 **Integración Frontend-Backend:** Parcial (necesita ajustes)

### Próxima prioridad

👉 **Validar integración Frontend-Backend**
- Revisar endpoints utilizados
- Ajustar URLs de API
- Testing end-to-end
- Correción de errores de integración

---

## Contacto y Soporte

**Desarrollador:** Felipe Rodriguez  
**Email:** felipe@example.com  
**Última actualización:** 2026-04-03  
**Versión:** 1.0.0

---

**Documento de referencia para el equipo de desarrollo, stakeholders y mantenimiento del proyecto.**

