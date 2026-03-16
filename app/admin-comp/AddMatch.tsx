'use client';
import React, { useState, useEffect } from 'react';
import { useApp, Match, Team, Player, Level, TournamentType, Format } from './AppContext';

const STATUSES = ['upcoming', 'live', 'completed'];

interface FormState {
  title: string;
  tournamentId: string;
  status: string;
  venue: string;
  date: string;
  time: string;
  teamAId: string;
  teamBId: string;
  scoreA: string;
  scoreB: string;
  result: string;
  umpires: string;
  notes: string;
}

const defaultForm: FormState = {
  title: '', tournamentId: '', status: 'upcoming',
  venue: '', date: '', time: '',
  teamAId: '', teamBId: '',
  scoreA: '', scoreB: '', result: '',
  umpires: '', notes: '',
};

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 2,
          background: i < step ? '#22c55e' : '#1f2937',
          transition: 'background 0.3s',
          boxShadow: i < step ? '0 0 8px #22c55e66' : 'none',
        }} />
      ))}
    </div>
  );
}

export default function AddMatch() {
  const { teams, players, tournaments, addMatch, updateMatch, editingMatch, setEditingMatch, setActivePage, getTournamentById, getTeamsByLevel } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [selectedPlayersA, setSelectedPlayersA] = useState<string[]>([]);
  const [selectedPlayersB, setSelectedPlayersB] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [activeTeamSelect, setActiveTeamSelect] = useState<'A' | 'B'>('A');
  const [saved, setSaved] = useState(false);

  const isEditing = !!editingMatch;

  useEffect(() => {
    if (editingMatch) {
      setForm({
        title: editingMatch.title,
        tournamentId: editingMatch.tournamentId || '',
        status: editingMatch.status,
        venue: editingMatch.venue,
        date: editingMatch.date,
        time: editingMatch.time,
        teamAId: editingMatch.teamA.id,
        teamBId: editingMatch.teamB.id,
        scoreA: editingMatch.scoreA || '',
        scoreB: editingMatch.scoreB || '',
        result: editingMatch.result || '',
        umpires: (editingMatch.umpires || []).join(', '),
        notes: editingMatch.notes || '',
      });
      setSelectedPlayersA(editingMatch.teamA.players.map(p => p.id));
      setSelectedPlayersB(editingMatch.teamB.players.map(p => p.id));
      setStep(1);
    } else {
      setForm(defaultForm);
      setSelectedPlayersA([]);
      setSelectedPlayersB([]);
      setStep(1);
    }
  }, [editingMatch]);

  const update = (field: keyof FormState, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  // Get tournament for context
  const selectedTournament = form.tournamentId ? getTournamentById(form.tournamentId) : null;

  // Teams filtered by tournament (if selected) or all teams
  const availableTeams = selectedTournament
    ? teams.filter(t => selectedTournament.teams.includes(t.id))
    : teams;

  const teamA = teams.find(t => t.id === form.teamAId);
  const teamB = teams.find(t => t.id === form.teamBId);

  // Players filtered from selected teams (or all players)
  const teamAPlayers = teamA ? players.filter(p => teamA.players.some(tp => tp.id === p.id)) : players;
  const teamBPlayers = teamB ? players.filter(p => teamB.players.some(tp => tp.id === p.id)) : players;

  const currentTeamPlayers = activeTeamSelect === 'A' ? teamAPlayers : teamBPlayers;

  const filteredPlayers = currentTeamPlayers.filter(p =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    p.role.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const togglePlayer = (pid: string, side: 'A' | 'B') => {
    const setter = side === 'A' ? setSelectedPlayersA : setSelectedPlayersB;
    setter(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]);
  };

  // 11-player limit
  const maxReached = (side: 'A' | 'B') => {
    const selected = side === 'A' ? selectedPlayersA : selectedPlayersB;
    return selected.length >= 11;
  };

  const canProceed = () => {
    if (step === 1) return form.venue && form.date && form.time;
    if (step === 2) return form.teamAId && form.teamBId && form.teamAId !== form.teamBId;
    return true;
  };

  const handleSave = () => {
    const selectedA = players.filter(p => selectedPlayersA.includes(p.id));
    const selectedB = players.filter(p => selectedPlayersB.includes(p.id));

    const tournament = selectedTournament;

    const matchData: Match = {
      id: editingMatch?.id || `m${Date.now()}`,
      title: form.title || `${teamA?.shortName || 'TBA'} vs ${teamB?.shortName || 'TBA'}`,
      tournamentId: form.tournamentId || undefined,
      level: tournament?.level || (teamA?.category as Level) || 'city',
      type: tournament?.type || 'professional',
      format: tournament?.format || 'T2',
      status: form.status as any,
      venue: form.venue,
      date: form.date,
      time: form.time,
      teamA: { ...(teamA || teams[0]), players: selectedA },
      teamB: { ...(teamB || teams[1]), players: selectedB },
      scoreA: form.scoreA || undefined,
      scoreB: form.scoreB || undefined,
      result: form.result || undefined,
      umpires: form.umpires ? form.umpires.split(',').map(u => u.trim()) : undefined,
      notes: form.notes || undefined,
      createdAt: editingMatch?.createdAt || new Date().toISOString(),
    };

    if (isEditing) updateMatch(matchData);
    else addMatch(matchData);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setEditingMatch(null);
      setActivePage('matches');
    }, 1500);
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 6, fontSize: 14,
    background: '#0d1117', border: '1px solid #374151',
    color: '#f9fafb', width: '100%', outline: 'none',
    fontFamily: 'Rajdhani', boxSizing: 'border-box',
  };

  const lblSt: React.CSSProperties = {
    display: 'block', marginBottom: 6, color: '#9ca3af',
    fontSize: 10, fontFamily: 'Orbitron', letterSpacing: 1.5,
  };

  const STEP_LABELS = ['1. Details', '2. Teams', '3. Score & Info'];

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 28, letterSpacing: 3, color: '#f9fafb', margin: 0 }}>
            {isEditing ? 'EDIT MATCH' : 'CREATE MATCH'}
          </h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2, fontFamily: 'Rajdhani' }}>
            {isEditing ? `Editing: ${editingMatch?.title}` : 'Fill in all steps to add a new match'}
          </div>
        </div>
        {isEditing && (
          <button
            onClick={() => { setEditingMatch(null); setForm(defaultForm); }}
            style={{
              marginLeft: 'auto', padding: '8px 16px', borderRadius: 6, fontSize: 12,
              background: 'transparent', border: '1px solid #374151',
              color: '#6b7280', cursor: 'pointer', fontFamily: 'Orbitron', letterSpacing: 1,
            }}
          >✕ CANCEL</button>
        )}
      </div>

      <div style={{
        background: '#111827', border: '1px solid #1f2937',
        borderRadius: 12, padding: 28, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #22c55e, transparent)' }} />

        <StepBar step={step} total={3} />

        {/* Step tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
          {STEP_LABELS.map((s, i) => (
            <button key={i} onClick={() => setStep(i + 1)} style={{
              flex: 1, background: 'none', border: 'none',
              borderBottom: `2px solid ${step === i + 1 ? '#22c55e' : '#1f2937'}`,
              color: step === i + 1 ? '#22c55e' : '#4b5563',
              padding: '8px 4px', cursor: 'pointer',
              fontSize: 11, fontFamily: 'Orbitron', fontWeight: 700,
              transition: 'all 0.2s', textAlign: 'center',
            }}>{s}</button>
          ))}
        </div>

        {/* STEP 1: Details */}
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

            {/* Tournament selector */}
            <div>
              <label style={lblSt}>TOURNAMENT (optional)</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.tournamentId}
                onChange={e => {
                  update('tournamentId', e.target.value);
                  // Reset teams when tournament changes
                  update('teamAId', '');
                  update('teamBId', '');
                }}
              >
                <option value="">— No Tournament / Standalone Match —</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.format} · {t.level})
                  </option>
                ))}
              </select>
              {selectedTournament && (
                <div style={{
                  marginTop: 8, padding: '8px 12px',
                  background: '#22c55e0a', border: '1px solid #22c55e22',
                  borderRadius: 6, fontSize: 11, color: '#22c55e', fontFamily: 'Rajdhani',
                }}>
                  🏆 {selectedTournament.name} · {selectedTournament.format} · {selectedTournament.teams.length} teams · {selectedTournament.level}
                </div>
              )}
            </div>

            <div>
              <label style={lblSt}>MATCH TITLE</label>
              <input
                style={inputStyle}
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder={teamA && teamB ? `${teamA.shortName} vs ${teamB.shortName}` : 'e.g. IND vs PAK – Final'}
              />
            </div>

            <div>
              <label style={lblSt}>VENUE</label>
              <input
                style={inputStyle}
                value={form.venue}
                onChange={e => update('venue', e.target.value)}
                placeholder="e.g. Wankhede Stadium, Mumbai"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lblSt}>DATE</label>
                <input type="date" style={inputStyle} value={form.date} onChange={e => update('date', e.target.value)} />
              </div>
              <div>
                <label style={lblSt}>TIME</label>
                <input type="time" style={inputStyle} value={form.time} onChange={e => update('time', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={lblSt}>STATUS</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {STATUSES.map(s => {
                  const c: Record<string, string> = { upcoming: '#3b82f6', live: '#ef4444', completed: '#22c55e' };
                  return (
                    <button
                      key={s}
                      onClick={() => update('status', s)}
                      style={{
                        flex: 1, padding: '10px',
                        border: `2px solid ${form.status === s ? c[s] : '#1f2937'}`,
                        background: form.status === s ? `${c[s]}11` : '#0d1117',
                        color: form.status === s ? c[s] : '#9ca3af',
                        borderRadius: 6, cursor: 'pointer',
                        fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 13,
                        transition: 'all 0.2s', textTransform: 'uppercase',
                      }}
                    >{s === 'live' && '● '}{s}</button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={lblSt}>UMPIRES (comma separated)</label>
              <input style={inputStyle} value={form.umpires} onChange={e => update('umpires', e.target.value)} placeholder="e.g. Kumar, Sharma" />
            </div>

            <div>
              <label style={lblSt}>NOTES</label>
              <textarea
                style={{ ...inputStyle, height: 70, resize: 'vertical' }}
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        )}

        {/* STEP 2: Teams & Players */}
        {step === 2 && (
          <div>
            {/* Info banner */}
            {selectedTournament && (
              <div style={{
                background: '#22c55e0a', border: '1px solid #22c55e22', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#22c55e', fontFamily: 'Rajdhani',
              }}>
                🏆 Showing teams from <strong>{selectedTournament.name}</strong> ({availableTeams.length} teams available)
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Team A */}
              <div>
                <label style={lblSt}>TEAM A</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.teamAId}
                  onChange={e => { update('teamAId', e.target.value); setSelectedPlayersA([]); }}
                >
                  <option value="">— Select Team A —</option>
                  {availableTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {teamA && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: '#0d1117', border: `1px solid ${teamA.color}44`, borderRadius: 6 }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: teamA.color }}>{teamA.shortName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{teamA.homeGround || teamA.country || '—'}</div>
                    <div style={{ fontSize: 11, color: selectedPlayersA.length === 11 ? '#22c55e' : '#4b5563', marginTop: 4 }}>
                      {selectedPlayersA.length}/11 players selected
                    </div>
                  </div>
                )}
              </div>

              {/* Team B */}
              <div>
                <label style={lblSt}>TEAM B</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.teamBId}
                  onChange={e => { update('teamBId', e.target.value); setSelectedPlayersB([]); }}
                >
                  <option value="">— Select Team B —</option>
                  {availableTeams.filter(t => t.id !== form.teamAId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {teamB && (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: '#0d1117', border: `1px solid ${teamB.color}44`, borderRadius: 6 }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: teamB.color }}>{teamB.shortName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{teamB.homeGround || teamB.country || '—'}</div>
                    <div style={{ fontSize: 11, color: selectedPlayersB.length === 11 ? '#22c55e' : '#4b5563', marginTop: 4 }}>
                      {selectedPlayersB.length}/11 players selected
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Player selector */}
            {(teamA || teamB) && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <label style={{ ...lblSt, display: 'inline' }}>SELECT PLAYING XI</label>
                    <span style={{ fontSize: 10, color: '#4b5563', marginLeft: 8, fontFamily: 'Rajdhani' }}>
                      (max 11 per team)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['A', 'B'] as const).map(side => {
                      const count = side === 'A' ? selectedPlayersA.length : selectedPlayersB.length;
                      const teamColor = (side === 'A' ? teamA : teamB)?.color || '#22c55e';
                      return (
                        <button
                          key={side}
                          onClick={() => setActiveTeamSelect(side)}
                          style={{
                            padding: '4px 14px', borderRadius: 4, cursor: 'pointer',
                            border: `1px solid ${activeTeamSelect === side ? teamColor : '#1f2937'}`,
                            background: activeTeamSelect === side ? `${teamColor}11` : 'transparent',
                            color: activeTeamSelect === side ? teamColor : '#9ca3af',
                            fontFamily: 'Orbitron', fontSize: 10, transition: 'all 0.15s',
                          }}
                        >
                          TEAM {side} · {count}/11
                        </button>
                      );
                    })}
                  </div>
                </div>

                <input
                  style={{ ...inputStyle, marginBottom: 10 }}
                  placeholder="🔍 Search players..."
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                />

                {/* 11-player warning */}
                {maxReached(activeTeamSelect) && (
                  <div style={{
                    background: '#22c55e0a', border: '1px solid #22c55e33', borderRadius: 6,
                    padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#22c55e', fontFamily: 'Rajdhani',
                  }}>
                    ✓ Playing XI locked for Team {activeTeamSelect}. Deselect a player to swap.
                  </div>
                )}

                <div style={{ maxHeight: 300, overflowY: 'auto', background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8 }}>
                  {filteredPlayers.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#4b5563', fontSize: 12, fontFamily: 'Rajdhani' }}>
                      {(activeTeamSelect === 'A' ? teamA : teamB) ? 'No players in this team' : 'Select a team first'}
                    </div>
                  ) : filteredPlayers.map(p => {
                    const selectedA = selectedPlayersA.includes(p.id);
                    const selectedB = selectedPlayersB.includes(p.id);
                    const isSelected = activeTeamSelect === 'A' ? selectedA : selectedB;
                    const isDisabled = !isSelected && maxReached(activeTeamSelect);
                    const roleColors: Record<string, string> = {
                      Batsman: '#3b82f6', Bowler: '#ef4444', 'All-rounder': '#22c55e', 'Wicket-keeper': '#eab308',
                    };
                    const rc = roleColors[p.role];

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isDisabled && togglePlayer(p.id, activeTeamSelect)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderBottom: '1px solid #1f2937',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          background: isSelected ? '#22c55e08' : 'transparent',
                          opacity: isDisabled ? 0.4 : 1,
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, background: isSelected ? '#22c55e' : '#1f2937',
                          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, color: isSelected ? '#000' : '#4b5563',
                          fontWeight: 700, transition: 'all 0.2s', flexShrink: 0,
                        }}>
                          {isSelected ? '✓' : p.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: isSelected ? '#22c55e' : '#f9fafb', fontSize: 14, fontFamily: 'Rajdhani' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#4b5563' }}>{p.battingStyle} · {p.bowlingStyle}</div>
                        </div>
                        <span style={{
                          fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
                          color: rc, background: `${rc}18`, border: `1px solid ${rc}33`,
                          padding: '2px 6px', borderRadius: 2,
                        }}>{p.role.toUpperCase().slice(0, 4)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Score & Info */}
        {step === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={lblSt}>{teamA?.shortName || 'TEAM A'} SCORE</label>
                <input style={inputStyle} value={form.scoreA} onChange={e => update('scoreA', e.target.value)} placeholder="e.g. 48/2 (2)" />
              </div>
              <div>
                <label style={lblSt}>{teamB?.shortName || 'TEAM B'} SCORE</label>
                <input style={inputStyle} value={form.scoreB} onChange={e => update('scoreB', e.target.value)} placeholder="e.g. 31/4 (2)" />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lblSt}>MATCH RESULT</label>
              <input style={inputStyle} value={form.result} onChange={e => update('result', e.target.value)} placeholder="e.g. India won by 17 runs" />
            </div>

            {/* Summary */}
            <div style={{ background: '#0d1117', border: '1px solid #22c55e22', borderRadius: 8, padding: 18 }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#22c55e', marginBottom: 12, letterSpacing: 2 }}>
                MATCH SUMMARY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                {[
                  ['Title', form.title || (teamA && teamB ? `${teamA.shortName} vs ${teamB.shortName}` : '—')],
                  ['Tournament', selectedTournament?.name || 'Standalone'],
                  ['Format', selectedTournament?.format || '—'],
                  ['Level', selectedTournament?.level || teamA?.category || '—'],
                  ['Status', form.status],
                  ['Venue', form.venue || '—'],
                  ['Date', form.date || '—'],
                  ['Time', form.time || '—'],
                  ['Team A', teamA?.name || '—'],
                  ['Team B', teamB?.name || '—'],
                  ['XI-A', `${selectedPlayersA.length}/11 players`],
                  ['XI-B', `${selectedPlayersB.length}/11 players`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#4b5563', fontFamily: 'Orbitron', fontSize: 9, minWidth: 72 }}>{k}:</span>
                    <span style={{ color: '#f9fafb', fontWeight: 600, textTransform: 'capitalize', fontSize: 12 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{
              padding: '10px 24px', borderRadius: 6, fontSize: 13, cursor: step === 1 ? 'not-allowed' : 'pointer',
              background: 'transparent', border: '1px solid #374151', color: '#6b7280',
              fontFamily: 'Orbitron', letterSpacing: 1, opacity: step === 1 ? 0.4 : 1,
            }}
          >← BACK</button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{
                padding: '10px 28px', borderRadius: 6, fontSize: 14, cursor: 'pointer',
                background: canProceed() ? 'linear-gradient(135deg, #16a34a, #22c55e)' : '#1f2937',
                border: 'none', color: canProceed() ? '#000' : '#374151',
                fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1,
                opacity: canProceed() ? 1 : 0.5, transition: 'all 0.2s',
              }}
            >NEXT →</button>
          ) : (
            <button
              onClick={handleSave}
              style={{
                padding: '10px 32px', borderRadius: 6, fontSize: 14, cursor: 'pointer',
                background: saved ? '#22c55e' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                border: 'none', color: '#000',
                fontFamily: 'Orbitron', fontWeight: 900, letterSpacing: 1,
                boxShadow: '0 0 20px #22c55e33',
              }}
            >{saved ? '✓ SAVED!' : isEditing ? '💾 UPDATE MATCH' : '🚀 CREATE MATCH'}</button>
          )}
        </div>
      </div>
    </div>
  );
}