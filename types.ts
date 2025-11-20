
export enum Era {
  StoneAge = 'StoneAge',
  BronzeAge = 'BronzeAge',
  IronAge = 'IronAge',
  ModernAge = 'ModernAge',
  FutureAge = 'FutureAge'
}

export interface Resources {
  wood: number;
  stone: number;
  food: number;
  population: number;
  knowledge: number;
}

export interface GodState {
  name: string;
  karma: number; // Starts at 1000, decreases with interventions
  currentEra: Era;
  resources: Resources;
  startTime: number;
  interventionCount: number;
}

export type Player = GodState;

export type GameMode = 'god' | 'walker';

export interface AvatarState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
}

export interface CharacterAppearance {
  skinColor: string;
  hairColor: string;
}

export type GamePhase = 'intro' | 'playing' | 'ending' | 'advancing';

export type Language = 'en' | 'zh';

export interface HistoryRecord {
  godName: string;
  finalEra: Era;
  finalKarma: number;
  totalPop: number;
  judgment: string; // Gemini generated
  timestamp: number;
  legacyCode: string; 
}

export type CardRarity = 'Lost' | 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Divine';

export type InterventionCategory = 'time' | 'disaster' | 'miracle';

export interface GodPower {
  id: string;
  category: InterventionCategory;
  cost: number;
  icon: string; // emoji or char
  color: string; // hex for glow
  effect: (state: GodState) => Partial<GodState>; // Returns changed props
}

export interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface EraRequirements {
  wood: number;
  stone: number;
  food: number;
  population: number;
  knowledge: number;
}

// --- Life Simulator Types ---

export type LifeRole = 'leader' | 'worker' | 'warrior' | 'scholar' | 'merchant' | 'artist' | 'ceo' | 'politician' | 'android' | 'hacker';

export interface LifeStage {
  age: number; // 0, 20, 40, 60
  eventText: string;
  choices: {
    text: string;
    effectType: 'karma' | 'wealth' | 'knowledge';
  }[];
}

export interface LifeResult {
  finalAge: number;
  lifeSummary: string;
  knowledgeGained: number;
  karmaRestored: number;
}
