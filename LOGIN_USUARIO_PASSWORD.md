# 🔐 Guía de Login con Usuario/Contraseña

**Fecha:** 2026-04-04  
**Versión:** 1.0  
**Estado:** ✅ Implementado

---

## 📋 Descripción

Se ha implementado la funcionalidad de **login con usuario/contraseña** en el frontend de Francachela, como alternativa al login con GitHub.

Ahora los usuarios pueden iniciar sesión de dos formas:
- 📧 **Email/Contraseña** - Directo
- 🐙 **GitHub OAuth** - Mediante OAuth

---

## 🎯 Cambios Realizados

### 1. Servicio de Autenticación (`app/src/services/auth.ts`)

#### Nuevas Funciones:

**`loginWithCredentials(email, password)`**
- Envía credenciales al endpoint `POST /api/auth/login`
- Guarda JWT token en `localStorage`
- Retorna datos de usuario y token

```typescript
const response = await loginWithCredentials('user@example.com', 'password123');
if (response.success) {
  // Token guardado automáticamente
  console.log(response.user);
}
```

**`getUserProfile(token)`**
- Obtiene perfil completo del usuario con token JWT
- Requiere header: `Authorization: Bearer {token}`

**`getStoredToken()`**
- Obtiene JWT token del localStorage
- Retorna `null` si no existe

**`getStoredUser()`**
- Obtiene datos del usuario desde localStorage
- Retorna objeto UserProfile o null

**`logout()`**
- Limpia tokens y datos del usuario
- Remueve: `jwtToken`, `userId`, `user` del localStorage

### 2. Página de Login (`app/src/pages/LoginPage.tsx`)

#### Nuevas características:

✅ **Selector de método de login**
- Botones para cambiar entre Email y GitHub
- Interfaz limpia y amigable

✅ **Formulario de login con credenciales**
- Campo Email (tipo email)
- Campo Contraseña (tipo password)
- Validación en tiempo real
- Indicador de carga mientras se procesa

✅ **Manejo de errores**
- Mensajes de error claros
- Alert rojo con descripción del problema

✅ **Integración con backend**
- POST a `http://localhost:7071/api/auth/login`
- En producción: variable de entorno `VITE_API_URL`

### 3. Hook de Autenticación (`app/src/hooks/useAuthUser.ts`)

#### Actualizaciones:

✅ **Soporte dual de autenticación**
- Verifica JWT en localStorage primero
- Si no hay JWT, intenta Azure Static Web Apps
- Fallback a mock user en desarrollo

```typescript
const { user, loading, error } = useAuthUser();

// user puede ser:
// - UserProfile (JWT login)
// - ClientPrincipal (GitHub login)
// - null (no autenticado)
```

### 4. Navbar (`app/src/components/Layout/Navbar.tsx`)

#### Mejoras:

✅ **Logout mejorado**
- Detecta si es JWT o GitHub login
- JWT: Borra localStorage y redirige a /
- GitHub: Usa Azure logout URL

✅ **Mostrar nombre de usuario**
- JWT users: muestra `displayName`
- GitHub users: muestra `userDetails`
- Avatar con inicial del nombre

---

## 🚀 Flujo de Login con Credenciales

```
┌─────────────────────┐
│  1. Usuario abre app │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│  2. LoginPage cargada    │
│  - Selector Email/GitHub │
│  - Email seleccionado    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────┐
│  3. Usuario ingresa datos    │
│  - email@example.com         │
│  - password123               │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  4. Click "Iniciar Sesión"   │
│  - Validación frontend       │
│  - Loading spinner mostrado  │
└──────────┬───────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│  5. POST /api/auth/login           │
│     {email, password}              │
│     ↓                              │
│     Backend: BCrypt verify         │
│     ↓                              │
│     Respuesta:                     │
│     {token, user, success}         │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  6. Token guardado           │
│  - localStorage.jwtToken     │
│  - localStorage.user         │
│  - localStorage.userId       │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  7. Redirect a /matches      │
│  - useAuthUser() lo detecta  │
│  - Navbar muestra el usuario │
└──────────────────────────────┘
```

---

## 📱 Interfaz de Usuario

### Pantalla de Login (Modo Email)

```
┌──────────────────────────────┐
│                              │
│    🎨 FRANCACHELA LOGO       │
│                              │
│    Polla Mundialista         │
│    Francachela MX            │
│                              │
│    [Iniciar Sesión] [Registr]│
│                              │
│    [📧 Email] [🐙 GitHub]    │
│                              │
│    Email                     │
│    ┌──────────────────────┐  │
│    │ user@example.com    │  │
│    └──────────────────────┘  │
│                              │
│    Contraseña                │
│    ┌──────────────────────┐  │
│    │ ••••••••••••••••    │  │
│    └──────────────────────┘  │
│                              │
│    [⏳ Iniciar Sesión]        │
│                              │
│    🌎 Solo participantes...  │
│                              │
└──────────────────────────────┘
```

### Con Error

```
┌──────────────────────────────┐
│                              │
│  ⚠️ Email o contraseña       │
│     inválidos                │
│                              │
│    Email                     │
│    ┌──────────────────────┐  │
│    │ user@example.com    │  │
│    └──────────────────────┘  │
│                              │
│    Contraseña                │
│    ┌──────────────────────┐  │
│    │ ••••••••••••••••    │  │
│    └──────────────────────┘  │
│                              │
│    [Iniciar Sesión]          │
│                              │
└──────────────────────────────┘
```

---

## 🔧 Configuración

### Variables de Entorno

En `app/.env` o durante el build:

```env
# URL del API backend
VITE_API_URL=http://localhost:7071/api

# En producción:
VITE_API_URL=https://api.francachela.com/api
```

### Local Development

```bash
cd app
npm install
npm run dev

# Backend debe estar corriendo en http://localhost:7071
```

---

## 🧪 Testing

### Usuarios de Prueba

```json
{
  "email": "demo@example.com",
  "password": "Demo@123456"
}
```

> Para crear usuarios de prueba, usar el endpoint admin:
> `POST /api/admin/invitations` (requiere JWT admin)

### Pasos de Testing

1. **Abrir login page**
   ```
   http://localhost:5173/
   ```

2. **Seleccionar "Email"**
   - Click en botón [📧 Email]

3. **Ingresar credenciales válidas**
   ```
   Email: user@example.com
   Password: password123
   ```

4. **Click "Iniciar Sesión"**
   - Debe mostrar spinner de carga
   - Si es exitoso → Redirige a /matches
   - Si es error → Muestra alerta roja

5. **Verificar login**
   - Navbar debe mostrar nombre del usuario
   - Avatar debe mostrar inicial
   - Click en avatar → "Cerrar sesión"

6. **Logout**
   - Click en avatar
   - Click en "Cerrar sesión"
   - Debe limpiar localStorage
   - Debe redirigir a login

---

## 🔒 Seguridad

### Protección Implementada

✅ **Frontend**
- Contraseña no se loguea
- Token se guarda en localStorage (no cookies por ahora)
- Validación de campos requeridos
- Manejo de errores sin revelar información

✅ **Backend**
- BCrypt hash con cost factor 12
- JWT validation con HMAC-SHA256
- Role verification contra DB (previene elevación de privilegios)
- Rate limiting en endpoints

✅ **Transmisión**
- HTTPS en producción (requerido para Azure)
- Headers CORS configurados
- Content-Type validation

### Mejoras Futuras

⚠️ **Considerar implementar:**
- HttpOnly cookies en lugar de localStorage
- Refresh tokens con corta expiración
- CSRF tokens
- 2FA (Two Factor Authentication)
- OAuth providers adicionales (Google, Microsoft)

---

## 📊 Flujo de Datos

### Request Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response Success

```json
{
  "success": true,
  "userId": "usr-abc123",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-abc123",
    "email": "user@example.com",
    "displayName": "Juan Pérez",
    "role": "user",
    "totalPoints": 150,
    "totalPredictions": 10,
    "correctPredictions": 7,
    "accuracyPercentage": 70.0,
    "leaderboardRank": 42
  }
}
```

### Response Error

```json
{
  "success": false,
  "message": "Email o contraseña inválidos"
}
```

---

## 📦 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `app/src/services/auth.ts` | +5 nuevas funciones, +4 interfaces |
| `app/src/pages/LoginPage.tsx` | +Selector Email/GitHub, +Formulario, +Manejo de errores |
| `app/src/hooks/useAuthUser.ts` | +Soporte JWT, +localStorage check |
| `app/src/components/Layout/Navbar.tsx` | +Logout dual, +User label dinámico |

---

## 🐛 Troubleshooting

### "Error al iniciar sesión"
- Verificar que el email existe en BD
- Verificar que la contraseña es correcta
- Verificar que el usuario está activo (status = "active")

### "Token inválido"
- Verificar que VITE_API_URL es correcto
- Verificar que el backend está corriendo
- Verificar que JWT_SECRET_KEY es igual en frontend + backend

### "No se guarda el login"
- Verificar que localStorage no está deshabilitado
- Verificar que no hay CORS errors en consola
- Verificar que el token se recibe en la respuesta

### Verificar en DevTools

```javascript
// Console tab
localStorage.getItem('jwtToken') // Debe retornar token
localStorage.getItem('user')     // Debe retornar JSON usuario
```

---

## 🔄 Migración desde GitHub-Only

Si antes solo usaba GitHub OAuth:

1. **Crear usuarios** con email/password
2. **Usuarios existentes** pueden seguir usando GitHub
3. **No hay conflicto** - ambos métodos funcionan en paralelo
4. **Las credenciales se pueden combinar** si el email es igual

---

## 📚 Documentación Relacionada

- [FUNCTIONS_IMPLEMENTADAS.md](./FUNCTIONS_IMPLEMENTADAS.md) - Endpoints API
- [DOCUMENTACION_PROYECTO.md](./DOCUMENTACION_PROYECTO.md) - Arquitectura general
- [MODULO_REGISTRO.md](./MODULO_REGISTRO.md) - Flujo de registro

---

## 👨‍💻 Desarrollo Futuro

### Próximas Mejoras

- [ ] Recuperar contraseña (reset password flow)
- [ ] Verificación de email
- [ ] Perfil de usuario (cambiar datos)
- [ ] Historial de login
- [ ] Biometría (TouchID, FaceID)
- [ ] SSO integración con empresa

---

**Documento generado:** 2026-04-04  
**Contribuidores:** Claude Code  
**Última actualización:** Login con email/password implementado ✅
