'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useApp, Tournament, Level, TournamentType, Format } from './AppContext';

const LEVEL_META: Record<string, { label: string; icon: string; color: string; glow: string }> = {
  international: { label: 'International', icon: '🌍', color: '#f97316', glow: '#f9731633' },
  national:      { label: 'National',      icon: '🏴', color: '#8b5cf6', glow: '#8b5cf633' },
  state:         { label: 'State',         icon: '🗺️', color: '#06b6d4', glow: '#06b6d433' },
  city:          { label: 'City',          icon: '🏙️', color: '#eab308', glow: '#eab30833' },
};
const TYPE_META: Record<string, { label: string; color: string }> = {
  professional:     { label: 'Professional',     color: '#22c55e' },
  'semi-professional': { label: 'Semi-Pro',      color: '#3b82f6' },
  entertainment:    { label: 'Entertainment',    color: '#ec4899' },
};
const STATUS_COLORS: Record<string, string> = {
  ongoing: '#22c55e', upcoming: '#3b82f6', completed: '#6b7280',
};

function TournamentCard({ tournament, onEdit, onDelete, onView, matchCount }: {
  tournament: Tournament; onEdit: () => void; onDelete: () => void; onView: () => void; matchCount: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lm = LEVEL_META[tournament.level];
  const tm = TYPE_META[tournament.type];
  const sc = STATUS_COLORS[tournament.status];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(.4,0,.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={ref} style={{
      background: 'linear-gradient(135deg, #0d1520, #111827)',
      border: `1px solid ${lm.color}33`,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = `${lm.color}77`;
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px ${lm.glow}`;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.borderColor = `${lm.color}33`;
      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
    }}
    >
      {/* Top accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${lm.color}, ${lm.color}44, transparent)` }} />

      {/* Ghost text bg */}
      <div style={{
        position: 'absolute', right: -10, top: 10,
        fontFamily: 'Bebas Neue', fontSize: 100, letterSpacing: 2,
        color: lm.color, opacity: 0.04, lineHeight: 1, pointerEvents: 'none',
        userSelect: 'none',
      }}>{tournament.shortName}</div>

      {/* Header */}
      <div style={{ padding: '18px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, letterSpacing: 1,
                background: `${lm.color}18`, color: lm.color, border: `1px solid ${lm.color}33`,
                padding: '2px 8px', borderRadius: 3,
              }}>{lm.icon} {lm.label.toUpperCase()}</span>
              <span style={{
                fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, letterSpacing: 1,
                background: `${tm.color}18`, color: tm.color, border: `1px solid ${tm.color}33`,
                padding: '2px 8px', borderRadius: 3,
              }}>{tm.label.toUpperCase()}</span>
              <span style={{
                fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, letterSpacing: 1,
                background: `${sc}18`, color: sc, border: `1px solid ${sc}33`,
                padding: '2px 8px', borderRadius: 3,
              }}>
                {tournament.status === 'ongoing' && '● '}
                {tournament.status.toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb', lineHeight: 1.1 }}>
              {tournament.name}
            </div>
            {tournament.description && (
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontFamily: 'Rajdhani', lineHeight: 1.4 }}>
                {tournament.description}
              </div>
            )}
          </div>
          <div style={{
            background: `${lm.color}15`, border: `1px solid ${lm.color}33`,
            borderRadius: 8, padding: '8px 12px', textAlign: 'center', flexShrink: 0,
          }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: lm.color }}>
              {tournament.format === 'T2' ? '2' : '11'}
            </div>
            <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>OVERS</div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: `1px solid ${lm.color}22`, borderBottom: `1px solid ${lm.color}22`,
        background: '#0a0f16',
      }}>
        {[
          { label: 'TEAMS',   value: tournament.teams.length },
          { label: 'MATCHES', value: matchCount },
          { label: 'FORMAT',  value: tournament.format },
          { label: 'PRIZE',   value: tournament.prizePool || '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: '10px 12px', textAlign: 'center', borderRight: `1px solid ${lm.color}15` }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: 15, fontWeight: 900, color: '#f9fafb' }}>{value}</div>
            <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Rajdhani' }}>
          📅 {tournament.startDate} → {tournament.endDate}
          {tournament.venue && <span style={{ marginLeft: 8 }}>📍 {tournament.venue}</span>}
        </div>
        {tournament.prizePool && (
          <div style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#22c55e' }}>
            💰 {tournament.prizePool}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
        <button onClick={onView} style={{
          flex: 1, padding: '9px', borderRadius: 7,
          background: `${lm.color}15`, border: `1px solid ${lm.color}33`,
          color: lm.color, cursor: 'pointer',
          fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, letterSpacing: 1,
          transition: 'all 0.15s',
        }}>
          🏆 VIEW
        </button>
        <button onClick={onEdit} style={{
          flex: 1, padding: '9px', borderRadius: 7,
          background: '#22c55e15', border: '1px solid #22c55e33',
          color: '#22c55e', cursor: 'pointer',
          fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, letterSpacing: 1,
          transition: 'all 0.15s',
        }}>
          ✏️ EDIT
        </button>
        <button onClick={onDelete} style={{
          padding: '9px 14px', borderRadius: 7,
          background: '#ef444415', border: '1px solid #ef444433',
          color: '#ef4444', cursor: 'pointer',
          fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700,
          transition: 'all 0.15s',
        }}>✕</button>
      </div>
    </div>
  );
}

export default function Tournaments() {
  const { tournaments, deleteTournament, setEditingTournament, setActivePage, getMatchesByTournament } = useApp();
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = tournaments.filter(t => {
    if (filterLevel !== 'all' && t.level !== filterLevel) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const levelStats = ['international', 'national', 'state', 'city'].map(l => ({
    level: l, count: tournaments.filter(t => t.level === l).length,
    meta: LEVEL_META[l],
  }));

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 36, letterSpacing: 4, color: '#f9fafb', lineHeight: 1, margin: 0 }}>
            TOURNAMENTS
          </h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4, fontFamily: 'Rajdhani' }}>
            {filtered.length} of {tournaments.length} tournaments
          </div>
        </div>
        <button
          onClick={() => { setEditingTournament(null); setActivePage('add-tournament'); }}
          style={{
            padding: '10px 22px', borderRadius: 8, fontSize: 13,
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            border: 'none', color: '#000', cursor: 'pointer',
            fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1,
            boxShadow: '0 0 20px #22c55e33',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ＋ NEW TOURNAMENT
        </button>
      </div>

      {/* Level overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {levelStats.map(({ level, count, meta }) => (
          <div
            key={level}
            onClick={() => setFilterLevel(filterLevel === level ? 'all' : level)}
            style={{
              background: filterLevel === level ? `${meta.color}15` : '#111827',
              border: `1px solid ${filterLevel === level ? meta.color : meta.color + '33'}`,
              borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filterLevel === level ? `0 0 20px ${meta.glow}` : 'none',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{meta.icon}</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: 24, fontWeight: 900, color: meta.color, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1, marginTop: 2 }}>{meta.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: '#111827', border: '1px solid #1f2937', borderRadius: 10,
        padding: '14px 16px', marginBottom: 20,
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      }}>
        <input
          style={{
            padding: '7px 12px', borderRadius: 6, fontSize: 13,
            background: '#0d1117', border: '1px solid #374151',
            color: '#f9fafb', width: 220, outline: 'none',
            fontFamily: 'Rajdhani',
          }}
          placeholder="🔍 Search tournaments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'ongoing', 'upcoming', 'completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
              border: `1px solid ${filterStatus === s ? (STATUS_COLORS[s] || '#22c55e') : '#1f2937'}`,
              background: filterStatus === s ? `${STATUS_COLORS[s] || '#22c55e'}15` : 'transparent',
              color: filterStatus === s ? (STATUS_COLORS[s] || '#22c55e') : '#9ca3af',
              fontSize: 11, fontFamily: 'Orbitron', fontWeight: 700,
              transition: 'all 0.15s',
            }}>
              {s === 'ongoing' && '● '}{s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#374151' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🏆</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, letterSpacing: 3 }}>NO TOURNAMENTS YET</div>
          <div style={{ fontFamily: 'Rajdhani', fontSize: 14, marginTop: 8 }}>
            Create your first tournament to get started
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
              matchCount={getMatchesByTournament(t.id).length}
              onEdit={() => { setEditingTournament(t); setActivePage('add-tournament'); }}
              onDelete={() => deleteTournament(t.id)}
              onView={() => { setEditingTournament(t); setActivePage('tournament-detail'); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}