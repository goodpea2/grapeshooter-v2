
import { state } from './state';
import { HOUR_FRAMES } from './constants';
import { LootEntity } from './entities';
import { lootTypes, lootTableTypes, lootConfigs, LootTableEntry, ExternalLootConfigEntry } from './balanceLootTable';

declare const random: any;
declare const floor: any;

export const ECONOMY_CONFIG = {
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
function getWeightedResult<T extends { weight?: number }>(list: T[]): T | null {
  const weightedOnly = list.filter(item => item.weight !== undefined);
  const totalWeight = weightedOnly.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (totalWeight <= 0) return null;
  
  let r = random(totalWeight);
  for (const item of weightedOnly) {
    if (r < item.weight!) return item;
    r -= item.weight!;
  }
  return null;
}

export function spawnLootAt(x: number, y: number, key: string, configSource: any = null) {
  // 1. Resolve the config array
  let config: ExternalLootConfigEntry[] = [];
  if (Array.isArray(configSource)) {
    config = configSource;
  } else if (typeof configSource === 'string' && lootConfigs[configSource]) {
    config = lootConfigs[configSource];
  } else if (lootConfigs[key]) {
    config = lootConfigs[key];
  } else {
    // Fallback for legacy direct value spawning
    const val = (ECONOMY_CONFIG.lootValues as any)[key] || 0;
    if (val > 0) {
      for(let i=0; i<val; i++) {
         state.sunSpawnedTotal += 1;
         state.loot.push(new LootEntity(x + random(-10, 10), y + random(-10, 10), 'sun'));
      }
      return;
    }
    return;
  }

  // 2. Identify Guaranteed and Weighted rolls
  const guaranteed = config.filter(c => c.weight === undefined);
  const weighted = config.filter(c => c.weight !== undefined);

  const rollTable = (c: ExternalLootConfigEntry) => {
    const table = lootTableTypes[c.lootTableTypeKey!];
    if (!table) return;
    const rollCount = c.lootTableRollCount || 1;

    for (let i = 0; i < rollCount; i++) {
      const entry = getWeightedResult(table);
      if (!entry || !entry.lootTypeKey) continue;

      const typeKey = entry.lootTypeKey[floor(random(entry.lootTypeKey.length))];
      
      // Calculate count from range [min, max]
      let count = 1;
      if (entry.itemCount) {
        if (entry.itemCount.length === 1) count = entry.itemCount[0];
        else count = floor(random(entry.itemCount[0], entry.itemCount[1] + 1));
      }

      for (let cIdx = 0; cIdx < count; cIdx++) {
        const px = x + random(-15, 15);
        const py = y + random(-15, 15);
        
        const loot = new LootEntity(px, py, typeKey);
        state.loot.push(loot);
        
        if (loot.config.type === 'currency') {
          if (loot.config.item === 'sun') {
            state.sunSpawnedTotal += (loot.config.itemValue || 1);
          } else if (loot.config.item === 'raisin') {
            // No special stat tracking for raisin yet, but it's handled by LootEntity update
          }
        }
      }
    }
  };

  // 3. Roll ALL guaranteed items
  for (const item of guaranteed) {
    rollTable(item);
  }

  // 4. Pick and roll ONE weighted item
  const selected = getWeightedResult(weighted);
  if (selected) {
    rollTable(selected);
  }
}