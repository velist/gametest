
import { GoogleGenAI } from "@google/genai";
import { Language, Era, LifeRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Reused for "Turning Point" quotes
export const generateBreakthrough = async (era: Era, lang: Language): Promise<string> => {
  try {
    const prompt = lang === 'zh'
      ? `为文明演化游戏生成一句关于${era}的极简、充满哲学感的转折点语录。少于20字。不要引号。`
      : `Generate a minimalist, philosophical quote about the transition to ${era} for a civ game. Under 15 words. No quotes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || (lang === 'zh' ? "时代变迁。" : "The era shifts.");
  } catch (e) {
    return lang === 'zh' ? "新的纪元。" : "A new age dawns.";
  }
};

export const generateFinalJudgement = async (
  godName: string, 
  finalEra: Era, 
  karma: number, 
  interventions: number, 
  lang: Language
): Promise<string> => {
  try {
    const prompt = lang === 'zh'
      ? `你是一个高维生物观察者。评价玩家"${godName}"管理的文明。最终时代：${finalEra}。剩余业力：${karma}（初始1000，越低代表干预越多）。干预次数：${interventions}。
         如果是高业力，称赞其“无为而治”；如果是低业力，评价其“控制欲”或“慈悲/残暴”。
         输出一段极简、冷峻、赛博禅意的最终审判词。少于30字。`
      : `You are a higher-dimensional observer. Judge player "${godName}". Final Era: ${finalEra}. Remaining Karma: ${karma} (Start 1000). Interventions: ${interventions}.
         High karma = praise "Wu Wei" (non-action). Low karma = comment on control or chaos.
         Output a minimalist, Cyber-Zen final judgment. Under 25 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "Observation concluded.";
  } catch (e) {
    return "Data archived.";
  }
};

const GENRES = [
  '正剧历史', '玄幻修仙', '赛博朋克', '穿越逆袭', '宫廷权谋', 
  '末世生存', '克苏鲁神话', '甜蜜言情', '悬疑推理', '无厘头搞笑'
];

export const generateLifeScenario = async (
  era: Era,
  role: LifeRole,
  age: number,
  lang: Language
): Promise<{ text: string; choices: { text: string; effectType: 'karma' | 'wealth' | 'knowledge' }[] }> => {
  try {
     // Pick a random genre to ensure 999+ possibilities
     const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
     
     const prompt = lang === 'zh'
       ? `模拟人生文字RPG。时代：${era}。角色：${role}。年龄：${age}岁。
          【强制风格：${genre}】
          请根据该风格生成一个脑洞大开的剧情节点（可无视时代限制，如石器时代修仙、古代穿越科技等）。
          包含情境描述（30字内，节奏快）和2个选择。
          格式：情境文本|选择A文本|选择B文本`
       : `Life sim text RPG. Era: ${era}. Role: ${role}. Age: ${age}.
          Theme: ${genre === '正剧历史' ? 'Standard' : 'Wild Fantasy/Sci-Fi'}.
          Generate a creative scenario (under 25 words) and 2 choices.
          Format: Scenario Text|Choice A Text|Choice B Text`;

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
     });
     
     const raw = response.text?.trim() || "";
     const parts = raw.split('|');
     
     if (parts.length >= 3) {
        return {
           text: parts[0],
           choices: [
              { text: parts[1], effectType: 'wealth' },
              { text: parts[2], effectType: 'karma' }
           ]
        };
     }
     throw new Error("Parse fail");
  } catch (e) {
     return {
        text: lang === 'zh' ? "虚空震荡，你看到了一些不可名状的幻象。" : "Reality glitches.",
        choices: [
           { text: lang === 'zh' ? "凝视深渊" : "Stare", effectType: 'knowledge' },
           { text: lang === 'zh' ? "转身离开" : "Leave", effectType: 'wealth' }
        ]
     };
  }
};

export const generateLifeOutcome = async (
  era: Era,
  role: LifeRole,
  action: string,
  lang: Language
): Promise<string> => {
  try {
    // Prompt optimized for speed (short token count)
    const prompt = lang === 'zh'
      ? `模拟人生：时代${era}，角色${role}，做了"${action}"。
         生成一句极简的、带有宿命感的后果描述或旁白。30字以内。`
      : `Life sim: Era ${era}, Role ${role}, Action "${action}".
         Generate a short philosophical consequence. Under 20 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || (lang === 'zh' ? "世界线变动。" : "Timeline shifted.");
  } catch (e) {
    return lang === 'zh' ? "因果已定。" : "Fate sealed.";
  }
};

// Legacy support
export const generateTribeLore = async () => "Protocol Initiated.";
export const generateRandomName = async () => "Unit-734";
export const generatePhilosophy = async (era: Era, lang: Language) => {
   return generateBreakthrough(era, lang); 
};
