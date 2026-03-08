'use client';
import React, { useState, useEffect } from 'react';
import { useApp, Match } from './AppContext';

// ===================== LATEST / LIVE PAGE =====================
export function Latest() {
  const { matches, setEditingMatch, setActivePage } = useApp();
  const [tab, setTab] = useState<'live' | 'upcoming' | 'completed'>('live');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed');

  const tabMatches = tab === 'live' ? liveMatches : tab === 'upcoming' ? upcomingMatches : completedMatches;
  const tabColors = { live: '#ef4444', upcoming: '#3b82f6', completed: '#22c55e' };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>LATEST</h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>Live scores, upcoming fixtures & results</div>
      </div>

      {/* Live feature card */}
      {liveMatches.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {liveMatches.map(m => (
            <div key={m.id} style={{
              background: 'linear-gradient(135deg, #1a0808, #111827)',
              border: '1px solid #ef444422',
              borderRadius: 12, padding: 24,
              position: 'relative', overflow: 'hidden',
              marginBottom: 12,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />
              <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 100, opacity: 0.03 }}>🏏</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#ef4444', letterSpacing: 2 }}>LIVE NOW</span>
                    <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#4b5563' }}>{m.format} · {m.level.toUpperCase()}</span>
                  </div>
                  <h2 className="font-display" style={{ fontSize: 24, letterSpacing: 2, color: '#f9fafb', marginBottom: 4 }}>{m.title}</h2>
                  <div style={{ fontSize: 12, color: '#4b5563' }}>📍 {m.venue}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb' }}>{m.teamA.shortName}</div>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: '#22c55e' }}>{m.scoreA || '—'}</div>
                    <div style={{ fontSize: 11, color: '#4b5563' }}>{m.teamA.name}</div>
                  </div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color: '#374151', letterSpacing: 4 }}>VS</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb' }}>{m.teamB.shortName}</div>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: '#9ca3af' }}>{m.scoreB || '—'}</div>
                    <div style={{ fontSize: 11, color: '#4b5563' }}>{m.teamB.name}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => { setEditingMatch(m); setActivePage('add-match'); }}
                  style={{
                    padding: '7px 16px', borderRadius: 6,
                    background: '#ef444415', border: '1px solid #ef444433',
                    color: '#ef4444', cursor: 'pointer',
                    fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
                  }}
                >
                  UPDATE SCORE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['live', 'upcoming', 'completed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 6,
            border: `1px solid ${tab === t ? tabColors[t] : '#1f2937'}`,
            background: tab === t ? `${tabColors[t]}15` : 'transparent',
            color: tab === t ? tabColors[t] : '#4b5563',
            cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            transition: 'all 0.2s',
          }}>
            {t === 'live' && `● `}{t.toUpperCase()} ({(t === 'live' ? liveMatches : t === 'upcoming' ? upcomingMatches : completedMatches).length})
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tabMatches.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px',
            background: '#111827', border: '1px solid #1f2937', borderRadius: 8,
            color: '#374151',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {tab === 'live' ? '📡' : tab === 'upcoming' ? '📅' : '✅'}
            </div>
            <div className="font-display" style={{ fontSize: 16, letterSpacing: 2 }}>
              NO {tab.toUpperCase()} MATCHES
            </div>
          </div>
        ) : tabMatches.map(m => (
          <div key={m.id} className="card-hover" style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: 8, padding: '16px 18px',
            cursor: 'pointer',
          }}
            onClick={() => { setEditingMatch(m); setActivePage('add-match'); }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 15, color: '#f9fafb', marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>📍 {m.venue} · 📅 {m.date} {m.time}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: '#f9fafb' }}>{m.teamA.shortName}</div>
                  {m.scoreA && <div style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#22c55e' }}>{m.scoreA}</div>}
                </div>
                <span style={{ color: '#374151', fontFamily: 'Bebas Neue', fontSize: 14 }}>VS</span>
                <div>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, color: '#f9fafb' }}>{m.teamB.shortName}</div>
                  {m.scoreB && <div style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#9ca3af' }}>{m.scoreB}</div>}
                </div>
              </div>
            </div>
            {m.result && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>🏆 {m.result}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== SCHEDULE PAGE =====================
export function Schedule() {
  const { matches, setEditingMatch, setActivePage } = useApp();

  const upcoming = [...matches.filter(m => m.status === 'upcoming')]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const groupByDate = (ms: Match[]) => {
    const groups: Record<string, Match[]> = {};
    ms.forEach(m => {
      const d = m.date || 'TBD';
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    });
    return groups;
  };

  const grouped = groupByDate(upcoming);
  const levelColors: Record<string, string> = {
    international: '#f97316', national: '#8b5cf6', state: '#06b6d4', city: '#eab308',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>SCHEDULE</h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>{upcoming.length} upcoming matches</div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: '#111827', border: '1px solid #1f2937', borderRadius: 8, color: '#374151',
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
          <div className="font-display" style={{ fontSize: 18, letterSpacing: 2 }}>NO SCHEDULED MATCHES</div>
        </div>
      ) : Object.entries(grouped).map(([date, ms]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
          }}>
            <div style={{
              background: '#22c55e22', border: '1px solid #22c55e33',
              borderRadius: 6, padding: '6px 12px',
              fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700, color: '#22c55e',
            }}>
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
            <span style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#4b5563' }}>{ms.length} match{ms.length > 1 ? 'es' : ''}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ms.map(m => (
              <div key={m.id} className="card-hover"
                onClick={() => { setEditingMatch(m); setActivePage('add-match'); }}
                style={{
                  background: '#111827', border: '1px solid #1f2937',
                  borderRadius: 8, padding: '14px 16px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                }}>
                <div style={{
                  textAlign: 'center', minWidth: 50,
                  borderRight: '1px solid #1f2937', paddingRight: 14,
                }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{m.time}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, color: '#f9fafb', fontSize: 15 }}>
                    {m.teamA.shortName} <span style={{ color: '#4b5563' }}>vs</span> {m.teamB.shortName}
                  </div>
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 2 }}>
                    📍 {m.venue}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge" style={{
                    background: `${levelColors[m.level]}18`,
                    color: levelColors[m.level],
                    border: `1px solid ${levelColors[m.level]}33`,
                  }}>{m.level.toUpperCase()}</span>
                  <span className="badge" style={{
                    background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e33',
                  }}>{m.format}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== STATS PAGE =====================
export function Stats() {
  const { matches, teams, players } = useApp();

  const total = matches.length;
  const levels = ['international', 'national', 'state', 'city'].map(l => ({
    label: l, count: matches.filter(m => m.level === l).length,
  }));
  const formats = ['T20', 'ODI', 'T10', '50-50', 'Test'].map(f => ({
    label: f, count: matches.filter(m => m.format === f).length,
  }));
  const types = ['professional', 'semi-pro', 'normal'].map(t => ({
    label: t, count: matches.filter(m => m.type === t).length,
  }));

  const levelColors: Record<string, string> = {
    international: '#f97316', national: '#8b5cf6', state: '#06b6d4', city: '#eab308',
  };

  const Bar = ({ count, color, max }: { count: number; color: string; max: number }) => (
    <div style={{ flex: 1, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
      <div style={{ fontFamily: 'Orbitron', fontSize: 14, fontWeight: 900, color }}>{count}</div>
      <div style={{
        width: '60%', height: max ? `${(count / max) * 80}px` : '4px',
        background: color, borderRadius: 3,
        transition: 'height 0.8s ease',
        boxShadow: `0 0 10px ${color}44`,
        minHeight: 4,
      }} />
    </div>
  );

  const maxLevel = Math.max(...levels.map(l => l.count), 1);
  const maxFormat = Math.max(...formats.map(f => f.count), 1);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>STATISTICS</h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>Overview of all match data</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {/* Level distribution */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
          <h3 className="font-display" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 20, color: '#f9fafb' }}>BY LEVEL</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 140, marginBottom: 10 }}>
            {levels.map(l => <Bar key={l.label} count={l.count} color={levelColors[l.label]} max={maxLevel} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {levels.map(l => (
              <div key={l.label} style={{ fontSize: 10, color: levelColors[l.label], fontFamily: 'Orbitron', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>
                {l.label.slice(0, 4)}
              </div>
            ))}
          </div>
        </div>

        {/* Format distribution */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
          <h3 className="font-display" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 20, color: '#f9fafb' }}>BY FORMAT</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 140, marginBottom: 10 }}>
            {formats.map(f => <Bar key={f.label} count={f.count} color="#22c55e" max={maxFormat} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {formats.map(f => (
              <div key={f.label} style={{ fontSize: 10, color: '#22c55e', fontFamily: 'Orbitron', fontWeight: 700, textAlign: 'center' }}>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 20 }}>
          <h3 className="font-display" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 20, color: '#f9fafb' }}>SUMMARY</h3>
          {[
            { label: 'Total Matches', value: total, color: '#22c55e' },
            { label: 'Total Teams', value: teams.length, color: '#8b5cf6' },
            { label: 'Total Players', value: players.length, color: '#f97316' },
            { label: 'Live Matches', value: matches.filter(m => m.status === 'live').length, color: '#ef4444' },
            { label: 'Completed', value: matches.filter(m => m.status === 'completed').length, color: '#22c55e' },
            ...types.map(t => ({ label: t.label.charAt(0).toUpperCase() + t.label.slice(1), value: t.count, color: '#3b82f6' })),
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid #1f2937',
            }}>
              <span style={{ fontSize: 13, color: '#9ca3af', textTransform: 'capitalize' }}>{label}</span>
              <span style={{ fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== TOURNAMENTS PAGE =====================
export function Tournaments() {
  const { matches } = useApp();

  const tournamentMap: Record<string, Match[]> = {};
  matches.forEach(m => {
    const key = m.tournament || 'Uncategorized';
    if (!tournamentMap[key]) tournamentMap[key] = [];
    tournamentMap[key].push(m);
  });

  const levelColors: Record<string, string> = {
    international: '#f97316', national: '#8b5cf6', state: '#06b6d4', city: '#eab308',
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>TOURNAMENTS</h1>
        <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>{Object.keys(tournamentMap).length} tournaments</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {Object.entries(tournamentMap).map(([name, ms]) => {
          const live = ms.filter(m => m.status === 'live').length;
          const upcoming = ms.filter(m => m.status === 'upcoming').length;
          const completed = ms.filter(m => m.status === 'completed').length;
          const level = ms[0]?.level || 'national';
          const color = levelColors[level];

          return (
            <div key={name} className="card-hover" style={{
              background: '#111827', border: '1px solid #1f2937',
              borderRadius: 10, padding: 20, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <div style={{ position: 'absolute', right: -10, top: 0, fontSize: 60, opacity: 0.03 }}>🏆</div>

              <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2, color: '#f9fafb', marginBottom: 4 }}>
                {name}
              </div>
              <span className="badge" style={{
                background: `${color}18`, color, border: `1px solid ${color}33`,
                display: 'inline-block', marginBottom: 14,
              }}>
                {level.toUpperCase()}
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'LIVE', value: live, color: '#ef4444' },
                  { label: 'UPCOMING', value: upcoming, color: '#3b82f6' },
                  { label: 'DONE', value: completed, color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#0d1117', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: '#4b5563' }}>
                {ms.length} total match{ms.length > 1 ? 'es' : ''} · {ms[0]?.type || '—'} level
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
