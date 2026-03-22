'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';

// role badge color
function roleBadgeColor(role: string) {
  if (role === 'Bowler')        return '#f97316';
  if (role === 'Batsman')       return '#3b82f6';
  if (role === 'All-rounder')   return '#22c55e';
  if (role === 'Wicket-keeper') return '#a855f7';
  return '#6b7280';
}

// ── BCL Scoring Logic ────────────────────────────────────────────────────────
type RunSource = 'bat' | 'bye' | 'legbye';
interface DeliveryConfig {
  event: string; batRuns: number; extraRuns: number; totalRuns: number;
  bowlScore: number; isLegal: boolean; isWicket: boolean; runSource: RunSource;
}

function calcDelivery(event: string, additionalRuns: number = 0, runSource: RunSource = 'bat'): DeliveryConfig {
  switch (event) {
    case 'dot':    return { event, batRuns:0,  extraRuns:0, totalRuns:0, bowlScore:4,  isLegal:true,  isWicket:false, runSource:'bat' };
    case 'single': return { event, batRuns:1,  extraRuns:0, totalRuns:1, bowlScore:3,  isLegal:true,  isWicket:false, runSource:'bat' };
    case 'double': return { event, batRuns:2,  extraRuns:0, totalRuns:2, bowlScore:2,  isLegal:true,  isWicket:false, runSource:'bat' };
    case 'triple': return { event, batRuns:3,  extraRuns:0, totalRuns:3, bowlScore:1,  isLegal:true,  isWicket:false, runSource:'bat' };
    case 'four':   return { event, batRuns:4,  extraRuns:0, totalRuns:4, bowlScore:0,  isLegal:true,  isWicket:false, runSource:'bat' };
    case 'five':   return { event, batRuns:5,  extraRuns:0, totalRuns:5, bowlScore:-1, isLegal:true,  isWicket:false, runSource:'bat' };
    case 'four_overthrow': return { event, batRuns:0, extraRuns:4, totalRuns:4, bowlScore:0, isLegal:true, isWicket:false, runSource:'bye' };
    case 'six':    return { event, batRuns:6,  extraRuns:0, totalRuns:6, bowlScore:-2, isLegal:true,  isWicket:false, runSource:'bat' };
    case 'seven':  return { event, batRuns:7,  extraRuns:0, totalRuns:7, bowlScore:-3, isLegal:true,  isWicket:false, runSource:'bat' };
    case 'six_overthrow': return { event, batRuns:0, extraRuns:6, totalRuns:6, bowlScore:-2, isLegal:true, isWicket:false, runSource:'bye' };
    case 'wicket': return { event, batRuns:0,  extraRuns:0, totalRuns:0, bowlScore:6,  isLegal:true,  isWicket:true,  runSource:'bat' };
    case 'noball': {
      const isBatRuns = runSource === 'bat';
      const batterCredit = isBatRuns ? additionalRuns : 0;
      const byeCredit = !isBatRuns ? additionalRuns : 0;
      return { event, batRuns:batterCredit, extraRuns:1+byeCredit, totalRuns:1+additionalRuns, bowlScore:-1, isLegal:true, isWicket:false, runSource };
    }
    case 'wide':   return { event, batRuns:0, extraRuns:1+additionalRuns, totalRuns:1+additionalRuns, bowlScore:-4, isLegal:false, isWicket:false, runSource:'bye' };
    case 'bye':    return { event, batRuns:0, extraRuns:additionalRuns, totalRuns:additionalRuns, bowlScore:4, isLegal:true, isWicket:false, runSource:'bye' };
    case 'legbye': return { event, batRuns:0, extraRuns:additionalRuns, totalRuns:additionalRuns, bowlScore:4, isLegal:true, isWicket:false, runSource:'bye' };
    default:       return { event, batRuns:0, extraRuns:0, totalRuns:0, bowlScore:0, isLegal:true, isWicket:false, runSource:'bat' };
  }
}

const EVENT_LABELS: Record<string,{label:string;icon:string;color:string}> = {
  dot:    { label:'DOT',     icon:'•',  color:'#6b7280' },
  single: { label:'1 RUN',   icon:'1',  color:'#3b82f6' },
  double: { label:'2 RUNS',  icon:'2',  color:'#06b6d4' },
  triple: { label:'3 RUNS',  icon:'3',  color:'#8b5cf6' },
  four:   { label:'FOUR',    icon:'4',  color:'#f97316' },
  five:   { label:'FIVE',    icon:'5',  color:'#ec4899' },
  six:    { label:'SIX',     icon:'6',  color:'#22c55e' },
  seven:  { label:'SEVEN',   icon:'7',  color:'#06b6d4' },
  wicket: { label:'WICKET',  icon:'W',  color:'#ef4444' },
  noball: { label:'NO BALL', icon:'NB', color:'#eab308' },
  wide:   { label:'WIDE',    icon:'WD', color:'#a855f7' },
  bye:    { label:'BYE',     icon:'B',  color:'#64748b' },
  legbye: { label:'LEG BYE', icon:'LB', color:'#475569' },
};

const FORMAT_OVERS: Record<string,number> = { 'T10':10,'T20':20,'ODI':50,'Test':90 };
function getOversFromFormat(format?:string):number { return FORMAT_OVERS[format??'']??10; }
const BALLS_PER_OVER = 6;
const MAX_WICKETS = 10;

// ── Types ─────────────────────────────────────────────────────────────────────
interface BatterStats { name:string;runs:number;balls:number;fours:number;sixes:number;dismissed:boolean;dotBalls:number;bowlConceded:number; }
interface BowlerStats  { name:string;legalBalls:number;runs:number;wickets:number;wides:number;noBalls:number;bowlAcquired:number;dotBalls:number;fours:number;sixes:number; }
interface Ball         { event:string;batRuns:number;extraRuns:number;totalRuns:number;bowlScore:number;runSource:RunSource;batter?:string;bowler?:string; }
interface Innings      { battingTeam:string;bowlingTeam:string;balls:Ball[];batScore:number;bowlScore:number;extras:number;legalBalls:number;wickets:number;complete:boolean;batters:BatterStats[];bowlers:BowlerStats[];strikerIdx:number;nonStrikerIdx:number;bowlerIdx:number; }

function initInnings(battingTeam:string, bowlingTeam:string):Innings {
  return { battingTeam,bowlingTeam,balls:[],batScore:0,bowlScore:0,extras:0,legalBalls:0,wickets:0,complete:false,batters:[],bowlers:[],strikerIdx:0,nonStrikerIdx:1,bowlerIdx:0 };
}
function newBatter(name:string):BatterStats { return {name,runs:0,balls:0,fours:0,sixes:0,dismissed:false,dotBalls:0,bowlConceded:0}; }
function newBowler(name:string):BowlerStats { return {name,legalBalls:0,runs:0,wickets:0,wides:0,noBalls:0,bowlAcquired:0,dotBalls:0,fours:0,sixes:0}; }
function sr(runs:number, balls:number) { return balls===0?'0.0':((runs/balls)*100).toFixed(1); }
function economy(runs:number, lb:number) { return lb===0?'0.00':((runs/lb)*6).toFixed(2); }
function oversStr(lb:number) { return `${Math.floor(lb/6)}.${lb%6}`; }

// ── Shared modal styles ───────────────────────────────────────────────────────
const MODAL_BG:React.CSSProperties = { position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200 };
const MODAL_CARD:React.CSSProperties = { background:'#0d1520',border:'1px solid #374151',borderRadius:14,padding:28,minWidth:320,maxWidth:460,width:'90%',position:'relative',overflow:'visible' };
function ModalTitle({children}:{children:React.ReactNode}) {
  return <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:3,color:'#f9fafb',marginBottom:6}}>{children}</div>;
}
function ModalSub({children}:{children:React.ReactNode}) {
  return <div style={{fontSize:11,color:'#6b7280',fontFamily:'Rajdhani',marginBottom:18}}>{children}</div>;
}
function btnStyle(bg:string, color:string, full=false):React.CSSProperties {
  return { background:bg,border:`1px solid ${color}55`,color,fontFamily:'Orbitron',fontWeight:700,fontSize:12,padding:full?'10px 20px':'10px 16px',borderRadius:6,cursor:'pointer',flex:full?1:undefined };
}

// ── FIX 1: PlayerPicker now accepts playerData so it can show role badges for actual team players ──
function PlayerPicker({ label, value, onChange, players, playerData=[], color='#3b82f6', exclude=[] }: {
  label:string; value:string; onChange:(v:string)=>void;
  players:string[];
  playerData?:{name:string;role:string;battingStyle:string;bowlingStyle:string}[];
  color?:string; exclude?:string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e:MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const eligible = players.filter(p => !exclude.includes(p));
  const filtered = search.trim()
    ? eligible.filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : eligible;

  function select(name:string) { onChange(name); setSearch(''); setOpen(false); }

  const selectedPlayer = playerData.find(p => p.name === value);

  return (
    <div ref={wrapRef} style={{marginBottom:14,position:'relative'}}>
      <div style={{fontSize:9,fontFamily:'Orbitron',color,letterSpacing:2,marginBottom:5}}>{label}</div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', background:'#111827', border:`1px solid ${open ? color : color+'44'}`,
          borderRadius:7, color: value ? '#f9fafb' : '#4b5563',
          fontSize:15, fontFamily:'Bebas Neue', letterSpacing:2,
          padding:'10px 14px', cursor:'pointer', boxSizing:'border-box',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          transition:'border-color 0.15s',
        }}
      >
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span>{value || 'SELECT PLAYER'}</span>
          {selectedPlayer && (
            <span style={{fontSize:9,fontFamily:'Orbitron',letterSpacing:1,color:roleBadgeColor(selectedPlayer.role),background:`${roleBadgeColor(selectedPlayer.role)}22`,border:`1px solid ${roleBadgeColor(selectedPlayer.role)}44`,borderRadius:4,padding:'2px 6px'}}>
              {selectedPlayer.role.toUpperCase()}
            </span>
          )}
        </div>
        <span style={{fontSize:10,color,marginLeft:8}}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0,
          background:'#0d1a2a', border:`1px solid ${color}55`,
          borderRadius:8, zIndex:999, boxShadow:'0 12px 40px #000000bb', overflow:'hidden',
        }}>
          <div style={{padding:'8px 10px', borderBottom:`1px solid ${color}22`}}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player..."
              style={{
                width:'100%', background:'#111827', border:`1px solid ${color}33`,
                borderRadius:5, color:'#f9fafb', fontSize:12,
                fontFamily:'Rajdhani', padding:'6px 10px', outline:'none', boxSizing:'border-box',
              }}
            />
          </div>

          <div style={{maxHeight:260,overflowY:'auto'}}>
            {filtered.length > 0 ? filtered.map(pName => {
              const pData = playerData.find(p => p.name === pName);
              const isSelected = pName === value;
              return (
                <div
                  key={pName}
                  onClick={() => select(pName)}
                  style={{
                    padding:'10px 14px', cursor:'pointer',
                    background: isSelected ? `${color}22` : 'transparent',
                    borderLeft:`3px solid ${isSelected ? color : 'transparent'}`,
                    transition:'background 0.1s',
                  }}
                  onMouseEnter={e => { if(!isSelected)(e.currentTarget as HTMLDivElement).style.background=`${color}11`; }}
                  onMouseLeave={e => { if(!isSelected)(e.currentTarget as HTMLDivElement).style.background='transparent'; }}
                >
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontFamily:'Bebas Neue',fontSize:15,letterSpacing:1,color:isSelected?color:'#f9fafb'}}>{pName}</span>
                      {pData && (
                        <span style={{fontSize:9,fontFamily:'Orbitron',letterSpacing:1,color:roleBadgeColor(pData.role),background:`${roleBadgeColor(pData.role)}22`,border:`1px solid ${roleBadgeColor(pData.role)}44`,borderRadius:4,padding:'1px 5px'}}>
                          {pData.role.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {pData && (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
                        <span style={{fontSize:9,color:'#374151',fontFamily:'Rajdhani'}}>{pData.bowlingStyle !== 'None' ? pData.bowlingStyle : pData.battingStyle}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div style={{padding:'16px 14px',color:'#4b5563',fontFamily:'Rajdhani',fontSize:12,textAlign:'center'}}>
                No players found matching "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Opening setup modal ───────────────────────────────────────────────────────
function OpeningSetupModal({ battingTeam, bowlingTeam, battingPlayers, bowlingPlayers, battingPlayerData, bowlingPlayerData, onConfirm }: {
  battingTeam:string; bowlingTeam:string;
  battingPlayers:string[]; bowlingPlayers:string[];
  battingPlayerData:{name:string;role:string;battingStyle:string;bowlingStyle:string}[];
  bowlingPlayerData:{name:string;role:string;battingStyle:string;bowlingStyle:string}[];
  onConfirm:(striker:string,nonStriker:string,bowler:string)=>void;
}) {
  const [striker,setStriker]   = useState('');
  const [nonStriker,setNS]     = useState('');
  const [bowler,setBowler]     = useState('');
  const valid = striker && nonStriker && bowler && striker !== nonStriker;

  return (
    <div  style={MODAL_BG}>
      <div style={{...MODAL_CARD,overflow:'visible'}}>
        <div  style={{position:'absolute',top:0,left:0,right:0,height:2,borderRadius:'14px 14px 0 0',background:'linear-gradient(90deg, transparent, #22c55e, transparent)'}} />
        <ModalTitle>OPENING PLAYERS</ModalTitle>
        <ModalSub>Select opening batters &amp; bowler to start the innings</ModalSub>
        <PlayerPicker label={`⚡ STRIKER · ${battingTeam}`}      value={striker}    onChange={setStriker} players={battingPlayers} playerData={battingPlayerData} color="#22c55e" exclude={[nonStriker]} />
        <PlayerPicker label={`• NON-STRIKER · ${battingTeam}`}  value={nonStriker} onChange={setNS}      players={battingPlayers} playerData={battingPlayerData} color="#3b82f6" exclude={[striker]}    />
        <PlayerPicker label={`🎯 OPENING BOWLER · ${bowlingTeam}`} value={bowler}  onChange={setBowler}  players={bowlingPlayers} playerData={bowlingPlayerData} color="#f97316" />
        <button
          disabled={!valid}
          onClick={() => valid && onConfirm(striker,nonStriker,bowler)}
          style={{width:'100%',marginTop:8,background:valid?'linear-gradient(135deg,#16a34a,#22c55e)':'#1f2937',border:'none',borderRadius:8,color:valid?'#000':'#374151',fontFamily:'Orbitron',fontWeight:900,fontSize:13,letterSpacing:2,padding:'12px',cursor:valid?'pointer':'not-allowed'}}
        >START INNINGS →</button>
      </div>
    </div>
  );
}

// ── New batter modal ──────────────────────────────────────────────────────────
function NewBatterModal({ battingTeam, wicketBatter, battingPlayers, battingPlayerData, activeBatters, onConfirm }: {
  battingTeam:string; wicketBatter:string;
  battingPlayers:string[];
  battingPlayerData:{name:string;role:string;battingStyle:string;bowlingStyle:string}[];
  activeBatters:string[];
  onConfirm:(name:string)=>void;
}) {
  const [name,setName] = useState('');
  return (
    <div style={MODAL_BG}>
      <div style={{...MODAL_CARD,overflow:'visible'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,borderRadius:'14px 14px 0 0',background:'linear-gradient(90deg, transparent, #ef4444, transparent)'}} />
        <div style={{marginBottom:14,background:'#ef444415',border:'1px solid #ef444433',borderRadius:8,padding:'10px 14px'}}>
          <div style={{fontSize:9,fontFamily:'Orbitron',color:'#ef4444',letterSpacing:2}}>WICKET!</div>
          <div style={{fontFamily:'Bebas Neue',fontSize:20,color:'#f9fafb',letterSpacing:2,marginTop:2}}>{wicketBatter} OUT</div>
        </div>
        <ModalTitle>NEW BATTER IN</ModalTitle>
        <ModalSub>Who comes in next for {battingTeam}?</ModalSub>
        <PlayerPicker label={`NEW BATTER · ${battingTeam}`} value={name} onChange={setName} players={battingPlayers} playerData={battingPlayerData} color="#22c55e" exclude={activeBatters} />
        <button
          disabled={!name}
          onClick={() => name && onConfirm(name)}
          style={{width:'100%',marginTop:8,background:name?'linear-gradient(135deg,#16a34a,#22c55e)':'#1f2937',border:'none',borderRadius:8,color:name?'#000':'#374151',fontFamily:'Orbitron',fontWeight:900,fontSize:13,letterSpacing:2,padding:'12px',cursor:name?'pointer':'not-allowed'}}
        >SEND IN →</button>
      </div>
    </div>
  );
}

// ── New bowler modal ──────────────────────────────────────────────────────────
function NewBowlerModal({ bowlingTeam, lastBowler, overNumber, bowlingPlayers, bowlingPlayerData, onConfirm }: {
  bowlingTeam:string; lastBowler:string; overNumber:number;
  bowlingPlayers:string[];
  bowlingPlayerData:{name:string;role:string;battingStyle:string;bowlingStyle:string}[];
  onConfirm:(name:string)=>void;
}) {
  const [name,setName] = useState('');
  const invalid = name === lastBowler;
  return (
    <div style={MODAL_BG}>
      <div style={{...MODAL_CARD,overflow:'visible'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,borderRadius:'14px 14px 0 0',background:'linear-gradient(90deg, transparent, #f97316, transparent)'}} />
        <div style={{marginBottom:14,background:'#f9731615',border:'1px solid #f9731633',borderRadius:8,padding:'10px 14px'}}>
          <div style={{fontSize:9,fontFamily:'Orbitron',color:'#f97316',letterSpacing:2}}>END OF OVER {overNumber}</div>
          <div style={{fontSize:12,color:'#9ca3af',fontFamily:'Rajdhani',marginTop:2}}>{lastBowler} completed the over</div>
        </div>
        <ModalTitle>NEXT BOWLER</ModalTitle>
        <ModalSub>Cannot be {lastBowler} (no consecutive overs)</ModalSub>
        <PlayerPicker label={`🎯 BOWLER · ${bowlingTeam}`} value={name} onChange={setName} players={bowlingPlayers} playerData={bowlingPlayerData} color="#f97316" exclude={[lastBowler]} />
        <button
          disabled={!name || invalid}
          onClick={() => name && !invalid && onConfirm(name)}
          style={{width:'100%',marginTop:8,background:(name&&!invalid)?'linear-gradient(135deg,#ea580c,#f97316)':'#1f2937',border:'none',borderRadius:8,color:(name&&!invalid)?'#000':'#374151',fontFamily:'Orbitron',fontWeight:900,fontSize:13,letterSpacing:2,padding:'12px',cursor:(name&&!invalid)?'pointer':'not-allowed'}}
        >BOWL →</button>
      </div>
    </div>
  );
}

// ── Boundary/Overthrow modal for 4s and 6s ───────────────────────────────────
function BoundaryOverthrowModal({ event, onConfirm, onCancel }: {
  event:string; onConfirm:(isBoundary:boolean)=>void; onCancel:()=>void;
}) {
  const accentColor = event === 'four' ? '#f97316' : '#22c55e';
  const eventLabel = event === 'four' ? '4 RUNS' : '6 RUNS';
  
  return (
    <div style={MODAL_BG}>
      <div style={{...MODAL_CARD,maxWidth:480}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,borderRadius:'14px 14px 0 0',background:`linear-gradient(90deg, transparent, ${accentColor}, transparent)`}} />
        <ModalTitle>{eventLabel} — HOW?</ModalTitle>
        <ModalSub>Select how the {eventLabel.toLowerCase()} was scored</ModalSub>
        
        <div style={{display:'flex',gap:10,flexDirection:'column',marginBottom:18}}>
          <button 
            onClick={() => onConfirm(true)} 
            style={{
              background:`${accentColor}15`,
              border:`1.5px solid ${accentColor}44`,
              borderRadius:8,
              padding:'16px 20px',
              color:accentColor,
              fontFamily:'Orbitron',
              fontWeight:700,
              fontSize:13,
              letterSpacing:1,
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:12,
              transition:'all 0.2s'
            }}
            onMouseEnter={e => {(e.currentTarget as HTMLButtonElement).style.background = `${accentColor}25`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}66`;}}
            onMouseLeave={e => {(e.currentTarget as HTMLButtonElement).style.background = `${accentColor}15`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}44`;}}
          >
            <span style={{fontSize:20}}>🚀</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontFamily:'Orbitron',fontWeight:900}}>BOUNDARY</div>
              <div style={{fontSize:11,color:`${accentColor}aa`,fontFamily:'Rajdhani'}}>Batter: {event === 'four' ? '+4' : '+6'} · Extras: 0</div>
            </div>
          </button>
          
          <button 
            onClick={() => onConfirm(false)} 
            style={{
              background:'#3b82f615',
              border:'1.5px solid #3b82f644',
              borderRadius:8,
              padding:'16px 20px',
              color:'#3b82f6',
              fontFamily:'Orbitron',
              fontWeight:700,
              fontSize:13,
              letterSpacing:1,
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:12,
              transition:'all 0.2s'
            }}
            onMouseEnter={e => {(e.currentTarget as HTMLButtonElement).style.background = '#3b82f625'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f666';}}
            onMouseLeave={e => {(e.currentTarget as HTMLButtonElement).style.background = '#3b82f615'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f644';}}
          >
            <span style={{fontSize:20}}>🎯</span>
            <div style={{textAlign:'left'}}>
              <div style={{fontFamily:'Orbitron',fontWeight:900}}>OVERTHROW</div>
              <div style={{fontSize:11,color:'#3b82f6aa',fontFamily:'Rajdhani'}}>Batter: 0 · Extras: {event === 'four' ? '+4' : '+6'}</div>
            </div>
          </button>
        </div>
        
        <button 
          onClick={onCancel} 
          style={btnStyle('#ef444422','#ef4444',true)}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

// ── Extra delivery modal ──────────────────────────────────────────────────────
function ExtraDeliveryModal({ event, onConfirm, onCancel }: {
  event:string; onConfirm:(additionalRuns:number,runSource:RunSource)=>void; onCancel:()=>void;
}) {
  const [runs,setRuns]         = useState(0);
  const [runSource,setRS]      = useState<RunSource>('bat');
  const isWide    = event==='wide',  isNoBall = event==='noball';
  const isBye     = event==='bye',   isLegBye = event==='legbye';
  const accentColor = isWide?'#a855f7':isNoBall?'#eab308':isBye?'#64748b':'#475569';
  const eventLabel  = isWide?'WIDE':isNoBall?'NO BALL':isBye?'BYE':'LEG BYE';

  return (
    <div style={MODAL_BG}>
      <div style={{...MODAL_CARD,maxWidth:480}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,borderRadius:'14px 14px 0 0',background:`linear-gradient(90deg, transparent, ${accentColor}, transparent)`}} />
        <ModalTitle>{eventLabel} — RUNS?</ModalTitle>
        {isWide   && <ModalSub>Wide is NOT a legal delivery. 1 wide extra auto-added. Enter any additional bye runs.</ModalSub>}
        {isNoBall && (<>
          <ModalSub>No Ball IS a legal delivery. 1 NB extra auto-added. Select how additional runs were scored.</ModalSub>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {(['bat','bye','legbye'] as RunSource[]).map(src => (
              <button key={src} onClick={() => setRS(src)} style={{flex:1,padding:'8px 4px',background:runSource===src?`${accentColor}33`:'#111827',border:`1.5px solid ${runSource===src?accentColor:'#374151'}`,borderRadius:6,color:runSource===src?accentColor:'#6b7280',fontFamily:'Orbitron',fontSize:9,letterSpacing:1,cursor:'pointer',fontWeight:runSource===src?700:400}}>
                {src==='bat'?'🏏 BAT':src==='bye'?'👟 BYE':'🦵 LEG BYE'}
              </button>
            ))}
          </div>
        </>)}
        {(isBye||isLegBye) && <ModalSub>{eventLabel} — runs go to extras only. Bowler treated as dot for BCL bowl score.</ModalSub>}

        <div style={{background:'#111827',border:`1px solid ${accentColor}33`,borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:11,fontFamily:'Rajdhani',color:'#9ca3af'}}>
          {isWide   && `Batting team: 1 (wide) + ${runs} (bye) = ${1+runs} runs. Batter: 0. Bowl: -4`}
          {isNoBall && runSource==='bat'    && `Batting team: 1 (NB) + ${runs} (bat) = ${1+runs}. Batter: +${runs}. Bowl: -1`}
          {isNoBall && runSource!=='bat'    && `Batting team: 1 (NB) + ${runs} (${runSource}) = ${1+runs}. Batter: 0. Bowl: -1`}
          {isBye    && `Batting team: +${runs} bye extras. Batter: 0. Bowl: +4 (dot)`}
          {isLegBye && `Batting team: +${runs} leg-bye extras. Batter: 0. Bowl: +4 (dot)`}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:22,justifyContent:'center'}}>
          <button onClick={() => setRuns(r => Math.max(0,r-1))} style={btnStyle('#374151','#9ca3af')}>−</button>
          <div style={{fontFamily:'Orbitron',fontSize:36,fontWeight:900,color:'#f9fafb',minWidth:50,textAlign:'center'}}>{runs}</div>
          <button onClick={() => setRuns(r => r+1)} style={btnStyle('#374151','#9ca3af')}>+</button>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={() => onConfirm(runs, isWide?'bye':runSource)} style={btnStyle(`${accentColor}22`,accentColor,true)}>CONFIRM</button>
          <button onClick={onCancel} style={btnStyle('#ef444422','#ef4444',true)}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

// ── ScoreBoard ────────────────────────────────────────────────────────────────
function ScoreBoard({ inn, label, inningsNum, otherInn, isSecondInningsLive }: {
  inn:Innings; label:string; inningsNum:number; otherInn?:Innings|null; isSecondInningsLive?:boolean;
}) {
  const overs=Math.floor(inn.legalBalls/6), balls=inn.legalBalls%6;
  
  // Calculate extras breakdown
  const extrasBreakdown = () => {
    const wides = inn.bowlers.reduce((sum, b) => sum + b.wides, 0);
    const noBalls = inn.bowlers.reduce((sum, b) => sum + b.noBalls, 0);
    const byes = inn.extras - wides - noBalls;
    const parts = [];
    if (wides > 0) parts.push(`${wides}W`);
    if (noBalls > 0) parts.push(`${noBalls}nb`);
    if (byes > 0) parts.push(`${byes}b`);
    return parts.length > 0 ? `(${parts.join(' + ')})` : '';
  };

  if (inningsNum===0) {
    return (
      <div style={{background:'#0a0f16',border:'1px solid #1f2937',borderRadius:10,padding:'16px 20px',flex:1,position:'relative',overflow:'hidden',minWidth:220}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#3b82f688,transparent)'}} />
        <div style={{fontSize:10,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:2,marginBottom:10}}>{label}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:14}}>
          <span style={{fontFamily:'Orbitron',fontSize:30,fontWeight:900,color:'#f9fafb',lineHeight:1}}>{inn.batScore}<span style={{fontSize:18,color:'#ef4444'}}>/{inn.wickets}</span></span>
          <span style={{fontFamily:'Orbitron',fontSize:13,color:'#22c55e',fontWeight:700}}>{overs}.{balls} Ov</span>
          {inn.complete && <span style={{fontSize:9,fontFamily:'Orbitron',color:'#22c55e55',letterSpacing:1}}>FINAL</span>}
        </div>
        {inn.extras>0 && <div style={{fontSize:10,color:'#6b7280',fontFamily:'Rajdhani',marginBottom:10}}>Extras: {inn.extras} {extrasBreakdown()}</div>}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#3b82f611',border:'1px solid #3b82f633',borderRadius:6,padding:'8px 12px',marginBottom:8}}>
          <div><div style={{fontSize:9,fontFamily:'Orbitron',color:'#3b82f6',letterSpacing:1,marginBottom:3}}>BATTING</div><div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#f9fafb',lineHeight:1}}>{inn.battingTeam}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:1,marginBottom:2}}>BAT SCORE</div><div style={{fontFamily:'Orbitron',fontSize:28,fontWeight:900,color:'#3b82f6',lineHeight:1}}>{inn.batScore}</div></div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f9731611',border:'1px solid #f9731633',borderRadius:6,padding:'8px 12px'}}>
          <div><div style={{fontSize:9,fontFamily:'Orbitron',color:'#f97316',letterSpacing:1,marginBottom:3}}>BOWLING</div><div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#f9fafb',lineHeight:1}}>{inn.bowlingTeam}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:1,marginBottom:2}}>BOWL SCORE</div><div style={{fontFamily:'Orbitron',fontSize:28,fontWeight:900,color:'#f97316',lineHeight:1}}>{inn.bowlScore}</div></div>
        </div>
        {!isSecondInningsLive && <div style={{marginTop:10,fontSize:10,color:'#1f2937',fontFamily:'Orbitron',letterSpacing:1,textAlign:'center'}}>DUAL SCORES CALCULATED AFTER 2ND INNINGS</div>}
      </div>
    );
  }
  const inn0BatFinal=otherInn?.batScore??0, inn0BowlFinal=otherInn?.bowlScore??0;
  const teamBDual=inn.batScore+inn0BowlFinal, teamADual=inn.bowlScore+inn0BatFinal;
  return (
    <div style={{background:'#0a0f16',border:'1px solid #22c55e33',borderRadius:10,padding:'16px 20px',flex:1,position:'relative',overflow:'hidden',minWidth:220}}>
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#22c55e88,transparent)'}} />
      <div style={{fontSize:10,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:2,marginBottom:10}}>{label}</div>
      <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:14}}>
        <span style={{fontFamily:'Orbitron',fontSize:30,fontWeight:900,color:'#f9fafb',lineHeight:1}}>{inn.batScore}<span style={{fontSize:18,color:'#ef4444'}}>/{inn.wickets}</span></span>
        <span style={{fontFamily:'Orbitron',fontSize:13,color:'#22c55e',fontWeight:700}}>{overs}.{balls} Ov</span>
      </div>
      {inn.extras>0 && <div style={{fontSize:10,color:'#6b7280',fontFamily:'Rajdhani',marginBottom:10}}>Extras: {inn.extras} {extrasBreakdown()}</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#22c55e11',border:'1px solid #22c55e33',borderRadius:6,padding:'8px 12px',marginBottom:8}}>
        <div>
          <div style={{fontSize:9,fontFamily:'Orbitron',color:'#22c55e',letterSpacing:1,marginBottom:3}}>BATTING · DUAL</div>
          <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#f9fafb',lineHeight:1}}>{inn.battingTeam}</div>
        </div>
        <div style={{fontSize:12,fontFamily:'Rajdhani',color:'white',marginTop:3}}>Bat² {inn.batScore} <span style={{color:'red'}}>+</span> Bowl¹ <span style={{color:'#22c55e'}}>{inn0BowlFinal}</span></div>
        <div style={{textAlign:'right'}}><div style={{fontSize:9,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:1,marginBottom:2}}>DUAL SCORE</div><div style={{fontFamily:'Orbitron',fontSize:28,fontWeight:900,color:'#22c55e',lineHeight:1}}>{teamBDual}</div></div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#a3e63511',border:'1px solid #a3e63533',borderRadius:6,padding:'8px 12px'}}>
        <div>
          <div style={{fontSize:9,fontFamily:'Orbitron',color:'#a3e635',letterSpacing:1,marginBottom:3}}>BOWLING · DUAL</div>
          <div style={{fontFamily:'Bebas Neue',fontSize:22,letterSpacing:2,color:'#f9fafb',lineHeight:1}}>{inn.bowlingTeam}</div>
        </div>
        <div style={{fontSize:12,fontFamily:'Rajdhani',color:'white',marginTop:3}}>Bowl² {inn.bowlScore} <span style={{color:'red'}}>+</span> Bat¹ <span style={{color:'#a3e635'}}>{inn0BatFinal}</span></div>
        <div style={{textAlign:'right'}}><div style={{fontSize:9,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:1,marginBottom:2}}>DUAL SCORE</div><div style={{fontFamily:'Orbitron',fontSize:28,fontWeight:900,color:'#a3e635',lineHeight:1}}>{teamADual}</div></div>
      </div>
    </div>
  );
}

// ── Crease Panel ──────────────────────────────────────────────────────────────
function CreasePanel({ inn }:{ inn:Innings }) {
  const striker   = inn.batters[inn.strikerIdx];
  const nonStriker= inn.batters[inn.nonStrikerIdx];
  const bowler    = inn.bowlers[inn.bowlerIdx];
  if (!striker||!bowler) return null;
  const strikerNet=striker.runs-striker.bowlConceded, nonStrikerNet=nonStriker?nonStriker.runs-nonStriker.bowlConceded:0, bowlerNet=bowler.bowlAcquired-bowler.runs;
  function netColor(v:number){return v>0?'#22c55e':v<0?'#ef4444':'#9ca3af';}

  return (
    <div style={{background:'#0a1018',border:'1px solid #1a2540',borderRadius:10,padding:'14px 16px',marginBottom:16,display:'flex',gap:10,flexWrap:'wrap'}}>
      <div style={{flex:1,minWidth:155,background:'#22c55e0d',border:'1px solid #22c55e22',borderRadius:8,padding:'10px 12px'}}>
        <div style={{fontSize:8,fontFamily:'Orbitron',color:'#22c55e',letterSpacing:2,marginBottom:4}}>⚡ ON STRIKE</div>
        <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:2,color:'#f9fafb',lineHeight:1}}>{striker.name}</div>
        <div style={{marginTop:6,display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontFamily:'Orbitron',fontSize:20,fontWeight:900,color:'#22c55e'}}>{striker.runs}</span>
          <span style={{fontSize:11,color:'#6b7280',fontFamily:'Rajdhani'}}>({striker.balls}b) SR {sr(striker.runs,striker.balls)}</span>
        </div>
        <div style={{marginTop:5,display:'flex',gap:8,flexWrap:'wrap',fontSize:11,fontFamily:'Rajdhani'}}>
          <span style={{color:'#6b7280'}}>Bowl Con: <span style={{color:'#f97316'}}>{striker.bowlConceded}</span></span>
          <span style={{color:'#6b7280'}}>Net: <span style={{fontFamily:'Orbitron',fontSize:12,fontWeight:700,color:netColor(strikerNet)}}>{strikerNet>0?'+':''}{strikerNet}</span></span>
        </div>
        <div style={{marginTop:4,fontSize:10,color:'#4b5563',fontFamily:'Rajdhani',display:'flex',gap:10}}>
          <span>● {striker.dotBalls}</span><span style={{color:'#f97316'}}>4s {striker.fours}</span><span style={{color:'#22c55e'}}>6s {striker.sixes}</span>
        </div>
      </div>
      {nonStriker && (
        <div style={{flex:1,minWidth:155,background:'#3b82f60d',border:'1px solid #3b82f622',borderRadius:8,padding:'10px 12px'}}>
          <div style={{fontSize:8,fontFamily:'Orbitron',color:'#3b82f6',letterSpacing:2,marginBottom:4}}>NON-STRIKER</div>
          <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:2,color:'#f9fafb',lineHeight:1}}>{nonStriker.name}</div>
          <div style={{marginTop:6,display:'flex',alignItems:'baseline',gap:8}}>
            <span style={{fontFamily:'Orbitron',fontSize:20,fontWeight:900,color:'#3b82f6'}}>{nonStriker.runs}</span>
            <span style={{fontSize:11,color:'#6b7280',fontFamily:'Rajdhani'}}>({nonStriker.balls}b) SR {sr(nonStriker.runs,nonStriker.balls)}</span>
          </div>
          <div style={{marginTop:5,display:'flex',gap:8,flexWrap:'wrap',fontSize:11,fontFamily:'Rajdhani'}}>
            <span style={{color:'#6b7280'}}>Bowl Con: <span style={{color:'#f97316'}}>{nonStriker.bowlConceded}</span></span>
            <span style={{color:'#6b7280'}}>Net: <span style={{fontFamily:'Orbitron',fontSize:12,fontWeight:700,color:netColor(nonStrikerNet)}}>{nonStrikerNet>0?'+':''}{nonStrikerNet}</span></span>
          </div>
          <div style={{marginTop:4,fontSize:10,color:'#4b5563',fontFamily:'Rajdhani',display:'flex',gap:10}}>
            <span>● {nonStriker.dotBalls}</span><span style={{color:'#f97316'}}>4s {nonStriker.fours}</span><span style={{color:'#22c55e'}}>6s {nonStriker.sixes}</span>
          </div>
        </div>
      )}
      <div style={{flex:1,minWidth:155,background:'#f973160d',border:'1px solid #f9731622',borderRadius:8,padding:'10px 12px'}}>
        <div style={{fontSize:8,fontFamily:'Orbitron',color:'#f97316',letterSpacing:2,marginBottom:4}}>🎯 BOWLING</div>
        <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:2,color:'#f9fafb',lineHeight:1}}>{bowler.name}</div>
        <div style={{marginTop:6,display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontFamily:'Orbitron',fontSize:20,fontWeight:900,color:'#f97316'}}>{bowler.wickets}/{bowler.runs}</span>
          <span style={{fontSize:11,color:'#6b7280',fontFamily:'Rajdhani'}}>({oversStr(bowler.legalBalls)} ov) Econ {economy(bowler.runs,bowler.legalBalls)}</span>
        </div>
        <div style={{marginTop:5,display:'flex',gap:8,flexWrap:'wrap',fontSize:11,fontFamily:'Rajdhani'}}>
          <span style={{color:'#6b7280'}}>Bowl Acq: <span style={{color:'#22c55e'}}>{bowler.bowlAcquired}</span></span>
          <span style={{color:'#6b7280'}}>Net: <span style={{fontFamily:'Orbitron',fontSize:12,fontWeight:700,color:netColor(bowlerNet)}}>{bowlerNet>0?'+':''}{bowlerNet}</span></span>
        </div>
        <div style={{marginTop:4,fontSize:10,color:'#4b5563',fontFamily:'Rajdhani',display:'flex',gap:10}}>
          <span>● {bowler.dotBalls}</span><span style={{color:'#f97316'}}>4s {bowler.fours}</span><span style={{color:'#22c55e'}}>6s {bowler.sixes}</span><span style={{color:'#a855f7'}}>WD {bowler.wides}</span><span style={{color:'#eab308'}}>NB {bowler.noBalls}</span>
        </div>
      </div>
    </div>
  );
}

// ── Scorecard ─────────────────────────────────────────────────────────────────
function ScorecardTable({ inn }:{ inn:Innings }) {
  const { batters, bowlers } = inn;
  if (batters.length===0 && bowlers.length===0) return null;
  return (
    <div style={{background:'#0a0f16',border:'1px solid #1f2937',borderRadius:10,padding:'16px',marginBottom:16}}>
      {batters.length>0 && (
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,fontFamily:'Orbitron',color:'#3b82f6',letterSpacing:2,marginBottom:10}}>🏏 {inn.battingTeam} BATTING</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:'Rajdhani'}}>
              <thead><tr style={{borderBottom:'1px solid #1f2937'}}>
                {['BATTER','R','B','●','4s','6s','SR','BOWL CON','NET RUN','STATUS'].map(h=>(
                  <th key={h} style={{padding:'5px 8px',textAlign:h==='BATTER'?'left':'right',fontSize:9,fontFamily:'Orbitron',color:'#374151',letterSpacing:1,fontWeight:400}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {batters.map((b,i) => {
                  const isStriker=!inn.complete&&i===inn.strikerIdx&&!b.dismissed;
                  const isNS=!inn.complete&&i===inn.nonStrikerIdx&&!b.dismissed;
                  const netRun=b.runs-b.bowlConceded;
                  const netColor=netRun>0?'#22c55e':netRun<0?'#ef4444':'#6b7280';
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #0d1520',background:isStriker?'#22c55e08':isNS?'#3b82f608':'transparent'}}>
                      <td style={{padding:'7px 8px',color:b.dismissed?'#6b7280':'#f9fafb',fontWeight:700}}>
                        {isStriker&&<span style={{color:'#22c55e',marginRight:4}}>⚡</span>}
                        {isNS&&<span style={{color:'#3b82f6',marginRight:4}}>•</span>}
                        {b.name}{b.dismissed&&<span style={{fontSize:10,color:'#ef4444',marginLeft:6}}>†</span>}
                      </td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontFamily:'Orbitron',fontWeight:900,color:b.dismissed?'#6b7280':'#f9fafb',fontSize:13}}>{b.runs}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#6b7280'}}>{b.balls}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#4b5563'}}>{b.dotBalls}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#f97316'}}>{b.fours}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#22c55e'}}>{b.sixes}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#9ca3af',fontSize:11}}>{sr(b.runs,b.balls)}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#f97316',fontSize:11}}>{b.bowlConceded}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontFamily:'Orbitron',fontWeight:700,fontSize:12,color:netColor}}>{netRun>0?'+':''}{netRun}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontSize:10}}>
                        {b.dismissed?<span style={{color:'#ef4444'}}>OUT</span>:isStriker?<span style={{color:'#22c55e'}}>BATTING*</span>:isNS?<span style={{color:'#3b82f6'}}>NOT OUT</span>:<span style={{color:'#4b5563'}}>NOT OUT</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {inn.extras>0 && <div style={{marginTop:8,padding:'6px 8px',background:'#1f293711',borderRadius:4,fontSize:11,fontFamily:'Rajdhani',color:'#6b7280'}}>Extras: <span style={{color:'#9ca3af',fontWeight:700}}>{inn.extras}</span></div>}
        </div>
      )}
      {bowlers.length>0 && (
        <div>
          <div style={{fontSize:10,fontFamily:'Orbitron',color:'#f97316',letterSpacing:2,marginBottom:10}}>🎯 {inn.bowlingTeam} BOWLING</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:'Rajdhani'}}>
              <thead><tr style={{borderBottom:'1px solid #1f2937'}}>
                {['BOWLER','O','R','W','●','4s','6s','WD','NB','BOWL ACQ','NET BOWL','ECON'].map(h=>(
                  <th key={h} style={{padding:'5px 8px',textAlign:h==='BOWLER'?'left':'right',fontSize:9,fontFamily:'Orbitron',color:'#374151',letterSpacing:1,fontWeight:400}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {bowlers.map((b,i) => {
                  const isCurrent=!inn.complete&&i===inn.bowlerIdx;
                  const netBowl=b.bowlAcquired-b.runs;
                  const netColor=netBowl>0?'#22c55e':netBowl<0?'#ef4444':'#6b7280';
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #0d1520',background:isCurrent?'#f9731608':'transparent'}}>
                      <td style={{padding:'7px 8px',color:'#f9fafb',fontWeight:700}}>{isCurrent&&<span style={{color:'#f97316',marginRight:4}}>🎯</span>}{b.name}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontFamily:'Orbitron',color:'#9ca3af',fontSize:11}}>{oversStr(b.legalBalls)}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontFamily:'Orbitron',fontWeight:900,color:'#f9fafb',fontSize:13}}>{b.runs}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontFamily:'Orbitron',fontWeight:900,color:b.wickets>0?'#ef4444':'#6b7280',fontSize:13}}>{b.wickets}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#4b5563'}}>{b.dotBalls}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#f97316'}}>{b.fours}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#22c55e'}}>{b.sixes}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#a855f7'}}>{b.wides}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#eab308'}}>{b.noBalls}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#22c55e',fontSize:11}}>{b.bowlAcquired}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontFamily:'Orbitron',fontWeight:700,fontSize:12,color:netColor}}>{netBowl>0?'+':''}{netBowl}</td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#9ca3af',fontSize:11}}>{economy(b.runs,b.legalBalls)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FIX 3: Dual-score ball dot (left=batter, right=bowler) ────────────────────
function BallDot({ b, idx }:{ b:Ball; idx:number }) {
  const meta = EVENT_LABELS[b.event] || {color:'#6b7280',icon:'?',label:'?'};

  // Left colour = batter outcome
  const leftColor = b.event==='wicket' ? '#ef4444'
    : b.event==='six'    ? '#22c55e'
    : b.event==='six_overthrow' ? '#22c55e'
    : b.event==='four'   ? '#f97316'
    : b.event==='four_overthrow' ? '#f97316'
    : b.event==='wide'   ? '#a855f7'
    : b.event==='noball' ? '#eab308'
    : b.batRuns > 0      ? '#3b82f6'
    : '#374151';

  // Right colour = bowler points
  const bp = b.bowlScore;
  const rightColor = bp >= 6 ? '#22c55e'
    : bp >= 3 ? '#4ade80'
    : bp >= 1 ? '#86efac'
    : bp === 0 ? '#6b7280'
    : bp >= -1 ? '#f97316'
    : '#ef4444';

  const batLabel  = b.event==='wicket' ? 'W'
    : b.event==='wide'   ? 'Wd'
    : b.event==='noball' ? 'NB'
    : String(b.batRuns);
  const bowlLabel = bp >= 0 ? `+${bp}` : String(bp);

  const size = 36;
  const r = size / 2;
  const clipId = `bc-${idx}`;

  return (
    <div
      title={`${b.batter??''} vs ${b.bowler??''} | ${meta.label} | Bat:${batLabel} Bowl:${bowlLabel}`}
      style={{position:'relative',width:size,height:size,flexShrink:0,cursor:'default'}}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{position:'absolute',inset:0}}>
        <defs>
          <clipPath id={`${clipId}-L`}><rect x="0" y="0" width={r} height={size}/></clipPath>
          <clipPath id={`${clipId}-R`}><rect x={r} y="0" width={r} height={size}/></clipPath>
        </defs>
        <circle cx={r} cy={r} r={r-1} fill={leftColor}  clipPath={`url(#${clipId}-L)`}/>
        <circle cx={r} cy={r} r={r-1} fill={rightColor} clipPath={`url(#${clipId}-R)`}/>
        <line x1={r} y1="2" x2={r} y2={size-2} stroke="#00000055" strokeWidth="1.5"/>
        <circle cx={r} cy={r} r={r-1} fill="none" stroke="#00000033" strokeWidth="1"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',pointerEvents:'none'}}>
        <span style={{width:r,textAlign:'center',fontFamily:'Orbitron',fontWeight:900,fontSize:9,color:'#fff',textShadow:'0 1px 2px #0009',lineHeight:1}}>{batLabel}</span>
        <span style={{width:r,textAlign:'center',fontFamily:'Orbitron',fontWeight:700,fontSize:7,color:'#fff',textShadow:'0 1px 2px #0009',lineHeight:1}}>{bowlLabel}</span>
      </div>
    </div>
  );
}

function OverRow({ over, balls }:{ over:number; balls:Ball[] }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid #1a2030'}}>
      <div style={{fontSize:10,fontFamily:'Orbitron',color:'#374151',width:28,flexShrink:0}}>O{over+1}</div>
      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{balls.map((b,i)=><BallDot key={i} b={b} idx={over*10+i}/>)}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type ModalState =
  | { type:'opening'; inningsIdx:number }
  | { type:'newBatter'; dismissedName:string }
  | { type:'newBowler'; overNumber:number }
  | { type:'extra'; event:string }
  | { type:'boundaryOverthrow'; event:string };

export default function BCLScoring({ scoringMatch, updateMatch, setActivePage }: {
  scoringMatch?:any; updateMatch?:(m:any)=>void; setActivePage?:(p:string)=>void;
}) {
  // FIX 2: Read persisted state from context so navigation doesn't reset it
  const { bclScoringState, setBclScoringState } = useApp();

  const TOTAL_OVERS = getOversFromFormat(scoringMatch?.format);
  const TOTAL_BALLS = TOTAL_OVERS * BALLS_PER_OVER;

  const matchId = scoringMatch?.id ?? '';

  // FIX 1: Derive player lists from actual scoringMatch teams instead of hardcoded arrays
  const teamAPlayerData:{name:string;role:string;battingStyle:string;bowlingStyle:string}[] =
    scoringMatch?.teamA?.players?.map((p:any) => ({ name:p.name, role:p.role, battingStyle:p.battingStyle, bowlingStyle:p.bowlingStyle })) ?? [];
  const teamBPlayerData:{name:string;role:string;battingStyle:string;bowlingStyle:string}[] =
    scoringMatch?.teamB?.players?.map((p:any) => ({ name:p.name, role:p.role, battingStyle:p.battingStyle, bowlingStyle:p.bowlingStyle })) ?? [];
  const teamAPlayers = teamAPlayerData.map(p => p.name);
  const teamBPlayers = teamBPlayerData.map(p => p.name);

  const [teamA,setTeamA] = useState(scoringMatch?.teamA?.shortName||scoringMatch?.teamA?.name||'TEAM A');
  const [teamB,setTeamB] = useState(scoringMatch?.teamB?.shortName||scoringMatch?.teamB?.name||'TEAM B');

  // FIX 2: Restore from context if same match, else fresh state
  const persisted = bclScoringState && (bclScoringState as any).matchId === matchId ? bclScoringState as any : null;

  const [started,setStarted]                     = useState(persisted?.started ?? false);
  const [inningsIdx,setInningsIdx]               = useState(persisted?.inningsIdx ?? 0);
  const [innings,setInnings]                     = useState<[Innings|null,Innings|null]>(persisted?.innings ?? [null,null]);
  const [modal,setModal]                         = useState<ModalState|null>(persisted?.modal ?? null);
  const [matchOver,setMatchOver]                 = useState(persisted?.matchOver ?? false);
  const [activeTab,setActiveTab]                 = useState<'score'|'scorecard'|'balls'>('score');
  const [secondInningsStarted,setSIStarted]      = useState(persisted?.secondInningsStarted ?? false);

  const prevLegalBalls        = useRef<number>(innings[inningsIdx]?.legalBalls ?? 0);
  const prevWicketBallIdx     = useRef<number>(-1);

  // FIX 2: Persist state to context on every change
  useEffect(() => {
    if (!matchId) return;
    setBclScoringState({ matchId, started, inningsIdx, innings, modal, matchOver, secondInningsStarted } as any);
  }, [started, inningsIdx, innings, modal, matchOver, secondInningsStarted]);

  function battingTeamPlayers(i:number){return i===0?teamAPlayers:teamBPlayers;}
  function bowlingTeamPlayers(i:number){return i===0?teamBPlayers:teamAPlayers;}
  function battingPlayerData(i:number){return i===0?teamAPlayerData:teamBPlayerData;}
  function bowlingPlayerData(i:number){return i===0?teamBPlayerData:teamAPlayerData;}

  function syncToMatch(i0:Innings|null, i1:Innings|null, isOver:boolean) {
    if (!scoringMatch||!updateMatch||!i0) return;
    const aD=i0.batScore+(i1?.bowlScore??0), bD=(i1?.batScore??0)+i0.bowlScore;
    let result:string|undefined;
    if (isOver&&i1) {
      if (aD>bD) result=`${teamA} WINS! (${aD} vs ${bD})`;
      else if (bD>aD) result=`${teamB} WINS! (${bD} vs ${aD})`;
      else result=`MATCH TIED! (${aD} each)`;
    }
    updateMatch({...scoringMatch,status:isOver?'completed':'live',scoreA:String(aD),scoreB:String(bD),result:result??scoringMatch.result});
  }

  function startMatch() {
    setInnings([initInnings(teamA,teamB), initInnings(teamB,teamA)]);
    setInningsIdx(0); setStarted(true); setMatchOver(false); setSIStarted(false);
    prevLegalBalls.current=0; prevWicketBallIdx.current=-1;
    setModal({type:'opening',inningsIdx:0});
    if (scoringMatch&&updateMatch) updateMatch({...scoringMatch,status:'live'});
  }

  function handleOpeningSetup(striker:string,nonStriker:string,bowler:string,innIdx:number) {
    if (innIdx===1) setSIStarted(true);
    setInnings(prev => {
      const all=[...prev] as [Innings|null,Innings|null];
      const inn={...all[innIdx]!};
      inn.batters=[newBatter(striker),newBatter(nonStriker)];
      inn.bowlers=[newBowler(bowler)];
      inn.strikerIdx=0; inn.nonStrikerIdx=1; inn.bowlerIdx=0;
      all[innIdx]=inn; return all;
    });
    setModal(null);
  }

  function applyDelivery(event:string, additionalRuns:number=0, runSource:RunSource='bat') {
    const delivery=calcDelivery(event,additionalRuns,runSource);
    setInnings(prev => {
      const all=[...prev] as [Innings|null,Innings|null];
      const inn={...all[inningsIdx]!};
      const striker=inn.batters[inn.strikerIdx], bowler=inn.bowlers[inn.bowlerIdx];
      if (!striker||!bowler) return prev;
      const ballsCopy=[...inn.balls];
      const bats=inn.batters.map(b=>({...b})), bowls=inn.bowlers.map(b=>({...b}));

      ballsCopy.push({event,batRuns:delivery.batRuns,extraRuns:delivery.extraRuns,totalRuns:delivery.totalRuns,bowlScore:delivery.bowlScore,runSource:delivery.runSource,batter:striker.name,bowler:bowler.name});

      const bat=bats[inn.strikerIdx];
      if (delivery.isLegal) bat.balls+=1;
      bat.runs+=delivery.batRuns;
      if (event==='four'||event==='four_overthrow') bat.fours+=1;
      if (event==='six'||event==='six_overthrow')  bat.sixes+=1;
      if (delivery.batRuns===0&&delivery.isLegal&&!delivery.isWicket) bat.dotBalls+=1;
      if (delivery.isWicket) bat.dismissed=true;
      bat.bowlConceded+=delivery.bowlScore;

      const bwl=bowls[inn.bowlerIdx];
      if (delivery.isLegal) bwl.legalBalls+=1;
      bwl.runs+=delivery.batRuns+delivery.extraRuns;
      if (delivery.isWicket) bwl.wickets+=1;
      if (event==='wide')   bwl.wides+=1;
      if (event==='noball') bwl.noBalls+=1;
      bwl.bowlAcquired+=delivery.bowlScore;
      if (delivery.batRuns===0&&delivery.isLegal&&!delivery.isWicket) bwl.dotBalls+=1;
      if (event==='four'||event==='four_overthrow') bwl.fours+=1;
      if (event==='six'||event==='six_overthrow')  bwl.sixes+=1;

      inn.batScore+=delivery.totalRuns; inn.extras+=delivery.extraRuns; inn.bowlScore+=delivery.bowlScore;
      if (delivery.isLegal) inn.legalBalls+=1;
      if (delivery.isWicket) inn.wickets+=1;
      inn.balls=ballsCopy; inn.batters=bats; inn.bowlers=bowls;

      if (delivery.batRuns===1||delivery.batRuns===3) [inn.strikerIdx,inn.nonStrikerIdx]=[inn.nonStrikerIdx,inn.strikerIdx];
      if ((event==='bye'||event==='legbye')&&(additionalRuns===1||additionalRuns===3)) [inn.strikerIdx,inn.nonStrikerIdx]=[inn.nonStrikerIdx,inn.strikerIdx];

      const allOut=inn.wickets>=MAX_WICKETS, oversUp=inn.legalBalls>=TOTAL_BALLS;
      if (allOut||oversUp) {
        if (allOut&&!oversUp){const r=TOTAL_BALLS-inn.legalBalls;inn.bowlScore+=r*4;inn.balls=[...inn.balls,{event:'_bonus',batRuns:0,extraRuns:0,totalRuns:0,bowlScore:r*4,runSource:'bat'}];}
        inn.complete=true;
      }
      all[inningsIdx]=inn;
      syncToMatch(all[0],all[1],inningsIdx===1&&inn.complete);
      return all;
    });
  }

  useEffect(()=>{
    if (!started||modal) return;
    const inn=innings[inningsIdx];
    if (!inn) return;
    if (inn.complete) {
      if (inningsIdx===0){setTimeout(()=>{setInningsIdx(1);prevWicketBallIdx.current=-1;setModal({type:'opening',inningsIdx:1});},600);}
      else setMatchOver(true);
      return;
    }
    const cl=inn.legalBalls;
    if (cl>0&&cl%6===0&&cl!==prevLegalBalls.current) {
      prevLegalBalls.current=cl;
      setInnings(prev=>{const all=[...prev] as [Innings|null,Innings|null];const i={...all[inningsIdx]!};[i.strikerIdx,i.nonStrikerIdx]=[i.nonStrikerIdx,i.strikerIdx];all[inningsIdx]=i;return all;});
      setModal({type:'newBowler',overNumber:cl/6}); return;
    }
    prevLegalBalls.current=cl;
    const realBalls=inn.balls.filter(b=>b.event!=='_bonus');
    const lastIdx=realBalls.length-1, last=realBalls[lastIdx];
    if (last?.event==='wicket'&&inn.wickets<MAX_WICKETS&&lastIdx!==prevWicketBallIdx.current) {
      prevWicketBallIdx.current=lastIdx;
      setModal({type:'newBatter',dismissedName:last.batter??'BATTER'});
    }
  },[innings,inningsIdx,started]);

  function handleNewBatter(name:string) {
    setInnings(prev=>{
      const all=[...prev] as [Innings|null,Innings|null];
      const inn={...all[inningsIdx]!};
      const newIdx=inn.batters.length;
      inn.batters=[...inn.batters,newBatter(name)];
      inn.strikerIdx=newIdx;
      all[inningsIdx]=inn; return all;
    });
    setModal(null);
  }

  function handleNewBowler(name:string) {
    setInnings(prev=>{
      const all=[...prev] as [Innings|null,Innings|null];
      const inn={...all[inningsIdx]!};
      const ei=inn.bowlers.findIndex(b=>b.name===name);
      if (ei>=0){inn.bowlerIdx=ei;}else{inn.bowlers=[...inn.bowlers,newBowler(name)];inn.bowlerIdx=inn.bowlers.length-1;}
      all[inningsIdx]=inn; return all;
    });
    setModal(null);
  }

  function handleEvent(event:string) {
    if (matchOver||modal) return;
    const inn=innings[inningsIdx];
    if (!inn||inn.batters.length===0) return;
    if (['noball','wide','bye','legbye'].includes(event)){setModal({type:'extra',event});}
    else if (['four','six'].includes(event)){setModal({type:'boundaryOverthrow',event});}
    else applyDelivery(event);
  }

  function handleBoundaryOverthrow(isBoundary:boolean) {
    const modal_=modal as any;
    const event = modal_.event;
    const newEvent = isBoundary ? event : (event === 'four' ? 'four_overthrow' : 'six_overthrow');
    applyDelivery(newEvent);
    setModal(null);
  }

  function undoLastBall() {
    setInnings(prev=>{
      const all=[...prev] as [Innings|null,Innings|null];
      const inn={...all[inningsIdx]!};
      const rb=inn.balls.filter(b=>b.event!=='_bonus');
      if (rb.length===0) return prev;
      const last=rb[rb.length-1];
      inn.balls=rb.slice(0,-1);
      inn.batScore-=last.totalRuns; inn.extras-=last.extraRuns; inn.bowlScore-=last.bowlScore;
      if (last.event!=='wide') inn.legalBalls=Math.max(0,inn.legalBalls-1);
      if (last.event==='wicket') inn.wickets=Math.max(0,inn.wickets-1);
      inn.complete=false;
      const bats=inn.batters.map(b=>({...b}));
      const bi=bats.findIndex(b=>b.name===last.batter);
      if (bi>=0){const b=bats[bi];if(last.event!=='wide')b.balls=Math.max(0,b.balls-1);b.runs=Math.max(0,b.runs-last.batRuns);if(last.event==='four'||last.event==='four_overthrow')b.fours=Math.max(0,b.fours-1);if(last.event==='six'||last.event==='six_overthrow')b.sixes=Math.max(0,b.sixes-1);if(last.event==='wicket')b.dismissed=false;if(last.batRuns===0&&last.event!=='wide'&&last.event!=='wicket')b.dotBalls=Math.max(0,b.dotBalls-1);b.bowlConceded-=last.bowlScore;}
      inn.batters=bats;
      const bowls=inn.bowlers.map(b=>({...b}));
      const bwi=bowls.findIndex(b=>b.name===last.bowler);
      if (bwi>=0){const b=bowls[bwi];if(last.event!=='wide')b.legalBalls=Math.max(0,b.legalBalls-1);b.runs=Math.max(0,b.runs-last.batRuns-last.extraRuns);if(last.event==='wicket')b.wickets=Math.max(0,b.wickets-1);if(last.event==='wide')b.wides=Math.max(0,b.wides-1);if(last.event==='noball')b.noBalls=Math.max(0,b.noBalls-1);b.bowlAcquired-=last.bowlScore;if(last.batRuns===0&&last.event!=='wide'&&last.event!=='wicket')b.dotBalls=Math.max(0,b.dotBalls-1);if(last.event==='four'||last.event==='four_overthrow')b.fours=Math.max(0,b.fours-1);if(last.event==='six'||last.event==='six_overthrow')b.sixes=Math.max(0,b.sixes-1);}
      inn.bowlers=bowls;
      if (last.batRuns===1||last.batRuns===3)[inn.strikerIdx,inn.nonStrikerIdx]=[inn.nonStrikerIdx,inn.strikerIdx];
      if ((last.event==='bye'||last.event==='legbye')&&(last.extraRuns===1||last.extraRuns===3))[inn.strikerIdx,inn.nonStrikerIdx]=[inn.nonStrikerIdx,inn.strikerIdx];
      all[inningsIdx]=inn;
      syncToMatch(all[0],all[1],false); return all;
    });
    prevLegalBalls.current=innings[inningsIdx]?.legalBalls??0;
    const after=innings[inningsIdx]?.balls.filter(b=>b.event!=='_bonus')??[];
    prevWicketBallIdx.current=after.length-1;
  }

  function groupOvers(inn:Innings|null){
    if (!inn) return [];
    const overs:Ball[][]=[];let cur:Ball[]=[];let legal=0;
    for (const b of inn.balls){if(b.event==='_bonus')continue;cur.push(b);if(b.event!=='wide'){legal++;if(legal%6===0){overs.push(cur);cur=[];}}}
    if(cur.length)overs.push(cur);return overs;
  }

  function getResult(){
    const i0=innings[0],i1=innings[1];if(!i0||!i1)return '';
    const aD=i0.batScore+i1.bowlScore,bD=i1.batScore+i0.bowlScore;
    if(aD>bD)return `${teamA} WINS! (${aD} vs ${bD})`;
    if(bD>aD)return `${teamB} WINS! (${bD} vs ${aD})`;
    return `MATCH TIED! (${aD} each)`;
  }

  const inn0=innings[0],inn1=innings[1],activeInn=innings[inningsIdx];
  const overs0=groupOvers(inn0),overs1=groupOvers(inn1);
  const FONTS=`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');`;
  const SCORING_EVENTS=['dot','single','double','triple','four','five','six','seven','wicket','noball','wide','bye','legbye'];

  if (!started) {
    return (
      <div style={{minHeight:'100vh',background:'#060c14',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
        <style>{`${FONTS} *{box-sizing:border-box;margin:0;padding:0;} input{outline:none;} button:hover{filter:brightness(1.15);}`}</style>
        <div style={{background:'#0d1520',border:'1px solid #1f2937',borderRadius:16,padding:'36px 40px',maxWidth:440,width:'100%',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#22c55e,transparent)'}} />
          {setActivePage&&<button onClick={()=>setActivePage('matches')} style={{position:'absolute',top:16,right:16,background:'transparent',border:'1px solid #1f2937',color:'#4b5563',fontFamily:'Orbitron',fontSize:9,padding:'4px 10px',borderRadius:4,cursor:'pointer',letterSpacing:1}}>← BACK</button>}
          <div style={{textAlign:'center',marginBottom:28}}>
            <div style={{fontSize:40,marginBottom:8}}>🏏</div>
            <div style={{fontFamily:'Bebas Neue',fontSize:32,letterSpacing:4,color:'#f9fafb'}}>BCL SCORER</div>
            <div style={{fontSize:11,color:'#22c55e',fontFamily:'Orbitron',letterSpacing:3,marginTop:2}}>BOUNDARY CRICKET LEAGUE</div>
          </div>
          {[{label:'TEAM A (Batting First)',val:teamA,set:setTeamA},{label:'TEAM B (Bowling First)',val:teamB,set:setTeamB}].map(({label,val,set})=>(
            <div key={label} style={{marginBottom:16}}>
              <div style={{fontSize:10,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:2,marginBottom:6}}>{label}</div>
              <input value={val} onChange={e=>set(e.target.value.toUpperCase())} style={{width:'100%',background:'#111827',border:'1px solid #374151',borderRadius:8,color:'#f9fafb',fontSize:16,fontFamily:'Bebas Neue',letterSpacing:2,padding:'12px 16px'}}/>
            </div>
          ))}

          {/* FIX 1: Show actual team players from scoringMatch */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
            {[{label:`TEAM A · ${teamA}`,squad:teamAPlayerData,color:'#22c55e'},{label:`TEAM B · ${teamB}`,squad:teamBPlayerData,color:'#3b82f6'}].map(({label,squad,color})=>(
              <div key={label} style={{background:'#111827',border:`1px solid ${color}22`,borderRadius:8,padding:'10px 12px'}}>
                <div style={{fontSize:9,fontFamily:'Orbitron',color,letterSpacing:2,marginBottom:8}}>{label} <span style={{color:'#374151'}}>({squad.length})</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {squad.map((p,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:roleBadgeColor(p.role),display:'inline-block',flexShrink:0}}/>
                        <span style={{fontSize:11,fontFamily:'Rajdhani',color:'#d1d5db'}}>{p.name}</span>
                      </div>
                      <span style={{fontSize:9,fontFamily:'Orbitron',color:roleBadgeColor(p.role),background:`${roleBadgeColor(p.role)}15`,borderRadius:3,padding:'1px 5px',letterSpacing:0.5}}>{p.role === 'Wicket-keeper' ? 'WK' : p.role === 'All-rounder' ? 'AR' : p.role === 'Bowler' ? 'BWL' : 'BAT'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={startMatch} style={{width:'100%',marginTop:8,background:'linear-gradient(135deg,#16a34a,#22c55e)',border:'none',borderRadius:8,color:'#000',fontFamily:'Orbitron',fontWeight:900,fontSize:14,letterSpacing:2,padding:'14px',cursor:'pointer',boxShadow:'0 0 20px #22c55e44'}}>
            START MATCH →
          </button>
          <div style={{marginTop:16,fontSize:11,color:'#374151',textAlign:'center',fontFamily:'Rajdhani'}}>
            {TOTAL_OVERS} Overs · 10 Wickets · BCL Dual Score System · {teamAPlayerData.length} vs {teamBPlayerData.length} players
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:'#060c14',color:'#f9fafb',fontFamily:'Rajdhani',paddingBottom:60}}>
      <style>{`${FONTS} *{box-sizing:border-box;margin:0;padding:0;} button:hover{filter:brightness(1.2);} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#0d1520;} ::-webkit-scrollbar-thumb{background:#1f2937;border-radius:2px;} input{outline:none;}`}</style>

      {/* Header */}
      <div style={{background:'#0a0f16',borderBottom:'1px solid #1f2937',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>🏏</span>
          <div>
            <div style={{fontFamily:'Bebas Neue',fontSize:20,letterSpacing:3}}>BCL SCORER</div>
            <div style={{fontSize:9,color:'#22c55e',fontFamily:'Orbitron',letterSpacing:2}}>INNINGS {inningsIdx+1} OF 2 · {TOTAL_OVERS} OV{matchOver&&' · COMPLETE'}</div>
          </div>
          {!matchOver&&<div style={{display:'flex',alignItems:'center',gap:5,background:'#22c55e11',border:'1px solid #22c55e22',borderRadius:20,padding:'3px 10px',marginLeft:8}}><span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',display:'inline-block'}}/><span style={{fontSize:9,fontFamily:'Orbitron',color:'#22c55e',letterSpacing:1}}>LIVE</span></div>}
        </div>
        <div style={{display:'flex',gap:8}}>
          {setActivePage&&<button onClick={()=>setActivePage('matches')} style={{background:'#1f2937',border:'1px solid #374151',color:'#9ca3af',fontFamily:'Orbitron',fontSize:10,padding:'6px 14px',borderRadius:4,cursor:'pointer',letterSpacing:1}}>← MATCHES</button>}
          <button onClick={startMatch} style={{background:'#1f2937',border:'1px solid #374151',color:'#9ca3af',fontFamily:'Orbitron',fontSize:10,padding:'6px 14px',borderRadius:4,cursor:'pointer',letterSpacing:1}}>NEW</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'#0a0f16',borderBottom:'1px solid #1f2937',padding:'0 20px',display:'flex'}}>
        {([['score','📊 SCORE'],['scorecard','📋 SCORECARD'],['balls','⚽ BALL-BY-BALL']] as [string,string][]).map(([tab,lbl])=>(
          <button key={tab} onClick={()=>setActiveTab(tab as any)} style={{background:'transparent',border:'none',borderBottom:activeTab===tab?'2px solid #22c55e':'2px solid transparent',color:activeTab===tab?'#22c55e':'#4b5563',fontFamily:'Orbitron',fontSize:9,letterSpacing:1,padding:'12px 16px',cursor:'pointer'}}>{lbl}</button>
        ))}
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:'20px 16px'}}>

        {activeTab==='score'&&(
          <>
            <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap'}}>
              {inn0&&<ScoreBoard inn={inn0} label={`1ST INNINGS${inn0.complete?' · FINAL':' · LIVE'}`} inningsNum={0} isSecondInningsLive={secondInningsStarted}/>}
              {inn1&&secondInningsStarted&&<ScoreBoard inn={inn1} label={`2ND INNINGS${inn1.complete?' · FINAL':' · LIVE'}`} inningsNum={1} otherInn={inn0} isSecondInningsLive={secondInningsStarted}/>}
            </div>
            {!matchOver&&activeInn&&activeInn.batters.length>0&&!modal&&<CreasePanel inn={activeInn}/>}
            {matchOver&&(
              <div style={{background:'linear-gradient(135deg,#0d2d1a,#111827)',border:'1px solid #22c55e44',borderRadius:10,padding:'18px 24px',marginBottom:20,textAlign:'center'}}>
                <div style={{fontFamily:'Bebas Neue',fontSize:28,letterSpacing:4,color:'#22c55e'}}>{getResult()}</div>
                <button onClick={()=>setActiveTab('scorecard')} style={{marginTop:14,background:'#3b82f615',border:'1px solid #3b82f644',color:'#3b82f6',fontFamily:'Orbitron',fontSize:11,letterSpacing:1,padding:'9px 24px',borderRadius:6,cursor:'pointer',fontWeight:700}}>VIEW SCORECARD →</button>
              </div>
            )}
            {!matchOver&&inningsIdx===1&&<div style={{background:'#3b82f611',border:'1px solid #3b82f622',borderRadius:8,padding:'10px 16px',marginBottom:16,fontSize:13,color:'#93c5fd',fontFamily:'Orbitron',letterSpacing:1}}>▶ 2ND INNINGS — {teamB} BATTING</div>}
            {!matchOver&&activeInn&&activeInn.batters.length>0&&!modal&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,fontFamily:'Orbitron',color:'#374151',letterSpacing:2,marginBottom:10}}>RECORD DELIVERY</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {SCORING_EVENTS.map(key=>{
                    const meta=EVENT_LABELS[key];
                    const preview=calcDelivery(key,0,'bat');
                    const needsModal=['noball','wide','bye','legbye','four','six'].includes(key);
                    return (
                      <button key={key} onClick={()=>handleEvent(key)} style={{background:`${meta.color}15`,border:`1.5px solid ${meta.color}44`,borderRadius:8,padding:'10px 14px',color:meta.color,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,minWidth:64}}>
                        <span style={{fontFamily:'Orbitron',fontWeight:900,fontSize:18}}>{meta.icon}</span>
                        <span style={{fontFamily:'Orbitron',fontSize:8,letterSpacing:1}}>{meta.label}</span>
                        <span style={{fontSize:9,color:`${meta.color}aa`,fontFamily:'Rajdhani'}}>{needsModal?'→ SELECT':`Bat:${preview.batRuns>=0?'+':''}${preview.batRuns} / Bowl:${preview.bowlScore>=0?'+':''}${preview.bowlScore}`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {!matchOver&&activeInn&&activeInn.balls.filter(b=>b.event!=='_bonus').length>0&&!modal&&(
              <button onClick={undoLastBall} style={{background:'#ef444415',border:'1px solid #ef444433',color:'#ef4444',fontFamily:'Orbitron',fontSize:11,letterSpacing:1,padding:'8px 20px',borderRadius:6,cursor:'pointer'}}>↩ UNDO LAST BALL</button>
            )}
          </>
        )}

        {activeTab==='scorecard'&&(
          <>
            {inn0&&inn0.batters.length>0&&<div style={{marginBottom:8}}><div style={{fontSize:10,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:2,marginBottom:8}}>1ST INNINGS</div><ScorecardTable inn={inn0}/></div>}
            {inn1&&inn1.batters.length>0&&secondInningsStarted&&<div><div style={{fontSize:10,fontFamily:'Orbitron',color:'#4b5563',letterSpacing:2,marginBottom:8}}>2ND INNINGS</div><ScorecardTable inn={inn1}/></div>}
            {(!inn0||inn0.batters.length===0)&&(!inn1||inn1.batters.length===0)&&<div style={{textAlign:'center',padding:40,color:'#374151',fontFamily:'Orbitron',fontSize:11}}>NO DATA YET</div>}
          </>
        )}

        {activeTab==='balls'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {[{label:`1ST INNINGS · ${inn0?.battingTeam}`,overs:overs0},...(secondInningsStarted?[{label:`2ND INNINGS · ${inn1?.battingTeam}`,overs:overs1}]:[])].map(({label,overs})=>overs.length>0&&(
              <div key={label} style={{background:'#0d1520',border:'1px solid #1f2937',borderRadius:10,padding:'14px 16px'}}>
                <div style={{fontSize:10,fontFamily:'Orbitron',color:'#374151',letterSpacing:2,marginBottom:10}}>{label}</div>
                {overs.map((balls,oi)=><OverRow key={oi} over={oi} balls={balls}/>)}
              </div>
            ))}
            {overs0.length===0&&overs1.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:'#374151',fontFamily:'Orbitron',fontSize:11}}>NO DELIVERIES YET</div>}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type==='opening'&&(
        <OpeningSetupModal
          battingTeam={modal.inningsIdx===0?teamA:teamB}
          bowlingTeam={modal.inningsIdx===0?teamB:teamA}
          battingPlayers={battingTeamPlayers(modal.inningsIdx)}
          bowlingPlayers={bowlingTeamPlayers(modal.inningsIdx)}
          battingPlayerData={battingPlayerData(modal.inningsIdx)}
          bowlingPlayerData={bowlingPlayerData(modal.inningsIdx)}
          onConfirm={(s,ns,b)=>handleOpeningSetup(s,ns,b,modal.inningsIdx)}
        />
      )}
      {modal?.type==='newBatter'&&(()=>{
        const inn=innings[inningsIdx];
        const activeBatters=inn?inn.batters.map(b=>b.name):[];
        return (
          <NewBatterModal
            battingTeam={inningsIdx===0?teamA:teamB}
            wicketBatter={modal.dismissedName}
            battingPlayers={battingTeamPlayers(inningsIdx)}
            battingPlayerData={battingPlayerData(inningsIdx)}
            activeBatters={activeBatters}
            onConfirm={handleNewBatter}
          />
        );
      })()}
      {modal?.type==='newBowler'&&(
        <NewBowlerModal
          bowlingTeam={inningsIdx===0?teamB:teamA}
          lastBowler={activeInn?.bowlers[activeInn.bowlerIdx]?.name??''}
          overNumber={modal.overNumber}
          bowlingPlayers={bowlingTeamPlayers(inningsIdx)}
          bowlingPlayerData={bowlingPlayerData(inningsIdx)}
          onConfirm={handleNewBowler}
        />
      )}
      {modal?.type==='extra'&&(
        <ExtraDeliveryModal
          event={modal.event}
          onConfirm={(runs,src)=>{applyDelivery(modal.event,runs,src);setModal(null);}}
          onCancel={()=>setModal(null)}
        />
      )}
      {modal?.type==='boundaryOverthrow'&&(
        <BoundaryOverthrowModal
          event={modal.event}
          onConfirm={handleBoundaryOverthrow}
          onCancel={()=>setModal(null)}
        />
      )}
    </div>
  );
}