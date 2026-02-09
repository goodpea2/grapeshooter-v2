
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
  { id: 't2_puncher', ingredients: ['t_laser', 't_wall'], duplicates: 0, totalCount: 2 },
  { id: 't2_laserexplode', ingredients: ['t_laser', 't_mine'], duplicates: 0, totalCount: 2 },
  { id: 't2_iceray', ingredients: ['t_laser', 't_ice'], duplicates: 0, totalCount: 2 },
  
  { id: 't2_tall', ingredients: ['t_wall'], duplicates: 1, totalCount: 2 },
  { id: 't2_pulse', ingredients: ['t_wall', 't_mine'], duplicates: 0, totalCount: 2 },
  { id: 't2_spike', ingredients: ['t_wall', 't_ice'], duplicates: 0, totalCount: 2 },
  
  { id: 't2_minespawner', ingredients: ['t_mine'], duplicates: 1, totalCount: 2 },
  { id: 't2_icebomb', ingredients: ['t_mine', 't_ice'], duplicates: 0, totalCount: 2 },
  
  { id: 't2_stun', ingredients: ['t_ice'], duplicates: 1, totalCount: 2 },

  // --- TIER 3 (Total Count 3) ---
  { id: 't3_triplepea', ingredients: ['t_pea'], duplicates: 2, totalCount: 3 },
  { id: 't3_firepea2', ingredients: ['t_pea', 't_laser'], duplicates: 1, totalCount: 3 },
  { id: 't3_spinnut', ingredients: ['t_pea', 't_wall'], duplicates: 1, totalCount: 3 },
  { id: 't3_mortar2', ingredients: ['t_pea', 't_mine'], duplicates: 1, totalCount: 3 },
  { id: 't3_snowpea2', ingredients: ['t_pea', 't_ice'], duplicates: 1, totalCount: 3 },
  
  { id: 't3_inferno', ingredients: ['t_pea', 't_laser', 't_wall'], duplicates: 0, totalCount: 3 },
  { id: 't3_flamethrower', ingredients: ['t_pea', 't_laser', 't_mine'], duplicates: 0, totalCount: 3 },
  { id: 't3_stickylaser', ingredients: ['t_pea', 't_laser', 't_ice'], duplicates: 0, totalCount: 3 },
  { id: 't3_repulser', ingredients: ['t_pea', 't_wall', 't_mine'], duplicates: 0, totalCount: 3 },
  { id: 't3_snowpeanut', ingredients: ['t_pea', 't_wall', 't_ice'], duplicates: 0, totalCount: 3 },
  { id: 't3_skymortar', ingredients: ['t_pea', 't_mine', 't_ice'], duplicates: 0, totalCount: 3 },

  { id: 't3_laser3', ingredients: ['t_laser'], duplicates: 2, totalCount: 3 },
  { id: 't3_puncher2', ingredients: ['t_laser', 't_wall'], duplicates: 1, totalCount: 3 },
  { id: 't3_aoelaser', ingredients: ['t_laser', 't_mine'], duplicates: 1, totalCount: 3 },
  { id: 't3_iceray2', ingredients: ['t_laser', 't_ice'], duplicates: 1, totalCount: 3 },
  
  { id: 't3_miningbomb', ingredients: ['t_laser', 't_wall', 't_mine'], duplicates: 0, totalCount: 3 },
  { id: 't3_tesla', ingredients: ['t_laser', 't_wall', 't_ice'], duplicates: 0, totalCount: 3 },
  { id: 't3_icepuncher', ingredients: ['t_laser', 't_mine', 't_ice'], duplicates: 0, totalCount: 3 },

  { id: 't3_densnut', ingredients: ['t_wall'], duplicates: 2, totalCount: 3 },
  { id: 't3_durian', ingredients: ['t_wall', 't_mine'], duplicates: 1, totalCount: 3 },
  { id: 't3_spike2', ingredients: ['t_wall', 't_ice'], duplicates: 1, totalCount: 3 },
  
  { id: 't3_holonut', ingredients: ['t_wall', 't_mine', 't_ice'], duplicates: 0, totalCount: 3 },
  
  { id: 't3_squash', ingredients: ['t_mine'], duplicates: 2, totalCount: 3 },
  { id: 't3_frostfield', ingredients: ['t_mine', 't_ice'], duplicates: 1, totalCount: 3 },
  { id: 't3_triberg', ingredients: ['t_ice'], duplicates: 2, totalCount: 3 },
];

/**
 * Combined logic to find a valid merge output from a pool of T1 ingredients.
 */
export function findMergeResult(combinedPool: string[]): string | null {
  for (const recipe of TURRET_RECIPES) {
    if (recipe.totalCount !== combinedPool.length) continue;

    // Must contain all mandatory ingredients at least once
    let tempPool = [...combinedPool];
    let possible = true;
    for (const req of recipe.ingredients) {
      const idx = tempPool.indexOf(req);
      if (idx === -1) {
        possible = false;
        break;
      }
      tempPool.splice(idx, 1);
    }

    if (!possible) continue;

    // Remaining ingredients must be duplicates of the mandatory set
    for (const remaining of tempPool) {
      if (!recipe.ingredients.includes(remaining)) {
        possible = false;
        break;
      }
    }

    if (possible) return recipe.id;
  }
  return null;
}
