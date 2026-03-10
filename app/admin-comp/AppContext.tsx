'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

export type Level = 'international' | 'national' | 'state' | 'city';
export type TournamentType = 'professional' | 'semi-pro' | 'normal';
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type Format = 'T20' | 'ODI' | '50-50' | 'Test' | 'T10';

export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  battingStyle: 'Right-hand' | 'Left-hand';
  bowlingStyle: string;
  age: number;
  team: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  players: Player[];
  captain?: string;
  viceCaptain?: string;
  logo?: string;
  homeGround?: string;
}

export interface Match {
  id: string;
  title: string;
  level: Level;
  type: TournamentType;
  format: Format;
  teamA: Team;
  teamB: Team;
  venue: string;
  date: string;
  time: string;
  status: MatchStatus;
  scoreA?: string;
  scoreB?: string;
  result?: string;
  tournament?: string;
  umpires?: string[];
  notes?: string;
  createdAt: string;
}

// Sample seed data
const seedPlayers: Player[] = [
  { id: 'p1', name: 'Rohit Sharma', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Off-break', age: 36, team: 'Mumbai XI' },
  { id: 'p2', name: 'Virat Kohli', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Medium', age: 35, team: 'Royal CC' },
  { id: 'p3', name: 'Jasprit Bumrah', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Fast', age: 30, team: 'Mumbai XI' },
  { id: 'p4', name: 'Ravindra Jadeja', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm', age: 35, team: 'Royal CC' },
  { id: 'p5', name: 'KL Rahul', role: 'Wicket-keeper', battingStyle: 'Right-hand', bowlingStyle: 'None', age: 32, team: 'Punjab Kings' },
  { id: 'p6', name: 'Shubman Gill', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Off-break', age: 24, team: 'Gujarat T' },
  { id: 'p7', name: 'Mohammed Siraj', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium', age: 30, team: 'Royal CC' },
  { id: 'p8', name: 'Hardik Pandya', role: 'All-rounder', battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium', age: 30, team: 'Mumbai XI' },
  { id: 'p9', name: 'Suryakumar Yadav', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Off-break', age: 33, team: 'Mumbai XI' },
  { id: 'p10', name: 'Rishabh Pant', role: 'Wicket-keeper', battingStyle: 'Left-hand', bowlingStyle: 'None', age: 26, team: 'Delhi CC' },
  { id: 'p11', name: 'Axar Patel', role: 'All-rounder', battingStyle: 'Left-hand', bowlingStyle: 'Slow left-arm', age: 30, team: 'Delhi CC' },
  { id: 'p12', name: 'Yuzvendra Chahal', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin', age: 33, team: 'Punjab Kings' },
];

const seedTeams: Team[] = [
  {
    id: 't1', name: 'Mumbai Strikers XI', shortName: 'MSX', color: '#3b82f6',
    homeGround: 'Wankhede Stadium',
    captain: 'p1', viceCaptain: 'p3',
    players: [seedPlayers[0], seedPlayers[2], seedPlayers[7], seedPlayers[8]],
  },
  {
    id: 't2', name: 'Royal Challengers CC', shortName: 'RCC', color: '#ef4444',
    homeGround: 'Chinnaswamy Stadium',
    captain: 'p2', viceCaptain: 'p4',
    players: [seedPlayers[1], seedPlayers[3], seedPlayers[6]],
  },
  {
    id: 't3', name: 'Delhi Thunder', shortName: 'DTH', color: '#8b5cf6',
    homeGround: 'Arun Jaitley Stadium',
    captain: 'p10', viceCaptain: 'p11',
    players: [seedPlayers[9], seedPlayers[10]],
  },
  {
    id: 't4', name: 'Punjab Kings', shortName: 'PKS', color: '#f97316',
    homeGround: 'PCA Stadium',
    captain: 'p5', viceCaptain: 'p12',
    players: [seedPlayers[4], seedPlayers[11]],
  },
];

const seedMatches: Match[] = [
  {
    id: 'm1', title: 'MSX vs RCC – Final',
    level: 'national', type: 'professional', format: 'T10',
    teamA: seedTeams[0], teamB: seedTeams[1],
    venue: 'Wankhede Stadium, Mumbai', date: '2025-06-15', time: '19:30',
    status: 'live', scoreA: '0/0 ', scoreB: '0/0 ',
    tournament: 'Zilla Premier League 2025',
    umpires: ['Anil Kumar', 'Ravi Shastri'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm2', title: 'DTH vs PKS – Semi Final',
    level: 'state', type: 'semi-pro', format: 'ODI',
    teamA: seedTeams[2], teamB: seedTeams[3],
    venue: 'Arun Jaitley Stadium, Delhi', date: '2025-06-20', time: '14:00',
    status: 'upcoming',
    tournament: 'Zilla Cup 2025',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm3', title: 'RCC vs DTH – League Match',
    level: 'city', type: 'normal', format: 'T10',
    teamA: seedTeams[1], teamB: seedTeams[2],
    venue: 'Chinnaswamy Stadium', date: '2025-06-10', time: '10:00',
    status: 'completed', scoreA: '98/3 (10)', scoreB: '94/7 (10)',
    result: 'Royal Challengers CC won by 4 runs',
    createdAt: new Date().toISOString(),
  },
];

interface AppState {
  matches: Match[];
  teams: Team[];
  players: Player[];
  sidebarOpen: boolean;
  activePage: string;
  editingMatch: Match | null;
  scoringMatch: Match | null;   // ← the match currently being scored in BCL Scorer
}

interface AppContextType extends AppState {
  addMatch: (match: Match) => void;
  updateMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addPlayer: (player: Player) => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
  setEditingMatch: (match: Match | null) => void;
  setScoringMatch: (match: Match | null) => void;  // ← launch scorer for a specific match
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>(seedMatches);
  const [teams, setTeams] = useState<Team[]>(seedTeams);
  const [players, setPlayers] = useState<Player[]>(seedPlayers);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);  // ← new

  const addMatch = useCallback((match: Match) => {
    setMatches(prev => [match, ...prev]);
  }, []);

  const updateMatch = useCallback((match: Match) => {
    setMatches(prev => prev.map(m => m.id === match.id ? match : m));
    // Keep scoringMatch in sync so the scorer always has fresh match data
    setScoringMatch(prev => prev?.id === match.id ? match : prev);
  }, []);

  const deleteMatch = useCallback((id: string) => {
    setMatches(prev => prev.filter(m => m.id !== id));
    // Clear scorer if the deleted match was being scored
    setScoringMatch(prev => prev?.id === id ? null : prev);
  }, []);

  const addTeam = useCallback((team: Team) => {
    setTeams(prev => [team, ...prev]);
  }, []);

  const updateTeam = useCallback((team: Team) => {
    setTeams(prev => prev.map(t => t.id === team.id ? team : t));
  }, []);

  const deleteTeam = useCallback((id: string) => {
    setTeams(prev => prev.filter(t => t.id !== id));
  }, []);

  const addPlayer = useCallback((player: Player) => {
    setPlayers(prev => [player, ...prev]);
  }, []);

  return (
    <AppContext.Provider value={{
      matches, teams, players,
      sidebarOpen, activePage, editingMatch, scoringMatch,
      addMatch, updateMatch, deleteMatch,
      addTeam, updateTeam, deleteTeam, addPlayer,
      setSidebarOpen, setActivePage, setEditingMatch, setScoringMatch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}