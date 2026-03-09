'use client';
import React, { useEffect, useRef } from 'react';
import { useApp } from './AppContext';

const navItems = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard',  icon: '⚡',  label: 'Dashboard',   badge: null },
      { id: 'add-match',  icon: '➕',  label: 'Add Match',    badge: null },
      { id: 'matches',    icon: '🏏',  label: 'All Matches',  badge: 'live' },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      { id: 'teams',      icon: '🛡️',  label: 'Teams',        badge: null },
      { id: 'add-team',   icon: '➕',  label: 'Add Team',     badge: null },
      { id: 'players',    icon: '👤',  label: 'Players',      badge: null },
      { id: 'add-player', icon: '➕',  label: 'Add Player',   badge: null },
      { id: 'tournaments',icon: '🏆',  label: 'Tournaments',  badge: null },
    ],
  },
  // {
  //   section: 'SCORING',
  //   items: [
  //     { id: 'bcl-scoring', icon: '🎯', label: 'BCL Scorer',   badge: 'new' },
  //   ],
  // },
  {
    section: 'INSIGHTS',
    items: [
      { id: 'latest',   icon: '📡', label: 'Latest / Live', badge: null },
      { id: 'stats',    icon: '📊', label: 'Statistics',    badge: null },
      { id: 'schedule', icon: '📅', label: 'Schedule',      badge: null },
    ],
  },
  {
    section: 'SETTINGS',
    items: [
      { id: 'settings', icon: '⚙️', label: 'Settings', badge: null },
    ],
  },
];

export default function Sidebar() {
  const { sidebarOpen, activePage, setActivePage, matches, setSidebarOpen } = useApp();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const liveCount = matches.filter(m => m.status === 'live').length;

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    el.style.transform = sidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    el.style.opacity = sidebarOpen ? '1' : '0';
  }, [sidebarOpen]);

  return (
    <>
      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed', inset: 0,
            background: '#00000088', zIndex: 40,
          }}
          className="mobile-overlay"
        />
      )}

      <aside
        ref={sidebarRef}
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          background: '#0a0f16',
          borderRight: '1px solid #1f2937',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #1f2937',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 0 15px #22c55e44',
            }}>🏏</div>
            <div>
              <div className="font-display" style={{ fontSize: 20, letterSpacing: 2, color: '#f9fafb', lineHeight: 1 }}>
                ZILLA
              </div>
              <div style={{ fontSize: 9, color: '#22c55e', letterSpacing: 3, fontFamily: 'Orbitron', fontWeight: 700 }}>
                CRICKET ADMIN
              </div>
            </div>
          </div>
        </div>

        {/* Live ticker */}
        {liveCount > 0 && (
          <div style={{
            background: '#ef444411',
            borderBottom: '1px solid #ef444422',
            padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11,
          }}>
            <span className="live-dot" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#ef4444', display: 'inline-block',
            }} />
            <span style={{ color: '#ef4444', fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700 }}>
              {liveCount} LIVE
            </span>
            <span style={{ color: '#9ca3af', fontSize: 11 }}>match{liveCount > 1 ? 'es' : ''} in progress</span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {navItems.map((group) => (
            <div key={group.section} style={{ marginBottom: 8 }}>
              <div style={{
                padding: '6px 20px 4px',
                fontSize: 10, fontFamily: 'Orbitron', fontWeight: 700,
                color: '#374151', letterSpacing: 2,
              }}>
                {group.section}
              </div>

              {group.items.map((item) => {
                const isActive = activePage === item.id;
                const isLiveBadge = item.badge === 'live' && liveCount > 0;
                const isNewBadge  = item.badge === 'new';

                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center',
                      gap: 10, padding: '9px 20px',
                      background: isActive
                        ? 'linear-gradient(90deg, #22c55e15, transparent)'
                        : 'transparent',
                      border: 'none',
                      borderLeft: `2px solid ${isActive ? '#22c55e' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      color: isActive ? '#22c55e' : '#9ca3af',
                      fontSize: 14,
                      fontFamily: 'Rajdhani',
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color = '#f9fafb';
                        (e.currentTarget as HTMLButtonElement).style.background = '#ffffff05';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>

                    {/* LIVE count badge */}
                    {isLiveBadge && (
                      <span style={{
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 9,
                        fontFamily: 'Orbitron',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 2,
                        minWidth: 20,
                        textAlign: 'center',
                      }}>
                        {liveCount}
                      </span>
                    )}

                    {/* NEW badge for BCL Scorer */}
                    {isNewBadge && (
                      <span style={{
                        background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                        color: '#000',
                        fontSize: 8,
                        fontFamily: 'Orbitron',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: 2,
                        letterSpacing: 1,
                      }}>
                        NEW
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #1f2937',
          fontSize: 11,
          color: '#374151',
        }}>
          <div style={{ fontFamily: 'Orbitron', marginBottom: 2, fontSize: 10 }}>
            ZILLA v1.0.0
          </div>
          <div>Cricket Tournament Manager</div>
        </div>
      </aside>
    </>
  );
}