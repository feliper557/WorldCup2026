# ?? Guía Rápida: Cambio de API-Football a FIFA API

## ? Cambios Implementados

Se ha integrado la **API oficial de FIFA** para obtener datos del Mundial 2026. Los fixtures, resultados y horarios ahora provienen directamente de FIFA.com.

---

## ?? Nuevos Endpoints

### Para el Frontend

Cambia las llamadas API del frontend de:

#### ? ANTES (API-Football)
```typescript
// Obtener fixtures por fecha
const response = await fetch('/api/football/fixtures/date/2026-06-11?league=1');

// Obtener partidos en vivo
const response = await fetch('/api/football/fixtures/live');

// Obtener tabla de posiciones
const response = await fetch('/api/football/standings?league=1&season=2026');
```

#### ? AHORA (FIFA)
```typescript
// Obtener fixtures por fecha
const response = await fetch('/api/fifa/fixtures/date/2026-06-11');

// Filtrar por país (ej: Colombia)
const response = await fetch('/api/fifa/fixtures?country=CO');

// Obtener partidos en vivo
const response = await fetch('/api/fifa/fixtures/live');

// Obtener tabla de posiciones
const response = await fetch('/api/fifa/standings');

// Obtener detalles de un partido
const response = await fetch('/api/fifa/match/400235460');
```

---

## ?? Ejemplos de Uso

### 1. Mostrar fixtures de Colombia
```typescript
async function getColombiaFixtures() {
  const response = await fetch('/api/fifa/fixtures?country=CO');
  const data = await response.json();
  
  data.Results.forEach(match => {
    console.log(`${match.Home.TeamName[0].Description} vs ${match.Away.TeamName[0].Description}`);
    console.log(`Fecha: ${new Date(match.Date).toLocaleString()}`);
    console.log(`Estadio: ${match.Stadium.Name[0].Description}`);
  });
}
```

### 2. Mostrar partidos del día
```typescript
async function getTodayMatches() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const response = await fetch(`/api/fifa/fixtures/date/${today}`);
  const data = await response.json();
  
  return data.Results;
}
```

### 3. Monitorear partidos en vivo
```typescript
async function watchLiveMatches() {
  setInterval(async () => {
    const response = await fetch('/api/fifa/fixtures/live');
    const data = await response.json();
    
    data.Results.forEach(match => {
      console.log(`? ${match.Home.Abbreviation} ${match.HomeTeamScore} - ${match.AwayTeamScore} ${match.Away.Abbreviation}`);
      console.log(`Tiempo: ${match.MatchTime}`);
    });
  }, 30000); // Actualizar cada 30 segundos
}
```

### 4. Mostrar tabla de posiciones
```typescript
async function getStandings() {
  const response = await fetch('/api/fifa/standings');
  const data = await response.json();
  
  data.Results.forEach(group => {
    console.log(`Grupo: ${group.GroupName[0].Description}`);
    group.TeamStandings.forEach(team => {
      console.log(`${team.Position}. ${team.Team.TeamName[0].Description} - ${team.Points} pts`);
    });
  });
}
```

---

## ??? Formato de Respuesta

### Fixture (Match)
```typescript
interface FifaMatch {
  IdMatch: string;
  Date: string; // ISO 8601
  LocalDate: string;
  MatchStatus: number; // 0=No iniciado, 3=En vivo, 10=Finalizado
  Home: {
    IdTeam: string;
    TeamName: [{ Locale: string; Description: string }];
    Abbreviation: string; // Ej: "COL"
    PictureUrl: string;
  };
  Away: {
    IdTeam: string;
    TeamName: [{ Locale: string; Description: string }];
    Abbreviation: string;
    PictureUrl: string;
  };
  Stadium: {
    Name: [{ Locale: string; Description: string }];
    CityName: [{ Locale: string; Description: string }];
  };
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  MatchTime: string; // Ej: "45'+2"
}
```

### Helper para Obtener Texto en Español
```typescript
function getLocalizedText(localized: Array<{ Locale: string; Description: string }>) {
  // Buscar español primero
  const spanish = localized.find(l => l.Locale.startsWith('es'));
  if (spanish) return spanish.Description;
  
  // Fallback a inglés
  const english = localized.find(l => l.Locale.startsWith('en'));
  if (english) return english.Description;
  
  // Fallback al primero disponible
  return localized[0]?.Description || '';
}

// Uso
const teamName = getLocalizedText(match.Home.TeamName);
```

---

## ?? Componente React Ejemplo

```tsx
import { useState, useEffect } from 'react';

interface Match {
  IdMatch: string;
  Date: string;
  MatchStatus: number;
  Home: {
    TeamName: [{ Description: string }];
    Abbreviation: string;
  };
  Away: {
    TeamName: [{ Description: string }];
    Abbreviation: string;
  };
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  Stadium: {
    Name: [{ Description: string }];
  };
}

export function ColombiaMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fifa/fixtures?country=CO')
      .then(res => res.json())
      .then(data => {
        setMatches(data.Results || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando partidos...</div>;

  return (
    <div className="matches-container">
      <h2>Partidos de Colombia - Mundial 2026</h2>
      {matches.map(match => (
        <div key={match.IdMatch} className="match-card">
          <div className="match-teams">
            <span>{match.Home.TeamName[0].Description}</span>
            <span className="score">
              {match.HomeTeamScore ?? '-'} : {match.AwayTeamScore ?? '-'}
            </span>
            <span>{match.Away.TeamName[0].Description}</span>
          </div>
          <div className="match-info">
            <span>?? {new Date(match.Date).toLocaleString('es-CO')}</span>
            <span>??? {match.Stadium.Name[0].Description}</span>
            <span className={`status-${match.MatchStatus}`}>
              {match.MatchStatus === 0 ? '? Programado' : 
               match.MatchStatus === 3 ? '?? EN VIVO' : 
               '? Finalizado'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## ?? Códigos de País más Usados

```typescript
const COUNTRY_CODES = {
  // CONMEBOL
  'Colombia': 'CO',
  'Argentina': 'AR',
  'Brasil': 'BR',
  'Uruguay': 'UY',
  'Chile': 'CL',
  'Ecuador': 'EC',
  'Perú': 'PE',
  'Paraguay': 'PY',
  
  // CONCACAF
  'México': 'MX',
  'Estados Unidos': 'US',
  'Canadá': 'CA',
  'Costa Rica': 'CR',
  
  // UEFA
  'España': 'ES',
  'Alemania': 'DE',
  'Francia': 'FR',
  'Inglaterra': 'GB-ENG',
  'Italia': 'IT',
  'Portugal': 'PT',
};
```

---

## ?? Testing

### Prueba con curl
```bash
# Todos los partidos
curl http://localhost:7071/api/fifa/fixtures

# Partidos de Colombia
curl http://localhost:7071/api/fifa/fixtures?country=CO

# Partidos de hoy
curl http://localhost:7071/api/fifa/fixtures/date/$(date +%Y-%m-%d)

# En vivo
curl http://localhost:7071/api/fifa/fixtures/live

# Tabla de posiciones
curl http://localhost:7071/api/fifa/standings
```

### Prueba con Postman
```
GET {{baseUrl}}/api/fifa/fixtures?country=CO
Authorization: (none required for local)
```

---

## ?? Troubleshooting

### "Results is empty"
- Verifica que la fecha esté en formato `YYYY-MM-DD`
- El código de país debe ser válido (ej: `CO`, no `COL`)
- Puede que no haya partidos en esa fecha

### "Cannot read property 'Description' of undefined"
- Algunos campos pueden ser null
- Usa optional chaining: `match.Home?.TeamName?.[0]?.Description`

### Partidos en vivo no aparecen
- El `MatchStatus` debe ser `3`
- Verifica que realmente haya partidos en vivo
- El endpoint se actualiza cada vez que se llama (no hay WebSocket)

---

## ?? Próximos Pasos

1. **Actualizar el frontend** para usar los nuevos endpoints
2. **Implementar caché** para reducir llamadas a la API
3. **Agregar WebSockets** para updates en tiempo real (opcional)
4. **Crear componentes reutilizables** para fixtures y standings
5. **Agregar filtros adicionales** (por grupo, por estadio, etc.)

---

## ?? Tips

- **Localization**: FIFA devuelve textos en múltiples idiomas. Busca por `Locale: "es-ES"` para español
- **Imágenes**: Usa `PictureUrl` para logos de equipos
- **Status**: Monitorea `MatchStatus` para mostrar indicadores visuales
- **Caché**: Cachea fixtures que no cambiarán (partidos finalizados)
- **Polling**: Para live matches, actualiza cada 30-60 segundos

---

¿Dudas? Revisa `FIFA_API_README.md` para documentación completa.
