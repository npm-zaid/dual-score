'use client';
import React, { useState, useEffect, useRef } from 'react';

// ── BCL Scoring Logic ────────────────────────────────────────────────────────
// EXTRA TYPES:
//   wide     → Batting +1 (wide extra) + bye runs; Bowl -4; Batter scores 0; NOT a legal ball
//   noball   → Batting +1 (NB extra) + bat/bye runs; Bowl -1; Batter scores if hit by bat; IS a legal ball
//   bye      → Batting gets bye runs (no bat credit); Bowl score = dot-equivalent (treated as dot for bcl)
//   legbye   → Same as bye
//
// BCL Bowl scoring per delivery (what the BOWLING team earns):
//   dot:    +4   wide:   -4   noball: -1   four: 0   six: -2   wicket: +6
//   single: +3   double: +2   triple: +1
//   bye/legbye count as dot for BCL bowl scoring (batter didn't score off bat)

type RunSource = 'bat' | 'bye' | 'legbye';

interface DeliveryConfig {
  event: string;
  batRuns: number;      // runs credited to batter (bat only)
  extraRuns: number;    // extras (wide/noball/bye/legbye)
  totalRuns: number;    // total runs added to batting score
  bowlScore: number;    // BCL bowl score for this delivery
  isLegal: boolean;     // counts as legal delivery
  isWicket: boolean;
  runSource: RunSource; // how were the bat-side runs scored
}

function calcDelivery(
  event: string,
  additionalRuns: number = 0,
  runSource: RunSource = 'bat'
): DeliveryConfig {
  const isLegal = event !== 'wide';
  const isWicket = event === 'wicket';

  switch (event) {
    case 'dot':
      return { event, batRuns: 0, extraRuns: 0, totalRuns: 0, bowlScore: 4, isLegal: true, isWicket: false, runSource: 'bat' };
    case 'single':
      return { event, batRuns: 1, extraRuns: 0, totalRuns: 1, bowlScore: 3, isLegal: true, isWicket: false, runSource: 'bat' };
    case 'double':
      return { event, batRuns: 2, extraRuns: 0, totalRuns: 2, bowlScore: 2, isLegal: true, isWicket: false, runSource: 'bat' };
    case 'triple':
      return { event, batRuns: 3, extraRuns: 0, totalRuns: 3, bowlScore: 1, isLegal: true, isWicket: false, runSource: 'bat' };
    case 'four':
      return { event, batRuns: 4, extraRuns: 0, totalRuns: 4, bowlScore: 0, isLegal: true, isWicket: false, runSource: 'bat' };
    case 'six':
      return { event, batRuns: 6, extraRuns: 0, totalRuns: 6, bowlScore: -2, isLegal: true, isWicket: false, runSource: 'bat' };
    case 'wicket':
      return { event, batRuns: 0, extraRuns: 0, totalRuns: 0, bowlScore: 6, isLegal: true, isWicket: true, runSource: 'bat' };

    case 'noball': {
      // Batter may score off bat OR it may be bye/legbye
      const isBatRuns = runSource === 'bat';
      const batterCredit = isBatRuns ? additionalRuns : 0;
      const byeCredit = !isBatRuns ? additionalRuns : 0;
      // BCL bowl score: NB = -1 always; if batter scored off bat, treat as that scoring event for bowl?
      // Per rules: NB = -1 bowling score. Batting team runs still count but bowl score stays -1 for NB itself.
      // If extra bat runs scored off the bat: those runs reduce bowl score further (bat runs off NB)
      // For simplicity per BCL: NB delivery bowl score = -1 (fixed), no further bowl penalty for bat runs off NB
      return {
        event, batRuns: batterCredit, extraRuns: 1 + byeCredit,
        totalRuns: 1 + additionalRuns, bowlScore: -1,
        isLegal: true, isWicket: false, runSource
      };
    }

    case 'wide': {
      // Batter scores 0. Extras = 1 (wide) + any bye/legbye off the wide
      // Wide is NOT a legal ball
      return {
        event, batRuns: 0, extraRuns: 1 + additionalRuns,
        totalRuns: 1 + additionalRuns, bowlScore: -4,
        isLegal: false, isWicket: false, runSource: 'bye'
      };
    }

    case 'bye': {
      // Batter scores 0. Extras = bye runs. Legal delivery. BCL bowl score = dot (4).
      return {
        event, batRuns: 0, extraRuns: additionalRuns,
        totalRuns: additionalRuns, bowlScore: 4,
        isLegal: true, isWicket: false, runSource: 'bye'
      };
    }

    case 'legbye': {
      return {
        event, batRuns: 0, extraRuns: additionalRuns,
        totalRuns: additionalRuns, bowlScore: 4,
        isLegal: true, isWicket: false, runSource: 'bye'
      };
    }

    default:
      return { event, batRuns: 0, extraRuns: 0, totalRuns: 0, bowlScore: 0, isLegal: true, isWicket: false, runSource: 'bat' };
  }
}

const EVENT_LABELS: Record<string, { label: string; icon: string; color: string; showBowlScore?: boolean }> = {
  dot:    { label: 'DOT',     icon: '•',  color: '#6b7280' },
  single: { label: '1 RUN',   icon: '1',  color: '#3b82f6' },
  double: { label: '2 RUNS',  icon: '2',  color: '#06b6d4' },
  triple: { label: '3 RUNS',  icon: '3',  color: '#8b5cf6' },
  four:   { label: 'FOUR',    icon: '4',  color: '#f97316' },
  six:    { label: 'SIX',     icon: '6',  color: '#22c55e' },
  wicket: { label: 'WICKET',  icon: 'W',  color: '#ef4444' },
  noball: { label: 'NO BALL', icon: 'NB', color: '#eab308' },
  wide:   { label: 'WIDE',    icon: 'WD', color: '#a855f7' },
  bye:    { label: 'BYE',     icon: 'B',  color: '#64748b' },
  legbye: { label: 'LEG BYE', icon: 'LB', color: '#475569' },
};

const FORMAT_OVERS: Record<string, number> = {
  'T10': 10, 'T20': 20, 'ODI': 50, 'Test': 90,
};
function getOversFromFormat(format?: string): number {
  return FORMAT_OVERS[format ?? ''] ?? 10;
}

const BALLS_PER_OVER = 6;
const MAX_WICKETS = 10;

// ── Types ────────────────────────────────────────────────────────────────────
interface BatterStats {
  name: string; runs: number; balls: number;
  fours: number; sixes: number; dismissed: boolean; dotBalls: number;
  bowlConceded: number;
}
interface BowlerStats {
  name: string; legalBalls: number; runs: number;
  wickets: number; wides: number; noBalls: number;
  bowlAcquired: number;
  dotBalls: number; fours: number; sixes: number;
}
interface Ball {
  event: string;
  batRuns: number;      // runs to batter
  extraRuns: number;    // extras
  totalRuns: number;    // total batting score change
  bowlScore: number;    // BCL bowl score change
  runSource: RunSource;
  batter?: string; bowler?: string;
}
interface Innings {
  battingTeam: string; bowlingTeam: string;
  balls: Ball[]; batScore: number; bowlScore: number; extras: number;
  legalBalls: number; wickets: number; complete: boolean;
  batters: BatterStats[]; bowlers: BowlerStats[];
  strikerIdx: number; nonStrikerIdx: number; bowlerIdx: number;
}

function initInnings(battingTeam: string, bowlingTeam: string): Innings {
  return {
    battingTeam, bowlingTeam, balls: [],
    batScore: 0, bowlScore: 0, extras: 0,
    legalBalls: 0, wickets: 0, complete: false,
    batters: [], bowlers: [], strikerIdx: 0, nonStrikerIdx: 1, bowlerIdx: 0,
  };
}
function newBatter(name: string): BatterStats {
  return { name, runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false, dotBalls: 0, bowlConceded: 0 };
}
function newBowler(name: string): BowlerStats {
  return { name, legalBalls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, bowlAcquired: 0, dotBalls: 0, fours: 0, sixes: 0 };
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
// Issue 5 fix: players list is always shown first (no search needed to see them)
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

  const eligible = players.filter(p => !exclude.includes(p));
  // Always show eligible players; filter only when search is active
  const filtered = search.trim()
    ? eligible.filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : eligible; // Show ALL eligible players by default (Issue 5)
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

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#0d1a2a', border: `1px solid ${color}55`,
          borderRadius: 8, zIndex: 999,
          boxShadow: '0 12px 40px #000000bb',
          overflow: 'hidden',
        }}>
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

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {/* Issue 5: Show all eligible players immediately */}
            {filtered.length > 0 && (
              <div style={{ padding: '4px 0 2px', borderBottom: canAdd ? `1px solid ${color}22` : 'none' }}>
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
              </div>
            )}

            {canAdd && (
              <div
                onClick={() => select(typedUp)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  fontFamily: 'Bebas Neue', fontSize: 14, letterSpacing: 1, color,
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
        <ModalSub>Select opening batters &amp; bowler to start the innings</ModalSub>

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

// ── Extra delivery modal (Wide / No-Ball / Bye / Leg Bye) ─────────────────────
// Issue 1 & 2 & 3 fix: Separate handling for each extra type
function ExtraDeliveryModal({ event, onConfirm, onCancel }: {
  event: string;
  onConfirm: (additionalRuns: number, runSource: RunSource) => void;
  onCancel: () => void;
}) {
  const [runs, setRuns] = useState(0);
  const [runSource, setRunSource] = useState<RunSource>('bat');

  const isWide = event === 'wide';
  const isNoBall = event === 'noball';
  const isBye = event === 'bye';
  const isLegBye = event === 'legbye';

  // For wide: only byes possible (batter can't score off a wide by bat)
  // For noball: batter can score by bat OR it can be bye/legbye
  // For bye/legbye: always extras

  const accentColor = isWide ? '#a855f7' : isNoBall ? '#eab308' : isBye ? '#64748b' : '#475569';

  const eventLabel = isWide ? 'WIDE' : isNoBall ? 'NO BALL' : isBye ? 'BYE' : 'LEG BYE';

  return (
    <div style={MODAL_BG}>
      <div style={{ ...MODAL_CARD, maxWidth: 480 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '14px 14px 0 0', background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

        <ModalTitle>{eventLabel} — RUNS?</ModalTitle>

        {isWide && (
          <ModalSub>Wide is NOT a legal delivery. Batter cannot score. 1 wide extra added automatically. Enter any additional bye runs scored.</ModalSub>
        )}
        {isNoBall && (
          <>
            <ModalSub>No Ball IS a legal delivery. 1 NB extra added automatically. Select how additional runs were scored (if any).</ModalSub>
            {/* Run source selector for No Ball */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['bat', 'bye', 'legbye'] as RunSource[]).map(src => (
                <button
                  key={src}
                  onClick={() => setRunSource(src)}
                  style={{
                    flex: 1, padding: '8px 4px',
                    background: runSource === src ? `${accentColor}33` : '#111827',
                    border: `1.5px solid ${runSource === src ? accentColor : '#374151'}`,
                    borderRadius: 6, color: runSource === src ? accentColor : '#6b7280',
                    fontFamily: 'Orbitron', fontSize: 9, letterSpacing: 1, cursor: 'pointer',
                    fontWeight: runSource === src ? 700 : 400,
                  }}
                >
                  {src === 'bat' ? '🏏 BAT' : src === 'bye' ? '👟 BYE' : '🦵 LEG BYE'}
                </button>
              ))}
            </div>
          </>
        )}
        {(isBye || isLegBye) && (
          <ModalSub>{eventLabel} is a legal delivery. Runs go to extras only — batter does NOT get credit. Bowler treated as dot for BCL bowl score.</ModalSub>
        )}

        {/* Run description */}
        <div style={{ background: '#111827', border: `1px solid ${accentColor}33`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 11, fontFamily: 'Rajdhani', color: '#9ca3af' }}>
          {isWide && `Batting team will get: 1 (wide) + ${runs} (bye) = ${1 + runs} runs. Batter: 0. Bowl score: -4`}
          {isNoBall && runSource === 'bat' && `Batting team: 1 (NB) + ${runs} (bat) = ${1 + runs}. Batter: +${runs} runs. Bowl score: -1`}
          {isNoBall && runSource !== 'bat' && `Batting team: 1 (NB) + ${runs} (${runSource}) = ${1 + runs}. Batter: 0. Bowl score: -1`}
          {isBye && `Batting team: +${runs} bye extras. Batter: 0. Bowl score: +4 (dot)`}
          {isLegBye && `Batting team: +${runs} leg-bye extras. Batter: 0. Bowl score: +4 (dot)`}
        </div>

        {/* Runs selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22, justifyContent: 'center' }}>
          <button onClick={() => setRuns(r => Math.max(0, r - 1))} style={btnStyle('#374151', '#9ca3af')}>−</button>
          <div style={{ fontFamily: 'Orbitron', fontSize: 36, fontWeight: 900, color: '#f9fafb', minWidth: 50, textAlign: 'center' }}>{runs}</div>
          <button onClick={() => setRuns(r => r + 1)} style={btnStyle('#374151', '#9ca3af')}>+</button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onConfirm(runs, isWide ? 'bye' : runSource)} style={btnStyle(`${accentColor}22`, accentColor, true)}>CONFIRM</button>
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
function ScoreBoard({ inn, label, inningsNum, otherInn, isSecondInningsLive }: {
  inn: Innings;
  label: string;
  inningsNum: number;
  otherInn?: Innings | null;
  isSecondInningsLive?: boolean;
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
          {inn.complete && <span style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#22c55e55', letterSpacing: 1 }}>FINAL</span>}
        </div>
        {inn.extras > 0 && (
          <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'Rajdhani', marginBottom: 10 }}>Extras: {inn.extras}</div>
        )}

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

        {!isSecondInningsLive && (
          <div style={{ marginTop: 10, fontSize: 10, color: '#1f2937', fontFamily: 'Orbitron', letterSpacing: 1, textAlign: 'center' }}>
            DUAL SCORES CALCULATED AFTER 2ND INNINGS
          </div>
        )}
      </div>
    );
  }

  const inn0BatFinal  = otherInn?.batScore  ?? 0;
  const inn0BowlFinal = otherInn?.bowlScore ?? 0;
  const teamBDual = inn.batScore + inn0BowlFinal;
  const teamADual = inn.bowlScore + inn0BatFinal;

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
      {inn.extras > 0 && (
        <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'Rajdhani', marginBottom: 10 }}>Extras: {inn.extras}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 6, padding: '8px 12px', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#22c55e', letterSpacing: 1, marginBottom: 3 }}>BATTING · DUAL</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{inn.battingTeam}</div>
          <div style={{ fontSize: 9, fontFamily: 'Rajdhani', color: '#4b5563', marginTop: 3 }}>
            Bat² {inn.batScore} <span style={{ color: '#374151' }}>+</span> Bowl¹ <span style={{ color: '#22c55e88' }}>{inn0BowlFinal}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 2 }}>DUAL SCORE</div>
          <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>{teamBDual}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#a3e63511', border: '1px solid #a3e63533', borderRadius: 6, padding: '8px 12px' }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#a3e635', letterSpacing: 1, marginBottom: 3 }}>BOWLING · DUAL</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{inn.bowlingTeam}</div>
          <div style={{ fontSize: 9, fontFamily: 'Rajdhani', color: '#4b5563', marginTop: 3 }}>
            Bowl² {inn.bowlScore} <span style={{ color: '#374151' }}>+</span> Bat¹ <span style={{ color: '#a3e63588' }}>{inn0BatFinal}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 2 }}>DUAL SCORE</div>
          <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#a3e635', lineHeight: 1 }}>{teamADual}</div>
        </div>
      </div>
    </div>
  );
}

// ── Crease Panel ──────────────────────────────────────────────────────────────
function CreasePanel({ inn }: { inn: Innings }) {
  // Issue 4 fix: Use indices directly — don't look up by name, use inn.strikerIdx and inn.nonStrikerIdx
  const striker = inn.batters[inn.strikerIdx];
  const nonStriker = inn.batters[inn.nonStrikerIdx];
  const bowler = inn.bowlers[inn.bowlerIdx];
  if (!striker || !bowler) return null;

  const strikerNet = striker.runs - striker.bowlConceded;
  const nonStrikerNet = nonStriker ? nonStriker.runs - nonStriker.bowlConceded : 0;
  const bowlerNet = bowler.bowlAcquired - bowler.runs;

  function netColor(val: number) { return val > 0 ? '#22c55e' : val < 0 ? '#ef4444' : '#9ca3af'; }

  return (
    <div style={{ background: '#0a1018', border: '1px solid #1a2540', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>

      {/* STRIKER */}
      <div style={{ flex: 1, minWidth: 155, background: '#22c55e0d', border: '1px solid #22c55e22', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 8, fontFamily: 'Orbitron', color: '#22c55e', letterSpacing: 2, marginBottom: 4 }}>⚡ ON STRIKE</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{striker.name}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: '#22c55e' }}>{striker.runs}</span>
          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani' }}>({striker.balls}b) SR {sr(striker.runs, striker.balls)}</span>
        </div>
        <div style={{ marginTop: 5, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, fontFamily: 'Rajdhani' }}>
          <span style={{ color: '#6b7280' }}>Bowl Con: <span style={{ color: '#f97316' }}>{striker.bowlConceded}</span></span>
          <span style={{ color: '#6b7280' }}>Net: <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700, color: netColor(strikerNet) }}>{strikerNet > 0 ? '+' : ''}{strikerNet}</span></span>
        </div>
        <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563', fontFamily: 'Rajdhani', display: 'flex', gap: 10 }}>
          <span>● {striker.dotBalls}</span>
          <span style={{ color: '#f97316' }}>4s {striker.fours}</span>
          <span style={{ color: '#22c55e' }}>6s {striker.sixes}</span>
        </div>
      </div>

      {/* NON-STRIKER */}
      {nonStriker && (
        <div style={{ flex: 1, minWidth: 155, background: '#3b82f60d', border: '1px solid #3b82f622', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 8, fontFamily: 'Orbitron', color: '#3b82f6', letterSpacing: 2, marginBottom: 4 }}>NON-STRIKER</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{nonStriker.name}</div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: '#3b82f6' }}>{nonStriker.runs}</span>
            <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani' }}>({nonStriker.balls}b) SR {sr(nonStriker.runs, nonStriker.balls)}</span>
          </div>
          <div style={{ marginTop: 5, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, fontFamily: 'Rajdhani' }}>
            <span style={{ color: '#6b7280' }}>Bowl Con: <span style={{ color: '#f97316' }}>{nonStriker.bowlConceded}</span></span>
            <span style={{ color: '#6b7280' }}>Net: <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700, color: netColor(nonStrikerNet) }}>{nonStrikerNet > 0 ? '+' : ''}{nonStrikerNet}</span></span>
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563', fontFamily: 'Rajdhani', display: 'flex', gap: 10 }}>
            <span>● {nonStriker.dotBalls}</span>
            <span style={{ color: '#f97316' }}>4s {nonStriker.fours}</span>
            <span style={{ color: '#22c55e' }}>6s {nonStriker.sixes}</span>
          </div>
        </div>
      )}

      {/* BOWLER */}
      <div style={{ flex: 1, minWidth: 155, background: '#f973160d', border: '1px solid #f9731622', borderRadius: 8, padding: '10px 12px' }}>
        <div style={{ fontSize: 8, fontFamily: 'Orbitron', color: '#f97316', letterSpacing: 2, marginBottom: 4 }}>🎯 BOWLING</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{bowler.name}</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: '#f97316' }}>{bowler.wickets}/{bowler.runs}</span>
          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani' }}>({oversStr(bowler.legalBalls)} ov) Econ {economy(bowler.runs, bowler.legalBalls)}</span>
        </div>
        <div style={{ marginTop: 5, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, fontFamily: 'Rajdhani' }}>
          <span style={{ color: '#6b7280' }}>Bowl Acq: <span style={{ color: '#22c55e' }}>{bowler.bowlAcquired}</span></span>
          <span style={{ color: '#6b7280' }}>Net: <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700, color: netColor(bowlerNet) }}>{bowlerNet > 0 ? '+' : ''}{bowlerNet}</span></span>
        </div>
        <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563', fontFamily: 'Rajdhani', display: 'flex', gap: 10 }}>
          <span>● {bowler.dotBalls}</span>
          <span style={{ color: '#f97316' }}>4s {bowler.fours}</span>
          <span style={{ color: '#22c55e' }}>6s {bowler.sixes}</span>
          <span style={{ color: '#a855f7' }}>WD {bowler.wides}</span>
          <span style={{ color: '#eab308' }}>NB {bowler.noBalls}</span>
        </div>
      </div>
    </div>
  );
}

// ── Scorecard ─────────────────────────────────────────────────────────────────
function ScorecardTable({ inn }: { inn: Innings }) {
  const { batters, bowlers } = inn;
  if (batters.length === 0 && bowlers.length === 0) return null;

  // Issue 4 fix: Use dismissed flag + index-based active status (never use name matching for active check)
  return (
    <div style={{ background: '#0a0f16', border: '1px solid #1f2937', borderRadius: 10, padding: '16px', marginBottom: 16 }}>
      {batters.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#3b82f6', letterSpacing: 2, marginBottom: 10 }}>🏏 {inn.battingTeam} BATTING</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Rajdhani' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['BATTER','R','B','●','4s','6s','SR','EXTRAS','BOWL CON','NET RUN','STATUS'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: h==='BATTER'?'left':'right', fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 1, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batters.map((b, i) => {
                  // Issue 4 fix: Use index comparison for striker/non-striker, not name
                  const isStriker = !inn.complete && i === inn.strikerIdx && !b.dismissed;
                  const isNS = !inn.complete && i === inn.nonStrikerIdx && !b.dismissed;
                  const netRun = b.runs - b.bowlConceded;
                  const netColor = netRun > 0 ? '#22c55e' : netRun < 0 ? '#ef4444' : '#6b7280';
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
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#4b5563' }}>{b.dotBalls}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#f97316' }}>{b.fours}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#22c55e' }}>{b.sixes}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#9ca3af', fontSize: 11 }}>{sr(b.runs, b.balls)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b', fontSize: 11 }}>—</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#f97316', fontSize: 11 }}>{b.bowlConceded}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', fontWeight: 700, fontSize: 12, color: netColor }}>{netRun > 0 ? '+' : ''}{netRun}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 10 }}>
                        {b.dismissed
                          ? <span style={{ color: '#ef4444' }}>OUT</span>
                          : isStriker
                            ? <span style={{ color: '#22c55e' }}>BATTING*</span>
                            : isNS
                              ? <span style={{ color: '#3b82f6' }}>NOT OUT</span>
                              : <span style={{ color: '#4b5563' }}>NOT OUT</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Extras row */}
          {inn.extras > 0 && (
            <div style={{ marginTop: 8, padding: '6px 8px', background: '#1f293711', borderRadius: 4, fontSize: 11, fontFamily: 'Rajdhani', color: '#6b7280' }}>
              Extras: <span style={{ color: '#9ca3af', fontWeight: 700 }}>{inn.extras}</span> (wides, no balls, byes, leg byes)
            </div>
          )}
        </div>
      )}
      {bowlers.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#f97316', letterSpacing: 2, marginBottom: 10 }}>🎯 {inn.bowlingTeam} BOWLING</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Rajdhani' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  {['BOWLER','O','R','W','●','4s','6s','WD','NB','BOWL ACQ','NET BOWL','ECON'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: h==='BOWLER'?'left':'right', fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 1, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bowlers.map((b, i) => {
                  const isCurrent = !inn.complete && i === inn.bowlerIdx;
                  const netBowl = b.bowlAcquired - b.runs;
                  const netColor = netBowl > 0 ? '#22c55e' : netBowl < 0 ? '#ef4444' : '#6b7280';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #0d1520', background: isCurrent ? '#f9731608' : 'transparent' }}>
                      <td style={{ padding: '7px 8px', color: '#f9fafb', fontWeight: 700 }}>
                        {isCurrent && <span style={{ color: '#f97316', marginRight: 4 }}>🎯</span>}
                        {b.name}
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', color: '#9ca3af', fontSize: 11 }}>{oversStr(b.legalBalls)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', fontWeight: 900, color: '#f9fafb', fontSize: 13 }}>{b.runs}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', fontWeight: 900, color: b.wickets > 0 ? '#ef4444' : '#6b7280', fontSize: 13 }}>{b.wickets}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#4b5563' }}>{b.dotBalls}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#f97316' }}>{b.fours}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#22c55e' }}>{b.sixes}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#a855f7' }}>{b.wides}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#eab308' }}>{b.noBalls}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#22c55e', fontSize: 11 }}>{b.bowlAcquired}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontFamily: 'Orbitron', fontWeight: 700, fontSize: 12, color: netColor }}>{netBowl > 0 ? '+' : ''}{netBowl}</td>
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
  const displayRuns = b.totalRuns > 0 ? `+${b.totalRuns}` : '';
  return (
    <div
      title={`${b.batter ?? ''} vs ${b.bowler ?? ''} | ${meta.label}${displayRuns} | BatRuns:${b.batRuns} Extras:${b.extraRuns} Bowl:${b.bowlScore>=0?'+':''}${b.bowlScore}`}
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
  | { type: 'extra'; event: string };

export default function BCLScoring({ scoringMatch, updateMatch, setActivePage }: {
  scoringMatch?: any; updateMatch?: (m: any) => void; setActivePage?: (p: string) => void;
}) {
  const TOTAL_OVERS = getOversFromFormat(scoringMatch?.format);
  const TOTAL_BALLS = TOTAL_OVERS * BALLS_PER_OVER;

  const [teamA, setTeamA] = useState(scoringMatch?.teamA?.shortName || scoringMatch?.teamA?.name || 'TEAM A');
  const [teamB, setTeamB] = useState(scoringMatch?.teamB?.shortName || scoringMatch?.teamB?.name || 'TEAM B');

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
  const [secondInningsStarted, setSecondInningsStarted] = useState(false);

  const prevLegalBalls = useRef<number>(0);
  const prevWicketBallIdx = useRef<number>(-1);

  function ensurePlayer(team: 'A' | 'B', name: string) {
    if (team === 'A') setTeamAPlayers(p => p.includes(name) ? p : [...p, name]);
    else setTeamBPlayers(p => p.includes(name) ? p : [...p, name]);
  }

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
    setSecondInningsStarted(false);
    prevLegalBalls.current = 0;
    prevWicketBallIdx.current = -1;
    setModal({ type: 'opening', inningsIdx: 0 });
    if (scoringMatch && updateMatch) updateMatch({ ...scoringMatch, status: 'live' });
  }

  function handleOpeningSetup(striker: string, nonStriker: string, bowler: string, innIdx: number) {
    ensurePlayer(battingTeamLabel(innIdx), striker);
    ensurePlayer(battingTeamLabel(innIdx), nonStriker);
    ensurePlayer(bowlingTeamLabel(innIdx), bowler);
    if (innIdx === 1) setSecondInningsStarted(true);

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

  // ── Core delivery application ─────────────────────────────────────────────
  function applyDelivery(event: string, additionalRuns: number = 0, runSource: RunSource = 'bat') {
    const delivery = calcDelivery(event, additionalRuns, runSource);

    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[inningsIdx]! };
      const striker = inn.batters[inn.strikerIdx];
      const bowler = inn.bowlers[inn.bowlerIdx];
      if (!striker || !bowler) return prev;

      const ballsCopy = [...inn.balls];
      const battersCopy = inn.batters.map(b => ({ ...b }));
      const bowlersCopy = inn.bowlers.map(b => ({ ...b }));

      // Record ball
      ballsCopy.push({
        event,
        batRuns: delivery.batRuns,
        extraRuns: delivery.extraRuns,
        totalRuns: delivery.totalRuns,
        bowlScore: delivery.bowlScore,
        runSource: delivery.runSource,
        batter: striker.name,
        bowler: bowler.name,
      });

      // ── Update batter stats ──────────────────────────────────────────────
      const batStat = battersCopy[inn.strikerIdx];
      if (delivery.isLegal) batStat.balls += 1;
      batStat.runs += delivery.batRuns;  // only bat runs go to batter (not extras)
      if (event === 'four') batStat.fours += 1;
      if (event === 'six') batStat.sixes += 1;
      // Dot ball: legal delivery + batter scored 0 by bat
      if (delivery.batRuns === 0 && delivery.isLegal && !delivery.isWicket) batStat.dotBalls += 1;
      if (delivery.isWicket) batStat.dismissed = true;
      // bowlConceded: the bowl score earned BY the bowling side from this delivery
      batStat.bowlConceded += delivery.bowlScore;

      // ── Update bowler stats ──────────────────────────────────────────────
      const bowlStat = bowlersCopy[inn.bowlerIdx];
      if (delivery.isLegal) bowlStat.legalBalls += 1;
      // Runs conceded by bowler = bat runs + extras (but not the NB/wide penalty itself — that's separate)
      // For economy: standard cricket counts all runs off the over including extras
      bowlStat.runs += delivery.batRuns + delivery.extraRuns;
      if (delivery.isWicket) bowlStat.wickets += 1;
      if (event === 'wide') bowlStat.wides += 1;
      if (event === 'noball') bowlStat.noBalls += 1;
      bowlStat.bowlAcquired += delivery.bowlScore;
      if (delivery.batRuns === 0 && delivery.isLegal && !delivery.isWicket) bowlStat.dotBalls += 1;
      if (event === 'four') bowlStat.fours += 1;
      if (event === 'six') bowlStat.sixes += 1;

      // ── Update innings totals ────────────────────────────────────────────
      inn.batScore += delivery.totalRuns;
      inn.extras += delivery.extraRuns;
      inn.bowlScore += delivery.bowlScore;
      if (delivery.isLegal) inn.legalBalls += 1;
      if (delivery.isWicket) inn.wickets += 1;
      inn.balls = ballsCopy;
      inn.batters = battersCopy;
      inn.bowlers = bowlersCopy;

      // Rotate strike for odd runs (bat runs only — not extras)
      if (delivery.batRuns === 1 || delivery.batRuns === 3) {
        [inn.strikerIdx, inn.nonStrikerIdx] = [inn.nonStrikerIdx, inn.strikerIdx];
      }
      // For wide/bye/legbye with odd extra runs: rotate? In real cricket, byes of 1/3 rotate.
      // Wides never rotate. Byes/lebbyes with 1 or 3 runs do rotate.
      if ((event === 'bye' || event === 'legbye') && (additionalRuns === 1 || additionalRuns === 3)) {
        [inn.strikerIdx, inn.nonStrikerIdx] = [inn.nonStrikerIdx, inn.strikerIdx];
      }

      // ── Innings end conditions ───────────────────────────────────────────
      const allOut = inn.wickets >= MAX_WICKETS;
      const oversUp = inn.legalBalls >= TOTAL_BALLS;
      if (allOut || oversUp) {
        if (allOut && !oversUp) {
          const remaining = TOTAL_BALLS - inn.legalBalls;
          inn.bowlScore += remaining * 4;
          inn.balls = [...inn.balls, { event: '_bonus', batRuns: 0, extraRuns: 0, totalRuns: 0, bowlScore: remaining * 4, runSource: 'bat' }];
        }
        inn.complete = true;
      }

      all[inningsIdx] = inn;
      const isMatchOver = inningsIdx === 1 && inn.complete;
      syncToMatch(all[0], all[1], isMatchOver);
      return all;
    });
  }

  // ── Over-end / wicket detection ───────────────────────────────────────────
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
      // Rotate strike at end of over
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

    // Wicket detection — Issue 4 fix: compare by ball index not name
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
      // Issue 4 fix: new batter always becomes the striker (replaces dismissed striker)
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
    // Extra events need the modal for runs selection
    if (event === 'noball' || event === 'wide' || event === 'bye' || event === 'legbye') {
      setModal({ type: 'extra', event });
    } else {
      applyDelivery(event);
    }
  }

  // ── Undo ────────────────────────────────────────────────────────────────────
  function undoLastBall() {
    setInnings(prev => {
      const all = [...prev] as [Innings | null, Innings | null];
      const inn = { ...all[inningsIdx]! };
      const realBalls = inn.balls.filter(b => b.event !== '_bonus');
      if (realBalls.length === 0) return prev;
      const last = realBalls[realBalls.length - 1];
      inn.balls = realBalls.slice(0, -1);

      inn.batScore -= last.totalRuns;
      inn.extras -= last.extraRuns;
      inn.bowlScore -= last.bowlScore;
      if (last.event !== 'wide') inn.legalBalls = Math.max(0, inn.legalBalls - 1);
      if (last.event === 'wicket') inn.wickets = Math.max(0, inn.wickets - 1);
      inn.complete = false;

      const battersCopy = inn.batters.map(b => ({ ...b }));
      const bIdx = battersCopy.findIndex(b => b.name === last.batter);
      if (bIdx >= 0) {
        const b = battersCopy[bIdx];
        if (last.event !== 'wide') b.balls = Math.max(0, b.balls - 1);
        b.runs = Math.max(0, b.runs - last.batRuns);
        if (last.event === 'four') b.fours = Math.max(0, b.fours - 1);
        if (last.event === 'six') b.sixes = Math.max(0, b.sixes - 1);
        if (last.event === 'wicket') b.dismissed = false;
        if (last.batRuns === 0 && last.event !== 'wide' && last.event !== 'wicket') b.dotBalls = Math.max(0, b.dotBalls - 1);
        b.bowlConceded -= last.bowlScore;
      }
      inn.batters = battersCopy;

      const bowlersCopy = inn.bowlers.map(b => ({ ...b }));
      const bowlIdx = bowlersCopy.findIndex(b => b.name === last.bowler);
      if (bowlIdx >= 0) {
        const b = bowlersCopy[bowlIdx];
        if (last.event !== 'wide') b.legalBalls = Math.max(0, b.legalBalls - 1);
        b.runs = Math.max(0, b.runs - last.batRuns - last.extraRuns);
        if (last.event === 'wicket') b.wickets = Math.max(0, b.wickets - 1);
        if (last.event === 'wide') b.wides = Math.max(0, b.wides - 1);
        if (last.event === 'noball') b.noBalls = Math.max(0, b.noBalls - 1);
        b.bowlAcquired -= last.bowlScore;
        if (last.batRuns === 0 && last.event !== 'wide' && last.event !== 'wicket') b.dotBalls = Math.max(0, b.dotBalls - 1);
        if (last.event === 'four') b.fours = Math.max(0, b.fours - 1);
        if (last.event === 'six') b.sixes = Math.max(0, b.sixes - 1);
      }
      inn.bowlers = bowlersCopy;

      // Undo strike rotation for odd bat runs
      if (last.batRuns === 1 || last.batRuns === 3) {
        [inn.strikerIdx, inn.nonStrikerIdx] = [inn.nonStrikerIdx, inn.strikerIdx];
      }
      // Undo bye/legbye rotation
      if ((last.event === 'bye' || last.event === 'legbye') && (last.extraRuns === 1 || last.extraRuns === 3)) {
        [inn.strikerIdx, inn.nonStrikerIdx] = [inn.nonStrikerIdx, inn.strikerIdx];
      }

      all[inningsIdx] = inn;
      syncToMatch(all[0], all[1], false);
      return all;
    });
    prevLegalBalls.current = innings[inningsIdx]?.legalBalls ?? 0;
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
  // Events for the main scoring buttons (bye & legbye added)
  const SCORING_EVENTS = ['dot','single','double','triple','four','six','wicket','noball','wide','bye','legbye'];

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
              {inn0 && (
                <ScoreBoard
                  inn={inn0}
                  label={`1ST INNINGS${inn0.complete ? ' · FINAL' : ' · LIVE'}`}
                  inningsNum={0}
                  isSecondInningsLive={secondInningsStarted}
                />
              )}
              {inn1 && secondInningsStarted && (
                <ScoreBoard
                  inn={inn1}
                  label={`2ND INNINGS${inn1.complete ? ' · FINAL' : ' · LIVE'}`}
                  inningsNum={1}
                  otherInn={inn0}
                  isSecondInningsLive={secondInningsStarted}
                />
              )}
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
                  {SCORING_EVENTS.map(key => {
                    const meta = EVENT_LABELS[key];
                    const preview = calcDelivery(key, 0, 'bat');
                    const needsModal = ['noball','wide','bye','legbye'].includes(key);
                    return (
                      <button key={key} onClick={() => handleEvent(key)} style={{
                        background: `${meta.color}15`, border: `1.5px solid ${meta.color}44`,
                        borderRadius: 8, padding: '10px 14px', color: meta.color, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 64,
                      }}>
                        <span style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: 18 }}>{meta.icon}</span>
                        <span style={{ fontFamily: 'Orbitron', fontSize: 8, letterSpacing: 1 }}>{meta.label}</span>
                        <span style={{ fontSize: 9, color: `${meta.color}aa`, fontFamily: 'Rajdhani' }}>
                          {needsModal ? '→ SELECT RUNS' : `Bat:${preview.batRuns>=0?'+':''}${preview.batRuns} / Bowl:${preview.bowlScore>=0?'+':''}${preview.bowlScore}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#374151', fontFamily: 'Rajdhani' }}>
                  Bat runs / Bowl score per delivery · Wide/NB/Bye/LB opens extra runs selector
                </div>
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
            {inn1 && inn1.batters.length > 0 && secondInningsStarted && (
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
              ...(secondInningsStarted ? [{ label: `2ND INNINGS · ${inn1?.battingTeam}`, overs: overs1 }] : []),
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
        // Issue 4 fix: exclude all non-dismissed batters + dismissed ones already out
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
      {modal?.type === 'extra' && (
        <ExtraDeliveryModal
          event={modal.event}
          onConfirm={(runs, src) => { applyDelivery(modal.event, runs, src); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}