'use client';
import React, { useState } from 'react';
import { useApp, Match, Level } from './AppContext';

const levelColors: Record<string, string> = {
  international: '#f97316', national: '#8b5cf6', state: '#06b6d4', city: '#eab308',
};
const statusColors: Record<string, string> = {
  live: '#ef4444', upcoming: '#3b82f6', completed: '#22c55e',
};

function MatchRow({ match, onEdit, onDelete }: {
  match: Match;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        style={{
          borderBottom: '1px solid #1f2937',
          cursor: 'pointer',
          transition: 'background 0.15s',
          background: expanded ? '#161e2e' : 'transparent',
        }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = '#0d1117'; }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
      >
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {match.status === 'live' && (
              <span className="live-dot" style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#ef4444', display: 'inline-block', flexShrink: 0,
              }} />
            )}
            <span style={{ fontWeight: 700, color: '#f9fafb', fontSize: 14, fontFamily: 'Rajdhani' }}>
              {match.title}
            </span>
          </div>
          {match.tournament && (
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{match.tournament}</div>
          )}
        </td>
        <td style={{ padding: '12px 8px' }}>
          <span className="badge" style={{
            background: `${statusColors[match.status]}18`,
            color: statusColors[match.status],
            border: `1px solid ${statusColors[match.status]}33`,
          }}>
            {match.status.toUpperCase()}
          </span>
        </td>
        <td style={{ padding: '12px 8px' }}>
          <span className="badge" style={{
            background: `${levelColors[match.level]}18`,
            color: levelColors[match.level],
            border: `1px solid ${levelColors[match.level]}33`,
          }}>
            {match.level.toUpperCase()}
          </span>
        </td>
        <td style={{ padding: '12px 8px', color: '#9ca3af', fontSize: 13 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: 11 }}>{match.format}</span>
        </td>
        <td style={{ padding: '12px 8px', color: '#9ca3af', fontSize: 13 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, color: '#f9fafb' }}>
            {match.teamA.shortName} <span style={{ color: '#22c55e' }}>vs</span> {match.teamB.shortName}
          </div>
          {match.scoreA && (
            <div style={{ fontSize: 11, fontFamily: 'Orbitron', color: '#22c55e', marginTop: 2 }}>
              {match.scoreA} / {match.scoreB}
            </div>
          )}
        </td>
        <td style={{ padding: '12px 8px', color: '#4b5563', fontSize: 12 }}>
          <div>{match.date}</div>
          <div>{match.time}</div>
        </td>
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{
                padding: '5px 12px', borderRadius: 4,
                background: '#22c55e15', border: '1px solid #22c55e33',
                color: '#22c55e', cursor: 'pointer',
                fontSize: 12, fontFamily: 'Rajdhani', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#22c55e22'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#22c55e15'; }}
            >
              EDIT
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{
                padding: '5px 10px', borderRadius: 4,
                background: '#ef444415', border: '1px solid #ef444433',
                color: '#ef4444', cursor: 'pointer',
                fontSize: 12, fontFamily: 'Rajdhani', fontWeight: 600,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef444422'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ef444415'; }}
            >
              ✕
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded row */}
      {expanded && (
        <tr style={{ background: '#0a0f16' }}>
          <td colSpan={7} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', marginBottom: 6, letterSpacing: 1 }}>MATCH INFO</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.8 }}>
                  <div>📍 {match.venue}</div>
                  <div>🏏 Format: {match.format}</div>
                  <div>🎯 Type: {match.type}</div>
                  {match.umpires && <div>👨‍⚖️ Umpires: {match.umpires.join(', ')}</div>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', marginBottom: 6, letterSpacing: 1 }}>TEAM A — {match.teamA.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.8 }}>
                  {match.teamA.players.slice(0, 6).map(p => (
                    <span key={p.id} style={{ display: 'inline-block', marginRight: 8 }}>{p.name}</span>
                  ))}
                  {match.teamA.players.length > 6 && <span style={{ color: '#4b5563' }}>+{match.teamA.players.length - 6} more</span>}
                  {match.teamA.players.length === 0 && <span style={{ color: '#374151' }}>No players selected</span>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', marginBottom: 6, letterSpacing: 1 }}>TEAM B — {match.teamB.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.8 }}>
                  {match.teamB.players.slice(0, 6).map(p => (
                    <span key={p.id} style={{ display: 'inline-block', marginRight: 8 }}>{p.name}</span>
                  ))}
                  {match.teamB.players.length > 6 && <span style={{ color: '#4b5563' }}>+{match.teamB.players.length - 6} more</span>}
                  {match.teamB.players.length === 0 && <span style={{ color: '#374151' }}>No players selected</span>}
                </div>
              </div>
              {match.result && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{
                    background: '#22c55e11', border: '1px solid #22c55e22',
                    borderRadius: 6, padding: '8px 12px',
                    fontSize: 13, color: '#22c55e', fontWeight: 600,
                  }}>
                    🏆 {match.result}
                  </div>
                </div>
              )}
              {match.notes && (
                <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#4b5563' }}>
                  📝 {match.notes}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AllMatches() {
  const { matches, deleteMatch, setEditingMatch, setActivePage } = useApp();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = matches.filter(m => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (filterLevel !== 'all' && m.level !== filterLevel) return false;
    if (filterFormat !== 'all' && m.format !== filterFormat) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) &&
      !m.teamA.name.toLowerCase().includes(search.toLowerCase()) &&
      !m.teamB.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterBtnStyle = (active: boolean, color = '#22c55e'): React.CSSProperties => ({
    padding: '5px 12px', borderRadius: 4,
    border: `1px solid ${active ? color : '#1f2937'}`,
    background: active ? `${color}15` : 'transparent',
    color: active ? color : '#9ca3af',
    cursor: 'pointer', fontSize: 12,
    fontFamily: 'Orbitron', fontWeight: 700,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>ALL MATCHES</h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>{filtered.length} of {matches.length} matches</div>
        </div>
        <button
          onClick={() => { setEditingMatch(null); setActivePage('add-match'); }}
          className="btn-primary"
          style={{ padding: '9px 20px', borderRadius: 6, fontSize: 14 }}
        >
          + ADD MATCH
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
      }}>
        <input
          className="input-field"
          style={{ padding: '7px 12px', borderRadius: 6, fontSize: 13, width: 220 }}
          placeholder="🔍 Search matches..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'live', 'upcoming', 'completed'].map(s => (
            <button key={s} style={filterBtnStyle(filterStatus === s, statusColors[s] || '#22c55e')}
              onClick={() => setFilterStatus(s)}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'international', 'national', 'state', 'city'].map(l => (
            <button key={l} style={filterBtnStyle(filterLevel === l, levelColors[l] || '#22c55e')}
              onClick={() => setFilterLevel(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'T20', 'ODI', 'T10', 'Test'].map(f => (
            <button key={f} style={filterBtnStyle(filterFormat === f)}
              onClick={() => setFilterFormat(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937', background: '#0d1117' }}>
              {['Match', 'Status', 'Level', 'Format', 'Teams & Score', 'Date/Time', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left',
                  fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700,
                  color: '#4b5563', letterSpacing: 1,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#374151' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🏏</div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2 }}>NO MATCHES FOUND</div>
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <MatchRow
                  key={m.id}
                  match={m}
                  onEdit={() => { setEditingMatch(m); setActivePage('add-match'); }}
                  onDelete={() => deleteMatch(m.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
