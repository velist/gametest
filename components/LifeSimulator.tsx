
import React, { useState, useEffect, useRef } from 'react';
import { Era, LifeRole, LifeStage, Language } from '../types';
import { generateLifeScenario, generateLifeOutcome } from '../services/geminiService';
import { TRANSLATIONS } from '../translations';

interface LifeSimulatorProps {
  era: Era;
  language: Language;
  onComplete: (stats: { karma: number; knowledge: number }) => void;
}

const ROLES_BY_ERA: Record<Era, { id: LifeRole; label: string; desc: string }[]> = {
  [Era.StoneAge]: [
    { id: 'leader', label: '部落首领', desc: 'Leader' },
    { id: 'worker', label: '采集者', desc: 'Gatherer' },
    { id: 'warrior', label: '猎手', desc: 'Hunter' }
  ],
  [Era.BronzeAge]: [
    { id: 'leader', label: '君主', desc: 'King' },
    { id: 'merchant', label: '行商', desc: 'Merchant' },
    { id: 'warrior', label: '士兵', desc: 'Soldier' }
  ],
  [Era.IronAge]: [
    { id: 'scholar', label: '谋士', desc: 'Scholar' },
    { id: 'merchant', label: '富贾', desc: 'Merchant' },
    { id: 'warrior', label: '将军', desc: 'General' }
  ],
  [Era.ModernAge]: [
    { id: 'ceo', label: '资本家', desc: 'CEO' },
    { id: 'artist', label: '艺术家', desc: 'Artist' },
    { id: 'politician', label: '政客', desc: 'Politician' }
  ],
  [Era.FutureAge]: [
    { id: 'hacker', label: '黑客', desc: 'Hacker' },
    { id: 'android', label: '仿生人', desc: 'Android' },
    { id: 'leader', label: '元首', desc: 'Overseer' }
  ]
};

const LifeSimulator: React.FC<LifeSimulatorProps> = ({ era, language, onComplete }) => {
  const t = TRANSLATIONS[language];
  const [phase, setPhase] = useState<'select' | 'playing' | 'reflection' | 'summary'>('select');
  const [role, setRole] = useState<LifeRole>('worker');
  const [age, setAge] = useState(0);
  const [scenario, setScenario] = useState<{ text: string; choices: any[] } | null>(null);
  const [outcomeText, setOutcomeText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Stats
  const [accumulatedKarma, setAccumulatedKarma] = useState(0);
  const [accumulatedKnow, setAccumulatedKnow] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  // Optimization: Pre-fetch Next Scenario
  const nextScenarioPromise = useRef<Promise<any> | null>(null);

  // Step 1: Select Role
  const handleRoleSelect = (r: LifeRole) => {
    setRole(r);
    setPhase('playing');
    setAge(10); // Start at 10
    loadNextScenario(10, r);
  };

  // Step 2: Load Scenario (Initial)
  const loadNextScenario = async (currentAge: number, currentRole: LifeRole) => {
    setLoading(true);
    const data = await generateLifeScenario(era, currentRole, currentAge, language);
    setScenario(data);
    setLoading(false);
  };

  // Step 3: Handle Choice -> Reflection + Pre-load Next
  const handleChoice = async (choiceIdx: number) => {
     if (!scenario) return;
     
     const choice = scenario.choices[choiceIdx];
     setLoading(true);
     
     // 1. Rewards
     if (choice.effectType === 'karma') setAccumulatedKarma(k => k + 50);
     if (choice.effectType === 'wealth') setAccumulatedKnow(k => k + 100);
     if (choice.effectType === 'knowledge') setAccumulatedKnow(k => k + 200);
     
     // 2. Start fetching Outcome (Display immediately after)
     const outcomePromise = generateLifeOutcome(era, role, choice.text, language);
     
     // 3. Start fetching NEXT Scenario in parallel (Background loading)
     const nextAge = age + 15;
     if (nextAge <= 70) {
        nextScenarioPromise.current = generateLifeScenario(era, role, nextAge, language);
     } else {
        nextScenarioPromise.current = null;
     }

     const eventLog = `${age}岁: ${scenario.text} -> ${choice.text}`;
     setHistory(prev => [...prev, eventLog]);

     // Wait for outcome text only (Fast)
     const outcome = await outcomePromise;
     setOutcomeText(outcome);
     
     setLoading(false);
     setPhase('reflection');
  };

  // Step 4: Continue from Reflection (Instant if pre-load done)
  const handleContinue = async () => {
      const nextAge = age + 15;
      
      if (nextAge > 70) {
         setPhase('summary');
         return;
      }

      setLoading(true); // Should be brief
      try {
         // Retrieve pre-fetched data
         const data = await nextScenarioPromise.current;
         if (data) {
            setScenario(data);
            setAge(nextAge);
            setPhase('playing');
         } else {
            // Fallback if promise missing (rare)
            loadNextScenario(nextAge, role);
         }
      } catch (e) {
         // Retry if failed
         loadNextScenario(nextAge, role);
      }
      setLoading(false);
  };

  // Renders
  if (phase === 'select') {
    const options = ROLES_BY_ERA[era] || ROLES_BY_ERA[Era.StoneAge];
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-lg p-6">
          <h2 className="text-center text-2xl text-cyan-400 pixel-font mb-8 animate-pulse">{t.life_select_role}</h2>
          <div className="grid grid-cols-1 gap-4">
             {options.map(opt => (
               <button 
                 key={opt.id}
                 onClick={() => handleRoleSelect(opt.id)}
                 className="flex items-center justify-between p-4 border border-gray-700 hover:border-cyan-500 bg-gray-900/50 hover:bg-cyan-900/20 transition-all group"
               >
                 <span className="text-lg font-bold text-gray-200 group-hover:text-white">{language === 'zh' ? opt.label : opt.desc}</span>
                 <span className="text-xs text-gray-500 font-mono group-hover:text-cyan-300">&gt;&gt; SELECT</span>
               </button>
             ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
         <div className="w-full max-w-md p-8 border-2 border-white bg-black">
            <h2 className="text-3xl text-white pixel-font mb-2">{t.life_died}</h2>
            <p className="text-gray-500 text-xs mb-6 tracking-widest">SIMULATION COMPLETE</p>
            
            <div className="space-y-2 font-mono text-xs text-gray-300 mb-8 h-48 overflow-y-auto border-y border-gray-800 py-4 scrollbar-thin">
               {history.map((h, i) => <div key={i} className="mb-2 border-b border-white/5 pb-1">{h}</div>)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="p-3 border border-green-900 bg-green-900/10">
                  <div className="text-[10px] text-green-500 uppercase">{t.karma} RESTORED</div>
                  <div className="text-xl text-white">+{accumulatedKarma}</div>
               </div>
               <div className="p-3 border border-blue-900 bg-blue-900/10">
                  <div className="text-[10px] text-blue-500 uppercase">{t.know} GAINED</div>
                  <div className="text-xl text-white">+{accumulatedKnow}</div>
               </div>
            </div>

            <button 
               onClick={() => onComplete({ karma: accumulatedKarma, knowledge: accumulatedKnow })}
               className="w-full py-4 bg-white text-black font-bold hover:bg-gray-200 pixel-font text-xs"
            >
               {t.life_return}
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500">
      <div className="w-full max-w-2xl p-8 relative">
         
         {/* Retro Monitor Frame */}
         <div className={`absolute inset-0 border-4 ${phase === 'reflection' ? 'border-cyan-500/50 shadow-[0_0_100px_rgba(34,211,238,0.2)]' : 'border-gray-800'} rounded-lg pointer-events-none transition-all duration-1000`}></div>
         
         {/* Screen Content */}
         <div className="relative z-10 flex flex-col gap-6 min-h-[400px]">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-gray-700 pb-4 opacity-80">
               <div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase">{t.life_select_role}: {role.toUpperCase()}</div>
                  <div className="text-4xl text-white font-black pixel-font">{t.life_age}: {age}</div>
               </div>
               <div className="text-right">
                   <div className="text-xs text-green-500">KARMA: +{accumulatedKarma}</div>
                   <div className="text-xs text-blue-500">DATA: +{accumulatedKnow}</div>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
               {loading ? (
                  <div className="animate-pulse text-cyan-500 pixel-font tracking-widest">CALCULATING_CAUSALITY...</div>
               ) : phase === 'reflection' ? (
                   <div className="animate-fade-in w-full">
                      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-8 opacity-50"></div>
                      <p className="text-xl md:text-2xl text-gray-100 font-serif leading-loose italic mb-8 text-shadow-glow">
                         "{outcomeText}"
                      </p>
                      <div className="text-xs text-cyan-400 mb-8 tracking-[0.5em] uppercase animate-pulse">
                         World Line Altered
                      </div>
                      <button 
                         onClick={handleContinue}
                         className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-mono font-medium tracking-tighter text-white bg-gray-800 rounded-lg group w-full md:w-auto"
                      >
                         <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-cyan-500 rounded-full group-hover:w-80 group-hover:h-80 opacity-10"></span>
                         <span className="relative flex items-center justify-center gap-2 text-xs tracking-widest">
                            {t.life_continue} <span>&gt;&gt;</span>
                         </span>
                      </button>
                   </div>
               ) : (
                  <div className="animate-fade-in-up">
                    <p className="text-lg md:text-2xl text-gray-200 leading-loose font-serif">
                        {scenario?.text}
                    </p>
                  </div>
               )}
            </div>

            {/* Choices (Only show if playing, not in reflection) */}
            {phase === 'playing' && !loading && (
                <div className="grid grid-cols-1 gap-4 mt-auto">
                {scenario?.choices.map((c, i) => (
                    <button 
                        key={i}
                        onClick={() => handleChoice(i)}
                        className="p-5 border border-gray-600 bg-black/40 hover:bg-gray-800 hover:border-cyan-400 text-left transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-cyan-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        <span className="relative z-10 text-cyan-500 font-mono mr-4">0{i+1}.</span>
                        <span className="relative z-10 text-gray-300 group-hover:text-white text-sm md:text-base tracking-wide">{c.text}</span>
                    </button>
                ))}
                </div>
            )}

         </div>
      </div>
    </div>
  );
};

export default LifeSimulator;
