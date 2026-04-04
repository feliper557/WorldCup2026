# 📖 Módulo de Registro - Documentación Completa

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Flujo Completo](#flujo-completo)
3. [Endpoints](#endpoints)
4. [Modelos de Datos](#modelos-de-datos)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Códigos de Error](#códigos-de-error)
7. [Seguridad](#seguridad)
8. [Guía de Implementación](#guía-de-implementación)

---

## Descripción General

El módulo de registro implementa un sistema seguro de invitaciones donde:
- **Admins** crean invitaciones y las envían a usuarios
- **Usuarios** usan el enlace de invitación para registrarse
- **Tokens** son encriptados (AES-256) y válidos por 24 horas
- **Contraseñas** se almacenan con BCrypt (costo 12)
- **JWTs** se emiten tras login exitoso para acceso a la app

---

## Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: Admin crea invitación                               │
│ POST /admin/invitations                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: Sistema envía notificación (Email/WhatsApp)         │
│ POST /api/notifications/send                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: Usuario recibe enlace con token cifrado             │
│ http://localhost:3000/register?token=...&code=ABC123       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: Frontend valida token antes de mostrar formulario   │
│ GET /api/auth/validate-invitation?token=...                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 5: Usuario completa formulario (nombre, contraseña)    │
│ POST /api/auth/register                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 6: Sistema crea usuario y marca invitación como usada  │
│ Response: token JWT + datos de usuario                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ PASO 7: Usuario inicia sesión o accede directamente         │
│ GET /api/auth/profile                                        │
│ Header: Authorization: Bearer <jwt-token>                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Endpoints

### 1. CREAR INVITACIÓN (Admin)

**Endpoint:** `POST /admin/invitations`

**Autenticación:** JWT Bearer Token con `role: "admin"`

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body (Request):**
```json
{
  "email": "usuario@example.com",
  "notificationChannel": "email",
  "phoneNumber": "+573001234567"
}
```

**Parámetros:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string | ✅ | Email del usuario a invitar |
| `notificationChannel` | string | ❌ | `"email"` o `"whatsapp"` (default: "email") |
| `phoneNumber` | string | ❌ | Número telefónico (requerido si notificationChannel es whatsapp) |

**Response: 201 Created**
```json
{
  "link": "http://localhost:3000/register?token=U2FsdGVkX1%2FdH%2F8qR9nK%3D&code=ABCD1234",
  "expiresAt": "2026-04-04T10:30:45Z",
  "invitationCode": "ABCD1234"
}
```

**Respuesta:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `link` | string | URL completa para compartir con el usuario |
| `expiresAt` | datetime | Fecha/hora de expiración (24 horas desde creación) |
| `invitationCode` | string | Código alfanumérico de 8 caracteres para referencia |

---

### 2. REENVIAR INVITACIÓN (Admin)

**Endpoint:** `POST /admin/invitations/{invitationId}/resend`

**Autenticación:** JWT Bearer Token con `role: "admin"`

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Parámetros URL:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `invitationId` | string | ID de la invitación a reenviar |

**Response: 200 OK**
```json
{
  "success": true,
  "message": null,
  "newLink": "http://localhost:3000/register?token=...",
  "newExpiresAt": "2026-04-04T14:20:30Z"
}
```

---

### 3. LISTAR INVITACIONES (Admin)

**Endpoint:** `GET /admin/invitations`

**Autenticación:** JWT Bearer Token con `role: "admin"`

**Response: 200 OK**
```json
{
  "invitations": [
    {
      "id": "inv-001",
      "email": "usuario1@example.com",
      "status": "pending",
      "createdAt": "2026-04-03T10:30:45Z",
      "expiresAt": "2026-04-04T10:30:45Z",
      "notificationChannel": "email"
    },
    {
      "id": "inv-002",
      "email": "usuario2@example.com",
      "status": "used",
      "createdAt": "2026-04-02T15:20:10Z",
      "expiresAt": "2026-04-03T15:20:10Z",
      "notificationChannel": "whatsapp"
    }
  ],
  "total": 2
}
```

**Estados posibles:**
- `"pending"` - Invitación creada, no usada
- `"used"` - Usuario se registró con esta invitación
- `"expired"` - Invitación expiró (24h pasadas)

---

### 4. VALIDAR INVITACIÓN (Usuario - Frontend)

**Endpoint:** `GET /api/auth/validate-invitation?token={encryptedToken}`

**Autenticación:** No requerida

**Parámetros Query:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `token` | string | Token encriptado (URL-encoded) |

**Response: 200 OK - Token válido**
```json
{
  "valid": true,
  "email": "usuario@example.com",
  "message": null
}
```

**Response: 400 Bad Request - Token inválido/expirado**
```json
{
  "valid": false,
  "email": null,
  "message": "Invitation token expired"
}
```

---

### 5. REGISTRAR USUARIO (Usuario - Frontend)

**Endpoint:** `POST /api/auth/register`

**Autenticación:** No requerida

**Headers:**
```http
Content-Type: application/json
```

**Body (Request):**
```json
{
  "token": "U2FsdGVkX1%2FdH%2F8qR9nK%3D",
  "name": "Juan Pérez García",
  "password": "MiContraseñaSegura123!"
}
```

**Parámetros:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `token` | string | ✅ | Token encriptado recibido en el enlace |
| `name` | string | ✅ | Nombre completo del usuario |
| `password` | string | ✅ | Contraseña (mínimo 8 caracteres) |

**Validaciones:**
- Token debe ser válido y no expirado
- Password debe tener mínimo 8 caracteres
- Email no debe existir en la base de datos

**Response: 201 Created - Registro exitoso**
```json
{
  "success": true,
  "userId": "user-550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "message": null,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsImVtYWlsIjoidXN1YXJpb0BleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiZXhwIjoxNzE0NzU5MDA0fQ.abc123..."
}
```

**Response: 400 Bad Request - Validación fallida**
```json
{
  "error": "Password must be at least 8 characters"
}
```

---

### 6. OBTENER PERFIL DEL USUARIO (Usuario)

**Endpoint:** `GET /api/auth/profile`

**Autenticación:** JWT Bearer Token

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response: 200 OK**
```json
{
  "id": "user-550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "displayName": "Juan Pérez García",
  "role": "user",
  "totalPoints": 0,
  "totalPredictions": 0,
  "correctPredictions": 0,
  "accuracyPercentage": 0,
  "leaderboardRank": null
}
```

---

## Modelos de Datos

### InvitationDocument
```json
{
  "id": "inv-001",
  "partitionKey": "invitations",
  "email": "usuario@example.com",
  "token": "U2FsdGVkX1...",
  "status": "pending",
  "createdAt": "2026-04-03T10:30:45.123Z",
  "expiresAt": "2026-04-04T10:30:45.123Z",
  "usedAt": null,
  "notificationChannel": "email",
  "phoneNumber": null
}
```

### UserDocument (después del registro)
```json
{
  "id": "user-550e8400-e29b-41d4-a716-446655440000",
  "partitionKey": "users",
  "email": "usuario@example.com",
  "displayName": "Juan Pérez García",
  "passwordHash": "$2a$12$...",
  "status": "active",
  "role": "user",
  "createdAt": "2026-04-03T11:00:00.000Z",
  "lastLoginAt": "2026-04-03T11:00:00.000Z",
  "isEmailVerified": true,
  "totalPoints": 0,
  "totalPredictions": 0,
  "correctPredictions": 0,
  "accuracyPercentage": 0,
  "leaderboardRank": null,
  "phoneNumber": null,
  "avatarUrl": null
}
```

### JWT Token (después del registro)
El token contiene los claims:
```
{
  "sub": "user-550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "role": "user",
  "exp": 1714759004,
  "iss": "worldcup2026-api",
  "aud": "worldcup2026-app"
}
```

---

## Ejemplos Prácticos

### Escenario Completo: Admin invita a usuario

#### Paso 1: Admin crea invitación
```bash
curl -X POST http://localhost:7071/api/admin/invitations \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo_usuario@ejemplo.com",
    "notificationChannel": "email"
  }'
```

**Respuesta:**
```json
{
  "link": "http://localhost:3000/register?token=U2FsdGVkX1%2FdH%2F8qR9nK%3D&code=XYZW5678",
  "expiresAt": "2026-04-04T10:30:45Z",
  "invitationCode": "XYZW5678"
}
```

#### Paso 2: Admin comparte enlace con usuario
El usuario recibe por email el siguiente enlace:
```
http://localhost:3000/register?token=U2FsdGVkX1%2FdH%2F8qR9nK%3D&code=XYZW5678
```

#### Paso 3: Usuario abre el enlace en el navegador
El frontend hace:
```bash
curl "http://localhost:7071/api/auth/validate-invitation?token=U2FsdGVkX1%2FdH%2F8qR9nK%3D"
```

**Respuesta:**
```json
{
  "valid": true,
  "email": "nuevo_usuario@ejemplo.com"
}
```

#### Paso 4: Si es válido, mostrar formulario de registro
El usuario ingresa:
- Nombre: "Carlos Rodríguez"
- Contraseña: "MiPassword123!"

#### Paso 5: Frontend envía registro
```bash
curl -X POST http://localhost:7071/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "U2FsdGVkX1%2FdH%2F8qR9nK%3D",
    "name": "Carlos Rodríguez",
    "password": "MiPassword123!"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "userId": "user-9f36bc54-d53c-47cf-8e22-3b2a6c8d9f2e",
  "email": "nuevo_usuario@ejemplo.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTlmMzZiYzU0LWQ1M2MtNDdjZi04ZTIyLTNiMmE2YzhkOWYyZSIsImVtYWlsIjoibnVldm9fdXN1YXJpb0BlamVtcGxvLmNvbSIsInJvbGUiOiJ1c2VyIiwiZXhwIjoxNzE0NzU5MDA0fQ..."
}
```

#### Paso 6: Usuario guarda el token y accede a la app
```bash
curl http://localhost:7071/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Respuesta:**
```json
{
  "id": "user-9f36bc54-d53c-47cf-8e22-3b2a6c8d9f2e",
  "email": "nuevo_usuario@ejemplo.com",
  "displayName": "Carlos Rodríguez",
  "role": "user",
  "totalPoints": 0,
  "totalPredictions": 0,
  "correctPredictions": 0,
  "accuracyPercentage": 0,
  "leaderboardRank": null
}
```

---

## Códigos de Error

### HTTP Status Codes

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| **201** | Created - Éxito | Invitación creada, Usuario registrado |
| **200** | OK - Éxito | Token válido, Perfil obtenido |
| **400** | Bad Request - Error del cliente | Contraseña muy corta, Token inválido |
| **401** | Unauthorized - Auth faltante/inválida | Token JWT expirado |
| **403** | Forbidden - Permiso denegado | Usuario no-admin intenta crear invitación |
| **404** | Not Found - Recurso no existe | Invitación no encontrada |
| **500** | Internal Server Error - Error del servidor | Error en base de datos |

### Errores Comunes en Registro

#### Error 1: Contraseña muy corta
```json
{
  "error": "Password must be at least 8 characters"
}
```

#### Error 2: Token inválido/expirado
```json
{
  "valid": false,
  "email": null,
  "message": "Invitation token expired"
}
```

#### Error 3: Email ya existe
```json
{
  "error": "User already exists"
}
```

#### Error 4: Token JWT inválido/expirado en profile
```json
{
  "error": "Token inválido o expirado"
}
```

#### Error 5: No es admin (crear invitación)
```json
{
  "error": "Unauthorized"
}
```
HTTP Status: **403 Forbidden**

---

## Seguridad

### 1. **Encriptación de Tokens**
- **Algoritmo:** AES-256 (modo CBC)
- **IV:** 16 caracteres (fijo en configuración)
- **Clave:** 32 caracteres (en `local.settings.json`)
- **Formato:** Base64 URL-safe
- **Validez:** 24 horas

```csharp
// Ejemplo de token encriptado:
U2FsdGVkX1/dH/8qR9nK...
```

### 2. **Hash de Contraseñas**
- **Algoritmo:** BCrypt
- **Costo:** 12 (∼100ms por hash en servidor moderno)
- **Generación de Salt:** Automática
- **Tiempo de procesamiento:** Imposible crackear por fuerza bruta

```csharp
// Ejemplo de hash almacenado:
$2a$12$R9h7cIPz0gi.URNNGHQ3aeFYV...
```

### 3. **JWT Token**
- **Algoritmo:** HMAC-SHA256
- **Firma:** Imposible falsificar sin la clave secreta
- **Validaciones:** Issuer, Audience, Expiration, Signature
- **Claims:** sub (userId), email, role (verificado contra BD)
- **Duración:** 60 minutos (configurable)

```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "user-123",
  "email": "user@example.com",
  "role": "user",
  "exp": 1714759004
}

Signature: HMAC-SHA256(encoded_header + "." + encoded_payload, secret_key)
```

### 4. **Validación de Rol en Admin**
- **Doble verificación:** JWT claim + Base de datos
- **Detección de tampering:** Si JWT role ≠ DB role → Rechazo
- **Logging:** Todos los intentos se registran

### 5. **Validación de Invitación**
- **Una sola vez:** Después de usar, marca como "used"
- **Expiración:** 24 horas (rechaza después)
- **Existe en BD:** Valida que realmente fue creada por admin
- **Status:** Solo "pending" invitaciones son válidas

### 6. **Configuración Segura**
```json
{
  "Jwt:SecretKey": "clave-secreta-de-al-menos-32-caracteres!!",
  "Jwt:Issuer": "worldcup2026-api",
  "Jwt:Audience": "worldcup2026-app",
  "Jwt:ExpirationMinutes": "60",
  "Encryption:Key": "your-32-character-encryption-key!",
  "Encryption:IV": "your-16-char-iv!"
}
```

**⚠️ IMPORTANTE:**
- Cambiar todas las claves en **PRODUCCIÓN**
- Usar Azure Key Vault para almacenar secrets
- Nunca commitear `local.settings.json` con valores reales
- Usar variables de entorno en producción

---

## Guía de Implementación

### Para el Backend (Ya está hecho ✅)

**Servicios implementados:**
- ✅ `TokenService` - Encriptación/desencriptación de tokens
- ✅ `JwtService` - Generación/validación de JWT
- ✅ `SecureTokenService` - Validación segura con verificación en BD

**Functions implementadas:**
- ✅ `AdminInvitationsFunction` - Crear/reenviar/listar invitaciones
- ✅ `RegisterUserFunction` - Registrar usuario con invitación
- ✅ `ValidateInvitationFunction` - Validar token
- ✅ `LoginFunction` - Login y generación de JWT
- ✅ `GetProfileFunction` - Obtener perfil del usuario

**Base de datos:**
- ✅ `InvitationDocument` - Almacena invitaciones
- ✅ `UserDocument` - Almacena usuarios
- ✅ Partition keys correctamente configuradas

---

### Para el Frontend (Por implementar)

#### 1. Pantalla de Validación de Token
```typescript
// 1. Al cargar /register?token=...&code=...
async function validateToken(token: string) {
  const response = await fetch(
    `/api/auth/validate-invitation?token=${encodeURIComponent(token)}`
  );
  const data = await response.json();
  
  if (!data.valid) {
    // Mostrar error: "Invitación expirada o inválida"
    return;
  }
  
  // Mostrar formulario de registro
  return data.email;
}
```

#### 2. Formulario de Registro
```html
<form onSubmit={handleRegister}>
  <input type="hidden" name="token" value={token} />
  
  <input 
    type="text" 
    name="name" 
    placeholder="Nombre completo"
    required
  />
  
  <input 
    type="password" 
    name="password" 
    placeholder="Contraseña (mínimo 8 caracteres)"
    minLength={8}
    required
  />
  
  <button type="submit">Registrarse</button>
</form>
```

#### 3. Envío de Registro
```typescript
async function handleRegister(e: FormEvent) {
  e.preventDefault();
  
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      name,
      password
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    // Mostrar error: data.error
    return;
  }
  
  // Guardar JWT en localStorage
  localStorage.setItem('token', data.token);
  
  // Redirigir a home
  navigate('/');
}
```

#### 4. Usar el Token en Requests
```typescript
// En cualquier request a la API
const response = await fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

### Para el Admin (Guía de uso)

#### 1. Obtener JWT de Admin
Primero, hacer login con usuario admin:
```bash
POST /api/auth/login
{
  "email": "admin@worldcup.com",
  "password": "AdminPassword123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "role": "admin"
  }
}
```

Guardar el token.

#### 2. Crear Invitación
```bash
curl -X POST http://localhost:7071/api/admin/invitations \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo_usuario@ejemplo.com",
    "notificationChannel": "email"
  }'
```

#### 3. Compartir el link
Enviar por email el valor de `response.link`:
```
http://localhost:3000/register?token=U2FsdGVkX1%2FdH%2F8qR9nK%3D&code=ABCD1234
```

#### 4. Reenviar invitación (si caduca)
```bash
curl -X POST \
  "http://localhost:7071/api/admin/invitations/{invitationId}/resend" \
  -H "Authorization: Bearer <admin-token>"
```

---

## Checklist de Implementación

### Backend ✅
- [x] TokenService (encriptación AES-256)
- [x] JwtService (generación y validación JWT)
- [x] SecureTokenService (validación segura con BD)
- [x] InvitationDocument model
- [x] UserDocument model
- [x] AdminInvitationsFunction
- [x] RegisterUserFunction
- [x] ValidateInvitationFunction
- [x] LoginFunction
- [x] GetProfileFunction
- [x] BCrypt password hashing
- [x] Errores HTTP apropiados
- [x] Logging de seguridad

### Frontend (Por hacer)
- [ ] Página de validación de invitación
- [ ] Formulario de registro
- [ ] Manejo de errores
- [ ] Almacenamiento de JWT
- [ ] Redirección después de registro
- [ ] Header con Authorization en requests

### Admin (Por hacer)
- [ ] Panel de invitaciones
- [ ] Botón "Crear invitación"
- [ ] Copiar/compartir link
- [ ] Historial de invitaciones
- [ ] Botón "Reenviar"

---

## Resumen

✅ **Sistema completo de registro implementado**

- **Admin:** Crea invitaciones con enlace seguro
- **Usuario:** Se registra con token de invitación
- **Seguridad:** Encriptación AES-256, BCrypt, JWT firmado
- **Validación:** Doble verificación (token + BD)
- **Duración:** Invitaciones válidas 24 horas
- **Logging:** Todos los eventos se registran
- **Errores:** Mensajes claros y códigos HTTP correctos

**Estado:** 🟢 Listo para usar

