// Grupos del Mundial 2026 - Sorteo oficial FIFA (5 de diciembre de 2025)
// 48 equipos en 12 grupos de 4

export interface Team {
  name: string;
  flag: string; // emoji de bandera
}

export interface Group {
  letter: string;
  teams: Team[];
}

export const WORLD_CUP_2026_GROUPS: Group[] = [
  {
    letter: 'A',
    teams: [
      { name: 'México', flag: '🇲🇽' },
      { name: 'Sudáfrica', flag: '🇿🇦' },
      { name: 'Corea del Sur', flag: '🇰🇷' },
      { name: 'Chequia', flag: '🇨🇿' },
    ],
  },
  {
    letter: 'B',
    teams: [
      { name: 'Canadá', flag: '🇨🇦' },
      { name: 'Suiza', flag: '🇨🇭' },
      { name: 'Qatar', flag: '🇶🇦' },
      { name: 'Bosnia y Herzegovina', flag: '🇧🇦' },
    ],
  },
  {
    letter: 'C',
    teams: [
      { name: 'Brasil', flag: '🇧🇷' },
      { name: 'Marruecos', flag: '🇲🇦' },
      { name: 'Haití', flag: '🇭🇹' },
      { name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
    ],
  },
  {
    letter: 'D',
    teams: [
      { name: 'Estados Unidos', flag: '🇺🇸' },
      { name: 'Paraguay', flag: '🇵🇾' },
      { name: 'Australia', flag: '🇦🇺' },
      { name: 'Turquía', flag: '🇹🇷' },
    ],
  },
  {
    letter: 'E',
    teams: [
      { name: 'Alemania', flag: '🇩🇪' },
      { name: 'Curazao', flag: '🇨🇼' },
      { name: 'Costa de Marfil', flag: '🇨🇮' },
      { name: 'Ecuador', flag: '🇪🇨' },
    ],
  },
  {
    letter: 'F',
    teams: [
      { name: 'Países Bajos', flag: '🇳🇱' },
      { name: 'Japón', flag: '🇯🇵' },
      { name: 'Túnez', flag: '🇹🇳' },
      { name: 'Suecia', flag: '🇸🇪' },
    ],
  },
  {
    letter: 'G',
    teams: [
      { name: 'Bélgica', flag: '🇧🇪' },
      { name: 'Egipto', flag: '🇪🇬' },
      { name: 'Irán', flag: '🇮🇷' },
      { name: 'Nueva Zelanda', flag: '🇳🇿' },
    ],
  },
  {
    letter: 'H',
    teams: [
      { name: 'España', flag: '🇪🇸' },
      { name: 'Cabo Verde', flag: '🇨🇻' },
      { name: 'Arabia Saudita', flag: '🇸🇦' },
      { name: 'Uruguay', flag: '🇺🇾' },
    ],
  },
  {
    letter: 'I',
    teams: [
      { name: 'Francia', flag: '🇫🇷' },
      { name: 'Senegal', flag: '🇸🇳' },
      { name: 'Noruega', flag: '🇳🇴' },
      { name: 'Irak', flag: '🇮🇶' },
    ],
  },
  {
    letter: 'J',
    teams: [
      { name: 'Argentina', flag: '🇦🇷' },
      { name: 'Argelia', flag: '🇩🇿' },
      { name: 'Austria', flag: '🇦🇹' },
      { name: 'Jordania', flag: '🇯🇴' },
    ],
  },
  {
    letter: 'K',
    teams: [
      { name: 'Portugal', flag: '🇵🇹' },
      { name: 'Uzbekistán', flag: '🇺🇿' },
      { name: 'Colombia', flag: '🇨🇴' },
      { name: 'R.D. del Congo', flag: '🇨🇩' },
    ],
  },
  {
    letter: 'L',
    teams: [
      { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { name: 'Croacia', flag: '🇭🇷' },
      { name: 'Ghana', flag: '🇬🇭' },
      { name: 'Panamá', flag: '🇵🇦' },
    ],
  },
];

// Utilidad para obtener todos los equipos
export const ALL_TEAMS = WORLD_CUP_2026_GROUPS.flatMap((group) =>
  group.teams.map((team) => ({ ...team, group: group.letter }))
);
