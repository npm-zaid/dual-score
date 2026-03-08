'use client';
import React, { useEffect, useRef } from 'react';
import { useApp, Match } from './AppContext';

function StatCard({
  icon, label, value, sub, color, delay = 0,
}: {
  icon: string; label: string; value: string | number;
  sub?: string; color: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    setTimeout(() => {
      el.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, delay);
  }, [delay]);

  return (
    <div ref={ref} className="card-hover" style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: 10,
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow corner */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}18, transparent)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div style={{
          fontSize: 10, color,
          fontFamily: 'Orbitron', fontWeight: 700,
          background: `${color}15`,
          border: `1px solid ${color}33`,
          padding: '2px 8px', borderRadius: 2,
        }}>
          {label}
        </div>
      </div>
      <div style={{ fontFamily: 'Orbitron', fontSize: 30, fontWeight: 900, color: '#f9fafb', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const statusColor = match.status === 'live' ? '#ef4444' : match.status === 'upcoming' ? '#3b82f6' : '#22c55e';
  const levelColors: Record<string, string> = {
    international: '#f97316', national: '#8b5cf6', state: '#06b6d4', city: '#eab308',
  };

  return (
    <div
      onClick={onClick}
      className="card-hover"
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 8,
        padding: '14px 16px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="badge" style={{
            background: `${statusColor}18`, color: statusColor,
            border: `1px solid ${statusColor}33`,
          }}>
            {match.status === 'live' && '● '}{match.status.toUpperCase()}
          </span>
          <span className="badge" style={{
            background: `${levelColors[match.level]}18`,
            color: levelColors[match.level],
            border: `1px solid ${levelColors[match.level]}33`,
          }}>
            {match.level.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#4b5563', fontFamily: 'Orbitron' }}>{match.format}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        {/* Team A */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1, color: '#f9fafb' }}>
            {match.teamA.shortName}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{match.teamA.name}</div>
          {match.scoreA && (
            <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color: '#22c55e', marginTop: 2 }}>
              {match.scoreA}
            </div>
          )}
        </div>

        {/* VS */}
        <div style={{
          padding: '4px 12px',
          background: '#0d1117',
          border: '1px solid #1f2937',
          borderRadius: 4,
          fontFamily: 'Bebas Neue',
          fontSize: 16, color: '#4b5563', letterSpacing: 2,
        }}>
          VS
        </div>

        {/* Team B */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1, color: '#f9fafb' }}>
            {match.teamB.shortName}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{match.teamB.name}</div>
          {match.scoreB && (
            <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color: '#9ca3af', marginTop: 2 }}>
              {match.scoreB}
            </div>
          )}
        </div>
      </div>

      {match.result && (
        <div style={{
          fontSize: 11, color: '#22c55e',
          background: '#22c55e11', border: '1px solid #22c55e22',
          borderRadius: 4, padding: '4px 8px',
          fontFamily: 'Rajdhani', fontWeight: 600,
        }}>
          {match.result}
        </div>
      )}

      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#374151' }}>
        <span>📍 {match.venue.split(',')[0]}</span>
        <span>📅 {match.date} {match.time}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { matches, teams, players, setActivePage, setEditingMatch } = useApp();

  const totalMatches = matches.length;
  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const totalPlayers = players.length;

  const levelDistribution = ['international', 'national', 'state', 'city'].map(l => ({
    level: l,
    count: matches.filter(m => m.level === l).length,
  }));

  const recentMatches = [...matches]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div style={{ padding: '24px', maxWidth: 1400 }}>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d2d1a, #111827)',
        border: '1px solid #22c55e22',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
        className="animate-fade"
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
        }} />
        <div style={{
          position: 'absolute', right: -20, top: -20,
          fontSize: 120, opacity: 0.04, lineHeight: 1,
        }}>🏏</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>
          ZILLA CRICKET ADMIN
        </div>
        <div style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
          Manage all your cricket tournaments, matches, and teams from one place.
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <button
            onClick={() => setActivePage('add-match')}
            className="btn-primary"
            style={{ padding: '8px 20px', borderRadius: 6, fontSize: 14 }}
          >
            + CREATE MATCH
          </button>
          <button
            onClick={() => setActivePage('latest')}
            className="btn-secondary"
            style={{ padding: '8px 20px', borderRadius: 6, fontSize: 14 }}
          >
            VIEW LIVE
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <StatCard icon="🏏" label="TOTAL" value={totalMatches} sub="All matches" color="#22c55e" delay={50} />
        <StatCard icon="🔴" label="LIVE" value={liveMatches.length} sub="In progress now" color="#ef4444" delay={100} />
        <StatCard icon="📅" label="UPCOMING" value={upcomingMatches.length} sub="Scheduled" color="#3b82f6" delay={150} />
        <StatCard icon="✅" label="DONE" value={completedMatches.length} sub="Completed" color="#22c55e" delay={200} />
        <StatCard icon="🛡️" label="TEAMS" value={teams.length} sub="Registered" color="#8b5cf6" delay={250} />
        <StatCard icon="👤" label="PLAYERS" value={totalPlayers} sub="In roster" color="#f97316" delay={300} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live matches */}
          {liveMatches.length > 0 && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 12,
              }}>
                <span className="live-dot" style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ef4444', display: 'inline-block',
                }} />
                <h2 className="font-display" style={{ fontSize: 20, letterSpacing: 2, color: '#ef4444' }}>
                  LIVE MATCHES
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {liveMatches.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    onClick={() => { setEditingMatch(m); setActivePage('add-match'); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent matches */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="font-display" style={{ fontSize: 20, letterSpacing: 2, color: '#f9fafb' }}>
                RECENT MATCHES
              </h2>
              <button
                onClick={() => setActivePage('matches')}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#22c55e', fontSize: 13,
                  cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 600,
                }}
              >
                VIEW ALL →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentMatches.map(m => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onClick={() => { setEditingMatch(m); setActivePage('add-match'); }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Level breakdown */}
          <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: 10, padding: '18px',
          }}
            className="animate-slide-up"
          >
            <h3 className="font-display" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 14, color: '#f9fafb' }}>
              MATCH LEVELS
            </h3>
            {levelDistribution.map(({ level, count }) => {
              const colors: Record<string, string> = {
                international: '#f97316', national: '#8b5cf6', state: '#06b6d4', city: '#eab308',
              };
              const pct = totalMatches ? Math.round((count / totalMatches) * 100) : 0;
              return (
                <div key={level} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#9ca3af', textTransform: 'capitalize', fontWeight: 600 }}>{level}</span>
                    <span style={{ fontSize: 12, fontFamily: 'Orbitron', color: colors[level] }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: '#1f2937', borderRadius: 2 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: colors[level],
                      borderRadius: 2,
                      transition: 'width 1s ease',
                      boxShadow: `0 0 8px ${colors[level]}66`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upcoming */}
          <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: 10, padding: '18px',
          }}>
            <h3 className="font-display" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 14, color: '#f9fafb' }}>
              UPCOMING
            </h3>
            {upcomingMatches.length === 0 ? (
              <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No upcoming matches
              </div>
            ) : upcomingMatches.map(m => (
              <div
                key={m.id}
                onClick={() => { setEditingMatch(m); setActivePage('add-match'); }}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #1f2937',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14, color: '#f9fafb', marginBottom: 2 }}>
                  {m.teamA.shortName} vs {m.teamB.shortName}
                </div>
                <div style={{ fontSize: 11, color: '#4b5563' }}>
                  {m.date} · {m.time} · {m.format}
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div style={{
            background: '#111827', border: '1px solid #1f2937',
            borderRadius: 10, padding: '18px',
          }}>
            <h3 className="font-display" style={{ fontSize: 16, letterSpacing: 2, marginBottom: 14, color: '#f9fafb' }}>
              FORMAT BREAKDOWN
            </h3>
            {['T20', 'ODI', 'T10', '50-50', 'Test'].map(f => {
              const cnt = matches.filter(m => m.format === f).length;
              if (!cnt) return null;
              return (
                <div key={f} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: '1px solid #1f2937',
                  fontSize: 13,
                }}>
                  <span style={{ color: '#9ca3af', fontWeight: 600 }}>{f}</span>
                  <span style={{ fontFamily: 'Orbitron', color: '#22c55e', fontSize: 12 }}>{cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
