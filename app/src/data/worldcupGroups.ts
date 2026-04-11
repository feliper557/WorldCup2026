// Grupos del Mundial 2026 - Sorteo oficial FIFA (5 de diciembre de 2025)
// 48 equipos en 12 grupos de 4

export interface Team {
  name: string;
  flag: string; // emoji de bandera (fallback)
  code: string; // ISO 3166-1 alpha-2 para flagcdn.com
}

export interface Group {
  letter: string;
  teams: Team[];
}

export const WORLD_CUP_2026_GROUPS: Group[] = [
  {
    letter: 'A',
    teams: [
      { name: 'México', flag: '🇲🇽', code: 'mx' },
      { name: 'Sudáfrica', flag: '🇿🇦', code: 'za' },
      { name: 'Corea del Sur', flag: '🇰🇷', code: 'kr' },
      { name: 'Chequia', flag: '🇨🇿', code: 'cz' },
    ],
  },
  {
    letter: 'B',
    teams: [
      { name: 'Canadá', flag: '🇨🇦', code: 'ca' },
      { name: 'Suiza', flag: '🇨🇭', code: 'ch' },
      { name: 'Qatar', flag: '🇶🇦', code: 'qa' },
      { name: 'Bosnia y Herzegovina', flag: '🇧🇦', code: 'ba' },
    ],
  },
  {
    letter: 'C',
    teams: [
      { name: 'Brasil', flag: '🇧🇷', code: 'br' },
      { name: 'Marruecos', flag: '🇲🇦', code: 'ma' },
      { name: 'Haití', flag: '🇭🇹', code: 'ht' },
      { name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'gb-sct' },
    ],
  },
  {
    letter: 'D',
    teams: [
      { name: 'Estados Unidos', flag: '🇺🇸', code: 'us' },
      { name: 'Paraguay', flag: '🇵🇾', code: 'py' },
      { name: 'Australia', flag: '🇦🇺', code: 'au' },
      { name: 'Turquía', flag: '🇹🇷', code: 'tr' },
    ],
  },
  {
    letter: 'E',
    teams: [
      { name: 'Alemania', flag: '🇩🇪', code: 'de' },
      { name: 'Curazao', flag: '🇨🇼', code: 'cw' },
      { name: 'Costa de Marfil', flag: '🇨🇮', code: 'ci' },
      { name: 'Ecuador', flag: '🇪🇨', code: 'ec' },
    ],
  },
  {
    letter: 'F',
    teams: [
      { name: 'Países Bajos', flag: '🇳🇱', code: 'nl' },
      { name: 'Japón', flag: '🇯🇵', code: 'jp' },
      { name: 'Túnez', flag: '🇹🇳', code: 'tn' },
      { name: 'Suecia', flag: '🇸🇪', code: 'se' },
    ],
  },
  {
    letter: 'G',
    teams: [
      { name: 'Bélgica', flag: '🇧🇪', code: 'be' },
      { name: 'Egipto', flag: '🇪🇬', code: 'eg' },
      { name: 'Irán', flag: '🇮🇷', code: 'ir' },
      { name: 'Nueva Zelanda', flag: '🇳🇿', code: 'nz' },
    ],
  },
  {
    letter: 'H',
    teams: [
      { name: 'España', flag: '🇪🇸', code: 'es' },
      { name: 'Cabo Verde', flag: '🇨🇻', code: 'cv' },
      { name: 'Arabia Saudita', flag: '🇸🇦', code: 'sa' },
      { name: 'Uruguay', flag: '🇺🇾', code: 'uy' },
    ],
  },
  {
    letter: 'I',
    teams: [
      { name: 'Francia', flag: '🇫🇷', code: 'fr' },
      { name: 'Senegal', flag: '🇸🇳', code: 'sn' },
      { name: 'Noruega', flag: '🇳🇴', code: 'no' },
      { name: 'Irak', flag: '🇮🇶', code: 'iq' },
    ],
  },
  {
    letter: 'J',
    teams: [
      { name: 'Argentina', flag: '🇦🇷', code: 'ar' },
      { name: 'Argelia', flag: '🇩🇿', code: 'dz' },
      { name: 'Austria', flag: '🇦🇹', code: 'at' },
      { name: 'Jordania', flag: '🇯🇴', code: 'jo' },
    ],
  },
  {
    letter: 'K',
    teams: [
      { name: 'Portugal', flag: '🇵🇹', code: 'pt' },
      { name: 'Uzbekistán', flag: '🇺🇿', code: 'uz' },
      { name: 'Colombia', flag: '🇨🇴', code: 'co' },
      { name: 'R.D. del Congo', flag: '🇨🇩', code: 'cd' },
    ],
  },
  {
    letter: 'L',
    teams: [
      { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'gb-eng' },
      { name: 'Croacia', flag: '🇭🇷', code: 'hr' },
      { name: 'Ghana', flag: '🇬🇭', code: 'gh' },
      { name: 'Panamá', flag: '🇵🇦', code: 'pa' },
    ],
  },
];

// Utilidad para obtener todos los equipos
export const ALL_TEAMS = WORLD_CUP_2026_GROUPS.flatMap((group) =>
  group.teams.map((team) => ({ ...team, group: group.letter }))
);
