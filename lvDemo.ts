
import { state } from './state';
import { HOUR_FRAMES, GRID_SIZE } from './constants';
import { enemyTypes } from './balanceEnemies';
import { liquidTypes } from './balanceLiquids';
import { getTime } from './ui';
import { SunLoot, Enemy } from './entities';
import { ECONOMY_CONFIG } from './economy';
import { Bullet } from './entities';

declare const random: any;
declare const cos: any;
declare const sin: any;
declare const frameCount: any;
declare const floor: any;

// export const customBudgetPerNight = [100, 250, 500, 1000, 1800, 3200, 5600, 8000, 11000, 12500]; // old
export const customBudgetPerNight = [100, 250, 500, 850, 1500, 2600, 4500, 6700, 8000, 10000]; // new with roomDirector
export const customDayLightConfig = '000011222222222222110000'; // 0: Night, 1: Transition, 2: Day
export const customStartingHour = 6;

export function getLightLevel(hour: number): number {
  const h = floor(hour) % 24;
  return parseInt(customDayLightConfig[h]);
}

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
  "3_night": [1,   1,   1,   0,   0.5, 0,   0,   0],
  "4_day":   [1,   1,   0.5, 0,   0,   0,   0,   0],
  "5_night": [0.5, 1,   1,   0.5, 1,   0.5, 0,   0],
  "6_day":   [0,   1,   0.5, 0,   0,   0,   0,   0],
  "7_night": [0,   0,   0,   0,   1,   1,   1,   0],
  "8_day":   [1,   1,   1,   0,   0,   0,   0,   0],
  "9_night": [0,   0,   0.5, 0.5, 0,   1,   1,   0],
};

const ENEMY_KEYS = ['e_basic', 'e_armor1', 'e_armor2', 'e_armor3', 'e_shooting', 'e_swarm', 'e_giant', 'e_critter'];

function getWeightsForCurrentTime() {
  const t = getTime();
  const isNight = getLightLevel(t.hour) === 0;
  const dayKey = Math.min(t.day, 10);
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

/**
 * Global helper to request a spawn with a portal VFX
 */
export function requestSpawn(x: number, y: number, typeKey: string) {
  state.pendingSpawns.push({
    x, y, 
    type: typeKey,
    timer: 60
  });
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
      requestSpawn(x, y, ek);
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
  const lightLevel = getLightLevel(t.hour);
  const isNight = lightLevel === 0;

  // BUDGET SCALING FIX: Update currentNightWaveBudget baseline every frame based on the current day
  const nightIdx = Math.min(t.day - 1, customBudgetPerNight.length - 1);
  let baseBudget = customBudgetPerNight[nightIdx];
  if (t.day > customBudgetPerNight.length) {
     // Scaled growth beyond array limits
     baseBudget = customBudgetPerNight[customBudgetPerNight.length - 1] * Math.pow(1.2, t.day - customBudgetPerNight.length);
  }
  state.currentNightWaveBudget = baseBudget;

  // Process Pending Spawns
  for (let i = state.pendingSpawns.length - 1; i >= 0; i--) {
    const s = state.pendingSpawns[i];
    s.timer--;
    if (s.timer <= 0) {
      state.enemies.push(new Enemy(s.x, s.y, s.type));
      state.pendingSpawns.splice(i, 1);
    }
  }

  // Process Ticking Explosives (TNT)
  for (let i = state.tickingExplosives.length - 1; i >= 0; i--) {
    const tex = state.tickingExplosives[i];
    tex.timer--;
    if (tex.timer <= 0) {
      // Explode
      let b = new Bullet(tex.x, tex.y, tex.x, tex.y, 'b_tnt_explosion', 'none');
      b.life = 0; 
      state.bullets.push(b);
      state.tickingExplosives.splice(i, 1);
    }
  }

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

  // Detect transition into night state (light level changes from non-zero to zero)
  const prevHour = (t.totalHours * HOUR_FRAMES - 1) / HOUR_FRAMES;
  const prevLightLevel = getLightLevel(floor(prevHour));
  
  if (isNight && prevLightLevel !== 0 && state.lastNightTriggered !== t.day) {
    state.lastNightTriggered = t.day;
    // Trigger the big wave
    spawnFromBudget(state.currentNightWaveBudget);
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
