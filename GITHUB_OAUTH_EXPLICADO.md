# 🐙 GitHub OAuth Explicado - Francachela

**Fecha:** 2026-04-04  
**Versión:** 1.0  
**Contexto:** Azure Static Web Apps + GitHub OAuth

---

## 📋 ¿Qué es GitHub OAuth?

**OAuth** (Open Authorization) es un protocolo de seguridad que permite que una aplicación acceda a información de otra aplicación **sin necesidad de que el usuario comparta sus credenciales directamente**.

En nuestro caso:
- **Aplicación:** Francachela (nuestra polla mundialista)
- **Proveedor:** GitHub
- **Lo que hace:** Permite que los usuarios se logueen en Francachela usando su cuenta de GitHub

---

## 🔄 Flujo Completo de GitHub OAuth

### Paso 1: Usuario hace clic en "Continuar con GitHub"

```
Frontend (Francachela) → Click en botón "Continuar con GitHub"
                    ↓
        Navigate a: /.auth/login/github
```

### Paso 2: Azure redirige a GitHub

```
Azure Static Web Apps intercepta /.auth/login/github
                    ↓
Redirige a: https://github.com/login/oauth/authorize
                    ↓
Con parámetros:
  - client_id: ID de la aplicación Francachela en GitHub
  - redirect_uri: https://francachela-swa.azurestaticapps.net/.auth/login/github/callback
  - scope: user:email (solo pide email)
```

### Paso 3: GitHub pide autorización

```
Usuario ve pantalla en GitHub:
┌─────────────────────────────────────┐
│  Francachela quiere acceder a:      │
│  - Tu email                         │
│                                     │
│  [Autorizar]  [Cancelar]            │
└─────────────────────────────────────┘
```

### Paso 4: GitHub genera código de autorización

```
Si usuario hace clic "Autorizar":
                    ↓
GitHub genera un código temporal único
                    ↓
Redirige a: /.auth/login/github/callback?code=abc123xyz
```

### Paso 5: Azure intercambia código por token

```
Azure Backend (privado, no se ve en navegador)
            ↓
POST https://github.com/login/oauth/access_token
            ↓
Headers:
  - client_id: ID de Francachela
  - client_secret: Contraseña de Francachela (secreta)
  - code: abc123xyz (del paso anterior)
            ↓
GitHub retorna:
  - access_token: "gho_16C7e42F292c6912E7710c838347Ae178B4a"
```

> ⚠️ **IMPORTANTE:** El `client_secret` NUNCA se envía desde el frontend. Solo el backend (Azure) lo tiene.

### Paso 6: Azure obtiene datos del usuario

```
Azure Backend
            ↓
GET https://api.github.com/user
Headers:
  - Authorization: Bearer gho_16C7e42F292c6912E7710c838347Ae178B4a
            ↓
GitHub retorna:
  {
    "id": 1296269,
    "login": "octocat",
    "email": "octocat@github.com",
    "name": "The Octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/1?v=4"
  }
```

### Paso 7: Azure crea sesión y redirige

```
Azure Static Web Apps
            ↓
Crea un "ClientPrincipal" con:
  - identityProvider: "github"
  - userId: "1296269"
  - userDetails: "octocat"
  - userRoles: ["user"]
            ↓
Guarda datos en cookie segura (HttpOnly)
            ↓
Redirige a: / (página de inicio)
```

### Paso 8: Frontend se da cuenta que hay usuario

```
useAuthUser() hook:
            ↓
Llama a getAuthMe()
            ↓
Endpoint /.auth/me retorna ClientPrincipal
            ↓
setState({ user: ClientPrincipal })
            ↓
Navbar muestra avatar del usuario
```

### Diagrama Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO EN NAVEGADOR                     │
└─────────────────────────────────────────────────────────────┘
  1. Click "Continuar con GitHub"
     │
     ├─────────────────┬──────────────────────────────────────┐
     │                 │                                      │
     ▼                 │                                      │
Navegador        ┌─────────────────────────────────────────┐ │
redirige a       │     AZURE STATIC WEB APPS BACKEND       │ │
/.auth/login/    │                                         │ │
github           │ /.auth/login/github handler:            │ │
     │           │  - Verifica request                     │ │
     │           │  - Redirige a GitHub                    │ │
     ▼           └─────────────────────────────────────────┘ │
     │                          │                             │
     │                          ▼                             │
     │           ┌──────────────────────────────────────────┐ │
     │           │      GITHUB OAUTH SERVER                │ │
     │           │                                          │ │
     │           │ 1. Pide autorización al usuario         │ │
     │           │ 2. Usuario autoriza                     │ │
     │           │ 3. Genera código temporal               │ │
     │           │ 4. Redirige con código                  │ │
     │           └──────────────────────────────────────────┘ │
     │                          │                             │
     │                          ▼                             │
     │           ┌──────────────────────────────────────────┐ │
     │           │  AZURE BACKEND (privado)                │ │
     │           │                                          │ │
     │           │ POST /oauth/access_token con:           │ │
     │           │ - client_id                             │ │
     │           │ - client_secret (secreto)               │ │
     │           │ - code                                  │ │
     │           │                                          │ │
     │           │ Respuesta:                              │ │
     │           │ - access_token                          │ │
     │           │                                          │ │
     │           │ GET /api.github.com/user con token      │ │
     │           │                                          │ │
     │           │ Respuesta:                              │ │
     │           │ - id, login, email, name                │ │
     │           │                                          │ │
     │           │ Crea sesión en cookie                   │ │
     │           └──────────────────────────────────────────┘ │
     │                          │                             │
     └──────────────────────────┘                             │
              Redirige a /
              Con cookie de sesión
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              USUARIO EN FRANCACHELA LOGUEADO                │
│                                                              │
│  ✅ useAuthUser() detecta sesión                           │
│  ✅ Navbar muestra avatar "octocat"                        │
│  ✅ Puede navegar a /matches, /ranking, etc.              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 ¿Por qué es seguro?

### 1. **Cliente Secret Privado**
```
❌ INSEGURO: client_secret en frontend → puede ser robado
✅ SEGURO: client_secret solo en Azure Backend → protegido
```

### 2. **Código Temporal**
```
- El "código" que GitHub envía es único y expira rápidamente
- Solo se puede usar UNA vez
- Solo Azure lo puede canjear (necesita client_secret)
```

### 3. **Access Token Limitado**
```
- El token de GitHub es muy limitado (scope: user:email)
- No puede hacer cambios en el repositorio del usuario
- Expira automáticamente
```

### 4. **Cookie HttpOnly**
```
- La sesión se guarda en una cookie HttpOnly
- No puede ser accedida desde JavaScript (protege contra XSS)
- Solo se envía al servidor (protege contra CSRF)
```

---

## 🛠️ ¿Dónde está configurado en nuestro proyecto?

### Backend (Azure Static Web Apps)

El OAuth está **completamente manejado por Azure**. No hay código nuestro.

```
/.auth/login/github      ← Azure lo maneja automáticamente
/.auth/login/github/callback ← Azure lo maneja automáticamente
/.auth/me                ← Azure lo maneja automáticamente
/.auth/logout            ← Azure lo maneja automáticamente
```

### Frontend (React)

```typescript
// services/auth.ts
export function getLoginUrl(provider: string = 'github'): string {
  return `/.auth/login/${provider}`;  // Redirige a Azure
}

export async function getAuthMe(): Promise<AuthMe> {
  const response = await fetch('/.auth/me');  // Pregunta a Azure
  return response.json();
}

// pages/LoginPage.tsx
<Button href={getLoginUrl('github')}>
  Continuar con GitHub
</Button>

// hooks/useAuthUser.ts
const authMe = await getAuthMe();  // Obtiene sesión de Azure
setUser(authMe.clientPrincipal);   // Muestra usuario
```

---

## 📱 Datos Guardados en la Sesión

Cuando un usuario se loguea con GitHub, Azure crea un `ClientPrincipal`:

```typescript
{
  identityProvider: "github",
  userId: "1296269",              // ID único de GitHub
  userDetails: "octocat",          // Username de GitHub
  userRoles: ["user"],             // Rol en Francachela
}
```

Este objeto está **disponible en todos los endpoints**:

```javascript
// En el Navbar:
user.userDetails  // "octocat"
user.userId       // "1296269"

// En cualquier página:
const { user } = useAuthUser();
console.log(user.userDetails);
```

---

## 🔄 Logout con GitHub

```javascript
// services/auth.ts
export function getLogoutUrl(): string {
  return '/.auth/logout';  // Azure elimina la sesión
}

// Navbar
<Button onClick={() => {
  window.location.href = getLogoutUrl();
}}>
  Cerrar sesión
</Button>
```

Flujo:
```
Click "Cerrar sesión"
        ↓
GET /.auth/logout
        ↓
Azure elimina cookie
        ↓
Redirige a /
        ↓
Usuario vuelve a login page
```

---

## ⚙️ Configuración en Azure

### Paso 1: Registrar aplicación en GitHub

1. Ve a `github.com/settings/developers` → **"OAuth Applications"**
2. Clic en **"New OAuth App"**
3. Completa:

| Campo | Valor |
|-------|-------|
| Application name | `Francachela Mundial 2026` |
| Homepage URL | `https://francachela-swa.azurestaticapps.net` |
| Application description | `Polla mundialista con predicciones en tiempo real` |
| Authorization callback URL | `https://francachela-swa.azurestaticapps.net/.auth/login/github/callback` |

4. GitHub genera:
   - **Client ID** (público)
   - **Client Secret** (secreto, NUNCA compartir)

### Paso 2: Configurar en Azure Static Web Apps

1. Ve a **Azure Portal** → **Static Web Apps** → `francachela-swa`
2. Menú izquierdo: **"Administración de acceso"** → **"Agregar proveedor"**
3. Selecciona: **GitHub**
4. Completa:
   - Client ID: (del paso anterior)
   - Client Secret: (del paso anterior)
5. Clic en **"Agregar"**

**¡Listo!** Azure ahora maneja automáticamente el OAuth con GitHub.

---

## 📊 Comparación: GitHub vs Email/Contraseña

| Aspecto | GitHub OAuth | Email/Password |
|--------|-------------|-----------------|
| **Dónde se guarda contraseña** | GitHub | Nuestra BD (BCrypt) |
| **¿Riesgos si se hackea?** | Bajo (GitHub es muy seguro) | Alto si BD se hackea |
| **¿Usuario ve contraseña?** | No necesita contraseña | Sí, debe crear una |
| **¿Qué datos obtenemos?** | Email, username, avatar | Solo email |
| **Implementación** | Azure maneja todo | Nosotros hacemos todo |
| **Experiencia usuario** | 1 click | Llena formulario |
| **2FA disponible?** | Usa 2FA de GitHub | Nosotros la implementamos |
| **Riesgo phishing** | Muy bajo (GitHub es oficial) | Alto (phishing de la app) |

---

## 🚀 Flujo Actual en Francachela

```javascript
// Usuario abre la app
┌─ LoginPage
│  └─ Dos opciones:
│     ├─ [📧 Email] → Form email/password
│     │    └─ POST /api/auth/login (nuestro backend)
│     │       └─ Guarda JWT en localStorage
│     │
│     └─ [🐙 GitHub] → getLoginUrl('github')
│          └─ GET /.auth/login/github (Azure)
│             └─ Redirige a GitHub
│                └─ Usuario autoriza
│                   └─ Azure guarda sesión en cookie
│
└─ useAuthUser()
   └─ Chequea: JWT en localStorage? → Sí → Usa ese
   └─ Chequea: Cookie de Azure? → Sí → Usa ese
   └─ Chequea: Mock en dev? → Sí → Usa ese
```

---

## 🐛 Troubleshooting GitHub OAuth

### "No aparece el botón GitHub"

```
❌ Problema: ¿Está configurado OAuth en Azure?
✅ Solución: Ve a Static Web Apps → Administración de acceso → 
            Verifica que GitHub esté habilitado
```

### "Click GitHub → se queda en blanco"

```
❌ Problema: Authorization callback URL incorrecta
✅ Solución: En GitHub settings, verifica que sea:
            https://francachela-swa.azurestaticapps.net/.auth/login/github/callback
```

### "Error 'Client secret is invalid'"

```
❌ Problema: Client Secret expiró o es incorrecto
✅ Solución: Ve a GitHub → Settings → OAuth Apps → 
            Regenera Client Secret → Actualiza en Azure
```

### "Usuario logueado pero sin datos"

```
❌ Problema: Scope insuficiente en GitHub
✅ Solución: Asegúrate que el OAuth request incluya:
            scope=user:email (mínimo)
```

---

## 🔑 Seguridad: Mejores Prácticas

### ✅ Hacemos bien:

- [x] Client Secret nunca en frontend
- [x] Código temporal expira rápidamente
- [x] Sesión en cookie HttpOnly
- [x] Azure maneja todo (no nuestro código)

### ⚠️ Podría mejorar:

- [ ] PKCE (Proof Key for Code Exchange) para apps móviles
- [ ] Session refresh automático
- [ ] Detección de tokens robados
- [ ] Rate limiting en endpoint /.auth/login

---

## 📚 Documentación Oficial

- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps)
- [Azure Static Web Apps Authentication](https://learn.microsoft.com/en-us/azure/static-web-apps/authentication-authorization)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)

---

## 🎯 Resumen

```
GitHub OAuth = Login seguro usando GitHub como proveedor

1. Usuario: "Click en GitHub"
2. Azure: "Redirige a GitHub"
3. GitHub: "¿Autorizas a Francachela?"
4. Usuario: "Sí, autorizo"
5. GitHub: "Aquí está el código de autorización"
6. Azure: "Canjeé el código por access token"
7. GitHub: "Aquí están los datos del usuario"
8. Azure: "Crea sesión, guarda en cookie"
9. Navegador: "Redirige a Francachela"
10. Frontend: "¡Usuario logueado!"
```

✅ **Seguro, simple, y sin que el usuario comparta su contraseña de GitHub**

---

**Documento generado:** 2026-04-04  
**Última actualización:** Explicación completa de GitHub OAuth ✅
