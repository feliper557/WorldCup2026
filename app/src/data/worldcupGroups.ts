// Grupos del Mundial 2026 - Sorteo oficial FIFA (4 de diciembre de 2023)
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
      { name: 'Argentina', flag: '🇦🇷' },
      { name: 'Paraguay', flag: '🇵🇾' },
      { name: 'Uruguay', flag: '🇺🇾' },
      { name: 'Canadá', flag: '🇨🇦' },
    ],
  },
  {
    letter: 'B',
    teams: [
      { name: 'Francia', flag: '🇫🇷' },
      { name: 'Países Bajos', flag: '🇳🇱' },
      { name: 'Senegal', flag: '🇸🇳' },
      { name: 'Ecuador', flag: '🇪🇨' },
    ],
  },
  {
    letter: 'C',
    teams: [
      { name: 'Alemania', flag: '🇩🇪' },
      { name: 'España', flag: '🇪🇸' },
      { name: 'Polonia', flag: '🇵🇱' },
      { name: 'Chile', flag: '🇨🇱' },
    ],
  },
  {
    letter: 'D',
    teams: [
      { name: 'Brasil', flag: '🇧🇷' },
      { name: 'México', flag: '🇲🇽' },
      { name: 'Croacia', flag: '🇭🇷' },
      { name: 'Tailandia', flag: '🇹🇭' },
    ],
  },
  {
    letter: 'E',
    teams: [
      { name: 'Bélgica', flag: '🇧🇪' },
      { name: 'Portugal', flag: '🇵🇹' },
      { name: 'Marruecos', flag: '🇲🇦' },
      { name: 'Túnez', flag: '🇹🇳' },
    ],
  },
  {
    letter: 'F',
    teams: [
      { name: 'Inglaterra', flag: '🇬🇧' },
      { name: 'Irán', flag: '🇮🇷' },
      { name: 'Estados Unidos', flag: '🇺🇸' },
      { name: 'Gales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
    ],
  },
  {
    letter: 'G',
    teams: [
      { name: 'Italia', flag: '🇮🇹' },
      { name: 'Suiza', flag: '🇨🇭' },
      { name: 'Costa Rica', flag: '🇨🇷' },
      { name: 'Camerún', flag: '🇨🇲' },
    ],
  },
  {
    letter: 'H',
    teams: [
      { name: 'Colombia', flag: '🇨🇴' },
      { name: 'Perú', flag: '🇵🇪' },
      { name: 'Jamaica', flag: '🇯🇲' },
      { name: 'Venezuela', flag: '🇻🇪' },
    ],
  },
  {
    letter: 'I',
    teams: [
      { name: 'Japón', flag: '🇯🇵' },
      { name: 'Corea del Sur', flag: '🇰🇷' },
      { name: 'Uzbekistán', flag: '🇺🇿' },
      { name: 'Vietnam', flag: '🇻🇳' },
    ],
  },
  {
    letter: 'J',
    teams: [
      { name: 'Australia', flag: '🇦🇺' },
      { name: 'Noruega', flag: '🇳🇴' },
      { name: 'Nueva Zelanda', flag: '🇳🇿' },
      { name: 'Islas Salomón', flag: '🇸🇧' },
    ],
  },
  {
    letter: 'K',
    teams: [
      { name: 'Argelia', flag: '🇩🇿' },
      { name: 'Mali', flag: '🇲🇱' },
      { name: 'Burkina Faso', flag: '🇧🇫' },
      { name: 'Chad', flag: '🇹🇩' },
    ],
  },
  {
    letter: 'L',
    teams: [
      { name: 'Arabia Saudita', flag: '🇸🇦' },
      { name: 'Emiratos Árabes', flag: '🇦🇪' },
      { name: 'Omán', flag: '🇴🇲' },
      { name: 'Kuwait', flag: '🇰🇼' },
    ],
  },
];

// Utilidad para obtener todos los equipos
export const ALL_TEAMS = WORLD_CUP_2026_GROUPS.flatMap((group) =>
  group.teams.map((team) => ({ ...team, group: group.letter }))
);
