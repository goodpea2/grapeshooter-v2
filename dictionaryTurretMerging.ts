
export interface TurretRecipe {
  id: string;
  ingredients: string[]; // Mandatory T1 types
  duplicates: number;    // Number of slots that can be any of the mandatory ingredients
  totalCount: number;    // Total T1 count required
}

export const TURRET_RECIPES: TurretRecipe[] = [
  // --- TIER 2 (Total Count 2) ---
  { id: 't2_repeater', ingredients: ['t_pea'], duplicates: 1, totalCount: 2 },
  { id: 't2_firepea', ingredients: ['t_pea', 't_laser'], duplicates: 0, totalCount: 2 },
  { id: 't2_peanut', ingredients: ['t_pea', 't_wall'], duplicates: 0, totalCount: 2 },
  { id: 't2_mortar', ingredients: ['t_pea', 't_mine'], duplicates: 0, totalCount: 2 },
  { id: 't2_snowpea', ingredients: ['t_pea', 't_ice'], duplicates: 0, totalCount: 2 },
  
  { id: 't2_laser2', ingredients: ['t_laser'], duplicates: 1, totalCount: 2 },
  { id: 't2_wallaser', ingredients: ['t_laser', 't_wall'], duplicates: 0, totalCount: 2 },
  { id: 't2_laserexplode', ingredients: ['t_laser', 't_mine'], duplicates: 0, totalCount: 2 },
  { id: 't2_heallaser', ingredients: ['t_laser', 't_ice'], duplicates: 0, totalCount: 2 },
  
  { id: 't2_tall', ingredients: ['t_wall'], duplicates: 1, totalCount: 2 },
  { id: 't2_pulse', ingredients: ['t_wall', 't_mine'], duplicates: 0, totalCount: 2 },
  { id: 't2_icewall', ingredients: ['t_wall', 't_ice'], duplicates: 0, totalCount: 2 },
  
  { id: 't2_minespawner', ingredients: ['t_mine'], duplicates: 1, totalCount: 2 },
  { id: 't2_torchwood', ingredients: ['t_mine', 't_ice'], duplicates: 0, totalCount: 2 },
  
  { id: 't2_stun', ingredients: ['t_ice'], duplicates: 1, totalCount: 2 },

  // --- TIER 3 (Total Count 4) ---
  { id: 't3_triplepea', ingredients: ['t_pea'], duplicates: 3, totalCount: 4 },
  { id: 't3_firepea2', ingredients: ['t_pea', 't_laser'], duplicates: 2, totalCount: 4 },
  { id: 't3_bowling', ingredients: ['t_pea', 't_wall'], duplicates: 2, totalCount: 4 },
  { id: 't3_mortar2', ingredients: ['t_pea', 't_mine'], duplicates: 2, totalCount: 4 },
  { id: 't3_snowpea2', ingredients: ['t_pea', 't_ice'], duplicates: 2, totalCount: 4 },
  { id: 't3_witch', ingredients: ['t_pea', 't_laser', 't_wall'], duplicates: 1, totalCount: 4 },
  { id: 't3_flamethrower', ingredients: ['t_pea', 't_laser', 't_mine'], duplicates: 1, totalCount: 4 },
  { id: 't3_firecharge', ingredients: ['t_pea', 't_laser', 't_ice'], duplicates: 1, totalCount: 4 },
  { id: 't3_repulser', ingredients: ['t_pea', 't_wall', 't_mine'], duplicates: 1, totalCount: 4 },
  { id: 't3_gatling', ingredients: ['t_pea', 't_wall', 't_ice'], duplicates: 1, totalCount: 4 },
  { id: 't3_skymortar', ingredients: ['t_pea', 't_mine', 't_ice'], duplicates: 1, totalCount: 4 },

  { id: 't3_laser3', ingredients: ['t_laser'], duplicates: 3, totalCount: 4 },
  { id: 't3_puncher', ingredients: ['t_laser', 't_wall'], duplicates: 2, totalCount: 4 },
  { id: 't3_aoelaser', ingredients: ['t_laser', 't_mine'], duplicates: 2, totalCount: 4 },
  { id: 't3_heallaser2', ingredients: ['t_laser', 't_ice'], duplicates: 2, totalCount: 4 },
  { id: 't3_hypno', ingredients: ['t_laser', 't_wall', 't_mine'], duplicates: 1, totalCount: 4 },
  { id: 't3_magnet', ingredients: ['t_laser', 't_wall', 't_ice'], duplicates: 1, totalCount: 4 },
  { id: 't3_powerbank', ingredients: ['t_laser', 't_mine', 't_ice'], duplicates: 1, totalCount: 4 },

  { id: 't3_densnut', ingredients: ['t_wall'], duplicates: 3, totalCount: 4 },
  { id: 't3_durian', ingredients: ['t_wall', 't_mine'], duplicates: 2, totalCount: 4 },
  { id: 't3_frostfield', ingredients: ['t_wall', 't_ice'], duplicates: 2, totalCount: 4 },
  { id: 't3_holonut', ingredients: ['t_wall', 't_mine', 't_ice'], duplicates: 1, totalCount: 4 },

  { id: 't3_minecharge', ingredients: ['t_mine'], duplicates: 3, totalCount: 4 },
  { id: 't3_speeder', ingredients: ['t_mine', 't_ice'], duplicates: 2, totalCount: 4 },

  { id: 't3_icecharge', ingredients: ['t_ice'], duplicates: 3, totalCount: 4 },
];

export interface MergeResult {
  id: string;
  missingDuplicates: number;
}

/**
 * Returns the base ingredients for a turret type, expanding duplicates if it's a T2 or T3 recipe.
 */
export function getBaseIngredientsForType(type: string): string[] {
  const recipe = TURRET_RECIPES.find(r => r.id === type);
  if (recipe) {
    const list = [...recipe.ingredients];
    while (list.length < recipe.totalCount) {
      list.push(recipe.ingredients[0]);
    }
    return list;
  }
  return [type];
}

/**
 * Combined logic to find a valid merge output from a pool of T1 ingredients.
 * Output is always a higher-tiered turret than the ingredients (T1+T1->T2, T1+T2->T3, T2+T2->T3).
 * Missing duplicate ingredients can be filled with an extra sun cost (10 sun per missing duplicate).
 */
export function findMergeResult(combinedPool: string[], targetTier?: number): MergeResult | null {
  if (!combinedPool || combinedPool.length === 0) return null;

  // If targetTier is not specified, infer: <= 2 items -> tier 2; 3+ items -> tier 3
  const resolvedTargetTier = targetTier ?? (combinedPool.length <= 2 ? 2 : 3);
  if (resolvedTargetTier < 2 || resolvedTargetTier > 3) return null;

  const expectedTotalCount = resolvedTargetTier === 2 ? 2 : 4;

  if (combinedPool.length > expectedTotalCount) return null;

  const poolSet = new Set(combinedPool);

  for (const recipe of TURRET_RECIPES) {
    if (recipe.totalCount !== expectedTotalCount) continue;

    // The recipe's mandatory ingredients must have the exact same distinct set as the pool
    if (recipe.ingredients.length !== poolSet.size) continue;
    let setMatch = true;
    for (const req of recipe.ingredients) {
      if (!poolSet.has(req)) {
        setMatch = false;
        break;
      }
    }
    if (!setMatch) continue;

    // Missing duplicates calculation
    const missingDuplicates = recipe.totalCount - combinedPool.length;
    if (missingDuplicates < 0 || missingDuplicates > recipe.duplicates) continue;

    return {
      id: recipe.id,
      missingDuplicates,
    };
  }
  return null;
}
