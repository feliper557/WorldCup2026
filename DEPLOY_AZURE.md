# 🚀 Guía de Despliegue en Azure — Francachela Mundial 2026
## Todo desde el navegador (portal.azure.com)

> Costo estimado: **$0/mes** usando Free Tiers de Azure.  
> Cuenta utilizada: `feliper421@gmail.com` — Directorio: `Default Directory`

---

## Antes de empezar — Una sola cosa desde la terminal (las migraciones)

Lo único que **sí** requiere la terminal es correr las migraciones de Entity Framework (crear las tablas en la BD). Todo lo demás se hace desde el portal.

Genera los secrets seguros que usarás luego. Copia y guarda estos valores en un bloc de notas:

```powershell
# Ejecutar en la terminal normal de VS Code (no requiere administrador)
# JWT Secret (mínimo 32 chars)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})

# Encryption Key (exactamente 32 chars)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Encryption IV (exactamente 16 chars)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
```

Guarda los 3 valores. Los necesitarás en el Paso 5.

---

## PASO 1 — Crear el Resource Group

1. Ve a **[portal.azure.com](https://portal.azure.com)** e inicia sesión con `feliper421@gmail.com`
2. En la barra de búsqueda escribe **"Grupos de recursos"** → clic en el resultado
3. Clic en **"+ Crear"**
4. Completa:

| Campo | Valor |
|-------|-------|
| Suscripción | Azure subscription 1 |
| Grupo de recursos | `rg-francachela` |
| Región | `(US) East US` |

5. Clic en **"Revisar y crear"** → **"Crear"**

---

## PASO 2 — Crear el SQL Server

1. En la barra de búsqueda escribe **"SQL Server"** (el servicio, no la BD) → clic en el resultado
2. Clic en **"+ Crear"**
3. Pestaña **"Datos básicos"**:

| Campo | Valor |
|-------|-------|
| Suscripción | Azure subscription 1 |
| Grupo de recursos | `rg-francachela` |
| Nombre del servidor | `francachela-sql` |
| Región | `(US) East US` |
| Método de autenticación | Autenticación de SQL |
| Inicio de sesión del administrador | `sqladmin` |
| Contraseña | `Franc@chela2026!` |
| Confirmar contraseña | `Franc@chela2026!` |

4. Clic en **"Revisar y crear"** → **"Crear"**  
   Espera ~1 minuto a que termine.

---

## PASO 3 — Crear la Base de Datos (Free Serverless)

1. En la barra de búsqueda escribe **"SQL Database"** → clic en el resultado
2. Clic en **"+ Crear"**
3. Pestaña **"Datos básicos"**:

| Campo | Valor |
|-------|-------|
| Suscripción | Azure subscription 1 |
| Grupo de recursos | `rg-francachela` |
| Nombre de la base de datos | `WorldCup2026` |
| Servidor | `francachela-sql` |
| ¿Quiere usar el grupo elástico de SQL? | No |
| Entorno de carga de trabajo | **Desarrollo** |

4. En **"Proceso + almacenamiento"** → clic en **"Configurar base de datos"**:
   - Nivel de servicio: **De uso general**
   - Proceso: **Sin servidor** (Serverless)
   - Núcleos virtuales mínimos: `0.5`
   - Núcleos virtuales máximos: `1`
   - Retraso de pausa automática: **1 hora**
   - Marcar ✅ **"Aplicar oferta de base de datos gratuita"** (si aparece)
   - Clic en **"Aplicar"**

5. Pestaña **"Redes"**:
   - Método de conectividad: **Punto de conexión público**
   - Permitir que los servicios y recursos de Azure accedan a este servidor: **Sí**
   - Agregar dirección IP del cliente actual: **Sí**

6. Clic en **"Revisar y crear"** → **"Crear"**  
   Espera ~2-3 minutos.

---

## PASO 4 — Configurar Firewall del SQL Server

1. Ve a **"SQL Server"** → selecciona `francachela-sql`
2. En el menú izquierdo: **"Seguridad"** → **"Redes"**
3. En **"Reglas de firewall"** verifica que exista una regla para tu IP (debió crearse en el paso anterior)
4. En **"Excepciones"** activa ✅ **"Permitir que los servicios y recursos de Azure accedan a este servidor"**
5. Clic en **"Guardar"**

---

## PASO 5 — Correr las Migraciones (única vez en terminal)

Aquí sí necesitas la terminal de VS Code. Abre la terminal integrada y ejecuta:

```powershell
cd api

$env:SqlConnectionString = "Server=tcp:francachela-sql.database.windows.net,1433;Initial Catalog=WorldCup2026;Persist Security Info=False;User ID=sqladmin;Password=Franc@chela2026!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

dotnet ef database update
```

Si todo va bien verás:
```
Applying migration '20260404025057_InitialCreate'.
Done.
```

> Si dice que `dotnet ef` no se reconoce, instálalo primero:
> ```powershell
> dotnet tool install --global dotnet-ef
> ```

---

## PASO 6 — Crear Azure Static Web Apps

1. En la barra de búsqueda escribe **"Static Web Apps"** → clic en el resultado
2. Clic en **"+ Crear"**
3. Completa el formulario:

| Campo | Valor |
|-------|-------|
| Suscripción | Azure subscription 1 |
| Grupo de recursos | `rg-francachela` |
| Nombre | `francachela-swa` |
| Tipo de plan | **Gratis** |
| Origen de implementación | **GitHub** |

4. Clic en **"Iniciar sesión con GitHub"** → autoriza el acceso
5. Completa los campos de GitHub:

| Campo | Valor |
|-------|-------|
| Organización | `feliper557` |
| Repositorio | `WorldCup2026` |
| Rama | `main` |

6. En **"Detalles de compilación"**:

| Campo | Valor |
|-------|-------|
| Valores preestablecidos de compilación | **Vite** |
| Ubicación de la aplicación | `app` |
| Ubicación de la API | `api` |
| Ubicación de salida | `dist` |

7. Clic en **"Revisar y crear"** → **"Crear"**

Azure automáticamente hace un commit en tu repo con el workflow de GitHub Actions y dispara el primer deployment.

---

## PASO 7 — Agregar el GitHub Secret para CI/CD

Azure necesita un token secreto para que GitHub Actions pueda hacer deployments.

1. Ve al portal → **Static Web Apps** → `francachela-swa`
2. En el menú izquierdo: **"Administrar token de implementación"**
3. Clic en el icono 👁 para ver el token → **copia ese valor**

Ahora en GitHub:
1. Ve a `github.com/feliper557/WorldCup2026`
2. Pestaña **"Settings"** → menú izquierdo **"Secrets and variables"** → **"Actions"**
3. Clic en **"New repository secret"**
4. Nombre: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Valor: pega el token copiado
6. Clic en **"Add secret"**

---

## PASO 8 — Configurar las Variables de Entorno del Backend

1. Ve al portal → **Static Web Apps** → `francachela-swa`
2. En el menú izquierdo: **"Configuración"** → **"Variables de entorno"** (o "Configuration")
3. Agrega cada variable usando el botón **"+ Agregar"**:

> ⚠️ Usa los valores generados en el "Antes de empezar". El separador en Azure Functions es `__` (doble guión bajo), no `:`.

| Nombre | Valor |
|--------|-------|
| `SqlConnectionString` | `Server=tcp:francachela-sql.database.windows.net,1433;Initial Catalog=WorldCup2026;Persist Security Info=False;User ID=sqladmin;Password=Franc@chela2026!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;` |
| `Jwt__SecretKey` | *(el valor de 48 chars que generaste)* |
| `Jwt__Issuer` | `worldcup2026-api` |
| `Jwt__Audience` | `worldcup2026-app` |
| `Jwt__ExpirationMinutes` | `1440` |
| `Encryption__Key` | *(el valor de 32 chars que generaste)* |
| `Encryption__IV` | *(el valor de 16 chars que generaste)* |
| `FOOTBALL_DATA_API_KEY` | `16adbf9e6c97444b878dfa6b5ddacfbf` |
| `SENDGRID_API_KEY` | *(tu key de SendGrid — o dejar vacío por ahora)* |
| `SENDGRID_FROM_EMAIL` | `noreply@francachela.com` |
| `App__BaseUrl` | `https://francachela-swa.azurestaticapps.net` |

4. Clic en **"Guardar"** cuando hayas agregado todas.

---

## PASO 9 — Crear el Usuario Admin Inicial

1. Ve al portal → **SQL Database** → `WorldCup2026`
2. En el menú izquierdo: **"Editor de consultas (versión preliminar)"**
3. Inicia sesión con:
   - Autenticación: `Autenticación de SQL Server`
   - Inicio de sesión: `sqladmin`
   - Contraseña: `Franc@chela2026!`

4. Primero genera el hash BCrypt de tu contraseña de admin:  
   Abre **[bcrypt-generator.com](https://bcrypt-generator.com)** → escribe tu contraseña → Cost Factor: **10** → clic en **"Encrypt"** → copia el resultado (empieza con `$2a$10$...`)

5. En el editor del portal pega y ejecuta esta query (reemplaza los valores):

```sql
INSERT INTO Users (
  Id, Email, DisplayName, PasswordHash,
  Status, Role, IsEmailVerified,
  TotalPoints, TotalPredictions, CorrectPredictions,
  AccuracyPercentage, LeaderboardRank, CreatedAt
)
VALUES (
  NEWID(),
  'feliper421@gmail.com',
  'Admin Francachela',
  '$2a$10$<PEGA_AQUI_EL_HASH_BCRYPT>',
  'active',
  'admin',
  1,
  0, 0, 0, 0, 0,
  GETUTCDATE()
);
```

6. Clic en **"Ejecutar"** → verifica que diga `1 row(s) affected`

---

## PASO 10 — Verificar el Deployment

1. Ve a `github.com/feliper557/WorldCup2026` → pestaña **"Actions"**
2. Verifica que el workflow reciente esté en ✅ verde (tarda ~5 minutos la primera vez)
3. Si falló (❌ rojo), clic en el workflow → ver el error → compartirlo para ayudarte
4. Cuando esté verde, ve al portal → **Static Web Apps** → `francachela-swa` → copia la **URL**
5. Abre la URL en el navegador → deberías ver el login de Francachela
6. Inicia sesión con `feliper421@gmail.com` y la contraseña del paso 9

---

## PASO 11 — Revisar el workflow generado por Azure (importante)

Azure hace un commit automático en tu repo con el workflow. Verifica que esté bien configurado:

1. Ve a `github.com/feliper557/WorldCup2026` → carpeta `.github/workflows/`
2. Abre el archivo `azure-static-web-apps-*.yml`
3. Verifica que tenga estos valores:
```yaml
app_location: "app"
api_location: "api"
output_location: "dist"
```
4. Si falta `app_build_command`, edita el archivo en GitHub (ícono ✏️) y agrega:
```yaml
app_build_command: "npm ci && npm run build"
```
5. Haz commit del cambio → el workflow se vuelve a disparar automáticamente

---

## Flujo de CI/CD — Cómo funciona de ahora en adelante

Cada vez que hagas un push al repositorio:

```
git push origin main
    ↓
GitHub Actions (automático, ~5 min)
    ↓
  Build del frontend (npm run build → dist/)
  + Build del backend (.NET 8 Functions)
    ↓
Deploy a Azure Static Web Apps
    ↓
La app se actualiza en la URL de producción
```

---

## Troubleshooting frecuente

### ❌ GitHub Actions falla — "SqlConnectionString not configured"
→ Revisar Paso 8. El nombre debe ser exactamente `SqlConnectionString` (sin `__`).

### ❌ React Router muestra 404 al refrescar una página
→ Verificar que el archivo `app/staticwebapp.config.json` exista en el repositorio.

### ❌ La primera petición tarda 30-60 segundos
→ Normal. Es el cold start del SQL Serverless tras 1 hora sin uso.

### ❌ Error "Unauthorized" al hacer login
→ Verificar que `Jwt__SecretKey` tenga mínimo 32 caracteres y que `Jwt__Issuer` / `Jwt__Audience` coincidan con los valores del código.

### ❌ No aparece la opción "Oferta gratuita" en la BD
→ La suscripción ya usó la oferta gratis. Usar el tier **De uso general Serverless** igualmente — el costo será mínimo (centavos) con autopause activado.

---

## Costo estimado mensual

| Recurso | Plan | Costo |
|---------|------|-------|
| Azure Static Web Apps | Free | **$0** |
| Azure SQL Database Serverless | Free Offer / autopause | **$0** |
| SendGrid | Free (100 emails/día) | **$0** |
| Application Insights | Free (5 GB logs/mes) | **$0** |
| Football-Data.org | Free (10 req/min) | **$0** |
| **TOTAL** | | **$0/mes** |
