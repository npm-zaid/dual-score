'use client';
import React, { useState, useEffect } from 'react';
import { useApp, Tournament, Level, TournamentType, Format, Team, Match } from './AppContext';

const LEVELS: { value: Level; label: string; icon: string; color: string; desc: string }[] = [
  { value: 'international', label: 'International', icon: '🌍', color: '#f97316', desc: 'Global tournaments' },
  { value: 'national',      label: 'National',      icon: '🏴', color: '#8b5cf6', desc: 'Country-level' },
  { value: 'state',         label: 'State',         icon: '🗺️', color: '#06b6d4', desc: 'State competitions' },
  { value: 'city',          label: 'City',          icon: '🏙️', color: '#eab308', desc: 'Local city leagues' },
];
const TYPES: { value: TournamentType; label: string; icon: string; desc: string }[] = [
  { value: 'professional',      label: 'Professional',  icon: '🏆', desc: 'Sanctioned & competitive' },
  { value: 'semi-professional', label: 'Semi-Pro',      icon: '⚡', desc: 'Organized leagues' },
  { value: 'entertainment',     label: 'Entertainment', icon: '🎉', desc: 'Fun & celebrity games' },
];
const FORMATS: { value: Format; label: string; desc: string; icon: string }[] = [
  { value: 'T2',  label: 'T2',  desc: '2 Overs per side',  icon: '⚡' },
  { value: 'T11', label: 'T11', desc: '11 Overs per side', icon: '🏏' },
];

// ─── Draft match type (before tournament ID is known) ──────────────────────
interface DraftMatch {
  id: string;
  round: string;
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  venue: string;
}

function SelectCard({ selected, onClick, color, children }: {
  selected: boolean; onClick: () => void; color: string; children: React.ReactNode;
}) {
  return (
    <div onClick={onClick} style={{
      border: `2px solid ${selected ? color : '#1f2937'}`,
      background: selected ? `${color}0d` : '#0d1117',
      borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: selected ? `0 0 20px ${color}22` : 'none',
      transform: selected ? 'scale(1.01)' : 'scale(1)',
    }}>
      {children}
    </div>
  );
}

function TeamSelectionRow({ team, selected, onToggle }: {
  team: Team; selected: boolean; onToggle: () => void;
}) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderBottom: '1px solid #1f2937',
      cursor: 'pointer',
      background: selected ? '#22c55e08' : 'transparent',
      transition: 'background 0.15s',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: selected ? '#22c55e' : '#1f2937',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Bebas Neue', fontSize: 13,
        color: selected ? '#000' : '#4b5563',
        transition: 'all 0.2s',
      }}>
        {selected ? '✓' : team.shortName.slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: 1, color: selected ? '#22c55e' : '#f9fafb' }}>
          {team.name}
        </div>
        <div style={{ fontSize: 11, color: '#4b5563' }}>
          {team.homeGround || team.country || team.state || team.city || '—'}
          {' · '}{team.players.length} players
        </div>
      </div>
      <div style={{
        width: 12, height: 12, borderRadius: '50%', background: team.color, flexShrink: 0,
      }} />
    </div>
  );
}

// ─── Schedule match card (editable row) ────────────────────────────────────
function MatchScheduleCard({
  draft, index, tournamentTeams, accentColor, onChange, onDelete,
}: {
  draft: DraftMatch;
  index: number;
  tournamentTeams: Team[];
  accentColor: string;
  onChange: (updated: DraftMatch) => void;
  onDelete: () => void;
}) {
  const inputSt: React.CSSProperties = {
    padding: '8px 11px', borderRadius: 6, fontSize: 12,
    background: '#0a0f16', border: '1px solid #374151', color: '#f9fafb',
    outline: 'none', fontFamily: 'Rajdhani', boxSizing: 'border-box', width: '100%',
  };
  const selectSt: React.CSSProperties = { ...inputSt, cursor: 'pointer' };

  const teamA = tournamentTeams.find(t => t.id === draft.teamAId);
  const teamB = tournamentTeams.find(t => t.id === draft.teamBId);

  return (
    <div style={{
      background: '#0d1117',
      border: `1px solid ${accentColor}22`,
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Accent top bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}33, transparent)` }} />

      <div style={{ padding: '12px 14px' }}>
        {/* Match number + round title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Orbitron', fontSize: 11, fontWeight: 900, color: accentColor,
            flexShrink: 0,
          }}>
            {index + 1}
          </div>
          <input
            style={{ ...inputSt, flex: 1, fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}
            value={draft.round}
            onChange={e => onChange({ ...draft, round: e.target.value })}
            placeholder="Round / Match Title  e.g. Group Stage · Match 1"
          />
          <button onClick={onDelete} style={{
            padding: '6px 10px', borderRadius: 5, cursor: 'pointer',
            background: '#ef444411', border: '1px solid #ef444430',
            color: '#ef4444', fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700,
            flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Teams row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 4 }}>TEAM A</div>
            <select
              style={selectSt}
              value={draft.teamAId}
              onChange={e => onChange({ ...draft, teamAId: e.target.value })}
            >
              <option value="">— Pick Team —</option>
              {tournamentTeams.filter(t => t.id !== draft.teamBId).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {teamA && (
              <div style={{ marginTop: 4, fontSize: 10, color: teamA.color, fontFamily: 'Orbitron', fontWeight: 700 }}>
                {teamA.shortName}
              </div>
            )}
          </div>

          <div style={{
            fontFamily: 'Bebas Neue', fontSize: 18, color: accentColor,
            letterSpacing: 2, padding: '0 4px', marginTop: 14,
          }}>VS</div>

          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 4 }}>TEAM B</div>
            <select
              style={selectSt}
              value={draft.teamBId}
              onChange={e => onChange({ ...draft, teamBId: e.target.value })}
            >
              <option value="">— Pick Team —</option>
              {tournamentTeams.filter(t => t.id !== draft.teamAId).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {teamB && (
              <div style={{ marginTop: 4, fontSize: 10, color: teamB.color, fontFamily: 'Orbitron', fontWeight: 700, textAlign: 'right' }}>
                {teamB.shortName}
              </div>
            )}
          </div>
        </div>

        {/* Date / Time / Venue */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 4 }}>DATE</div>
            <input
              type="date"
              style={inputSt}
              value={draft.date}
              onChange={e => onChange({ ...draft, date: e.target.value })}
            />
          </div>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 4 }}>TIME</div>
            <input
              type="time"
              style={inputSt}
              value={draft.time}
              onChange={e => onChange({ ...draft, time: e.target.value })}
            />
          </div>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1, marginBottom: 4 }}>VENUE</div>
            <input
              style={inputSt}
              value={draft.venue}
              onChange={e => onChange({ ...draft, venue: e.target.value })}
              placeholder="e.g. Wankhede Stadium, Mumbai"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper: generate a blank draft match ──────────────────────────────────
function newDraft(index: number, defaultVenue = ''): DraftMatch {
  return {
    id: `draft_${Date.now()}_${index}`,
    round: '',
    teamAId: '',
    teamBId: '',
    date: '',
    time: '',
    venue: defaultVenue,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AddTournament() {
  const {
    teams, addTournament, updateTournament,
    editingTournament, setEditingTournament, setActivePage,
    addMatch, getMatchesByTournament, updateMatch,
  } = useApp();

  const isEditing = !!editingTournament;

  // ── Tournament fields ──────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [level, setLevel] = useState<Level | ''>('');
  const [type, setType] = useState<TournamentType | ''>('');
  const [format, setFormat] = useState<Format | ''>('');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [description, setDescription] = useState('');
  const [prizePool, setPrizePool] = useState('');

  // ── Step / UI state ────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');

  // ── Schedule (Step 5) ──────────────────────────────────────────────────────
  const [draftMatches, setDraftMatches] = useState<DraftMatch[]>([]);

  // ── Load editing data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (editingTournament) {
      setName(editingTournament.name);
      setShortName(editingTournament.shortName);
      setLevel(editingTournament.level);
      setType(editingTournament.type);
      setFormat(editingTournament.format);
      setSelectedTeams(editingTournament.teams);
      setStartDate(editingTournament.startDate);
      setEndDate(editingTournament.endDate);
      setVenue(editingTournament.venue || '');
      setStatus(editingTournament.status);
      setDescription(editingTournament.description || '');
      setPrizePool(editingTournament.prizePool || '');

      // Load existing matches as draft matches for editing
      const existing = getMatchesByTournament(editingTournament.id);
      if (existing.length > 0) {
        setDraftMatches(existing.map(m => ({
          id: m.id,           // reuse existing ID so updateMatch works
          round: m.title,
          teamAId: m.teamA.id,
          teamBId: m.teamB.id,
          date: m.date,
          time: m.time,
          venue: m.venue,
        })));
      }
    }
  }, [editingTournament]);

  // ── Auto short name ────────────────────────────────────────────────────────
  useEffect(() => {
    if (name && !shortName) {
      const words = name.trim().split(/\s+/);
      const auto = words.length >= 2
        ? words.map(w => w[0]).join('').toUpperCase().slice(0, 5)
        : name.slice(0, 4).toUpperCase();
      setShortName(auto);
    }
  }, [name]);

  // ── Teams for this level ───────────────────────────────────────────────────
  const levelTeams = level ? teams.filter(t => t.category === level) : [];
  const filteredTeams = teamSearch
    ? levelTeams.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    : levelTeams;

  // Teams that are selected AND exist
  const tournamentTeams = teams.filter(t => selectedTeams.includes(t.id));

  const toggleTeam = (id: string) => {
    setSelectedTeams(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // ── Step validation ────────────────────────────────────────────────────────
  const canStep1 = level && type && format;
  const canStep2 = name && shortName;
  const canStep3 = selectedTeams.length >= 2;
  // Step 4 (timeline) — always can proceed (dates optional)
  // Step 5 (schedule) — always optional, can save with 0 matches

  // ── Schedule helpers ───────────────────────────────────────────────────────
  const addDraftMatch = () => {
    setDraftMatches(prev => [...prev, newDraft(prev.length, venue)]);
  };

  const updateDraft = (id: string, updated: DraftMatch) => {
    setDraftMatches(prev => prev.map(d => d.id === id ? updated : d));
  };

  const deleteDraft = (id: string) => {
    setDraftMatches(prev => prev.filter(d => d.id !== id));
  };

  // ── Quick auto-generate round-robin schedule ───────────────────────────────
  const autoGenerateRoundRobin = () => {
    if (tournamentTeams.length < 2) return;
    const newDrafts: DraftMatch[] = [];
    let matchIndex = 0;
    const base = Date.now();
    for (let i = 0; i < tournamentTeams.length; i++) {
      for (let j = i + 1; j < tournamentTeams.length; j++) {
        newDrafts.push({
          id: `draft_${base + matchIndex * 1000}_${matchIndex}`, // guaranteed unique
          round: `Group Stage · Match ${matchIndex + 1}`,
          teamAId: tournamentTeams[i].id,
          teamBId: tournamentTeams[j].id,
          date: startDate || '',
          time: '14:00',
          venue: venue || '',
        });
        matchIndex++;
      }
    }
    setDraftMatches(newDrafts);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const tournamentId = editingTournament?.id || `tour${Date.now()}`;

    const tournament: Tournament = {
      id: tournamentId,
      name: name.trim(),
      shortName: shortName.trim().toUpperCase(),
      level: level as Level,
      type: type as TournamentType,
      format: format as Format,
      teams: selectedTeams,
      startDate, endDate,
      venue: venue || undefined,
      status,
      description: description || undefined,
      prizePool: prizePool || undefined,
      createdAt: editingTournament?.createdAt || new Date().toISOString(),
    };

    if (isEditing) {
      updateTournament(tournament);
    } else {
      addTournament(tournament);
    }

    // IDs of matches already persisted in context for this tournament
    // (only real IDs - not draft_ prefixed ones)
    const loadedMatchIds = new Set(
      isEditing ? getMatchesByTournament(tournamentId).map(m => m.id) : []
    );

    draftMatches.forEach(draft => {
      const tA = teams.find(t => t.id === draft.teamAId);
      const tB = teams.find(t => t.id === draft.teamBId);
      if (!tA || !tB) return; // skip incomplete

      // New drafts get a stable persistent ID; loaded ones keep their original ID
      const matchId = draft.id.startsWith('draft_')
        ? `m_${draft.id.replace('draft_', '')}`
        : draft.id;

      const matchPayload: Match = {
        id: matchId,
        title: draft.round.trim() || `${tA.shortName} vs ${tB.shortName}`,
        tournamentId,
        level: level as Level,
        type: type as TournamentType,
        format: format as Format,
        status: 'upcoming',
        venue: draft.venue || venue || '',
        date: draft.date,
        time: draft.time,
        teamA: { ...tA, players: [] },
        teamB: { ...tB, players: [] },
        createdAt: new Date().toISOString(),
      };

      if (loadedMatchIds.has(draft.id)) {
        // Was a real loaded match → update preserving original ID
        updateMatch({ ...matchPayload, id: draft.id });
      } else {
        addMatch(matchPayload);
      }
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      // Go to tournament detail so user can add/manage more matches
      setEditingTournament(tournament);
      setActivePage('tournament-detail');
    }, 1000);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const levelMeta = level ? LEVELS.find(l => l.value === level) : null;
  const accentColor = levelMeta?.color || '#22c55e';

  const inputSt: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 7, fontSize: 14,
    background: '#0d1117', border: '1px solid #374151', color: '#f9fafb',
    width: '100%', outline: 'none', fontFamily: 'Rajdhani', boxSizing: 'border-box',
  };

  const STEPS = ['1. Config', '2. Details', '3. Teams', '4. Timeline', '5. Schedule'];
  const TOTAL_STEPS = 5;

  // ── Valid schedule matches (both teams filled) ─────────────────────────────
  const validDrafts = draftMatches.filter(d => d.teamAId && d.teamBId);

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ padding: 24, maxWidth: 880 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => { setEditingTournament(null); setActivePage('tournaments'); }} style={{
          background: 'none', border: 'none', color: '#4b5563', fontSize: 12,
          cursor: 'pointer', fontFamily: 'Orbitron', padding: 0,
        }}>← BACK</button>
        <div>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: 4, color: '#f9fafb', lineHeight: 1, margin: 0 }}>
            {isEditing ? 'EDIT TOURNAMENT' : 'CREATE TOURNAMENT'}
          </h1>
          <div style={{ color: '#4b5563', fontSize: 12, marginTop: 2, fontFamily: 'Rajdhani' }}>
            {isEditing ? `Editing: ${editingTournament?.name}` : 'Set up a new tournament in 5 steps'}
          </div>
        </div>
      </div>

      {/* Step progress bar */}
      <div style={{ marginBottom: 6, display: 'flex', gap: 4 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i + 1 <= step ? accentColor : '#1f2937',
            transition: 'background 0.3s',
            boxShadow: i + 1 <= step ? `0 0 8px ${accentColor}66` : 'none',
          }} />
        ))}
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <button key={i} onClick={() => setStep(i + 1)} style={{
            flex: 1, background: 'none', border: 'none',
            borderBottom: `2px solid ${step === i + 1 ? accentColor : '#1f2937'}`,
            color: step === i + 1 ? accentColor : '#4b5563',
            padding: '8px 4px', cursor: 'pointer',
            fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
            transition: 'all 0.2s', textAlign: 'center',
          }}>{s}</button>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: '#111827', border: `1px solid ${accentColor}22`,
        borderRadius: 14, padding: 28, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }} />

        {/* ════ STEP 1: Level / Type / Format ════════════════════════════════ */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 12 }}>SELECT LEVEL</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {LEVELS.map(l => (
                  <SelectCard key={l.value} selected={level === l.value} onClick={() => setLevel(l.value)} color={l.color}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 26 }}>{l.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: 18, letterSpacing: 1, color: level === l.value ? l.color : '#f9fafb' }}>{l.label}</div>
                        <div style={{ fontSize: 11, color: '#4b5563' }}>{l.desc}</div>
                      </div>
                      {level === l.value && <span style={{ color: l.color, fontSize: 18 }}>✓</span>}
                    </div>
                  </SelectCard>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 12 }}>TOURNAMENT TYPE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TYPES.map(t => (
                  <SelectCard key={t.value} selected={type === t.value} onClick={() => setType(t.value)} color={accentColor}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: 17, letterSpacing: 1, color: type === t.value ? accentColor : '#f9fafb' }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: '#4b5563' }}>{t.desc}</div>
                      </div>
                      {type === t.value && <span style={{ color: accentColor, fontSize: 16 }}>✓</span>}
                    </div>
                  </SelectCard>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 12 }}>MATCH FORMAT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {FORMATS.map(f => (
                  <SelectCard key={f.value} selected={format === f.value} onClick={() => setFormat(f.value)} color={accentColor}>
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ fontSize: 28, marginBottom: 4 }}>{f.icon}</div>
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, letterSpacing: 2, color: format === f.value ? accentColor : '#f9fafb' }}>{f.label}</div>
                      <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{f.desc}</div>
                    </div>
                  </SelectCard>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 2: Details ════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>TOURNAMENT NAME *</label>
              <input style={inputSt} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ICC T2 World Cup 2025" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>SHORT NAME (max 5)</label>
                <input
                  style={{ ...inputSt, fontFamily: 'Orbitron', fontWeight: 700, fontSize: 16 }}
                  value={shortName}
                  onChange={e => setShortName(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="T2WC" maxLength={5}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>STATUS</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['upcoming', 'ongoing', 'completed'] as const).map(s => {
                    const c = { upcoming: '#3b82f6', ongoing: '#22c55e', completed: '#6b7280' }[s];
                    return (
                      <button key={s} onClick={() => setStatus(s)} style={{
                        flex: 1, padding: '10px 6px', borderRadius: 6, cursor: 'pointer',
                        border: `2px solid ${status === s ? c : '#1f2937'}`,
                        background: status === s ? `${c}18` : '#0d1117',
                        color: status === s ? c : '#6b7280',
                        fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 12,
                        transition: 'all 0.2s', textTransform: 'uppercase',
                      }}>{s === 'ongoing' && '● '}{s}</button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>VENUE / LOCATION</label>
              <input style={inputSt} value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Multiple Venues, India" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>PRIZE POOL (optional)</label>
              <input style={inputSt} value={prizePool} onChange={e => setPrizePool(e.target.value)} placeholder="e.g. $1.5M" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>DESCRIPTION</label>
              <textarea style={{ ...inputSt, height: 80, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the tournament..." />
            </div>
          </div>
        )}

        {/* ════ STEP 3: Teams ═════════════════════════════════════════════════ */}
        {step === 3 && (
          <div>
            {!level ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#4b5563', fontFamily: 'Rajdhani', fontSize: 14 }}>
                Please select a level in Step 1 first
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2 }}>
                      {LEVELS.find(l => l.value === level)?.icon} {level.toUpperCase()} TEAMS — SELECT PARTICIPANTS
                    </div>
                    <div style={{ fontSize: 12, color: accentColor, fontFamily: 'Rajdhani', marginTop: 2 }}>
                      {selectedTeams.length} teams selected {selectedTeams.length < 2 && '(minimum 2)'}
                    </div>
                  </div>
                  <div style={{
                    background: `${accentColor}15`, border: `1px solid ${accentColor}33`,
                    borderRadius: 6, padding: '6px 14px',
                    fontFamily: 'Orbitron', fontSize: 16, fontWeight: 900, color: accentColor,
                  }}>{selectedTeams.length}</div>
                </div>

                <input
                  style={{ ...inputSt, marginBottom: 10 }}
                  placeholder="🔍 Search teams..."
                  value={teamSearch}
                  onChange={e => setTeamSearch(e.target.value)}
                />

                {levelTeams.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#4b5563', fontFamily: 'Rajdhani', fontSize: 13 }}>
                    No {level} teams found.
                    <button onClick={() => setActivePage('add-team')} style={{
                      display: 'block', margin: '10px auto 0',
                      background: `${accentColor}15`, border: `1px solid ${accentColor}33`,
                      color: accentColor, padding: '8px 16px', borderRadius: 6,
                      cursor: 'pointer', fontFamily: 'Orbitron', fontSize: 10,
                    }}>+ ADD {level.toUpperCase()} TEAM</button>
                  </div>
                ) : (
                  <div style={{ maxHeight: 340, overflowY: 'auto', background: '#0d1117', border: '1px solid #1f2937', borderRadius: 8 }}>
                    {filteredTeams.map(team => (
                      <TeamSelectionRow
                        key={team.id} team={team}
                        selected={selectedTeams.includes(team.id)}
                        onToggle={() => toggleTeam(team.id)}
                      />
                    ))}
                  </div>
                )}

                {selectedTeams.length > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedTeams.map(tid => {
                      const team = teams.find(t => t.id === tid);
                      if (!team) return null;
                      return (
                        <span key={tid} style={{
                          background: `${team.color}15`, border: `1px solid ${team.color}33`,
                          color: team.color, padding: '4px 10px', borderRadius: 20,
                          fontSize: 11, fontFamily: 'Orbitron', fontWeight: 700,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          {team.shortName}
                          <span onClick={() => toggleTeam(tid)} style={{ cursor: 'pointer', opacity: 0.6 }}>✕</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ════ STEP 4: Timeline ══════════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>START DATE</label>
                <input type="date" style={inputSt} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1.5, marginBottom: 6 }}>END DATE</label>
                <input type="date" style={inputSt} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            {startDate && endDate && (
              <div style={{ background: '#0d1117', border: `1px solid ${accentColor}22`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: accentColor, letterSpacing: 2, marginBottom: 14 }}>TOURNAMENT TIMELINE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <div style={{ background: `${accentColor}22`, border: `1px solid ${accentColor}44`, borderRadius: '8px 0 0 8px', padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', marginBottom: 2 }}>START</div>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color: accentColor }}>{startDate}</div>
                  </div>
                  <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)` }} />
                  <div style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}33`, borderRadius: '0 8px 8px 0', padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', marginBottom: 2 }}>END</div>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color: accentColor }}>{endDate}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{ background: '#0d1117', border: `1px solid ${accentColor}22`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: accentColor, letterSpacing: 2, marginBottom: 14 }}>TOURNAMENT SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                {[
                  ['Name', name || '—'], ['Short', shortName || '—'],
                  ['Level', level || '—'], ['Type', type || '—'],
                  ['Format', format || '—'], ['Teams', `${selectedTeams.length} selected`],
                  ['Venue', venue || '—'], ['Prize', prizePool || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ color: '#4b5563', fontFamily: 'Orbitron', fontSize: 9, minWidth: 60 }}>{k}:</span>
                    <span style={{ color: '#f9fafb', fontWeight: 600, textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 5: Schedule ══════════════════════════════════════════════ */}
        {step === 5 && (
          <div>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 2, marginBottom: 4 }}>
                  📅 MATCH SCHEDULE
                </div>
                <div style={{ fontSize: 12, color: accentColor, fontFamily: 'Rajdhani' }}>
                  {validDrafts.length} match{validDrafts.length !== 1 ? 'es' : ''} scheduled · all synced to All Matches
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'Rajdhani', marginTop: 2 }}>
                  Optional — you can also add matches later from the Matches page
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {tournamentTeams.length >= 2 && (
                  <button
                    onClick={autoGenerateRoundRobin}
                    style={{
                      padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                      background: `${accentColor}15`, border: `1px solid ${accentColor}33`,
                      color: accentColor, fontFamily: 'Orbitron', fontSize: 9,
                      fontWeight: 700, letterSpacing: 0.5, whiteSpace: 'nowrap',
                    }}
                  >
                    ⚡ AUTO ROUND-ROBIN
                  </button>
                )}
                <button
                  onClick={addDraftMatch}
                  style={{
                    padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                    border: 'none', color: '#000',
                    fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900, letterSpacing: 0.5,
                  }}
                >
                  + ADD MATCH
                </button>
              </div>
            </div>

            {/* Warning if no teams */}
            {tournamentTeams.length < 2 && (
              <div style={{
                background: '#f9731611', border: '1px solid #f9731633',
                borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                fontSize: 12, color: '#f97316', fontFamily: 'Rajdhani',
              }}>
                ⚠️ Select at least 2 teams in Step 3 to schedule matches
              </div>
            )}

            {/* Match cards */}
            {draftMatches.length === 0 ? (
              <div style={{
                border: `2px dashed ${accentColor}22`, borderRadius: 12,
                padding: '48px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 3, color: '#374151', marginBottom: 8 }}>
                  NO MATCHES SCHEDULED YET
                </div>
                <div style={{ fontFamily: 'Rajdhani', fontSize: 13, color: '#4b5563', marginBottom: 20 }}>
                  Add matches manually or auto-generate a round-robin schedule
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  {tournamentTeams.length >= 2 && (
                    <button
                      onClick={autoGenerateRoundRobin}
                      style={{
                        padding: '10px 20px', borderRadius: 7, cursor: 'pointer',
                        background: `${accentColor}15`, border: `1px solid ${accentColor}44`,
                        color: accentColor, fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700,
                      }}
                    >⚡ AUTO ROUND-ROBIN ({tournamentTeams.length * (tournamentTeams.length - 1) / 2} matches)</button>
                  )}
                  <button
                    onClick={addDraftMatch}
                    style={{
                      padding: '10px 20px', borderRadius: 7, cursor: 'pointer',
                      background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                      border: 'none', color: '#000',
                      fontFamily: 'Orbitron', fontSize: 10, fontWeight: 900,
                    }}
                  >+ ADD FIRST MATCH</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
                {draftMatches.map((draft, idx) => (
                  <MatchScheduleCard
                    key={draft.id}
                    draft={draft}
                    index={idx}
                    tournamentTeams={tournamentTeams}
                    accentColor={accentColor}
                    onChange={updated => updateDraft(draft.id, updated)}
                    onDelete={() => deleteDraft(draft.id)}
                  />
                ))}
              </div>
            )}

            {/* Schedule summary strip */}
            {draftMatches.length > 0 && (
              <div style={{
                marginTop: 14,
                background: '#0d1117', border: `1px solid ${accentColor}22`,
                borderRadius: 8, padding: '10px 16px',
                display: 'flex', gap: 20, alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: accentColor }}>{draftMatches.length}</div>
                  <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1 }}>TOTAL</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#22c55e' }}>{validDrafts.length}</div>
                  <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1 }}>VALID</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: '#ef4444' }}>{draftMatches.length - validDrafts.length}</div>
                  <div style={{ fontSize: 9, fontFamily: 'Orbitron', color: '#4b5563', letterSpacing: 1 }}>INCOMPLETE</div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 11, color: '#4b5563', fontFamily: 'Rajdhani' }}>
                  Incomplete matches (missing teams) will be skipped on save
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{
              padding: '10px 24px', borderRadius: 7,
              background: 'transparent', border: '1px solid #374151',
              color: '#6b7280', cursor: step === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'Orbitron', fontSize: 12, letterSpacing: 1,
              opacity: step === 1 ? 0.4 : 1, transition: 'all 0.2s',
            }}
          >← BACK</button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !canStep1) ||
                (step === 2 && !canStep2) ||
                (step === 3 && !canStep3)
              }
              style={{
                padding: '10px 28px', borderRadius: 7,
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                border: 'none', color: '#000', cursor: 'pointer',
                fontFamily: 'Orbitron', fontWeight: 900, fontSize: 13, letterSpacing: 1,
                opacity: (
                  (step === 1 && !canStep1) ||
                  (step === 2 && !canStep2) ||
                  (step === 3 && !canStep3)
                ) ? 0.4 : 1,
                transition: 'all 0.2s',
              }}
            >NEXT →</button>
          ) : (
            /* Final step — Save button */
            <button
              onClick={handleSave}
              style={{
                padding: '10px 32px', borderRadius: 7,
                background: saved ? '#22c55e' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                border: 'none', color: '#000', cursor: 'pointer',
                fontFamily: 'Orbitron', fontWeight: 900, fontSize: 14, letterSpacing: 1,
                boxShadow: '0 0 20px #22c55e33',
              }}
            >
              {saved
                ? '✓ SAVED!'
                : isEditing
                  ? `💾 UPDATE · ${validDrafts.length} MATCHES`
                  : `🏆 CREATE · ${validDrafts.length} MATCHES`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}