'use client';
import React, { useState } from 'react';
import { useApp, Player } from './AppContext';

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
const BATTING_STYLES = ['Right-hand', 'Left-hand'];
const BOWLING_STYLES = ['Fast', 'Fast-medium', 'Medium', 'Off-break', 'Leg-spin', 'Slow left-arm', 'None'];

const roleColors: Record<string, string> = {
  'Batsman': '#3b82f6',
  'Bowler': '#ef4444',
  'All-rounder': '#22c55e',
  'Wicket-keeper': '#eab308',
};

function PlayerModal({ player, onSave, onClose }: {
  player: Player | null;
  onSave: (p: Player) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(player?.name || '');
  const [role, setRole] = useState(player?.role || 'Batsman');
  const [battingStyle, setBattingStyle] = useState(player?.battingStyle || 'Right-hand');
  const [bowlingStyle, setBowlingStyle] = useState(player?.bowlingStyle || 'None');
  const [age, setAge] = useState(player?.age?.toString() || '');
  const [team, setTeam] = useState(player?.team || '');

  const handleSave = () => {
    onSave({
      id: player?.id || `p${Date.now()}`,
      name, role: role as Player['role'],
      battingStyle: battingStyle as Player['battingStyle'],
      bowlingStyle, age: parseInt(age) || 0, team,
    });
  };

  const color = roleColors[role] || '#22c55e';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000cc',
      backdropFilter: 'blur(4px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#111827', border: '1px solid #1f2937',
        borderRadius: 12, width: '100%', maxWidth: 480,
        padding: 28, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 22, letterSpacing: 2 }}>
            {player ? 'EDIT PLAYER' : 'ADD PLAYER'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>FULL NAME</label>
            <input className="input-field" style={{ padding: '9px 12px', borderRadius: 6 }}
              value={name} onChange={e => setName(e.target.value)} placeholder="Player Name" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>ROLE</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {ROLES.map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  padding: '8px', borderRadius: 6,
                  border: `2px solid ${role === r ? roleColors[r] : '#1f2937'}`,
                  background: role === r ? `${roleColors[r]}15` : '#0d1117',
                  color: role === r ? roleColors[r] : '#9ca3af',
                  cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
                  transition: 'all 0.15s',
                }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>BATTING</label>
              <select className="select-field" style={{ padding: '9px 12px', borderRadius: 6 }}
                value={battingStyle} onChange={e => setBattingStyle(e.target.value)}>
                {BATTING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>BOWLING</label>
              <select className="select-field" style={{ padding: '9px 12px', borderRadius: 6 }}
                value={bowlingStyle} onChange={e => setBowlingStyle(e.target.value)}>
                {BOWLING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>AGE</label>
              <input className="input-field" type="number" style={{ padding: '9px 12px', borderRadius: 6 }}
                value={age} onChange={e => setAge(e.target.value)} placeholder="25" min={15} max={50} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>BASE TEAM</label>
              <input className="input-field" style={{ padding: '9px 12px', borderRadius: 6 }}
                value={team} onChange={e => setTeam(e.target.value)} placeholder="Team name" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: 6, fontSize: 14 }}>CANCEL</button>
          <button onClick={handleSave} disabled={!name} className="btn-primary"
            style={{ flex: 2, padding: '10px', borderRadius: 6, fontSize: 15, opacity: !name ? 0.5 : 1 }}>
            {player ? '💾 UPDATE' : '+ ADD PLAYER'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Players() {
  const { players, addPlayer, setActivePage } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [filterRole, setFilterRole] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = players.filter(p => {
    if (filterRole !== 'all' && p.role !== filterRole) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = (p: Player) => {
    addPlayer(p);
    setModalOpen(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>PLAYERS</h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>{players.length} players in roster</div>
        </div>
        <button onClick={() => setActivePage('add-player')}
          className="btn-primary" style={{ padding: '9px 20px', borderRadius: 6, fontSize: 14 }}>
          + ADD PLAYER
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap',
        marginBottom: 16, alignItems: 'center',
      }}>
        <input className="input-field" style={{ padding: '7px 12px', borderRadius: 6, fontSize: 13, width: 220 }}
          placeholder="🔍 Search players..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', ...ROLES].map(r => (
            <button key={r} onClick={() => setFilterRole(r)} style={{
              padding: '5px 12px', borderRadius: 4,
              border: `1px solid ${filterRole === r ? (roleColors[r] || '#22c55e') : '#1f2937'}`,
              background: filterRole === r ? `${roleColors[r] || '#22c55e'}15` : 'transparent',
              color: filterRole === r ? (roleColors[r] || '#22c55e') : '#9ca3af',
              cursor: 'pointer', fontSize: 12, fontFamily: 'Orbitron', fontWeight: 700,
              transition: 'all 0.15s',
            }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {ROLES.map(r => (
          <div key={r} style={{
            flex: 1, background: '#111827',
            border: `1px solid ${roleColors[r]}22`,
            borderRadius: 8, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1, marginBottom: 4 }}>
              {r.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: roleColors[r] }}>
              {players.filter(p => p.role === r).length}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {filtered.map(p => {
          const color = roleColors[p.role] || '#22c55e';
          return (
            <div key={p.id} className="card-hover" style={{
              background: '#111827', border: '1px solid #1f2937',
              borderRadius: 8, padding: '14px 16px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${color}, transparent)`,
              }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: `${color}22`, border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Bebas Neue', fontSize: 18, color, flexShrink: 0,
                }}>
                  {p.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#f9fafb', fontSize: 15, fontFamily: 'Rajdhani' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{p.team}</div>
                </div>
                <span style={{
                  fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
                  color, background: `${color}18`, border: `1px solid ${color}33`,
                  padding: '2px 6px', borderRadius: 2,
                }}>
                  {p.role.toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#4b5563' }}>🏏 {p.battingStyle}</span>
                <span style={{ color: '#4b5563' }}>⚡ {p.bowlingStyle}</span>
                {p.age > 0 && <span style={{ color: '#4b5563', marginLeft: 'auto' }}>Age {p.age}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <PlayerModal
          player={editingPlayer}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingPlayer(null); }}
        />
      )}
    </div>
  );
}