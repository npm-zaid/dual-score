'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

// ── BCL Scoring State (persisted in context so navigation doesn't reset it) ──
export interface BallEvent {
  over: number;          // 0-indexed over number
  ball: number;          // 1-indexed ball in over
  batterRuns: number;    // runs scored by batter this ball
  bowlerPoints: number;  // points earned by bowler this ball (wicket=5, dot=1, etc.)
  isWicket: boolean;
  isWide: boolean;
  isNoBall: boolean;
  isDot: boolean;
  label: string;         // display label: "W", "6", "0", "4", etc.
  batterName: string;
  bowlerName: string;
}

export interface InningsState {
  battingTeamId: string;
  bowlingTeamId: string;
  runs: number;
  wickets: number;
  balls: number;         // total legal balls bowled
  events: BallEvent[];
  completed: boolean;
  target?: number;       // set after 1st innings
}

export interface BCLScoringState {
  matchId: string;
  currentInnings: 1 | 2;
  innings1: InningsState | null;
  innings2: InningsState | null;
  // Current ball selections
  currentBatterId: string;
  currentBowlerId: string;
  matchStarted: boolean;
  matchFinished: boolean;
  resultText: string;
}

export type Level = 'international' | 'national' | 'state' | 'city';
export type TournamentType = 'professional' | 'semi-professional' | 'entertainment';
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type Format = 'T2' | 'T11';  // 2 overs or 11 overs
export type TeamCategory = 'international' | 'national' | 'state' | 'city';

export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  battingStyle: 'Right-hand' | 'Left-hand';
  bowlingStyle: string;
  age: number;
  team: string;
  // Career history
  tournamentsPlayed?: string[];   // tournament IDs
  matchesPlayed?: string[];       // match IDs
  teamsPlayedFor?: string[];      // team IDs
  stats?: {
    totalRuns: number;
    totalBalls: number;
    totalWickets: number;
    totalMatches: number;
    highScore: number;
    bestBowling: string;
  };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  category: TeamCategory;
  players: Player[];
  captain?: string;
  viceCaptain?: string;
  logo?: string;
  homeGround?: string;
  country?: string;
  state?: string;
  city?: string;
}

export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  level: Level;
  type: TournamentType;
  format: Format;
  teams: string[];           // team IDs participating
  startDate: string;
  endDate: string;
  venue?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  logo?: string;
  description?: string;
  prizePool?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  title: string;
  tournamentId?: string;     // link to tournament
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
  umpires?: string[];
  notes?: string;
  createdAt: string;
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const seedPlayers: Player[] = [
  // ── INDIA (team1) ── 11 players
  { id: 'p1',  name: 'Rohit Sharma',      role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'Off-break',    age: 36, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 3450, totalBalls: 2800, totalWickets: 8,  totalMatches: 42, highScore: 118, bestBowling: '2/15' } },
  { id: 'p2',  name: 'Shubman Gill',      role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'None',         age: 24, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 2100, totalBalls: 1700, totalWickets: 0,  totalMatches: 28, highScore: 102, bestBowling: '—'    } },
  { id: 'p3',  name: 'Virat Kohli',       role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'Medium',       age: 35, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 4200, totalBalls: 3200, totalWickets: 4,  totalMatches: 50, highScore: 122, bestBowling: '1/8'  } },
  { id: 'p4',  name: 'Suryakumar Yadav', role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'None',         age: 33, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 2800, totalBalls: 1900, totalWickets: 0,  totalMatches: 36, highScore: 117, bestBowling: '—'    } },
  { id: 'p5',  name: 'Hardik Pandya',     role: 'All-rounder',    battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',  age: 30, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 1800, totalBalls: 1400, totalWickets: 38, totalMatches: 42, highScore: 76,  bestBowling: '3/18' } },
  { id: 'p6',  name: 'Rishabh Pant',      role: 'Wicket-keeper',  battingStyle: 'Left-hand',  bowlingStyle: 'None',         age: 26, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 1600, totalBalls: 1200, totalWickets: 0,  totalMatches: 32, highScore: 88,  bestBowling: '—'    } },
  { id: 'p7',  name: 'Ravindra Jadeja',   role: 'All-rounder',    battingStyle: 'Left-hand',  bowlingStyle: 'Slow left-arm',age: 35, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 1400, totalBalls: 1300, totalWickets: 55, totalMatches: 45, highScore: 62,  bestBowling: '5/31' } },
  { id: 'p8',  name: 'Axar Patel',        role: 'All-rounder',    battingStyle: 'Left-hand',  bowlingStyle: 'Slow left-arm',age: 30, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 800,  totalBalls: 900,  totalWickets: 42, totalMatches: 38, highScore: 44,  bestBowling: '4/22' } },
  { id: 'p9',  name: 'Jasprit Bumrah',    role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast',         age: 30, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 120,  totalBalls: 180,  totalWickets: 68, totalMatches: 42, highScore: 12,  bestBowling: '5/27' } },
  { id: 'p10', name: 'Mohammed Siraj',    role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',  age: 30, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 90,   totalBalls: 130,  totalWickets: 48, totalMatches: 35, highScore: 9,   bestBowling: '6/21' } },
  { id: 'p11', name: 'Yuzvendra Chahal',  role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 33, team: 'India',     tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 60,   totalBalls: 80,   totalWickets: 62, totalMatches: 40, highScore: 8,   bestBowling: '6/25' } },

  // ── PAKISTAN (team2) ── 11 players
  { id: 'p12', name: 'Babar Azam',        role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'None',         age: 29, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 3800, totalBalls: 3000, totalWickets: 0,  totalMatches: 45, highScore: 115, bestBowling: '—'    } },
  { id: 'p13', name: 'Mohammad Rizwan',   role: 'Wicket-keeper',  battingStyle: 'Right-hand', bowlingStyle: 'None',         age: 31, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 2900, totalBalls: 2300, totalWickets: 0,  totalMatches: 40, highScore: 104, bestBowling: '—'    } },
  { id: 'p14', name: 'Fakhar Zaman',      role: 'Batsman',        battingStyle: 'Left-hand',  bowlingStyle: 'None',         age: 33, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 2400, totalBalls: 1900, totalWickets: 0,  totalMatches: 32, highScore: 138, bestBowling: '—'    } },
  { id: 'p15', name: 'Agha Salman',       role: 'All-rounder',    battingStyle: 'Right-hand', bowlingStyle: 'Off-break',    age: 29, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 800,  totalBalls: 720,  totalWickets: 22, totalMatches: 28, highScore: 58,  bestBowling: '3/18' } },
  { id: 'p16', name: 'Shadab Khan',       role: 'All-rounder',    battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 25, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 900,  totalBalls: 850,  totalWickets: 48, totalMatches: 38, highScore: 52,  bestBowling: '4/28' } },
  { id: 'p17', name: 'Imad Wasim',        role: 'All-rounder',    battingStyle: 'Left-hand',  bowlingStyle: 'Slow left-arm',age: 35, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 700,  totalBalls: 780,  totalWickets: 35, totalMatches: 34, highScore: 49,  bestBowling: '5/14' } },
  { id: 'p18', name: 'Shaheen Afridi',    role: 'Bowler',         battingStyle: 'Left-hand',  bowlingStyle: 'Fast',         age: 24, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 80,   totalBalls: 110,  totalWickets: 52, totalMatches: 35, highScore: 10,  bestBowling: '6/35' } },
  { id: 'p19', name: 'Haris Rauf',        role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast',         age: 30, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 60,   totalBalls: 90,   totalWickets: 44, totalMatches: 32, highScore: 7,   bestBowling: '4/22' } },
  { id: 'p20', name: 'Naseem Shah',       role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast',         age: 21, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 50,   totalBalls: 70,   totalWickets: 38, totalMatches: 28, highScore: 6,   bestBowling: '5/18' } },
  { id: 'p21', name: 'Usama Mir',         role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 29, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 45,   totalBalls: 60,   totalWickets: 30, totalMatches: 22, highScore: 5,   bestBowling: '4/29' } },
  { id: 'p22', name: 'Abrar Ahmed',       role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 25, team: 'Pakistan',  tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 30,   totalBalls: 45,   totalWickets: 25, totalMatches: 18, highScore: 4,   bestBowling: '4/33' } },

  // ── AUSTRALIA (team3) ── 11 players
  { id: 'p23', name: 'Travis Head',       role: 'Batsman',        battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',    age: 30, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 2200, totalBalls: 1700, totalWickets: 5,  totalMatches: 34, highScore: 109, bestBowling: '1/8'  } },
  { id: 'p24', name: 'David Warner',      role: 'Batsman',        battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',    age: 37, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 3200, totalBalls: 2400, totalWickets: 2,  totalMatches: 40, highScore: 107, bestBowling: '1/12' } },
  { id: 'p25', name: 'Steve Smith',       role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 34, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 3600, totalBalls: 3100, totalWickets: 18, totalMatches: 45, highScore: 113, bestBowling: '2/16' } },
  { id: 'p26', name: 'Marnus Labuschagne',role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 29, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 1800, totalBalls: 1600, totalWickets: 8,  totalMatches: 28, highScore: 88,  bestBowling: '2/22' } },
  { id: 'p27', name: 'Glenn Maxwell',     role: 'All-rounder',    battingStyle: 'Right-hand', bowlingStyle: 'Off-break',    age: 35, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 2100, totalBalls: 1600, totalWickets: 30, totalMatches: 40, highScore: 201, bestBowling: '3/26' } },
  { id: 'p28', name: 'Matthew Wade',      role: 'Wicket-keeper',  battingStyle: 'Left-hand',  bowlingStyle: 'None',         age: 36, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 1400, totalBalls: 1100, totalWickets: 0,  totalMatches: 36, highScore: 80,  bestBowling: '—'    } },
  { id: 'p29', name: 'Pat Cummins',       role: 'All-rounder',    battingStyle: 'Right-hand', bowlingStyle: 'Fast',         age: 31, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 420,  totalBalls: 520,  totalWickets: 45, totalMatches: 38, highScore: 48,  bestBowling: '4/21' } },
  { id: 'p30', name: 'Mitchell Starc',    role: 'Bowler',         battingStyle: 'Left-hand',  bowlingStyle: 'Fast',         age: 34, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 150,  totalBalls: 200,  totalWickets: 58, totalMatches: 42, highScore: 22,  bestBowling: '6/28' } },
  { id: 'p31', name: 'Josh Hazlewood',    role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',  age: 33, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 100,  totalBalls: 140,  totalWickets: 50, totalMatches: 38, highScore: 15,  bestBowling: '5/30' } },
  { id: 'p32', name: 'Adam Zampa',        role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 31, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 80,   totalBalls: 110,  totalWickets: 55, totalMatches: 40, highScore: 10,  bestBowling: '5/35' } },
  { id: 'p33', name: 'Marcus Stoinis',    role: 'All-rounder',    battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',  age: 34, team: 'Australia', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 1200, totalBalls: 1000, totalWickets: 28, totalMatches: 32, highScore: 72,  bestBowling: '3/24' } },

  // ── ENGLAND (team4) ── 11 players
  { id: 'p34', name: 'Jos Buttler',       role: 'Wicket-keeper',  battingStyle: 'Right-hand', bowlingStyle: 'None',         age: 34, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 2800, totalBalls: 2100, totalWickets: 0,  totalMatches: 38, highScore: 101, bestBowling: '—'    } },
  { id: 'p35', name: 'Phil Salt',         role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'None',         age: 27, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 1400, totalBalls: 1000, totalWickets: 0,  totalMatches: 24, highScore: 87,  bestBowling: '—'    } },
  { id: 'p36', name: 'Dawid Malan',       role: 'Batsman',        battingStyle: 'Left-hand',  bowlingStyle: 'Leg-spin',     age: 36, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 2100, totalBalls: 1800, totalWickets: 4,  totalMatches: 32, highScore: 119, bestBowling: '1/14' } },
  { id: 'p37', name: 'Ben Stokes',        role: 'All-rounder',    battingStyle: 'Left-hand',  bowlingStyle: 'Fast-medium',  age: 33, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 2200, totalBalls: 1900, totalWickets: 42, totalMatches: 40, highScore: 99,  bestBowling: '4/30' } },
  { id: 'p38', name: 'Liam Livingstone',  role: 'All-rounder',    battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 31, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 1600, totalBalls: 1100, totalWickets: 25, totalMatches: 30, highScore: 94,  bestBowling: '3/17' } },
  { id: 'p39', name: 'Moeen Ali',         role: 'All-rounder',    battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',    age: 36, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 1500, totalBalls: 1400, totalWickets: 38, totalMatches: 38, highScore: 72,  bestBowling: '5/23' } },
  { id: 'p40', name: 'Sam Curran',        role: 'All-rounder',    battingStyle: 'Left-hand',  bowlingStyle: 'Fast-medium',  age: 25, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 900,  totalBalls: 900,  totalWickets: 34, totalMatches: 30, highScore: 65,  bestBowling: '5/10' } },
  { id: 'p41', name: 'Mark Wood',         role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast',         age: 34, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 110,  totalBalls: 160,  totalWickets: 48, totalMatches: 32, highScore: 14,  bestBowling: '5/34' } },
  { id: 'p42', name: 'Jofra Archer',      role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast',         age: 29, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 80,   totalBalls: 110,  totalWickets: 40, totalMatches: 26, highScore: 11,  bestBowling: '4/29' } },
  { id: 'p43', name: 'Adil Rashid',       role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',     age: 36, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 180,  totalBalls: 250,  totalWickets: 52, totalMatches: 38, highScore: 28,  bestBowling: '4/23' } },
  { id: 'p44', name: 'Chris Jordan',      role: 'Bowler',         battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',  age: 35, team: 'England',   tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 100,  totalBalls: 140,  totalWickets: 36, totalMatches: 28, highScore: 18,  bestBowling: '4/6'  } },

  // ── NATIONAL teams ──
  { id: 'p45', name: 'Yashasvi Jaiswal',  role: 'Batsman',        battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',    age: 22, team: 'Mumbai Strikers', tournamentsPlayed: ['t2'], matchesPlayed: [], teamsPlayedFor: ['team5'], stats: { totalRuns: 820,  totalBalls: 680,  totalWickets: 3,  totalMatches: 18, highScore: 68,  bestBowling: '1/10' } },
  { id: 'p46', name: 'Ruturaj Gaikwad',   role: 'Batsman',        battingStyle: 'Right-hand', bowlingStyle: 'Off-break',    age: 27, team: 'Pune Lions',      tournamentsPlayed: ['t2'], matchesPlayed: [], teamsPlayedFor: ['team6'], stats: { totalRuns: 950,  totalBalls: 780,  totalWickets: 2,  totalMatches: 20, highScore: 79,  bestBowling: '1/14' } },
];

const seedTeams: Team[] = [
  { id: 'team1', name: 'India',           shortName: 'IND', color: '#3b82f6', category: 'international', homeGround: 'Wankhede Stadium', country: 'India',     captain: 'p1',  viceCaptain: 'p3',  players: seedPlayers.slice(0, 11) },   // p1–p11
  { id: 'team2', name: 'Pakistan',        shortName: 'PAK', color: '#22c55e', category: 'international', homeGround: 'Gaddafi Stadium',  country: 'Pakistan',  captain: 'p12', viceCaptain: 'p13', players: seedPlayers.slice(11, 22) }, // p12–p22
  { id: 'team3', name: 'Australia',       shortName: 'AUS', color: '#f97316', category: 'international', homeGround: 'MCG',              country: 'Australia', captain: 'p29', viceCaptain: 'p23', players: seedPlayers.slice(22, 33) }, // p23–p33
  { id: 'team4', name: 'England',         shortName: 'ENG', color: '#ef4444', category: 'international', homeGround: 'Lords',            country: 'England',   captain: 'p34', viceCaptain: 'p37', players: seedPlayers.slice(33, 44) }, // p34–p44
  { id: 'team5', name: 'Mumbai Strikers', shortName: 'MSX', color: '#8b5cf6', category: 'national',       homeGround: 'DY Patil Stadium', state: 'Maharashtra', captain: 'p45', players: [seedPlayers[44]] },
  { id: 'team6', name: 'Pune Lions',      shortName: 'PLI', color: '#eab308', category: 'national',       homeGround: 'MCA Stadium',      state: 'Maharashtra', players: [seedPlayers[45]] },
];

const seedTournaments: Tournament[] = [
  {
    id: 't1', name: 'ICC T2 World Cup 2025', shortName: 'T2WC', level: 'international', type: 'professional', format: 'T2',
    teams: ['team1', 'team2', 'team3', 'team4'], startDate: '2025-06-01', endDate: '2025-06-30',
    venue: 'Multiple Venues', status: 'ongoing', description: 'The biggest 2-over cricket tournament on Earth',
    prizePool: '$2.5M', createdAt: new Date().toISOString(),
  },
  {
    id: 't2', name: 'National Premier League', shortName: 'NPL', level: 'national', type: 'professional', format: 'T11',
    teams: ['team5', 'team6'], startDate: '2025-07-10', endDate: '2025-08-15',
    venue: 'Mumbai', status: 'upcoming', description: 'Top national 11-over competition', prizePool: '$500K',
    createdAt: new Date().toISOString(),
  },
];

const seedMatches: Match[] = [
  {
    id: 'm1', title: 'IND vs PAK – Super 8',
    tournamentId: 't1',
    level: 'international', type: 'professional', format: 'T2',
    teamA: seedTeams[0], teamB: seedTeams[1],
    venue: 'Wankhede Stadium, Mumbai', date: '2025-06-15', time: '19:30',
    status: 'live', scoreA: '48/2', scoreB: '31/4',
    umpires: ['Anil Kumar', 'Ravi Shastri'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm2', title: 'AUS vs ENG – Group Stage',
    tournamentId: 't1',
    level: 'international', type: 'professional', format: 'T2',
    teamA: seedTeams[2], teamB: seedTeams[3],
    venue: 'Lords, London', date: '2025-06-20', time: '14:00',
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm3', title: 'MSX vs PLI – Match 1',
    tournamentId: 't2',
    level: 'national', type: 'professional', format: 'T11',
    teamA: seedTeams[4], teamB: seedTeams[5],
    venue: 'DY Patil Stadium', date: '2025-07-12', time: '18:00',
    status: 'completed', scoreA: '112/5 (11)', scoreB: '98/8 (11)',
    result: 'Mumbai Strikers won by 14 runs',
    createdAt: new Date().toISOString(),
  },
];

// ── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  matches: Match[];
  teams: Team[];
  players: Player[];
  tournaments: Tournament[];
  sidebarOpen: boolean;
  activePage: string;
  editingMatch: Match | null;
  scoringMatch: Match | null;
  editingTournament: Tournament | null;

  addMatch: (match: Match) => void;
  updateMatch: (match: Match) => void;
  deleteMatch: (id: string) => void;

  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;

  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;

  addTournament: (tournament: Tournament) => void;
  updateTournament: (tournament: Tournament) => void;
  deleteTournament: (id: string) => void;

  bclScoringState: BCLScoringState | null;
  setBclScoringState: (state: BCLScoringState | null) => void;

  setSidebarOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
  setEditingMatch: (match: Match | null) => void;
  setScoringMatch: (match: Match | null) => void;
  setEditingTournament: (tournament: Tournament | null) => void;

  getTeamsByLevel: (level: Level) => Team[];
  getTournamentById: (id: string) => Tournament | undefined;
  getMatchesByTournament: (tournamentId: string) => Match[];
  getPlayerHistory: (playerId: string) => { tournaments: Tournament[]; matches: Match[]; teams: Team[] };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [matches, setMatches] = useState<Match[]>(seedMatches);
  const [teams, setTeams] = useState<Team[]>(seedTeams);
  const [players, setPlayers] = useState<Player[]>(seedPlayers);
  const [tournaments, setTournaments] = useState<Tournament[]>(seedTournaments);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [bclScoringState, setBclScoringState] = useState<BCLScoringState | null>(null);

  const addMatch = useCallback((match: Match) => setMatches(prev => [match, ...prev]), []);
  const updateMatch = useCallback((match: Match) => {
    setMatches(prev => prev.map(m => m.id === match.id ? match : m));
    setScoringMatch(prev => prev?.id === match.id ? match : prev);
  }, []);
  const deleteMatch = useCallback((id: string) => {
    setMatches(prev => prev.filter(m => m.id !== id));
    setScoringMatch(prev => prev?.id === id ? null : prev);
  }, []);

  const addTeam = useCallback((team: Team) => setTeams(prev => [team, ...prev]), []);
  const updateTeam = useCallback((team: Team) => setTeams(prev => prev.map(t => t.id === team.id ? team : t)), []);
  const deleteTeam = useCallback((id: string) => setTeams(prev => prev.filter(t => t.id !== id)), []);

  const addPlayer = useCallback((player: Player) => setPlayers(prev => [player, ...prev]), []);
  const updatePlayer = useCallback((player: Player) => setPlayers(prev => prev.map(p => p.id === player.id ? player : p)), []);

  const addTournament = useCallback((tournament: Tournament) => setTournaments(prev => [tournament, ...prev]), []);
  const updateTournament = useCallback((tournament: Tournament) => setTournaments(prev => prev.map(t => t.id === tournament.id ? tournament : t)), []);
  const deleteTournament = useCallback((id: string) => setTournaments(prev => prev.filter(t => t.id !== id)), []);

  const getTeamsByLevel = useCallback((level: Level) => teams.filter(t => t.category === level), [teams]);
  const getTournamentById = useCallback((id: string) => tournaments.find(t => t.id === id), [tournaments]);
  const getMatchesByTournament = useCallback((tournamentId: string) => matches.filter(m => m.tournamentId === tournamentId), [matches]);

  const getPlayerHistory = useCallback((playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { tournaments: [], matches: [], teams: [] };
    const playerTournaments = tournaments.filter(t => player.tournamentsPlayed?.includes(t.id));
    const playerMatches = matches.filter(m => player.matchesPlayed?.includes(m.id));
    const playerTeams = teams.filter(t => player.teamsPlayedFor?.includes(t.id));
    return { tournaments: playerTournaments, matches: playerMatches, teams: playerTeams };
  }, [players, tournaments, matches, teams]);

  return (
    <AppContext.Provider value={{
      matches, teams, players, tournaments,
      sidebarOpen, activePage, editingMatch, scoringMatch, editingTournament,
      bclScoringState, setBclScoringState,
      addMatch, updateMatch, deleteMatch,
      addTeam, updateTeam, deleteTeam,
      addPlayer, updatePlayer,
      addTournament, updateTournament, deleteTournament,
      setSidebarOpen, setActivePage, setEditingMatch, setScoringMatch, setEditingTournament,
      getTeamsByLevel, getTournamentById, getMatchesByTournament, getPlayerHistory,
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