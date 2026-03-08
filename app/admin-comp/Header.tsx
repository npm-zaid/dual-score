'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';

const PAGE_TITLES: Record<string, { label: string; icon: string }> = {
  dashboard: { label: 'Dashboard', icon: '⚡' },
  'add-match': { label: 'Add Match', icon: '➕' },
  matches: { label: 'All Matches', icon: '🏏' },
  teams: { label: 'Teams', icon: '🛡️' },
  players: { label: 'Players', icon: '👤' },
  tournaments: { label: 'Tournaments', icon: '🏆' },
  latest: { label: 'Latest / Live', icon: '📡' },
  stats: { label: 'Statistics', icon: '📊' },
  schedule: { label: 'Schedule', icon: '📅' },
  settings: { label: 'Settings', icon: '⚙️' },
};

export default function Header() {
  const { sidebarOpen, setSidebarOpen, activePage, matches, setActivePage } = useApp();
  const [time, setTime] = useState(new Date());
  const liveMatches = matches.filter(m => m.status === 'live');
  const page = PAGE_TITLES[activePage] || { label: activePage, icon: '📌' };
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header style={{
      height: 'var(--header-height)',
      background: '#0a0f16ee',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1f2937',
      display: 'flex', alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      {/* Hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          background: 'transparent',
          border: '1px solid #1f2937',
          color: '#9ca3af',
          width: 36, height: 36,
          borderRadius: 6,
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 4,
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#22c55e';
          (e.currentTarget as HTMLButtonElement).style.color = '#22c55e';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#1f2937';
          (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
        }}
      >
        <span style={{ width: 16, height: 1.5, background: 'currentColor', display: 'block', transition: 'all 0.2s' }} />
        <span style={{ width: 16, height: 1.5, background: 'currentColor', display: 'block' }} />
        <span style={{ width: 12, height: 1.5, background: 'currentColor', display: 'block', transition: 'all 0.2s' }} />
      </button>

      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{page.icon}</span>
        <span className="font-display" style={{ fontSize: 22, letterSpacing: 2, color: '#f9fafb' }}>
          {page.label.toUpperCase()}
        </span>
      </div>

      {/* Live scores ticker */}
      {liveMatches.length > 0 && (
        <div style={{
          flex: 1,
          overflow: 'hidden',
          background: '#ef444408',
          border: '1px solid #ef444422',
          borderRadius: 4,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0,
            background: '#ef4444',
            color: '#fff',
            fontSize: 9, fontFamily: 'Orbitron', fontWeight: 700,
            padding: '0 8px', height: '100%',
            display: 'flex', alignItems: 'center',
            zIndex: 1,
          }}>
            ● LIVE
          </div>
          <div style={{ overflow: 'hidden', flex: 1, marginLeft: 48 }}>
            <div className="ticker-content" style={{
              whiteSpace: 'nowrap',
              fontSize: 12, fontFamily: 'Orbitron',
              color: '#f9fafb',
              display: 'inline-block',
            }}>
              {liveMatches.map(m => (
                <span key={m.id} style={{ marginRight: 60 }}>
                  {m.teamA.shortName} {m.scoreA || '—'} vs {m.teamB.shortName} {m.scoreB || '—'} · {m.venue}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!liveMatches.length && <div style={{ flex: 1 }} />}

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {/* Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Orbitron', fontSize: 13, fontWeight: 700, color: '#22c55e' }}>
            {formatTime(time)}
          </div>
          <div style={{ fontSize: 10, color: '#4b5563' }}>
            {formatDate(time)}
          </div>
        </div>

        {/* Quick add */}
        <button
          onClick={() => setActivePage('add-match')}
          className="btn-primary"
          style={{ padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}
        >
          + ADD MATCH
        </button>

        {/* Avatar */}
        <div style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, #16a34a, #22c55e)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#000',
          cursor: 'pointer',
          fontFamily: 'Bebas Neue',
          letterSpacing: 1,
        }}>
          A
        </div>
      </div>
    </header>
  );
}
