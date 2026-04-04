# Sistema de Registro e Invitaciones

## Descripción General

Sistema seguro de registro con flujo de invitaciones. Los administradores crean invitaciones que se envían a usuarios vía email o WhatsApp. Los usuarios validan la invitación con un token encriptado AES-256 y se registran con contraseña.

## Arquitectura de Seguridad

### 3 Capas de Protección

```
┌─────────────────────────────────────────────────────────┐
│ Capa 1: Encriptación AES-256                           │
│ Token = AES(email + expiryDate)                        │
│ Hace el token opaco - no se puede decodificar sin key  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Capa 2: Expiración de Token                            │
│ Token válido por 28 horas desde creación               │
│ Después de 48h, token es inválido aunque no esté usado │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Capa 3: One-Time Use                                   │
│ Estado "used" en BD garantiza un registro por token    │
│ No importa cuántas veces intenten usar el link         │
└─────────────────────────────────────────────────────────┘
```

## Flujo Completo

```
Admin
  ↓
CreateInvitation API
  ├─ Genera token encriptado: AES(email + expiryDate)
  ├─ Guarda en BD con estado "pending"
  └─ Retorna InvitationCode único

  ↓
SendNotification Service
  ├─ Email: Envía link con token encriptado (SendGrid)
  └─ WhatsApp: Envía link y código (Twilio)

Usuario recibe email/WhatsApp
  ↓
Hace clic en link con token encriptado
  ├─ Frontend valida token
  ├─ Muestra formulario de registro
  └─ Usuario ingresa contraseña y nombre

Usuario envía formulario
  ↓
RegisterUser API
  ├─ Desencripta token y extrae email + expiryDate
  ├─ Valida que no esté expirado (< 48h)
  ├─ Valida que estado = "pending"
  ├─ Crea usuario con contraseña hasheada
  ├─ Marca invitación como "used"
  └─ Retorna token JWT

Usuario autenticado → Dashboard
```

## Componentes Principales

### 1. Models

#### Invitation.cs
```csharp
{
  "id": "inv-001",
  "email": "user@example.com",
  "encryptedToken": "base64-aes-encrypted-token",
  "expiryDate": "2026-04-02T10:30:00Z",  // 28 horas
  "status": "pending",  // pending, used, expired, revoked
  "createdByAdmin": "admin-123",
  "createdAt": "2026-03-31T10:30:00Z",
  "notificationChannel": "email",  // email, whatsapp
  "phoneNumber": "+573001234567",
  "usedAt": null,
  "usedByUserId": null,
  "invitationCode": "ABC12345"
}
```

#### UserProfile.cs (Actualizado)
```csharp
{
  "id": "user-123",
  "email": "user@example.com",
  "displayName": "Juan Pérez",
  "passwordHash": "pbkdf2-hash",
  "status": "active",  // active, inactive, banned
  "role": "user",  // user, admin
  "joinedAtUtc": "2026-03-31T10:35:00Z",
  "lastActiveAtUtc": "2026-03-31T10:40:00Z",
  "totalPoints": 0,
  "totalPredictions": 0,
  "correctPredictions": 0,
  "accuracyPercentage": 0,
  "isEmailVerified": true  // Verified via invitation
}
```

### 2. Services

#### EncryptionService
- **Método**: `EncryptToken(email, expiryDate)` → Token AES-256
- **Método**: `DecryptToken(encryptedToken)` → (email, expiryDate)
- **Método**: `HashPassword(password)` → PBKDF2 hash
- **Notas**:
  - Usa IV aleatorio para cada encriptación
  - IV se prepende a ciphertext
  - Base64 URL-safe encoding

#### AuthenticationService
- **Método**: `CreateInvitationAsync(email, adminId, channel, phoneNumber)`
  - Valida que email no exista
  - Valida que no haya invitación válida activa
  - Genera token encriptado
  - Guarda en BD

- **Método**: `ValidateInvitationAsync(encryptedToken)`
  - Desencripta token
  - Verifica no esté expirado
  - Verifica estado = "pending"
  - Verifica que exista en BD

- **Método**: `RegisterUserAsync(encryptedToken, password, fullName)`
  - Valida invitación
  - Valida contraseña (min 8 caracteres)
  - Crea usuario con passwordHash
  - Marca invitación como "used"

- **Método**: `LoginAsync(email, password)`
  - Obtiene usuario por email
  - Verifica contraseña
  - Actualiza lastActiveAtUtc
  - Retorna usuario

#### NotificationService
- **Método**: `SendInvitationAsync(invitation, invitationLink)`
  - Según channel: email o WhatsApp

- **Método**: `SendEmailAsync(email, subject, htmlContent)`
  - Usa SendGrid API
  - HTML formateado

- **Método**: `SendWhatsAppAsync(phoneNumber, message)`
  - Usa Twilio WhatsApp API
  - Mensaje de texto

### 3. Repositories

#### IInvitationRepository
```
CreateAsync(invitation)
GetByTokenAsync(encryptedToken)
GetByIdAsync(id)
GetByEmailAsync(email)
UpdateAsync(invitation)
MarkAsUsedAsync(id, userId)
RevokeAsync(id)
GetPendingByAdminAsync(adminId)
DeleteAsync(id)
```

#### IUserRepository
```
CreateAsync(user)
GetByIdAsync(id)
GetByEmailAsync(email)
EmailExistsAsync(email)
UpdateAsync(user)
GetLeaderboardAsync(limit)
GetUserRankAsync(userId)
UpdateScoreAsync(userId, points, correct)
DeleteAsync(id)
GetAllAsync()
```

## Endpoints (Por Implementar)

### Admin Endpoints

#### 1. Crear Invitación
```
POST /api/admin/invitations
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "notificationChannel": "email",  // o "whatsapp"
  "phoneNumber": "+573001234567",  // required si channel=whatsapp
  "customMessage": "Únete a nuestro grupo de predicciones"
}

Response (201):
{
  "id": "inv-001",
  "invitationCode": "ABC12345",
  "email": "newuser@example.com",
  "expiryDate": "2026-04-02T10:30:00Z",
  "status": "pending"
}
```

#### 2. Listar Invitaciones Pendientes
```
GET /api/admin/invitations/pending
Authorization: Bearer <admin-jwt>

Response (200):
[
  {
    "id": "inv-001",
    "email": "newuser@example.com",
    "invitationCode": "ABC12345",
    "createdAt": "2026-03-31T10:30:00Z",
    "expiryDate": "2026-04-02T10:30:00Z",
    "status": "pending"
  }
]
```

#### 3. Revocar Invitación
```
DELETE /api/admin/invitations/{id}
Authorization: Bearer <admin-jwt>

Response (200):
{
  "success": true,
  "message": "Invitación revocada"
}
```

### Public Endpoints

#### 1. Validar Invitación
```
GET /api/auth/validate-invitation?token=<encryptedToken>

Response (200):
{
  "isValid": true,
  "email": "newuser@example.com",
  "expiresIn": 3600  // segundos restantes
}

Response (400):
{
  "isValid": false,
  "error": "Invitation has expired"
}
```

#### 2. Registrarse
```
POST /api/auth/register
Content-Type: application/json

{
  "invitationToken": "<encryptedToken>",
  "password": "SecurePassword123!",
  "fullName": "Juan Pérez"
}

Response (201):
{
  "userId": "user-123",
  "email": "newuser@example.com",
  "token": "jwt-token-here",
  "expiresIn": 3600
}
```

#### 3. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "userId": "user-123",
  "token": "jwt-token-here",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "displayName": "Juan Pérez",
    "totalPoints": 100,
    "leaderboardRank": 5
  }
}
```

#### 4. Get Profile
```
GET /api/auth/profile
Authorization: Bearer <jwt>

Response (200):
{
  "id": "user-123",
  "email": "user@example.com",
  "displayName": "Juan Pérez",
  "status": "active",
  "totalPoints": 100,
  "totalPredictions": 25,
  "correctPredictions": 18,
  "accuracyPercentage": 72,
  "leaderboardRank": 5,
  "joinedAt": "2026-03-31T10:35:00Z",
  "lastLoginAt": "2026-03-31T10:40:00Z"
}
```

## Base de Datos

### Contenedores Cosmos DB Necesarios

```sql
-- Invitations Container
{
  "id": "inv-001",
  "email": "user@example.com",
  "encryptedToken": "...",
  "expiryDate": "2026-04-02T10:30:00Z",
  "status": "pending",
  "createdByAdmin": "admin-123",
  "notificationChannel": "email",
  "invitationCode": "ABC12345"
}

-- Users Container
{
  "id": "user-123",
  "email": "user@example.com",
  "displayName": "Juan Pérez",
  "passwordHash": "...",
  "status": "active",
  "role": "user",
  "joinedAtUtc": "2026-03-31T10:35:00Z",
  "isEmailVerified": true
}
```

### Índices Recomendados

```javascript
// Invitations
[
  { "path": "/email" },
  { "path": "/status" },
  { "path": "/encryptedToken" },
  { "path": "/createdByAdmin" }
]

// Users
[
  { "path": "/email" },
  { "path": "/status" },
  { "path": "/totalPoints", "order": "descending" }  // Leaderboard
]
```

## Variables de Entorno

```json
{
  "ENCRYPTION_KEY": "your-secret-key-change-in-production",
  "SENDGRID_API_KEY": "SG.xxxxxx",
  "SENDGRID_FROM_EMAIL": "noreply@worldcup2026.com",
  "TWILIO_ACCOUNT_SID": "ACxxxxxx",
  "TWILIO_AUTH_TOKEN": "your-token",
  "TWILIO_WHATSAPP_NUMBER": "+1234567890"
}
```

## Seguridad

### Validaciones

1. **Email Validation**
   - Formato válido
   - No puede existir otro usuario

2. **Password Validation**
   - Mínimo 8 caracteres
   - Se hashea con PBKDF2 (10,000 iteraciones)

3. **Token Validation**
   - Desencriptación exitosa
   - No expirado (< 48h)
   - Estado = "pending"
   - Existe en BD

4. **Rate Limiting** (Por implementar)
   - Max 5 intentos de registro por IP/email
   - Max 10 intentos de login por cuenta

### Encriptación

- **AES-256-CBC**: Token con IV aleatorio
- **PBKDF2**: Contraseñas con 10,000 iteraciones SHA256
- **Base64 URL-safe**: Encoding para URLs

## Flujo de Error

### Errores en CreateInvitation
- ❌ Email inválido → 400
- ❌ Email ya existe → 400
- ❌ Invitación válida activa → 400
- ❌ Admin no autenticado → 401

### Errores en Registro
- ❌ Token expirado → 400
- ❌ Token inválido → 400
- ❌ Ya registrado → 400
- ❌ Contraseña débil → 400
- ❌ Invitación no existe → 404

### Errores en Login
- ❌ Email no existe → 401
- ❌ Contraseña incorrecta → 401
- ❌ Cuenta inactiva → 403

## Testing

### Test Scenarios

1. **Happy Path**
   - Admin crea invitación
   - Email se envía correctamente
   - Usuario hace clic en link
   - Valida y ve formulario
   - Se registra con contraseña
   - Se autentica

2. **Token Expirado**
   - Token > 48h
   - Registro falla con "Invitation expired"

3. **One-Time Use**
   - Usuario intenta usar token 2 veces
   - Primer intento: éxito
   - Segundo intento: falla "Already used"

4. **Revoked Invitation**
   - Admin revoca invitación
   - Usuario intenta registrarse
   - Falla con "Invitation revoked"

## Próximos Pasos

1. ✅ Crear modelos (Invitation, UserProfile mejorado)
2. ✅ Crear servicios (Encryption, Authentication, Notification)
3. ✅ Crear repositorios (Invitation, User)
4. ⏳ Crear Azure Functions (endpoints)
5. ⏳ Agregar JWT middleware
6. ⏳ Implementar rate limiting
7. ⏳ Tests unitarios
8. ⏳ Tests de integración

## Referencias

- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [AES Encryption](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [SendGrid API](https://docs.sendgrid.com/api-reference/)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)

---

**Última actualización**: 2026-03-31
**Versión**: 1.0.0
