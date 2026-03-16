'use client';
import React, { useState, useEffect } from 'react';
import { useApp, Team, TeamCategory, Player } from './AppContext';

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f97316',
  '#8b5cf6', '#eab308', '#06b6d4', '#ec4899',
  '#14b8a6', '#a855f7', '#f43f5e', '#84cc16',
];

const CATEGORIES: { value: TeamCategory; label: string; icon: string; color: string }[] = [
  { value: 'international', label: 'International', icon: '🌍', color: '#f97316' },
  { value: 'national',      label: 'National',      icon: '🏴', color: '#8b5cf6' },
  { value: 'state',         label: 'State',         icon: '🗺️', color: '#06b6d4' },
  { value: 'city',          label: 'City',          icon: '🏙️', color: '#eab308' },
];

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'] as const;
const roleColors: Record<string, string> = {
  Batsman: '#3b82f6', Bowler: '#ef4444', 'All-rounder': '#22c55e', 'Wicket-keeper': '#eab308',
};
const roleIcons: Record<string, string> = {
  Batsman: '🏏', Bowler: '⚾', 'All-rounder': '⚡', 'Wicket-keeper': '🧤',
};

interface EditTeamModalProps {
  team: Team;
  onClose: () => void;
}

export default function EditTeamModal({ team, onClose }: EditTeamModalProps) {
  const { players, updateTeam } = useApp();

  const [name, setName] = useState(team.name);
  const [shortName, setShortName] = useState(team.shortName);
  const [color, setColor] = useState(team.color);
  const [category, setCategory] = useState<TeamCategory>(team.category);
  const [homeGround, setHomeGround] = useState(team.homeGround || '');
  const [coach, setCoach] = useState(team.coach || '');
  const [country, setCountry] = useState(team.country || '');
  const [state, setState] = useState(team.state || '');
  const [city, setCity] = useState(team.city || '');
  const [founded, setFounded] = useState(team.founded || '');

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(team.players.map(p => p.id));
  const [captain, setCaptain] = useState(team.captain || '');
  const [viceCaptain, setViceCaptain] = useState(team.viceCaptain || '');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'squad' | 'leadership'>('details');

  const selectedPlayers = players.filter(p => selectedPlayerIds.includes(p.id));

  const filteredPlayers = players.filter(p => {
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = selectedPlayers.filter(p => p.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    if (captain === id) setCaptain('');
    if (viceCaptain === id) setViceCaptain('');
  };

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
    const updatedTeam: Team = {
      ...team,
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      color,
      category,
      homeGround: homeGround.trim() || undefined,
      coach: coach.trim() || undefined,
      country: country || undefined,
      state: state || undefined,
      city: city || undefined,
      founded: founded || undefined,
      players: selectedPlayers,
      captain: captain || undefined,
      viceCaptain: viceCaptain || undefined,
    };
    updateTeam(updatedTeam);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const inputSt: React.CSSProperties = {
    padding: '9px 12px', borderRadius: 6, fontSize: 13,
    background: '#0d1117', border: '1px solid #374151', color: '#f9fafb',
    width: '100%', outline: 'none', fontFamily: 'Rajdhani', boxSizing: 'border-box',
  };
  const lbl = (txt: string) => (
    <label style={{ display: 'block', marginBottom: 5, fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, color: '#4b5563', letterSpacing: 1.5 }}>{txt}</label>
  );

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, background: '#000000cc',
        backdropFilter: 'blur(6px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        background: '#0d1117', border: `1px solid ${color}44`,
        borderRadius: 14, width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto', position: 'relative',
        boxShadow: `0 0 60px ${color}22`,
        animation: 'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Top color bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: '14px 14px 0 0' }} />

        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}22`, border: `2px solid ${color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 18, color, flexShrink: 0 }}>
            {shortName.slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 3, color: '#f9fafb', lineHeight: 1 }}>EDIT TEAM</div>
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2, fontFamily: 'Rajdhani' }}>{team.name}</div>
          </div>
          <button onClick={onClose} style={{ background: '#1f2937', border: 'none', color: '#9ca3af', fontSize: 16, cursor: 'pointer', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1f2937', padding: '0 22px' }}>
          {([['details', '🛡️', 'Details'], ['squad', '👥', 'Squad'], ['leadership', '👑', 'Leadership']] as const).map(([tab, icon, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, letterSpacing: 1,
                color: activeTab === tab ? color : '#4b5563',
                borderBottom: `2px solid ${activeTab === tab ? color : 'transparent'}`,
                marginBottom: -1, transition: 'all 0.15s',
              }}
            >{icon} {label}</button>
          ))}
        </div>

        <div style={{ padding: '18px 22px' }}>

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <div>
              {/* Category */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 10 }}>CATEGORY</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <div key={c.value} onClick={() => setCategory(c.value)} style={{
                      border: `2px solid ${category === c.value ? c.color : '#1f2937'}`,
                      background: category === c.value ? `${c.color}0d` : '#111827',
                      borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 20 }}>{c.icon}</span>
                      <span style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, color: category === c.value ? c.color : '#9ca3af' }}>{c.label}</span>
                      {category === c.value && <span style={{ marginLeft: 'auto', color: c.color, fontSize: 14 }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Name + Short */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                <div>
                  {lbl('TEAM NAME')}
                  <input style={{ ...inputSt, borderColor: errors.name ? '#ef4444' : undefined }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mumbai Strikers" />
                  {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.name}</div>}
                </div>
                <div style={{ width: 90 }}>
                  {lbl('SHORT (4)')}
                  <input style={{ ...inputSt, fontFamily: 'Orbitron', fontWeight: 700, textAlign: 'center', borderColor: errors.shortName ? '#ef4444' : undefined }}
                    value={shortName} onChange={e => setShortName(e.target.value.toUpperCase().slice(0, 4))} placeholder="MSX" maxLength={4} />
                  {errors.shortName && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>{errors.shortName}</div>}
                </div>
              </div>

              {/* Location fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {(category === 'international') && (
                  <div>
                    {lbl('COUNTRY')}
                    <input style={inputSt} value={country} onChange={e => setCountry(e.target.value)} placeholder="India, Australia..." />
                  </div>
                )}
                {(category === 'national' || category === 'state') && (
                  <div>
                    {lbl('STATE')}
                    <input style={inputSt} value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra..." />
                  </div>
                )}
                {(category === 'state' || category === 'city') && (
                  <div>
                    {lbl('CITY')}
                    <input style={inputSt} value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai, Pune..." />
                  </div>
                )}
                <div>
                  {lbl('HOME GROUND')}
                  <input style={inputSt} value={homeGround} onChange={e => setHomeGround(e.target.value)} placeholder="Wankhede Stadium" />
                </div>
                <div>
                  {lbl('COACH')}
                  <input style={inputSt} value={coach} onChange={e => setCoach(e.target.value)} placeholder="Coach name" />
                </div>
                <div>
                  {lbl('FOUNDED')}
                  <input style={inputSt} value={founded} onChange={e => setFounded(e.target.value)} placeholder="2018" />
                </div>
              </div>

              {/* Color */}
              <div style={{ marginBottom: 14 }}>
                {lbl('TEAM COLOR')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} style={{
                      width: 28, height: 28, borderRadius: 5, background: c, border: 'none', cursor: 'pointer',
                      outline: color === c ? `3px solid #fff` : '3px solid transparent',
                      outlineOffset: 2, boxShadow: color === c ? `0 0 10px ${c}99` : 'none',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    style={{ width: 40, height: 40, padding: 3, background: '#0d1117', border: '1px solid #1f2937', borderRadius: 6, cursor: 'pointer' }} />
                  <div style={{ flex: 1, height: 40, borderRadius: 6, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', paddingLeft: 12, transition: 'all 0.3s' }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700, color }}>{color.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SQUAD TAB ── */}
          {activeTab === 'squad' && (
            <div>
              {/* Counts */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron' }}>SQUAD: {selectedPlayerIds.length} SELECTED</span>
                  <span style={{ fontSize: 10, color: selectedPlayerIds.length >= 11 ? '#22c55e' : '#4b5563', fontFamily: 'Orbitron' }}>
                    {selectedPlayerIds.length >= 11 ? `✓ XI COMPLETE` : `NEED ${11 - selectedPlayerIds.length} MORE`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {ROLES.map(r => (
                    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: `${roleColors[r]}15`, border: `1px solid ${roleColors[r]}33` }}>
                      <span style={{ fontSize: 10 }}>{roleIcons[r]}</span>
                      <span style={{ fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, color: roleColors[r] }}>{roleCounts[r]}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 3, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${Math.min(100, (selectedPlayerIds.length / 11) * 100)}%`,
                    background: selectedPlayerIds.length >= 11 ? '#22c55e' : `linear-gradient(90deg, #3b82f6, #22c55e)`,
                    transition: 'width 0.4s',
                  }} />
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  style={{ padding: '7px 10px', borderRadius: 5, fontSize: 12, flex: 1, background: '#111827', border: '1px solid #1f2937', color: '#f9fafb', outline: 'none', fontFamily: 'Rajdhani' }}
                  placeholder="🔍 Search players..." value={search} onChange={e => setSearch(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 4 }}>
                  {['all', ...ROLES].map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)} style={{
                      padding: '5px 8px', borderRadius: 4, border: 'none',
                      background: roleFilter === r ? `${roleColors[r] || color}22` : '#111827',
                      color: roleFilter === r ? (roleColors[r] || color) : '#4b5563',
                      cursor: 'pointer', fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
                      outline: `1px solid ${roleFilter === r ? (roleColors[r] || color) + '55' : '#1f2937'}`,
                    }}>
                      {r === 'all' ? 'ALL' : roleIcons[r]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player list */}
              <div style={{ maxHeight: 260, overflowY: 'auto', background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}>
                {filteredPlayers.map(p => {
                  const isIn = selectedPlayerIds.includes(p.id);
                  const rc = roleColors[p.role];
                  return (
                    <div key={p.id} onClick={() => togglePlayer(p.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      borderBottom: '1px solid #1f2937', cursor: 'pointer',
                      background: isIn ? '#22c55e05' : 'transparent', transition: 'background 0.15s',
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: isIn ? '#22c55e' : '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: isIn ? '#000' : '#4b5563', fontWeight: 700, flexShrink: 0 }}>
                        {isIn ? '✓' : ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: isIn ? '#22c55e' : '#f9fafb', fontFamily: 'Rajdhani' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#4b5563' }}>{p.nationality} · {p.battingStyle}</div>
                      </div>
                      <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, color: rc, background: `${rc}18`, border: `1px solid ${rc}33`, padding: '2px 6px', borderRadius: 2 }}>
                        {roleIcons[p.role]} {p.role.slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── LEADERSHIP TAB ── */}
          {activeTab === 'leadership' && (
            <div>
              {selectedPlayerIds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                  <div style={{ fontFamily: 'Rajdhani', fontSize: 14 }}>Add squad members first</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
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
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '14px 22px 18px', borderTop: '1px solid #1f2937', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 7, fontSize: 12, background: 'transparent', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer', fontFamily: 'Orbitron', letterSpacing: 1 }}>CANCEL</button>
          <button onClick={handleSave} disabled={saved} style={{
            padding: '10px 28px', borderRadius: 7, fontSize: 14, cursor: 'pointer',
            background: saved ? '#22c55e' : `linear-gradient(135deg, ${color}cc, ${color})`,
            border: 'none', color: '#000',
            fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1, minWidth: 140,
            boxShadow: `0 0 16px ${color}33`, transition: 'all 0.3s',
          }}>
            {saved ? '✓ SAVED!' : '💾 SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
}