'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useApp, Team, Player, TeamCategory } from './AppContext';

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f97316',
  '#8b5cf6', '#eab308', '#06b6d4', '#ec4899',
  '#14b8a6', '#a855f7', '#f43f5e', '#84cc16',
];

const CATEGORIES: { value: TeamCategory; label: string; icon: string; color: string; desc: string; fields: string[] }[] = [
  { value: 'international', label: 'International', icon: '🌍', color: '#f97316', desc: 'National teams representing countries', fields: ['country'] },
  { value: 'national',      label: 'National',      icon: '🏴', color: '#8b5cf6', desc: 'League teams in national competitions', fields: ['state'] },
  { value: 'state',         label: 'State',         icon: '🗺️', color: '#06b6d4', desc: 'District and state-level clubs', fields: ['state', 'city'] },
  { value: 'city',          label: 'City',          icon: '🏙️', color: '#eab308', desc: 'Local city and club teams', fields: ['city'] },
];

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'] as const;
const roleColors: Record<string, string> = {
  Batsman: '#3b82f6', Bowler: '#ef4444', 'All-rounder': '#22c55e', 'Wicket-keeper': '#eab308',
};
const roleIcons: Record<string, string> = {
  Batsman: '🏏', Bowler: '⚾', 'All-rounder': '⚡', 'Wicket-keeper': '🧤',
};

function Section({ title, icon, children, delay = 0 }: {
  title: string; icon: string; children: React.ReactNode; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(.4,0,.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
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

export default function AddTeam() {
  const { players, teams, addTeam, updateTeam, setActivePage } = useApp();

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState('#22c55e');
  const [category, setCategory] = useState<TeamCategory | ''>('');
  const [homeGround, setHomeGround] = useState('');
  const [coach, setCoach] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [customColor, setCustomColor] = useState('#22c55e');

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [captain, setCaptain] = useState('');
  const [viceCaptain, setViceCaptain] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto short name
  useEffect(() => {
    if (name && !shortName) {
      const words = name.trim().split(/\s+/);
      const auto = words.length >= 2
        ? words.map(w => w[0]).join('').toUpperCase().slice(0, 4)
        : name.slice(0, 4).toUpperCase();
      setShortName(auto);
    }
  }, [name]);

  const selectedCategory = CATEGORIES.find(c => c.value === category);

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
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
    if (!category) e.category = 'Select a category';
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
      category: category as TeamCategory,
      homeGround: homeGround.trim() || undefined,
      players: selectedPlayers,
      captain: captain || undefined,
      viceCaptain: viceCaptain || undefined,
      country: country || undefined,
      state: state || undefined,
      city: city || undefined,
    };
    addTeam(team);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setActivePage('teams');
    }, 1400);
  };

  const handleReset = () => {
    setName(''); setShortName(''); setColor('#22c55e'); setCategory('');
    setHomeGround(''); setCoach(''); setCountry(''); setState(''); setCity('');
    setSelectedPlayerIds([]); setCaptain(''); setViceCaptain('');
    setErrors({});
  };

  const inputSt: React.CSSProperties = { padding: '10px 14px', borderRadius: 6, fontSize: 14, background: '#0d1117', border: '1px solid #374151', color: '#f9fafb', width: '100%', outline: 'none', fontFamily: 'Rajdhani', boxSizing: 'border-box' };
  const lbl = (txt: string) => (
    <label style={{ display: 'block', marginBottom: 6, fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, color: '#4b5563', letterSpacing: 1.5 }}>{txt}</label>
  );

  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <button onClick={() => setActivePage('teams')} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: 11, cursor: 'pointer', fontFamily: 'Orbitron', marginBottom: 6, padding: 0 }}>
            ← BACK TO TEAMS
          </button>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: 4, color: '#f9fafb', lineHeight: 1, margin: 0 }}>ADD TEAM</h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4, fontFamily: 'Rajdhani' }}>Create and categorize your cricket team</div>
        </div>

        {/* Preview badge */}
        <div style={{
          background: `${color}18`, border: `2px solid ${color}44`, borderRadius: 10,
          padding: '12px 20px', textAlign: 'center', minWidth: 100, transition: 'all 0.3s',
          boxShadow: `0 0 20px ${color}22`,
        }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 3, color, lineHeight: 1 }}>
            {shortName || 'TAG'}
          </div>
          <div style={{ fontSize: 9, color: '#4b5563', marginTop: 2, fontFamily: 'Orbitron' }}>
            {selectedPlayerIds.length} PLAYERS
          </div>
          {selectedCategory && (
            <div style={{ fontSize: 9, color: selectedCategory.color, fontFamily: 'Orbitron', letterSpacing: 1, marginTop: 3 }}>
              {selectedCategory.icon} {selectedCategory.label.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY SELECTOR — always first and prominent */}
      <Section title="TEAM CATEGORY" icon="🏷️" delay={40}>
        {errors.category && <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 10 }}>{errors.category}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {CATEGORIES.map(c => (
            <div
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                border: `2px solid ${category === c.value ? c.color : '#1f2937'}`,
                background: category === c.value ? `${c.color}0d` : '#0d1117',
                borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: category === c.value ? `0 0 20px ${c.color}22` : 'none',
                transform: category === c.value ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 26 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1, color: category === c.value ? c.color : '#f9fafb' }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563' }}>{c.desc}</div>
                </div>
                {category === c.value && <span style={{ color: c.color, fontSize: 18 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* IDENTITY */}
      <Section title="TEAM IDENTITY" icon="🛡️" delay={80}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            {lbl('TEAM NAME *')}
            <input style={{ ...inputSt, borderColor: errors.name ? '#ef4444' : undefined }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mumbai Strikers XI" />
            {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.name}</div>}
          </div>
          <div>
            {lbl('SHORT NAME * (max 4)')}
            <input style={{ ...inputSt, fontFamily: 'Orbitron', fontWeight: 700, borderColor: errors.shortName ? '#ef4444' : undefined }}
              value={shortName} onChange={e => setShortName(e.target.value.toUpperCase().slice(0, 4))} placeholder="MSX" maxLength={4} />
            {errors.shortName && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.shortName}</div>}
          </div>
          <div>
            {lbl('HOME GROUND')}
            <input style={inputSt} value={homeGround} onChange={e => setHomeGround(e.target.value)} placeholder="Wankhede Stadium" />
          </div>

          {/* Category-specific location fields */}
          {(category === 'international') && (
            <div style={{ gridColumn: '1/-1' }}>
              {lbl('COUNTRY')}
              <input style={inputSt} value={country} onChange={e => setCountry(e.target.value)} placeholder="India, Australia, etc." />
            </div>
          )}
          {(category === 'national' || category === 'state') && (
            <div>
              {lbl('STATE / PROVINCE')}
              <input style={inputSt} value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra, Gujarat..." />
            </div>
          )}
          {(category === 'state' || category === 'city') && (
            <div>
              {lbl('CITY')}
              <input style={inputSt} value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai, Pune..." />
            </div>
          )}

          <div>
            {lbl('HEAD COACH')}
            <input style={inputSt} value={coach} onChange={e => setCoach(e.target.value)} placeholder="Coach name" />
          </div>
        </div>
      </Section>

      {/* COLOR */}
      <Section title="TEAM COLOR" icon="🎨" delay={120}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setCustomColor(c); }}
              style={{
                width: 32, height: 32, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                outline: color === c ? `3px solid #fff` : '3px solid transparent',
                outlineOffset: 2,
                boxShadow: color === c ? `0 0 12px ${c}99` : 'none',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <input
            type="color" value={customColor}
            onChange={e => { setCustomColor(e.target.value); setColor(e.target.value); }}
            style={{ width: 44, height: 44, padding: 3, background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8, cursor: 'pointer' }}
          />
          <div style={{
            flex: 1, height: 44, borderRadius: 8,
            background: `linear-gradient(135deg, ${color}33, ${color}11)`,
            border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', paddingLeft: 14,
            transition: 'all 0.3s',
          }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color }}>{color.toUpperCase()}</span>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 0 16px ${color}55`, transition: 'all 0.3s' }}>
            👕
          </div>
        </div>
      </Section>

      {/* SQUAD BUILDER */}
      <Section title="SQUAD BUILDER" icon="👥" delay={160}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron' }}>SQUAD: {selectedPlayerIds.length} SELECTED</span>
            <span style={{ fontSize: 11, color: selectedPlayerIds.length >= 11 ? '#22c55e' : '#4b5563', fontFamily: 'Orbitron' }}>
              {selectedPlayerIds.length >= 11 ? `✓ XI COMPLETE (${selectedPlayerIds.length})` : `NEED ${11 - selectedPlayerIds.length} MORE FOR XI`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {ROLES.map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: `${roleColors[r]}15`, border: `1px solid ${roleColors[r]}33` }}>
                <span style={{ fontSize: 11 }}>{roleIcons[r]}</span>
                <span style={{ fontSize: 11, fontFamily: 'Orbitron', fontWeight: 700, color: roleColors[r] }}>{roleCounts[r]}</span>
                <span style={{ fontSize: 10, color: '#4b5563' }}>{r.slice(0, 4)}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.min(100, (selectedPlayerIds.length / 11) * 100)}%`,
              background: selectedPlayerIds.length >= 11 ? 'linear-gradient(90deg, #22c55e, #4ade80)' : 'linear-gradient(90deg, #3b82f6, #22c55e)',
              transition: 'width 0.4s cubic-bezier(.4,0,.2,1)', boxShadow: '0 0 8px #22c55e55',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <input
            style={{ padding: '8px 12px', borderRadius: 6, fontSize: 13, flex: 1, minWidth: 160, background: '#0d1117', border: '1px solid #374151', color: '#f9fafb', outline: 'none', fontFamily: 'Rajdhani' }}
            placeholder="🔍 Search players..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', ...ROLES].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '6px 10px', borderRadius: 4, border: 'none',
                background: roleFilter === r ? `${roleColors[r] || color}22` : '#0d1117',
                color: roleFilter === r ? (roleColors[r] || color) : '#4b5563',
                cursor: 'pointer', fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700,
                transition: 'all 0.15s',
                outline: `1px solid ${roleFilter === r ? (roleColors[r] || color) + '55' : '#1f2937'}`,
              }}>
                {r === 'all' ? 'ALL' : roleIcons[r]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxHeight: 300, overflowY: 'auto', background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8 }}>
          {filteredPlayers.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#374151', fontSize: 13, fontFamily: 'Rajdhani' }}>No players found</div>
          ) : filteredPlayers.map(p => {
            const isIn = selectedPlayerIds.includes(p.id);
            const rc = roleColors[p.role];
            return (
              <div key={p.id} onClick={() => togglePlayer(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderBottom: '1px solid #1f2937', cursor: 'pointer',
                background: isIn ? '#22c55e05' : 'transparent', transition: 'background 0.15s',
              }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: isIn ? '#22c55e' : '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: isIn ? '#000' : '#4b5563', fontWeight: 700, transition: 'all 0.15s', flexShrink: 0 }}>
                  {isIn ? '✓' : ''}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isIn ? '#22c55e' : '#f9fafb', fontFamily: 'Rajdhani' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#4b5563' }}>{p.battingStyle} · {p.bowlingStyle}</div>
                </div>
                <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '2px 7px', borderRadius: 2 }}>
                  {roleIcons[p.role]} {p.role.toUpperCase().slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* LEADERSHIP */}
      {selectedPlayerIds.length > 0 && (
        <Section title="LEADERSHIP" icon="👑" delay={200}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              {lbl('CAPTAIN')}
              <select style={{ ...inputSt, cursor: 'pointer' }} value={captain} onChange={e => setCaptain(e.target.value)}>
                <option value="">— Select Captain —</option>
                {selectedPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
              </select>
              {captain && (
                <div style={{ marginTop: 6, padding: '6px 10px', background: '#22c55e11', border: '1px solid #22c55e22', borderRadius: 4, fontSize: 12, color: '#22c55e' }}>
                  👑 {selectedPlayers.find(p => p.id === captain)?.name}
                </div>
              )}
            </div>
            <div>
              {lbl('VICE-CAPTAIN')}
              <select style={{ ...inputSt, cursor: 'pointer' }} value={viceCaptain} onChange={e => setViceCaptain(e.target.value)}>
                <option value="">— Select Vice-Captain —</option>
                {selectedPlayers.filter(p => p.id !== captain).map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
              </select>
              {viceCaptain && (
                <div style={{ marginTop: 6, padding: '6px 10px', background: '#3b82f611', border: '1px solid #3b82f622', borderRadius: 4, fontSize: 12, color: '#3b82f6' }}>
                  🎖️ {selectedPlayers.find(p => p.id === viceCaptain)?.name}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
        <button onClick={handleReset} style={{ padding: '11px 24px', borderRadius: 8, fontSize: 13, background: 'transparent', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer', fontFamily: 'Orbitron', letterSpacing: 1 }}>RESET</button>
        <button onClick={() => setActivePage('teams')} style={{ padding: '11px 24px', borderRadius: 8, fontSize: 13, background: 'transparent', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer', fontFamily: 'Orbitron', letterSpacing: 1 }}>CANCEL</button>
        <button onClick={handleSave} style={{
          padding: '11px 32px', borderRadius: 8, fontSize: 15, cursor: 'pointer',
          background: saved ? '#22c55e' : 'linear-gradient(135deg, #16a34a, #22c55e)',
          border: 'none', color: '#000',
          fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1, minWidth: 160,
          boxShadow: '0 0 20px #22c55e33',
        }}>
          {saved ? '✓ TEAM CREATED!' : '🛡️ CREATE TEAM'}
        </button>
      </div>

      {/* Live preview strip */}
      <div style={{ marginTop: 20, background: '#0d1117', border: `1px solid ${color}22`, borderRadius: 8, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.3s' }}>
        <div style={{ width: 42, height: 42, borderRadius: 8, background: `${color}22`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 16, color, flexShrink: 0, transition: 'all 0.3s' }}>
          {shortName.slice(0, 2) || '??'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{name || 'Team Name'}</div>
          <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
            {selectedCategory && <span style={{ color: selectedCategory.color, marginRight: 8 }}>{selectedCategory.icon} {selectedCategory.label}</span>}
            {homeGround ? `📍 ${homeGround}` : 'No ground set'} · {selectedPlayerIds.length} players
          </div>
        </div>
        <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, color, opacity: 0.3 }}>{shortName || 'TAG'}</div>
      </div>
    </div>
  );
}