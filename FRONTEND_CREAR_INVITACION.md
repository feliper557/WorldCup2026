# 📖 Frontend - Crear Invitación (Admin)

## Tabla de Contenidos
1. [Requisitos](#requisitos)
2. [Datos a Enviar](#datos-a-enviar)
3. [Validaciones Frontend](#validaciones-frontend)
4. [Ejemplos de Código](#ejemplos-de-código)
5. [Manejo de Errores](#manejo-de-errores)
6. [Estados y Respuestas](#estados-y-respuestas)
7. [Buenas Prácticas](#buenas-prácticas)

---

## Requisitos

### 1. El usuario debe estar autenticado como ADMIN
```typescript
// Verificar que el usuario tiene rol "admin"
const user = JSON.parse(localStorage.getItem('user'));
if (user?.role !== 'admin') {
  // No mostrar esta funcionalidad
  return null;
}
```

### 2. Tener el JWT Token guardado
```typescript
const token = localStorage.getItem('token'); // JWT del admin
if (!token) {
  // Redirigir a login
  navigate('/login');
}
```

### 3. Variables de entorno configuradas
```env
REACT_APP_API_URL=http://localhost:7071
```

---

## Datos a Enviar

### Estructura del Request

```
POST /api/admin/invitations
```

### Headers Requeridos

```javascript
{
  "Authorization": "Bearer <jwt-token-del-admin>",
  "Content-Type": "application/json"
}
```

### Body del Request

**Opción 1: Invitación por Email (Recomendado)**
```json
{
  "email": "usuario@ejemplo.com",
  "notificationChannel": "email"
}
```

**Opción 2: Invitación por WhatsApp**
```json
{
  "email": "usuario@ejemplo.com",
  "notificationChannel": "whatsapp",
  "phoneNumber": "+573001234567"
}
```

**Opción 3: Mínimo (Solo Email obligatorio)**
```json
{
  "email": "usuario@ejemplo.com"
}
```

### Campos Explicados

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `email` | string | ✅ | Email del usuario a invitar | `usuario@ejemplo.com` |
| `notificationChannel` | string | ❌ | Cómo notificar (default: "email") | `"email"` o `"whatsapp"` |
| `phoneNumber` | string | ❌ | Teléfono (solo si WhatsApp) | `"+573001234567"` |

---

## Validaciones Frontend

### ⚠️ Validaciones OBLIGATORIAS

#### 1. Validar Email
```typescript
function isValidEmail(email: string): boolean {
  // Expresión regular para email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Ejemplo:
isValidEmail("usuario@ejemplo.com");        // ✅ true
isValidEmail("usuario_valido@empresa.co");  // ✅ true
isValidEmail("usuario@");                   // ❌ false
isValidEmail("usuario");                    // ❌ false
isValidEmail("");                           // ❌ false
```

#### 2. Email no debe estar vacío
```typescript
if (!email || email.trim() === "") {
  setError("El email es requerido");
  return;
}
```

#### 3. Email no debe tener espacios
```typescript
if (email !== email.trim()) {
  setError("El email no puede tener espacios");
  return;
}
```

#### 4. Email debe estar en minúsculas
```typescript
const normalizedEmail = email.toLowerCase();
```

### ⚠️ Validaciones CONDICIONALES

#### 5. Si selecciona WhatsApp, validar teléfono
```typescript
if (notificationChannel === "whatsapp") {
  if (!phoneNumber || phoneNumber.trim() === "") {
    setError("El teléfono es requerido para WhatsApp");
    return;
  }
  
  // Validar formato: +<código país><número>
  if (!isValidPhoneNumber(phoneNumber)) {
    setError("Formato de teléfono inválido. Use: +573001234567");
    return;
  }
}

function isValidPhoneNumber(phone: string): boolean {
  // Validar que empiece con + y tenga 7-15 dígitos
  const phoneRegex = /^\+\d{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
```

#### 6. Validar que el usuario no sea admin (opcional)
```typescript
// Si tienes un servicio de consulta de usuarios
// Puedes verificar que el email no pertenezca a un admin
async function isUserAlreadyAdmin(email: string): Promise<boolean> {
  // Llamar a un endpoint que verifique esto
  // return await adminService.isEmailAdmin(email);
}
```

### 🔒 Validaciones de SEGURIDAD

#### 7. Validar longitud máxima del email
```typescript
if (email.length > 254) {
  setError("El email es demasiado largo");
  return;
}
```

#### 8. Sanitizar entrada (prevenir XSS)
```typescript
function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>\"']/g, ""); // Remover caracteres especiales
}
```

#### 9. Validar que el token JWT sea válido antes de enviar
```typescript
function isTokenValid(token: string): boolean {
  try {
    // Decodificar token (sin validar firma en cliente)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const decoded = JSON.parse(atob(parts[1]));
    
    // Verificar que no está expirado
    if (decoded.exp * 1000 < Date.now()) return false;
    
    // Verificar que tiene role "admin"
    if (decoded.role !== "admin") return false;
    
    return true;
  } catch {
    return false;
  }
}
```

---

## Ejemplos de Código

### Componente React Completo

```typescript
import React, { useState } from 'react';

interface CreateInvitationFormProps {
  onSuccess?: (invitationLink: string) => void;
  onError?: (error: string) => void;
}

export const CreateInvitationForm: React.FC<CreateInvitationFormProps> = ({
  onSuccess,
  onError
}) => {
  const [email, setEmail] = useState('');
  const [notificationChannel, setNotificationChannel] = useState('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  // Validar email
  const isValidEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Validar teléfono
  const isValidPhoneNumber = (value: string): boolean => {
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(value.replace(/\s/g, ''));
  };

  // Sanitizar email
  const sanitizeEmail = (value: string): string => {
    return value
      .trim()
      .toLowerCase()
      .replace(/[<>\"']/g, '');
  };

  // Validar formulario
  const validateForm = (): boolean => {
    // Limpiar errores previos
    setError('');

    // 1. Email requerido
    if (!email || email.trim() === '') {
      setError('El email es requerido');
      return false;
    }

    // 2. Email válido
    if (!isValidEmail(email)) {
      setError('Email inválido. Por favor, ingrese un email válido');
      return false;
    }

    // 3. Email no debe exceder 254 caracteres
    if (email.length > 254) {
      setError('El email es demasiado largo');
      return false;
    }

    // 4. Si es WhatsApp, validar teléfono
    if (notificationChannel === 'whatsapp') {
      if (!phoneNumber || phoneNumber.trim() === '') {
        setError('El teléfono es requerido para enviar por WhatsApp');
        return false;
      }

      if (!isValidPhoneNumber(phoneNumber)) {
        setError('Formato de teléfono inválido. Use: +573001234567');
        return false;
      }
    }

    return true;
  };

  // Enviar invitación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Obtener token del almacenamiento
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No autorizado. Por favor, inicie sesión nuevamente');
        return;
      }

      // Preparar datos
      const sanitizedEmail = sanitizeEmail(email);
      const requestBody: any = {
        email: sanitizedEmail,
        notificationChannel
      };

      // Agregar teléfono si es WhatsApp
      if (notificationChannel === 'whatsapp') {
        requestBody.phoneNumber = phoneNumber;
      }

      // Realizar request
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/admin/invitations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      // Manejo de respuesta
      const data = await response.json();

      if (!response.ok) {
        // Error del servidor
        setError(data.error || 'Error al crear la invitación');
        onError?.(data.error || 'Error al crear la invitación');
        return;
      }

      // Éxito
      setSuccess(true);
      setInvitationLink(data.link);
      setInvitationCode(data.invitationCode);
      setEmail('');
      setPhoneNumber('');
      setNotificationChannel('email');

      onSuccess?.(data.link);

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const errorMessage = 
        err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invitation-form-container">
      <h2>Crear Invitación</h2>

      {/* Mostrar errores */}
      {error && (
        <div className="alert alert-danger">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Mostrar éxito */}
      {success && (
        <div className="alert alert-success">
          <strong>✅ Éxito:</strong> Invitación creada correctamente
          <div style={{ marginTop: '10px' }}>
            <p><strong>Código:</strong> {invitationCode}</p>
            <p><strong>Enlace:</strong></p>
            <input 
              type="text" 
              value={invitationLink} 
              readOnly 
              className="form-control"
              style={{ marginBottom: '10px' }}
            />
            <button 
              className="btn btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(invitationLink);
                alert('Enlace copiado al portapapeles');
              }}
            >
              Copiar Enlace
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email del Usuario *</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="usuario@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <small className="form-text text-muted">
            Correo del usuario que será invitado
          </small>
        </div>

        {/* Canal de notificación */}
        <div className="form-group">
          <label htmlFor="channel">Canal de Notificación</label>
          <select
            id="channel"
            className="form-control"
            value={notificationChannel}
            onChange={(e) => setNotificationChannel(e.target.value)}
            disabled={loading}
          >
            <option value="email">📧 Email</option>
            <option value="whatsapp">💬 WhatsApp</option>
          </select>
          <small className="form-text text-muted">
            Cómo se notificará al usuario
          </small>
        </div>

        {/* Teléfono (solo si WhatsApp) */}
        {notificationChannel === 'whatsapp' && (
          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              id="phone"
              type="tel"
              className="form-control"
              placeholder="+573001234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
            <small className="form-text text-muted">
              Formato: +{código-país}{número} (ej: +573001234567)
            </small>
          </div>
        )}

        {/* Botón enviar */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !email}
        >
          {loading ? 'Creando invitación...' : 'Crear Invitación'}
        </button>
      </form>
    </div>
  );
};
```

### Versión TypeScript pura (sin React)

```typescript
class InvitationService {
  private apiUrl: string;
  private token: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.token = localStorage.getItem('token') || '';
  }

  /**
   * Validar email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar teléfono
   */
  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Sanitizar email
   */
  private sanitizeEmail(email: string): string {
    return email
      .trim()
      .toLowerCase()
      .replace(/[<>\"']/g, '');
  }

  /**
   * Validar formulario antes de enviar
   */
  validateForm(
    email: string,
    notificationChannel: string,
    phoneNumber?: string
  ): { valid: boolean; error?: string } {
    // 1. Email requerido
    if (!email || email.trim() === '') {
      return { valid: false, error: 'El email es requerido' };
    }

    // 2. Email válido
    if (!this.isValidEmail(email)) {
      return { valid: false, error: 'Email inválido' };
    }

    // 3. Longitud máxima
    if (email.length > 254) {
      return { valid: false, error: 'El email es demasiado largo' };
    }

    // 4. Validar teléfono si es WhatsApp
    if (notificationChannel === 'whatsapp') {
      if (!phoneNumber || phoneNumber.trim() === '') {
        return { valid: false, error: 'El teléfono es requerido' };
      }

      if (!this.isValidPhoneNumber(phoneNumber)) {
        return { valid: false, error: 'Formato de teléfono inválido' };
      }
    }

    return { valid: true };
  }

  /**
   * Crear invitación
   */
  async createInvitation(
    email: string,
    notificationChannel: string = 'email',
    phoneNumber?: string
  ): Promise<{
    success: boolean;
    data?: { link: string; expiresAt: string; invitationCode: string };
    error?: string;
  }> {
    // Validar
    const validation = this.validateForm(email, notificationChannel, phoneNumber);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Preparar datos
    const sanitizedEmail = this.sanitizeEmail(email);
    const requestBody: any = {
      email: sanitizedEmail,
      notificationChannel
    };

    if (notificationChannel === 'whatsapp' && phoneNumber) {
      requestBody.phoneNumber = phoneNumber;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/api/admin/invitations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Error al crear la invitación'
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          link: data.link,
          expiresAt: data.expiresAt,
          invitationCode: data.invitationCode
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      };
    }
  }
}

// Uso
const invitationService = new InvitationService(
  'http://localhost:7071'
);

const result = await invitationService.createInvitation(
  'usuario@ejemplo.com',
  'email'
);

if (result.success) {
  console.log('Enlace:', result.data?.link);
} else {
  console.error('Error:', result.error);
}
```

---

## Manejo de Errores

### Errores Posibles del Backend

| Error | Causa | Solución |
|-------|-------|----------|
| `"El email es requerido"` | Email vacío | Pedir al usuario que ingrese un email |
| `"User already exists"` | Email ya registrado | Mostrar error: "Este usuario ya existe" |
| `"Unauthorized"` | Token JWT inválido/expirado | Redirigir a login |
| `"Forbidden"` | Usuario no es admin | No mostrar esta funcionalidad |
| `"Internal Server Error"` | Error en servidor | Mostrar error genérico y reintentar |

### Manejo de Errores en Frontend

```typescript
async function handleCreateInvitation(email: string) {
  try {
    const response = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    switch (response.status) {
      case 201:
        // Éxito
        console.log('Invitación creada:', data.link);
        break;

      case 400:
        // Email inválido o error de validación
        if (data.error.includes('already exists')) {
          showError('Este usuario ya está registrado');
        } else {
          showError('Email inválido: ' + data.error);
        }
        break;

      case 401:
        // Token expirado
        showError('Sesión expirada. Inicie sesión nuevamente');
        redirectToLogin();
        break;

      case 403:
        // No es admin
        showError('No tiene permisos para esta acción');
        break;

      case 500:
        // Error del servidor
        showError('Error del servidor. Intente más tarde');
        break;

      default:
        showError('Error desconocido');
    }
  } catch (error) {
    showError('Error de conexión. Verifique su conexión a internet');
  }
}
```

---

## Estados y Respuestas

### Estados del Componente

```typescript
type InvitationState = 
  | 'idle'        // Estado inicial
  | 'loading'     // Enviando request
  | 'success'     // Invitación creada
  | 'error'       // Error en la creación
  | 'copied';     // Enlace copiado

// En React
const [state, setState] = useState<InvitationState>('idle');
```

### Respuesta Exitosa (201 Created)

```json
{
  "link": "http://localhost:3000/register?token=U2FsdGVkX1%2FdH%2F8qR9nK%3D&code=ABCD1234",
  "expiresAt": "2026-04-04T10:30:45Z",
  "invitationCode": "ABCD1234"
}
```

**Lo que el frontend debe hacer:**
1. ✅ Mostrar mensaje de éxito
2. ✅ Mostrar el `link` para copiar
3. ✅ Mostrar el `invitationCode` como referencia
4. ✅ Mostrar `expiresAt` (cuándo caduca)
5. ✅ Permitir copiar el enlace al portapapeles

---

## Buenas Prácticas

### 1. Normalizar Email
```typescript
const normalizedEmail = email.trim().toLowerCase();
```

### 2. Mostrar Expiración
```typescript
const expiresAt = new Date(response.expiresAt);
const now = new Date();
const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

console.log(`La invitación expira en ${hoursLeft} horas`);
```

### 3. Copiar Enlace al Portapapeles
```typescript
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Enlace copiado');
  }).catch(() => {
    // Fallback para navegadores viejos
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
}
```

### 4. Deshabilitar Botón Mientras se Carga
```html
<button 
  type="submit" 
  disabled={loading || !email}
  className={loading ? 'btn-loading' : 'btn-primary'}
>
  {loading ? 'Creando...' : 'Crear Invitación'}
</button>
```

### 5. Resetear Formulario Después de Éxito
```typescript
if (response.ok) {
  setEmail('');
  setPhoneNumber('');
  setNotificationChannel('email');
  // Mostrar mensaje de éxito
}
```

### 6. Logging para Debugging
```typescript
console.log('Request enviado:', {
  url: '/api/admin/invitations',
  method: 'POST',
  email,
  notificationChannel
});

console.log('Response recibido:', data);
```

### 7. Validación en Tiempo Real (Optional)
```typescript
const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setEmail(value);
  
  // Validar mientras escribe
  if (value && !isValidEmail(value)) {
    setEmailError('Email inválido');
  } else {
    setEmailError('');
  }
};
```

### 8. Mostrar Información de Expiración
```typescript
const showExpirationInfo = () => {
  const expiresAt = new Date(invitationData.expiresAt);
  const timeLeft = expiresAt.getTime() - new Date().getTime();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  
  return `⏰ Esta invitación expira en ${hoursLeft} horas`;
};
```

---

## Checklist de Implementación

### Validaciones
- [ ] Email requerido
- [ ] Email válido (regex)
- [ ] Email sin espacios
- [ ] Email máximo 254 caracteres
- [ ] Email normalizado (trim + lowercase)
- [ ] Teléfono requerido si WhatsApp
- [ ] Teléfono con formato válido
- [ ] Sanitizar entrada (prevenir XSS)

### Funcionalidad
- [ ] Obtener token JWT del admin
- [ ] Verificar que el usuario es admin
- [ ] Enviar POST a `/api/admin/invitations`
- [ ] Mostrar respuesta exitosa
- [ ] Mostrar enlace de invitación
- [ ] Permitir copiar enlace
- [ ] Mostrar código de invitación
- [ ] Mostrar fecha de expiración
- [ ] Resetear formulario

### Manejo de Errores
- [ ] Validar respuesta HTTP
- [ ] Mostrar errores del servidor
- [ ] Detectar token expirado
- [ ] Detectar falta de permisos (403)
- [ ] Manejar errores de red
- [ ] Mostrar mensajes claros al usuario

### UX/UI
- [ ] Deshabilitar botón mientras carga
- [ ] Mostrar loading spinner
- [ ] Mostrar mensaje de éxito
- [ ] Permitir copiar con un clic
- [ ] Mostrar cuánto tiempo falta para expiración
- [ ] Interfaz responsiva
- [ ] Validación en tiempo real (optional)

---

## Resumen

**El frontend debe:**

1. ✅ **Obtener** el JWT token del admin
2. ✅ **Validar** el email (formato, longitud, caracteres especiales)
3. ✅ **Validar** el teléfono si es WhatsApp
4. ✅ **Sanitizar** la entrada
5. ✅ **Enviar** POST a `/api/admin/invitations` con Authorization header
6. ✅ **Mostrar** el enlace y código de invitación
7. ✅ **Permitir** copiar el enlace al portapapeles
8. ✅ **Manejar** errores apropiadamente
9. ✅ **Resetear** el formulario después de éxito

**Validaciones mínimas:**
- Email no vacío ✅
- Email válido (formato correcto) ✅
- Email máximo 254 caracteres ✅
- Si WhatsApp: teléfono requerido ✅
- Si WhatsApp: teléfono con formato válido ✅

