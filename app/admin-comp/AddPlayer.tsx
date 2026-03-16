'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useApp, Player } from './AppContext';

/* ─── constants ─── */
const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'] as const;
const BATTING_STYLES = ['Right-hand', 'Left-hand'] as const;
const BOWLING_STYLES = [
  'Fast', 'Fast-medium', 'Medium', 'Off-break',
  'Leg-spin', 'Slow left-arm', 'Left-arm orthodox', 'None',
] as const;

const NATIONALITY_FLAGS: Record<string, string> = {
  'India': '🇮🇳', 'Pakistan': '🇵🇰', 'Australia': '🇦🇺', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'South Africa': '🇿🇦', 'New Zealand': '🇳🇿', 'West Indies': '🏝️', 'Sri Lanka': '🇱🇰',
  'Bangladesh': '🇧🇩', 'Afghanistan': '🇦🇫', 'Zimbabwe': '🇿🇼', 'Ireland': '🇮🇪',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Netherlands': '🇳🇱', 'UAE': '🇦🇪', 'Other': '🌍',
};
const COUNTRIES = Object.keys(NATIONALITY_FLAGS);

const roleColors: Record<string, string> = {
  Batsman: '#3b82f6',
  Bowler: '#ef4444',
  'All-rounder': '#22c55e',
  'Wicket-keeper': '#eab308',
};
const roleDesc: Record<string, string> = {
  Batsman: 'Specialist run-scorer',
  Bowler: 'Specialist wicket-taker',
  'All-rounder': 'Contributes with bat & ball',
  'Wicket-keeper': 'Keeper + specialist batter',
};
const roleIcon: Record<string, string> = {
  Batsman: '🏏', Bowler: '⚾', 'All-rounder': '⚡', 'Wicket-keeper': '🧤',
};

/* ─── animated section ─── */
function Section({ title, icon, children, delay = 0 }: {
  title: string; icon: string; children: React.ReactNode; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div ref={ref} style={{
      background: '#111827', border: '1px solid #1f2937',
      borderRadius: 10, overflow: 'hidden', marginBottom: 16,
    }}>
      <div style={{
        padding: '12px 20px', background: '#0d1117',
        borderBottom: '1px solid #1f2937',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 2, color: '#f9fafb' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

/* ─── stat input row ─── */
interface StatInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isText?: boolean;
}
function StatInput({ label, value, onChange, placeholder, isText = false }: StatInputProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderBottom: '1px solid #1f2937', padding: '10px 0',
    }}>
      <span style={{
        flex: 1, fontSize: 12, color: '#9ca3af',
        fontFamily: 'Rajdhani', fontWeight: 600,
      }}>{label}</span>
      <input
        style={{
          width: 120, padding: '6px 10px', borderRadius: 4,
          fontSize: 14, fontFamily: 'Orbitron', fontWeight: 700,
          textAlign: 'right', background: '#0d1117', border: '1px solid #374151',
          color: '#f9fafb', outline: 'none',
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={isText ? 'text' : 'number'}
        min={isText ? undefined : 0}
      />
    </div>
  );
}

/* ─── main component ─── */
export default function AddPlayer() {
  const { addPlayer, teams, setActivePage } = useApp();

  // Basic info
  const [name, setName] = useState('');
  const [role, setRole] = useState<typeof ROLES[number]>('Batsman');
  const [battingStyle, setBattingStyle] = useState<typeof BATTING_STYLES[number]>('Right-hand');
  const [bowlingStyle, setBowlingStyle] = useState<typeof BOWLING_STYLES[number]>('None');
  const [age, setAge] = useState('');
  const [nationality, setNationality] = useState('India');
  const [baseTeam, setBaseTeam] = useState('');
  const [jerseyNo, setJerseyNo] = useState('');
  const [bio, setBio] = useState('');

  // Stats — kept as individual state to avoid tuple inference issues
  const [totalRuns, setTotalRuns] = useState('');
  const [totalBalls, setTotalBalls] = useState('');
  const [totalWickets, setTotalWickets] = useState('');
  const [totalMatches, setTotalMatches] = useState('');
  const [highScore, setHighScore] = useState('');
  const [bestBowling, setBestBowling] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const color = roleColors[role];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Player name is required';
    if (age && (parseInt(age) < 10 || parseInt(age) > 60)) e.age = 'Enter a valid age (10–60)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      const player: Player = {
        id: `p${Date.now()}`,
        name: name.trim(),
        role,
        battingStyle,
        bowlingStyle,
        age: parseInt(age) || 0,
        nationality,                          // ← required field
        jerseyNo: parseInt(jerseyNo) || undefined,
        team: baseTeam.trim(),
        bio: bio.trim() || undefined,
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
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setActivePage('players');
      }, 1400);
    }, 400);
  };

  const handleReset = () => {
    setName(''); setRole('Batsman'); setBattingStyle('Right-hand');
    setBowlingStyle('None'); setAge(''); setNationality('India');
    setBaseTeam(''); setJerseyNo(''); setBio('');
    setTotalRuns(''); setTotalBalls(''); setTotalWickets('');
    setTotalMatches(''); setHighScore(''); setBestBowling('');
    setErrors({});
  };

  const lbl = (txt: string, required = false) => (
    <label style={{
      display: 'block', marginBottom: 6,
      fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700,
      color: '#4b5563', letterSpacing: 1.5,
    }}>
      {txt}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
  );

  const inputSt: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 6, fontSize: 14,
    background: '#0d1117', border: '1px solid #374151', color: '#f9fafb',
    width: '100%', outline: 'none', fontFamily: 'Rajdhani', boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: 24, maxWidth: 920 }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setActivePage('players')}
          style={{
            background: 'none', border: 'none', color: '#4b5563',
            fontSize: 12, cursor: 'pointer', fontFamily: 'Orbitron',
            marginBottom: 6, padding: 0,
          }}
        >
          ← BACK TO PLAYERS
        </button>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: 4, color: '#f9fafb', lineHeight: 1, margin: 0 }}>
          ADD PLAYER
        </h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4, fontFamily: 'Rajdhani' }}>
          Register a new player to the roster
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Left column: forms */}
        <div>
          {/* ── Role selector ── */}
          <Section title="SELECT ROLE" icon="⚡" delay={60}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {ROLES.map(r => {
                const rc = roleColors[r];
                const selected = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      padding: '14px 16px',
                      border: `2px solid ${selected ? rc : '#1f2937'}`,
                      background: selected ? `${rc}12` : '#0d1117',
                      borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s',
                      boxShadow: selected ? `0 0 16px ${rc}22` : 'none',
                      transform: selected ? 'scale(1.01)' : 'scale(1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>{roleIcon[r]}</span>
                      <span style={{
                        fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1,
                        color: selected ? rc : '#9ca3af', transition: 'color 0.2s',
                      }}>
                        {r}
                      </span>
                      {selected && (
                        <span style={{
                          marginLeft: 'auto', width: 18, height: 18,
                          background: rc, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: '#000', fontWeight: 900, flexShrink: 0,
                        }}>✓</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#374151' }}>{roleDesc[r]}</div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Personal info ── */}
          <Section title="PLAYER DETAILS" icon="👤" delay={120}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                {lbl('FULL NAME', true)}
                <input
                  style={{ ...inputSt, borderColor: errors.name ? '#ef4444' : undefined }}
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                />
                {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
              </div>

              <div>
                {lbl('AGE')}
                <input
                  style={{ ...inputSt, borderColor: errors.age ? '#ef4444' : undefined }}
                  type="number" value={age} onChange={e => setAge(e.target.value)}
                  placeholder="25" min={10} max={60}
                />
                {errors.age && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.age}</div>}
              </div>

              <div>
                {lbl('JERSEY NUMBER')}
                <input
                  style={inputSt} type="number" value={jerseyNo}
                  onChange={e => setJerseyNo(e.target.value)}
                  placeholder="7"
                />
              </div>

              <div>
                {lbl('BASE TEAM')}
                <input
                  style={inputSt} value={baseTeam}
                  onChange={e => setBaseTeam(e.target.value)}
                  placeholder="Team name" list="teams-list"
                />
                <datalist id="teams-list">
                  {teams.map(t => <option key={t.id} value={t.name} />)}
                </datalist>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                {lbl('BIO / NOTES')}
                <textarea
                  style={{ ...inputSt, height: 68, resize: 'vertical' }}
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Brief description, career highlights..."
                />
              </div>
            </div>
          </Section>

          {/* ── Nationality ── */}
          <Section title="NATIONALITY" icon="🌍" delay={150}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
              {COUNTRIES.map(c => (
                <button
                  key={c}
                  onClick={() => setNationality(c)}
                  style={{
                    padding: '8px 6px',
                    border: `1px solid ${nationality === c ? color : '#1f2937'}`,
                    background: nationality === c ? `${color}15` : '#0d1117',
                    color: nationality === c ? color : '#6b7280',
                    borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    fontFamily: 'Rajdhani', fontWeight: 600, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                    boxShadow: nationality === c ? `0 0 8px ${color}22` : 'none',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{NATIONALITY_FLAGS[c]}</span>
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Playing style ── */}
          <Section title="PLAYING STYLE" icon="🎯" delay={180}>
            <div style={{ marginBottom: 16 }}>
              {lbl('BATTING STANCE')}
              <div style={{ display: 'flex', gap: 10 }}>
                {BATTING_STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBattingStyle(s)}
                    style={{
                      flex: 1, padding: '10px',
                      border: `2px solid ${battingStyle === s ? color : '#1f2937'}`,
                      background: battingStyle === s ? `${color}12` : '#0d1117',
                      color: battingStyle === s ? color : '#9ca3af',
                      borderRadius: 6, cursor: 'pointer',
                      fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14,
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <span>{s === 'Right-hand' ? '🏏' : '🔄'}</span>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              {lbl('BOWLING STYLE')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                {BOWLING_STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setBowlingStyle(s)}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${bowlingStyle === s ? color : '#1f2937'}`,
                      background: bowlingStyle === s ? `${color}12` : '#0d1117',
                      color: bowlingStyle === s ? color : '#9ca3af',
                      borderRadius: 6, cursor: 'pointer',
                      fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 13,
                      transition: 'all 0.15s', textAlign: 'left',
                    }}
                  >
                    {bowlingStyle === s && <span style={{ marginRight: 4 }}>✓</span>}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Career stats ── */}
          <Section title="CAREER STATS (OPTIONAL)" icon="📊" delay={240}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {/* Batting */}
              <div style={{ paddingRight: 20, borderRight: '1px solid #1f2937' }}>
                <div style={{ fontSize: 11, fontFamily: 'Orbitron', color, letterSpacing: 1, marginBottom: 8 }}>BATTING</div>
                <StatInput label="Total Runs"    value={totalRuns}    onChange={setTotalRuns}    placeholder="0" />
                <StatInput label="Total Balls"   value={totalBalls}   onChange={setTotalBalls}   placeholder="0" />
                <StatInput label="High Score"    value={highScore}    onChange={setHighScore}    placeholder="0" />
                <StatInput label="Total Matches" value={totalMatches} onChange={setTotalMatches} placeholder="0" />
              </div>
              {/* Bowling */}
              <div style={{ paddingLeft: 20 }}>
                <div style={{ fontSize: 11, fontFamily: 'Orbitron', color, letterSpacing: 1, marginBottom: 8 }}>BOWLING</div>
                <StatInput label="Total Wickets" value={totalWickets} onChange={setTotalWickets} placeholder="0" />
                <StatInput label="Best Bowling"  value={bestBowling}  onChange={setBestBowling}  placeholder="5/27" isText />
              </div>
            </div>
          </Section>
        </div>

        {/* Right column: live preview (sticky) */}
        <div style={{ position: 'sticky', top: 80 }}>
          {/* Preview card */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 8 }}>LIVE PREVIEW</div>
            <div style={{
              background: `linear-gradient(135deg, ${color}15, #111827)`,
              border: `1px solid ${color}33`, borderRadius: 12, padding: 18,
              position: 'relative', overflow: 'hidden', boxShadow: `0 0 30px ${color}11`,
              transition: 'border-color 0.4s, box-shadow 0.4s',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <div style={{ position: 'absolute', right: -8, top: -8, fontSize: 80, opacity: 0.05, lineHeight: 1 }}>{roleIcon[role]}</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0, background: `${color}22`, border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 22, color, boxShadow: `0 0 16px ${color}33` }}>
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1, marginBottom: 5 }}>
                    {name || 'Player Name'}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}33`, padding: '2px 7px', borderRadius: 2 }}>
                      {role.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color: '#9ca3af', background: '#1f2937', padding: '2px 7px', borderRadius: 2 }}>
                      {NATIONALITY_FLAGS[nationality]} {nationality.toUpperCase().slice(0, 6)}
                    </span>
                  </div>
                </div>
                {age && (
                  <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 7, padding: '5px 9px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{age}</div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>AGE</div>
                  </div>
                )}
              </div>
              {jerseyNo && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: 44, color, lineHeight: 1, textShadow: `0 0 20px ${color}44` }}>
                    #{jerseyNo}
                  </span>
                </div>
              )}
              {bowlingStyle !== 'None' && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#4b5563' }}>⚾ <span style={{ color: '#9ca3af' }}>{bowlingStyle}</span></div>
              )}
              {baseTeam && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#4b5563' }}>🛡️ <span style={{ color: '#9ca3af' }}>{baseTeam}</span></div>
              )}
            </div>
          </div>

          {/* Stats preview */}
          {(totalRuns || totalWickets) && (
            <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>STATS PREVIEW</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {totalRuns && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{totalRuns}</div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>RUNS</div>
                  </div>
                )}
                {totalWickets && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{totalWickets}</div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>WKTS</div>
                  </div>
                )}
                {totalMatches && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{totalMatches}</div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>MATCHES</div>
                  </div>
                )}
                {highScore && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{highScore}</div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron' }}>HS</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div style={{ background: '#0d1117', border: '1px solid #1f2937', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>COMPLETION</div>
            {[
              { label: 'Name',         done: !!name.trim() },
              { label: 'Role',         done: true },
              { label: 'Nationality',  done: !!nationality },
              { label: 'Batting Style',done: true },
              { label: 'Bowling Style',done: true },
              { label: 'Age',          done: !!age },
              { label: 'Base Team',    done: !!baseTeam },
              { label: 'Stats Added',  done: !!(totalRuns || totalWickets) },
            ].map(({ label, done }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #0d1117', fontSize: 12 }}>
                <span style={{ color: done ? '#22c55e' : '#374151', fontSize: 14, width: 16, textAlign: 'center' }}>{done ? '✓' : '○'}</span>
                <span style={{ color: done ? '#9ca3af' : '#374151', fontFamily: 'Rajdhani' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                width: '100%', padding: '13px', borderRadius: 8, fontSize: 16,
                background: saved ? '#22c55e' : saving ? `${color}88` : `linear-gradient(135deg, ${color}cc, ${color})`,
                border: 'none', color: '#000', cursor: 'pointer',
                fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1,
                transition: 'all 0.3s',
              }}
            >
              {saved ? '✓ PLAYER ADDED!' : saving ? 'SAVING...' : `${roleIcon[role]} ADD PLAYER`}
            </button>
            <button
              onClick={handleReset}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, fontSize: 14,
                background: 'transparent', border: '1px solid #374151', color: '#6b7280',
                cursor: 'pointer', fontFamily: 'Orbitron', letterSpacing: 1,
              }}
            >
              RESET FORM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}