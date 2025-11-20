
import React, { useState } from 'react';
import { GodPower, Language, InterventionCategory, GameMode } from '../types';
import { TRANSLATIONS } from '../translations';

interface GodPanelProps {
  language: Language;
  karma: number;
  onIntervene: (power: GodPower) => void;
  timeSpeed: number;
  setTimeSpeed: (s: number) => void;
  mode: GameMode;
  onToggleMode: () => void;
}

const POWERS: GodPower[] = [
  // Calamities (Low Cost)
  { id: 'flood', category: 'disaster', cost: 50, icon: '🌊', color: '#00ffff', effect: (s) => ({ resources: {...s.resources, population: s.resources.population * 0.7} }) },
  { id: 'plague', category: 'disaster', cost: 60, icon: '☣️', color: '#00ff00', effect: (s) => ({ resources: {...s.resources, population: s.resources.population * 0.6} }) },
  { id: 'meteor', category: 'disaster', cost: 80, icon: '☄️', color: '#ff4400', effect: (s) => ({ resources: {...s.resources, population: s.resources.population * 0.5, wood: 0} }) },
  
  // Miracles (High Cost)
  { id: 'bloom', category: 'miracle', cost: 150, icon: '🌱', color: '#aaff00', effect: (s) => ({ resources: {...s.resources, population: s.resources.population * 1.5, food: s.resources.food + 500} }) },
  { id: 'tech', category: 'miracle', cost: 200, icon: '⚡', color: '#aa00ff', effect: (s) => ({ resources: {...s.resources, knowledge: s.resources.knowledge + 500} }) },
  { id: 'res', category: 'miracle', cost: 100, icon: '💎', color: '#ff00aa', effect: (s) => ({ resources: {...s.resources, wood: s.resources.wood + 1000, stone: s.resources.stone + 1000} }) },
];

const GodPanel: React.FC<GodPanelProps> = ({ language, karma, onIntervene, timeSpeed, setTimeSpeed, mode, onToggleMode }) => {
  const t = TRANSLATIONS[language];
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePowerClick = (p: GodPower) => {
    if (karma >= p.cost) {
      onIntervene(p);
      if (window.innerWidth < 768) setIsExpanded(false);
    }
  };

  // Walker Mode is handled by LifeSimulator overlay, so GodPanel hides usually, 
  // but we keep it mounted or null return.
  // Actually, if mode is walker, we hide this panel completely.
  if (mode === 'walker') return null;

  return (
    <>
      {/* Mobile/Desktop Bottom Bar */}
      <div className="absolute bottom-0 left-0 w-full z-40 flex flex-col justify-end pointer-events-none">
        
        {/* Control Clusters */}
        <div className="w-full p-4 flex items-end justify-between pointer-events-auto safe-area-bottom">
           
           {/* Left: Mode Switch */}
           <button 
              onClick={onToggleMode}
              className="glass-panel h-12 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold tracking-widest hover:bg-cyan-500/20 transition-colors active:scale-95 bg-black/50"
           >
              <span className="text-xl">⇩</span>
              <span className="hidden md:inline">{t.mode_descend}</span>
           </button>

           {/* Center: Time Controls */}
           <div className="glass-panel p-1 rounded-xl flex gap-1 shadow-lg backdrop-blur-xl">
              {[0.5, 1, 5, 10].map(speed => (
                <button 
                  key={speed}
                  onClick={() => setTimeSpeed(speed)}
                  className={`w-10 h-10 md:w-8 md:h-8 rounded-lg text-[10px] md:text-xs font-bold flex items-center justify-center transition-all ${timeSpeed === speed ? 'bg-white text-black shadow-md scale-105' : 'text-gray-400 hover:bg-white/10'}`}
                >
                  {speed}x
                </button>
              ))}
           </div>

           {/* Right: Powers Toggle */}
           <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`h-12 w-12 md:w-auto md:px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${isExpanded ? 'bg-white text-black' : 'glass-panel text-cyan-400 animate-pulse bg-black/50'}`}
           >
              <span className="text-xl">⚡</span>
           </button>
        </div>

        {/* Power Grid (Expands Upwards) */}
        <div className={`pointer-events-auto absolute bottom-20 right-4 md:right-4 glass-panel rounded-2xl p-4 w-[calc(100%-2rem)] md:w-80 transition-all duration-300 transform origin-bottom-right ${isExpanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'}`}>
           
           {/* Miracles */}
           <div className="mb-4">
              <h3 className="text-[10px] text-purple-400 tracking-widest uppercase mb-2 flex items-center gap-2">
                 {t.cat_miracle} <div className="h-[1px] flex-1 bg-purple-500/20"></div>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                 {POWERS.filter(p => p.category === 'miracle').map(p => (
                    <button key={p.id} onClick={() => handlePowerClick(p)} disabled={karma < p.cost} className={`flex flex-col items-center justify-center py-3 rounded-lg border border-purple-500/20 bg-purple-500/5 active:scale-95 transition-all ${karma < p.cost ? 'opacity-30 grayscale' : 'hover:bg-purple-500/20'}`}>
                       <span className="text-2xl mb-1">{p.icon}</span>
                       <span className="text-[8px] text-purple-200 uppercase">{t[('pow_' + p.id) as keyof typeof t]}</span>
                       <span className="text-[8px] bg-black/50 px-1 rounded text-white mt-1">-{p.cost}</span>
                    </button>
                 ))}
              </div>
           </div>

           {/* Disasters */}
           <div>
              <h3 className="text-[10px] text-red-400 tracking-widest uppercase mb-2 flex items-center gap-2">
                 {t.cat_disaster} <div className="h-[1px] flex-1 bg-red-500/20"></div>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                 {POWERS.filter(p => p.category === 'disaster').map(p => (
                    <button key={p.id} onClick={() => handlePowerClick(p)} disabled={karma < p.cost} className={`flex flex-col items-center justify-center py-3 rounded-lg border border-red-500/20 bg-red-500/5 active:scale-95 transition-all ${karma < p.cost ? 'opacity-30 grayscale' : 'hover:bg-red-500/20'}`}>
                       <span className="text-2xl mb-1">{p.icon}</span>
                       <span className="text-[8px] text-red-200 uppercase">{t[('pow_' + p.id) as keyof typeof t]}</span>
                       <span className="text-[8px] bg-black/50 px-1 rounded text-white mt-1">-{p.cost}</span>
                    </button>
                 ))}
              </div>
           </div>

        </div>

      </div>
    </>
  );
};

export default GodPanel;
