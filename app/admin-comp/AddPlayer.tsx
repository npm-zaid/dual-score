'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useApp, Player } from './AppContext';

/* ─── constants ─── */
const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'] as const;
const BATTING_STYLES = ['Right-hand', 'Left-hand'] as const;
const BOWLING_STYLES = [
  'Fast', 'Fast-medium', 'Medium', 'Off-break',
  'Leg-spin', 'Slow left-arm', 'Left-arm orthodox', 'None',
] as const;
const COUNTRIES = [
  'India', 'Australia', 'England', 'Pakistan', 'South Africa',
  'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan', 'Other',
];

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

/* ─── player card live preview ─── */
function PlayerPreviewCard({ player, color }: { player: Partial<Player>; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'scale(0.97)';
    el.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 10);
  }, [player.role, player.name]);

  return (
    <div ref={ref} style={{
      background: `linear-gradient(135deg, ${color}15, #111827)`,
      border: `1px solid ${color}33`,
      borderRadius: 12, padding: 20,
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 0 30px ${color}11`,
      transition: 'border-color 0.4s, box-shadow 0.4s',
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />

      {/* Large ghost role icon */}
      <div style={{
        position: 'absolute', right: -8, top: -8,
        fontSize: 90, opacity: 0.05, lineHeight: 1,
        transition: 'all 0.4s',
      }}>
        {roleIcon[player.role || 'Batsman']}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: `${color}22`, border: `2px solid ${color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Bebas Neue', fontSize: 24, color,
          boxShadow: `0 0 16px ${color}33`,
          transition: 'all 0.3s',
        }}>
          {player.name ? player.name.charAt(0).toUpperCase() : '?'}
        </div>

        {/* Details */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2,
            color: '#f9fafb', lineHeight: 1, marginBottom: 4,
          }}>
            {player.name || 'Player Name'}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
              color, background: `${color}18`,
              border: `1px solid ${color}33`,
              padding: '2px 8px', borderRadius: 2,
            }}>
              {(player.role || 'BATSMAN').toUpperCase()}
            </span>
            {player.battingStyle && (
              <span style={{
                fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
                color: '#9ca3af', background: '#1f2937',
                padding: '2px 8px', borderRadius: 2,
              }}>
                {player.battingStyle.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {player.age ? (
          <div style={{
            textAlign: 'center',
            background: '#0d1117', border: '1px solid #1f2937',
            borderRadius: 8, padding: '6px 10px',
          }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color }}>{player.age}</div>
            <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron' }}>AGE</div>
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
        {player.bowlingStyle && player.bowlingStyle !== 'None' && (
          <div style={{ fontSize: 11, color: '#4b5563' }}>
            ⚾ <span style={{ color: '#9ca3af' }}>{player.bowlingStyle}</span>
          </div>
        )}
        {player.team && (
          <div style={{ fontSize: 11, color: '#4b5563' }}>
            🛡️ <span style={{ color: '#9ca3af' }}>{player.team}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── stat input row ─── */
function StatInput({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
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
        className="input-field"
        style={{
          width: 120, padding: '6px 10px', borderRadius: 4,
          fontSize: 14, fontFamily: 'Orbitron', fontWeight: 700,
          textAlign: 'right',
        }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type="number"
        min={0}
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

  // Stats
  const [matches, setMatches] = useState('');
  const [runs, setRuns] = useState('');
  const [average, setAverage] = useState('');
  const [strikeRate, setStrikeRate] = useState('');
  const [wickets, setWickets] = useState('');
  const [economy, setEconomy] = useState('');
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
        team: baseTeam.trim(),
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
    setMatches(''); setRuns(''); setAverage('');
    setStrikeRate(''); setWickets(''); setEconomy('');
    setHighScore(''); setBestBowling('');
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

  const inputSt: React.CSSProperties = { padding: '10px 14px', borderRadius: 6, fontSize: 14 };

  const showBattingStats = role === 'Batsman' || role === 'All-rounder' || role === 'Wicket-keeper';
  const showBowlingStats = role === 'Bowler' || role === 'All-rounder';

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
        <h1 className="font-display" style={{ fontSize: 32, letterSpacing: 4, color: '#f9fafb', lineHeight: 1 }}>
          ADD PLAYER
        </h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4 }}>
          Register a new player to the roster
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Left column: forms */}
        <div>
          {/* ── Role selector (always first, visually dominant) ── */}
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
                      borderRadius: 8, cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      boxShadow: selected ? `0 0 16px ${rc}22` : 'none',
                      transform: selected ? 'scale(1.01)' : 'scale(1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 20 }}>{roleIcon[r]}</span>
                      <span style={{
                        fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1,
                        color: selected ? rc : '#9ca3af',
                        transition: 'color 0.2s',
                      }}>
                        {r}
                      </span>
                      {selected && (
                        <span style={{
                          marginLeft: 'auto', width: 18, height: 18,
                          background: rc, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: '#000', fontWeight: 900,
                          flexShrink: 0,
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
                  className="input-field"
                  style={{ ...inputSt, borderColor: errors.name ? '#ef4444' : undefined }}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                />
                {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
              </div>

              <div>
                {lbl('AGE')}
                <input
                  className="input-field" type="number"
                  style={{ ...inputSt, borderColor: errors.age ? '#ef4444' : undefined }}
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="25" min={10} max={60}
                />
                {errors.age && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.age}</div>}
              </div>

              <div>
                {lbl('JERSEY NUMBER')}
                <input
                  className="input-field" type="number"
                  style={inputSt}
                  value={jerseyNo}
                  onChange={e => setJerseyNo(e.target.value)}
                  placeholder="7"
                />
              </div>

              <div>
                {lbl('NATIONALITY')}
                <select
                  className="select-field"
                  style={inputSt}
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                {lbl('BASE TEAM')}
                <input
                  className="input-field"
                  style={inputSt}
                  value={baseTeam}
                  onChange={e => setBaseTeam(e.target.value)}
                  placeholder="Team name"
                  list="teams-list"
                />
                <datalist id="teams-list">
                  {teams.map(t => <option key={t.id} value={t.name} />)}
                </datalist>
              </div>
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
                      opacity: s === 'None' && role === 'Batsman' ? 1 : 1,
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
              <div style={{ paddingRight: 20, borderRight: '1px solid #1f2937' }}>
                <div style={{ fontSize: 11, fontFamily: 'Orbitron', color: color, letterSpacing: 1, marginBottom: 8 }}>
                  BATTING
                </div>
                <StatInput label="Matches" value={matches} onChange={setMatches} placeholder="0" />
                <StatInput label="Runs" value={runs} onChange={setRuns} placeholder="0" />
                <StatInput label="Average" value={average} onChange={setAverage} placeholder="0.00" />
                <StatInput label="Strike Rate" value={strikeRate} onChange={setStrikeRate} placeholder="0.00" />
                <StatInput label="High Score" value={highScore} onChange={setHighScore} placeholder="0" />
              </div>

              <div style={{ paddingLeft: 20 }}>
                <div style={{ fontSize: 11, fontFamily: 'Orbitron', color: color, letterSpacing: 1, marginBottom: 8 }}>
                  BOWLING
                </div>
                <StatInput label="Wickets" value={wickets} onChange={setWickets} placeholder="0" />
                <StatInput label="Economy" value={economy} onChange={setEconomy} placeholder="0.00" />
                <StatInput label="Best Bowling" value={bestBowling} onChange={setBestBowling} placeholder="0" />
              </div>
            </div>
          </Section>

          {/* ── Bio ── */}
          <Section title="BIO / NOTES" icon="📝" delay={300}>
            <textarea
              className="input-field"
              style={{ padding: '10px 14px', borderRadius: 6, fontSize: 14, height: 90, resize: 'vertical' }}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Brief description about the player, achievements, etc..."
            />
          </Section>
        </div>

        {/* Right column: live preview card (sticky) */}
        <div style={{ position: 'sticky', top: 80 }}>
          {/* Animated preview card */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, fontFamily: 'Orbitron', color: '#374151',
              letterSpacing: 2, marginBottom: 8,
            }}>
              LIVE PREVIEW
            </div>
            <PlayerPreviewCard
              player={{ name, role, battingStyle, bowlingStyle, age: parseInt(age) || 0, team: baseTeam }}
              color={color}
            />
          </div>

          {/* Jersey number display */}
          {jerseyNo && (
            <div style={{
              textAlign: 'center',
              background: '#0d1117',
              border: `1px solid ${color}22`,
              borderRadius: 10, padding: '16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, color: '#374151', fontFamily: 'Orbitron', letterSpacing: 2, marginBottom: 4 }}>
                JERSEY
              </div>
              <div style={{
                fontFamily: 'Bebas Neue', fontSize: 60,
                color, lineHeight: 1,
                textShadow: `0 0 30px ${color}44`,
              }}>
                #{jerseyNo}
              </div>
            </div>
          )}

          {/* Quick stats preview */}
          {(runs || wickets) && (
            <div style={{
              background: '#0d1117', border: '1px solid #1f2937',
              borderRadius: 10, padding: '14px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>
                STATS PREVIEW
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {runs && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color }}>{runs}</div>
                    <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron' }}>RUNS</div>
                  </div>
                )}
                {average && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color }}>{average}</div>
                    <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron' }}>AVG</div>
                  </div>
                )}
                {wickets && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color }}>{wickets}</div>
                    <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron' }}>WKTS</div>
                  </div>
                )}
                {economy && (
                  <div style={{ background: '#111827', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color }}>{economy}</div>
                    <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron' }}>ECO</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div style={{
            background: '#0d1117', border: '1px solid #1f2937',
            borderRadius: 10, padding: '14px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#374151', letterSpacing: 2, marginBottom: 10 }}>
              COMPLETION
            </div>
            {[
              { label: 'Name', done: !!name.trim() },
              { label: 'Role', done: true },
              { label: 'Batting Style', done: true },
              { label: 'Bowling Style', done: true },
              { label: 'Age', done: !!age },
              { label: 'Base Team', done: !!baseTeam },
              { label: 'Stats Added', done: !!(runs || wickets) },
            ].map(({ label, done }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 0', borderBottom: '1px solid #0d1117',
                fontSize: 12,
              }}>
                <span style={{ color: done ? '#22c55e' : '#374151', fontSize: 14, width: 16, textAlign: 'center' }}>
                  {done ? '✓' : '○'}
                </span>
                <span style={{ color: done ? '#9ca3af' : '#374151' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="btn-primary"
              style={{
                width: '100%', padding: '13px',
                borderRadius: 8, fontSize: 16,
                background: saved ? '#22c55e' : saving ? `${color}88` : undefined,
                transition: 'all 0.3s',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {saved ? '✓ PLAYER ADDED!' : saving ? 'SAVING...' : `${roleIcon[role]} ADD PLAYER`}
            </button>
            <button onClick={handleReset} className="btn-secondary" style={{
              width: '100%', padding: '10px', borderRadius: 8, fontSize: 14,
            }}>
              RESET FORM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
