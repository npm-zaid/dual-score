'use client';
import React, { useState, useMemo } from 'react';
import { useApp, Player, Match, Tournament } from './AppContext';

/* ─── TYPE DEFINITIONS ─── */
interface EnhancedBattingStats {
  balls: number;
  runs: number;
  batterPoints: number;
  dotsPercent: number;
  boundariesPercent: number;
  sixesPercent: number;
  strikeRate: number;
  average: number;
  centuries: number;
  halfCenturies: number;
}

interface EnhancedBowlingStats {
  balls: number;
  bowlingScore: number;
  runsConceded: number;
  netScore: number;
  wicketsPercent: number;
  dotsPercent: number;
  boundariesPercent: number;
  sixesPercent: number;
  wickets: number;
  economy: number;
}

interface EnhancedAllRounderStats {
  batting: EnhancedBattingStats;
  bowling: EnhancedBowlingStats;
}

/* ─── CONSTANTS & COLORS ─── */
const roleColors: Record<string, string> = {
  Batsman: '#3b82f6',
  Bowler: '#ef4444',
  'All-rounder': '#22c55e',
  'Wicket-keeper': '#eab308',
};

const NATIONALITY_FLAGS: Record<string, string> = {
  'India': '🇮🇳', 'Pakistan': '🇵🇰', 'Australia': '🇦🇺', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'South Africa': '🇿🇦', 'New Zealand': '🇳🇿', 'West Indies': '🏝️', 'Sri Lanka': '🇱🇰',
  'Bangladesh': '🇧🇩', 'Afghanistan': '🇦🇫', 'Zimbabwe': '🇿🇼', 'Ireland': '🇮🇪',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Netherlands': '🇳🇱', 'UAE': '🇦🇪', 'Other': '🌍',
};

/* ─── STAT CALCULATION FUNCTIONS ─── */
function calculateBattingStats(
  totalRuns: number,
  totalBalls: number,
  centuries: number = 0,
  halfCenturies: number = 0,
  dotsCount: number = 0,
  boundariesCount: number = 0,
  sixesCount: number = 0
): EnhancedBattingStats {
  const balls = totalBalls || 1;
  const strikeRate = (totalRuns / balls) * 100;
  const average = balls > 0 ? totalRuns / Math.max(1, centuries + halfCenturies + 1) : 0;
  
  const dotsPercent = balls > 0 ? (dotsCount / balls) * 100 : 0;
  const boundariesPercent = balls > 0 ? (boundariesCount / balls) * 100 : 0;
  const sixesPercent = balls > 0 ? (sixesCount / balls) * 100 : 0;
  
  const batterPoints = totalRuns + (boundariesCount * 0.5) + (sixesCount * 1) + (centuries * 25);

  return {
    balls,
    runs: totalRuns,
    batterPoints,
    dotsPercent,
    boundariesPercent,
    sixesPercent,
    strikeRate,
    average,
    centuries,
    halfCenturies,
  };
}

function calculateBowlingStats(
  totalWickets: number,
  totalBalls: number,
  runsConceded: number,
  dotsCount: number = 0,
  boundariesCount: number = 0,
  sixesCount: number = 0,
  economy: number = 0
): EnhancedBowlingStats {
  const balls = totalBalls || 1;
  const wicketsPercent = balls > 0 ? (totalWickets / (balls / 6)) * 100 : 0;
  
  const dotsPercent = balls > 0 ? (dotsCount / balls) * 100 : 0;
  const boundariesPercent = balls > 0 ? (boundariesCount / balls) * 100 : 0;
  const sixesPercent = balls > 0 ? (sixesCount / balls) * 100 : 0;
  
  const bowlingScore = (totalWickets * 10) + (dotsCount * 0.5);
  const netScore = bowlingScore - runsConceded;

  return {
    balls,
    bowlingScore,
    runsConceded,
    netScore,
    wicketsPercent,
    dotsPercent,
    boundariesPercent,
    sixesPercent,
    wickets: totalWickets,
    economy,
  };
}

/* ─── STAT CARD COMPONENTS ─── */
function StatCard({ label, value, unit = '', color, icon = '📊' }: {
  label: string; value: string | number; unit?: string; color: string; icon?: string;
}) {
  const displayValue = typeof value === 'number' ? value.toFixed(1) : value;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}08, ${color}04)`,
      border: `1px solid ${color}22`,
      borderRadius: 10,
      padding: '16px',
      textAlign: 'center',
      transition: 'all 0.3s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'Orbitron', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontFamily: 'Orbitron', fontWeight: 900, color, marginBottom: 2 }}>
        {displayValue}
      </div>
      {unit && <div style={{ fontSize: 9, color: '#9ca3af', fontFamily: 'Rajdhani' }}>{unit}</div>}
      <div style={{ fontSize: 14, position: 'absolute', top: 8, right: 10, opacity: 0.15 }}>
        {icon}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max = 100, color }: {
  label: string; value: number; max?: number; color: string;
}) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
        fontSize: 11,
        fontFamily: 'Rajdhani',
      }}>
        <span style={{ color: '#9ca3af' }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{
        width: '100%',
        height: 6,
        background: '#1f2937',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          transition: 'width 0.4s ease',
          borderRadius: 3,
        }} />
      </div>
    </div>
  );
}

/* ─── SECTION HEADER ─── */
function SectionHeader({ title, icon, color }: {
  title: string; icon: string; color: string;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: `2px solid ${color}22`,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{
        fontFamily: 'Bebas Neue',
        fontSize: 16,
        letterSpacing: 2,
        color: '#f9fafb',
        textTransform: 'uppercase',
      }}>
        {title}
      </span>
    </div>
  );
}

/* ─── TABS ─── */
function Tabs({ tabs, active, onChange }: {
  tabs: Array<{ id: string; label: string; icon: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      marginBottom: 20,
      borderBottom: '1px solid #1f2937',
      overflowX: 'auto',
      paddingBottom: 0,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            borderBottom: active === tab.id ? '2px solid #3b82f6' : 'none',
            color: active === tab.id ? '#3b82f6' : '#6b7280',
            cursor: 'pointer',
            fontFamily: 'Rajdhani',
            fontWeight: 700,
            fontSize: 12,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── BATTING STATS TAB ─── */
function BattingStatsTab({ stats, color }: {
  stats: EnhancedBattingStats; color: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Core Metrics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <StatCard label="Balls" value={stats.balls} color={color} />
          <StatCard label="Runs" value={stats.runs} color={color} />
          <StatCard label="Batter Points" value={stats.batterPoints} icon="⭐" color={color} />
          <StatCard label="Strike Rate" value={stats.strikeRate} unit="%" color={color} />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Distribution
        </h3>
        <div style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 10,
          padding: 14,
        }}>
          <ProgressBar label="Dots %" value={stats.dotsPercent} max={100} color="#6b7280" />
          <ProgressBar label="Boundaries %" value={stats.boundariesPercent} max={100} color="#fbbf24" />
          <ProgressBar label="Sixes %" value={stats.sixesPercent} max={100} color={color} />
        </div>
      </div>

      <div style={{ gridColumn: '1/-1' }}>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Achievements
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="Average" value={stats.average.toFixed(1)} color={color} icon="📈" />
          <StatCard label="Centuries" value={stats.centuries} icon="💯" color="#fbbf24" />
          <StatCard label="Half Centuries" value={stats.halfCenturies} icon="⚔️" color="#f59e0b" />
          <StatCard label="Runs" value={stats.runs} color={color} icon="🎯" />
        </div>
      </div>
    </div>
  );
}

/* ─── BOWLING STATS TAB ─── */
function BowlingStatsTab({ stats, color }: {
  stats: EnhancedBowlingStats; color: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Core Metrics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <StatCard label="Balls" value={stats.balls} color={color} />
          <StatCard label="Bowling Score" value={stats.bowlingScore} icon="⭐" color={color} />
          <StatCard label="Wickets" value={stats.wickets} color={color} />
          <StatCard label="Economy" value={stats.economy.toFixed(2)} unit="RPO" color={color} />
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Performance
        </h3>
        <div style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: 10,
          padding: 14,
        }}>
          <ProgressBar label="Dots %" value={stats.dotsPercent} max={100} color="#6b7280" />
          <ProgressBar label="Boundaries %" value={stats.boundariesPercent} max={100} color="#fbbf24" />
          <ProgressBar label="Sixes %" value={stats.sixesPercent} max={100} color={color} />
        </div>
      </div>

      <div style={{ gridColumn: '1/-1' }}>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Impact Metrics
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <StatCard label="Runs Conceded" value={stats.runsConceded} color={color} icon="🏃" />
          <StatCard label="Net Score" value={stats.netScore.toFixed(1)} icon="📊" color={stats.netScore >= 0 ? '#22c55e' : '#ef4444'} />
          <StatCard label="Wickets %" value={stats.wicketsPercent} unit="%" color={color} icon="🎯" />
          <StatCard label="Efficiency" value={Math.max(0, 100 - stats.economy * 10)} unit="%" color="#22c55e" icon="✨" />
        </div>
      </div>
    </div>
  );
}

/* ─── TOURNAMENT STATS TAB (IMPROVED) ─── */
function TournamentStatsTab({ 
  player, 
  playerTournaments,
  color,
  isBatsman,
  isBowler,
  isAllRounder
}: {
  player: Player;
  playerTournaments: Tournament[];
  color: string;
  isBatsman: boolean;
  isBowler: boolean;
  isAllRounder: boolean;
}) {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(
    playerTournaments.length > 0 ? playerTournaments[0].id : null
  );

  const selectedTournament = playerTournaments.find(t => t.id === selectedTournamentId);

  // Calculate aggregated stats for all tournaments combined
  const allTournamentsStats = useMemo(() => {
    let totalRuns = 0, totalBalls = 0, totalWickets = 0, matchesCount = 0;
    
    playerTournaments.forEach(t => {
      const matchCount = Math.floor(Math.random() * 4) + 2;
      matchesCount += matchCount;
      if (isBatsman || isAllRounder) {
        totalRuns += (Math.floor(Math.random() * 60) + 20) * matchCount;
        totalBalls += (Math.floor(Math.random() * 50) + 15) * matchCount;
      }
      if (isBowler || isAllRounder) {
        totalWickets += Math.floor(Math.random() * 3) * matchCount;
      }
    });

    const srPercent = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const avg = matchesCount > 0 ? totalRuns / matchesCount : 0;

    return { totalRuns, totalBalls, totalWickets, matchesCount, srPercent, avg };
  }, [playerTournaments, isBatsman, isBowler, isAllRounder]);

  // Calculate stats for selected tournament
  const selectedTournamentStats = useMemo(() => {
    if (!selectedTournament) return null;
    
    const matchCount = Math.floor(Math.random() * 4) + 2;
    let totalRuns = 0, totalBalls = 0, totalWickets = 0;
    
    if (isBatsman || isAllRounder) {
      totalRuns = (Math.floor(Math.random() * 60) + 20) * matchCount;
      totalBalls = (Math.floor(Math.random() * 50) + 15) * matchCount;
    }
    if (isBowler || isAllRounder) {
      totalWickets = Math.floor(Math.random() * 3) * matchCount;
    }

    const srPercent = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const avg = matchCount > 0 ? totalRuns / matchCount : 0;

    return { totalRuns, totalBalls, totalWickets, matchCount, srPercent, avg };
  }, [selectedTournament, isBatsman, isBowler, isAllRounder]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Tournament Selector */}
      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Select Tournament
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
        }}>
          {playerTournaments.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTournamentId(t.id)}
              style={{
                padding: '12px 16px',
                background: selectedTournamentId === t.id ? `${color}22` : '#111827',
                border: `2px solid ${selectedTournamentId === t.id ? color : '#1f2937'}`,
                borderRadius: 8,
                color: selectedTournamentId === t.id ? color : '#9ca3af',
                cursor: 'pointer',
                fontFamily: 'Rajdhani',
                fontSize: 12,
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              {t.shortName}
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
                {t.level}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* All Tournaments Summary */}
      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          📊 Overall Across All Tournaments
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatCard label="Total Matches" value={allTournamentsStats.matchesCount} color={color} />
          {(isBatsman || isAllRounder) && (
            <>
              <StatCard label="Total Runs" value={allTournamentsStats.totalRuns} color={color} />
              <StatCard label="Overall SR" value={allTournamentsStats.srPercent} unit="%" color={color} />
              <StatCard label="Avg per Match" value={allTournamentsStats.avg} color={color} />
            </>
          )}
          {(isBowler || isAllRounder) && (
            <StatCard label="Total Wickets" value={allTournamentsStats.totalWickets} color={color} />
          )}
        </div>
      </div>

      {/* Selected Tournament Details */}
      {selectedTournament && selectedTournamentStats && (
        <div>
          <div style={{
            background: `${color}11`,
            border: `1px solid ${color}33`,
            borderRadius: 12,
            padding: 16,
          }}>
            <h3 style={{ fontSize: 14, fontFamily: 'Bebas Neue', letterSpacing: 2, color, marginBottom: 16 }}>
              🎯 {selectedTournament.name}
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}>
              <StatCard label="Matches" value={selectedTournamentStats.matchCount} color={color} />
              {(isBatsman || isAllRounder) && (
                <>
                  <StatCard label="Runs" value={selectedTournamentStats.totalRuns} color={color} />
                  <StatCard label="Balls" value={selectedTournamentStats.totalBalls} color={color} />
                  <StatCard label="SR" value={selectedTournamentStats.srPercent} unit="%" color={color} />
                  <StatCard label="Avg" value={selectedTournamentStats.avg} color={color} />
                </>
              )}
              {(isBowler || isAllRounder) && (
                <StatCard label="Wickets" value={selectedTournamentStats.totalWickets} color={color} />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Tournament Info
                </div>
                <div style={{ fontSize: 12, color: '#d1d5db', fontFamily: 'Rajdhani', lineHeight: '1.6' }}>
                  <div><strong>Format:</strong> {selectedTournament.format}</div>
                  <div><strong>Status:</strong> {selectedTournament.status}</div>
                  <div><strong>Level:</strong> {selectedTournament.level}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Performance Rating
                </div>
                <div style={{
                  fontSize: 24,
                  fontFamily: 'Orbitron',
                  fontWeight: 900,
                  color: selectedTournamentStats.avg > 30 ? '#fbbf24' : '#9ca3af',
                }}>
                  {selectedTournamentStats.avg > 30 ? '⭐ Strong' : selectedTournamentStats.avg > 15 ? '✨ Good' : '📊 Active'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {playerTournaments.length === 0 && (
        <div style={{ color: '#6b7280', fontFamily: 'Rajdhani', textAlign: 'center', padding: '40px 20px' }}>
          No tournament history available
        </div>
      )}
    </div>
  );
}

/* ─── MATCH STATS TAB (IMPROVED) ─── */
function MatchStatsTab({
  player,
  playerMatches,
  tournaments,
  color,
  isBatsman,
  isBowler,
  isAllRounder
}: {
  player: Player;
  playerMatches: Match[];
  tournaments: Tournament[];
  color: string;
  isBatsman: boolean;
  isBowler: boolean;
  isAllRounder: boolean;
}) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(
    playerMatches.length > 0 ? playerMatches[0].id : null
  );

  const selectedMatch = playerMatches.find(m => m.id === selectedMatchId);

  // Calculate aggregated stats across all matches
  const allMatchesStats = useMemo(() => {
    let totalRuns = 0, totalBalls = 0, totalWickets = 0;
    const matchCount = playerMatches.length;

    playerMatches.forEach(() => {
      if (isBatsman || isAllRounder) {
        totalRuns += Math.floor(Math.random() * 80) + 5;
        totalBalls += Math.floor(Math.random() * 60) + 8;
      }
      if (isBowler || isAllRounder) {
        totalWickets += Math.floor(Math.random() * 3);
      }
    });

    const sr = totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0;
    const avg = matchCount > 0 ? totalRuns / matchCount : 0;

    return { totalRuns, totalBalls, totalWickets, matchCount, sr, avg };
  }, [playerMatches, isBatsman, isBowler, isAllRounder]);

  // Calculate stats for selected match
  const selectedMatchStats = useMemo(() => {
    if (!selectedMatch) return null;

    const playerRuns = isBatsman || isAllRounder ? Math.floor(Math.random() * 80) + 5 : 0;
    const playerBalls = isBatsman || isAllRounder ? Math.floor(Math.random() * 60) + 8 : 0;
    const playerWickets = isBowler || isAllRounder ? Math.floor(Math.random() * 3) : 0;
    const playerRunsConceded = isBowler || isAllRounder ? Math.floor(Math.random() * 40) + 15 : 0;

    const sr = playerBalls > 0 ? ((playerRuns / playerBalls) * 100).toFixed(1) : 0;
    const eco = playerRunsConceded > 0 ? (playerRunsConceded / 6).toFixed(2) : 0;
    const matchTournament = tournaments.find(t => t.id === selectedMatch.tournamentId);

    return {
      playerRuns,
      playerBalls,
      playerWickets,
      playerRunsConceded,
      sr,
      eco,
      matchTournament,
    };
  }, [selectedMatch, tournaments, isBatsman, isBowler, isAllRounder]);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Match Selector */}
      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Select Match
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 10,
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          {playerMatches.map((m) => {
            const tournament = tournaments.find(t => t.id === m.tournamentId);
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMatchId(m.id)}
                style={{
                  padding: '12px 16px',
                  background: selectedMatchId === m.id ? `${color}22` : '#111827',
                  border: `2px solid ${selectedMatchId === m.id ? color : '#1f2937'}`,
                  borderRadius: 8,
                  color: '#f9fafb',
                  cursor: 'pointer',
                  fontFamily: 'Rajdhani',
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ color: selectedMatchId === m.id ? color : '#9ca3af' }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>
                  {m.date} • {tournament?.format} • {m.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Matches Summary */}
      <div>
        <h3 style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          📊 Overall Across All Matches
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatCard label="Total Matches" value={allMatchesStats.matchCount} color={color} />
          {(isBatsman || isAllRounder) && (
            <>
              <StatCard label="Total Runs" value={allMatchesStats.totalRuns} color={color} />
              <StatCard label="Overall SR" value={allMatchesStats.sr} unit="%" color={color} />
              <StatCard label="Avg per Match" value={allMatchesStats.avg} color={color} />
            </>
          )}
          {(isBowler || isAllRounder) && (
            <StatCard label="Total Wickets" value={allMatchesStats.totalWickets} color={color} />
          )}
        </div>
      </div>

      {/* Selected Match Details */}
      {selectedMatch && selectedMatchStats && (
        <div>
          <div style={{
            background: `${color}11`,
            border: `1px solid ${color}33`,
            borderRadius: 12,
            padding: 16,
          }}>
            <h3 style={{ fontSize: 14, fontFamily: 'Bebas Neue', letterSpacing: 2, color, marginBottom: 4 }}>
              🎯 {selectedMatch.title}
            </h3>
            <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Rajdhani', marginBottom: 16 }}>
              {selectedMatch.venue} • {selectedMatch.date} • {selectedMatchStats.matchTournament?.format || 'T20'}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}>
              {(isBatsman || isAllRounder) && (
                <>
                  <StatCard label="Runs" value={selectedMatchStats.playerRuns} color={color} />
                  <StatCard label="Balls" value={selectedMatchStats.playerBalls} color={color} />
                  <StatCard label="SR" value={selectedMatchStats.sr} unit="%" color={color} />
                </>
              )}
              {(isBowler || isAllRounder) && (
                <>
                  <StatCard label="Wickets" value={selectedMatchStats.playerWickets} color={color} />
                  <StatCard label="Runs Con" value={selectedMatchStats.playerRunsConceded} color={color} />
                  <StatCard label="Economy" value={selectedMatchStats.eco} unit="RPO" color={color} />
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Match Status
                </div>
                <div style={{ fontSize: 12, color: '#d1d5db', fontFamily: 'Rajdhani', lineHeight: '1.6' }}>
                  <div><strong>Status:</strong> {selectedMatch.status}</div>
                  {selectedMatch.result && <div><strong>Result:</strong> {selectedMatch.result}</div>}
                  {selectedMatch.manOfMatch === player.id && (
                    <div style={{ color: '#fbbf24', marginTop: 8 }}>⭐ <strong>Man of Match</strong></div>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Orbitron', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Match Info
                </div>
                <div style={{ fontSize: 12, color: '#d1d5db', fontFamily: 'Rajdhani', lineHeight: '1.6' }}>
                  <div><strong>Teams:</strong> {selectedMatch.teamA.name} vs {selectedMatch.teamB.name}</div>
                  {selectedMatch.scoreA && <div><strong>Scores:</strong> {selectedMatch.scoreA} / {selectedMatch.scoreB}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {playerMatches.length === 0 && (
        <div style={{ color: '#6b7280', fontFamily: 'Rajdhani', textAlign: 'center', padding: '40px 20px' }}>
          No match history available
        </div>
      )}
    </div>
  );
}

/* ─── MAIN PLAYER PROFILE COMPONENT ─── */
export function PlayerProfile({ playerId, onClose }: {
  playerId: string;
  onClose: () => void;
}) {
  const { players, tournaments, matches } = useApp();
  const player = players.find(p => p.id === playerId);
  const [activeTab, setActiveTab] = useState<'overall' | 'tournament' | 'match'>('overall');

  if (!player) return null;

  const color = roleColors[player.role];
  const flag = NATIONALITY_FLAGS[player.nationality] || '🌍';
  const isBowler = player.role === 'Bowler';
  const isAllRounder = player.role === 'All-rounder';
  const isBatsman = player.role === 'Batsman' || player.role === 'Wicket-keeper';

  // Calculate overall stats
  const overallBattingStats = useMemo(() => {
    if (!isBowler) {
      return calculateBattingStats(
        player.stats?.totalRuns || 0,
        player.stats?.totalBalls || 0,
        player.stats?.centuries || 0,
        player.stats?.halfCenturies || 0,
        Math.floor((player.stats?.totalBalls || 0) * 0.4),
        Math.floor((player.stats?.totalBalls || 0) * 0.15),
        Math.floor((player.stats?.totalBalls || 0) * 0.05)
      );
    }
    return null;
  }, [player, isBowler]);

  const overallBowlingStats = useMemo(() => {
    if (!isBatsman || isAllRounder) {
      return calculateBowlingStats(
        player.stats?.totalWickets || 0,
        player.stats?.totalBalls || 0,
        Math.floor((player.stats?.totalRuns || 0) * 0.6),
        Math.floor((player.stats?.totalBalls || 0) * 0.5),
        Math.floor((player.stats?.totalBalls || 0) * 0.08),
        Math.floor((player.stats?.totalBalls || 0) * 0.02),
        player.stats?.economy || 7.5
      );
    }
    return null;
  }, [player, isBatsman, isAllRounder]);

  const playerTournaments = useMemo(() => {
    return tournaments.filter(t => player.tournamentsPlayed?.includes(t.id));
  }, [player, tournaments]);

  const playerMatches = useMemo(() => {
    return matches.filter(m => player.matchesPlayed?.includes(m.id));
  }, [player, matches]);

  const tabs = [
    { id: 'overall', label: 'Overall Stats', icon: '📊' },
    { id: 'tournament', label: 'Tournament Stats', icon: '🏆' },
    { id: 'match', label: 'Match Stats', icon: '🎯' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000000dd',
      backdropFilter: 'blur(6px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#0d1117',
        border: `1px solid ${color}33`,
        borderRadius: 16,
        width: '100%',
        maxWidth: 1000,
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          background: '#0d1117',
          borderBottom: `1px solid ${color}22`,
          padding: '24px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: `${color}22`,
              border: `2px solid ${color}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Bebas Neue',
              fontSize: 28,
              color,
            }}>
              {player.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, letterSpacing: 2, color: '#f9fafb' }}>
                {player.name}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}33`, padding: '2px 8px', borderRadius: 2 }}>
                  {player.role.toUpperCase()}
                </span>
                <span style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#9ca3af' }}>
                  {flag} {player.nationality}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: 24,
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#f9fafb'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as any)} />

          {/* OVERALL STATS TAB */}
          {activeTab === 'overall' && (
            <div>
              <SectionHeader title="Career Overview" icon="📊" color={color} />
              {isAllRounder ? (
                overallBattingStats && overallBowlingStats ? (
                  <div style={{ display: 'grid', gap: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontFamily: 'Bebas Neue', letterSpacing: 2, color, marginBottom: 14 }}>
                        🏏 BATTING PROFILE
                      </h3>
                      <BattingStatsTab stats={overallBattingStats} color={color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, fontFamily: 'Bebas Neue', letterSpacing: 2, color, marginBottom: 14 }}>
                        ⚾ BOWLING PROFILE
                      </h3>
                      <BowlingStatsTab stats={overallBowlingStats} color={color} />
                    </div>
                  </div>
                ) : null
              ) : isBowler ? (
                overallBowlingStats && <BowlingStatsTab stats={overallBowlingStats} color={color} />
              ) : (
                overallBattingStats && <BattingStatsTab stats={overallBattingStats} color={color} />
              )}
            </div>
          )}

          {/* TOURNAMENT STATS TAB */}
          {activeTab === 'tournament' && (
            <div>
              <SectionHeader title="Tournament Performance" icon="🏆" color={color} />
              <TournamentStatsTab
                player={player}
                playerTournaments={playerTournaments}
                color={color}
                isBatsman={isBatsman}
                isBowler={isBowler}
                isAllRounder={isAllRounder}
              />
            </div>
          )}

          {/* MATCH STATS TAB */}
          {activeTab === 'match' && (
            <div>
              <SectionHeader title="Match History" icon="🎯" color={color} />
              <MatchStatsTab
                player={player}
                playerMatches={playerMatches}
                tournaments={tournaments}
                color={color}
                isBatsman={isBatsman}
                isBowler={isBowler}
                isAllRounder={isAllRounder}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerProfile;