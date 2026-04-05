# 📋 Flujo Completo de Inscripción - Admin → Usuario

**Fecha:** 2026-04-04  
**Versión:** 1.0  
**Estado:** ✅ Implementado  
**Autor:** Claude Code  

---

## 🎯 Descripción General

El proceso de inscripción en Francachela está completamente controlado por **administradores**. Los usuarios **no pueden registrarse directamente**. Un admin debe crear una invitación con token seguro (AES-256 encriptado) que:

1. Expira en **24 horas**
2. Solo se puede usar **UNA VEZ**
3. Crea el usuario con **contraseña hasheada en BCrypt**
4. Genera **JWT token** automáticamente

---

## 🔄 Flujo Completo (8 Pasos)

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN EN PANEL ADMIN                        │
└─────────────────────────────────────────────────────────────────┘
        1. Click "Crear Invitación"
           ├─ Email: usuario@example.com
           ├─ Canal: email | sms | manual
           └─ Click "Generar Link"
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│            POST /api/admin/invitations (Backend)                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 2. Validar JWT admin                                       │ │
│  │    - Verificar token Bearer                               │ │
│  │    - Cross-check role en BD (prevenir tampering)          │ │
│  │    - Retornar Unauthorized si falla                       │ │
│  │                                                            │ │
│  │ 3. Validar input                                          │ │
│  │    - Email es requerido                                  │ │
│  │    - Email no debe existir en BD                         │ │
│  │                                                            │ │
│  │ 4. Generar Token Seguro                                  │ │
│  │    - Encriptar (email + expiresAt) con AES-256          │ │
│  │    - Generar código de invitación (6 dígitos)           │ │
│  │    - Guardar en BD con status="pending"                 │ │
│  │    - Expira en 24 horas                                 │ │
│  │                                                            │ │
│  │ 5. Construir Link de Registro                            │ │
│  │    https://app.com/register?token=<encrypted>&code=<123> │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼ Response: { link, expiresAt, code }
┌─────────────────────────────────────────────────────────────────┐
│              ADMIN COPIA EL LINK Y LO ENVÍA                     │
│           (Por email, WhatsApp, Slack, etc)                     │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   USUARIO RECIBE LINK                           │
│        6. Click en: https://app.com/register?token=...          │
│           Frontend carga RegisterPage                           │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│           USUARIO LLENA FORMULARIO DE REGISTRO                  │
│                                                                 │
│  ┌────────────────────────────────────┐                        │
│  │ Nombre Completo: [Juan Pérez    ]  │                        │
│  │ Contraseña:      [••••••••••    ]  │ min 8 caracteres     │
│  │                  [••••••••••    ]  │ confirmar            │
│  │                                    │                        │
│  │ [Crear Cuenta] [Cancelar]         │                        │
│  └────────────────────────────────────┘                        │
│                                                                 │
│  7. Click "Crear Cuenta"                                       │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│         POST /api/auth/register (Frontend → Backend)            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Body:                                                      │ │
│  │ {                                                          │ │
│  │   "token": "<encrypted_token_from_url>",                 │ │
│  │   "name": "Juan Pérez",                                 │ │
│  │   "password": "Password@123456"                         │ │
│  │ }                                                          │ │
│  │                                                            │ │
│  │ 8. Backend:                                              │ │
│  │   a) Desencriptar token                                 │ │
│  │   b) Validar que no esté expirado                       │ │
│  │   c) Encontrar invitación en BD                         │ │
│  │   d) Verificar status != "used"                         │ │
│  │   e) Hash password con BCrypt (cost=12)                │ │
│  │   f) Crear UserEntity en BD                            │ │
│  │   g) Marcar invitación como used                       │ │
│  │   h) Generar JWT token                                 │ │
│  │   i) Retornar token + userId                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼ Response: { token, userId, email }
┌─────────────────────────────────────────────────────────────────┐
│              USUARIO REGISTRADO EXITOSAMENTE                    │
│                                                                 │
│  ✅ Token guardado en localStorage                              │
│  ✅ Redirige a /matches                                         │
│  ✅ Navbar muestra avatar con inicial del nombre              │
│  ✅ Usuario puede hacer predicciones                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Diagrama de Base de Datos

### Tabla: `InvitationEntity`
```sql
InvitationEntity {
  Id                 string        -- PK, Guid
  Email              string        -- Email del usuario (unique)
  Token              string        -- Encrypted token (AES-256)
  Status             string        -- 'pending' | 'used' | 'expired'
  CreatedAtUtc       DateTime      -- Fecha creación
  ExpiresAtUtc       DateTime      -- Expira en 24 horas
  UsedAtUtc          DateTime?     -- Fecha cuando se usó
  UsedByUserId       string?       -- FK -> UserEntity.Id (cuando se convierte en used)
  NotificationChannel string?      -- 'email' | 'sms' | 'manual'
  PhoneNumber        string?       -- Número telefónico si es SMS
  CreatedBy          string        -- Admin que creó (FK -> UserEntity.Id)
}
```

### Tabla: `UserEntity` (después del registro)
```sql
UserEntity {
  Id                 string        -- PK, Guid
  Email              string        -- UNIQUE
  DisplayName        string        -- Del formulario de registro
  PasswordHash       string        -- BCrypt hash (salt incluido)
  Status             string        -- 'active' | 'inactive'
  Role               string        -- 'user' | 'admin'
  IsEmailVerified    bool          -- true (verificado por invitación)
  CreatedAtUtc       DateTime      -- Fecha registro
  ...                              -- otros campos de puntos, predicciones
}
```

---

## 🔐 Paso 1: Admin Crea Invitación

### Endpoint
```http
POST /api/admin/invitations
Authorization: Bearer <JWT_ADMIN_TOKEN>
Content-Type: application/json
```

### Request Body
```json
{
  "email": "jugador@example.com",
  "notificationChannel": "email",
  "phoneNumber": null
}
```

### Validaciones (Backend)
✅ JWT token debe ser válido  
✅ Usuario en JWT debe tener role="admin"  
✅ Email es requerido  
✅ Email no puede existir ya en BD  
✅ Formato de email válido  

### Response Success (201 Created)
```json
{
  "link": "https://francachela.com/register?token=U2FsdGVkX1%2Fq...&code=847362",
  "expiresAt": "2026-04-05T14:30:00Z",
  "invitationCode": "847362"
}
```

**Qué hace el backend:**

1. **Valida JWT admin** - Verifica token Bearer y role en BD
2. **Valida input** - Email requerido y no debe existir
3. **Genera token seguro:**
   ```csharp
   // AES-256 encryption del email + expiración
   var encryptedToken = _tokenService.Encrypt(email, expiresAt);
   
   // Código de 6 dígitos para referencia manual
   var invitationCode = TokenService.GenerateInvitationCode();
   ```
4. **Crea InvitationEntity** en BD:
   ```csharp
   {
     Id: Guid.NewGuid(),
     Email: "jugador@example.com",
     Token: "<encrypted>",
     Status: "pending",
     ExpiresAtUtc: DateTime.UtcNow.AddHours(24),
     CreatedBy: adminId,
     NotificationChannel: "email"
   }
   ```
5. **Construye link:**
   ```
   https://app.com/register?token=<encrypted>&code=847362
   ```

### Response Error (400)
```json
{
  "error": "El usuario ya existe"
}
```

Otros errores:
- `"Email es requerido"` (400)
- `"Unauthorized"` (401) - Token inválido o no es admin
- `"Invalid request"` (400) - Body mal formado

---

## 📧 Paso 2: Admin Envía Link al Usuario

El admin **COPIA el link** y lo envía por:
- 📧 Email
- 💬 WhatsApp / Telegram
- 📱 SMS
- 🤖 Slack / Discord
- 📋 Compartir directamente

**IMPORTANTE:**  
⚠️ El link **EXPIRA EN 24 HORAS**  
⚠️ Solo se puede usar **UNA VEZ**  
⚠️ Si el usuario no se registra, admin debe crear nueva invitación

---

## 📝 Paso 3: Usuario Hace Click en el Link

### Frontend: RegisterPage Component

El usuario hace click: `https://app.com/register?token=...&code=123`

```typescript
// RegisterPage.tsx
function RegisterPage() {
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token'); // ← Token encriptado
  const code = searchParams.get('code');    // ← Referencia visual
  
  // Si no hay token, mostrar error
  if (!token) {
    return <div>Link de invitación inválido</div>;
  }
  
  return (
    <RegistrationForm token={token} code={code} />
  );
}
```

### Formulario de Registro (UI)
```
┌──────────────────────────────────────────┐
│     Completa tu Registro - Francachela   │
│                                          │
│ 📋 Invitación: #847362                   │
│                                          │
│ Nombre Completo *                        │
│ ┌──────────────────────────────────────┐ │
│ │ Juan Pérez                          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Contraseña *                             │
│ ┌──────────────────────────────────────┐ │
│ │ ••••••••••••                        │ │
│ └──────────────────────────────────────┘ │
│ Mín 8 caracteres                         │
│                                          │
│ Confirmar Contraseña *                   │
│ ┌──────────────────────────────────────┐ │
│ │ ••••••••••••                        │ │
│ └──────────────────────────────────────┘ │
│                                          │
│  [Crear Cuenta] [Cancelar]              │
│                                          │
└──────────────────────────────────────────┘
```

### Validaciones (Frontend)
- Nombre es requerido
- Contraseña mínimo 8 caracteres
- Las contraseñas coinciden
- Email no está vacío (viene del token)

---

## 🔑 Paso 4: Usuario Envía Registro

### Request (POST)
```http
POST /api/auth/register
Content-Type: application/json
```

### Body
```json
{
  "token": "U2FsdGVkX1fq7aBsq2vxq2Z...",
  "name": "Juan Pérez",
  "password": "MiPassword@123456"
}
```

### Validaciones (Backend)

#### A) Token Válido
```csharp
// 1. Desencriptar token
var decrypted = _tokenService.Decrypt(token);
// Returns: (email: "jugador@example.com", expiresAt: "2026-04-05T14:30:00Z")

// 2. Validar no esté expirado
if (DateTime.UtcNow > decrypted.expiresAt)
  return Error("Token inválido o expirado");
```

#### B) Invitación Existe
```csharp
// Buscar invitación por token encriptado
var invite = await _invitationRepository.GetByTokenAsync(token);

if (invite == null)
  return Error("Invitación no encontrada");

if (invite.Status == "used")
  return Error("Este enlace ya fue utilizado");

if (invite.Status == "expired")
  return Error("La invitación ha expirado");
```

#### C) Contraseña Válida
```csharp
if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
  return Error("La contraseña debe tener mínimo 8 caracteres");
```

---

## 🔓 Paso 5: Backend Crea Usuario (Seguro)

### A) Hash de Contraseña (BCrypt)
```csharp
// BCrypt.Net automáticamente:
// 1. Genera random salt
// 2. Aplica salt a password
// 3. Realiza múltiples rondas de hashing
// 4. Codifica en formato bcrypt

var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, 12);
// Cost factor 12 = ~100ms por hash (buena seguridad sin ser lento)

// Ejemplo real:
// Input: "MiPassword@123456"
// Output: "$2b$12$q8p5Ib4JeBhL7eBzR4zF.ev6pN3qY9Ib4B2mL.nS4Y6vK2pL8G"
//          ^ ^ ^^   ^ ^^    ^ Algoritmo, cost, salt, hash
```

**Ventajas BCrypt:**
- ✅ Salt único por hash
- ✅ Imposible revertir (one-way)
- ✅ Resistente a ataques GPU (lento a propósito)
- ✅ Cost factor ajustable (future-proof)

### B) Crear UserEntity
```csharp
var user = new UserEntity
{
    Id = Guid.NewGuid().ToString(),
    Email = "jugador@example.com",
    DisplayName = "Juan Pérez",
    PasswordHash = "$2b$12$q8p5Ib4JeBhL7eBzR4zF.ev...",
    Status = "active",
    Role = "user",
    IsEmailVerified = true,  // ← Email verificado por invitación
    CreatedAtUtc = DateTime.UtcNow
};

await _userRepository.CreateAsync(user);
```

### C) Marcar Invitación como "Used"
```csharp
await _invitationRepository.MarkAsUsedAsync(
    invitationId: invite.Id,
    userId: user.Id,
    usedAt: DateTime.UtcNow
);

// Ahora: invite.Status = "used"
// No se puede volver a usar este token
```

### D) Generar JWT Token
```csharp
var jwtToken = _jwtService.GenerateToken(user);
// JWT contiene:
// {
//   "sub": "user-id-123",
//   "email": "jugador@example.com",
//   "role": "user",
//   "name": "Juan Pérez",
//   "iat": 1712282400,
//   "exp": 1712368800
// }
// Expira en 24 horas
```

**IMPORTANTE:** El JWT token **NO contiene** la contraseña ni el salt

---

## ✅ Paso 6: Response Success (201 Created)

```json
{
  "success": true,
  "userId": "user-abc-123",
  "email": "jugador@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWFiYy0xMjMiLCJlbWFpbCI6ImpvZ2Fkb3JAZXhhbXBsZS5jb20iLCJyb2xlIjoiInVzZXIiLCJuYW1lIjoiSnVhbiBQw6lyZXoiLCJpYXQiOjE3MTIyODI0MDAsImV4cCI6MTcxMjM2ODgwMH0.q8p5Ib4JeBhL7eBzR4zF..."
}
```

### Frontend: Guarda el Token
```typescript
// src/services/auth.ts
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, name, password })
});

const data = await response.json();

// Guardar en localStorage
localStorage.setItem('jwtToken', data.token);
localStorage.setItem('user', JSON.stringify({
  id: data.userId,
  email: data.email,
  displayName: name
}));

// Redirigir a /matches
navigate('/matches');
```

### Navbar Detecta Login
```typescript
// useAuthUser hook
const token = getStoredToken(); // ← Detecta JWT en localStorage
if (token) {
  setUser(getStoredUser()); // ← Lee nombre del usuario
}
```

---

## 🔄 Paso 7: Re-enviar Invitación

Si el usuario no se registra en 24 horas, el admin puede **re-enviar** una nueva invitación:

### Endpoint
```http
POST /api/admin/invitations/{invitationId}/resend
Authorization: Bearer <JWT_ADMIN_TOKEN>
```

### Qué Hace
1. Obtiene la invitación original por ID
2. Genera **nuevo token encriptado** (con nueva expiración)
3. Marca status como "pending" nuevamente
4. Retorna nuevo link

### Response
```json
{
  "success": true,
  "newLink": "https://app.com/register?token=NewToken&code=...",
  "newExpiresAt": "2026-04-06T14:30:00Z"
}
```

**IMPORTANTE:**  
- El token anterior ya **NO es válido**
- Se puede re-enviar **múltiples veces**
- Cada re-envío genera nueva expiración de 24 horas

---

## 🛡️ Seguridad Implementada

### 1️⃣ Encriptación AES-256
```
❌ INSEGURO: Token sin encriptar
  ?token=usuario@example.com&expires=2026-04-05

✅ SEGURO: Token encriptado
  ?token=U2FsdGVkX1fq7aBsq2vxq2Z9n8m7L4k3j2H1G0F9E8D7C6B5A4Z3Y2X1W0V9U8T7S6R5Q4P3O2N1M0
```

El token contiene:
- Email del usuario
- Fecha de expiración
- Salt único por encryption

### 2️⃣ Token Expira en 24 Horas
```csharp
var expiresAt = DateTime.UtcNow.AddHours(24);

// Si usuario intenta después de 24 horas:
if (DateTime.UtcNow > expiresAt)
  return Error("Token inválido o expirado");
```

### 3️⃣ Token Se Usa Una Sola Vez
```csharp
// Estado de invitación:
// - pending: No se ha usado
// - used: Usuario completó el registro
// - expired: Pasó el tiempo de 24 horas

if (invite.Status == "used")
  return Error("Este enlace ya fue utilizado");
```

### 4️⃣ Password Hasheada con BCrypt
```csharp
// NUNCA se almacena password en texto claro
// BCrypt hash es imposible revertir

var hash = BCrypt.HashPassword(password, cost: 12);
await _userRepository.CreateAsync(new UserEntity {
    PasswordHash = hash  // ← SOLO el hash
});
```

### 5️⃣ Admin Verificado por JWT
```csharp
// El endpoint solo acepta requests con JWT válido de admin
var admin = await _secureTokenService.ValidateAdminToken(token);
if (admin == null || admin.Role != "admin")
    return Unauthorized();

// JAMÁS confiar en el rol del JWT sin verificar BD
```

### 6️⃣ Email Verificado por Invitación
```csharp
// El usuario NO puede cambiar su email
// El email viene desencriptado del token (que solo el admin creó)

var userEntity = new UserEntity
{
    Email = decrypted.email,  // ← Del token, no del usuario
    IsEmailVerified = true,    // ← No requiere confirmación
};
```

### 7️⃣ JWT Token con Expiración
```json
{
  "iat": 1712282400,        // Emitido a las...
  "exp": 1712368800,        // Expira en 24 horas
  "sub": "user-id",
  "role": "user"
}
```

---

## 📱 Flujo en el Frontend (React)

### RegisterPage.tsx (Componente)
```typescript
export function RegisterPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Obtener token de URL
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');
  const code = searchParams.get('code');

  if (!token) {
    return <div>❌ Enlace de invitación inválido</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar
    if (!name || !password || !confirm) {
      setError('Todos los campos son requeridos');
      return;
    }
    
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al registrarse');
      }

      const data = await response.json();

      // Guardar token
      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        email: data.email,
        displayName: name
      }));

      // Redirigir a matches
      navigate('/matches');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Completa tu Registro
      </Typography>
      
      <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
        Invitación #{code}
      </Typography>

      <form onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Nombre Completo"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          margin="normal"
        />

        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          margin="normal"
          helperText="Mín 8 caracteres"
        />

        <TextField
          label="Confirmar Contraseña"
          type="password"
          fullWidth
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={loading}
          margin="normal"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Crear Cuenta'}
        </Button>
      </form>
    </Box>
  );
}
```

---

## 🧪 Testing del Flujo Completo

### Paso 1: Admin Crea Invitación
```bash
curl -X POST http://localhost:7071/api/admin/invitations \
  -H "Authorization: Bearer <JWT_ADMIN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "notificationChannel": "email"
  }'
```

**Response:**
```json
{
  "link": "http://localhost:5173/register?token=U2FsdGVkX1...&code=234567",
  "expiresAt": "2026-04-05T14:30:00Z",
  "invitationCode": "234567"
}
```

### Paso 2: Usuario Abre el Link
```
http://localhost:5173/register?token=U2FsdGVkX1...&code=234567
```

Frontend debería mostrar formulario de registro.

### Paso 3: Usuario Se Registra
```bash
curl -X POST http://localhost:7071/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "U2FsdGVkX1...",
    "name": "Juan Prueba",
    "password": "Password@123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "userId": "user-xyz-789",
  "email": "test@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Paso 4: Verificar que el Token Anterior NO Funciona
```bash
# Intentar usar el mismo token otra vez
curl -X POST http://localhost:7071/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "U2FsdGVkX1...",
    "name": "Otro Usuario",
    "password": "Password@123456"
  }'

# Response:
# 400 Bad Request
# { "error": "Este enlace ya fue utilizado" }
```

### Paso 5: Verificar Usuario Puede Iniciar Sesión
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password@123456"
  }'

# Response:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { ... }
# }
```

---

## 🐛 Troubleshooting

### "Token inválido o expirado"

**Causas posibles:**
1. ❌ Link tiene más de 24 horas de antigüedad
2. ❌ Admin regeneró el token (link anterior no funciona)
3. ❌ URL está dañada o truncada

**Solución:**
- Admin debe crear nueva invitación con `POST /admin/invitations`
- O re-enviar con `POST /admin/invitations/{id}/resend`

---

### "Este enlace ya fue utilizado"

**Causa:**
El usuario ya se registró con este token.

**Solución:**
- Admin puede usar `POST /admin/invitations/{id}/resend` para generar nuevo link
- O eliminar el usuario y crear nueva invitación

---

### "El usuario ya existe"

**Causa:**
Al crear invitación, el admin ingresó un email que ya tiene usuario registrado.

**Solución:**
- Usar diferente email
- O usar `POST /admin/users/{userId}/update` para cambiar datos del usuario existente

---

### "La contraseña debe tener mínimo 8 caracteres"

**Solución:**
Usuario debe ingresar contraseña de mínimo 8 caracteres en el formulario.

---

### "Las contraseñas no coinciden"

**Solución:**
Frontend: Validar que "Contraseña" == "Confirmar Contraseña"

---

### Frontend: "CORS Error"

**Causa:**
API_URL está mal configurada en `.env`

**Solución:**
```env
# En app/.env
VITE_API_URL=http://localhost:7071/api
```

---

## 📋 Resumen de Cambios de Estado

### InvitationEntity
```
Creada por admin (status="pending")
        ↓
Usuario hace click en link (status="pending")
        ↓
Usuario se registra correctamente (status="used")
        ↓
Ya no se puede usar
```

### UserEntity
```
No existe
        ↓
Admin crea invitación
        ↓
Usuario se registra (Status="active")
        ↓
Usuario puede:
  - Iniciar sesión
  - Hacer predicciones
  - Participar en rifas
```

---

## 🎯 Comparación: Métodos de Registro

| Aspecto | Invitación Admin | Registro Libre | GitHub OAuth |
|---------|-----------------|-----------------|--------------|
| **Quién controla** | Admin | Usuario | GitHub |
| **Verificación** | Link con token | Email | GitHub |
| **Tiempo de creación** | 24 horas | Inmediato | Inmediato |
| **Reutilizable** | No (1 vez) | Sí (múltiples veces) | Sí (múltiples veces) |
| **Control de acceso** | Alto (admin elige) | Bajo (cualquiera) | Medio (requiere GitHub) |
| **Encriptación** | AES-256 | - | HTTPS + OAuth |
| **Implementación** | Custom | Custom | Azure maneja |

**Francachela usa:** Invitación Admin (más control) + GitHub OAuth (opción alternativa)

---

## 🔒 Checklist de Seguridad

- [x] Token encriptado con AES-256
- [x] Token expira en 24 horas
- [x] Token se usa una sola vez
- [x] Password hasheado con BCrypt (cost=12)
- [x] Admin validado por JWT con verificación en BD
- [x] Email no puede ser modificado por usuario
- [x] Role no puede ser modificado por usuario (verificado en BD)
- [x] JWT con expiración de 24 horas
- [x] Logging de todas las acciones admin
- [x] Validación de entrada en todos los campos

---

## 📚 Archivos Relacionados

- [FUNCTIONS_IMPLEMENTADAS.md](./FUNCTIONS_IMPLEMENTADAS.md) - Documentación de endpoints
- [LOGIN_USUARIO_PASSWORD.md](./LOGIN_USUARIO_PASSWORD.md) - Login con JWT
- [GITHUB_OAUTH_EXPLICADO.md](./GITHUB_OAUTH_EXPLICADO.md) - Explicación OAuth
- `api/Functions/AdminInvitationsFunction.cs` - Crear y re-enviar invitaciones
- `api/Functions/RegisterUserFunction.cs` - Registrar usuario
- `api/Services/SecureTokenService.cs` - Validación de tokens

---

## 👨‍💻 API Endpoints Involucrados

### Admin
- `POST /api/admin/invitations` - Crear invitación
- `POST /api/admin/invitations/{id}/resend` - Re-enviar invitación
- `GET /api/admin/invitations` - Listar invitaciones

### Usuario
- `POST /api/auth/register` - Registrarse con token
- `POST /api/auth/login` - Iniciar sesión

---

**Documento generado:** 2026-04-04  
**Última actualización:** Flujo completo de inscripción documentado ✅  
**Contribuidor:** Claude Code  
