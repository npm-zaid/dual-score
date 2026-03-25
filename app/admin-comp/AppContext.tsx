'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

// ── BCL Scoring State ────────────────────────────────────────────────────────
export interface BallEvent {
  over: number;
  ball: number;
  batterRuns: number;
  bowlerPoints: number;
  isWicket: boolean;
  isWide: boolean;
  isNoBall: boolean;
  isDot: boolean;
  label: string;
  batterName: string;
  bowlerName: string;
}

export interface InningsState {
  battingTeamId: string;
  bowlingTeamId: string;
  runs: number;
  wickets: number;
  balls: number;
  events: BallEvent[];
  completed: boolean;
  target?: number;
}

export interface BCLScoringState {
  matchId: string;
  currentInnings: 1 | 2;
  innings1: InningsState | null;
  innings2: InningsState | null;
  currentBatterId: string;
  currentBowlerId: string;
  matchStarted: boolean;
  matchFinished: boolean;
  resultText: string;
}

export type Level = 'international' | 'national' | 'state' | 'city';
export type TournamentType = 'professional' | 'semi-professional' | 'entertainment';
export type MatchStatus = 'upcoming' | 'live' | 'completed';
export type Format = 'T2' | 'T11';
export type TeamCategory = 'international' | 'national' | 'state' | 'city';

export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  battingStyle: 'Right-hand' | 'Left-hand';
  bowlingStyle: string;
  age: number;
  team: string;
  nationality: string;      // ← NEW: country of origin
  jerseyNo?: number;        // ← NEW
  bio?: string;             // ← NEW
  tournamentsPlayed?: string[];
  matchesPlayed?: string[];
  teamsPlayedFor?: string[];
  stats?: {
    totalRuns: number;
    totalBalls: number;
    totalWickets: number;
    totalMatches: number;
    highScore: number;
    bestBowling: string;
    centuries?: number;     // ← NEW
    halfCenturies?: number; // ← NEW
    fiveWickets?: number;   // ← NEW
    strikeRate?: number;    // ← NEW
    economy?: number;       // ← NEW
    average?: number;       // ← NEW
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
  coach?: string;           // ← NEW
  founded?: string;         // ← NEW
  wins?: number;            // ← NEW
  losses?: number;          // ← NEW
  titles?: number;          // ← NEW
}

export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  level: Level;
  type: TournamentType;
  format: Format;
  teams: string[];
  startDate: string;
  endDate: string;
  venue?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  logo?: string;
  description?: string;
  prizePool?: string;
  winner?: string;          // ← NEW: team ID of winner
  topScorer?: string;       // ← NEW: player ID
  topWicketTaker?: string;  // ← NEW: player ID
  createdAt: string;
}

export interface Match {
  id: string;
  title: string;
  tournamentId?: string;
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
  tossWinner?: string;      // ← NEW: team ID
  tossDecision?: 'bat' | 'bowl'; // ← NEW
  manOfMatch?: string;      // ← NEW: player ID
  createdAt: string;
}

// ── Seed Data ────────────────────────────────────────────────────────────────

const seedPlayers: Player[] = [
  // ── INDIA (team1) ── 11 players
  { id: 'p1',  name: 'Rohit Sharma',       role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'Off-break',     age: 36, team: 'India',           nationality: 'India',     jerseyNo: 45, bio: 'Captain of India, one of the greatest T20 batsmen ever.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 3450, totalBalls: 2800, totalWickets: 8,  totalMatches: 42, highScore: 118, bestBowling: '2/15', centuries: 4,  halfCenturies: 28, fiveWickets: 0, strikeRate: 123.2, economy: 7.4,  average: 38.9 } },
  { id: 'p2',  name: 'Shubman Gill',        role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 24, team: 'India',           nationality: 'India',     jerseyNo: 77, bio: 'The future of Indian batting, elegant strokemaker.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 2100, totalBalls: 1700, totalWickets: 0,  totalMatches: 28, highScore: 102, bestBowling: '—',    centuries: 2,  halfCenturies: 18, fiveWickets: 0, strikeRate: 123.5, economy: 0,    average: 42.0 } },
  { id: 'p3',  name: 'Virat Kohli',         role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'Medium',        age: 35, team: 'India',           nationality: 'India',     jerseyNo: 18, bio: 'Run machine, 50+ international centuries.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 4200, totalBalls: 3200, totalWickets: 4,  totalMatches: 50, highScore: 122, bestBowling: '1/8',  centuries: 6,  halfCenturies: 32, fiveWickets: 0, strikeRate: 131.2, economy: 8.1,  average: 51.2 } },
  { id: 'p4',  name: 'Suryakumar Yadav',   role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 33, team: 'India',           nationality: 'India',     jerseyNo: 63, bio: '360-degree batter, ranked #1 T20 batter in the world.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 2800, totalBalls: 1900, totalWickets: 0,  totalMatches: 36, highScore: 117, bestBowling: '—',    centuries: 3,  halfCenturies: 22, fiveWickets: 0, strikeRate: 147.4, economy: 0,    average: 44.4 } },
  { id: 'p5',  name: 'Hardik Pandya',       role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',   age: 30, team: 'India',           nationality: 'India',     jerseyNo: 228,bio: 'Explosive finisher and key medium pace weapon.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 1800, totalBalls: 1400, totalWickets: 38, totalMatches: 42, highScore: 76,  bestBowling: '3/18', centuries: 0,  halfCenturies: 10, fiveWickets: 0, strikeRate: 128.6, economy: 8.8,  average: 28.1 } },
  { id: 'p6',  name: 'Rishabh Pant',        role: 'Wicket-keeper', battingStyle: 'Left-hand',  bowlingStyle: 'None',          age: 26, team: 'India',           nationality: 'India',     jerseyNo: 17, bio: 'Most explosive left-hand wicket-keeper batter.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 1600, totalBalls: 1200, totalWickets: 0,  totalMatches: 32, highScore: 88,  bestBowling: '—',    centuries: 1,  halfCenturies: 12, fiveWickets: 0, strikeRate: 133.3, economy: 0,    average: 33.3 } },
  { id: 'p7',  name: 'Ravindra Jadeja',     role: 'All-rounder',   battingStyle: 'Left-hand',  bowlingStyle: 'Slow left-arm', age: 35, team: 'India',           nationality: 'India',     jerseyNo: 8,  bio: 'World class spinner and a lower-order batting threat.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 1400, totalBalls: 1300, totalWickets: 55, totalMatches: 45, highScore: 62,  bestBowling: '5/31', centuries: 0,  halfCenturies: 6,  fiveWickets: 2, strikeRate: 107.7, economy: 7.1,  average: 22.6 } },
  { id: 'p8',  name: 'Axar Patel',          role: 'All-rounder',   battingStyle: 'Left-hand',  bowlingStyle: 'Slow left-arm', age: 30, team: 'India',           nationality: 'India',     jerseyNo: 20, bio: 'Reliable spinner who can bat explosively down the order.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 800,  totalBalls: 900,  totalWickets: 42, totalMatches: 38, highScore: 44,  bestBowling: '4/22', centuries: 0,  halfCenturies: 2,  fiveWickets: 1, strikeRate: 88.9,  economy: 7.4,  average: 18.6 } },
  { id: 'p9',  name: 'Jasprit Bumrah',      role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast',          age: 30, team: 'India',           nationality: 'India',     jerseyNo: 93, bio: 'The best fast bowler in the world, unplayable yorkers.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 120,  totalBalls: 180,  totalWickets: 68, totalMatches: 42, highScore: 12,  bestBowling: '5/27', centuries: 0,  halfCenturies: 0,  fiveWickets: 3, strikeRate: 66.7,  economy: 6.1,  average: 14.2 } },
  { id: 'p10', name: 'Mohammed Siraj',      role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',   age: 30, team: 'India',           nationality: 'India',     jerseyNo: 13, bio: 'Aggressive seam bowler with reverse swing mastery.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 90,   totalBalls: 130,  totalWickets: 48, totalMatches: 35, highScore: 9,   bestBowling: '6/21', centuries: 0,  halfCenturies: 0,  fiveWickets: 2, strikeRate: 69.2,  economy: 6.5,  average: 15.8 } },
  { id: 'p11', name: 'Yuzvendra Chahal',    role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 33, team: 'India',           nationality: 'India',     jerseyNo: 3,  bio: "India's premier leg-spinner with a deceptive googly.", tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team1'], stats: { totalRuns: 60,   totalBalls: 80,   totalWickets: 62, totalMatches: 40, highScore: 8,   bestBowling: '6/25', centuries: 0,  halfCenturies: 0,  fiveWickets: 3, strikeRate: 75.0,  economy: 7.6,  average: 16.1 } },

  // ── PAKISTAN (team2) ── 11 players
  { id: 'p12', name: 'Babar Azam',          role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 29, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 56, bio: 'Former #1 ranked ODI batter, elegant strokeplay.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 3800, totalBalls: 3000, totalWickets: 0,  totalMatches: 45, highScore: 115, bestBowling: '—',    centuries: 5,  halfCenturies: 30, fiveWickets: 0, strikeRate: 126.7, economy: 0,    average: 49.4 } },
  { id: 'p13', name: 'Mohammad Rizwan',     role: 'Wicket-keeper', battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 31, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 55, bio: 'Dependable wicket-keeper batsman and strong finisher.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 2900, totalBalls: 2300, totalWickets: 0,  totalMatches: 40, highScore: 104, bestBowling: '—',    centuries: 2,  halfCenturies: 24, fiveWickets: 0, strikeRate: 126.1, economy: 0,    average: 41.4 } },
  { id: 'p14', name: 'Fakhar Zaman',        role: 'Batsman',       battingStyle: 'Left-hand',  bowlingStyle: 'None',          age: 33, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 44, bio: 'Aggressive left-hand opener, highest ODI score 210*.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 2400, totalBalls: 1900, totalWickets: 0,  totalMatches: 32, highScore: 138, bestBowling: '—',    centuries: 3,  halfCenturies: 16, fiveWickets: 0, strikeRate: 126.3, economy: 0,    average: 38.1 } },
  { id: 'p15', name: 'Agha Salman',         role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Off-break',     age: 29, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 26, bio: 'Reliable middle-order bat and handy off-spin option.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 800,  totalBalls: 720,  totalWickets: 22, totalMatches: 28, highScore: 58,  bestBowling: '3/18', centuries: 0,  halfCenturies: 5,  fiveWickets: 0, strikeRate: 111.1, economy: 7.8,  average: 22.2 } },
  { id: 'p16', name: 'Shadab Khan',         role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 25, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 16, bio: 'Attacking leg-spinner who can play big shots.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 900,  totalBalls: 850,  totalWickets: 48, totalMatches: 38, highScore: 52,  bestBowling: '4/28', centuries: 0,  halfCenturies: 4,  fiveWickets: 1, strikeRate: 105.9, economy: 7.9,  average: 19.4 } },
  { id: 'p17', name: 'Imad Wasim',          role: 'All-rounder',   battingStyle: 'Left-hand',  bowlingStyle: 'Slow left-arm', age: 35, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 12, bio: 'Experienced campaigner, T20 specialist.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 700,  totalBalls: 780,  totalWickets: 35, totalMatches: 34, highScore: 49,  bestBowling: '5/14', centuries: 0,  halfCenturies: 3,  fiveWickets: 1, strikeRate: 89.7,  economy: 6.8,  average: 18.4 } },
  { id: 'p18', name: 'Shaheen Afridi',      role: 'Bowler',        battingStyle: 'Left-hand',  bowlingStyle: 'Fast',          age: 24, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 10, bio: 'Left-arm express with devastating new-ball swing.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 80,   totalBalls: 110,  totalWickets: 52, totalMatches: 35, highScore: 10,  bestBowling: '6/35', centuries: 0,  halfCenturies: 0,  fiveWickets: 3, strikeRate: 72.7,  economy: 7.2,  average: 15.6 } },
  { id: 'p19', name: 'Haris Rauf',          role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast',          age: 30, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 24, bio: 'Raw pace and a deadly bouncer in his armoury.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 60,   totalBalls: 90,   totalWickets: 44, totalMatches: 32, highScore: 7,   bestBowling: '4/22', centuries: 0,  halfCenturies: 0,  fiveWickets: 0, strikeRate: 66.7,  economy: 7.8,  average: 16.8 } },
  { id: 'p20', name: 'Naseem Shah',         role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast',          age: 21, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 7,  bio: 'Youngest to take a Test hat-trick, fearless fast bowler.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 50,   totalBalls: 70,   totalWickets: 38, totalMatches: 28, highScore: 6,   bestBowling: '5/18', centuries: 0,  halfCenturies: 0,  fiveWickets: 2, strikeRate: 71.4,  economy: 7.4,  average: 14.2 } },
  { id: 'p21', name: 'Usama Mir',           role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 29, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 97, bio: 'Crafty leg-spin bowler with sharp googly.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 45,   totalBalls: 60,   totalWickets: 30, totalMatches: 22, highScore: 5,   bestBowling: '4/29', centuries: 0,  halfCenturies: 0,  fiveWickets: 0, strikeRate: 75.0,  economy: 8.2,  average: 18.0 } },
  { id: 'p22', name: 'Abrar Ahmed',         role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 25, team: 'Pakistan',        nationality: 'Pakistan',  jerseyNo: 83, bio: 'Mystery spinner with multiple variations.', tournamentsPlayed: ['t1'], matchesPlayed: ['m1'], teamsPlayedFor: ['team2'], stats: { totalRuns: 30,   totalBalls: 45,   totalWickets: 25, totalMatches: 18, highScore: 4,   bestBowling: '4/33', centuries: 0,  halfCenturies: 0,  fiveWickets: 0, strikeRate: 66.7,  economy: 8.6,  average: 19.2 } },

  // ── AUSTRALIA (team3) ── 11 players
  { id: 'p23', name: 'Travis Head',         role: 'Batsman',       battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',     age: 30, team: 'Australia',       nationality: 'Australia', jerseyNo: 35, bio: 'Big-match player, World Cup Final centurion.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 2200, totalBalls: 1700, totalWickets: 5,  totalMatches: 34, highScore: 109, bestBowling: '1/8',  centuries: 2,  halfCenturies: 16, fiveWickets: 0, strikeRate: 129.4, economy: 7.2,  average: 38.6 } },
  { id: 'p24', name: 'David Warner',        role: 'Batsman',       battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',     age: 37, team: 'Australia',       nationality: 'Australia', jerseyNo: 31, bio: 'One of the most destructive openers of his era.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 3200, totalBalls: 2400, totalWickets: 2,  totalMatches: 40, highScore: 107, bestBowling: '1/12', centuries: 4,  halfCenturies: 25, fiveWickets: 0, strikeRate: 133.3, economy: 8.4,  average: 43.8 } },
  { id: 'p25', name: 'Steve Smith',         role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 34, team: 'Australia',       nationality: 'Australia', jerseyNo: 49, bio: 'Arguably the best Test batter in the modern era.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 3600, totalBalls: 3100, totalWickets: 18, totalMatches: 45, highScore: 113, bestBowling: '2/16', centuries: 5,  halfCenturies: 28, fiveWickets: 0, strikeRate: 116.1, economy: 7.9,  average: 49.3 } },
  { id: 'p26', name: 'Marnus Labuschagne', role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 29, team: 'Australia',       nationality: 'Australia', jerseyNo: 18, bio: 'Test centurion turned impactful white-ball player.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 1800, totalBalls: 1600, totalWickets: 8,  totalMatches: 28, highScore: 88,  bestBowling: '2/22', centuries: 1,  halfCenturies: 14, fiveWickets: 0, strikeRate: 112.5, economy: 8.1,  average: 38.3 } },
  { id: 'p27', name: 'Glenn Maxwell',       role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Off-break',     age: 35, team: 'Australia',       nationality: 'Australia', jerseyNo: 32, bio: 'The "Big Show" – capable of match-winning innings from anywhere.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 2100, totalBalls: 1600, totalWickets: 30, totalMatches: 40, highScore: 201, bestBowling: '3/26', centuries: 2,  halfCenturies: 12, fiveWickets: 0, strikeRate: 131.2, economy: 8.3,  average: 31.3 } },
  { id: 'p28', name: 'Matthew Wade',        role: 'Wicket-keeper', battingStyle: 'Left-hand',  bowlingStyle: 'None',          age: 36, team: 'Australia',       nationality: 'Australia', jerseyNo: 9,  bio: 'Dynamic wicket-keeper, clutch finisher in T20s.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 1400, totalBalls: 1100, totalWickets: 0,  totalMatches: 36, highScore: 80,  bestBowling: '—',    centuries: 0,  halfCenturies: 9,  fiveWickets: 0, strikeRate: 127.3, economy: 0,    average: 28.0 } },
  { id: 'p29', name: 'Pat Cummins',         role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Fast',          age: 31, team: 'Australia',       nationality: 'Australia', jerseyNo: 30, bio: 'Australia captain and world-class fast bowling allrounder.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 420,  totalBalls: 520,  totalWickets: 45, totalMatches: 38, highScore: 48,  bestBowling: '4/21', centuries: 0,  halfCenturies: 1,  fiveWickets: 0, strikeRate: 80.8,  economy: 7.1,  average: 19.8 } },
  { id: 'p30', name: 'Mitchell Starc',      role: 'Bowler',        battingStyle: 'Left-hand',  bowlingStyle: 'Fast',          age: 34, team: 'Australia',       nationality: 'Australia', jerseyNo: 56, bio: 'Left-arm express, lethal swinging yorkers.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 150,  totalBalls: 200,  totalWickets: 58, totalMatches: 42, highScore: 22,  bestBowling: '6/28', centuries: 0,  halfCenturies: 0,  fiveWickets: 4, strikeRate: 75.0,  economy: 6.6,  average: 15.2 } },
  { id: 'p31', name: 'Josh Hazlewood',      role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',   age: 33, team: 'Australia',       nationality: 'Australia', jerseyNo: 38, bio: 'Relentless line-and-length bowler with sharp seam movement.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 100,  totalBalls: 140,  totalWickets: 50, totalMatches: 38, highScore: 15,  bestBowling: '5/30', centuries: 0,  halfCenturies: 0,  fiveWickets: 2, strikeRate: 71.4,  economy: 6.8,  average: 16.4 } },
  { id: 'p32', name: 'Adam Zampa',          role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 31, team: 'Australia',       nationality: 'Australia', jerseyNo: 45, bio: "Australia's leading white-ball spinner, sharp leg-break.", tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 80,   totalBalls: 110,  totalWickets: 55, totalMatches: 40, highScore: 10,  bestBowling: '5/35', centuries: 0,  halfCenturies: 0,  fiveWickets: 2, strikeRate: 72.7,  economy: 7.3,  average: 17.1 } },
  { id: 'p33', name: 'Marcus Stoinis',      role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',   age: 34, team: 'Australia',       nationality: 'Australia', jerseyNo: 18, bio: 'Powerful hitter and useful pace-bowling allrounder.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team3'], stats: { totalRuns: 1200, totalBalls: 1000, totalWickets: 28, totalMatches: 32, highScore: 72,  bestBowling: '3/24', centuries: 0,  halfCenturies: 8,  fiveWickets: 0, strikeRate: 120.0, economy: 8.2,  average: 26.1 } },

  // ── ENGLAND (team4) ── 11 players
  { id: 'p34', name: 'Jos Buttler',         role: 'Wicket-keeper', battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 34, team: 'England',         nationality: 'England',   jerseyNo: 63, bio: "England's captain, one of T20 cricket's greatest entertainers.", tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 2800, totalBalls: 2100, totalWickets: 0,  totalMatches: 38, highScore: 101, bestBowling: '—',    centuries: 2,  halfCenturies: 22, fiveWickets: 0, strikeRate: 133.3, economy: 0,    average: 41.8 } },
  { id: 'p35', name: 'Phil Salt',           role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 27, team: 'England',         nationality: 'England',   jerseyNo: 26, bio: 'Explosive opening batsman who loves to hit big sixes.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 1400, totalBalls: 1000, totalWickets: 0,  totalMatches: 24, highScore: 87,  bestBowling: '—',    centuries: 1,  halfCenturies: 10, fiveWickets: 0, strikeRate: 140.0, economy: 0,    average: 34.1 } },
  { id: 'p36', name: 'Dawid Malan',         role: 'Batsman',       battingStyle: 'Left-hand',  bowlingStyle: 'Leg-spin',      age: 36, team: 'England',         nationality: 'England',   jerseyNo: 29, bio: 'Former #1 ranked T20I batter, stylish left-hander.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 2100, totalBalls: 1800, totalWickets: 4,  totalMatches: 32, highScore: 119, bestBowling: '1/14', centuries: 2,  halfCenturies: 18, fiveWickets: 0, strikeRate: 116.7, economy: 8.4,  average: 40.4 } },
  { id: 'p37', name: 'Ben Stokes',          role: 'All-rounder',   battingStyle: 'Left-hand',  bowlingStyle: 'Fast-medium',   age: 33, team: 'England',         nationality: 'England',   jerseyNo: 55, bio: 'England captain in Tests, the ultimate match-winner.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 2200, totalBalls: 1900, totalWickets: 42, totalMatches: 40, highScore: 99,  bestBowling: '4/30', centuries: 1,  halfCenturies: 16, fiveWickets: 0, strikeRate: 115.8, economy: 7.9,  average: 34.4 } },
  { id: 'p38', name: 'Liam Livingstone',    role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 31, team: 'England',         nationality: 'England',   jerseyNo: 23, bio: '360-degree batter with useful leg-spin in the mix.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 1600, totalBalls: 1100, totalWickets: 25, totalMatches: 30, highScore: 94,  bestBowling: '3/17', centuries: 1,  halfCenturies: 11, fiveWickets: 0, strikeRate: 145.5, economy: 8.1,  average: 32.0 } },
  { id: 'p39', name: 'Moeen Ali',           role: 'All-rounder',   battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',     age: 36, team: 'England',         nationality: 'England',   jerseyNo: 18, bio: 'Experienced spinner and hard-hitting batsman.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 1500, totalBalls: 1400, totalWickets: 38, totalMatches: 38, highScore: 72,  bestBowling: '5/23', centuries: 0,  halfCenturies: 9,  fiveWickets: 1, strikeRate: 107.1, economy: 7.4,  average: 26.3 } },
  { id: 'p40', name: 'Sam Curran',          role: 'All-rounder',   battingStyle: 'Left-hand',  bowlingStyle: 'Fast-medium',   age: 25, team: 'England',         nationality: 'England',   jerseyNo: 58, bio: 'T20 World Cup Player of the Tournament 2022.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 900,  totalBalls: 900,  totalWickets: 34, totalMatches: 30, highScore: 65,  bestBowling: '5/10', centuries: 0,  halfCenturies: 5,  fiveWickets: 2, strikeRate: 100.0, economy: 7.2,  average: 21.2 } },
  { id: 'p41', name: 'Mark Wood',           role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast',          age: 34, team: 'England',         nationality: 'England',   jerseyNo: 33, bio: 'Express pace bowler, routinely clocks 90+ mph.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 110,  totalBalls: 160,  totalWickets: 48, totalMatches: 32, highScore: 14,  bestBowling: '5/34', centuries: 0,  halfCenturies: 0,  fiveWickets: 2, strikeRate: 68.8,  economy: 7.6,  average: 16.9 } },
  { id: 'p42', name: 'Jofra Archer',        role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast',          age: 29, team: 'England',         nationality: 'England',   jerseyNo: 22, bio: 'Deadly pace bowler with a perfect action.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 80,   totalBalls: 110,  totalWickets: 40, totalMatches: 26, highScore: 11,  bestBowling: '4/29', centuries: 0,  halfCenturies: 0,  fiveWickets: 0, strikeRate: 72.7,  economy: 7.1,  average: 16.4 } },
  { id: 'p43', name: 'Adil Rashid',         role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 36, team: 'England',         nationality: 'England',   jerseyNo: 3,  bio: 'World-class leg-spinner and England white-ball stalwart.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 180,  totalBalls: 250,  totalWickets: 52, totalMatches: 38, highScore: 28,  bestBowling: '4/23', centuries: 0,  halfCenturies: 0,  fiveWickets: 0, strikeRate: 72.0,  economy: 7.4,  average: 17.2 } },
  { id: 'p44', name: 'Chris Jordan',        role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Fast-medium',   age: 35, team: 'England',         nationality: 'England',   jerseyNo: 8,  bio: 'Specialist death bowler and an outstanding fielder.', tournamentsPlayed: ['t1'], matchesPlayed: ['m2'], teamsPlayedFor: ['team4'], stats: { totalRuns: 100,  totalBalls: 140,  totalWickets: 36, totalMatches: 28, highScore: 18,  bestBowling: '4/6',  centuries: 0,  halfCenturies: 0,  fiveWickets: 0, strikeRate: 71.4,  economy: 8.2,  average: 19.1 } },

  // ── NATIONAL / STATE players ──
  { id: 'p45', name: 'Yashasvi Jaiswal',    role: 'Batsman',       battingStyle: 'Left-hand',  bowlingStyle: 'Off-break',     age: 22, team: 'Mumbai Strikers',  nationality: 'India',     jerseyNo: 5,  bio: 'Young sensation from Mumbai, prolific run-scorer.', tournamentsPlayed: ['t2'], matchesPlayed: [], teamsPlayedFor: ['team5'], stats: { totalRuns: 820,  totalBalls: 680,  totalWickets: 3,  totalMatches: 18, highScore: 68,  bestBowling: '1/10', centuries: 0,  halfCenturies: 8,  fiveWickets: 0, strikeRate: 120.6, economy: 7.8,  average: 32.8 } },
  { id: 'p46', name: 'Ruturaj Gaikwad',     role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'Off-break',     age: 27, team: 'Pune Lions',       nationality: 'India',     jerseyNo: 31, bio: 'Elegant batsman, CSK and India opener.', tournamentsPlayed: ['t2'], matchesPlayed: [], teamsPlayedFor: ['team6'], stats: { totalRuns: 950,  totalBalls: 780,  totalWickets: 2,  totalMatches: 20, highScore: 79,  bestBowling: '1/14', centuries: 0,  halfCenturies: 9,  fiveWickets: 0, strikeRate: 121.8, economy: 8.1,  average: 34.6 } },
  { id: 'p47', name: 'Rashid Khan',         role: 'Bowler',        battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 25, team: 'Afghanistan',      nationality: 'Afghanistan',jerseyNo: 19, bio: 'Best T20 spinner in the world, lethal googly.', tournamentsPlayed: ['t1'], matchesPlayed: [], teamsPlayedFor: ['team7'], stats: { totalRuns: 340,  totalBalls: 480,  totalWickets: 75, totalMatches: 45, highScore: 39,  bestBowling: '5/3',  centuries: 0,  halfCenturies: 0,  fiveWickets: 4, strikeRate: 70.8,  economy: 6.1,  average: 12.3 } },
  { id: 'p48', name: 'Ibrahim Zadran',      role: 'Batsman',       battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 22, team: 'Afghanistan',      nationality: 'Afghanistan',jerseyNo: 15, bio: 'Prolific young opener for Afghanistan.', tournamentsPlayed: ['t1'], matchesPlayed: [], teamsPlayedFor: ['team7'], stats: { totalRuns: 1100, totalBalls: 920,  totalWickets: 0,  totalMatches: 22, highScore: 77,  bestBowling: '—',    centuries: 0,  halfCenturies: 10, fiveWickets: 0, strikeRate: 119.6, economy: 0,    average: 33.3 } },
  { id: 'p49', name: 'Kusal Mendis',        role: 'Wicket-keeper', battingStyle: 'Right-hand', bowlingStyle: 'None',          age: 28, team: 'Sri Lanka',        nationality: 'Sri Lanka', jerseyNo: 13, bio: 'Hard-hitting Sri Lanka wicket-keeper batsman.', tournamentsPlayed: [], matchesPlayed: [], teamsPlayedFor: ['team8'], stats: { totalRuns: 1450, totalBalls: 1100, totalWickets: 0,  totalMatches: 28, highScore: 91,  bestBowling: '—',    centuries: 1,  halfCenturies: 10, fiveWickets: 0, strikeRate: 131.8, economy: 0,    average: 36.2 } },
  { id: 'p50', name: 'Wanindu Hasaranga',   role: 'All-rounder',   battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin',      age: 26, team: 'Sri Lanka',        nationality: 'Sri Lanka', jerseyNo: 31, bio: "Sri Lanka's star T20 allrounder, lethal leg-spinner.", tournamentsPlayed: [], matchesPlayed: [], teamsPlayedFor: ['team8'], stats: { totalRuns: 720,  totalBalls: 640,  totalWickets: 58, totalMatches: 38, highScore: 43,  bestBowling: '6/5',  centuries: 0,  halfCenturies: 2,  fiveWickets: 3, strikeRate: 112.5, economy: 6.7,  average: 14.8 } },
];

const seedTeams: Team[] = [
  { id: 'team1', name: 'India',            shortName: 'IND', color: '#3b82f6', category: 'international', homeGround: 'Wankhede Stadium, Mumbai', country: 'India',       captain: 'p1',  viceCaptain: 'p3',  coach: 'Gautam Gambhir',  founded: '1928', wins: 38, losses: 12, titles: 2,  players: seedPlayers.slice(0, 11) },
  { id: 'team2', name: 'Pakistan',         shortName: 'PAK', color: '#22c55e', category: 'international', homeGround: 'Gaddafi Stadium, Lahore',  country: 'Pakistan',    captain: 'p12', viceCaptain: 'p13', coach: 'Gary Kirsten',     founded: '1952', wins: 32, losses: 18, titles: 1,  players: seedPlayers.slice(11, 22) },
  { id: 'team3', name: 'Australia',        shortName: 'AUS', color: '#f97316', category: 'international', homeGround: 'MCG, Melbourne',           country: 'Australia',   captain: 'p29', viceCaptain: 'p23', coach: 'Andrew McDonald', founded: '1877', wins: 40, losses: 10, titles: 3,  players: seedPlayers.slice(22, 33) },
  { id: 'team4', name: 'England',          shortName: 'ENG', color: '#ef4444', category: 'international', homeGround: "Lord's, London",           country: 'England',     captain: 'p34', viceCaptain: 'p37', coach: 'Matthew Mott',    founded: '1877', wins: 28, losses: 18, titles: 1,  players: seedPlayers.slice(33, 44) },
  { id: 'team5', name: 'Mumbai Strikers',  shortName: 'MSX', color: '#8b5cf6', category: 'national',       homeGround: 'DY Patil Stadium',        state: 'Maharashtra',   captain: 'p45', coach: 'Ricky Ponting',    founded: '2018', wins: 24, losses: 8,  titles: 1,  players: [seedPlayers[44], seedPlayers[45]] },
  { id: 'team6', name: 'Pune Lions',       shortName: 'PLI', color: '#eab308', category: 'national',       homeGround: 'MCA Stadium, Pune',       state: 'Maharashtra',   coach: 'Stephen Fleming',  founded: '2018', wins: 20, losses: 12, titles: 0, players: [seedPlayers[45]] },
  { id: 'team7', name: 'Afghanistan',      shortName: 'AFG', color: '#06b6d4', category: 'international', homeGround: 'Kabul International Stadium', country: 'Afghanistan', captain: 'p47', coach: 'Jonathan Trott',  founded: '2001', wins: 22, losses: 20, titles: 0, players: [seedPlayers[46], seedPlayers[47]] },
  { id: 'team8', name: 'Sri Lanka',        shortName: 'SLK', color: '#ec4899', category: 'international', homeGround: 'R. Premadasa Stadium',    country: 'Sri Lanka',   captain: 'p49', coach: 'Chris Silverwood', founded: '1975', wins: 25, losses: 22, titles: 1,  players: [seedPlayers[48], seedPlayers[49]] },
];

const seedTournaments: Tournament[] = [
  {
    id: 't1', name: 'ICC T2 World Cup 2025', shortName: 'T2WC', level: 'international', type: 'professional', format: 'T2',
    teams: ['team1', 'team2', 'team3', 'team4', 'team7', 'team8'],
    startDate: '2025-06-01', endDate: '2025-06-30',
    venue: 'Multiple Venues (India)', status: 'ongoing',
    description: 'The biggest 2-over cricket tournament on Earth, featuring the top 8 nations.',
    prizePool: '$2.5M', topScorer: 'p3', topWicketTaker: 'p9',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2', name: 'National Premier League', shortName: 'NPL', level: 'national', type: 'professional', format: 'T11',
    teams: ['team5', 'team6'],
    startDate: '2025-07-10', endDate: '2025-08-15',
    venue: 'Mumbai & Pune', status: 'upcoming',
    description: 'Top national 11-over competition featuring franchise teams.', prizePool: '$500K',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3', name: 'State Championship 2025', shortName: 'SCH', level: 'state', type: 'semi-professional', format: 'T11',
    teams: [],
    startDate: '2025-09-01', endDate: '2025-09-30',
    venue: 'Maharashtra', status: 'upcoming',
    description: 'Inter-district state-level championship.', prizePool: '$50K',
    createdAt: new Date().toISOString(),
  },
];

const seedMatches: Match[] = [
  {
    id: 'm1', title: 'IND vs PAK – Super 8',
    tournamentId: 't1', level: 'international', type: 'professional', format: 'T2',
    teamA: seedTeams[0], teamB: seedTeams[1],
    venue: 'Wankhede Stadium, Mumbai', date: '2025-06-15', time: '19:30',
    status: 'live', scoreA: '48/2', scoreB: '31/4',
    tossWinner: 'team2', tossDecision: 'bowl',
    umpires: ['Anil Kumar', 'Ravi Shastri'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm2', title: 'AUS vs ENG – Group Stage',
    tournamentId: 't1', level: 'international', type: 'professional', format: 'T2',
    teamA: seedTeams[2], teamB: seedTeams[3],
    venue: "Lord's, London", date: '2025-06-20', time: '14:00',
    status: 'upcoming',
    tossWinner: 'team3', tossDecision: 'bat',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm3', title: 'MSX vs PLI – Match 1',
    tournamentId: 't2', level: 'national', type: 'professional', format: 'T11',
    teamA: seedTeams[4], teamB: seedTeams[5],
    venue: 'DY Patil Stadium, Mumbai', date: '2025-07-12', time: '18:00',
    status: 'completed', scoreA: '112/5 (11)', scoreB: '98/8 (11)',
    result: 'Mumbai Strikers won by 14 runs',
    manOfMatch: 'p45',
    tossWinner: 'team5', tossDecision: 'bat',
    umpires: ['Suresh Raju', 'Arvind Sharma'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm4', title: 'IND vs AUS – Group Stage',
    tournamentId: 't1', level: 'international', type: 'professional', format: 'T2',
    teamA: seedTeams[0], teamB: seedTeams[2],
    venue: 'Narendra Modi Stadium, Ahmedabad', date: '2025-06-08', time: '19:30',
    status: 'completed', scoreA: '56/1 (2)', scoreB: '42/4 (2)',
    result: 'India won by 14 runs',
    manOfMatch: 'p3',
    tossWinner: 'team1', tossDecision: 'bat',
    umpires: ['Kumar Dharmasena', 'Marais Erasmus'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm5', title: 'PAK vs ENG – Group Stage',
    tournamentId: 't1', level: 'international', type: 'professional', format: 'T2',
    teamA: seedTeams[1], teamB: seedTeams[3],
    venue: 'Eden Gardens, Kolkata', date: '2025-06-10', time: '19:00',
    status: 'completed', scoreA: '38/6 (2)', scoreB: '40/2 (1.4)',
    result: 'England won by 8 wickets',
    manOfMatch: 'p34',
    tossWinner: 'team4', tossDecision: 'bowl',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'm6', title: 'AFG vs SLK – Group Stage',
    tournamentId: 't1', level: 'international', type: 'professional', format: 'T2',
    teamA: seedTeams[6], teamB: seedTeams[7],
    venue: 'Chinnaswamy Stadium, Bengaluru', date: '2025-06-12', time: '15:30',
    status: 'upcoming',
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
  editingTeam: Team | null;     // ← NEW

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
  setEditingTeam: (team: Team | null) => void;  // ← NEW

  getTeamsByLevel: (level: Level) => Team[];
  getTournamentById: (id: string) => Tournament | undefined;
  getMatchesByTournament: (tournamentId: string) => Match[];
  getPlayerHistory: (playerId: string) => { tournaments: Tournament[]; matches: Match[]; teams: Team[] };
  getPlayersByNationality: (nationality: string) => Player[]; // ← NEW
  getAllNationalities: () => string[];                          // ← NEW
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
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);   // ← NEW
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
  const updateTeam = useCallback((team: Team) => {
    setTeams(prev => prev.map(t => t.id === team.id ? team : t));
    // Also update teamA/teamB in any matches that reference this team
    setMatches(prev => prev.map(m => ({
      ...m,
      teamA: m.teamA.id === team.id ? team : m.teamA,
      teamB: m.teamB.id === team.id ? team : m.teamB,
    })));
  }, []);
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

  const getPlayersByNationality = useCallback((nationality: string) =>
    players.filter(p => p.nationality === nationality), [players]);

  const getAllNationalities = useCallback(() =>
    [...new Set(players.map(p => p.nationality).filter(Boolean))].sort(), [players]);

  return (
    <AppContext.Provider value={{
      matches, teams, players, tournaments,
      sidebarOpen, activePage, editingMatch, scoringMatch, editingTournament, editingTeam,
      bclScoringState, setBclScoringState,
      addMatch, updateMatch, deleteMatch,
      addTeam, updateTeam, deleteTeam,
      addPlayer, updatePlayer,
      addTournament, updateTournament, deleteTournament,
      setSidebarOpen, setActivePage, setEditingMatch, setScoringMatch,
      setEditingTournament, setEditingTeam,
      getTeamsByLevel, getTournamentById, getMatchesByTournament,
      getPlayerHistory, getPlayersByNationality, getAllNationalities,
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
