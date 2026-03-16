'use client';
import React, { useState } from 'react';
import { useApp, Team, Player, TeamCategory } from './AppContext';

const CATEGORIES: { value: TeamCategory; label: string; icon: string; color: string; glow: string }[] = [
  { value: 'international', label: 'International', icon: '🌍', color: '#f97316', glow: '#f9731633' },
  { value: 'national',      label: 'National',      icon: '🏴', color: '#8b5cf6', glow: '#8b5cf633' },
  { value: 'state',         label: 'State',         icon: '🗺️', color: '#06b6d4', glow: '#06b6d433' },
  { value: 'city',          label: 'City',          icon: '🏙️', color: '#eab308', glow: '#eab30833' },
];

function TeamCard({ team, onEdit, onDelete }: { team: Team; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  const teamPlayers = team.players;
  const captain = teamPlayers.find(p => p.id === team.captain);
  const catMeta = CATEGORIES.find(c => c.value === team.category)!;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111827',
        border: `1px solid ${hovered ? team.color + '55' : '#1f2937'}`,
        borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s',
        boxShadow: hovered ? `0 8px 30px ${team.color}18` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${team.color}, ${team.color}44, transparent)` }} />
      <div style={{ background: `linear-gradient(135deg, ${team.color}22, transparent)`, borderBottom: `1px solid ${team.color}22`, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -6, top: -6, fontFamily: 'Bebas Neue', fontSize: 70, color: team.color, opacity: 0.06, lineHeight: 1, pointerEvents: 'none' }}>
          {team.shortName}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
              <span style={{ fontSize: 8, fontFamily: 'Orbitron', fontWeight: 700, background: `${catMeta.color}18`, color: catMeta.color, border: `1px solid ${catMeta.color}33`, padding: '1px 6px', borderRadius: 2, letterSpacing: 1 }}>
                {catMeta.icon} {catMeta.label.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, background: `${team.color}22`, border: `2px solid ${team.color}44`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 14, color: team.color }}>
                {team.shortName.slice(0, 2)}
              </div>
              <div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>{team.name}</div>
                {team.homeGround && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>📍 {team.homeGround}</div>}
                {(team.country || team.state || team.city) && (
                  <div style={{ fontSize: 11, color: '#374151' }}>
                    {team.country || team.state || team.city}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: team.color, opacity: 0.4 }}>
            {team.shortName}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#0d1117', borderRadius: 6, padding: '7px 10px' }}>
            <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>PLAYERS</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: '#f9fafb' }}>{teamPlayers.length}</div>
          </div>
          <div style={{ background: '#0d1117', borderRadius: 6, padding: '7px 10px' }}>
            <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>COLOR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <div style={{ width: 14, height: 14, background: team.color, borderRadius: 3 }} />
              <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'Orbitron' }}>{team.color}</span>
            </div>
          </div>
        </div>

        {captain && (
          <div style={{ marginBottom: 10, fontSize: 12, fontFamily: 'Rajdhani' }}>
            <span style={{ color: '#4b5563' }}>Captain: </span>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>👑 {captain.name}</span>
          </div>
        )}

        {teamPlayers.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron', marginBottom: 5, letterSpacing: 1 }}>SQUAD</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {teamPlayers.slice(0, 7).map(p => (
                <span key={p.id} style={{ fontSize: 10, padding: '2px 7px', background: '#1f2937', borderRadius: 3, color: '#9ca3af' }}>
                  {p.name.split(' ').slice(-1)[0]}
                </span>
              ))}
              {teamPlayers.length > 7 && (
                <span style={{ fontSize: 10, padding: '2px 7px', background: '#1f2937', borderRadius: 3, color: '#4b5563' }}>
                  +{teamPlayers.length - 7}
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 7 }}>
          <button onClick={onEdit} style={{ flex: 1, padding: '8px', background: `${team.color}15`, border: `1px solid ${team.color}33`, color: team.color, borderRadius: 6, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12, transition: 'all 0.15s' }}>
            EDIT TEAM
          </button>
          <button onClick={onDelete} style={{ padding: '8px 12px', background: '#ef444415', border: '1px solid #ef444433', color: '#ef4444', borderRadius: 6, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12, transition: 'all 0.15s' }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Teams() {
  const { teams, players, deleteTeam, updateTeam, setActivePage } = useApp();
  const [activeCategory, setActiveCategory] = useState<TeamCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = teams.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.value] = teams.filter(t => t.category === c.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 36, letterSpacing: 4, color: '#f9fafb', margin: 0 }}>TEAMS</h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2, fontFamily: 'Rajdhani' }}>
            {filtered.length} of {teams.length} teams registered
          </div>
        </div>
        <button onClick={() => setActivePage('add-team')} style={{
          padding: '10px 22px', borderRadius: 8, fontSize: 13,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#000',
          cursor: 'pointer', fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1,
          boxShadow: '0 0 20px #22c55e33',
        }}>+ ADD TEAM</button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
        <div
          onClick={() => setActiveCategory('all')}
          style={{
            background: activeCategory === 'all' ? '#22c55e15' : '#111827',
            border: `1px solid ${activeCategory === 'all' ? '#22c55e' : '#1f2937'}`,
            borderRadius: 10, padding: '12px', cursor: 'pointer',
            textAlign: 'center', transition: 'all 0.2s',
            boxShadow: activeCategory === 'all' ? '0 0 20px #22c55e22' : 'none',
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 3 }}>🏏</div>
          <div style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: activeCategory === 'all' ? '#22c55e' : '#f9fafb' }}>{teams.length}</div>
          <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>ALL</div>
        </div>
        {CATEGORIES.map(c => (
          <div
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            style={{
              background: activeCategory === c.value ? `${c.color}15` : '#111827',
              border: `1px solid ${activeCategory === c.value ? c.color : '#1f2937'}`,
              borderRadius: 10, padding: '12px', cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s',
              boxShadow: activeCategory === c.value ? `0 0 20px ${c.glow}` : 'none',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 3 }}>{c.icon}</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: activeCategory === c.value ? c.color : '#f9fafb' }}>
              {catCounts[c.value]}
            </div>
            <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>{c.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, width: 280, background: '#111827', border: '1px solid #1f2937', color: '#f9fafb', outline: 'none', fontFamily: 'Rajdhani' }}
          placeholder="🔍 Search teams..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Categorized grid */}
      {activeCategory === 'all' ? (
        CATEGORIES.map(cat => {
          const catTeams = filtered.filter(t => t.category === cat.value);
          if (catTeams.length === 0) return null;
          return (
            <div key={cat.value} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ height: 2, width: 20, background: cat.color, borderRadius: 1 }} />
                <span style={{ fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700, color: cat.color, letterSpacing: 2 }}>
                  {cat.icon} {cat.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron' }}>({catTeams.length})</span>
                <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {catTeams.map(team => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onEdit={() => setActivePage('add-team')}
                    onDelete={() => deleteTeam(team.id)}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#374151' }}>
              <div style={{ fontSize: 50, marginBottom: 10 }}>{CATEGORIES.find(c => c.value === activeCategory)?.icon}</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2 }}>NO {activeCategory.toUpperCase()} TEAMS YET</div>
              <button onClick={() => setActivePage('add-team')} style={{ marginTop: 14, padding: '9px 20px', borderRadius: 8, background: '#22c55e15', border: '1px solid #22c55e33', color: '#22c55e', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 10, letterSpacing: 1 }}>
                + ADD {activeCategory.toUpperCase()} TEAM
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {filtered.map(team => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onEdit={() => setActivePage('add-team')}
                  onDelete={() => deleteTeam(team.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}