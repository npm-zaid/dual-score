'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useApp, Team, Player } from './AppContext';

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f97316',
  '#8b5cf6', '#eab308', '#06b6d4', '#ec4899',
  '#14b8a6', '#a855f7', '#f43f5e', '#84cc16',
];

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'] as const;

const roleColors: Record<string, string> = {
  Batsman: '#3b82f6',
  Bowler: '#ef4444',
  'All-rounder': '#22c55e',
  'Wicket-keeper': '#eab308',
};

const roleIcons: Record<string, string> = {
  Batsman: '🏏',
  Bowler: '⚾',
  'All-rounder': '⚡',
  'Wicket-keeper': '🧤',
};

/* ─── tiny animated section wrapper ─── */
function Section({
  title, icon, children, delay = 0,
}: {
  title: string; icon: string; children: React.ReactNode; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div ref={ref} style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Section header bar */}
      <div style={{
        padding: '12px 20px',
        background: '#0d1117',
        borderBottom: '1px solid #1f2937',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{
          fontFamily: 'Bebas Neue', fontSize: 16,
          letterSpacing: 2, color: '#f9fafb',
        }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

/* ─── color swatch ─── */
function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={color}
      style={{
        width: 32, height: 32, borderRadius: 6,
        background: color, border: 'none', cursor: 'pointer',
        outline: selected ? `3px solid #fff` : '3px solid transparent',
        outlineOffset: 2,
        boxShadow: selected ? `0 0 12px ${color}99` : 'none',
        transform: selected ? 'scale(1.15)' : 'scale(1)',
        transition: 'all 0.15s ease',
      }}
    />
  );
}

/* ─── player row inside squad selector ─── */
function PlayerRow({
  player, selectedSide, isInA, isInB, onToggleA, onToggleB,
}: {
  player: Player;
  selectedSide: 'A' | 'B' | 'both';
  isInA: boolean; isInB: boolean;
  onToggleA: () => void; onToggleB: () => void;
}) {
  const color = roleColors[player.role];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      borderBottom: '1px solid #1f2937',
      background: isInA || isInB ? '#22c55e05' : 'transparent',
      transition: 'background 0.15s',
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Bebas Neue', fontSize: 16, color,
      }}>
        {player.name.charAt(0)}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb', fontFamily: 'Rajdhani' }}>
          {player.name}
        </div>
        <div style={{ fontSize: 11, color: '#4b5563' }}>
          {player.battingStyle} · {player.bowlingStyle} · Age {player.age}
        </div>
      </div>

      {/* Role badge */}
      <span style={{
        fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
        color, background: `${color}18`,
        border: `1px solid ${color}33`,
        padding: '2px 7px', borderRadius: 2,
      }}>
        {roleIcons[player.role]} {player.role.toUpperCase().slice(0, 3)}
      </span>

      {/* Toggle checkbox-like button */}
      <button
        onClick={onToggleA}
        style={{
          width: 26, height: 26, borderRadius: 6, border: 'none',
          background: isInA ? '#22c55e' : '#1f2937',
          color: isInA ? '#000' : '#4b5563',
          cursor: 'pointer', fontSize: 12, fontWeight: 700,
          transition: 'all 0.15s', flexShrink: 0,
          boxShadow: isInA ? '0 0 8px #22c55e55' : 'none',
        }}
        title="Toggle in team"
      >
        {isInA ? '✓' : '+'}
      </button>
    </div>
  );
}

/* ─── main component ─── */
export default function AddTeam() {
  const { players, teams, addTeam, updateTeam, setActivePage } = useApp();

  // Form state
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState('#22c55e');
  const [homeGround, setHomeGround] = useState('');
  const [founded, setFounded] = useState('');
  const [coach, setCoach] = useState('');
  const [city, setCity] = useState('');
  const [customColor, setCustomColor] = useState('#22c55e');

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [captain, setCaptain] = useState('');
  const [viceCaptain, setViceCaptain] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate short name from team name
  useEffect(() => {
    if (name && !shortName) {
      const words = name.trim().split(/\s+/);
      const auto = words.length >= 2
        ? words.map(w => w[0]).join('').toUpperCase().slice(0, 4)
        : name.slice(0, 4).toUpperCase();
      setShortName(auto);
    }
  }, [name]);

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    // Clear captain if removed
    if (captain === id) setCaptain('');
    if (viceCaptain === id) setViceCaptain('');
  };

  const filteredPlayers = players.filter(p => {
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id));
  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = selectedPlayers.filter(p => p.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Team name is required';
    if (!shortName.trim()) e.shortName = 'Short name is required';
    if (shortName.length > 4) e.shortName = 'Max 4 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const team: Team = {
      id: `t${Date.now()}`,
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      color,
      homeGround: homeGround.trim() || undefined,
      players: selectedPlayers,
      captain: captain || undefined,
      viceCaptain: viceCaptain || undefined,
    };
    addTeam(team);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setActivePage('teams');
    }, 1400);
  };

  const handleReset = () => {
    setName(''); setShortName(''); setColor('#22c55e');
    setHomeGround(''); setFounded(''); setCoach(''); setCity('');
    setSelectedPlayerIds([]); setCaptain(''); setViceCaptain('');
    setErrors({});
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 6, fontSize: 14,
  };
  const label = (txt: string) => (
    <label style={{
      display: 'block', marginBottom: 6,
      fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700,
      color: '#4b5563', letterSpacing: 1.5,
    }}>{txt}</label>
  );

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28,
      }}>
        <div>
          <button
            onClick={() => setActivePage('teams')}
            style={{
              background: 'none', border: 'none', color: '#4b5563',
              fontSize: 12, cursor: 'pointer', fontFamily: 'Orbitron',
              marginBottom: 6, padding: 0, display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ← BACK TO TEAMS
          </button>
          <h1 className="font-display" style={{ fontSize: 32, letterSpacing: 4, color: '#f9fafb', lineHeight: 1 }}>
            ADD TEAM
          </h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4 }}>
            Create a new cricket team and build your squad
          </div>
        </div>

        {/* Preview badge */}
        <div style={{
          background: `${color}18`,
          border: `2px solid ${color}44`,
          borderRadius: 10, padding: '12px 20px',
          textAlign: 'center', minWidth: 100,
          transition: 'all 0.3s',
          boxShadow: `0 0 20px ${color}22`,
        }}>
          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 3,
            color, lineHeight: 1,
          }}>
            {shortName || 'TAG'}
          </div>
          <div style={{ fontSize: 10, color: '#4b5563', marginTop: 2, fontFamily: 'Orbitron' }}>
            {selectedPlayerIds.length} PLAYERS
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Identity ── */}
      <Section title="TEAM IDENTITY" icon="🛡️" delay={60}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            {label('TEAM NAME *')}
            <input
              className="input-field"
              style={{ ...inputStyle, borderColor: errors.name ? '#ef4444' : undefined }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mumbai Strikers XI"
            />
            {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
          </div>

          <div>
            {label('SHORT NAME * (max 4)')}
            <input
              className="input-field"
              style={{ ...inputStyle, fontFamily: 'Orbitron', fontWeight: 700, borderColor: errors.shortName ? '#ef4444' : undefined }}
              value={shortName}
              onChange={e => setShortName(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="MSX"
              maxLength={4}
            />
            {errors.shortName && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.shortName}</div>}
          </div>

          <div>
            {label('HOME CITY')}
            <input
              className="input-field"
              style={inputStyle}
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Mumbai"
            />
          </div>

          <div>
            {label('HOME GROUND')}
            <input
              className="input-field"
              style={inputStyle}
              value={homeGround}
              onChange={e => setHomeGround(e.target.value)}
              placeholder="Wankhede Stadium"
            />
          </div>

          <div>
            {label('HEAD COACH')}
            <input
              className="input-field"
              style={inputStyle}
              value={coach}
              onChange={e => setCoach(e.target.value)}
              placeholder="Coach name"
            />
          </div>

          <div>
            {label('FOUNDED YEAR')}
            <input
              className="input-field"
              style={inputStyle}
              type="number"
              value={founded}
              onChange={e => setFounded(e.target.value)}
              placeholder="2020"
              min={1800} max={2030}
            />
          </div>
        </div>
      </Section>

      {/* ── SECTION 2: Colors ── */}
      <Section title="TEAM COLOR" icon="🎨" delay={120}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {PRESET_COLORS.map(c => (
            <ColorSwatch key={c} color={c} selected={color === c} onClick={() => { setColor(c); setCustomColor(c); }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
          <span style={{ fontSize: 10, color: '#374151', fontFamily: 'Orbitron' }}>OR CUSTOM</span>
          <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="color"
              value={customColor}
              onChange={e => { setCustomColor(e.target.value); setColor(e.target.value); }}
              style={{
                width: 44, height: 44, padding: 3,
                background: '#0d1117', border: '1px solid #1f2937',
                borderRadius: 8, cursor: 'pointer',
              }}
            />
          </div>
          <div style={{
            flex: 1, height: 44, borderRadius: 8,
            background: `linear-gradient(135deg, ${color}33, ${color}11)`,
            border: `1px solid ${color}44`,
            display: 'flex', alignItems: 'center', paddingLeft: 14,
            transition: 'all 0.3s',
          }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color }}>{color.toUpperCase()}</span>
          </div>
          {/* Preview shirt */}
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: `0 0 16px ${color}55`,
            transition: 'all 0.3s',
          }}>
            👕
          </div>
        </div>
      </Section>

      {/* ── SECTION 3: Squad builder ── */}
      <Section title="SQUAD BUILDER" icon="👥" delay={180}>
        {/* Squad composition bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron' }}>
              SQUAD: {selectedPlayerIds.length} SELECTED
            </span>
            <span style={{ fontSize: 11, color: selectedPlayerIds.length >= 11 ? '#22c55e' : '#4b5563', fontFamily: 'Orbitron' }}>
              {selectedPlayerIds.length >= 11 ? '✓ FULL XI' : `NEED ${11 - selectedPlayerIds.length} MORE`}
            </span>
          </div>

          {/* Role breakdown pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {ROLES.map(r => (
              <div key={r} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20,
                background: `${roleColors[r]}15`,
                border: `1px solid ${roleColors[r]}33`,
              }}>
                <span style={{ fontSize: 11 }}>{roleIcons[r]}</span>
                <span style={{ fontSize: 11, fontFamily: 'Orbitron', fontWeight: 700, color: roleColors[r] }}>
                  {roleCounts[r]}
                </span>
                <span style={{ fontSize: 10, color: '#4b5563' }}>{r.slice(0, 4)}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.min(100, (selectedPlayerIds.length / 11) * 100)}%`,
              background: selectedPlayerIds.length >= 11
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : 'linear-gradient(90deg, #3b82f6, #22c55e)',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 8px #22c55e55',
            }} />
          </div>
        </div>

        {/* Search & filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            className="input-field"
            style={{ padding: '8px 12px', borderRadius: 6, fontSize: 13, flex: 1, minWidth: 160 }}
            placeholder="🔍 Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', ...ROLES].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '6px 10px', borderRadius: 4, border: 'none',
                background: roleFilter === r
                  ? `${roleColors[r] || color}22`
                  : '#0d1117',
                color: roleFilter === r ? (roleColors[r] || color) : '#4b5563',
                cursor: 'pointer', fontSize: 10,
                fontFamily: 'Orbitron', fontWeight: 700,
                transition: 'all 0.15s',
                outline: `1px solid ${roleFilter === r ? (roleColors[r] || color) + '55' : '#1f2937'}`,
              }}>
                {r === 'all' ? 'ALL' : roleIcons[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Player list */}
        <div style={{
          maxHeight: 320, overflowY: 'auto',
          background: '#0d1117', border: '1px solid #1f2937',
          borderRadius: 8,
        }}>
          {filteredPlayers.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#374151', fontSize: 13 }}>
              No players found
            </div>
          ) : filteredPlayers.map(p => (
            <PlayerRow
              key={p.id}
              player={p}
              selectedSide="A"
              isInA={selectedPlayerIds.includes(p.id)}
              isInB={false}
              onToggleA={() => togglePlayer(p.id)}
              onToggleB={() => {}}
            />
          ))}
        </div>
      </Section>

      {/* ── SECTION 4: Leadership ── */}
      {selectedPlayerIds.length > 0 && (
        <Section title="LEADERSHIP" icon="👑" delay={240}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              {label('CAPTAIN')}
              <select
                className="select-field"
                style={{ ...inputStyle, borderColor: captain ? '#22c55e44' : undefined }}
                value={captain}
                onChange={e => setCaptain(e.target.value)}
              >
                <option value="">-- Select Captain --</option>
                {selectedPlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
              {captain && (
                <div style={{
                  marginTop: 6, padding: '6px 10px',
                  background: '#22c55e11', border: '1px solid #22c55e22',
                  borderRadius: 4, fontSize: 12, color: '#22c55e',
                }}>
                  👑 {selectedPlayers.find(p => p.id === captain)?.name}
                </div>
              )}
            </div>

            <div>
              {label('VICE-CAPTAIN')}
              <select
                className="select-field"
                style={{ ...inputStyle, borderColor: viceCaptain ? '#3b82f644' : undefined }}
                value={viceCaptain}
                onChange={e => setViceCaptain(e.target.value)}
              >
                <option value="">-- Select Vice-Captain --</option>
                {selectedPlayers.filter(p => p.id !== captain).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
              {viceCaptain && (
                <div style={{
                  marginTop: 6, padding: '6px 10px',
                  background: '#3b82f611', border: '1px solid #3b82f622',
                  borderRadius: 4, fontSize: 12, color: '#3b82f6',
                }}>
                  🎖️ {selectedPlayers.find(p => p.id === viceCaptain)?.name}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ── Action bar ── */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'flex-end',
        paddingTop: 8,
      }}>
        <button onClick={handleReset} className="btn-secondary" style={{
          padding: '11px 24px', borderRadius: 8, fontSize: 14,
        }}>
          RESET
        </button>
        <button
          onClick={() => setActivePage('teams')}
          className="btn-secondary"
          style={{ padding: '11px 24px', borderRadius: 8, fontSize: 14 }}
        >
          CANCEL
        </button>
        <button
          onClick={handleSave}
          className="btn-primary"
          style={{
            padding: '11px 32px', borderRadius: 8, fontSize: 16,
            background: saved ? '#22c55e' : undefined,
            minWidth: 160, position: 'relative', overflow: 'hidden',
          }}
        >
          {saved ? '✓ TEAM CREATED!' : '🛡️ CREATE TEAM'}
        </button>
      </div>

      {/* ── Live preview strip ── */}
      <div style={{
        marginTop: 20,
        background: '#0d1117',
        border: `1px solid ${color}22`,
        borderRadius: 8, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'border-color 0.3s',
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 8,
          background: `${color}22`, border: `2px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Bebas Neue', fontSize: 16, color,
          flexShrink: 0, transition: 'all 0.3s',
        }}>
          {shortName.slice(0, 2) || '??'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2,
            color: '#f9fafb', lineHeight: 1,
          }}>
            {name || 'Team Name'}
          </div>
          <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
            {homeGround ? `📍 ${homeGround}` : 'No ground set'} · {selectedPlayerIds.length} players
          </div>
        </div>
        <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, color, opacity: 0.3 }}>
          {shortName || 'TAG'}
        </div>
      </div>
    </div>
  );
}
