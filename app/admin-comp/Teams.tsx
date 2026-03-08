'use client';
import React, { useState } from 'react';
import { useApp, Team, Player } from './AppContext';

const COLORS = ['#22c55e', '#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#eab308', '#06b6d4', '#ec4899'];

function TeamCard({ team, players, onEdit, onDelete }: {
  team: Team; players: Player[]; onEdit: () => void; onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const teamPlayers = team.players;
  const captain = teamPlayers.find(p => p.id === team.captain);
  const viceCaptain = teamPlayers.find(p => p.id === team.viceCaptain);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111827',
        border: `1px solid ${hovered ? team.color + '44' : '#1f2937'}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'all 0.2s',
        boxShadow: hovered ? `0 8px 30px ${team.color}11` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${team.color}22, transparent)`,
        borderBottom: `1px solid ${team.color}22`,
        padding: '16px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -10, top: -10,
          fontFamily: 'Bebas Neue', fontSize: 80,
          color: team.color, opacity: 0.06, lineHeight: 1, letterSpacing: 2,
        }}>
          {team.shortName}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              width: 40, height: 40,
              background: `${team.color}22`,
              border: `2px solid ${team.color}44`,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bebas Neue', fontSize: 16, color: team.color,
              marginBottom: 8,
            }}>
              {team.shortName.slice(0, 2)}
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb' }}>
              {team.name}
            </div>
            {team.homeGround && (
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                📍 {team.homeGround}
              </div>
            )}
          </div>
          <div style={{
            fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900,
            color: team.color, opacity: 0.5,
          }}>
            {team.shortName}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div style={{ background: '#0d1117', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>PLAYERS</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: '#f9fafb' }}>
              {teamPlayers.length}
            </div>
          </div>
          <div style={{ background: '#0d1117', borderRadius: 6, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>COLOR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{ width: 16, height: 16, background: team.color, borderRadius: 3 }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{team.color}</span>
            </div>
          </div>
        </div>

        {captain && (
          <div style={{ marginBottom: 6, fontSize: 12 }}>
            <span style={{ color: '#4b5563' }}>Captain: </span>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>👑 {captain.name}</span>
          </div>
        )}
        {viceCaptain && (
          <div style={{ marginBottom: 10, fontSize: 12 }}>
            <span style={{ color: '#4b5563' }}>Vice-Captain: </span>
            <span style={{ color: '#9ca3af', fontWeight: 600 }}>{viceCaptain.name}</span>
          </div>
        )}

        {/* Player list preview */}
        {teamPlayers.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', marginBottom: 6, letterSpacing: 1 }}>
              SQUAD
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {teamPlayers.slice(0, 8).map(p => (
                <span key={p.id} style={{
                  fontSize: 11, padding: '2px 8px',
                  background: '#1f2937', borderRadius: 3,
                  color: '#9ca3af',
                }}>
                  {p.name.split(' ').slice(-1)[0]}
                </span>
              ))}
              {teamPlayers.length > 8 && (
                <span style={{ fontSize: 11, padding: '2px 8px', background: '#1f2937', borderRadius: 3, color: '#4b5563' }}>
                  +{teamPlayers.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1, padding: '8px',
              background: `${team.color}15`, border: `1px solid ${team.color}33`,
              color: team.color, borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            EDIT TEAM
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '8px 14px',
              background: '#ef444415', border: '1px solid #ef444433',
              color: '#ef4444', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamModal({ team, allPlayers, onSave, onClose }: {
  team: Partial<Team> | null;
  allPlayers: Player[];
  onSave: (t: Team) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(team?.name || '');
  const [shortName, setShortName] = useState(team?.shortName || '');
  const [color, setColor] = useState(team?.color || '#22c55e');
  const [homeGround, setHomeGround] = useState(team?.homeGround || '');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(team?.players?.map(p => p.id) || []);
  const [captain, setCaptain] = useState(team?.captain || '');
  const [viceCaptain, setViceCaptain] = useState(team?.viceCaptain || '');

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSave = () => {
    const players = allPlayers.filter(p => selectedPlayers.includes(p.id));
    onSave({
      id: team?.id || `t${Date.now()}`,
      name, shortName, color, homeGround,
      players, captain, viceCaptain,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000000cc', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 12,
        width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        padding: 28,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 22, letterSpacing: 2 }}>
            {team?.id ? 'EDIT TEAM' : 'ADD TEAM'}
          </h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: '#9ca3af', fontSize: 20, cursor: 'pointer',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>
              TEAM NAME
            </label>
            <input className="input-field" style={{ padding: '9px 12px', borderRadius: 6 }}
              value={name} onChange={e => setName(e.target.value)} placeholder="Mumbai Strikers XI" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>
                SHORT NAME
              </label>
              <input className="input-field" style={{ padding: '9px 12px', borderRadius: 6 }}
                value={shortName} onChange={e => setShortName(e.target.value.toUpperCase().slice(0, 4))} placeholder="MSX" maxLength={4} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>
                HOME GROUND
              </label>
              <input className="input-field" style={{ padding: '9px 12px', borderRadius: 6 }}
                value={homeGround} onChange={e => setHomeGround(e.target.value)} placeholder="Wankhede Stadium" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>
              TEAM COLOR
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 30, height: 30, borderRadius: '50%', background: c,
                  border: `3px solid ${color === c ? '#fff' : 'transparent'}`,
                  cursor: 'pointer', transition: 'border 0.15s',
                  boxShadow: color === c ? `0 0 10px ${c}88` : 'none',
                }} />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 30, height: 30, padding: 2, background: 'transparent', border: '1px solid #1f2937', borderRadius: '50%', cursor: 'pointer' }} />
            </div>
          </div>

          {/* Player selection */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>
              SQUAD ({selectedPlayers.length} selected)
            </label>
            <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0d1117', border: '1px solid #1f2937', borderRadius: 6 }}>
              {allPlayers.map(p => (
                <div key={p.id} onClick={() => togglePlayer(p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', cursor: 'pointer',
                  borderBottom: '1px solid #1f2937',
                  background: selectedPlayers.includes(p.id) ? '#22c55e08' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: selectedPlayers.includes(p.id) ? '#22c55e' : '#1f2937',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: selectedPlayers.includes(p.id) ? '#000' : '#4b5563',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}>
                    {selectedPlayers.includes(p.id) ? '✓' : ''}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, color: '#f9fafb', fontWeight: 600 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#4b5563' }}>{p.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Captain selection */}
          {selectedPlayers.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  CAPTAIN
                </label>
                <select className="select-field" style={{ padding: '9px 12px', borderRadius: 6 }}
                  value={captain} onChange={e => setCaptain(e.target.value)}>
                  <option value="">-- Select --</option>
                  {allPlayers.filter(p => selectedPlayers.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  VICE-CAPTAIN
                </label>
                <select className="select-field" style={{ padding: '9px 12px', borderRadius: 6 }}
                  value={viceCaptain} onChange={e => setViceCaptain(e.target.value)}>
                  <option value="">-- Select --</option>
                  {allPlayers.filter(p => selectedPlayers.includes(p.id) && p.id !== captain).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '10px', borderRadius: 6, fontSize: 14 }}>
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !shortName}
            className="btn-primary"
            style={{ flex: 2, padding: '10px', borderRadius: 6, fontSize: 15, opacity: (!name || !shortName) ? 0.5 : 1 }}
          >
            {team?.id ? '💾 UPDATE TEAM' : '+ CREATE TEAM'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Teams() {
  const { teams, players, addTeam, updateTeam, deleteTeam, setActivePage } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleSave = (team: Team) => {
    if (editingTeam) {
      updateTeam(team);
    } else {
      addTeam(team);
    }
    setModalOpen(false);
    setEditingTeam(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>TEAMS</h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>{teams.length} teams registered</div>
        </div>
        <button
          onClick={() => setActivePage('add-team')}
          className="btn-primary"
          style={{ padding: '9px 20px', borderRadius: 6, fontSize: 14 }}
        >
          + ADD TEAM
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }} className="stagger">
        {teams.map(team => (
          <div key={team.id} className="animate-slide-up">
            <TeamCard
              team={team}
              players={players}
              onEdit={() => { setEditingTeam(team); setModalOpen(true); }}
              onDelete={() => deleteTeam(team.id)}
            />
          </div>
        ))}
        {teams.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#374151' }}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>🛡️</div>
            <div className="font-display" style={{ fontSize: 20, letterSpacing: 2 }}>NO TEAMS YET</div>
          </div>
        )}
      </div>

      {modalOpen && (
        <TeamModal
          team={editingTeam}
          allPlayers={players}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTeam(null); }}
        />
      )}
    </div>
  );
}