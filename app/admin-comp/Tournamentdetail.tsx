'use client';
import React, { useState } from 'react';
import { useApp, Match } from './AppContext';

const LEVEL_META: Record<string, { icon: string; color: string }> = {
  international: { icon: '🌍', color: '#f97316' },
  national:      { icon: '🏴', color: '#8b5cf6' },
  state:         { icon: '🗺️', color: '#06b6d4' },
  city:          { icon: '🏙️', color: '#eab308' },
};
const STATUS_COLORS: Record<string, string> = {
  live: '#ef4444', upcoming: '#3b82f6', completed: '#22c55e',
};

export default function TournamentDetail() {
  const {
    editingTournament, teams, getMatchesByTournament,
    setActivePage, setEditingMatch, setEditingTournament, deleteMatch,
  } = useApp();
  const [tab, setTab] = useState<'overview' | 'teams' | 'matches' | 'timeline'>('overview');

  if (!editingTournament) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#4b5563', fontFamily: 'Rajdhani', fontSize: 14 }}>
        No tournament selected.{' '}
        <button onClick={() => setActivePage('tournaments')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: 14 }}>
          Go back
        </button>
      </div>
    );
  }

  const t = editingTournament;
  const lm = LEVEL_META[t.level];
  const tournamentTeams = teams.filter(team => t.teams.includes(team.id));
  const tournamentMatches = getMatchesByTournament(t.id);

  const matchesByStatus = {
    live: tournamentMatches.filter(m => m.status === 'live'),
    upcoming: tournamentMatches.filter(m => m.status === 'upcoming'),
    completed: tournamentMatches.filter(m => m.status === 'completed'),
  };

  // Create a new match pre-linked to this tournament
  const handleAddMatch = () => {
    setEditingMatch(null);
    // Store tournament context so AddMatch pre-selects it
    // We navigate to add-match; AddMatch will show tournament pre-selected
    // We pass the tournament via editingTournament which stays set
    setActivePage('add-match');
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Back */}
      <button onClick={() => setActivePage('tournaments')} style={{
        background: 'none', border: 'none', color: '#4b5563', fontSize: 11,
        cursor: 'pointer', fontFamily: 'Orbitron', marginBottom: 16, padding: 0,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>← ALL TOURNAMENTS</button>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${lm.color}15, #111827)`,
        border: `1px solid ${lm.color}33`,
        borderRadius: 14, padding: '24px 28px', marginBottom: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${lm.color}, ${lm.color}44, transparent)` }} />
        <div style={{ position: 'absolute', right: -20, bottom: -20, fontFamily: 'Bebas Neue', fontSize: 140, color: lm.color, opacity: 0.04, lineHeight: 1, pointerEvents: 'none' }}>
          {t.shortName}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, background: `${lm.color}18`, color: lm.color, border: `1px solid ${lm.color}33`, padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>
                {lm.icon} {t.level.toUpperCase()}
              </span>
              <span style={{ fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, background: '#1f2937', color: '#9ca3af', padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>
                {t.type.toUpperCase()}
              </span>
              <span style={{
                fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700, letterSpacing: 1, padding: '2px 8px', borderRadius: 3,
                background: `${{ ongoing: '#22c55e', upcoming: '#3b82f6', completed: '#6b7280' }[t.status]}18`,
                color: { ongoing: '#22c55e', upcoming: '#3b82f6', completed: '#6b7280' }[t.status],
                border: `1px solid ${{ ongoing: '#22c55e', upcoming: '#3b82f6', completed: '#6b7280' }[t.status]}33`,
              }}>
                {t.status === 'ongoing' && '● '}{t.status.toUpperCase()}
              </span>
            </div>
            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 34, letterSpacing: 4, color: '#f9fafb', lineHeight: 1, margin: 0 }}>
              {t.name}
            </h1>
            {t.description && (
              <p style={{ color: '#6b7280', fontSize: 13, marginTop: 6, fontFamily: 'Rajdhani' }}>{t.description}</p>
            )}
            <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 12, color: '#4b5563', fontFamily: 'Rajdhani' }}>
              {t.venue && <span>📍 {t.venue}</span>}
              <span>📅 {t.startDate} → {t.endDate}</span>
              {t.prizePool && <span style={{ color: '#22c55e', fontWeight: 700 }}>💰 {t.prizePool}</span>}
            </div>
          </div>

          {/* Stats + Edit button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={() => { setActivePage('add-tournament'); }}
              style={{
                padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                background: `${lm.color}15`, border: `1px solid ${lm.color}33`,
                color: lm.color, fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700, letterSpacing: 1,
              }}
            >✏️ EDIT TOURNAMENT</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: `${lm.color}15`, border: `1px solid ${lm.color}33`, borderRadius: 8, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: lm.color }}>{tournamentTeams.length}</div>
                <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>TEAMS</div>
              </div>
              <div style={{ background: '#1f2937', borderRadius: 8, padding: '10px 18px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 28, fontWeight: 900, color: '#f9fafb' }}>{tournamentMatches.length}</div>
                <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>MATCHES</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1f2937', marginBottom: 20 }}>
        {(['overview', 'teams', 'matches', 'timeline'] as const).map(tabId => (
          <button key={tabId} onClick={() => setTab(tabId)} style={{
            background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === tabId ? lm.color : 'transparent'}`,
            color: tab === tabId ? lm.color : '#4b5563',
            padding: '10px 18px', cursor: 'pointer',
            fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, letterSpacing: 1,
            transition: 'all 0.2s', textTransform: 'uppercase',
          }}>{tabId}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {(['live', 'upcoming', 'completed'] as const).map(status => (
            <div key={status} style={{ background: '#111827', border: `1px solid ${STATUS_COLORS[status]}22`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: STATUS_COLORS[status], letterSpacing: 2 }}>
                  {status === 'live' && '● '}{status.toUpperCase()} MATCHES
                </div>
                <div style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, color: STATUS_COLORS[status] }}>
                  {matchesByStatus[status].length}
                </div>
              </div>
              {matchesByStatus[status].slice(0, 3).map(m => (
                <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid #1f2937', fontSize: 12 }}>
                  <div style={{ color: '#f9fafb', fontFamily: 'Rajdhani', fontWeight: 700 }}>
                    {m.teamA.shortName} vs {m.teamB.shortName}
                  </div>
                  <div style={{ color: '#4b5563', fontSize: 11 }}>{m.date} · {m.venue.split(',')[0]}</div>
                </div>
              ))}
              {matchesByStatus[status].length === 0 && (
                <div style={{ color: '#374151', fontSize: 12, fontFamily: 'Rajdhani' }}>No {status} matches</div>
              )}
            </div>
          ))}

          {/* Teams overview */}
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 12 }}>PARTICIPATING TEAMS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tournamentTeams.map(team => (
                <div key={team.id} style={{
                  background: `${team.color}15`, border: `1px solid ${team.color}33`,
                  borderRadius: 6, padding: '6px 12px',
                  fontFamily: 'Bebas Neue', fontSize: 15, letterSpacing: 1, color: team.color,
                }}>
                  {team.shortName}
                </div>
              ))}
              {tournamentTeams.length === 0 && (
                <div style={{ color: '#374151', fontSize: 12, fontFamily: 'Rajdhani' }}>No teams assigned</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEAMS */}
      {tab === 'teams' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {tournamentTeams.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#4b5563', fontFamily: 'Rajdhani', fontSize: 14 }}>
              No teams assigned to this tournament yet.
            </div>
          ) : tournamentTeams.map(team => (
            <div key={team.id} style={{
              background: '#111827', border: `1px solid ${team.color}33`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{ height: 3, background: team.color }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 2, color: '#f9fafb' }}>{team.name}</div>
                <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 10 }}>
                  {team.homeGround || team.country || '—'} · {team.players.length} players
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ background: '#0d1117', borderRadius: 6, padding: '6px 10px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: 18, color: team.color }}>
                      {tournamentMatches.filter(m => m.teamA.id === team.id || m.teamB.id === team.id).length}
                    </div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>MATCHES</div>
                  </div>
                  <div style={{ background: '#0d1117', borderRadius: 6, padding: '6px 10px', textAlign: 'center', flex: 1 }}>
                    <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: 18, color: '#22c55e' }}>
                      {tournamentMatches.filter(m =>
                        m.result?.toLowerCase().includes(team.name.toLowerCase()) ||
                        m.result?.toLowerCase().includes(team.shortName.toLowerCase())
                      ).length}
                    </div>
                    <div style={{ fontSize: 8, color: '#4b5563', fontFamily: 'Orbitron', letterSpacing: 1 }}>WINS</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MATCHES */}
      {tab === 'matches' && (
        <div>
          {/* Header with Add Match button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#4b5563', fontFamily: 'Rajdhani' }}>
                {tournamentMatches.length} match{tournamentMatches.length !== 1 ? 'es' : ''} in this tournament
              </div>
              {tournamentMatches.length > 0 && (
                <div style={{ fontSize: 11, color: '#374151', fontFamily: 'Rajdhani', marginTop: 2 }}>
                  {matchesByStatus.completed.length} completed · {matchesByStatus.live.length} live · {matchesByStatus.upcoming.length} upcoming
                </div>
              )}
            </div>
            <button
              onClick={handleAddMatch}
              style={{
                padding: '9px 20px', borderRadius: 7, cursor: 'pointer',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                border: 'none', color: '#000',
                fontFamily: 'Orbitron', fontWeight: 900, fontSize: 11, letterSpacing: 1,
                boxShadow: '0 0 16px #22c55e22',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              + ADD MATCH
            </button>
          </div>

          {tournamentMatches.length === 0 ? (
            /* Empty state with prominent CTA */
            <div style={{
              border: '2px dashed #1f2937', borderRadius: 12,
              padding: '60px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏏</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 3, color: '#374151', marginBottom: 8 }}>
                NO MATCHES SCHEDULED YET
              </div>
              <div style={{ fontFamily: 'Rajdhani', fontSize: 13, color: '#4b5563', marginBottom: 24 }}>
                Add matches to this tournament — they'll appear here and in All Matches
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => { setActivePage('add-tournament'); }}
                  style={{
                    padding: '10px 20px', borderRadius: 7, cursor: 'pointer',
                    background: `${lm.color}15`, border: `1px solid ${lm.color}33`,
                    color: lm.color, fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700,
                  }}
                >📅 EDIT SCHEDULE IN TOURNAMENT</button>
                <button
                  onClick={handleAddMatch}
                  style={{
                    padding: '10px 22px', borderRadius: 7, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                    border: 'none', color: '#000',
                    fontFamily: 'Orbitron', fontWeight: 900, fontSize: 11, letterSpacing: 1,
                  }}
                >+ ADD MATCH NOW</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tournamentMatches
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(m => {
                  const sc = STATUS_COLORS[m.status] || '#6b7280';
                  return (
                    <div key={m.id} style={{
                      background: '#111827', border: `1px solid ${sc}22`, borderRadius: 10,
                      overflow: 'hidden', transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${sc}55`}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = `${sc}22`}
                    >
                      <div style={{ height: 2, background: `linear-gradient(90deg, ${sc}, ${sc}22, transparent)` }} />
                      <div style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            {/* Match title */}
                            <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 2, color: '#f9fafb', lineHeight: 1, marginBottom: 4 }}>
                              {m.title || `${m.teamA.shortName} vs ${m.teamB.shortName}`}
                            </div>
                            {/* Teams + score */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <span style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: m.teamA.color || '#f9fafb' }}>
                                {m.teamA.shortName}
                              </span>
                              {m.scoreA && (
                                <span style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#22c55e' }}>{m.scoreA}</span>
                              )}
                              <span style={{ color: '#4b5563', fontSize: 11 }}>vs</span>
                              {m.scoreB && (
                                <span style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#22c55e' }}>{m.scoreB}</span>
                              )}
                              <span style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 900, color: m.teamB.color || '#f9fafb' }}>
                                {m.teamB.shortName}
                              </span>
                            </div>
                            {/* Meta */}
                            <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'Rajdhani' }}>
                              📅 {m.date || '—'}{m.time ? ` · ${m.time}` : ''}{m.venue ? ` · ${m.venue.split(',')[0]}` : ''}
                            </div>
                            {m.result && (
                              <div style={{ marginTop: 6, fontSize: 12, color: '#22c55e', fontFamily: 'Rajdhani', fontWeight: 700 }}>
                                🏆 {m.result}
                              </div>
                            )}
                          </div>

                          {/* Right: status + actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                            <span style={{
                              fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
                              background: `${sc}18`, color: sc,
                              border: `1px solid ${sc}33`, padding: '2px 8px', borderRadius: 3, letterSpacing: 1,
                            }}>
                              {m.status === 'live' && '● '}{m.status.toUpperCase()}
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => { setEditingMatch(m); setActivePage('add-match'); }}
                                style={{
                                  padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                                  background: '#22c55e15', border: '1px solid #22c55e33',
                                  color: '#22c55e', fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700,
                                }}
                              >✏️ EDIT</button>
                              <button
                                onClick={() => deleteMatch(m.id)}
                                style={{
                                  padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                                  background: '#ef444415', border: '1px solid #ef444430',
                                  color: '#ef4444', fontFamily: 'Orbitron', fontSize: 9, fontWeight: 700,
                                }}
                              >✕</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
              })}

              {/* Bottom add button */}
              <button
                onClick={handleAddMatch}
                style={{
                  padding: '12px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent',
                  border: `2px dashed ${lm.color}33`,
                  color: lm.color, fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700,
                  letterSpacing: 1, transition: 'all 0.2s', marginTop: 4,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = `${lm.color}08`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${lm.color}66`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${lm.color}33`;
                }}
              >
                + ADD ANOTHER MATCH TO THIS TOURNAMENT
              </button>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE */}
      {tab === 'timeline' && (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: 2, background: '#1f2937' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { date: t.startDate, label: 'Tournament Start', color: '#22c55e', icon: '🚀', desc: `${t.name} kicks off` },
              ...tournamentMatches
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(m => ({
                  date: m.date,
                  label: m.title || `${m.teamA.shortName} vs ${m.teamB.shortName}`,
                  color: STATUS_COLORS[m.status] || '#6b7280',
                  icon: m.status === 'live' ? '🔴' : m.status === 'completed' ? '✅' : '📅',
                  desc: m.venue ? m.venue.split(',')[0] : '—',
                })),
              { date: t.endDate, label: 'Tournament End', color: lm.color, icon: '🏆', desc: 'Final & prize ceremony' },
            ].map((event, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 24, paddingLeft: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: `${event.color}22`, border: `2px solid ${event.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, zIndex: 1, position: 'relative',
                }}>{event.icon}</div>
                <div style={{ flex: 1, paddingTop: 8 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: 17, letterSpacing: 1, color: '#f9fafb', lineHeight: 1 }}>
                    {event.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'Rajdhani', marginTop: 2 }}>
                    {event.date || '—'} · {event.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}