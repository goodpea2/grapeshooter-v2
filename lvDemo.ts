
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

export const customBudgetPerNight = [150, 300, 500, 800, 1400, 2400, 4000, 7000, 12000, 18000]; // new with roomDirector
export const customDayLightConfig = '000011222222222222110000'; // 0: Night, 1: Transition, 2: Day
export const customStartingHour = 6;

export const AlmanacProgression = {
  StartingTurret: [
    't_pea', 't_laser', 't_wall', 't_mine', 't_ice', // Tier 1
    't_sunflower', 't_lilypad', 't_seed', 't_seed2', // Special
    't0_cherrybomb','t0_firecherry', 't0_jalapeno', 't0_iceshroom', 't0_starfruit', 't0_grapeshot', 't0_puffshroom', // consumable
    't2_repeater', 't2_laser2', 't2_tall', 't2_minespawner', 't2_stun' // Specific Tier 2
  ],
  LockedTurret: [
    { type: 't2_firepea', weight: 10 }, { type: 't2_peanut', weight: 10 }, { type: 't2_mortar', weight: 10 }, { type: 't2_snowpea', weight: 10 }, { type: 't2_puncher', weight: 10 }, { type: 't2_laserexplode', weight: 10 }, { type: 't2_iceray', weight: 10 }, { type: 't2_pulse', weight: 10 }, { type: 't2_spike', weight: 10 }, { type: 't2_icebomb', weight: 10 },
    { type: 't3_triplepea', weight: 3 }, { type: 't3_firepea2', weight: 3 }, { type: 't3_spinnut', weight: 3 }, { type: 't3_mortar2', weight: 3 }, { type: 't3_snowpea2', weight: 3 }, { type: 't3_inferno', weight: 3 }, { type: 't3_flamethrower', weight: 3 }, { type: 't3_bowling', weight: 3 }, { type: 't3_repulser', weight: 3 }, { type: 't3_snowpeanut', weight: 3 }, { type: 't3_skymortar', weight: 3 }, { type: 't3_laser3', weight: 3 }, { type: 't3_puncher2', weight: 3 }, { type: 't3_aoelaser', weight: 3 }, { type: 't3_iceray2', weight: 3 }, { type: 't3_miningbomb', weight: 3 }, { type: 't3_tesla', weight: 3 }, { type: 't3_icepuncher', weight: 3 }, { type: 't3_densnut', weight: 3 }, { type: 't3_durian', weight: 3 }, { type: 't3_spike2', weight: 3 }, { type: 't3_holonut', weight: 3 }, { type: 't3_minefield', weight: 3 }, { type: 't3_frostfield', weight: 3 }, { type: 't3_triberg', weight: 3 }
  ],
  UnlockCost: [
    { raisin: 1 },
    { raisin: 2 },
    { raisin: 3 },
    { raisin: 3 },
    { raisin: 3 },
    { raisin: 3 },
    { raisin: 3 },
    { raisin: 3 },
    { soil: 200 },
    { raisin: 5 },
    { raisin: 5 },
    { raisin: 5 },
    { raisin: 5 },
    { raisin: 5 },
    { raisin: 5 },
    { raisin: 5 },
    { raisin: 5 },
    { raisin: 5 },
    { soil: 400 },
    { raisin: 7 },
    { raisin: 7 },
    { raisin: 7 },
    { raisin: 7 },
    { raisin: 7 },
    { raisin: 7 },
    { raisin: 7 },
    { raisin: 7 },
    { raisin: 7 },
    { soil: 600 },
    { raisin: 10 },
    { raisin: 12 },
    { raisin: 14 },
    { raisin: 17 },
    { raisin: 20 }
  ]
};

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
const DAYTIME_WEIGHTS: Record<string, number[]> = {
  "1_day":   [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  "1_night": [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  "2_day":   [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  "3_night": [1, 1, 1, 0, 0.5, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0],
  "4_day":   [1, 1, 0.5, 0, 0, 0, 0, 0, 0, 1, 0.5, 0, 1, 0, 0.5, 0, 0, 1],
  "5_night": [0.5, 1, 1, 0.5, 1, 0.5, 0, 0, 1, 1, 1, 0.5, 0, 0, 1, 0.5, 0, 1],
  "6_day":   [0, 1, 0.5, 0, 0, 0, 0, 0, 1, 0.5, 0, 1, 1, 0.5, 0, 1, 1, 0.5],
  "7_night": [0, 0, 0, 0, 1, 1, 1, 0, 0, 0.5, 1, 1, 0.5, 1, 1, 0.5, 1, 0],
  "8_day":   [1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0.5, 1, 1, 1, 0, 1, 0.5, 0.5],
  "9_night": [0, 0, 0.5, 0.5, 0.5, 1, 1, 0, 1, 0, 0, 1, 0.5, 1, 0.5, 0.5, 1, 0.5],
};

const CHUNK_LEVEL_WEIGHTS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Lvl 1
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Lvl 2
  [0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 1, 0.75, 0, 1, 0.25, 0.25, 0.25, 0, 0.25, 0.25, 0.25, 0.25], // Lvl 3
  [0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 1, 0.25, 0.5, 1, 0.75, 0.75, 0.75, 0.5, 0.75, 0.75, 0.75, 0.75], // Lvl 4
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 5
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 6
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 7
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 8
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 9
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 10
];

export const ENEMY_KEYS = [
  'e_basic', 'e_armor1', 'e_armor2', 'e_armor3', 'e_shooting', 'e_swarm', 'e_giant', 'e_critter',
  'e_shooting_giant', 'e_fly', 'e_fly_armor1', 'e_fly_armor2', 'e_snowthrower', 'e_snowthrower_giant',
  'e_poison', 'e_bomb', 'e_rockpuncher', 'e_suneater'
];

function getWeightsForCurrentTime() {
  const t = getTime();
  const isNight = getLightLevel(t.hour) === 0;
  const dayKey = Math.min(t.day, 9);
  const key = `${dayKey}_${isNight ? 'night' : 'day'}`;
  const dtWeights = DAYTIME_WEIGHTS[key] || DAYTIME_WEIGHTS["5_night"];
  
  const clIdx = Math.min(Math.max(0, state.currentChunkLevel - 1), CHUNK_LEVEL_WEIGHTS.length - 1);
  const clWeights = CHUNK_LEVEL_WEIGHTS[clIdx];

  // Multiply weights
  return dtWeights.map((w, i) => w * clWeights[i]);
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

/**
 * Spawns enemies until amount is reached or attempt limit hit.
 * Returns the total cost spent.
 */
export function spawnFromBudget(amount: number): number {
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
  return spent;
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
     baseBudget = customBudgetPerNight[customBudgetPerNight.length - 1] * Math.pow(1.25, t.day - customBudgetPerNight.length);
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
    // Trigger the big wave event
    spawnFromBudget(state.currentNightWaveBudget);
  }

  const floorHour = floor(t.totalHours);
  if (floorHour !== state.lastHourProcessed) {
    state.lastHourProcessed = floorHour;
    let baseNight = 20;
    let baseDay = 10;
    let nightLvl = t.day - 1;
    let dayLvl = Math.max(0, t.day - 2);

    if (isNight) {
      state.hourlyBudgetPool += baseNight + (nightLvl * 20);
    } else if (t.day >= 2) {
      state.hourlyBudgetPool += baseDay + (dayLvl * 3);
    }
  }

  // AGGRESSIVE POOL CONSUMPTION: 
  // Always attempt to spend the budget pool every frame to counter "running away".
  // Refunds from despawned enemies go back into this pool instantly.
  if (state.hourlyBudgetPool >= 2) {
    const spent = spawnFromBudget(state.hourlyBudgetPool);
    state.hourlyBudgetPool -= spent;
  }
}
