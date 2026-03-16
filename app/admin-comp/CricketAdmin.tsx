'use client';
// ── Main App Router ─────────────────────────────────────────────────────────
// Drop this in your page.tsx or layout as the root component.
// Wire up all components with the AppProvider context.
//
// Route map:
//   dashboard         → Dashboard
//   tournaments       → Tournaments
//   add-tournament    → AddTournament
//   tournament-detail → TournamentDetail
//   matches           → AllMatches
//   add-match         → AddMatch
//   teams             → Teams
//   add-team          → AddTeam
//   players           → Players
//   add-player        → AddPlayer (exported from Players.tsx)
//   bcl-scoring       → BCLScoring

import React from 'react';
import { AppProvider, useApp } from './AppContext';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Tournaments from './Tournaments';
import AddTournament from './Addtournament';
import TournamentDetail from './Tournamentdetail';
import AllMatches from './AllMatches';
import AddMatch from './AddMatch';
import Teams from './Teams';
import AddTeam from './AddTeam';
import Players, { AddPlayer } from './Players';
import BCLScoring from './Bclscoring';

function AppContent() {
  const { activePage, sidebarOpen, setSidebarOpen, scoringMatch, updateMatch, setActivePage } = useApp();

  const SIDEBAR_WIDTH = 280;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':        return <Dashboard />;
      case 'tournaments':      return <Tournaments />;
      case 'add-tournament':   return <AddTournament />;
      case 'tournament-detail':return <TournamentDetail />;
      case 'matches':          return <AllMatches />;
      case 'add-match':        return <AddMatch />;
      case 'teams':            return <Teams />;
      case 'add-team':         return <AddTeam />;
      case 'players':          return <Players />;
      case 'add-player':       return <AddPlayer />;
      case 'bcl-scoring':
        return (
          <BCLScoring
            scoringMatch={scoringMatch}
            updateMatch={updateMatch}
            setActivePage={setActivePage}
          />
        );
      default:
        return (
          <div style={{ padding: 40, textAlign: 'center', color: '#374151' }}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>🚧</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: 3, color: '#f9fafb' }}>
              {activePage.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Rajdhani', fontSize: 14, marginTop: 8 }}>
              This page is coming soon.
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060c14', color: '#f9fafb' }}>
      <Sidebar />
      {/* Main content */}
      <main style={{
        marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0,
        flex: 1,
        minHeight: '100vh',
        transition: 'margin-left 0.35s cubic-bezier(.4,0,.2,1)',
        overflowX: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: '#0a0f16cc',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1f2937',
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: '1px solid #1f2937', color: '#4b5563', fontSize: 14, cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}
          >☰</button>
          <div style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#374151', letterSpacing: 2, textTransform: 'uppercase' }}>
            {activePage.replace(/-/g, ' ')}
          </div>
        </div>
        {renderPage()}
      </main>
    </div>
  );
}

export default function CricketAdmin() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}