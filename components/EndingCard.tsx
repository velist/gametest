import React, { useEffect, useState } from 'react';
import { HistoryRecord, CardRarity, Language, Era } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateFinalJudgement } from '../services/geminiService';

interface EndingCardProps {
  history: Partial<HistoryRecord>;
  language: Language;
  onRestart: () => void;
}

const EndingCard: React.FC<EndingCardProps> = ({ history, language, onRestart }) => {
  const t = TRANSLATIONS[language];
  const [judgment, setJudgment] = useState("Analyzing...");
  
  // Determine Rarity based on Karma
  const karma = history.finalKarma || 0;
  let rarity: CardRarity = 'Common';
  let borderColor = 'border-gray-600';
  let glow = 'shadow-none';

  if (karma <= 0) { rarity = 'Lost'; borderColor = 'border-red-900'; glow = 'shadow-[0_0_30px_rgba(255,0,0,0.3)]'; }
  else if (karma < 300) { rarity = 'Common'; borderColor = 'border-gray-500'; }
  else if (karma < 600) { rarity = 'Rare'; borderColor = 'border-cyan-500'; glow = 'shadow-[0_0_20px_rgba(34,211,238,0.3)]'; }
  else if (karma < 900) { rarity = 'Epic'; borderColor = 'border-purple-500'; glow = 'shadow-[0_0_30px_rgba(216,70,239,0.4)]'; }
  else { rarity = 'Divine'; borderColor = 'border-yellow-400'; glow = 'shadow-[0_0_50px_rgba(250,204,21,0.6)]'; }

  useEffect(() => {
     generateFinalJudgement(
       history.godName || 'Unknown', 
       history.finalEra || Era.StoneAge, 
       history.finalKarma || 0, 
       0, // intervention count not passed in partial, assuming logic elsewhere or simplified
       language
     ).then(setJudgment);
  }, []);

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className={`relative w-full max-w-md p-8 rounded-2xl border-2 ${borderColor} ${glow} bg-black/80 flex flex-col items-center overflow-hidden`}>
        
        {/* Iridescent Overlay for Divine */}
        {rarity === 'Divine' && <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-30 pointer-events-none"></div>}

        <div className="mb-6 text-xs font-bold tracking-[0.5em] uppercase text-gray-500">{t.judgement_title}</div>

        <h1 className="text-4xl font-bold text-white mb-2 pixel-font text-center">{history.godName}</h1>
        
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 border ${borderColor} text-white bg-white/5`}>
           Rarity: {rarity}
        </div>

        <div className="w-full space-y-4 font-mono text-xs text-gray-300 mb-8">
           <div className="flex justify-between border-b border-white/10 pb-2">
              <span>{t.era_progress}</span>
              <span className="text-white">{history.finalEra}</span>
           </div>
           <div className="flex justify-between border-b border-white/10 pb-2">
              <span>{t.karma}</span>
              <span className={`${karma > 500 ? 'text-green-400' : 'text-red-400'}`}>{history.finalKarma}</span>
           </div>
           <div className="flex justify-between border-b border-white/10 pb-2">
              <span>{t.pop}</span>
              <span className="text-cyan-400">{Math.floor(history.totalPop || 0)}</span>
           </div>
        </div>

        {/* Judgment Text */}
        <div className="w-full bg-white/5 p-4 rounded-lg border-l-2 border-white mb-8 italic text-gray-300 text-sm leading-relaxed">
           "{judgment}"
        </div>

        <div className="text-[10px] text-gray-600 mb-4 font-mono">AUTH: wx:forxy9</div>

        <button 
           onClick={onRestart}
           className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
        >
           {t.restart}
        </button>
      </div>
    </div>
  );
};

export default EndingCard;