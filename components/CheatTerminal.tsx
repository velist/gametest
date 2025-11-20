import React, { useState } from 'react';
import { Player, Language, Resources } from '../types';
import { TRANSLATIONS } from '../translations';

interface CheatTerminalProps {
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  onClose: () => void;
  language: Language;
}

const CheatTerminal: React.FC<CheatTerminalProps> = ({ player, setPlayer, onClose, language }) => {
  const [resources, setResources] = useState(player.resources);
  const t = TRANSLATIONS[language];

  const handleChange = (key: keyof Resources, val: string) => {
    setResources(prev => ({ ...prev, [key]: parseInt(val) || 0 }));
  };

  const handleSubmit = () => {
    // The philosophical warning alert
    if (window.confirm(t.cheat_warning)) {
      setPlayer(prev => ({ ...prev, resources }));
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-95 font-mono">
      <div className="bg-black border border-green-500 p-6 w-[400px] shadow-[0_0_20px_rgba(0,255,0,0.2)]">
        <div className="flex justify-between items-center mb-4 border-b border-green-900 pb-2">
          <h2 className="text-green-500 text-lg blink">{t.cheat_title} &gt;_</h2>
          <button onClick={onClose} className="text-red-500 hover:text-white">X</button>
        </div>

        <div className="space-y-4 text-green-400 text-sm">
          {Object.entries(resources).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="uppercase">{key}</span>
              <input 
                type="number" 
                value={val as number} 
                onChange={(e) => handleChange(key as keyof Resources, e.target.value)}
                className="bg-zinc-900 border border-green-700 text-white w-24 px-2 py-1 text-right focus:border-green-400 outline-none"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-green-900">
            <p className="text-[10px] text-green-700 mb-4 text-center italic">
                root@world:~# sudo modify_reality
            </p>
            <button 
                onClick={handleSubmit}
                className="w-full bg-green-900 hover:bg-green-700 text-green-100 py-2 text-xs tracking-widest uppercase transition-colors"
            >
                {t.cheat_submit}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CheatTerminal;