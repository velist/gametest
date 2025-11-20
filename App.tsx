
import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import GodPanel from './components/GodPanel';
import EndingCard from './components/EndingCard';
import CheatTerminal from './components/CheatTerminal';
import LifeSimulator from './components/LifeSimulator';
import { generateBreakthrough } from './services/geminiService';
import { GodState, GamePhase, Language, Era, EraRequirements, GodPower, GameMode, AvatarState } from './types';
import { TRANSLATIONS } from './translations';

const ERA_ORDER = [Era.StoneAge, Era.BronzeAge, Era.IronAge, Era.ModernAge, Era.FutureAge];

const ERA_REQS: Record<Era, EraRequirements> = {
  [Era.StoneAge]: { wood: 0, stone: 0, food: 0, population: 0, knowledge: 0 },
  [Era.BronzeAge]: { wood: 500, stone: 200, food: 500, population: 50, knowledge: 100 },
  [Era.IronAge]: { wood: 2000, stone: 1000, food: 2000, population: 200, knowledge: 500 },
  [Era.ModernAge]: { wood: 10000, stone: 5000, food: 10000, population: 1000, knowledge: 2000 },
  [Era.FutureAge]: { wood: 50000, stone: 50000, food: 50000, population: 5000, knowledge: 10000 },
};

const App: React.FC = () => {
  // -- UI State --
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [inputName, setInputName] = useState('');
  const [showCheat, setShowCheat] = useState(false);
  const [showDescentConfirm, setShowDescentConfirm] = useState(false);
  
  // -- Walker / Avatar State --
  const [gameMode, setGameMode] = useState<GameMode>('god');
  const [avatar, setAvatar] = useState<AvatarState>({ x: 0, y: 0, targetX: 0, targetY: 0, isMoving: false });

  // -- Game Data State --
  const [godState, setGodState] = useState<GodState>({
    name: 'Observer',
    karma: 1000,
    currentEra: Era.StoneAge,
    interventionCount: 0,
    startTime: Date.now(),
    resources: { wood: 0, stone: 0, food: 100, population: 10, knowledge: 0 }
  });

  // -- Messages Log --
  const [logs, setLogs] = useState<string[]>([]);

  const t = TRANSLATIONS[language];

  const addLog = (msg: string) => {
      setLogs(prev => [msg, ...prev].slice(0, 3)); // Keep last 3
  };

  // -- Game Loop --
  useEffect(() => {
    if (phase !== 'playing') return;

    const tick = setInterval(() => {
      setGodState(prev => {
        // Karma check
        if (prev.karma <= 0) {
           setPhase('ending');
           return prev;
        }
        
        // If in Life Sim mode (Walker), the world is paused or very slow
        if (gameMode === 'walker') return prev;

        const r = { ...prev.resources };
        const multiplier = timeSpeed * (1 + (Math.log(r.population || 1) / 10));

        // Passive Growth
        r.food += 1 * multiplier;
        r.wood += 0.5 * multiplier;
        
        // Pop Mechanics
        if (r.food > r.population) {
           r.population += (r.population * 0.05 * timeSpeed * 0.1);
           r.food -= r.population * 0.01;
        } else {
           r.population -= (r.population * 0.1 * timeSpeed * 0.1);
        }

        // Knowledge
        if (prev.currentEra !== Era.StoneAge) {
           r.knowledge += 0.2 * r.population * timeSpeed * 0.01;
           r.stone += 0.5 * multiplier;
        }

        return { ...prev, resources: r };
      });
      
      // Era Check
      if (gameMode === 'god') {
          checkEraProgression();
      }

    }, 100);

    return () => clearInterval(tick);
  }, [phase, timeSpeed, gameMode]);

  // -- Logic --

  const checkEraProgression = () => {
     setGodState(prev => {
        const currentIdx = ERA_ORDER.indexOf(prev.currentEra);
        if (currentIdx >= ERA_ORDER.length - 1) return prev;

        const nextEra = ERA_ORDER[currentIdx + 1];
        const reqs = ERA_REQS[nextEra];

        if (prev.resources.population >= reqs.population && prev.resources.knowledge >= reqs.knowledge) {
           triggerEvolution(nextEra);
           return { ...prev, currentEra: nextEra };
        }
        return prev;
     });
  };

  const triggerEvolution = async (newEra: Era) => {
     setTimeSpeed(0.1);
     const quote = await generateBreakthrough(newEra, language);
     setBannerMsg(`${t.era_leap}: ${quote}`);
     addLog(`${t.era_leap}: ${newEra}`);
     setTimeout(() => {
        setBannerMsg(null);
        setTimeSpeed(1);
     }, 5000);
  };

  const handleIntervene = (power: GodPower) => {
     setGodState(prev => ({
        ...prev,
        karma: Math.max(0, prev.karma - power.cost),
        interventionCount: prev.interventionCount + 1,
        ...power.effect(prev)
     }));
     
     setBannerMsg(`${t.intervention_msg}: ${power.id.toUpperCase()}`);
     addLog(`[INTERVENTION] ${power.id} initiated.`);
     setTimeout(() => setBannerMsg(null), 2000);
  };

  const handleStart = () => {
     if (inputName === "wx:forxy9") {
         setShowCheat(true);
         setInputName("");
         return;
     }
     setGodState({
        name: inputName || (language === 'zh' ? '观察者' : 'Observer'),
        karma: 1000,
        currentEra: Era.StoneAge,
        interventionCount: 0,
        startTime: Date.now(),
        resources: { wood: 0, stone: 0, food: 100, population: 10, knowledge: 0 }
     });
     setPhase('playing');
     addLog(t.log_start);
  };

  const handleRestart = () => {
     setPhase('intro');
     setInputName('');
     setLogs([]);
     setGameMode('god');
  };

  const handleAvatarMove = (x: number, y: number) => {
     // Legacy, kept for type safety with Canvas
  };

  // New Toggle Logic with Warning
  const requestDescent = () => {
      setShowDescentConfirm(true);
  };

  const confirmDescent = () => {
      setShowDescentConfirm(false);
      setGameMode('walker');
      addLog(t.mode_descend);
  };

  const handleLifeSimComplete = (stats: { karma: number; knowledge: number }) => {
      setGodState(prev => ({
          ...prev,
          karma: Math.min(1000, prev.karma + stats.karma),
          resources: {
              ...prev.resources,
              knowledge: prev.resources.knowledge + stats.knowledge
          }
      }));
      setGameMode('god'); // Ascend back upon death
      addLog(t.mode_ascend);
      setTimeout(() => addLog(t.butterfly_effect), 1000);
  };

  // -- Renders --

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative z-50">
      <h1 className="text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-4 animate-pulse font-black text-center pixel-font">
         {t.title}
      </h1>
      <p className="text-xs tracking-[0.5em] text-gray-500 mb-12 uppercase text-center">{t.subtitle}</p>
      
      <div className="glass-panel p-8 rounded-2xl max-w-md w-full flex flex-col gap-6">
         <p className="text-sm text-gray-300 leading-relaxed font-light">{t.intro_desc}</p>
         
         <div className="flex flex-col gap-2">
            <label className="text-[10px] tracking-widest text-gray-500">{t.enter_name}</label>
            <input 
               value={inputName}
               onChange={e => setInputName(e.target.value)}
               className="bg-black/30 border border-gray-700 p-4 rounded text-center text-xl text-white focus:border-cyan-500 outline-none transition-colors"
               placeholder="DEUS_01"
               maxLength={15}
            />
         </div>

         <button 
            onClick={handleStart}
            className="py-4 bg-white text-black font-bold text-xs tracking-widest uppercase hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all rounded pixel-font"
         >
            {t.begin}
         </button>
      </div>
      
      <button onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')} className="absolute top-6 right-6 text-xs text-gray-600 hover:text-white border border-gray-800 px-2 py-1 rounded">
         {language === 'en' ? '中文' : 'EN'}
      </button>

      {showCheat && (
         <CheatTerminal 
            player={godState} 
            setPlayer={setGodState} 
            onClose={() => setShowCheat(false)} 
            language={language} 
         />
      )}
    </div>
  );

  const renderHUD = () => (
     <>
       {/* Top Bar */}
       <div className="absolute top-0 left-0 w-full glass-panel border-t-0 border-x-0 p-4 pt-safe-top flex justify-between items-center z-30">
          <div className="flex items-center gap-3 md:gap-4">
             <div className={`pixel-font text-[10px] md:text-xs ${godState.karma < 100 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {t.karma} {Math.floor(godState.karma)}
             </div>
             <div className="h-3 w-[1px] bg-gray-700"></div>
             <div className="text-[10px] md:text-xs text-gray-300 font-mono">{t.pop} {Math.floor(godState.resources.population)}</div>
             <div className="text-[10px] md:text-xs text-gray-300 font-mono">{t.know} {Math.floor(godState.resources.knowledge)}</div>
          </div>
          
          <div className="text-[10px] tracking-widest uppercase text-purple-400 border border-purple-500/30 px-2 py-1 rounded bg-black/20">
             {t[('era_' + godState.currentEra.replace('Age','').toLowerCase()) as keyof typeof t]}
          </div>
       </div>

       {/* Progress Log (Text Box) */}
       <div className="absolute top-20 left-4 z-20 w-64 pointer-events-none">
          <div className="flex flex-col gap-1 items-start">
             {logs.map((log, i) => (
                <div key={i} className="bg-black/40 backdrop-blur-sm text-white/80 px-3 py-2 rounded-lg text-[10px] font-mono border-l-2 border-cyan-500/50 animate-float">
                   &gt; {log}
                </div>
             ))}
          </div>
       </div>

       {/* Central Banner */}
       {bannerMsg && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 rounded-full z-50 animate-float border border-white/20 text-center w-max max-w-[90%]">
             <p className="text-xs md:text-sm font-light tracking-wide text-white">{bannerMsg}</p>
          </div>
       )}
     </>
  );

  return (
    <div className="relative w-full h-screen bg-[#050505] text-gray-200 overflow-hidden font-sans select-none">
      
      {/* Background Watermark */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none z-0 opacity-30 text-[10px] md:text-sm tracking-[1em] font-light rotate-[-10deg]">
         wx:forxy9
      </div>

      {phase === 'intro' && renderIntro()}
      
      {phase === 'playing' && (
         <>
            <GameCanvas 
                state={godState} 
                timeSpeed={timeSpeed} 
                visualQueue={null} 
                mode={gameMode}
                avatar={avatar}
                onAvatarMove={handleAvatarMove}
            />
            
            {gameMode === 'god' && renderHUD()}
            
            <GodPanel 
               language={language} 
               karma={godState.karma} 
               onIntervene={handleIntervene} 
               timeSpeed={timeSpeed}
               setTimeSpeed={setTimeSpeed}
               mode={gameMode}
               onToggleMode={requestDescent}
            />

            {gameMode === 'walker' && (
                <LifeSimulator 
                    era={godState.currentEra}
                    language={language}
                    onComplete={handleLifeSimComplete}
                />
            )}
         </>
      )}

      {/* Descent Confirmation Overlay */}
      {showDescentConfirm && (
          <div className="absolute inset-0 z-[60] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
              <div className="max-w-md border border-red-500/50 bg-red-950/20 p-6 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                  <h2 className="text-red-500 pixel-font text-xl mb-4 flex items-center gap-2">
                     ⚠️ {t.descent_warn_title}
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed mb-8 font-mono">
                     {t.descent_warn_body}
                  </p>
                  <div className="flex gap-4">
                      <button 
                         onClick={() => setShowDescentConfirm(false)}
                         className="flex-1 py-3 border border-gray-600 text-gray-400 text-xs hover:bg-gray-800 rounded"
                      >
                          {t.descent_cancel}
                      </button>
                      <button 
                         onClick={confirmDescent}
                         className="flex-1 py-3 bg-red-900/50 border border-red-500 text-red-200 text-xs hover:bg-red-800 rounded font-bold"
                      >
                          {t.descent_confirm}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {phase === 'ending' && (
         <EndingCard 
            history={{
               godName: godState.name,
               finalEra: godState.currentEra,
               finalKarma: godState.karma,
               totalPop: godState.resources.population
            }} 
            language={language} 
            onRestart={handleRestart} 
         />
      )}

    </div>
  );
};

export default App;
