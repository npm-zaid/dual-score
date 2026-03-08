'use client';
import React from 'react';
import { AppProvider, useApp } from './AppContext';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import AddMatch from './AddMatch';
import AllMatches from './AllMatches';
import Teams from './Teams';
import Players from './Players';
import { Latest, Schedule, Stats, Tournaments } from './OtherPages';
import AddTeam from './AddTeam';
import AddPlayer from './AddPlayer';

function Settings() {
  return (
    <div style={{ padding: 24 }}>
      <h1 className="font-display" style={{ fontSize: 28, letterSpacing: 3, color: '#f9fafb', marginBottom: 24 }}>SETTINGS</h1>
      <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: 24, maxWidth: 500 }}>
        <div style={{ fontSize: 14, color: '#4b5563', textAlign: 'center', padding: '30px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚙️</div>
          Settings panel coming soon. Configuration options will be available here.
        </div>
      </div>
    </div>
  );
}

function PageContent() {
  const { activePage, sidebarOpen } = useApp();

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    'add-match': <AddMatch />,
    matches: <AllMatches />,
    teams: <Teams />,
    'add-team': <AddTeam />,
    players: <Players />,
    'add-player': <AddPlayer />,
    tournaments: <Tournaments />,
    latest: <Latest />,
    stats: <Stats />,
    schedule: <Schedule />,
    settings: <Settings />,
  };

  return (
    <div style={{
      marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '0',
      transition: 'margin-left 0.35s cubic-bezier(0.4,0,0.2,1)',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <Header />
      <main style={{ overflowX: 'hidden' }}>
        {pages[activePage] || <Dashboard />}
      </main>
    </div>
  );
}

export default function CricketAdmin() {
  return (
    <AppProvider>
      <div className="noise pitch-bg" style={{ minHeight: '100vh', position: 'relative' }}>
        <Sidebar />
        <PageContent />
      </div>
    </AppProvider>
  );
}