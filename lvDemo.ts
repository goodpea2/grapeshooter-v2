
import { state } from './state';
import { HOUR_FRAMES, GRID_SIZE } from './constants';
import { enemyTypes } from './balanceEnemies';
import { liquidTypes } from './balanceLiquids';
import { getTime } from './ui';
import { SunLoot, Enemy } from './entities';
import { ECONOMY_CONFIG } from './economy';

declare const random: any;
declare const cos: any;
declare const sin: any;
declare const frameCount: any;
declare const floor: any;

export const worldGenConfig = {
  liquidNoiseScale: 0.015,
  riverNoiseScale: 0.04,
  lakeThreshold: 0.7,
  riverThreshold: 0.06,
  blockNoiseScale: 0.1,
  blockThreshold: 0.4,
  liquidClumpScale: 0.07,
  spawnClearRadius: 5,
  noiseOffsetLakes: 20000,
  noiseOffsetRivers: 30000,
  noiseOffsetClumping: 40000,
  noiseOffsetBlocks: 10000
};

// Enemy weight matrix based on the provided table
const SPAWN_WEIGHTS: Record<string, number[]> = {
  "1_day":   [1,   0,   0,   0,   0,   0,   0,   0],
  "1_night": [1,   1,   0,   0,   0,   0,   0,   0],
  "2_day":   [1,   1,   0,   0,   0,   0,   0,   0],
  "2_night": [1,   1,   1,   0,   0.5, 0,   0,   0],
  "3_day":   [1,   1,   0.5, 0,   0,   0,   0,   0],
  "3_night": [0.5, 1,   1,   0.5, 1,   0.5, 0,   0],
  "4_day":   [0,   1,   0.5, 0,   0,   0,   0,   0],
  "4_night": [0,   0,   0,   0,   1,   1,   1,   0],
  "5_day":   [1,   1,   1,   0,   0,   0,   0,   0],
  "5_night": [0,   0,   0.5, 0.5, 0,   1,   1,   0],
};

const ENEMY_KEYS = ['e_basic', 'e_armor1', 'e_armor2', 'e_armor3', 'e_shooting', 'e_swarm', 'e_giant', 'e_critter'];

function getWeightsForCurrentTime() {
  const t = getTime();
  const isNight = (t.hour >= 21 || t.hour < 4);
  const dayKey = Math.min(t.day, 5);
  const key = `${dayKey}_${isNight ? 'night' : 'day'}`;
  return SPAWN_WEIGHTS[key] || SPAWN_WEIGHTS["5_night"];
}

export function isLegibleSpot(x: number, y: number): boolean {
  if (state.world.isBlockAt(x, y)) return false;
  const gx = floor(x / GRID_SIZE);
  const gy = floor(y / GRID_SIZE);
  const liqKey = state.world.getLiquidAt(gx, gy);
  if (liqKey) {
    const lCfg = liquidTypes[liqKey];
    if (lCfg.isDanger) return false; // Don't spawn in Lava
  }
  return true;
}

export function spawnFromBudget(amount: number) {
  let spent = 0;
  let limit = 40; 
  const weights = getWeightsForCurrentTime();

  while(spent < amount && limit > 0) {
    limit--;
    let pool = ENEMY_KEYS.filter((k, idx) => {
      const weight = weights[idx];
      return weight > 0 && enemyTypes[k].cost <= (amount - spent);
    });

    if (pool.length === 0) break;

    let totalWeight = pool.reduce((acc, k) => acc + weights[ENEMY_KEYS.indexOf(k)], 0);
    let r = random(totalWeight);
    let sum = 0;
    let ek = pool[0];
    for (let k of pool) {
      sum += weights[ENEMY_KEYS.indexOf(k)];
      if (r <= sum) {
        ek = k;
        break;
      }
    }

    let ang = random(Math.PI * 2);
    let distR = random(12, 18) * GRID_SIZE;
    let x = state.player.pos.x + cos(ang) * distR;
    let y = state.player.pos.y + sin(ang) * distR;
    
    // Check environmental legibility and collision
    if (isLegibleSpot(x, y) && !state.world.checkCollision(x, y, enemyTypes[ek].size * 0.5)) {
      state.enemies.push(new Enemy(x, y, ek));
      const cost = enemyTypes[ek].cost;
      spent += cost;
      state.accumulatedSpentBudget += cost;
    }
  }
}

export function updateGameSystems() {
  if (state.timeWarpRemaining > 0) {
    state.frames += 120;
    state.timeWarpRemaining--;
  }

  const t = getTime();
  const isNight = (t.hour >= 21 || t.hour < 4);

  if (!isNight && state.frames % ECONOMY_CONFIG.sunSpawnInterval === 0) {
    const ang = random(Math.PI * 2);
    const distR = random(ECONOMY_CONFIG.sunSpawnMinDist, ECONOMY_CONFIG.sunSpawnMaxDist) * GRID_SIZE;
    const x = state.player.pos.x + cos(ang) * distR;
    const y = state.player.pos.y + sin(ang) * distR;
    
    if (isLegibleSpot(x, y)) {
      state.loot.push(new SunLoot(x, y, 1));
      state.sunSpawnedTotal += 1;
    }
  }

  if (t.hour === 21 && state.lastNightTriggered !== t.day) {
    state.lastNightTriggered = t.day;
    spawnFromBudget(state.currentNightWaveBudget);
    state.currentNightWaveBudget = state.currentNightWaveBudget * 1.5 + 60;
  }

  const floorHour = floor(t.totalHours);
  if (floorHour !== state.lastHourProcessed) {
    state.lastHourProcessed = floorHour;
    let baseNight = 10;
    let baseDay = 5;
    let nightLvl = t.day - 1;
    let dayLvl = Math.max(0, t.day - 2);

    if (isNight) {
      state.hourlyBudgetPool += baseNight + (nightLvl * 5);
    } else if (t.day >= 2) {
      state.hourlyBudgetPool += baseDay + (dayLvl * 3);
    }
  }

  if (state.hourlyBudgetPool >= 10 && frameCount % 600 === 0) {
    let chunk = Math.min(state.hourlyBudgetPool, 40);
    spawnFromBudget(chunk);
    state.hourlyBudgetPool -= chunk;
  }
}
