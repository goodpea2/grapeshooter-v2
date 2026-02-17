
import { ROOM_PREFABS, RoomPrefab } from '../dictionaryRoomPrefab';

interface StepDefinition {
  notes: string;
  rooms: number;
  levelMin: number;
  levelMax: number;
  lvMinIncr: string | number; // Support "0..1" notation
  lvMaxIncr: number;
  weights: Record<string, number>;
}

const INTRO_STEPS: StepDefinition[] = [
  { notes: 'start', rooms: 1, levelMin: 1, levelMax: 2, lvMinIncr: 0, lvMaxIncr: 0, weights: { tut: 1 } },
  { notes: 'empty', rooms: 8, levelMin: 1, levelMax: 5, lvMinIncr: 0, lvMaxIncr: 0, weights: { emt: 100, tre: 1 } },
];

const LOOP_STEPS: StepDefinition[] = [
  { notes: 'explore', rooms: 8, levelMin: 1, levelMax: 5, lvMinIncr: 0, lvMaxIncr: 0, weights: { emt: 8, sun: 1, crt: 1, xpl: 1 } },
  { notes: 'fight', rooms: 2, levelMin: 1, levelMax: 2, lvMinIncr: "0..1", lvMaxIncr: 1, weights: { mon: 50, spw: 40, bos: 1 } },
  { notes: 'loot', rooms: 2, levelMin: 1, levelMax: 5, lvMinIncr: 0, lvMaxIncr: 0, weights: { sun: 3, crt: 1, emt: 1 } },
  { notes: 'explore', rooms: 8, levelMin: 1, levelMax: 5, lvMinIncr: 0, lvMaxIncr: 0, weights: { emt: 8, sun: 1, crt: 1, xpl: 3 } },
  { notes: 'fight', rooms: 2, levelMin: 1, levelMax: 2, lvMinIncr: "0..1", lvMaxIncr: 1, weights: { mon: 8, spw: 10, emt: 1 } },
  { notes: 'npc', rooms: 1, levelMin: 1, levelMax: 1, lvMinIncr: 0, lvMaxIncr: 1, weights: { npc: 1 } },
  { notes: 'explore', rooms: 8, levelMin: 1, levelMax: 5, lvMinIncr: 0, lvMaxIncr: 0, weights: { emt: 8, sun: 1, crt: 1, xpl: 1 } },
  { notes: 'fight', rooms: 2, levelMin: 1, levelMax: 2, lvMinIncr: "0..1", lvMaxIncr: 1, weights: { mon: 3, spw: 4, ftr: 0, emt: 1 } },
  { notes: 'loot', rooms: 2, levelMin: 1, levelMax: 5, lvMinIncr: 0, lvMaxIncr: 0, weights: { sun: 5, crt: 7, tre: 1 } },
  { notes: 'explore', rooms: 8, levelMin: 1, levelMax: 5, lvMinIncr: 0, lvMaxIncr: 0, weights: { emt: 8, sun: 1, crt: 1, xpl: 3 } },
  { notes: 'npc', rooms: 1, levelMin: 1, levelMax: 1, lvMinIncr: 1, lvMaxIncr: 1, weights: { npc: 1 } },
  { notes: 'boss', rooms: 1, levelMin: 1, levelMax: 2, lvMinIncr: "0..1", lvMaxIncr: 1, weights: { bos: 1 } },
  { notes: 'treasure', rooms: 1, levelMin: 1, levelMax: 2, lvMinIncr: "0..1", lvMaxIncr: 1, weights: { tre: 1 } },
];

const TYPE_POOLS: Record<string, string[]> = {
  tut: ['tut0'],
  tre: ['tre1', 'tre2', 'tre3'],
  emt: ['emt0'],
  sun: ['sun1', 'sun2', 'sun3', 'sun4', 'sun5'],
  crt: ['crt1', 'crt2', 'crt3'],
  xpl: ['xpl1', 'xpl2', 'xpl3'],
  mon: ['mon1', 'mon2', 'mon3', 'mon4', 'mon5'],
  spw: ['spw1', 'spw2', 'spw3', 'spw4', 'spw5'],
  bos: ['bos1', 'bos2', 'bos3', 'bos4', 'bos5'],
  npc: ['npc1', 'npc2', 'npc3'],
  ftr: ['emt0']
};

function pickPrefab(type: string, lvMin: number, lvMax: number, targetValue: number): string {
  const ids = TYPE_POOLS[type] || ['emt0'];
  const candidates = ROOM_PREFABS.filter(p => ids.includes(p.id));
  
  const lMin = Math.max(1, Math.floor(lvMin));
  const lMax = Math.max(1, Math.floor(lvMax));
  
  let valid = candidates.filter(p => p.roomLevel >= lMin && p.roomLevel <= lMax);
  if (valid.length === 0) valid = candidates; 

  valid.sort((a, b) => Math.abs(a.roomValue - targetValue) - Math.abs(b.roomValue - targetValue));
  
  const pool = valid.slice(0, 3);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function generateRoomDirectorData(): string {
  const chain: string[] = [];
  let accumulatedValue = 0;
  let targetTotalValue = 0;

  // 1. Process Intro Steps (Once)
  for (const step of INTRO_STEPS) {
    for (let r = 0; r < step.rooms; r++) {
      const weights = step.weights;
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let chosenCategory = Object.keys(weights)[0];
      for (const [cat, w] of Object.entries(weights)) {
        if (rand < w) { chosenCategory = cat; break; }
        rand -= w;
      }
      const prefabId = pickPrefab(chosenCategory, step.levelMin, step.levelMax, 0);
      const prefab = ROOM_PREFABS.find(p => p.id === prefabId)!;
      accumulatedValue += prefab.roomValue;
      chain.push(prefabId);
    }
  }

  // 2. Process Looping Steps a finite number of times (e.g. 10 cycles)
  const dynamicMin = LOOP_STEPS.map(s => s.levelMin);
  const dynamicMax = LOOP_STEPS.map(s => s.levelMax);

  for (let cycle = 0; cycle < 10; cycle++) {
    for (let sIdx = 0; sIdx < LOOP_STEPS.length; sIdx++) {
      const step = LOOP_STEPS[sIdx];
      targetTotalValue -= 15; 
      
      for (let r = 0; r < step.rooms; r++) {
        const weights = step.weights;
        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let chosenCategory = Object.keys(weights)[0];
        for (const [cat, w] of Object.entries(weights)) {
          if (rand < w) { chosenCategory = cat; break; }
          rand -= w;
        }

        const neededValue = (targetTotalValue - accumulatedValue) / Math.max(1, (step.rooms - r));
        const prefabId = pickPrefab(chosenCategory, dynamicMin[sIdx], dynamicMax[sIdx], neededValue);
        
        const prefab = ROOM_PREFABS.find(p => p.id === prefabId)!;
        accumulatedValue += prefab.roomValue;
        chain.push(prefabId);
      }

      const minIncr = step.lvMinIncr;
      if (typeof minIncr === 'string' && minIncr === "0..1") {
        dynamicMin[sIdx] += (Math.random() < 0.5 ? 1 : 0);
      } else {
        dynamicMin[sIdx] += Number(minIncr);
      }
      dynamicMax[sIdx] += step.lvMaxIncr;
      dynamicMin[sIdx] = Math.min(5, dynamicMin[sIdx]);
      dynamicMax[sIdx] = Math.min(6, dynamicMax[sIdx]);
    }
  }

  return chain.join('-');
}
