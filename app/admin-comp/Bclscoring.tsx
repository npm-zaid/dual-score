
'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';

// ── BCL Scoring Logic ────────────────────────────────────────────────────────
function calcScores(event: string, runs = 0) {
  switch (event) {
    case 'dot':     return { bat: 0,        bowl: 4 };
    case 'single':  return { bat: 1,        bowl: 3 };
    case 'double':  return { bat: 2,        bowl: 2 };
    case 'triple':  return { bat: 3,        bowl: 1 };
    case 'four':    return { bat: 4,        bowl: 0 };
    case 'six':     return { bat: 6,        bowl: -2 };
    case 'wicket':  return { bat: -2,       bowl: 6 };
    case 'noball':  return { bat: runs + 1, bowl: -1 };
    case 'wide':    return { bat: runs + 1, bowl: -4 };
    default:        return { bat: 0,        bowl: 0 };
  }
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  dot:    { label: 'DOT',     icon: '•',  color: '#6b7280' },
  single: { label: '1 RUN',   icon: '1',  color: '#3b82f6' },
  double: { label: '2 RUNS',  icon: '2',  color: '#06b6d4' },
  triple: { label: '3 RUNS',  icon: '3',  color: '#8b5cf6' },
  four:   { label: 'FOUR',    icon: '4',  color: '#f97316' },
  six:    { label: 'SIX',     icon: '6',  color: '#22c55e' },
  wicket: { label: 'WICKET',  icon: 'W',  color: '#ef4444' },
  noball: { label: 'NO BALL', icon: 'NB', color: '#eab308' },
  wide:   { label: 'WIDE',    icon: 'WD', color: '#a855f7' },
};

const FORMAT_OVERS: Record<string, number> = {
  'T10':  10,
  'T20':  20,
  'ODI':  50,
  'Test': 90, // 90 overs per innings in Test
};

function getOversFromFormat(format?: string): number {
  return FORMAT_OVERS[format ?? ''] ?? 20;
}

const BALLS_PER_OVER = 6;
const MAX_WICKETS = 10;

interface Ball {
  event: string;
  runs: number;
  bat: number;
  bowl: number;
}

interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  balls: Ball[];
  batScore: number;
  bowlScore: number;
  legalBalls: number;
  wickets: number;
  complete: boolean;
}

function initInnings(battingTeam: string, bowlingTeam: string): Innings {
  return {
    battingTeam,
    bowlingTeam,
    balls: [],
    batScore: 0,
    bowlScore: 0,
    legalBalls: 0,
    wickets: 0,
    complete: false,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreBoard({ inn, label }: { inn: Innings; label: string }) {
  const dual = inn.batScore + inn.bowlScore;
  const overs = Math.floor(inn.legalBalls / 6);
  const balls = inn.legalBalls % 6;

  return (
    <div style={{
      background: '#0a0f16',
      border: '1px solid #1f2937',
      borderRadius: 10,
      padding: '16px 20px',
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #22c55e88, transparent)',
      }} />
      <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 36, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>
        {inn.battingTeam}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { l: 'BAT',  v: inn.batScore,  c: '#3b82f6' },
          { l: 'BOWL', v: inn.bowlScore, c: '#f97316' },
          { l: 'DUAL', v: dual,          c: '#22c55e' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1 }}>{l}</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: c, lineHeight: 1.2 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 14 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          <span style={{ color: '#ef4444', fontFamily: 'Orbitron', fontWeight: 700 }}>{inn.wickets}</span>
          <span style={{ color: '#4b5563' }}>/10 wkts</span>
        </span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          <span style={{ fontFamily: 'Orbitron', color: '#22c55e', fontWeight: 700 }}>{overs}.{balls}</span>
          <span style={{ color: '#4b5563' }}> ov</span>
        </span>
      </div>
    </div>
  );
}

function BallDot({ b }: { b: Ball }) {
  const { color } = EVENT_LABELS[b.event] || { color: '#6b7280' };
  const lbl = EVENT_LABELS[b.event]?.icon || '?';
  return (
    <div
      title={`${EVENT_LABELS[b.event]?.label} | Bat: ${b.bat >= 0 ? '+' : ''}${b.bat} | Bowl: ${b.bowl >= 0 ? '+' : ''}${b.bowl}`}
      style={{
        width: 28, height: 28, borderRadius: '50%',
        background: `${color}22`, border: `1.5px solid ${color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, color,
        cursor: 'default', flexShrink: 0,
      }}
    >{lbl}</div>
  );
}

function OverRow({ over, balls }: { over: number; balls: Ball[] }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0', borderBottom: '1px solid #1a2030',
    }}>
      <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', width: 28, flexShrink: 0 }}>
        O{over + 1}
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {balls.map((b, i) => <BallDot key={i} b={b} />)}
      </div>
    </div>
  );
}

function NoBallWideModal({ event, onConfirm, onCancel }: {
  event: string;
  onConfirm: (runs: number) => void;
  onCancel: () => void;
}) {
  const [runs, setRuns] = useState(0);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000bb',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, padding: 28, minWidth: 280 }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', marginBottom: 8 }}>
          {event === 'noball' ? 'NO BALL' : 'WIDE'} — EXTRA RUNS?
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          {event === 'noball'
            ? 'Enter runs scored off the no-ball (0 = only the no-ball extra)'
            : 'Enter runs scored off the wide (0 = only the wide extra)'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setRuns(r => Math.max(0, r - 1))} style={btnStyle('#374151', '#9ca3af')}>−</button>
          <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#f9fafb', minWidth: 40, textAlign: 'center' }}>
            {runs}
          </div>
          <button onClick={() => setRuns(r => r + 1)} style={btnStyle('#374151', '#9ca3af')}>+</button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onConfirm(runs)} style={btnStyle('#22c55e22', '#22c55e', true)}>CONFIRM</button>
          <button onClick={onCancel} style={btnStyle('#ef444422', '#ef4444', true)}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg: string, color: string, full = false): React.CSSProperties {
  return {
    background: bg, border: `1px solid ${color}55`, color,
    fontFamily: 'Orbitron', fontWeight: 700, fontSize: 12,
    padding: full ? '10px 20px' : '8px 14px',
    borderRadius: 6, cursor: 'pointer',
    flex: full ? 1 : undefined,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BCLScoring() {
  // Pull match from context + update function
  const { scoringMatch, updateMatch, setActivePage } = useApp();

  // Derive overs from the selected match's format
  const TOTAL_OVERS = getOversFromFormat(scoringMatch?.format);
  const TOTAL_BALLS = TOTAL_OVERS * BALLS_PER_OVER;

  const [teamA, setTeamA] = useState(scoringMatch?.teamA?.shortName || scoringMatch?.teamA?.name || 'TEAM A');
  const [teamB, setTeamB] = useState(scoringMatch?.teamB?.shortName || scoringMatch?.teamB?.name || 'TEAM B');
  const [started, setStarted] = useState(false);
  const [inningsIdx, setInningsIdx] = useState(0);
  const [innings, setInnings] = useState<[Innings | null, Innings | null]>([null, null]);
  const [modal, setModal] = useState<{ event: string } | null>(null);
  const [matchOver, setMatchOver] = useState(false);

  // Auto-populate team names whenever scoringMatch changes
  useEffect(() => {
    if (scoringMatch) {
      setTeamA(scoringMatch.teamA?.shortName || scoringMatch.teamA?.name || 'TEAM A');
      setTeamB(scoringMatch.teamB?.shortName || scoringMatch.teamB?.name || 'TEAM B');
    }
  }, [scoringMatch]);

  // Sync scoring data back to match in context
  function syncToMatch(inn0: Innings | null, inn1: Innings | null, isOver: boolean) {
    if (!scoringMatch || !updateMatch) return;
    if (!inn0) return;

    const teamADual = inn0.batScore + (inn1?.bowlScore ?? 0);
    const teamBDual = (inn1?.batScore ?? 0) + inn0.bowlScore;
    const overs = Math.floor(inn0.legalBalls / 6);
    const balls = inn0.legalBalls % 6;

    let result: string | undefined;
    if (isOver && inn1) {
      if (teamADual > teamBDual) result = `${teamA} WINS! (${teamADual} vs ${teamBDual})`;
      else if (teamBDual > teamADual) result = `${teamB} WINS! (${teamBDual} vs ${teamADual})`;
      else result = `MATCH TIED! (${teamADual} each)`;
    }

    updateMatch({
      ...scoringMatch,
      status: isOver ? 'completed' : 'live',
      // scoreA / scoreB store the dual scores as strings for display in AllMatches
      scoreA: String(teamADual),
      scoreB: String(teamBDual),
      result: result ?? scoringMatch.result,
      notes: `BCL Dual: ${teamA} ${teamADual} — ${teamB} ${teamBDual} | ${overs}.${balls} ov | ${inn0.wickets} wkts`,
    });
  }

  function startMatch() {
    const i0 = initInnings(teamA, teamB);
    const i1 = initInnings(teamB, teamA);
    setInnings([i0, i1]);
    setInningsIdx(0);
    setStarted(true);
    setMatchOver(false);

    // Mark match as live immediately
    if (scoringMatch && updateMatch) {
      updateMatch({ ...scoringMatch, status: 'live' });
    }
  }

  function applyEvent(event: string, runs = 0) {
    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[inningsIdx]! };
      const balls = [...inn.balls];
      const { bat, bowl } = calcScores(event, runs);
      const isLegal = event !== 'noball' && event !== 'wide';
      const isWicket = event === 'wicket';

      balls.push({ event, runs, bat, bowl });
      inn.balls = balls;
      inn.batScore += bat;
      inn.bowlScore += bowl;
      if (isLegal) inn.legalBalls += 1;
      if (isWicket) inn.wickets += 1;

      const allOut = inn.wickets >= MAX_WICKETS;
      const oversUp = inn.legalBalls >= TOTAL_BALLS;

      if (allOut || oversUp) {
        if (allOut && !oversUp) {
          const remaining = TOTAL_BALLS - inn.legalBalls;
          inn.bowlScore += remaining * 4;
          balls.push({ event: '_bonus', runs: 0, bat: 0, bowl: remaining * 4 });
          inn.balls = balls;
        }
        inn.complete = true;
      }

      all[inningsIdx] = inn;

      // Sync scores back to match context
      const isMatchOver = inningsIdx === 1 && inn.complete;
      syncToMatch(all[0], all[1], isMatchOver);

      return all;
    });
  }

  // Watch for innings completion
  useEffect(() => {
    if (!started) return;
    const inn = innings[inningsIdx];
    if (!inn) return;
    if (inn.complete) {
      if (inningsIdx === 0) {
        setTimeout(() => setInningsIdx(1), 800);
      } else {
        setMatchOver(true);
        syncToMatch(innings[0], innings[1], true);
      }
    }
  }, [innings, inningsIdx, started]);

  function handleEvent(event: string) {
    if (matchOver) return;
    if (event === 'noball' || event === 'wide') {
      setModal({ event });
    } else {
      applyEvent(event);
    }
  }

  function handleModalConfirm(runs: number) {
    applyEvent(modal!.event, runs);
    setModal(null);
  }

  const inn0 = innings[0];
  const inn1 = innings[1];
  const activeInn = innings[inningsIdx];

  function groupOvers(inn: Innings | null) {
    if (!inn) return [];
    const overs: Ball[][] = [];
    let cur: Ball[] = [];
    let legal = 0;
    for (const b of inn.balls) {
      if (b.event === '_bonus') continue;
      cur.push(b);
      if (b.event !== 'noball' && b.event !== 'wide') {
        legal++;
        if (legal % 6 === 0) { overs.push(cur); cur = []; }
      }
    }
    if (cur.length) overs.push(cur);
    return overs;
  }

  function getResult() {
    if (!inn0 || !inn1) return '';
    const teamADual = inn0.batScore + inn1.bowlScore;
    const teamBDual = inn1.batScore + inn0.bowlScore;
    if (teamADual > teamBDual) return `${teamA} WINS! (${teamADual} vs ${teamBDual})`;
    if (teamBDual > teamADual) return `${teamB} WINS! (${teamBDual} vs ${teamADual})`;
    return `MATCH TIED! (${teamADual} each)`;
  }

  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');`;

  // ── Setup Screen ───────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div style={{
        minHeight: '100vh', background: '#060c14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif', padding: 20,
      }}>
        <style>{`${FONTS} * { box-sizing: border-box; margin: 0; padding: 0; } input { outline: none; } button:hover { filter: brightness(1.15); }`}</style>
        <div style={{
          background: '#0d1520', border: '1px solid #1f2937',
          borderRadius: 16, padding: '36px 40px', maxWidth: 440, width: '100%',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
          }} />

          {/* Back button */}
          {scoringMatch && (
            <button
              onClick={() => setActivePage('matches')}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: '1px solid #1f2937',
                color: '#4b5563', fontFamily: 'Orbitron', fontSize: 9,
                padding: '4px 10px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1,
              }}
            >
              ← BACK
            </button>
          )}

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏏</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: 4, color: '#f9fafb' }}>BCL SCORER</div>
            <div style={{ fontSize: 11, color: '#22c55e', fontFamily: 'Orbitron', letterSpacing: 3, marginTop: 2 }}>
              BOUNDARY CRICKET LEAGUE
            </div>
          </div>

          {/* Show match info banner if launched from a match */}
          {scoringMatch && (
            <div style={{
              background: '#22c55e11', border: '1px solid #22c55e22',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              fontSize: 12, color: '#86efac', fontFamily: 'Rajdhani',
            }}>
              <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 4 }}>
                SCORING MATCH
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{scoringMatch.title}</div>
              {scoringMatch.tournament && (
                <div style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>{scoringMatch.tournament}</div>
              )}
              <div style={{ color: '#4b5563', fontSize: 11, marginTop: 4 }}>
                {scoringMatch.format} · {scoringMatch.venue}
              </div>
            </div>
          )}

          {[
            { label: 'TEAM A (Batting First)', val: teamA, set: setTeamA },
            { label: 'TEAM B (Bowling First)', val: teamB, set: setTeamB },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 6 }}>{label}</div>
              <input
                value={val}
                onChange={e => set(e.target.value.toUpperCase())}
                style={{
                  width: '100%', background: '#111827',
                  border: '1px solid #374151', borderRadius: 8,
                  color: '#f9fafb', fontSize: 16, fontFamily: 'Bebas Neue',
                  letterSpacing: 2, padding: '12px 16px',
                }}
              />
            </div>
          ))}

          <button
            onClick={startMatch}
            style={{
              width: '100%', marginTop: 8,
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              border: 'none', borderRadius: 8,
              color: '#000', fontFamily: 'Orbitron', fontWeight: 900,
              fontSize: 14, letterSpacing: 2, padding: '14px', cursor: 'pointer',
              boxShadow: '0 0 20px #22c55e44',
            }}
          >
            START MATCH →
          </button>
          <div style={{ marginTop: 16, fontSize: 11, color: '#374151', textAlign: 'center', fontFamily: 'Rajdhani' }}>
            {TOTAL_OVERS} Overs · 10 Wickets · BCL Dual Score System
            {scoringMatch?.format && (
              <span style={{ color: '#22c55e', marginLeft: 6 }}>· {scoringMatch.format}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const overs0 = groupOvers(inn0);
  const overs1 = groupOvers(inn1);
  const teamADual = inn0 && inn1 ? inn0.batScore + inn1.bowlScore : null;
  const teamBDual = inn0 && inn1 ? inn1.batScore + inn0.bowlScore : null;

  // ── Scoring Screen ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#060c14', color: '#f9fafb', fontFamily: 'Rajdhani', padding: '0 0 40px' }}>
      <style>{`${FONTS} * { box-sizing: border-box; margin: 0; padding: 0; } button:hover { filter: brightness(1.2); } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1520; } ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; }`}</style>

      {/* Header */}
      <div style={{
        background: '#0a0f16', borderBottom: '1px solid #1f2937',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏏</span>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 3 }}>BCL SCORER</div>
            <div style={{ fontSize: 9, color: '#22c55e', fontFamily: 'Orbitron', letterSpacing: 2 }}>
              INNINGS {inningsIdx + 1} OF 2 · {TOTAL_OVERS} OV{matchOver && ' · MATCH COMPLETE'}
            </div>
          </div>
          {/* Live sync indicator */}
          {scoringMatch && !matchOver && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#22c55e11', border: '1px solid #22c55e22',
              borderRadius: 20, padding: '3px 10px', marginLeft: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#22c55e', letterSpacing: 1 }}>LIVE SYNC</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {scoringMatch && (
            <button
              onClick={() => setActivePage('matches')}
              style={{
                background: '#1f2937', border: '1px solid #374151',
                color: '#9ca3af', fontFamily: 'Orbitron', fontSize: 10,
                padding: '6px 14px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1,
              }}
            >← MATCHES</button>
          )}
          <button
            onClick={startMatch}
            style={{
              background: '#1f2937', border: '1px solid #374151',
              color: '#9ca3af', fontFamily: 'Orbitron', fontSize: 10,
              padding: '6px 14px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1,
            }}
          >NEW MATCH</button>
        </div>
      </div>

      {/* Match title bar if launched from a match */}
      {scoringMatch && (
        <div style={{
          background: '#0d1117', borderBottom: '1px solid #1a2030',
          padding: '8px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 11, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 1 }}>SCORING:</span>
          <span style={{ fontSize: 13, fontFamily: 'Rajdhani', fontWeight: 700, color: '#9ca3af' }}>{scoringMatch.title}</span>
          {scoringMatch.tournament && (
            <span style={{ fontSize: 11, color: '#374151' }}>· {scoringMatch.tournament}</span>
          )}
          <span style={{
            marginLeft: 'auto', fontSize: 9, fontFamily: 'Orbitron',
            color: '#22c55e', letterSpacing: 1,
            background: '#22c55e11', border: '1px solid #22c55e22',
            padding: '2px 8px', borderRadius: 3,
          }}>SCORES SYNCING TO MATCH</span>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {/* Scoreboards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {inn0 && (
            <ScoreBoard
              inn={inn0}
              label={`1ST INNINGS${inn0.complete ? ' ✓' : inningsIdx === 0 ? ' · LIVE' : ''}`}
            />
          )}
          {inn1 && (
            <ScoreBoard
              inn={inn1}
              label={`2ND INNINGS${inn1.complete ? ' ✓' : inningsIdx === 1 ? ' · LIVE' : ''}`}
            />
          )}
        </div>

        {/* Team Dual Scores */}
        {inn0 && inn1 && (inningsIdx === 1 || inn0.complete) && (
          <div style={{
            background: '#0a0f16', border: '1px solid #22c55e33',
            borderRadius: 10, padding: '14px 20px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12,
          }}>
            {[
              { name: teamA, dual: teamADual },
              { name: teamB, dual: teamBDual },
            ].map(({ name, dual }) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 4 }}>
                  {name} DUAL SCORE
                </div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 34, fontWeight: 900, color: '#22c55e' }}>{dual}</div>
              </div>
            ))}
          </div>
        )}

        {/* Match result */}
        {matchOver && (
          <div style={{
            background: 'linear-gradient(135deg, #0d2d1a, #111827)',
            border: '1px solid #22c55e44',
            borderRadius: 10, padding: '18px 24px', marginBottom: 20, textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 4, color: '#22c55e' }}>
              {getResult()}
            </div>
            {scoringMatch && (
              <div style={{ fontSize: 12, color: '#4b5563', fontFamily: 'Orbitron', marginTop: 8, letterSpacing: 1 }}>
                RESULT SAVED TO MATCH RECORD ✓
              </div>
            )}
            <button
              onClick={() => setActivePage('matches')}
              style={{
                marginTop: 14, background: '#22c55e15', border: '1px solid #22c55e44',
                color: '#22c55e', fontFamily: 'Orbitron', fontSize: 11, letterSpacing: 1,
                padding: '9px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
              }}
            >
              ← VIEW ALL MATCHES
            </button>
          </div>
        )}

        {/* Innings switch notice */}
        {!matchOver && inningsIdx === 1 && (
          <div style={{
            background: '#3b82f611', border: '1px solid #3b82f622',
            borderRadius: 8, padding: '10px 16px', marginBottom: 16,
            fontSize: 13, color: '#93c5fd', fontFamily: 'Orbitron', letterSpacing: 1,
          }}>
            ▶ 2ND INNINGS — {teamB} BATTING
          </div>
        )}

        {/* Event Buttons */}
        {!matchOver && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>
              RECORD DELIVERY
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(EVENT_LABELS).map(([key, { label, icon, color }]) => (
                <button
                  key={key}
                  onClick={() => handleEvent(key)}
                  style={{
                    background: `${color}15`, border: `1.5px solid ${color}44`,
                    borderRadius: 8, padding: '10px 14px', color, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    minWidth: 64, transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: 18 }}>{icon}</span>
                  <span style={{ fontFamily: 'Orbitron', fontSize: 8, letterSpacing: 1 }}>{label}</span>
                  <span style={{ fontSize: 10, color: `${color}aa`, fontFamily: 'Rajdhani' }}>
                    {(() => {
                      const s = calcScores(key, 0);
                      return `${s.bat >= 0 ? '+' : ''}${s.bat} / ${s.bowl >= 0 ? '+' : ''}${s.bowl}`;
                    })()}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#374151', fontFamily: 'Rajdhani' }}>
              Button shows: Batting score / Bowling score per delivery
            </div>
          </div>
        )}

        {/* Undo */}
        {!matchOver && activeInn && activeInn.balls.filter(b => b.event !== '_bonus').length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => {
                setInnings(prev => {
                  const all = [...prev] as [Innings | null, Innings | null];
                  const inn = { ...all[inningsIdx]! };
                  const balls = [...inn.balls.filter(b => b.event !== '_bonus')];
                  const last = balls.pop();
                  if (!last) return prev;
                  inn.balls = balls;
                  inn.batScore -= last.bat;
                  inn.bowlScore -= last.bowl;
                  if (last.event !== 'noball' && last.event !== 'wide') inn.legalBalls = Math.max(0, inn.legalBalls - 1);
                  if (last.event === 'wicket') inn.wickets = Math.max(0, inn.wickets - 1);
                  inn.complete = false;
                  all[inningsIdx] = inn;
                  syncToMatch(all[0], all[1], false);
                  return all;
                });
              }}
              style={{
                background: '#ef444415', border: '1px solid #ef444433',
                color: '#ef4444', fontFamily: 'Orbitron', fontSize: 11,
                letterSpacing: 1, padding: '8px 20px', borderRadius: 6, cursor: 'pointer',
              }}
            >
              ↩ UNDO LAST BALL
            </button>
          </div>
        )}

        {/* Ball-by-ball */}
        {(overs0.length > 0 || overs1.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: `1ST INNINGS · ${inn0?.battingTeam}`, overs: overs0 },
              { label: `2ND INNINGS · ${inn1?.battingTeam}`, overs: overs1 },
            ].map(({ label, overs }) => overs.length > 0 && (
              <div key={label} style={{
                background: '#0d1520', border: '1px solid #1f2937',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>
                  {label}
                </div>
                {overs.map((balls, oi) => <OverRow key={oi} over={oi} balls={balls} />)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <NoBallWideModal
          event={modal.event}
          onConfirm={handleModalConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}