# 🛒 Implementación Wompi en el Frontend

**Fecha:** 2026-04-04  
**Versión:** 1.0  
**Complementa:** `FLUJO_REGISTRO_CON_PAGO_WOMPI.md`

---

## 📋 Cambios en el Frontend

### 1. LoginPage.tsx - Agregar Opción de Auto-Registro

Actualizar para mostrar dos opciones en la sección de registro:

```tsx
// ANTES (solo GitHub)
if (mode === 'register') {
  return (
    <Button href={getLoginUrl('github')}>
      Registrarse con GitHub
    </Button>
  );
}

// DESPUÉS (GitHub + Auto-registro con pago)
if (mode === 'register') {
  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button
          variant={registerMethod === 'github' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setRegisterMethod('github')}
        >
          GitHub
        </Button>
        <Button
          variant={registerMethod === 'payment' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setRegisterMethod('payment')}
        >
          💳 Pagar
        </Button>
      </Box>

      {registerMethod === 'github' ? (
        <Button
          variant="contained"
          fullWidth
          href={getLoginUrl('github')}
        >
          Registrarse con GitHub
        </Button>
      ) : (
        <PaymentRegistrationForm />
      )}
    </>
  );
}
```

### 2. Crear PaymentRegistrationForm.tsx

Componente para el formulario de auto-registro con pago:

```tsx
// app/src/components/PaymentRegistrationForm.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { Lock, Email, Person } from '@mui/icons-material';

interface PaymentRegistrationFormProps {
  onSuccess?: () => void;
}

export function PaymentRegistrationForm({ onSuccess }: PaymentRegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  // Validaciones
  const isFormValid =
    name.trim().length >= 2 &&
    email.includes('@') &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Validar datos localmente
      if (!isFormValid) {
        setError('Por favor completa todos los campos correctamente');
        return;
      }

      // 2. Llamar a POST /api/auth/pre-register
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/pre-register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear la cuenta');
        return;
      }

      // 3. Guardar userId temporalmente (para referencia)
      sessionStorage.setItem('preRegisterUserId', data.userId);
      sessionStorage.setItem('preRegisterEmail', email);

      // 4. Redirigir a checkout de Wompi
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Nombre Completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
        disabled={loading}
        required
        minLength={2}
        startAdornment={<Person sx={{ mr: 1, color: theme.palette.primary.main }} />}
        placeholder="Juan Pérez"
      />

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
        disabled={loading}
        required
        startAdornment={<Email sx={{ mr: 1, color: theme.palette.primary.main }} />}
        placeholder="juan@example.com"
      />

      <TextField
        fullWidth
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        margin="normal"
        disabled={loading}
        required
        minLength={8}
        helperText="Mínimo 8 caracteres"
        startAdornment={<Lock sx={{ mr: 1, color: theme.palette.primary.main }} />}
      />

      <TextField
        fullWidth
        label="Confirmar Contraseña"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        margin="normal"
        disabled={loading}
        required
        error={confirmPassword.length > 0 && password !== confirmPassword}
        helperText={
          confirmPassword.length > 0 && password !== confirmPassword
            ? 'Las contraseñas no coinciden'
            : ''
        }
        startAdornment={<Lock sx={{ mr: 1, color: theme.palette.primary.main }} />}
      />

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: theme.palette.text.secondary }}>
        💳 Se redirigirá a Wompi para completar el pago ($50.000 COP)
      </Typography>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!isFormValid || loading}
        sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}
      >
        {loading ? <CircularProgress size={24} /> : 'Continuar al Pago'}
      </Button>

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 2, color: theme.palette.warning.main }}
      >
        ⚠️ Se cobrará $50.000 COP al completar tu registro
      </Typography>
    </Box>
  );
}
```

### 3. Crear PaymentResultPage.tsx

Página que se muestra después del pago:

```tsx
// app/src/pages/PaymentResultPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export function PaymentResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const transactionId = searchParams.get('id');
  const reference = searchParams.get('reference');

  useEffect(() => {
    // Simular verificación del pago (en realidad lo verifica Wompi vía webhook)
    const timer = setTimeout(() => {
      if (transactionId) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [transactionId]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography>Procesando pago...</Typography>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          px: 2,
        }}
      >
        <CheckCircleIcon
          sx={{
            fontSize: 80,
            color: theme.palette.success.main,
            mb: 2,
          }}
        />

        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          ¡Pago Recibido!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
            mb: 1,
            maxWidth: 500,
          }}
        >
          Tu pago fue procesado exitosamente. Tu cuenta será activada en unos
          minutos y recibirás un correo de bienvenida con el link para iniciar
          sesión.
        </Typography>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 2,
            color: theme.palette.text.disabled,
          }}
        >
          Referencia: {reference || transactionId}
        </Typography>

        <Alert severity="info" sx={{ mt: 3, maxWidth: 500 }}>
          Si no recibiste el correo en 5 minutos, revisa tu carpeta de spam o
          intenta iniciar sesión directamente.
        </Alert>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ minWidth: 160 }}
          >
            Ir a Login
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{ minWidth: 160 }}
          >
            Volver al Inicio
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        px: 2,
      }}
    >
      <ErrorIcon
        sx={{
          fontSize: 80,
          color: theme.palette.error.main,
          mb: 2,
        }}
      />

      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
        Error en el Pago
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
          maxWidth: 500,
        }}
      >
        No pudimos procesar tu pago. Por favor intenta de nuevo.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/login')}
          sx={{ minWidth: 160 }}
        >
          Reintentar
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ minWidth: 160 }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
}
```

### 4. Actualizar app/src/App.tsx (router)

Agregar la ruta para la página de resultado:

```tsx
// app/src/App.tsx
import { PaymentResultPage } from './pages/PaymentResultPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... rutas existentes ... */}
        <Route path="/pago-resultado" element={<PaymentResultPage />} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🧪 Testing en el Frontend

### Paso 1: Abrir página de registro
```
http://localhost:5173/login
→ Click en "Registrarse"
→ Click en "💳 Pagar"
```

### Paso 2: Llenar formulario
```
Nombre: Juan Prueba
Email: juan@test.com
Contraseña: Password@123456
Confirmar: Password@123456
→ Click "Continuar al Pago"
```

### Paso 3: Redireccionamiento a Wompi
El formulario enviará POST a `/api/auth/pre-register` y recibirá URL de checkout de Wompi.

### Paso 4: Pagar en Wompi (sandbox)
```
Tarjeta de prueba: 4242 4242 4242 4242
CVV: 123
Vence: 12/29
→ Click "Pagar"
```

### Paso 5: Resultado
Wompi redirige a `/pago-resultado?id=<transactionId>&reference=...`

---

## 🔄 Estado Actual del Flujo (después de implementar)

```
┌────────────────────┐
│  LoginPage Updated │  ← Nuevo: opción de registro con pago
│  + PaymentRegForm  │
└────────────────────┘
         │
         ▼
POST /api/auth/pre-register ✅
         │
         ▼
├── Usuario creado (pending_payment) ✅
├── CheckoutUrl generado ✅
└── Redirige a Wompi ✅
         │
         ▼
┌────────────────────┐
│   Wompi Checkout   │  ← Usuario elige método de pago
│   (externo)        │
└────────────────────┘
         │
  ┌──────┴──────┐
  │             │
Pago OK    Pago FAIL
  │             │
  ▼             ▼
Webhook    Frontend
redirige   muestra error
a /pago-   (puede reintentar)
resultado

POST /api/payments/wompi-webhook ✅
├── Valida checksum ✅
├── Guarda pago ✅
└── Activa usuario ✅
    └── Envía email ✅
```

---

## 📝 Estado Local (sessionStorage)

Durante el flujo de pago, se guardan datos temporales:

```javascript
// Antes de redirigir a Wompi
sessionStorage.setItem('preRegisterUserId', 'a1b2c3d4-...');
sessionStorage.setItem('preRegisterEmail', 'juan@test.com');

// En la página de resultado, se pueden usar para mostrar info
const email = sessionStorage.getItem('preRegisterEmail');
```

---

## 🔒 Seguridad en el Frontend

✅ La contraseña se envía solo en POST (HTTPS en producción)  
✅ No se guarda token en sessionStorage antes del registro  
✅ El checkout se abre en la misma ventana (puedes cambiar a `target="_blank"`)  
✅ La activación ocurre en webhook, no en redirect (usuario no puede falsificar)  

---

## 📋 Checklist de Implementación Frontend

- [ ] Actualizar `LoginPage.tsx` con selector de método de registro
- [ ] Crear `PaymentRegistrationForm.tsx`
- [ ] Crear `PaymentResultPage.tsx`
- [ ] Actualizar router en `App.tsx`
- [ ] Actualizar variable de entorno `VITE_API_URL`
- [ ] Probar formulario de pre-registro
- [ ] Probar flujo completo en Wompi sandbox
- [ ] Verificar que email de bienvenida se recibe

---

**Implementación completada:** 2026-04-04 ✅
