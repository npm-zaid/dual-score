'use client';
import React, { useState, useEffect, useRef } from 'react';

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
  'T10': 10, 'T20': 20, 'ODI': 50, 'Test': 90,
};
function getOversFromFormat(format?: string): number {
  return FORMAT_OVERS[format ?? ''] ?? 20;
}

const BALLS_PER_OVER = 6;
const MAX_WICKETS = 10;

// ── Types ────────────────────────────────────────────────────────────────────
interface BatterStats {
  name: string; runs: number; balls: number;
  fours: number; sixes: number; dismissed: boolean; dotBalls: number;
}
interface BowlerStats {
  name: string; legalBalls: number; runs: number;
  wickets: number; wides: number; noBalls: number;
}
interface Ball {
  event: string; runs: number; bat: number; bowl: number;
  batter?: string; bowler?: string;
}
interface Innings {
  battingTeam: string; bowlingTeam: string;
  balls: Ball[]; batScore: number; bowlScore: number;
  legalBalls: number; wickets: number; complete: boolean;
  batters: BatterStats[]; bowlers: BowlerStats[];
  strikerIdx: number; nonStrikerIdx: number; bowlerIdx: number;
}

function initInnings(battingTeam: string, bowlingTeam: string): Innings {
  return {
    battingTeam, bowlingTeam, balls: [],
    batScore: 0, bowlScore: 0, legalBalls: 0, wickets: 0, complete: false,
    batters: [], bowlers: [], strikerIdx: 0, nonStrikerIdx: 1, bowlerIdx: 0,
  };
}
function newBatter(name: string): BatterStats {
  return { name, runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false, dotBalls: 0 };
}
function newBowler(name: string): BowlerStats {
  return { name, legalBalls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 };
}
function sr(runs: number, balls: number) { return balls === 0 ? '0.0' : ((runs / balls) * 100).toFixed(1); }
function economy(runs: number, lb: number) { return lb === 0 ? '0.00' : ((runs / lb) * 6).toFixed(2); }
function oversStr(lb: number) { return `${Math.floor(lb / 6)}.${lb % 6}`; }

// ── Shared modal styles ───────────────────────────────────────────────────────
const MODAL_BG: React.CSSProperties = {
  position: 'fixed', inset: 0, background: '#000000cc',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
};
const MODAL_CARD: React.CSSProperties = {
  background: '#0d1520', border: '1px solid #374151',
  borderRadius: 14, padding: 28, minWidth: 320, maxWidth: 440, width: '90%',
  position: 'relative', overflow: 'visible',
};
function ModalTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 3, color: '#f9fafb', marginBottom: 6 }}>{children}</div>;
}
function ModalSub({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani', marginBottom: 18 }}>{children}</div>;
}

// ── Player Dropdown ──────────────────────────────────────────────────────────
// Shows existing registered players + lets you add a new name by typing
function PlayerDropdown({ label, value, onChange, players, color = '#3b82f6', exclude = [] }: {
  label: string; value: string; onChange: (v: string) => void;
  players: string[]; color?: string; exclude?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Players eligible to show: not in exclude list
  const eligible = players.filter(p => !exclude.includes(p));
  // Filter by search
  const filtered = search.trim()
    ? eligible.filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : eligible;
  // Show "add new" option if typed name doesn't match any existing
  const typedUp = search.trim().toUpperCase();
  const canAdd = typedUp.length > 0 && !players.map(p => p.toUpperCase()).includes(typedUp) && !exclude.includes(typedUp);

  function select(name: string) {
    onChange(name);
    setSearch('');
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ marginBottom: 14, position: 'relative' }}>
      <div style={{ fontSize: 9, fontFamily: 'Orbitron', color, letterSpacing: 2, marginBottom: 5 }}>{label}</div>

      {/* Trigger button */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: '#111827', border: `1px solid ${open ? color : color + '44'}`,
          borderRadius: 7, color: value ? '#f9fafb' : '#4b5563',
          fontSize: 15, fontFamily: 'Bebas Neue', letterSpacing: 2,
          padding: '10px 14px', cursor: 'pointer', boxSizing: 'border-box',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'border-color 0.15s',
        }}
      >
        <span>{value || 'SELECT PLAYER'}</span>
        <span style={{ fontSize: 10, color, marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#0d1a2a', border: `1px solid ${color}55`,
          borderRadius: 8, zIndex: 999,
          boxShadow: '0 12px 40px #000000bb',
          overflow: 'hidden',
        }}>
          {/* Search / type new */}
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${color}22` }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search or type new name..."
              style={{
                width: '100%', background: '#111827', border: `1px solid ${color}33`,
                borderRadius: 5, color: '#f9fafb', fontSize: 12,
                fontFamily: 'Rajdhani', padding: '6px 10px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.map(p => (
              <div
                key={p}
                onClick={() => select(p)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1,
                  color: p === value ? color : '#f9fafb',
                  background: p === value ? `${color}22` : 'transparent',
                  borderLeft: `3px solid ${p === value ? color : 'transparent'}`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (p !== value) (e.currentTarget as HTMLDivElement).style.background = `${color}11`; }}
                onMouseLeave={e => { if (p !== value) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {p}
              </div>
            ))}

            {/* Add new */}
            {canAdd && (
              <div
                onClick={() => select(typedUp)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, color,
                  borderTop: filtered.length > 0 ? `1px solid ${color}22` : 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${color}18`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span> ADD "{typedUp}"
              </div>
            )}

            {filtered.length === 0 && !canAdd && (
              <div style={{ padding: '12px 14px', color: '#4b5563', fontFamily: 'Rajdhani', fontSize: 12 }}>
                No players found. Type a name to add.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Opening setup modal ───────────────────────────────────────────────────────
function OpeningSetupModal({ battingTeam, bowlingTeam, battingPlayers, bowlingPlayers, onConfirm }: {
  battingTeam: string; bowlingTeam: string;
  battingPlayers: string[]; bowlingPlayers: string[];
  onConfirm: (striker: string, nonStriker: string, bowler: string) => void;
}) {
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const valid = striker && nonStriker && bowler && striker !== nonStriker;

  return (
    <div style={MODAL_BG}>
      <div style={{ ...MODAL_CARD, overflow: 'visible' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, transparent, #22c55e, transparent)' }} />
        <ModalTitle>OPENING PLAYERS</ModalTitle>
        <ModalSub>Select opening batters & bowler to start the innings</ModalSub>

        <PlayerDropdown
          label={`⚡ STRIKER · ${battingTeam}`}
          value={striker} onChange={setStriker}
          players={battingPlayers} color="#22c55e"
          exclude={[nonStriker]}
        />
        <PlayerDropdown
          label={`• NON-STRIKER · ${battingTeam}`}
          value={nonStriker} onChange={setNonStriker}
          players={battingPlayers} color="#3b82f6"
          exclude={[striker]}
        />
        <PlayerDropdown
          label={`🎯 OPENING BOWLER · ${bowlingTeam}`}
          value={bowler} onChange={setBowler}
          players={bowlingPlayers} color="#f97316"
        />

        <button
          disabled={!valid}
          onClick={() => valid && onConfirm(striker, nonStriker, bowler)}
          style={{
            width: '100%', marginTop: 8,
            background: valid ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#1f2937',
            border: 'none', borderRadius: 8, color: valid ? '#000' : '#374151',
            fontFamily: 'Orbitron', fontWeight: 900, fontSize: 13, letterSpacing: 2,
            padding: '12px', cursor: valid ? 'pointer' : 'not-allowed',
          }}
        >START INNINGS →</button>
      </div>
    </div>
  );
}

// ── New batter modal (after wicket) ──────────────────────────────────────────
function NewBatterModal({ battingTeam, wicketBatter, battingPlayers, activeBatters, onConfirm }: {
  battingTeam: string; wicketBatter: string;
  battingPlayers: string[]; activeBatters: string[];
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState('');
  // Exclude already-used batters (except dismissed one who is already marked dismissed)
  const exclude = activeBatters;

  return (
    <div style={MODAL_BG}>
      <div style={{ ...MODAL_CARD, overflow: 'visible' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />
        <div style={{ marginBottom: 14, background: '#ef444415', border: '1px solid #ef444433', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#ef4444', letterSpacing: 2 }}>WICKET!</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: '#f9fafb', letterSpacing: 2, marginTop: 2 }}>{wicketBatter} OUT</div>
        </div>
        <ModalTitle>NEW BATTER IN</ModalTitle>
        <ModalSub>Who comes in next for {battingTeam}?</ModalSub>

        <PlayerDropdown
          label={`NEW BATTER · ${battingTeam}`}
          value={name} onChange={setName}
          players={battingPlayers} color="#22c55e"
          exclude={exclude}
        />

        <button
          disabled={!name}
          onClick={() => name && onConfirm(name)}
          style={{
            width: '100%', marginTop: 8,
            background: name ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#1f2937',
            border: 'none', borderRadius: 8, color: name ? '#000' : '#374151',
            fontFamily: 'Orbitron', fontWeight: 900, fontSize: 13, letterSpacing: 2,
            padding: '12px', cursor: name ? 'pointer' : 'not-allowed',
          }}
        >SEND IN →</button>
      </div>
    </div>
  );
}

// ── New bowler modal (after over) ─────────────────────────────────────────────
function NewBowlerModal({ bowlingTeam, lastBowler, overNumber, bowlingPlayers, onConfirm }: {
  bowlingTeam: string; lastBowler: string; overNumber: number;
  bowlingPlayers: string[];
  onConfirm: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const invalid = name === lastBowler;

  return (
    <div style={MODAL_BG}>
      <div style={{ ...MODAL_CARD, overflow: 'visible' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '14px 14px 0 0', background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }} />
        <div style={{ marginBottom: 14, background: '#f9731615', border: '1px solid #f9731633', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#f97316', letterSpacing: 2 }}>END OF OVER {overNumber}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Rajdhani', marginTop: 2 }}>{lastBowler} completed the over</div>
        </div>
        <ModalTitle>NEXT BOWLER</ModalTitle>
        <ModalSub>Cannot be {lastBowler} (no consecutive overs)</ModalSub>

        <PlayerDropdown
          label={`🎯 BOWLER · ${bowlingTeam}`}
          value={name} onChange={setName}
          players={bowlingPlayers} color="#f97316"
          exclude={[lastBowler]}
        />

        <button
          disabled={!name || invalid}
          onClick={() => name && !invalid && onConfirm(name)}
          style={{
            width: '100%', marginTop: 8,
            background: (name && !invalid) ? 'linear-gradient(135deg, #ea580c, #f97316)' : '#1f2937',
            border: 'none', borderRadius: 8, color: (name && !invalid) ? '#000' : '#374151',
            fontFamily: 'Orbitron', fontWeight: 900, fontSize: 13, letterSpacing: 2,
            padding: '12px', cursor: (name && !invalid) ? 'pointer' : 'not-allowed',
          }}
        >BOWL →</button>
      </div>
    </div>
  );
}

// ── No-ball / Wide modal ──────────────────────────────────────────────────────
function NoBallWideModal({ event, onConfirm, onCancel }: {
  event: string; onConfirm: (runs: number) => void; onCancel: () => void;
}) {
  const [runs, setRuns] = useState(0);
  return (
    <div style={MODAL_BG}>
      <div style={MODAL_CARD}>
        <ModalTitle>{event === 'noball' ? 'NO BALL' : 'WIDE'} — EXTRA RUNS?</ModalTitle>
        <ModalSub>
          {event === 'noball'
            ? 'Runs scored off the no-ball (0 = only no-ball extra). No-ball = legal delivery.'
            : 'Runs scored off the wide (0 = only wide extra). Wide = NOT a legal delivery.'}
        </ModalSub>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22, justifyContent: 'center' }}>
          <button onClick={() => setRuns(r => Math.max(0, r - 1))} style={btnStyle('#374151', '#9ca3af')}>−</button>
          <div style={{ fontFamily: 'Orbitron', fontSize: 36, fontWeight: 900, color: '#f9fafb', minWidth: 50, textAlign: 'center' }}>{runs}</div>
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
    padding: full ? '10px 20px' : '10px 16px',
    borderRadius: 6, cursor: 'pointer', flex: full ? 1 : undefined,
  };
}

// ── ScoreBoard ────────────────────────────────────────────────────────────────
function ScoreBoard({ inn, label, inningsNum, otherInn }: {
  inn: Innings; label: string; inningsNum: number; otherInn?: Innings | null;
}) {
  const overs = Math.floor(inn.legalBalls / 6);
  const balls = inn.legalBalls % 6;

  if (inningsNum === 0) {
    return (
      <div style={{ background: '#0a0f16', border: '1px solid #1f2937', borderRadius: 10, padding: '16px 20px', flex: 1, position: 'relative', overflow: 'hidden', minWidth: 220 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #3b82f688, transparent)' }} />
        <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 10 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 30, fontWeight: 900, color: '#f9fafb', lineHeight: 1 }}>
            {inn.batScore}<span style={{ fontSize: 18, color: '#ef4444' }}>/{inn.wickets}</span>
          </span>
          <span style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{overs}.{balls} Ov</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#3b82f611', border: '1px solid #3b82f633', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#3b82f6', letterSpacing: 1, marginBottom: 3 }}>BATTING</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{inn.battingTeam}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 2 }}>BAT SCORE</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{inn.batScore}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9731611', border: '1px solid #f9731633', borderRadius: 6, padding: '8px 12px' }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#f97316', letterSpacing: 1, marginBottom: 3 }}>BOWLING</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{inn.bowlingTeam}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 2 }}>BOWL SCORE</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{inn.bowlScore}</div>
          </div>
        </div>
      </div>
    );
  }

  const battingTeamDual = inn.batScore + (otherInn?.bowlScore ?? 0);
  const bowlingTeamDual = inn.bowlScore + (otherInn?.batScore ?? 0);
  return (
    <div style={{ background: '#0a0f16', border: '1px solid #22c55e33', borderRadius: 10, padding: '16px 20px', flex: 1, position: 'relative', overflow: 'hidden', minWidth: 220 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #22c55e88, transparent)' }} />
      <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: 30, fontWeight: 900, color: '#f9fafb', lineHeight: 1 }}>
          {inn.batScore}<span style={{ fontSize: 18, color: '#ef4444' }}>/{inn.wickets}</span>
        </span>
        <span style={{ fontFamily: 'Orbitron', fontSize: 13, color: '#22c55e', fontWeight: 700 }}>{overs}.{balls} Ov</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#22c55e', letterSpacing: 1, marginBottom: 3 }}>BATTING · DUAL</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{inn.battingTeam}</div>
          <div style={{ fontSize: 9, fontFamily: 'Rajdhani', color: '#4b5563', marginTop: 3 }}>Bat {inn.batScore} + Bowl¹ {otherInn?.bowlScore ?? 0}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 2 }}>DUAL SCORE</div>
          <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>{battingTeamDual}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#a3e63511', border: '1px solid #a3e63533', borderRadius: 6, padding: '8px 12px' }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#a3e635', letterSpacing: 1, marginBottom: 3 }}>BOWLING · DUAL</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{inn.bowlingTeam}</div>
          <div style={{ fontSize: 9, fontFamily: 'Rajdhani', color: '#4b5563', marginTop: 3 }}>Bowl {inn.bowlScore} + Bat¹ {otherInn?.batScore ?? 0}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 2 }}>DUAL SCORE</div>
          <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#a3e635', lineHeight: 1 }}>{bowlingTeamDual}</div>
        </div>
      </div>
    </div>
  );
}

// ── Crease Panel ──────────────────────────────────────────────────────────────
function CreasePanel({ inn }: { inn: Innings }) {
  const striker = inn.batters[inn.strikerIdx];
  const nonStriker = inn.batters[inn.nonStrikerIdx];
  const bowler = inn.bowlers[inn.bowlerIdx];
  if (!striker || !bowler) return null;
  return (
    <div style={{ background: '#0a1018', border: '1px solid #1a2540', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 140, background: '#22c55e0d', border: '1px solid #22c55e22', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 8, fontFamily: 'Orbitron', color: '#22c55e', letterSpacing: 2, marginBottom: 4 }}>⚡ ON STRIKE</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{striker.name}</div>
        <div style={{ marginTop: 5, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{striker.runs}</span>
          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani', alignSelf: 'flex-end', paddingBottom: 2 }}>({striker.balls}b) SR {sr(striker.runs, striker.balls)}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563', fontFamily: 'Rajdhani' }}>4s: {striker.fours}  6s: {striker.sixes}</div>
      </div>
      {nonStriker && (
        <div style={{ flex: 1, minWidth: 140, background: '#3b82f60d', border: '1px solid #3b82f622', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 8, fontFamily: 'Orbitron', color: '#3b82f6', letterSpacing: 2, marginBottom: 4 }}>NON-STRIKER</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{nonStriker.name}</div>
          <div style={{ marginTop: 5, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#3b82f6' }}>{nonStriker.runs}</span>
            <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani', alignSelf: 'flex-end', paddingBottom: 2 }}>({nonStriker.balls}b) SR {sr(nonStriker.runs, nonStriker.balls)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563', fontFamily: 'Rajdhani' }}>4s: {nonStriker.fours}  6s: {nonStriker.sixes}</div>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 140, background: '#f973160d', border: '1px solid #f9731622', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 8, fontFamily: 'Orbitron', color: '#f97316', letterSpacing: 2, marginBottom: 4 }}>🎯 BOWLING</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{bowler.name}</div>
        <div style={{ marginTop: 5, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#f97316' }}>{bowler.wickets}/{bowler.runs}</span>
          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani', alignSelf: 'flex-end', paddingBottom: 2 }}>({oversStr(bowler.legalBalls)} ov) Econ {economy(bowler.runs, bowler.legalBalls)}</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563', fontFamily: 'Rajdhani' }}>WD: {bowler.wides}  NB: {bowler.noBalls}</div>
      </div>
    </div>
  );
}

// ── Scorecard ─────────────────────────────────────────────────────────────────
function ScorecardTable({ inn }: { inn: Innings }) {
  const { batters, bowlers } = inn;
  if (batters.length === 0 && bowlers.length === 0) return null;
  return (
    <div style={{ background: '#0a0f16', border: '1px solid #1f2937', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
      {batters.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#3b82f6', letterSpacing: 2, marginBottom: 10 }}>🏏 {inn.battingTeam} BATTING</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Rajdhani' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['BATTER','R','B','4s','6s','SR','STATUS'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: h==='BATTER'?'left':'right', fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 1, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batters.map((b, i) => {
                  const isStriker = !inn.complete && i === inn.strikerIdx;
                  const isNS = !inn.complete && i === inn.nonStrikerIdx;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #0d1520', background: isStriker ? '#22c55e08' : isNS ? '#3b82f608' : 'transparent' }}>
                      <td style={{ padding: '7px 8px', color: b.dismissed ? '#6b7280' : '#f9fafb', fontWeight: 700 }}>
                        {isStriker && <span style={{ color: '#22c55e', marginRight: 4 }}>⚡</span>}
                        {isNS && <span style={{ color: '#3b82f6', marginRight: 4 }}>•</span>}
                        {b.name}
                        {b.dismissed && <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 6 }}>†</span>}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', fontWeight: 900, color: b.dismissed ? '#6b7280' : '#f9fafb', fontSize: 13 }}>{b.runs}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#6b7280' }}>{b.balls}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#f97316' }}>{b.fours}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#22c55e' }}>{b.sixes}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>{sr(b.runs, b.balls)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 10 }}>
                        {b.dismissed ? <span style={{ color: '#ef4444' }}>OUT</span>
                          : isStriker ? <span style={{ color: '#22c55e' }}>BATTING*</span>
                          : <span style={{ color: '#3b82f6' }}>NOT OUT</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {bowlers.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#f97316', letterSpacing: 2, marginBottom: 10 }}>🎯 {inn.bowlingTeam} BOWLING</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Rajdhani' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['BOWLER','O','R','W','WD','NB','ECON'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: h==='BOWLER'?'left':'right', fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 1, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bowlers.map((b, i) => {
                  const isCurrent = !inn.complete && i === inn.bowlerIdx;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #0d1520', background: isCurrent ? '#f9731608' : 'transparent' }}>
                      <td style={{ padding: '7px 8px', color: '#f9fafb', fontWeight: 700 }}>
                        {isCurrent && <span style={{ color: '#f97316', marginRight: 4 }}>🎯</span>}
                        {b.name}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', color: '#9ca3af', fontSize: 11 }}>{oversStr(b.legalBalls)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', fontWeight: 900, color: '#f9fafb', fontSize: 13 }}>{b.runs}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', fontWeight: 900, color: b.wickets > 0 ? '#ef4444' : '#6b7280', fontSize: 13 }}>{b.wickets}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#a855f7' }}>{b.wides}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#eab308' }}>{b.noBalls}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>{economy(b.runs, b.legalBalls)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ball-by-ball ──────────────────────────────────────────────────────────────
function BallDot({ b }: { b: Ball }) {
  const meta = EVENT_LABELS[b.event] || { color: '#6b7280', icon: '?', label: '?' };
  return (
    <div
      title={`${b.batter ?? ''} vs ${b.bowler ?? ''} | ${meta.label} | Bat:${b.bat>=0?'+':''}${b.bat} Bowl:${b.bowl>=0?'+':''}${b.bowl}`}
      style={{
        width: 28, height: 28, borderRadius: '50%',
        background: `${meta.color}22`, border: `1.5px solid ${meta.color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, color: meta.color,
        cursor: 'default', flexShrink: 0,
      }}
    >{meta.icon}</div>
  );
}
function OverRow({ over, balls }: { over: number; balls: Ball[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1a2030' }}>
      <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', width: 28, flexShrink: 0 }}>O{over + 1}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {balls.map((b, i) => <BallDot key={i} b={b} />)}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type ModalState =
  | { type: 'opening'; inningsIdx: number }
  | { type: 'newBatter'; dismissedName: string }
  | { type: 'newBowler'; overNumber: number }
  | { type: 'extraRuns'; event: string };

export default function BCLScoring({ scoringMatch, updateMatch, setActivePage }: {
  scoringMatch?: any; updateMatch?: (m: any) => void; setActivePage?: (p: string) => void;
}) {
  const TOTAL_OVERS = getOversFromFormat(scoringMatch?.format);
  const TOTAL_BALLS = TOTAL_OVERS * BALLS_PER_OVER;

  const [teamA, setTeamA] = useState(scoringMatch?.teamA?.shortName || scoringMatch?.teamA?.name || 'TEAM A');
  const [teamB, setTeamB] = useState(scoringMatch?.teamB?.shortName || scoringMatch?.teamB?.name || 'TEAM B');

  // Player rosters — sourced from scoringMatch if available, else built up during scoring
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>(() =>
    (scoringMatch?.teamA?.players || []).map((p: any) => (p.name || p).toString().toUpperCase())
  );
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>(() =>
    (scoringMatch?.teamB?.players || []).map((p: any) => (p.name || p).toString().toUpperCase())
  );

  const [started, setStarted] = useState(false);
  const [inningsIdx, setInningsIdx] = useState(0);
  const [innings, setInnings] = useState<[Innings | null, Innings | null]>([null, null]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [matchOver, setMatchOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'score' | 'scorecard' | 'balls'>('score');
  const prevLegalBalls = useRef<number>(0);
  const prevWicketBallIdx = useRef<number>(-1);

  // Ensure new player names get added to the roster
  function ensurePlayer(team: 'A' | 'B', name: string) {
    if (team === 'A') setTeamAPlayers(p => p.includes(name) ? p : [...p, name]);
    else setTeamBPlayers(p => p.includes(name) ? p : [...p, name]);
  }

  // Who is batting/bowling in each innings
  // innings 0: teamA bats, teamB bowls
  // innings 1: teamB bats, teamA bowls
  function battingTeamPlayers(innIdx: number) { return innIdx === 0 ? teamAPlayers : teamBPlayers; }
  function bowlingTeamPlayers(innIdx: number)  { return innIdx === 0 ? teamBPlayers : teamAPlayers; }
  function battingTeamLabel(innIdx: number)    { return innIdx === 0 ? 'A' : 'B'; }
  function bowlingTeamLabel(innIdx: number)    { return innIdx === 0 ? 'B' : 'A'; }

  function syncToMatch(inn0: Innings | null, inn1: Innings | null, isOver: boolean) {
    if (!scoringMatch || !updateMatch) return;
    if (!inn0) return;
    const teamADual = inn0.batScore + (inn1?.bowlScore ?? 0);
    const teamBDual = (inn1?.batScore ?? 0) + inn0.bowlScore;
    let result: string | undefined;
    if (isOver && inn1) {
      if (teamADual > teamBDual) result = `${teamA} WINS! (${teamADual} vs ${teamBDual})`;
      else if (teamBDual > teamADual) result = `${teamB} WINS! (${teamBDual} vs ${teamADual})`;
      else result = `MATCH TIED! (${teamADual} each)`;
    }
    updateMatch({ ...scoringMatch, status: isOver ? 'completed' : 'live', scoreA: String(teamADual), scoreB: String(teamBDual), result: result ?? scoringMatch.result });
  }

  function startMatch() {
    const i0 = initInnings(teamA, teamB);
    const i1 = initInnings(teamB, teamA);
    setInnings([i0, i1]);
    setInningsIdx(0);
    setStarted(true);
    setMatchOver(false);
    prevLegalBalls.current = 0;
    prevWicketBallIdx.current = -1;
    setModal({ type: 'opening', inningsIdx: 0 });
    if (scoringMatch && updateMatch) updateMatch({ ...scoringMatch, status: 'live' });
  }

  function handleOpeningSetup(striker: string, nonStriker: string, bowler: string, innIdx: number) {
    ensurePlayer(battingTeamLabel(innIdx), striker);
    ensurePlayer(battingTeamLabel(innIdx), nonStriker);
    ensurePlayer(bowlingTeamLabel(innIdx), bowler);
    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[innIdx]! };
      inn.batters = [newBatter(striker), newBatter(nonStriker)];
      inn.bowlers = [newBowler(bowler)];
      inn.strikerIdx = 0; inn.nonStrikerIdx = 1; inn.bowlerIdx = 0;
      all[innIdx] = inn;
      return all;
    });
    setModal(null);
  }

  function applyEvent(event: string, runs = 0) {
    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[inningsIdx]! };
      const striker = inn.batters[inn.strikerIdx];
      const bowler = inn.bowlers[inn.bowlerIdx];
      if (!striker || !bowler) return prev;

      const ballsCopy = [...inn.balls];
      const battersCopy = inn.batters.map(b => ({ ...b }));
      const bowlersCopy = inn.bowlers.map(b => ({ ...b }));
      const { bat, bowl } = calcScores(event, runs);
      const isLegal = event !== 'wide';
      const isWicket = event === 'wicket';

      ballsCopy.push({ event, runs, bat, bowl, batter: striker.name, bowler: bowler.name });

      const batStat = battersCopy[inn.strikerIdx];
      if (isLegal) batStat.balls += 1;
      if (!isWicket) batStat.runs += bat;
      if (event === 'four') batStat.fours += 1;
      if (event === 'six') batStat.sixes += 1;
      if (bat === 0 && isLegal) batStat.dotBalls += 1;
      if (isWicket) batStat.dismissed = true;

      const bowlStat = bowlersCopy[inn.bowlerIdx];
      if (isLegal) bowlStat.legalBalls += 1;
      if (!isWicket) bowlStat.runs += Math.max(0, bat);
      else bowlStat.wickets += 1;
      if (event === 'wide') bowlStat.wides += 1;
      if (event === 'noball') bowlStat.noBalls += 1;

      inn.batScore += bat;
      inn.bowlScore += bowl;
      if (isLegal) inn.legalBalls += 1;
      if (isWicket) inn.wickets += 1;
      inn.balls = ballsCopy;
      inn.batters = battersCopy;
      inn.bowlers = bowlersCopy;

      if (event === 'single' || event === 'triple') {
        [inn.strikerIdx, inn.nonStrikerIdx] = [inn.nonStrikerIdx, inn.strikerIdx];
      }

      const allOut = inn.wickets >= MAX_WICKETS;
      const oversUp = inn.legalBalls >= TOTAL_BALLS;
      if (allOut || oversUp) {
        if (allOut && !oversUp) {
          const remaining = TOTAL_BALLS - inn.legalBalls;
          inn.bowlScore += remaining * 4;
          inn.balls = [...inn.balls, { event: '_bonus', runs: 0, bat: 0, bowl: remaining * 4 }];
        }
        inn.complete = true;
      }

      all[inningsIdx] = inn;
      const isMatchOver = inningsIdx === 1 && inn.complete;
      syncToMatch(all[0], all[1], isMatchOver);
      return all;
    });
  }

  useEffect(() => {
    if (!started || modal) return;
    const inn = innings[inningsIdx];
    if (!inn) return;

    if (inn.complete) {
      if (inningsIdx === 0) {
        setTimeout(() => { setInningsIdx(1); prevWicketBallIdx.current = -1; setModal({ type: 'opening', inningsIdx: 1 }); }, 600);
      } else {
        setMatchOver(true);
      }
      return;
    }

    const currentLegal = inn.legalBalls;
    if (currentLegal > 0 && currentLegal % 6 === 0 && currentLegal !== prevLegalBalls.current) {
      prevLegalBalls.current = currentLegal;
      setInnings(prev => {
        const all = [...prev] as [Innings | null, Innings | null];
        const i = { ...all[inningsIdx]! };
        [i.strikerIdx, i.nonStrikerIdx] = [i.nonStrikerIdx, i.strikerIdx];
        all[inningsIdx] = i;
        return all;
      });
      setModal({ type: 'newBowler', overNumber: currentLegal / 6 });
      return;
    }
    prevLegalBalls.current = currentLegal;

    const realBalls = inn.balls.filter(b => b.event !== '_bonus');
    const lastBallIdx = realBalls.length - 1;
    const lastBall = realBalls[lastBallIdx];
    if (lastBall?.event === 'wicket' && inn.wickets < MAX_WICKETS && lastBallIdx !== prevWicketBallIdx.current) {
      prevWicketBallIdx.current = lastBallIdx;
      setModal({ type: 'newBatter', dismissedName: lastBall.batter ?? 'BATTER' });
    }
  }, [innings, inningsIdx, started]);

  function handleNewBatter(name: string) {
    ensurePlayer(battingTeamLabel(inningsIdx), name);
    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[inningsIdx]! };
      const newIdx = inn.batters.length;
      inn.batters = [...inn.batters, newBatter(name)];
      inn.strikerIdx = newIdx;
      all[inningsIdx] = inn;
      return all;
    });
    setModal(null);
  }

  function handleNewBowler(name: string) {
    ensurePlayer(bowlingTeamLabel(inningsIdx), name);
    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[inningsIdx]! };
      const existingIdx = inn.bowlers.findIndex(b => b.name === name);
      if (existingIdx >= 0) { inn.bowlerIdx = existingIdx; }
      else { inn.bowlers = [...inn.bowlers, newBowler(name)]; inn.bowlerIdx = inn.bowlers.length - 1; }
      all[inningsIdx] = inn;
      return all;
    });
    setModal(null);
  }

  function handleEvent(event: string) {
    if (matchOver || modal) return;
    const inn = innings[inningsIdx];
    if (!inn || inn.batters.length === 0) return;
    if (event === 'noball' || event === 'wide') setModal({ type: 'extraRuns', event });
    else applyEvent(event);
  }

  function undoLastBall() {
    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[inningsIdx]! };
      const realBalls = inn.balls.filter(b => b.event !== '_bonus');
      if (realBalls.length === 0) return prev;
      const last = realBalls[realBalls.length - 1];
      inn.balls = realBalls.slice(0, -1);
      inn.batScore -= last.bat; inn.bowlScore -= last.bowl;
      if (last.event !== 'wide') inn.legalBalls = Math.max(0, inn.legalBalls - 1);
      if (last.event === 'wicket') inn.wickets = Math.max(0, inn.wickets - 1);
      inn.complete = false;
      const battersCopy = inn.batters.map(b => ({ ...b }));
      const bIdx = battersCopy.findIndex(b => b.name === last.batter);
      if (bIdx >= 0) {
        const b = battersCopy[bIdx];
        if (last.event !== 'wide') b.balls = Math.max(0, b.balls - 1);
        if (last.event !== 'wicket') b.runs -= last.bat;
        if (last.event === 'four') b.fours = Math.max(0, b.fours - 1);
        if (last.event === 'six') b.sixes = Math.max(0, b.sixes - 1);
        if (last.event === 'wicket') b.dismissed = false;
      }
      inn.batters = battersCopy;
      const bowlersCopy = inn.bowlers.map(b => ({ ...b }));
      const bowlIdx = bowlersCopy.findIndex(b => b.name === last.bowler);
      if (bowlIdx >= 0) {
        const b = bowlersCopy[bowlIdx];
        if (last.event !== 'wide') b.legalBalls = Math.max(0, b.legalBalls - 1);
        if (last.event !== 'wicket') b.runs -= Math.max(0, last.bat);
        else b.wickets = Math.max(0, b.wickets - 1);
        if (last.event === 'wide') b.wides = Math.max(0, b.wides - 1);
        if (last.event === 'noball') b.noBalls = Math.max(0, b.noBalls - 1);
      }
      inn.bowlers = bowlersCopy;
      all[inningsIdx] = inn;
      syncToMatch(all[0], all[1], false);
      return all;
    });
    prevLegalBalls.current = innings[inningsIdx]?.legalBalls ?? 0;
    // If we undid a wicket, step back the wicket pointer so it can re-fire if needed
    const afterUndo = innings[inningsIdx]?.balls.filter(b => b.event !== '_bonus') ?? [];
    prevWicketBallIdx.current = afterUndo.length - 1;
  }

  function groupOvers(inn: Innings | null) {
    if (!inn) return [];
    const overs: Ball[][] = [];
    let cur: Ball[] = []; let legal = 0;
    for (const b of inn.balls) {
      if (b.event === '_bonus') continue;
      cur.push(b);
      if (b.event !== 'wide') { legal++; if (legal % 6 === 0) { overs.push(cur); cur = []; } }
    }
    if (cur.length) overs.push(cur);
    return overs;
  }

  function getResult() {
    const i0 = innings[0], i1 = innings[1];
    if (!i0 || !i1) return '';
    const aD = i0.batScore + i1.bowlScore, bD = i1.batScore + i0.bowlScore;
    if (aD > bD) return `${teamA} WINS! (${aD} vs ${bD})`;
    if (bD > aD) return `${teamB} WINS! (${bD} vs ${aD})`;
    return `MATCH TIED! (${aD} each)`;
  }

  const inn0 = innings[0], inn1 = innings[1], activeInn = innings[inningsIdx];
  const overs0 = groupOvers(inn0), overs1 = groupOvers(inn1);
  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');`;

  // ── Setup Screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: '#060c14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{`${FONTS} * { box-sizing: border-box; margin: 0; padding: 0; } input { outline: none; } button:hover { filter: brightness(1.15); }`}</style>
        <div style={{ background: '#0d1520', border: '1px solid #1f2937', borderRadius: 16, padding: '36px 40px', maxWidth: 440, width: '100%', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #22c55e, transparent)' }} />
          {setActivePage && (
            <button onClick={() => setActivePage('matches')} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: '1px solid #1f2937', color: '#4b5563', fontFamily: 'Orbitron', fontSize: 9, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}>← BACK</button>
          )}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏏</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: 4, color: '#f9fafb' }}>BCL SCORER</div>
            <div style={{ fontSize: 11, color: '#22c55e', fontFamily: 'Orbitron', letterSpacing: 3, marginTop: 2 }}>BOUNDARY CRICKET LEAGUE</div>
          </div>
          {[
            { label: 'TEAM A (Batting First)', val: teamA, set: setTeamA },
            { label: 'TEAM B (Bowling First)', val: teamB, set: setTeamB },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 6 }}>{label}</div>
              <input value={val} onChange={e => set(e.target.value.toUpperCase())} style={{ width: '100%', background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 16, fontFamily: 'Bebas Neue', letterSpacing: 2, padding: '12px 16px' }} />
            </div>
          ))}
          <button onClick={startMatch} style={{ width: '100%', marginTop: 8, background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', borderRadius: 8, color: '#000', fontFamily: 'Orbitron', fontWeight: 900, fontSize: 14, letterSpacing: 2, padding: '14px', cursor: 'pointer', boxShadow: '0 0 20px #22c55e44' }}>
            START MATCH →
          </button>
          <div style={{ marginTop: 16, fontSize: 11, color: '#374151', textAlign: 'center', fontFamily: 'Rajdhani' }}>
            {TOTAL_OVERS} Overs · 10 Wickets · BCL Dual Score System · Player Tracking
          </div>
        </div>
      </div>
    );
  }

  // ── Scoring Screen ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#060c14', color: '#f9fafb', fontFamily: 'Rajdhani', paddingBottom: 60 }}>
      <style>{`${FONTS} * { box-sizing: border-box; margin: 0; padding: 0; } button:hover { filter: brightness(1.2); } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1520; } ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; } input { outline: none; }`}</style>

      {/* Header */}
      <div style={{ background: '#0a0f16', borderBottom: '1px solid #1f2937', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🏏</span>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 3 }}>BCL SCORER</div>
            <div style={{ fontSize: 9, color: '#22c55e', fontFamily: 'Orbitron', letterSpacing: 2 }}>
              INNINGS {inningsIdx + 1} OF 2 · {TOTAL_OVERS} OV{matchOver && ' · COMPLETE'}
            </div>
          </div>
          {!matchOver && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#22c55e11', border: '1px solid #22c55e22', borderRadius: 20, padding: '3px 10px', marginLeft: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#22c55e', letterSpacing: 1 }}>LIVE</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {setActivePage && <button onClick={() => setActivePage('matches')} style={{ background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', fontFamily: 'Orbitron', fontSize: 10, padding: '6px 14px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}>← MATCHES</button>}
          <button onClick={startMatch} style={{ background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', fontFamily: 'Orbitron', fontSize: 10, padding: '6px 14px', borderRadius: 4, cursor: 'pointer', letterSpacing: 1 }}>NEW</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: '#0a0f16', borderBottom: '1px solid #1f2937', padding: '0 20px', display: 'flex' }}>
        {(
          [['score','📊 SCORE'], ['scorecard','📋 SCORECARD'], ['balls','⚽ BALL-BY-BALL']] as [string,string][]
        ).map(([tab, lbl]) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
            background: 'transparent', border: 'none',
            borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
            color: activeTab === tab ? '#22c55e' : '#4b5563',
            fontFamily: 'Orbitron', fontSize: 9, letterSpacing: 1,
            padding: '12px 16px', cursor: 'pointer',
          }}>{lbl}</button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── SCORE TAB ── */}
        {activeTab === 'score' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {inn0 && <ScoreBoard inn={inn0} label={`1ST INNINGS${inn0.complete ? ' ✓' : inningsIdx === 0 ? ' · LIVE' : ''}`} inningsNum={0} />}
              {inn1 && <ScoreBoard inn={inn1} label={`2ND INNINGS${inn1.complete ? ' ✓' : inningsIdx === 1 ? ' · LIVE' : ''}`} inningsNum={1} otherInn={inn0} />}
            </div>

            {!matchOver && activeInn && activeInn.batters.length > 0 && !modal && <CreasePanel inn={activeInn} />}

            {matchOver && (
              <div style={{ background: 'linear-gradient(135deg, #0d2d1a, #111827)', border: '1px solid #22c55e44', borderRadius: 10, padding: '18px 24px', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 4, color: '#22c55e' }}>{getResult()}</div>
                <button onClick={() => setActiveTab('scorecard')} style={{ marginTop: 14, background: '#3b82f615', border: '1px solid #3b82f644', color: '#3b82f6', fontFamily: 'Orbitron', fontSize: 11, letterSpacing: 1, padding: '9px 24px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>VIEW SCORECARD →</button>
              </div>
            )}

            {!matchOver && inningsIdx === 1 && (
              <div style={{ background: '#3b82f611', border: '1px solid #3b82f622', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#93c5fd', fontFamily: 'Orbitron', letterSpacing: 1 }}>
                ▶ 2ND INNINGS — {teamB} BATTING
              </div>
            )}

            {!matchOver && activeInn && activeInn.batters.length > 0 && !modal && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>RECORD DELIVERY</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(EVENT_LABELS).map(([key, { label, icon, color }]) => (
                    <button key={key} onClick={() => handleEvent(key)} style={{
                      background: `${color}15`, border: `1.5px solid ${color}44`,
                      borderRadius: 8, padding: '10px 14px', color, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 64,
                    }}>
                      <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: 18 }}>{icon}</span>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 8, letterSpacing: 1 }}>{label}</span>
                      <span style={{ fontSize: 10, color: `${color}aa`, fontFamily: 'Rajdhani' }}>
                        {(() => { const s = calcScores(key, 0); return `${s.bat>=0?'+':''}${s.bat} / ${s.bowl>=0?'+':''}${s.bowl}`; })()}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#374151', fontFamily: 'Rajdhani' }}>Button shows: Batting score / Bowling score per delivery</div>
              </div>
            )}

            {!matchOver && activeInn && activeInn.balls.filter(b => b.event !== '_bonus').length > 0 && !modal && (
              <button onClick={undoLastBall} style={{ background: '#ef444415', border: '1px solid #ef444433', color: '#ef4444', fontFamily: 'Orbitron', fontSize: 11, letterSpacing: 1, padding: '8px 20px', borderRadius: 6, cursor: 'pointer' }}>↩ UNDO LAST BALL</button>
            )}
          </>
        )}

        {/* ── SCORECARD TAB ── */}
        {activeTab === 'scorecard' && (
          <>
            {inn0 && inn0.batters.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 8 }}>1ST INNINGS</div>
                <ScorecardTable inn={inn0} />
              </div>
            )}
            {inn1 && inn1.batters.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 8 }}>2ND INNINGS</div>
                <ScorecardTable inn={inn1} />
              </div>
            )}
            {(!inn0 || inn0.batters.length === 0) && (!inn1 || inn1.batters.length === 0) && (
              <div style={{ textAlign: 'center', padding: 40, color: '#374151', fontFamily: 'Orbitron', fontSize: 11 }}>NO DATA YET</div>
            )}
          </>
        )}

        {/* ── BALL-BY-BALL TAB ── */}
        {activeTab === 'balls' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: `1ST INNINGS · ${inn0?.battingTeam}`, overs: overs0 },
              { label: `2ND INNINGS · ${inn1?.battingTeam}`, overs: overs1 },
            ].map(({ label, overs }) => overs.length > 0 && (
              <div key={label} style={{ background: '#0d1520', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>{label}</div>
                {overs.map((balls, oi) => <OverRow key={oi} over={oi} balls={balls} />)}
              </div>
            ))}
            {overs0.length === 0 && overs1.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#374151', fontFamily: 'Orbitron', fontSize: 11 }}>NO DELIVERIES YET</div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === 'opening' && (
        <OpeningSetupModal
          battingTeam={modal.inningsIdx === 0 ? teamA : teamB}
          bowlingTeam={modal.inningsIdx === 0 ? teamB : teamA}
          battingPlayers={battingTeamPlayers(modal.inningsIdx)}
          bowlingPlayers={bowlingTeamPlayers(modal.inningsIdx)}
          onConfirm={(s, ns, b) => handleOpeningSetup(s, ns, b, modal.inningsIdx)}
        />
      )}
      {modal?.type === 'newBatter' && (() => {
        const inn = innings[inningsIdx];
        const activeBatters = inn ? inn.batters.filter(b => !b.dismissed).map(b => b.name) : [];
        return (
          <NewBatterModal
            battingTeam={inningsIdx === 0 ? teamA : teamB}
            wicketBatter={modal.dismissedName}
            battingPlayers={battingTeamPlayers(inningsIdx)}
            activeBatters={activeBatters}
            onConfirm={handleNewBatter}
          />
        );
      })()}
      {modal?.type === 'newBowler' && (
        <NewBowlerModal
          bowlingTeam={inningsIdx === 0 ? teamB : teamA}
          lastBowler={activeInn?.bowlers[activeInn.bowlerIdx]?.name ?? ''}
          overNumber={modal.overNumber}
          bowlingPlayers={bowlingTeamPlayers(inningsIdx)}
          onConfirm={handleNewBowler}
        />
      )}
      {modal?.type === 'extraRuns' && (
        <NoBallWideModal
          event={modal.event}
          onConfirm={runs => { applyEvent(modal.event, runs); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}