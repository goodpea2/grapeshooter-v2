
import { state } from './state';
import { GRID_SIZE, HOUR_FRAMES } from './constants';
import { SunLoot, TurretLoot } from './entities';

declare const random: any;
declare const cos: any;
declare const sin: any;

export const ECONOMY_CONFIG = {
  startingSun: 10,
  sunLootLifetime: HOUR_FRAMES*6,
  sunLootAttractionRange: 180,
  sunLootCollectionRange: 22,
  sunSpawnInterval: HOUR_FRAMES*0.25,
  sunSpawnMinDist: 5,
  sunSpawnMaxDist: 8,
  lootValues: {
    sunTiny: 1,
    sunOre: 3,
    sunClump: 10,
    enemyDrop: 1
  }
};

export function spawnLootAt(x: number, y: number, overlayKey: string, lootConfig: any = null) {
  if (overlayKey === 'strayTurret' || (lootConfig && lootConfig.lootTableTypeKey === 'lt_strayTurret')) {
    const pool = ['t_pea', 't_laser', 't_wall', 't_mine', 't_ice'];
    const chosen = pool[Math.floor(random(pool.length))];
    state.loot.push(new TurretLoot(x, y, chosen));
    return;
  }
  if (overlayKey === 'sunflowerTurret' || (lootConfig && lootConfig.lootTableTypeKey === 'lt_sunflowerTurret')) {
    state.loot.push(new TurretLoot(x, y, 't_sunflower'));
    return;
  }

  // Handle structured loot config
  if (lootConfig && lootConfig.lootTableTypeKey === 'lt_sun') {
    const value = lootConfig.lootTableRollCount || 1;
    state.sunSpawnedTotal += value;
    for (let i = 0; i < value; i++) {
      state.loot.push(new SunLoot(x + random(-10, 10), y + random(-10, 10), 1));
    }
    return;
  }

  // Fallback for legacy calls
  const value = (ECONOMY_CONFIG.lootValues as any)[overlayKey] || 1;
  state.sunSpawnedTotal += value;
  for (let i = 0; i < value; i++) {
    state.loot.push(new SunLoot(x + random(-10, 10), y + random(-10, 10), 1));
  }
}
