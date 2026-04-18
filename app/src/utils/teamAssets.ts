// Helper para obtener escudo de club (La Liga) o bandera de selección (Mundial 2026)
// a partir del nombre del equipo tal como viene del backend.
//
// - Clubes: usa el CDN publico de api-sports (media.api-sports.io) que sirve los
//   escudos en PNG sin necesidad de API key.
// - Selecciones: usa flagcdn.com con el codigo ISO-2 del pais.

const LALIGA_TEAM_IDS: Record<string, number> = {
  'real madrid': 541,
  'real madrid cf': 541,
  'fc barcelona': 529,
  barcelona: 529,
  'atletico madrid': 530,
  'atletico de madrid': 530,
  'club atletico de madrid': 530,
  'athletic club': 531,
  'athletic bilbao': 531,
  valencia: 532,
  'valencia cf': 532,
  villarreal: 533,
  'villarreal cf': 533,
  'las palmas': 534,
  'ud las palmas': 534,
  sevilla: 536,
  'sevilla fc': 536,
  celta: 538,
  'celta de vigo': 538,
  'rc celta': 538,
  leganes: 539,
  'cd leganes': 539,
  espanyol: 540,
  'rcd espanyol': 540,
  'real sociedad': 548,
  'real sociedad de futbol': 548,
  alaves: 542,
  'deportivo alaves': 542,
  'real betis': 543,
  betis: 543,
  getafe: 546,
  'getafe cf': 546,
  girona: 547,
  'girona fc': 547,
  osasuna: 727,
  'ca osasuna': 727,
  'rayo vallecano': 728,
  rayo: 728,
  mallorca: 798,
  'rcd mallorca': 798,
  elche: 797,
  'elche cf': 797,
  valladolid: 720,
  'real valladolid': 720,
};

// Mundial 2026 — nombres (es + en) → ISO-2
const COUNTRY_ISO2: Record<string, string> = {
  // Español
  argentina: 'ar',
  paraguay: 'py',
  uruguay: 'uy',
  canada: 'ca',
  'canadá': 'ca',
  francia: 'fr',
  'paises bajos': 'nl',
  'países bajos': 'nl',
  holanda: 'nl',
  senegal: 'sn',
  ecuador: 'ec',
  alemania: 'de',
  'españa': 'es',
  espana: 'es',
  polonia: 'pl',
  chile: 'cl',
  brasil: 'br',
  'méxico': 'mx',
  mexico: 'mx',
  croacia: 'hr',
  tailandia: 'th',
  portugal: 'pt',
  inglaterra: 'gb-eng',
  'gales': 'gb-wls',
  escocia: 'gb-sct',
  italia: 'it',
  'bélgica': 'be',
  belgica: 'be',
  dinamarca: 'dk',
  suiza: 'ch',
  austria: 'at',
  'turquía': 'tr',
  turquia: 'tr',
  'chequia': 'cz',
  'república checa': 'cz',
  serbia: 'rs',
  ucrania: 'ua',
  noruega: 'no',
  suecia: 'se',
  'irlanda': 'ie',
  hungria: 'hu',
  'hungría': 'hu',
  rumania: 'ro',
  grecia: 'gr',
  colombia: 'co',
  peru: 'pe',
  'perú': 'pe',
  venezuela: 've',
  bolivia: 'bo',
  'estados unidos': 'us',
  eeuu: 'us',
  'corea del sur': 'kr',
  'arabia saudi': 'sa',
  'arabia saudí': 'sa',
  iran: 'ir',
  'irán': 'ir',
  iraq: 'iq',
  qatar: 'qa',
  australia: 'au',
  'nueva zelanda': 'nz',
  marruecos: 'ma',
  egipto: 'eg',
  tunez: 'tn',
  'túnez': 'tn',
  argelia: 'dz',
  nigeria: 'ng',
  camerun: 'cm',
  'camerún': 'cm',
  ghana: 'gh',
  'costa de marfil': 'ci',
  sudafrica: 'za',
  'sudáfrica': 'za',
  japon: 'jp',
  'japón': 'jp',

  // Inglés (football-data.org) — solo nombres sin equivalente español ya definido arriba
  belgium: 'be',
  egypt: 'eg',
  'saudi arabia': 'sa',
  'new zealand': 'nz',
  france: 'fr',
  brazil: 'br',
  germany: 'de',
  spain: 'es',
  england: 'gb-eng',
  wales: 'gb-wls',
  scotland: 'gb-sct',
  netherlands: 'nl',
  poland: 'pl',
  croatia: 'hr',
  italy: 'it',
  denmark: 'dk',
  switzerland: 'ch',
  turkey: 'tr',
  ukraine: 'ua',
  norway: 'no',
  sweden: 'se',
  ireland: 'ie',
  hungary: 'hu',
  romania: 'ro',
  greece: 'gr',
  usa: 'us',
  'united states': 'us',
  japan: 'jp',
  'south korea': 'kr',
  'korea republic': 'kr',
  morocco: 'ma',
  algeria: 'dz',
  cameroon: 'cm',
  'ivory coast': 'ci',
  "cote d'ivoire": 'ci',
  'south africa': 'za',
  tunisia: 'tn',
  czechia: 'cz',
  'czech republic': 'cz',
};

// Traducciones inglés → español para nombres de selecciones
const EN_TO_ES: Record<string, string> = {
  'belgium':          'Bélgica',
  'egypt':            'Egipto',
  'saudi arabia':     'Arabia Saudita',
  'new zealand':      'Nueva Zelanda',
  'france':           'Francia',
  'senegal':          'Senegal',
  'brazil':           'Brasil',
  'germany':          'Alemania',
  'spain':            'España',
  'england':          'Inglaterra',
  'wales':            'Gales',
  'scotland':         'Escocia',
  'netherlands':      'Países Bajos',
  'poland':           'Polonia',
  'croatia':          'Croacia',
  'portugal':         'Portugal',
  'italy':            'Italia',
  'denmark':          'Dinamarca',
  'switzerland':      'Suiza',
  'turkey':           'Turquía',
  'serbia':           'Serbia',
  'ukraine':          'Ucrania',
  'norway':           'Noruega',
  'sweden':           'Suecia',
  'ireland':          'Irlanda',
  'hungary':          'Hungría',
  'romania':          'Rumania',
  'greece':           'Grecia',
  'venezuela':        'Venezuela',
  'bolivia':          'Bolivia',
  'chile':            'Chile',
  'ecuador':          'Ecuador',
  'peru':             'Perú',
  'paraguay':         'Paraguay',
  'uruguay':          'Uruguay',
  'argentina':        'Argentina',
  'colombia':         'Colombia',
  'mexico':           'México',
  'usa':              'Estados Unidos',
  'united states':    'Estados Unidos',
  'canada':           'Canadá',
  'japan':            'Japón',
  'south korea':      'Corea del Sur',
  'korea republic':   'Corea del Sur',
  'australia':        'Australia',
  'iran':             'Irán',
  'iraq':             'Iraq',
  'qatar':            'Qatar',
  'morocco':          'Marruecos',
  'algeria':          'Argelia',
  'nigeria':          'Nigeria',
  'cameroon':         'Camerún',
  'ghana':            'Ghana',
  'ivory coast':      'Costa de Marfil',
  "cote d'ivoire":    'Costa de Marfil',
  'south africa':     'Sudáfrica',
  'tunisia':          'Túnez',
  'thailand':         'Tailandia',
  'austria':          'Austria',
  'czechia':          'Chequia',
  'czech republic':   'Chequia',
};

/**
 * Devuelve el nombre del equipo en español si existe traducción,
 * de lo contrario devuelve el nombre original.
 */
export function getTeamDisplayName(name: string): string {
  if (!name) return name;
  const key = name.toLowerCase().trim();
  return EN_TO_ES[key] ?? name;
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/\bfc\b|\bcf\b|\bcd\b|\bca\b|\bud\b|\brc\b|\brcd\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Devuelve la URL del escudo de club o bandera de selección.
 * Si no encuentra un match conocido, devuelve null (el componente
 * caerá en un avatar con inicial como fallback).
 */
export function getTeamCrestUrl(teamName: string): string | null {
  if (!teamName) return null;
  const key = normalize(teamName);

  // 1) Club de La Liga por ID api-sports
  const clubId = LALIGA_TEAM_IDS[key] ?? LALIGA_TEAM_IDS[teamName.toLowerCase()];
  if (clubId) {
    return `https://media.api-sports.io/football/teams/${clubId}.png`;
  }

  // 2) Selección nacional por ISO-2 → flagcdn
  const iso = COUNTRY_ISO2[key] ?? COUNTRY_ISO2[teamName.toLowerCase()];
  if (iso) {
    return `https://flagcdn.com/w80/${iso}.png`;
  }

  return null;
}
