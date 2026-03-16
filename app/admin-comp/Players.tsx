'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useApp, Player } from './AppContext';

/* ─── AddPlayer component ─────────────────────────────────────────────────── */

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'] as const;
const BATTING_STYLES = ['Right-hand', 'Left-hand'] as const;
const BOWLING_STYLES = ['Fast', 'Fast-medium', 'Medium', 'Off-break', 'Leg-spin', 'Slow left-arm', 'Left-arm orthodox', 'None'] as const;

const roleColors: Record<string, string> = {
  Batsman: '#3b82f6', Bowler: '#ef4444', 'All-rounder': '#22c55e', 'Wicket-keeper': '#eab308',
};
const roleIcon: Record<string, string> = {
  Batsman: '🏏', Bowler: '⚾', 'All-rounder': '⚡', 'Wicket-keeper': '🧤',
};
const roleDesc: Record<string, string> = {
  Batsman: 'Specialist run-scorer', Bowler: 'Specialist wicket-taker',
  'All-rounder': 'Bat & ball contributions', 'Wicket-keeper': 'Keeper + specialist batter',
};

function Section({ title, icon, children, delay = 0 }: { title: string; icon: string; children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0'; el.style.transform = 'translateY(16px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(.4,0,.2,1)';
      el.style.opacity = '1'; el.style.transform = 'translateY(0)';
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div ref={ref} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '12px 20px', background: '#0d1117', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 2, color: '#f9fafb' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export function AddPlayer() {
  const { addPlayer, teams, tournaments, setActivePage } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState<typeof ROLES[number]>('Batsman');
  const [battingStyle, setBattingStyle] = useState<typeof BATTING_STYLES[number]>('Right-hand');
  const [bowlingStyle, setBowlingStyle] = useState<typeof BOWLING_STYLES[number]>('None');
  const [age, setAge] = useState('');
  const [baseTeam, setBaseTeam] = useState('');

  // Stats
  const [totalRuns, setTotalRuns] = useState('');
  const [totalBalls, setTotalBalls] = useState('');
  const [totalWickets, setTotalWickets] = useState('');
  const [totalMatches, setTotalMatches] = useState('');
  const [highScore, setHighScore] = useState('');
  const [bestBowling, setBestBowling] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const color = roleColors[role];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Player name is required';
    if (age && (parseInt(age) < 10 || parseInt(age) > 60)) e.age = 'Valid age 10–60';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const player: Player = {
      id: `p${Date.now()}`,
      name: name.trim(),
      role, battingStyle, bowlingStyle,
      age: parseInt(age) || 0,
      team: baseTeam.trim(),
      tournamentsPlayed: [],
      matchesPlayed: [],
      teamsPlayedFor: [],
      stats: {
        totalRuns: parseInt(totalRuns) || 0,
        totalBalls: parseInt(totalBalls) || 0,
        totalWickets: parseInt(totalWickets) || 0,
        totalMatches: parseInt(totalMatches) || 0,
        highScore: parseInt(highScore) || 0,
        bestBowling: bestBowling || '—',
      },
    };
    addPlayer(player);
    setSaved(true);
    setTimeout(() => { setSaved(false); setActivePage('players'); }, 1400);
  };

  const inputSt: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 6, fontSize: 14,
    background: '#0d1117', border: '1px solid #374151', color: '#f9fafb',
    width: '100%', outline: 'none', fontFamily: 'Rajdhani', boxSizing: 'border-box',
  };
  const lbl = (txt: string, req = false) => (
    <label style={{ display: 'block', marginBottom: 6, fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, color: '#4b5563', letterSpacing: 1.5 }}>
      {txt}{req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
  );

  return (
    <div style={{ padding: 24, maxWidth: 920 }}>
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => setActivePage('players')} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: 11, cursor: 'pointer', fontFamily: 'Orbitron', marginBottom: 6, padding: 0 }}>
          ← BACK TO PLAYERS
        </button>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: 4, color: '#f9fafb', lineHeight: 1, margin: 0 }}>ADD PLAYER</h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4, fontFamily: 'Rajdhani' }}>Register a new player to the roster</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* ROLE */}
          <Section title="SELECT ROLE" icon="⚡" delay={60}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {ROLES.map(r => {
                const rc = roleColors[r];
                const sel = role === r;
                return (
                  <button key={r} onClick={() => setRole(r)} style={{
                    padding: '14px 16px', border: `2px solid ${sel ? rc : '#1f2937'}`,
                    background: sel ? `${rc}12` : '#0d1117', borderRadius: 8, cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.2s',
                    boxShadow: sel ? `0 0 16px ${rc}22` : 'none',
                    transform: sel ? 'scale(1.01)' : 'scale(1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>{roleIcon[r]}</span>
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: 17, letterSpacing: 1, color: sel ? rc : '#9ca3af', transition: 'color 0.2s' }}>{r}</span>
                      {sel && <span style={{ marginLeft: 'auto', width: 18, height: 18, background: rc, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#000', fontWeight: 900, flexShrink: 0 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#374151' }}>{roleDesc[r]}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* DETAILS */}
          <Section title="PLAYER DETAILS" icon="👤" delay={120}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                {lbl('FULL NAME', true)}
                <input style={{ ...inputSt, borderColor: errors.name ? '#ef4444' : undefined }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rohit Sharma" />
                {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div>
                {lbl('AGE')}
                <input style={{ ...inputSt, borderColor: errors.age ? '#ef4444' : undefined }} type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="25" min={10} max={60} />
                {errors.age && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.age}</div>}
              </div>
              <div>
                {lbl('BASE TEAM')}
                <input style={inputSt} value={baseTeam} onChange={e => setBaseTeam(e.target.value)} placeholder="Team name" list="teams-list" />
                <datalist id="teams-list">
                  {teams.map(t => <option key={t.id} value={t.name} />)}
                </datalist>
              </div>
            </div>
          </Section>

          {/* PLAYING STYLE */}
          <Section title="PLAYING STYLE" icon="🎯" delay={180}>
            <div style={{ marginBottom: 16 }}>
              {lbl('BATTING STANCE')}
              <div style={{ display: 'flex', gap: 10 }}>
                {BATTING_STYLES.map(s => (
                  <button key={s} onClick={() => setBattingStyle(s)} style={{
                    flex: 1, padding: '10px',
                    border: `2px solid ${battingStyle === s ? color : '#1f2937'}`,
                    background: battingStyle === s ? `${color}12` : '#0d1117',
                    color: battingStyle === s ? color : '#9ca3af',
                    borderRadius: 6, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14,
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <span>{s === 'Right-hand' ? '🏏' : '🔄'}</span> {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {lbl('BOWLING STYLE')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {BOWLING_STYLES.map(s => (
                  <button key={s} onClick={() => setBowlingStyle(s)} style={{
                    padding: '8px 12px',
                    border: `1px solid ${bowlingStyle === s ? color : '#1f2937'}`,
                    background: bowlingStyle === s ? `${color}12` : '#0d1117',
                    color: bowlingStyle === s ? color : '#9ca3af',
                    borderRadius: 6, cursor: 'pointer',
                    fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                    {bowlingStyle === s && <span style={{ marginRight: 4 }}>✓</span>}{s}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* STATS */}
          <Section title="CAREER STATS (OPTIONAL)" icon="📊" delay={240}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color, letterSpacing: 1, marginBottom: 10 }}>BATTING</div>
                {[
                  ['TOTAL RUNS', totalRuns, setTotalRuns, '0'],
                  ['TOTAL BALLS', totalBalls, setTotalBalls, '0'],
                  ['HIGH SCORE', highScore, setHighScore, '0'],
                  ['TOTAL MATCHES', totalMatches, setTotalMatches, '0'],
                ].map(([label, val, setter, placeholder]) => (
                  <div key={label as string} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1f2937', padding: '9px 0' }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#9ca3af', fontFamily: 'Rajdhani', fontWeight: 600 }}>{label}</span>
                    <input
                      style={{ width: 110, padding: '6px 10px', borderRadius: 4, fontSize: 14, fontFamily: 'Orbitron', fontWeight: 700, textAlign: 'right', background: '#0d1117', border: '1px solid #374151', color: '#f9fafb', outline: 'none' }}
                      value={val as string} onChange={e => (setter as any)(e.target.value)} placeholder={placeholder as string} type="number" min={0}
                    />
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color, letterSpacing: 1, marginBottom: 10 }}>BOWLING</div>
                {[
                  ['TOTAL WICKETS', totalWickets, setTotalWickets, '0'],
                  ['BEST BOWLING', bestBowling, setBestBowling, '5/27'],
                ].map(([label, val, setter, placeholder]) => (
                  <div key={label as string} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1f2937', padding: '9px 0' }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#9ca3af', fontFamily: 'Rajdhani', fontWeight: 600 }}>{label}</span>
                    <input
                      style={{ width: 110, padding: '6px 10px', borderRadius: 4, fontSize: 14, fontFamily: 'Orbitron', fontWeight: 700, textAlign: 'right', background: '#0d1117', border: '1px solid #374151', color: '#f9fafb', outline: 'none' }}
                      value={val as string} onChange={e => (setter as any)(e.target.value)} placeholder={placeholder as string}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* Right sidebar */}
        <div style={{ position: 'sticky', top: 80 }}>
          {/* Preview card */}
          <div style={{
            background: `linear-gradient(135deg, ${color}15, #111827)`,
            border: `1px solid ${color}33`, borderRadius: 12, padding: 18,
            position: 'relative', overflow: 'hidden', marginBottom: 14,
            boxShadow: `0 0 30px ${color}11`,
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
            <div style={{ position: 'absolute', right: -4, top: -4, fontSize: 70, opacity: 0.05, lineHeight: 1 }}>{roleIcon[role]}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: `${color}22`, border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 22, color, boxShadow: `0 0 16px ${color}33` }}>
                {name ? name.charAt(0).toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1, marginBottom: 4 }}>
                  {name || 'Player Name'}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}33`, padding: '2px 7px', borderRadius: 2 }}>
                    {role.toUpperCase()}
                  </span>
                  {battingStyle && (
                    <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color: '#9ca3af', background: '#1f2937', padding: '2px 7px', borderRadius: 2 }}>
                      {battingStyle.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              {age && <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 7, padding: '5px 9px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{age}</div>
                <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>AGE</div>
              </div>}
            </div>
            {bowlingStyle !== 'None' && (
              <div style={{ marginTop: 10, fontSize: 11, color: '#4b5563' }}>⚾ <span style={{ color: '#9ca3af' }}>{bowlingStyle}</span></div>
            )}
            {baseTeam && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#4b5563' }}>🛡️ <span style={{ color: '#9ca3af' }}>{baseTeam}</span></div>
            )}
          </div>

          {/* Stats preview */}
          {(totalRuns || totalWickets) && (
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>STATS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {totalRuns && <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{totalRuns}</div>
                  <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>RUNS</div>
                </div>}
                {totalWickets && <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{totalWickets}</div>
                  <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>WKTS</div>
                </div>}
                {totalMatches && <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{totalMatches}</div>
                  <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>MATCHES</div>
                </div>}
                {highScore && <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{highScore}</div>
                  <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>HS</div>
                </div>}
              </div>
            </div>
          )}

          {/* Completion */}
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>COMPLETION</div>
            {[
              { label: 'Name', done: !!name.trim() },
              { label: 'Role', done: true },
              { label: 'Batting Style', done: true },
              { label: 'Bowling Style', done: true },
              { label: 'Age', done: !!age },
              { label: 'Base Team', done: !!baseTeam },
              { label: 'Stats Added', done: !!(totalRuns || totalWickets) },
            ].map(({ label, done }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #0d1117', fontSize: 12 }}>
                <span style={{ color: done ? '#22c55e' : '#374151', fontSize: 14, width: 16, textAlign: 'center' }}>{done ? '✓' : '○'}</span>
                <span style={{ color: done ? '#9ca3af' : '#374151', fontFamily: 'Rajdhani' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleSave} disabled={saved} style={{
              width: '100%', padding: '13px', borderRadius: 8, fontSize: 15,
              background: saved ? '#22c55e' : `linear-gradient(135deg, ${color}cc, ${color})`,
              border: 'none', color: '#000', cursor: 'pointer',
              fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1, transition: 'all 0.3s',
            }}>
              {saved ? '✓ PLAYER ADDED!' : `${roleIcon[role]} ADD PLAYER`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Players list page ───────────────────────────────────────────────────── */

function PlayerDetailModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const { getPlayerHistory } = useApp();
  const history = getPlayerHistory(player.id);
  const color = roleColors[player.role];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#111827', border: `1px solid ${color}33`, borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: '14px 14px 0 0' }} />

        {/* Header */}
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: `${color}22`, border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 24, color }}>
              {player.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{player.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}33`, padding: '2px 7px', borderRadius: 2 }}>{player.role.toUpperCase()}</span>
                <span style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#6b7280', background: '#1f2937', padding: '2px 7px', borderRadius: 2 }}>{player.battingStyle.toUpperCase()}</span>
                {player.age > 0 && <span style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#6b7280', background: '#1f2937', padding: '2px 7px', borderRadius: 2 }}>AGE {player.age}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 22px' }}>
          {/* Career Stats */}
          {player.stats && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: color, letterSpacing: 2, marginBottom: 10 }}>CAREER STATISTICS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'MATCHES', val: player.stats.totalMatches },
                  { label: 'RUNS', val: player.stats.totalRuns },
                  { label: 'WICKETS', val: player.stats.totalWickets },
                  { label: 'HIGH SCORE', val: player.stats.highScore },
                  { label: 'BEST BOWL', val: player.stats.bestBowling },
                  { label: 'BALLS FACED', val: player.stats.totalBalls },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: '#0d1117', borderRadius: 7, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 17, fontWeight: 900, color }}>{val}</div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tournament History */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 8 }}>
              🏆 TOURNAMENTS ({history.tournaments.length})
            </div>
            {history.tournaments.length === 0 ? (
              <div style={{ fontSize: 12, color: '#374151', fontFamily: 'Rajdhani' }}>No tournament records</div>
            ) : history.tournaments.map(t => (
              <div key={t.id} style={{ padding: '7px 10px', background: '#0d1117', borderRadius: 6, marginBottom: 5, fontSize: 12, fontFamily: 'Rajdhani', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f9fafb', fontWeight: 700 }}>{t.name}</span>
                <span style={{ color: '#4b5563' }}>{t.level} · {t.format}</span>
              </div>
            ))}
          </div>

          {/* Match History */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 8 }}>
              🏏 MATCHES ({history.matches.length})
            </div>
            {history.matches.length === 0 ? (
              <div style={{ fontSize: 12, color: '#374151', fontFamily: 'Rajdhani' }}>No match records</div>
            ) : history.matches.slice(0, 5).map(m => (
              <div key={m.id} style={{ padding: '7px 10px', background: '#0d1117', borderRadius: 6, marginBottom: 5, fontSize: 12, fontFamily: 'Rajdhani', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f9fafb', fontWeight: 700 }}>{m.teamA.shortName} vs {m.teamB.shortName}</span>
                <span style={{ color: '#4b5563' }}>{m.date}</span>
              </div>
            ))}
          </div>

          {/* Teams */}
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 8 }}>
              🛡️ TEAMS PLAYED FOR ({history.teams.length})
            </div>
            {history.teams.length === 0 ? (
              <div style={{ fontSize: 12, color: '#374151', fontFamily: 'Rajdhani' }}>No team records</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {history.teams.map(t => (
                  <span key={t.id} style={{ background: `${t.color}15`, border: `1px solid ${t.color}33`, color: t.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'Orbitron', fontWeight: 700 }}>
                    {t.shortName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Players() {
  const { players, addPlayer, setActivePage } = useApp();
  const [filterRole, setFilterRole] = useState<Player['role'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const filtered = players.filter(p => {
    if (filterRole !== 'all' && p.role !== filterRole) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 36, letterSpacing: 4, color: '#f9fafb', margin: 0 }}>PLAYERS</h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2, fontFamily: 'Rajdhani' }}>{players.length} players in roster</div>
        </div>
        <button onClick={() => setActivePage('add-player')} style={{
          padding: '10px 22px', borderRadius: 8, fontSize: 13,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#000',
          cursor: 'pointer', fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1,
          boxShadow: '0 0 20px #22c55e33',
        }}>+ ADD PLAYER</button>
      </div>

      {/* Role summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {ROLES.map(r => (
          <div key={r} style={{ flex: 1, background: '#111827', border: `1px solid ${roleColors[r]}22`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1, marginBottom: 3 }}>{r.toUpperCase()}</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: roleColors[r] }}>
              {players.filter(p => p.role === r).length}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          style={{ padding: '7px 12px', borderRadius: 6, fontSize: 13, width: 220, background: '#111827', border: '1px solid #1f2937', color: '#f9fafb', outline: 'none', fontFamily: 'Rajdhani' }}
          placeholder="🔍 Search players..." value={search} onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', ...ROLES] as const).map(r => (
            <button key={r} onClick={() => setFilterRole(r)} style={{
              padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
              border: `1px solid ${filterRole === r ? (roleColors[r] || '#22c55e') : '#1f2937'}`,
              background: filterRole === r ? `${roleColors[r] || '#22c55e'}15` : 'transparent',
              color: filterRole === r ? (roleColors[r] || '#22c55e') : '#9ca3af',
              fontSize: 11, fontFamily: 'Orbitron', fontWeight: 700, transition: 'all 0.15s',
            }}>{r.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
        {filtered.map(p => {
          const color = roleColors[p.role];
          const hasHistory = (p.tournamentsPlayed?.length || 0) + (p.matchesPlayed?.length || 0) > 0;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlayer(p)}
              style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: '14px 16px', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}44`; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1f2937'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: `${color}22`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 18, color, flexShrink: 0 }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: 14, fontFamily: 'Rajdhani' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{p.team}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 8, fontFamily: 'Orbitron', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}33`, padding: '2px 5px', borderRadius: 2 }}>
                    {p.role.toUpperCase().slice(0, 2)}
                  </span>
                  {hasHistory && (
                    <span style={{ fontSize: 8, color: '#22c55e', fontFamily: 'Orbitron', background: '#22c55e11', padding: '1px 5px', borderRadius: 2 }}>
                      HISTORY
                    </span>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#4b5563', fontFamily: 'Rajdhani' }}>🏏 {p.battingStyle}</span>
                {p.bowlingStyle !== 'None' && <span style={{ color: '#4b5563', fontFamily: 'Rajdhani' }}>⚾ {p.bowlingStyle}</span>}
                {p.age > 0 && <span style={{ color: '#4b5563', marginLeft: 'auto', fontFamily: 'Rajdhani' }}>Age {p.age}</span>}
              </div>
              {p.stats && (p.stats.totalRuns > 0 || p.stats.totalWickets > 0) && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #1f2937', display: 'flex', gap: 10, fontSize: 11 }}>
                  {p.stats.totalRuns > 0 && (
                    <div>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 900, color }}>{p.stats.totalRuns}</span>
                      <span style={{ color: '#4b5563', marginLeft: 3, fontFamily: 'Rajdhani' }}>runs</span>
                    </div>
                  )}
                  {p.stats.totalWickets > 0 && (
                    <div>
                      <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 900, color }}>{p.stats.totalWickets}</span>
                      <span style={{ color: '#4b5563', marginLeft: 3, fontFamily: 'Rajdhani' }}>wkts</span>
                    </div>
                  )}
                  {p.stats.totalMatches > 0 && (
                    <div style={{ marginLeft: 'auto' }}>
                      <span style={{ color: '#4b5563', fontFamily: 'Rajdhani' }}>{p.stats.totalMatches}m</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedPlayer && <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  );
}