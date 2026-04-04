# JWT Security Implementation

## Problema: Privilege Escalation via JWT Tampering

**Attack Scenario:**
```javascript
// Attacker modifies JWT payload in browser console
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const decoded = jwt_decode(token);
decoded.role = "admin";  // ← Intenta cambiar a admin
// Re-encode y envía al servidor...
```

## Solución Implementada ✅

### 1. JWT Firma (HMAC-SHA256)
```csharp
// El servidor FIRMA el JWT con una clave secreta
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("super-secret-key"));
var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
```

**¿Por qué protege?**
- El atacante NO conoce la clave secreta del servidor
- Cualquier modificación del payload invalida la firma
- El servidor rechaza automáticamente tokens con firma inválida

### 2. JWT Validation Signature Check
```csharp
handler.ValidateToken(token, new TokenValidationParameters
{
    ValidateIssuerSigningKey = true,  // ← Verifica que la firma sea válida
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
});
```

**Si el atacante modifica el rol:**
```
JWT original: { "role": "user", "signature": "abc123..." }
                                            ↓
                        Atacante modifica role a "admin"
                                            ↓
JWT modificado: { "role": "admin", "signature": "abc123..." }
                                            ↓
                    Firma ya no coincide (invalid signature)
                                            ↓
                    Servidor RECHAZA el token
```

### 3. Role Verification Against Database (EXTRA LAYER)
```csharp
// SecureTokenService.cs
var userFromDb = await GetUserFromDatabase(userId);

// CRITICAL: Cross-check JWT role with database role
if (userFromDb.Role != roleInToken)
{
    _logger.LogError("SECURITY ALERT: Role mismatch - possible tampering");
    return null;  // ← Rechaza el token
}
```

**¿Por qué esta capa adicional?**
- Protege contra compromisos de la clave secreta
- Si la clave se filtra y un atacante genera JWTs válidos, esta capa detecta inconsistencias
- Valida que el usuario aún tenga el rol (no fue revocado)
- Detecta usuarios inactivos

## Flujo de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente envía: GET /api/auth/profile                         │
│ Header: Authorization: Bearer eyJhbGc...                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ SecureTokenService.ValidateTokenAndVerifyRole()              │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   ┌────────┐  ┌──────────┐  ┌──────────────┐
   │ Check  │  │ Extract  │  │ Query        │
   │ Sig    │  │ Claims   │  │ Database     │
   │        │  │          │  │              │
   │ Valid? │  │ userId   │  │ Get actual   │
   │        │  │ email    │  │ role         │
   │        │  │ role     │  │              │
   └────┬───┘  └─────┬────┘  └──────┬───────┘
        │            │              │
        ▼            ▼              ▼
   [PASA]       [PASA]       ┌──────────────────┐
                             │ JWT role ==      │
                             │ DB role?         │
                             │                  │
                             │ User status ==   │
                             │ "active"?        │
                             └────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
              ✅ [PASA]                   ❌ [RECHAZA]
                    │                           │
                    ▼                           ▼
           Return UserContext          Log SECURITY ALERT
                    │                    Return null
                    │
                    ▼
         ┌──────────────────────┐
         │ Procesar request     │
         │ con seguridad total  │
         └──────────────────────┘
```

## Cómo Usar en Endpoints

### Para endpoints públicos (sin autenticación)
```csharp
// No requieren validación
[Function("Login")]
public async Task<HttpResponseData> Run(HttpRequestData req)
{
    // Validar credentials contra DB
    // Generar JWT
    // Retornar JWT token
}
```

### Para endpoints protegidos (user autenticado)
```csharp
[Function("GetProfile")]
public async Task<HttpResponseData> Run(HttpRequestData req)
{
    var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
    var token = SecureTokenService.ExtractBearerToken(authHeader);

    var userContext = await _secureTokenService.ValidateTokenAndVerifyRole(token);
    if (userContext == null)
        return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

    // Ahora userContext.UserId y userContext.Role son seguros
    // El role fue verificado contra la base de datos
    return OkResponse(userContext);
}
```

### Para endpoints solo-admin
```csharp
[Function("CreateInvitation")]
public async Task<HttpResponseData> Run(HttpRequestData req)
{
    var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
    var token = SecureTokenService.ExtractBearerToken(authHeader);

    // Validar que es admin
    var adminContext = await _secureTokenService.ValidateAdminToken(token);
    if (adminContext == null)
        return ErrorResponse(req, "Forbidden - Admin only", HttpStatusCode.Forbidden);

    // Proceder con operación admin
}
```

## Registro de Seguridad

Todos los eventos de seguridad se registran:

```csharp
_logger.LogWarning("JWT token validation failed - invalid signature or expired");
_logger.LogWarning("User not found in database");
_logger.LogError("SECURITY ALERT: Role mismatch detected - Possible token tampering");
_logger.LogWarning("SECURITY ALERT: Non-admin user attempted admin-only action");
```

**Revisar logs regularly en ApplicationInsights para:**
- Intentos fallidos de validación
- Cambios de rol entre JWT y DB
- Usuarios inactivos intentando acceso
- Usuarios no-admin intentando acciones admin

## Variables de Entorno

```json
{
  "Jwt:SecretKey": "CHANGE THIS TO 32+ RANDOM CHARACTERS IN PRODUCTION",
  "Jwt:Issuer": "worldcup2026-api",
  "Jwt:Audience": "worldcup2026-app",
  "Jwt:ExpirationMinutes": "60"
}
```

**CRÍTICO:** La `Jwt:SecretKey` debe ser:
- Mínimo 32 caracteres
- Completamente aleatoria
- Única para cada ambiente
- Guardada en Azure Key Vault en producción
- NUNCA commiteada en git

## Testing de Seguridad

### 1. Test: Token con firma válida pero rol modificado
```bash
# Obtener token válido
TOKEN=$(curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}' | jq -r .token)

# Decodificar y modificar rol (en JavaScript)
const decoded = jwt_decode(TOKEN);
decoded.role = "admin";  # ← Cambiar a admin
const modified = jwt_encode(decoded, "wrong-key");

# Enviar token modificado
curl http://localhost:7071/api/auth/profile \
  -H "Authorization: Bearer $modified"

# Expected: 401 Unauthorized (firma inválida)
```

### 2. Test: Token válido pero usuario rol fue revocado en DB
```bash
# Obtener token de usuario con role "admin"
# Luego cambiar role en DB a "user"
# Enviar el token válido pero con role "admin"

# Expected: 401 Unauthorized (role mismatch)
```

### 3. Test: Usuario inactivo intenta usar token válido
```bash
# Obtener token válido
# Cambiar usuario status a "inactive" en DB
# Usar el token

# Expected: 401 Unauthorized (user not active)
```

## Referencias

- [JWT.io](https://jwt.io) - JWT debugger y documentación
- [Microsoft JWT Documentation](https://learn.microsoft.com/en-us/dotnet/api/system.identitymodel.tokens.jwt)
- [OWASP - JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [NIST - Role-Based Access Control](https://csrc.nist.gov/publications/detail/sp/800-162/final)

## Summary

✅ **JWT está FIRMADO** con clave secreta del servidor - imposible modificar sin la clave
✅ **Firma se valida** en cada request - tokens modificados se rechazan
✅ **Rol se verifica contra BD** - protege contra compromisos de clave
✅ **Usuario status se valida** - imposible usar token de usuario revocado/inactivo
✅ **Todo se registra** - detecta intentos de ataque

**Conclusión: NO ES POSIBLE** que un usuario inyecte o modifique su rol desde el frontend.
