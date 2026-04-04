// ============================================
// ?? FIFA API Client - Frontend Integration
// ============================================

/**
 * Tipos TypeScript para la API de FIFA
 */

export interface FifaMatchesResponse {
  Results: FifaMatch[];
}

export interface FifaMatch {
  IdMatch: string;
  IdStage: string;
  IdGroup?: string;
  StageName: LocalizedString[];
  GroupName?: LocalizedString[];
  Date: string; // ISO 8601
  LocalDate: string;
  Home: FifaTeam;
  Away: FifaTeam;
  Stadium: FifaStadium;
  MatchStatus: number; // 0=Not Started, 3=Live, 10=Finished
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  HomeTeamPenaltyScore?: number | null;
  AwayTeamPenaltyScore?: number | null;
  MatchTime?: string; // Ej: "45'+2"
  MatchNumber: number;
  ResultType?: number;
}

export interface FifaTeam {
  IdTeam: string;
  TeamName: LocalizedString[];
  PictureUrl: string;
  Abbreviation: string; // Ej: "COL", "ARG"
  IdCountry: string;
  TeamType: number;
}

export interface FifaStadium {
  IdStadium: string;
  Name: LocalizedString[];
  CityName: LocalizedString[];
  IdCountry: string;
}

export interface LocalizedString {
  Locale: string; // Ej: "es-ES", "en-GB"
  Description: string;
}

export interface FifaMatchDetailsResponse {
  IdMatch: string;
  Date: string;
  LocalDate: string;
  Home: FifaTeam;
  Away: FifaTeam;
  Stadium: FifaStadium;
  MatchStatus: number;
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  Events: FifaMatchEvent[];
  Officials: FifaOfficial[];
  Weather?: FifaWeather;
}

export interface FifaMatchEvent {
  IdEvent: string;
  Type: number;
  TypeLocalized: LocalizedString[];
  Minute: string;
  Player: LocalizedString[];
  IdPlayer: string;
  IdTeam: string;
  HomeGoals?: number;
  AwayGoals?: number;
}

export interface FifaOfficial {
  IdOfficial: string;
  OfficialName: LocalizedString[];
  OfficialType: number; // 1=Referee, 2=Assistant Referee, etc.
  IdCountry: string;
}

export interface FifaWeather {
  Temperature: string;
  Humidity: string;
  Description: LocalizedString[];
}

export interface FifaStandingsResponse {
  Results: FifaGroupStanding[];
}

export interface FifaGroupStanding {
  IdGroup: string;
  GroupName: LocalizedString[];
  GroupOrderTypeId: number;
  TeamStandings: FifaTeamStanding[];
}

export interface FifaTeamStanding {
  IdTeam: string;
  Team: FifaTeam;
  Played: number;
  Won: number;
  Lost: number;
  Drawn: number;
  For: number; // Goals for
  Against: number; // Goals against
  GoalsDiference: number;
  Points: number;
  Position: number;
}

/**
 * Cliente API para consumir endpoints de FIFA
 */
export class FifaApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper para obtener texto localizado en español (con fallback)
   */
  private getLocalizedText(localized: LocalizedString[]): string {
    if (!localized || localized.length === 0) return '';
    
    // Buscar español
    const spanish = localized.find(l => l.Locale.startsWith('es'));
    if (spanish) return spanish.Description;
    
    // Fallback a inglés
    const english = localized.find(l => l.Locale.startsWith('en'));
    if (english) return english.Description;
    
    // Fallback al primero
    return localized[0]?.Description || '';
  }

  /**
   * Obtener todos los fixtures con filtros opcionales
   */
  async getFixtures(params?: {
    country?: string;
    stage?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<FifaMatchesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.country) queryParams.append('country', params.country);
    if (params?.stage) queryParams.append('stage', params.stage.toString());
    if (params?.fromDate) queryParams.append('fromDate', params.fromDate.toISOString().split('T')[0]);
    if (params?.toDate) queryParams.append('toDate', params.toDate.toISOString().split('T')[0]);

    const url = `${this.baseUrl}/fifa/fixtures?${queryParams}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Obtener fixtures de una fecha específica
   */
  async getFixturesByDate(date: Date, country?: string): Promise<FifaMatchesResponse> {
    const dateStr = date.toISOString().split('T')[0];
    const queryParams = country ? `?country=${country}` : '';
    const url = `${this.baseUrl}/fifa/fixtures/date/${dateStr}${queryParams}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fixtures for date: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Obtener partidos en vivo
   */
  async getLiveFixtures(): Promise<FifaMatchesResponse> {
    const url = `${this.baseUrl}/fifa/fixtures/live`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch live fixtures: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Obtener detalles de un partido específico
   */
  async getMatchDetails(matchId: string): Promise<FifaMatchDetailsResponse> {
    const url = `${this.baseUrl}/fifa/match/${matchId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch match details: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Obtener tabla de posiciones
   */
  async getStandings(): Promise<FifaStandingsResponse> {
    const url = `${this.baseUrl}/fifa/standings`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch standings: ${response.statusText}`);
    }
    
    return response.json();
  }

  // ============================================
  // ?? Helper Methods para UI
  // ============================================

  /**
   * Formatear nombre de equipo en español
   */
  getTeamName(team: FifaTeam): string {
    return this.getLocalizedText(team.TeamName);
  }

  /**
   * Formatear nombre de estadio en español
   */
  getStadiumName(stadium: FifaStadium): string {
    return this.getLocalizedText(stadium.Name);
  }

  /**
   * Formatear ciudad del estadio
   */
  getCityName(stadium: FifaStadium): string {
    return this.getLocalizedText(stadium.CityName);
  }

  /**
   * Obtener estado del partido en texto
   */
  getMatchStatusText(match: FifaMatch): string {
    switch (match.MatchStatus) {
      case 0: return 'Programado';
      case 3: return 'En Vivo';
      case 10: return 'Finalizado';
      default: return 'Desconocido';
    }
  }

  /**
   * Verificar si el partido está en vivo
   */
  isLive(match: FifaMatch): boolean {
    return match.MatchStatus === 3;
  }

  /**
   * Verificar si el partido ha finalizado
   */
  isFinished(match: FifaMatch): boolean {
    return match.MatchStatus === 10;
  }

  /**
   * Formatear resultado del partido
   */
  getScoreDisplay(match: FifaMatch): string {
    if (match.HomeTeamScore === null || match.AwayTeamScore === null) {
      return 'vs';
    }
    return `${match.HomeTeamScore} - ${match.AwayTeamScore}`;
  }

  /**
   * Formatear fecha y hora local
   */
  formatMatchDate(match: FifaMatch, locale: string = 'es-CO'): string {
    return new Date(match.Date).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }
}

/**
 * Hook de React para consumir la API de FIFA
 */
import { useState, useEffect } from 'react';

export function useFifaFixtures(country?: string) {
  const [fixtures, setFixtures] = useState<FifaMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const client = new FifaApiClient();
    
    client.getFixtures({ country })
      .then(response => {
        setFixtures(response.Results || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [country]);

  return { fixtures, loading, error };
}

export function useLiveMatches(refreshInterval: number = 30000) {
  const [liveMatches, setLiveMatches] = useState<FifaMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const client = new FifaApiClient();
    
    const fetchLive = () => {
      client.getLiveFixtures()
        .then(response => {
          setLiveMatches(response.Results || []);
          setLoading(false);
        })
        .catch(err => {
          setError(err);
          setLoading(false);
        });
    };

    fetchLive(); // Initial fetch
    const interval = setInterval(fetchLive, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { liveMatches, loading, error };
}

export function useFifaStandings() {
  const [standings, setStandings] = useState<FifaGroupStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const client = new FifaApiClient();
    
    client.getStandings()
      .then(response => {
        setStandings(response.Results || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { standings, loading, error };
}

/**
 * Componente de ejemplo: Lista de fixtures
 */
export function FixturesList({ country }: { country?: string }) {
  const { fixtures, loading, error } = useFifaFixtures(country);
  const client = new FifaApiClient();

  if (loading) return <div>Cargando partidos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="fixtures-list">
      {fixtures.map(match => (
        <div key={match.IdMatch} className="match-card">
          <div className="match-header">
            <span className="match-date">
              {client.formatMatchDate(match)}
            </span>
            <span className={`match-status status-${match.MatchStatus}`}>
              {client.getMatchStatusText(match)}
            </span>
          </div>
          
          <div className="match-teams">
            <div className="team home">
              <img src={match.Home.PictureUrl} alt={match.Home.Abbreviation} />
              <span>{client.getTeamName(match.Home)}</span>
            </div>
            
            <div className="match-score">
              {client.getScoreDisplay(match)}
            </div>
            
            <div className="team away">
              <img src={match.Away.PictureUrl} alt={match.Away.Abbreviation} />
              <span>{client.getTeamName(match.Away)}</span>
            </div>
          </div>
          
          <div className="match-venue">
            ??? {client.getStadiumName(match.Stadium)}, {client.getCityName(match.Stadium)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Componente de ejemplo: Tabla de posiciones
 */
export function StandingsTable() {
  const { standings, loading, error } = useFifaStandings();
  const client = new FifaApiClient();

  if (loading) return <div>Cargando tabla...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="standings-container">
      {standings.map(group => (
        <div key={group.IdGroup} className="group-standings">
          <h3>{client.getLocalizedText(group.GroupName)}</h3>
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Equipo</th>
                <th>PJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>GF</th>
                <th>GC</th>
                <th>DIF</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {group.TeamStandings.map(team => (
                <tr key={team.IdTeam}>
                  <td>{team.Position}</td>
                  <td>
                    <img src={team.Team.PictureUrl} alt={team.Team.Abbreviation} />
                    {client.getTeamName(team.Team)}
                  </td>
                  <td>{team.Played}</td>
                  <td>{team.Won}</td>
                  <td>{team.Drawn}</td>
                  <td>{team.Lost}</td>
                  <td>{team.For}</td>
                  <td>{team.Against}</td>
                  <td>{team.GoalsDiference}</td>
                  <td><strong>{team.Points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// Exportar instancia singleton del cliente
export const fifaApi = new FifaApiClient();
