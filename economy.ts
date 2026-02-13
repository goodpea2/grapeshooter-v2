
import { state } from './state';
import { HOUR_FRAMES } from './constants';
import { LootEntity } from './entities';
import { lootTypes, lootTableTypes, lootConfigs, LootTableEntry, ExternalLootConfigEntry } from './balanceLootTable';

declare const random: any;
declare const floor: any;

export const ECONOMY_CONFIG = {
  startingSun: 10,
  sunLootLifetime: HOUR_FRAMES*6,
  sunLootAttractionRange: 180,
  sunLootCollectionRange: 22,
  sunSpawnInterval: HOUR_FRAMES*0.5,
  sunSpawnMinDist: 5,
  sunSpawnMaxDist: 8,
  lootValues: {
    sunTiny: 1,
    sunOre: 3,
    sunClump: 10,
    enemyDrop: 1
  }
};

/**
 * Generic weighted picker
 */
function getWeightedResult<T extends { weight: number }>(list: T[]): T | null {
  const totalWeight = list.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;
  
  let r = random(totalWeight);
  for (const item of list) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return null;
}

export function spawnLootAt(x: number, y: number, key: string, configSource: any = null) {
  // 1. Resolve the config array (weighted list of table rolls)
  let config: ExternalLootConfigEntry[] = [];
  if (Array.isArray(configSource)) {
    config = configSource;
  } else if (typeof configSource === 'string' && lootConfigs[configSource]) {
    config = lootConfigs[configSource];
  } else if (lootConfigs[key]) {
    config = lootConfigs[key];
  } else {
    // Fallback for legacy direct value spawning if no config found (Sun nodes fallback)
    const val = (ECONOMY_CONFIG.lootValues as any)[key] || 0;
    if (val > 0) {
      for(let i=0; i<val; i++) {
         state.sunSpawnedTotal += 1;
         state.loot.push(new LootEntity(x + random(-10, 10), y + random(-10, 10), 'sun'));
      }
      return;
    }
    // If absolutely no config or values found, do nothing
    return;
  }

  // 2. Pick ONE outcome from the high-level config
  const selectedConfig = getWeightedResult(config);
  if (!selectedConfig || !selectedConfig.lootTableTypeKey) return;

  const table = lootTableTypes[selectedConfig.lootTableTypeKey];
  if (!table) return;

  const rollCount = selectedConfig.lootTableRollCount || 1;

  // 3. Roll the selected table N times
  for (let i = 0; i < rollCount; i++) {
    const entry = getWeightedResult(table);
    if (!entry || !entry.lootTypeKey) continue;

    // Pick random item and count from the provided lists
    const typeKey = entry.lootTypeKey[floor(random(entry.lootTypeKey.length))];
    const count = entry.itemCount ? entry.itemCount[floor(random(entry.itemCount.length))] : 1;

    for (let c = 0; c < count; c++) {
      const px = x + random(-15, 15);
      const py = y + random(-15, 15);
      
      const loot = new LootEntity(px, py, typeKey);
      state.loot.push(loot);
      
      // Track stats
      if (loot.config.type === 'currency' && loot.config.item === 'sun') {
        state.sunSpawnedTotal += (loot.config.itemValue || 1);
      }
    }
  }
}
