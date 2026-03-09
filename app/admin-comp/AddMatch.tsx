'use client';
import React, { useState, useEffect } from 'react';
import { useApp, Match, Team, Player, Level, TournamentType, Format } from './AppContext';

const LEVELS: { value: Level; label: string; icon: string; color: string }[] = [
  { value: 'international', label: 'International', icon: '🌍', color: '#f97316' },
  { value: 'national', label: 'National', icon: '🏴', color: '#8b5cf6' },
  { value: 'state', label: 'State', icon: '🗺️', color: '#06b6d4' },
  { value: 'city', label: 'City', icon: '🏙️', color: '#eab308' },
];

const TYPES: { value: TournamentType; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professional', desc: 'Sanctioned & competitive' },
  { value: 'semi-pro', label: 'Semi-Pro', desc: 'Organized leagues' },
  { value: 'normal', label: 'Normal', desc: 'Friendly matches' },
];

const FORMATS: Format[] = ['T20', 'ODI', 'T10', 'Test'];

const STATUSES = ['upcoming', 'live', 'completed'];

interface FormState {
  title: string;
  level: Level | '';
  type: TournamentType | '';
  format: Format | '';
  status: string;
  venue: string;
  date: string;
  time: string;
  tournament: string;
  teamAId: string;
  teamBId: string;
  scoreA: string;
  scoreB: string;
  result: string;
  umpires: string;
  notes: string;
}

const defaultForm: FormState = {
  title: '', level: '', type: '', format: 'T20',
  status: 'upcoming', venue: '', date: '', time: '',
  tournament: '', teamAId: '', teamBId: '',
  scoreA: '', scoreB: '', result: '',
  umpires: '', notes: '',
};

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 4, flex: 1, borderRadius: 2,
          background: i < step ? '#22c55e' : i === step - 1 ? '#22c55e' : '#1f2937',
          transition: 'background 0.3s',
          boxShadow: i < step ? '0 0 8px #22c55e66' : 'none',
        }} />
      ))}
    </div>
  );
}

function SelectionCard({
  selected, onClick, children, color = '#22c55e',
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; color?: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${selected ? color : '#1f2937'}`,
        background: selected ? `${color}0d` : '#0d1117',
        borderRadius: 8,
        padding: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: selected ? `0 0 16px ${color}22` : 'none',
      }}
    >
      {children}
    </div>
  );
}

export default function AddMatch() {
  const { teams, players, addMatch, updateMatch, editingMatch, setEditingMatch, setActivePage } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [selectedPlayersA, setSelectedPlayersA] = useState<string[]>([]);
  const [selectedPlayersB, setSelectedPlayersB] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [activeTeamSelect, setActiveTeamSelect] = useState<'A' | 'B'>('A');
  const [saved, setSaved] = useState(false);

  const isEditing = !!editingMatch;

  // Load existing match for editing
  useEffect(() => {
    if (editingMatch) {
      setForm({
        title: editingMatch.title,
        level: editingMatch.level,
        type: editingMatch.type,
        format: editingMatch.format,
        status: editingMatch.status,
        venue: editingMatch.venue,
        date: editingMatch.date,
        time: editingMatch.time,
        tournament: editingMatch.tournament || '',
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

  const teamA = teams.find(t => t.id === form.teamAId);
  const teamB = teams.find(t => t.id === form.teamBId);

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    p.role.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const togglePlayer = (pid: string, side: 'A' | 'B') => {
    if (side === 'A') {
      setSelectedPlayersA(prev =>
        prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
      );
    } else {
      setSelectedPlayersB(prev =>
        prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
      );
    }
  };

  const canProceed = () => {
    if (step === 1) return form.level && form.type && form.format;
    if (step === 2) return form.title && form.venue && form.date && form.time;
    if (step === 3) return form.teamAId && form.teamBId && form.teamAId !== form.teamBId;
    return true;
  };

  const handleSave = () => {
    const selectedA = players.filter(p => selectedPlayersA.includes(p.id));
    const selectedB = players.filter(p => selectedPlayersB.includes(p.id));

    const matchData: Match = {
      id: editingMatch?.id || `m${Date.now()}`,
      title: form.title || `${teamA?.shortName || 'TBA'} vs ${teamB?.shortName || 'TBA'}`,
      level: form.level as Level,
      type: form.type as TournamentType,
      format: form.format as Format,
      status: form.status as any,
      venue: form.venue,
      date: form.date,
      time: form.time,
      tournament: form.tournament || undefined,
      teamA: { ...(teamA || teams[0]), players: selectedA },
      teamB: { ...(teamB || teams[1]), players: selectedB },
      scoreA: form.scoreA || undefined,
      scoreB: form.scoreB || undefined,
      result: form.result || undefined,
      umpires: form.umpires ? form.umpires.split(',').map(u => u.trim()) : undefined,
      notes: form.notes || undefined,
      createdAt: editingMatch?.createdAt || new Date().toISOString(),
    };

    if (isEditing) {
      updateMatch(matchData);
    } else {
      addMatch(matchData);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setEditingMatch(null);
      setActivePage('matches');
    }, 1500);
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 6, fontSize: 15,
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb' }}>
            {isEditing ? 'EDIT MATCH' : 'CREATE MATCH'}
          </h1>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 2 }}>
            {isEditing ? `Editing: ${editingMatch?.title}` : 'Fill in all steps to add a new match'}
          </div>
        </div>
        {isEditing && (
          <button
            onClick={() => { setEditingMatch(null); setForm(defaultForm); }}
            className="btn-secondary"
            style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 6, fontSize: 13 }}
          >
            ✕ CANCEL EDIT
          </button>
        )}
      </div>


      <div style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: 12,
        padding: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
        }} />

        <StepIndicator step={step} total={4} />

        {/* Step labels */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
          {['1. Level & Type', '2. Details', '3. Teams', '4. Score & Info'].map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              style={{
                flex: 1,
                background: 'none', border: 'none',
                borderBottom: `2px solid ${step === i + 1 ? '#22c55e' : '#1f2937'}`,
                color: step === i + 1 ? '#22c55e' : '#4b5563',
                padding: '8px 4px',
                cursor: 'pointer',
                fontSize: 12, fontFamily: 'Orbitron', fontWeight: 700,
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* STEP 1: Level & Type */}
        {step === 1 && (
          <div className="animate-fade">
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 10, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                SELECT LEVEL
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {LEVELS.map(l => (
                  <SelectionCard
                    key={l.value}
                    selected={form.level === l.value}
                    onClick={() => update('level', l.value)}
                    color={l.color}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{l.icon}</span>
                      <div>
                        <div style={{
                          fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1,
                          color: form.level === l.value ? l.color : '#f9fafb',
                        }}>{l.label}</div>
                      </div>
                      {form.level === l.value && (
                        <span style={{ marginLeft: 'auto', color: l.color, fontSize: 16 }}>✓</span>
                      )}
                    </div>
                  </SelectionCard>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 10, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                TOURNAMENT TYPE
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TYPES.map(t => (
                  <SelectionCard
                    key={t.value}
                    selected={form.type === t.value}
                    onClick={() => update('type', t.value)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{
                          fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1,
                          color: form.type === t.value ? '#22c55e' : '#f9fafb',
                        }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: '#4b5563' }}>{t.desc}</div>
                      </div>
                      {form.type === t.value && <span style={{ color: '#22c55e', fontSize: 18 }}>✓</span>}
                    </div>
                  </SelectionCard>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 10, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                MATCH FORMAT
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FORMATS.map(f => (
                  <button
                    key={f}
                    onClick={() => update('format', f)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 6,
                      border: `2px solid ${form.format === f ? '#22c55e' : '#1f2937'}`,
                      background: form.format === f ? '#22c55e11' : '#0d1117',
                      color: form.format === f ? '#22c55e' : '#9ca3af',
                      fontFamily: 'Orbitron', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Match Details */}
        {step === 2 && (
          <div className="animate-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  MATCH TITLE
                </label>
                <input
                  className="input-field"
                  style={inputStyle}
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  placeholder="e.g. Zilla Cup Final – MSX vs RCC"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  TOURNAMENT NAME
                </label>
                <input
                  className="input-field"
                  style={inputStyle}
                  value={form.tournament}
                  onChange={e => update('tournament', e.target.value)}
                  placeholder="e.g. Zilla Premier League 2025"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  VENUE
                </label>
                <input
                  className="input-field"
                  style={inputStyle}
                  value={form.venue}
                  onChange={e => update('venue', e.target.value)}
                  placeholder="e.g. Wankhede Stadium, Mumbai"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                    DATE
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    style={inputStyle}
                    value={form.date}
                    onChange={e => update('date', e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                    TIME
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    style={inputStyle}
                    value={form.time}
                    onChange={e => update('time', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  STATUS
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {STATUSES.map(s => {
                    const colors: Record<string, string> = { upcoming: '#3b82f6', live: '#ef4444', completed: '#22c55e' };
                    return (
                      <button
                        key={s}
                        onClick={() => update('status', s)}
                        style={{
                          flex: 1, padding: '10px',
                          border: `2px solid ${form.status === s ? colors[s] : '#1f2937'}`,
                          background: form.status === s ? `${colors[s]}11` : '#0d1117',
                          color: form.status === s ? colors[s] : '#9ca3af',
                          borderRadius: 6, cursor: 'pointer',
                          fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 14,
                          transition: 'all 0.2s', textTransform: 'uppercase',
                        }}
                      >
                        {s === 'live' && '● '}{s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  UMPIRES (comma separated)
                </label>
                <input
                  className="input-field"
                  style={inputStyle}
                  value={form.umpires}
                  onChange={e => update('umpires', e.target.value)}
                  placeholder="e.g. Anil Kumar, Ravi Sharma"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  NOTES
                </label>
                <textarea
                  className="input-field"
                  style={{ ...inputStyle, height: 80, resize: 'vertical' }}
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Teams & Players */}
        {step === 3 && (
          <div className="animate-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Team A */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  TEAM A
                </label>
                <select
                  className="select-field"
                  style={inputStyle}
                  value={form.teamAId}
                  onChange={e => update('teamAId', e.target.value)}
                >
                  <option value="">-- Select Team A --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {teamA && (
                  <div style={{
                    marginTop: 8, padding: '10px 12px',
                    background: '#0d1117', border: `1px solid ${teamA.color}44`,
                    borderRadius: 6,
                  }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: teamA.color }}>
                      {teamA.shortName}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{teamA.homeGround}</div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
                      {selectedPlayersA.length} players selected
                    </div>
                  </div>
                )}
              </div>

              {/* Team B */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  TEAM B
                </label>
                <select
                  className="select-field"
                  style={inputStyle}
                  value={form.teamBId}
                  onChange={e => update('teamBId', e.target.value)}
                >
                  <option value="">-- Select Team B --</option>
                  {teams.filter(t => t.id !== form.teamAId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {teamB && (
                  <div style={{
                    marginTop: 8, padding: '10px 12px',
                    background: '#0d1117', border: `1px solid ${teamB.color}44`,
                    borderRadius: 6,
                  }}>
                    <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, color: teamB.color }}>
                      {teamB.shortName}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{teamB.homeGround}</div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
                      {selectedPlayersB.length} players selected
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Player selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  SELECT PLAYERS FOR FINAL XI
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['A', 'B'] as const).map(side => (
                    <button
                      key={side}
                      onClick={() => setActiveTeamSelect(side)}
                      style={{
                        padding: '4px 14px',
                        border: `1px solid ${activeTeamSelect === side ? '#22c55e' : '#1f2937'}`,
                        background: activeTeamSelect === side ? '#22c55e11' : 'transparent',
                        color: activeTeamSelect === side ? '#22c55e' : '#9ca3af',
                        borderRadius: 4, cursor: 'pointer',
                        fontFamily: 'Orbitron', fontSize: 11,
                      }}
                    >
                      TEAM {side}
                    </button>
                  ))}
                </div>
              </div>

              <input
                className="input-field"
                style={{ ...inputStyle, marginBottom: 10 }}
                placeholder="🔍 Search players..."
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
              />

              <div style={{
                maxHeight: 280, overflowY: 'auto',
                background: '#0d1117',
                border: '1px solid #1f2937',
                borderRadius: 8,
              }}>
                {filteredPlayers.map(p => {
                  const selectedA = selectedPlayersA.includes(p.id);
                  const selectedB = selectedPlayersB.includes(p.id);
                  const isSelected = activeTeamSelect === 'A' ? selectedA : selectedB;
                  const roleColors: Record<string, string> = {
                    'Batsman': '#3b82f6',
                    'Bowler': '#ef4444',
                    'All-rounder': '#22c55e',
                    'Wicket-keeper': '#eab308',
                  };

                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePlayer(p.id, activeTeamSelect)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        borderBottom: '1px solid #1f2937',
                        cursor: 'pointer',
                        background: isSelected ? '#22c55e08' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{
                        width: 28, height: 28,
                        background: isSelected ? '#22c55e' : '#1f2937',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: isSelected ? '#000' : '#4b5563',
                        fontWeight: 700, transition: 'all 0.2s',
                        flexShrink: 0,
                      }}>
                        {isSelected ? '✓' : p.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: isSelected ? '#22c55e' : '#f9fafb', fontSize: 14 }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#4b5563' }}>{p.battingStyle} · {p.bowlingStyle}</div>
                      </div>
                      <span style={{
                        fontSize: 10, fontFamily: 'Orbitron',
                        color: roleColors[p.role] || '#9ca3af',
                        background: `${roleColors[p.role] || '#9ca3af'}18`,
                        border: `1px solid ${roleColors[p.role] || '#9ca3af'}33`,
                        padding: '2px 6px', borderRadius: 2,
                      }}>
                        {p.role.toUpperCase()}
                      </span>
                      {selectedA && activeTeamSelect === 'B' && (
                        <span style={{ fontSize: 9, color: '#3b82f6', fontFamily: 'Orbitron' }}>IN A</span>
                      )}
                      {selectedB && activeTeamSelect === 'A' && (
                        <span style={{ fontSize: 9, color: '#ef4444', fontFamily: 'Orbitron' }}>IN B</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Score & Extra Info */}
        {step === 4 && (
          <div className="animate-fade">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  {teamA?.shortName || 'TEAM A'} SCORE
                </label>
                <input
                  className="input-field"
                  style={inputStyle}
                  value={form.scoreA}
                  onChange={e => update('scoreA', e.target.value)}
                  placeholder="e.g. 164/5 (18.2)"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                  {teamB?.shortName || 'TEAM B'} SCORE
                </label>
                <input
                  className="input-field"
                  style={inputStyle}
                  value={form.scoreB}
                  onChange={e => update('scoreB', e.target.value)}
                  placeholder="e.g. 120/8 (16)"
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#9ca3af', fontSize: 12, fontFamily: 'Orbitron', letterSpacing: 1 }}>
                MATCH RESULT
              </label>
              <input
                className="input-field"
                style={inputStyle}
                value={form.result}
                onChange={e => update('result', e.target.value)}
                placeholder="e.g. Mumbai Strikers XI won by 44 runs"
              />
            </div>

            {/* Summary preview */}
            <div style={{
              background: '#0d1117',
              border: '1px solid #22c55e22',
              borderRadius: 8,
              padding: 18,
              marginTop: 20,
            }}>
              <div style={{ fontFamily: 'Orbitron', fontSize: 11, color: '#22c55e', marginBottom: 12, letterSpacing: 2 }}>
                MATCH SUMMARY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                {[
                  ['Title', form.title || '—'],
                  ['Level', form.level || '—'],
                  ['Type', form.type || '—'],
                  ['Format', form.format],
                  ['Status', form.status],
                  ['Venue', form.venue || '—'],
                  ['Date', form.date || '—'],
                  ['Time', form.time || '—'],
                  ['Team A', teamA?.name || '—'],
                  ['Team B', teamB?.name || '—'],
                  ['Players A', `${selectedPlayersA.length} selected`],
                  ['Players B', `${selectedPlayersB.length} selected`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#4b5563', fontFamily: 'Orbitron', fontSize: 10, minWidth: 70 }}>{k}:</span>
                    <span style={{ color: '#f9fafb', fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
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
            className="btn-secondary"
            style={{
              padding: '10px 24px', borderRadius: 6,
              fontSize: 14, opacity: step === 1 ? 0.4 : 1,
            }}
          >
            ← BACK
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="btn-primary"
              style={{
                padding: '10px 28px', borderRadius: 6, fontSize: 15,
                opacity: canProceed() ? 1 : 0.5,
              }}
            >
              NEXT →
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="btn-primary"
              style={{
                padding: '10px 32px', borderRadius: 6, fontSize: 15,
                background: saved ? '#22c55e' : undefined,
              }}
            >
              {saved ? '✓ SAVED!' : isEditing ? '💾 UPDATE MATCH' : '🚀 CREATE MATCH'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
