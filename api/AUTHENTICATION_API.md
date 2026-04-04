# API de Autenticación e Invitaciones

## Descripción General

API para gestionar un flujo de registro seguro basado en invitaciones. Los administradores crean invitaciones que se envían vía email o WhatsApp. Los usuarios validan la invitación con un token encriptado AES-256 y se registran con contraseña.

**Validez de tokens**: 24 horas

## Arquitectura

```
Admin
  ↓
CreateInvitation → Token AES-256(email|expiresAt)
  ↓
Envía vía SendGrid o Twilio
  ↓
Usuario abre link con token
  ↓
ValidateInvitation → Valida token, expiración, estado
  ↓
Muestra formulario de registro
  ↓
RegisterUser → Desencripta, valida, crea usuario
  ↓
Marca invitación como "used"
```

## Modelos de Datos

### InvitationDocument
```json
{
  "id": "inv-001",
  "partitionKey": "invitations",
  "email": "user@example.com",
  "token": "base64-aes-encrypted-token",
  "status": "pending",  // pending | used | expired
  "createdAt": "2026-03-31T10:30:00Z",
  "expiresAt": "2026-04-02T10:30:00Z",  // 24 horas después
  "usedAt": null,
  "notificationChannel": "email",  // email | whatsapp
  "phoneNumber": "+573001234567"
}
```

### UserDocument
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "displayName": "Juan Pérez",
  "passwordHash": "pbkdf2-hash-with-salt",
  "status": "active",  // active | inactive | banned
  "role": "user",  // user | admin
  "createdAt": "2026-03-31T10:35:00Z",
  "lastLoginAt": "2026-03-31T10:40:00Z",
  "isEmailVerified": true,
  "totalPoints": 0,
  "totalPredictions": 0,
  "correctPredictions": 0,
  "accuracyPercentage": 0
}
```

## Endpoints

### 1. CreateInvitation
**Crear una invitación para un nuevo usuario**

```
POST /api/admin/invitations
Authorization: Function Key
Content-Type: application/json

{
  "email": "newuser@example.com",
  "notificationChannel": "email",  // o "whatsapp"
  "phoneNumber": "+573001234567"   // requerido si channel=whatsapp
}
```

**Respuesta (201 Created)**
```json
{
  "link": "http://localhost:3000/register?token=base64-token",
  "expiresAt": "2026-04-02T10:30:00Z",
  "invitationCode": "ABC12345"
}
```

**Errores**
- 400: Email inválido o vacío
- 400: Parámetros faltantes

---

### 2. SendNotification
**Enviar invitación vía email o WhatsApp**

```
POST /api/notifications/send
Authorization: Function Key
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+573001234567",
  "link": "http://localhost:3000/register?token=xxx",
  "channel": "email"  // o "whatsapp"
}
```

**Respuesta (200 OK)**
```json
{
  "success": true
}
```

**Errores**
- 400: Canal desconocido
- 400: Parámetros incompletos
- 500: Error enviando (sin credenciales configuradas)

---

### 3. ValidateInvitation
**Validar token de invitación**

```
GET /api/auth/validate-invitation?token=base64-token
```

**Respuesta (200 OK)**
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

**Respuesta (400 Bad Request)**
```json
{
  "valid": false,
  "message": "El enlace ha expirado."
}
```

**Errores posibles**
- Token inválido → "Token inválido."
- Token expirado → "El enlace ha expirado."
- Ya usado → "Este enlace ya fue utilizado."
- No encontrado → "Invitación no encontrada."

---

### 4. RegisterUser
**Registrar usuario con token válido**

```
POST /api/auth/register
Content-Type: application/json

{
  "token": "base64-token",
  "name": "Juan Pérez",
  "password": "SecurePassword123!"
}
```

**Respuesta (201 Created)**
```json
{
  "success": true,
  "userId": "user-123",
  "email": "user@example.com"
}
```

**Respuesta (400 Bad Request)**
```json
{
  "success": false,
  "message": "Este enlace ya fue utilizado."
}
```

**Validaciones**
- Token vacío → "Token es requerido"
- Nombre vacío → "Nombre es requerido"
- Contraseña < 8 caracteres → "La contraseña debe tener mínimo 8 caracteres"
- Token inválido/expirado → "Token inválido o expirado."

**Proceso**
1. Desencripta token
2. Valida que no esté expirado
3. Busca documento de invitación
4. Valida estado = "pending"
5. Crea usuario con passwordHash (PBKDF2)
6. Marca invitación como "used"
7. Retorna userId

---

## Seguridad

### Encriptación de Tokens

- **Método**: AES-256 CBC
- **IV**: Static (16 caracteres) en configuración
- **Key**: Static (32 caracteres) en configuración
- **Payload**: `email|expiresAt` (ISO 8601)
- **Encoding**: Base64 URL-safe (sin padding)

Ejemplo:
```
Payload: "user@example.com|2026-04-02T10:30:00.0000000Z"
         ↓
AES-256 Encrypt
         ↓
Base64 (URL-safe)
         ↓
Token: "xyz123abc456..."
```

### Hash de Contraseña

- **Método**: PBKDF2 con SHA256
- **Iteraciones**: 10,000
- **Salt**: Aleatorio 16 bytes
- **Derivedkey**: 32 bytes

El hash almacenado incluye: `salt + key` en Base64

### One-Time Use

Una invitación solo puede registrar UN usuario:

1. Estado inicial: `pending`
2. Después de registro: `status = used` + `usedAt = now`
3. Intentos posteriores: Rechazados (ya usado)

---

## Variables de Entorno

```json
{
  "Encryption:Key": "your-32-character-encryption-key!",
  "Encryption:IV": "your-16-char-iv!",
  "SendGrid:ApiKey": "SG.xxxxx",
  "SendGrid:From": "noreply@worldcup2026.com",
  "Twilio:AccountSid": "ACxxxxx",
  "Twilio:AuthToken": "xxxxx",
  "Twilio:WhatsAppNumber": "+1234567890",
  "App:BaseUrl": "http://localhost:3000",
  "Cosmos:Database": "worldcup-db",
  "Cosmos:Container": "invitations"
}
```

### Requisitos

- **Encryption:Key**: Exactamente 32 caracteres
- **Encryption:IV**: Exactamente 16 caracteres
- **SendGrid:ApiKey**: Opcional (sin envío de email si no está)
- **Twilio**: Opcional (sin envío de WhatsApp si no está)

---

## Testing Manual

### 1. Crear Invitación
```bash
curl -X POST http://localhost:7071/api/admin/invitations \
  -H "x-functions-key: <MASTER_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "notificationChannel": "email"
  }'

# Respuesta:
# {
#   "link": "http://localhost:3000/register?token=...",
#   "expiresAt": "2026-04-02T10:30:00Z",
#   "invitationCode": "ABC12345"
# }
```

### 2. Validar Invitación
```bash
TOKEN="<token-from-link>"

curl "http://localhost:7071/api/auth/validate-invitation?token=$TOKEN"

# Respuesta:
# {
#   "valid": true,
#   "email": "test@example.com"
# }
```

### 3. Registrarse
```bash
TOKEN="<token-from-link>"

curl -X POST http://localhost:7071/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$TOKEN\",
    \"name\": \"Test User\",
    \"password\": \"SecurePass123!\"
  }"

# Respuesta:
# {
#   "success": true,
#   "userId": "user-123",
#   "email": "test@example.com"
# }
```

### 4. Intentar Registrarse Nuevamente (debe fallar)
```bash
# Mismo token, debe retornar error "Este enlace ya fue utilizado."
```

---

## Flujos de Error

### Token Expirado
```
Usuario hace clic en link después de 24 horas
         ↓
ValidateInvitation desencripta token
         ↓
Compara DateTime.UtcNow > expiresAt
         ↓
Retorna 400: "El enlace ha expirado."
```

### Token Inválido
```
Alguien intenta usar token corrupto/forjado
         ↓
Decrypt falla (excepción)
         ↓
Retorna null
         ↓
Retorna 400: "Token inválido."
```

### Invitación Ya Usada
```
Usuario intenta usar mismo token 2 veces
         ↓
Primer registro: Éxito, invitación.status = "used"
         ↓
Segundo intento:
  - Desencripta OK
  - No expirada
  - Encuentra invitación
  - status = "used" ✓
  ↓
Retorna 400: "Este enlace ya fue utilizado."
```

---

## Configuración Cosmos DB

### Contenedor: invitations
```javascript
// Partition Key: /partitionKey (siempre "invitations")
// TTL: Opcional (puede configurarse para expirar automáticamente)
```

### Índices Recomendados
```javascript
[
  { "path": "/email" },
  { "path": "/token" },
  { "path": "/status" },
  { "path": "/expiresAt" }
]
```

---

## Próximas Implementaciones

### 1. Login
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### 2. JWT Tokens
- Generar JWT después de registro/login
- Incluir userId, email, role
- Expiry: 1 hora
- Refresh token: 7 días

### 3. Perfil de Usuario
```
GET /api/auth/profile
Authorization: Bearer <jwt>
```

### 4. Admin Panel
- Listar invitaciones pendientes
- Revocar invitaciones
- Ver usuarios registrados

---

## Notas de Desarrollo

### Localhost
- **Base URL**: `http://localhost:3000`
- **Functions**: `http://localhost:7071`
- **Master Key**: En `local.settings.json`

### Ambiente Variable Crítica
```
Encryption:Key y Encryption:IV deben ser exactamente:
- Key: 32 caracteres
- IV: 16 caracteres

Si cambias estos valores, todos los tokens anteriores serán inválidos.
```

### Rate Limiting
Actualmente no implementado. Consideraciones:
- Máx 5 invitaciones por admin/hora
- Máx 10 intentos de registro por email
- Máx 5 intentos de validación por token/hora

---

## Referencias

- [AES Encryption C#](https://docs.microsoft.com/en-us/dotnet/api/system.security.cryptography.aes)
- [PBKDF2 C#](https://docs.microsoft.com/en-us/dotnet/api/system.security.cryptography.rfc2898derivebytes)
- [SendGrid C# Library](https://github.com/sendgrid/sendgrid-csharp)
- [Twilio C# Library](https://github.com/twilio/twilio-csharp)

---

**Versión**: 1.0.0
**Última actualización**: 2026-03-31
**Token Validity**: 24 horas
