
export interface LootType {
  type: 'currency' | 'turret' | 'turretAsItem';
  item: string; 
  itemValue?: number; // Value added if currency, or turret key if turret
  idleAssetImg: string;
  idleAssetImgSize: [number, number]; // Random range for scaling
}

export interface LootTableEntry {
  weight: number;
  lootTypeKey?: string[]; // Array to allow picking one randomly
  // Updated type to number[] to allow for single-element count arrays and fix comparison logic in economy.ts
  itemCount?: number[];   // Min-Max range [min, max] or fixed [count]
}

export interface ExternalLootConfigEntry {
  weight?: number; // Optional: if missing, the item is guaranteed to roll
  lootTableTypeKey?: string;
  lootTableRollCount?: number;
}

export const lootTypes: Record<string, LootType> = {
  sun: {
    type: 'currency',
    item: 'sun',
    itemValue: 1,
    idleAssetImg: 'img_icon_sun',
    idleAssetImgSize: [40, 40]
  },
  elixir: {
    type: 'currency',
    item: 'elixir',
    itemValue: 1,
    idleAssetImg: 'img_icon_elixir',
    idleAssetImgSize: [40, 40]
  },
  soil: {
    type: 'currency',
    item: 'soil',
    itemValue: 1,
    idleAssetImg: 'img_icon_soil',
    idleAssetImgSize: [40, 40]
  },
  t_seed: {
    type: 'turret',
    item: 't_seed',
    idleAssetImg: 'img_seed_stray_t1',
    idleAssetImgSize: [40, 40]
  },
  t_seed2: {
    type: 'turret',
    item: 't_seed2',
    idleAssetImg: 'img_seed_stray_t2',
    idleAssetImgSize: [40, 40]
  },
  t_sunflower: {
    type: 'turret',
    item: 't_sunflower',
    idleAssetImg: 'img_seed_sunflower',
    idleAssetImgSize: [40, 40]
  },
  // Basic T1
  t_pea: { type: 'turret', item: 't_pea', idleAssetImg: 'img_t_pea_front', idleAssetImgSize: [45, 45] },
  t_laser: { type: 'turret', item: 't_laser', idleAssetImg: 'img_t_laser_front', idleAssetImgSize: [45, 45] },
  t_wall: { type: 'turret', item: 't_wall', idleAssetImg: 'img_t_wall_front', idleAssetImgSize: [45, 45] },
  t_mine: { type: 'turret', item: 't_mine', idleAssetImg: 'img_t_mine_front', idleAssetImgSize: [45, 45] },
  t_ice: { type: 'turret', item: 't_ice', idleAssetImg: 'img_t_ice_front', idleAssetImgSize: [45, 45] },
  t_lilypad: { type: 'turret', item: 't_lilypad', idleAssetImg: 'img_t_lilypad_front', idleAssetImgSize: [45, 45] },
  
  // T2 Loot Definitions
  t2_repeater: { type: 'turret', item: 't2_repeater', idleAssetImg: 'img_t_repeater_front', idleAssetImgSize: [45, 45] },
  t2_firepea: { type: 'turret', item: 't2_firepea', idleAssetImg: 'img_t_firepea_front', idleAssetImgSize: [45, 45] },
  t2_laser2: { type: 'turret', item: 't2_laser2', idleAssetImg: 'img_t_laser2_front', idleAssetImgSize: [45, 45] },
  t2_peanut: { type: 'turret', item: 't2_peanut', idleAssetImg: 'img_t_peanut_front', idleAssetImgSize: [45, 45] },
  t2_mortar: { type: 'turret', item: 't2_mortar', idleAssetImg: 'img_t_mortar_front', idleAssetImgSize: [45, 45] },
  t2_laserexplode: { type: 'turret', item: 't2_laserexplode', idleAssetImg: 'img_t_laserexplode_front', idleAssetImgSize: [45, 45] },
  t2_snowpea: { type: 'turret', item: 't2_snowpea', idleAssetImg: 'img_t_snowpea_front', idleAssetImgSize: [45, 45] },
  t2_iceray: { type: 'turret', item: 't2_iceray', idleAssetImg: 'img_t_iceray_front', idleAssetImgSize: [45, 45] },
  t2_puncher: { type: 'turret', item: 't2_puncher', idleAssetImg: 'img_t_puncher_front', idleAssetImgSize: [45, 45] },
  t2_tall: { type: 'turret', item: 't2_tall', idleAssetImg: 'img_t_tall_front', idleAssetImgSize: [45, 45] },
  t2_pulse: { type: 'turret', item: 't2_pulse', idleAssetImg: 'img_t_pulse_front', idleAssetImgSize: [45, 45] },
  t2_minespawner: { type: 'turret', item: 't2_minespawner', idleAssetImg: 'img_t_minespawner_front', idleAssetImgSize: [45, 45] },
  t2_icebomb: { type: 'turret', item: 't2_icebomb', idleAssetImg: 'img_t_icebomb_front', idleAssetImgSize: [45, 45] },
  t2_stun: { type: 'turret', item: 't2_stun', idleAssetImg: 'img_t_stun_front', idleAssetImgSize: [45, 45] },
  t2_spike: { type: 'turret', item: 't2_spike', idleAssetImg: 'img_t_spike_front', idleAssetImgSize: [45, 45] },

  // T3 Cheat definitions
  t3_triplepea: { type: 'turret', item: 't3_triplepea', idleAssetImg: 'img_t_triplepea_front', idleAssetImgSize: [50, 50] },
  t3_firepea2: { type: 'turret', item: 't3_firepea2', idleAssetImg: 'img_t_firepea2_front', idleAssetImgSize: [50, 50] },
  t3_spinnut: { type: 'turret', item: 't3_spinnut', idleAssetImg: 'img_t_spinnut_front', idleAssetImgSize: [50, 50] },
  t3_mortar2: { type: 'turret', item: 't3_mortar2', idleAssetImg: 'img_t_mortar2_front', idleAssetImgSize: [50, 50] },
  t3_snowpea2: { type: 'turret', item: 't3_snowpea2', idleAssetImg: 'img_t_snowpea2_front', idleAssetImgSize: [50, 50] },
  t3_inferno: { type: 'turret', item: 't3_inferno', idleAssetImg: 'img_t_inferno_front', idleAssetImgSize: [50, 50] },
  t3_flamethrower: { type: 'turret', item: 't3_flamethrower', idleAssetImg: 'img_t_flamethrower_front', idleAssetImgSize: [50, 50] },
  t3_bowling: { type: 'turret', item: 't3_bowling', idleAssetImg: 'img_t_bowling_front', idleAssetImgSize: [50, 50] },
  t3_repulser: { type: 'turret', item: 't3_repulser', idleAssetImg: 'img_t_repulser_front', idleAssetImgSize: [50, 50] },
  t3_snowpeanut: { type: 'turret', item: 't3_snowpeanut', idleAssetImg: 'img_t_snowpeanut_front', idleAssetImgSize: [50, 50] },
  t3_skymortar: { type: 'turret', item: 't3_skymortar', idleAssetImg: 'img_t_skymortar_front', idleAssetImgSize: [50, 50] },
  t3_laser3: { type: 'turret', item: 't3_laser3', idleAssetImg: 'img_t_laser3_front', idleAssetImgSize: [50, 50] },
  t3_puncher2: { type: 'turret', item: 't3_puncher2', idleAssetImg: 'img_t_puncher2_front', idleAssetImgSize: [50, 50] },
  t3_aoelaser: { type: 'turret', item: 't3_aoelaser', idleAssetImg: 'img_t_aoelaser_front', idleAssetImgSize: [50, 50] },
  t3_iceray2: { type: 'turret', item: 't3_iceray2', idleAssetImg: 'img_t_iceray2_front', idleAssetImgSize: [50, 50] },
  t3_miningbomb: { type: 'turret', item: 't3_miningbomb', idleAssetImg: 'img_t_miningbomb_front', idleAssetImgSize: [50, 50] },
  t3_tesla: { type: 'turret', item: 't3_tesla', idleAssetImg: 'img_t_tesla_front', idleAssetImgSize: [50, 50] },
  t3_icepuncher: { type: 'turret', item: 't3_icepuncher', idleAssetImg: 'img_t_icepuncher_front', idleAssetImgSize: [50, 50] },
  t3_densnut: { type: 'turret', item: 't3_densnut', idleAssetImg: 'img_t_densenut_front', idleAssetImgSize: [50, 50] },
  t3_durian: { type: 'turret', item: 't3_durian', idleAssetImg: 'img_t_durian_front', idleAssetImgSize: [50, 50] },
  t3_spike2: { type: 'turret', item: 't3_spike2', idleAssetImg: 'img_t_spike2_front', idleAssetImgSize: [50, 50] },
  t3_holonut: { type: 'turret', item: 't3_holonut', idleAssetImg: 'img_t_holonut_front', idleAssetImgSize: [50, 50] },
  t3_minefield: { type: 'turret', item: 't3_minefield', idleAssetImg: 'img_t_minefield_front', idleAssetImgSize: [50, 50] },
  t3_frostfield: { type: 'turret', item: 't3_frostfield', idleAssetImg: 'img_t_frostfield_front', idleAssetImgSize: [50, 50] },
  t3_triberg: { type: 'turret', item: 't3_triberg', idleAssetImg: 'img_t_triberg_front', idleAssetImgSize: [50, 50] },

  // Special T0 Loot Definitions - Ensure all are turretAsItem
  t0_cherrybomb: { type: 'turretAsItem', item: 't0_cherrybomb', idleAssetImg: 'img_t0_cherrybomb_front', idleAssetImgSize: [45, 45] },
  t0_firecherry: { type: 'turretAsItem', item: 't0_firecherry', idleAssetImg: 'img_t0_firecherry_front', idleAssetImgSize: [45, 45] },
  t0_iceshroom: { type: 'turretAsItem', item: 't0_iceshroom', idleAssetImg: 'img_t0_iceshroom_front', idleAssetImgSize: [45, 45] },
  t0_starfruit: { type: 'turretAsItem', item: 't0_starfruit', idleAssetImg: 'img_t0_starfruit_front', idleAssetImgSize: [45, 45] },
  t0_jalapeno: { type: 'turretAsItem', item: 't0_jalapeno', idleAssetImg: 'img_t0_jalapeno_front', idleAssetImgSize: [45, 45] },
  t0_puffshroom: { type: 'turretAsItem', item: 't0_puffshroom', idleAssetImg: 'img_t0_puffshroom_front', idleAssetImgSize: [35, 35] },
  t0_grapeshot: { type: 'turretAsItem', item: 't0_grapeshot', idleAssetImg: 'img_t0_grapeshot_front', idleAssetImgSize: [45, 45] }
};

export const lootTableTypes: Record<string, LootTableEntry[]> = {
  lt_none: [{ weight: 1 }],
  lt_sun_node: [{ weight: 1, lootTypeKey: ['sun'], itemCount: [1, 1] }],
  
  // --- Elixir Tables (Based on Enemy Average Drops) ---
  lt_elixir_01: [ // avg 0.1
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [1, 1] },
    { weight: 9 }
  ],
  lt_elixir_05: [ // avg 0.5
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [0, 2] },
    { weight: 1 }
  ],
  lt_elixir_10: [{ weight: 100, lootTypeKey: ['elixir'], itemCount: [0, 2] }], // avg 1.0
  lt_elixir_20: [
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [1, 3] }
  ],

  // --- Soil Tables (Based on Block Average Drops) ---
  lt_soil_005: [
    { weight: 1, lootTypeKey: ['soil'], itemCount: [1, 1]},
    { weight: 19 }
  ],

  // --- Special ---
  lt_stray_crate: [
    { weight: 8, lootTypeKey: ['t_seed'], itemCount: [1, 1] }
  ],
  lt_wild_sunflower: [{ weight: 1, lootTypeKey: ['t_sunflower'], itemCount: [1, 1] }],

  // --- New: Crates and Pots ---
  lt_crate_loot: [
    { weight: 6, lootTypeKey: ['sun'], itemCount: [1, 2] },
    { weight: 3, lootTypeKey: ['elixir'], itemCount: [1, 2] },
    { weight: 1, lootTypeKey: ['t_seed'], itemCount: [1, 1] },
    { weight: 20 } // Nothing
  ],

  // --- Treasure Chest Tables ---
  lt_chest_100: [
    { weight: 1, lootTypeKey: ['sun'], itemCount: [10, 20] },
    { weight: 1, lootTypeKey: ['soil'], itemCount: [5, 10] }
  ],
  lt_chest_200: [
    { weight: 1, lootTypeKey: ['sun'], itemCount: [30, 50] },
    { weight: 1, lootTypeKey: ['soil'], itemCount: [15, 20] },
    { weight: 1, lootTypeKey: ['t_seed'], itemCount: [1, 2] }
  ],
  lt_chest_300: [
    { weight: 1, lootTypeKey: ['sun'], itemCount: [100, 150] },
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [10, 20] },
    { weight: 1, lootTypeKey: ['t_seed2'], itemCount: [1, 1] }
  ],

  // --- Consumables ---
  lt_t0_explosive: [
    { weight: 10, lootTypeKey: ['t0_cherrybomb'], itemCount: [1, 2] },
    { weight: 10, lootTypeKey: ['t0_firecherry'], itemCount: [1, 2] },
    { weight: 10, lootTypeKey: ['t0_iceshroom'], itemCount: [1, 2] },
    { weight: 10, lootTypeKey: ['t0_grapeshot'], itemCount: [1, 1] },
    { weight: 1, lootTypeKey: ['t0_cherrybomb'], itemCount: [5, 7] },
    { weight: 1, lootTypeKey: ['t0_firecherry'], itemCount: [4, 6] },
    { weight: 1, lootTypeKey: ['t0_iceshroom'], itemCount: [4, 6] },
    { weight: 1, lootTypeKey: ['t0_grapeshot'], itemCount: [3, 4] }
  ],
  lt_t0_booster: [
    { weight: 1, lootTypeKey: ['t0_jalapeno'], itemCount: [1, 2] },
    { weight: 1, lootTypeKey: ['t0_starfruit'], itemCount: [1, 2] },
    { weight: 1, lootTypeKey: ['t0_puffshroom'], itemCount: [6, 10] }
  ],
  lt_t0_healing: [
    { weight: 20, lootTypeKey: ['t0_starfruit'], itemCount: [1, 1] },
    { weight: 5, lootTypeKey: ['t0_starfruit'], itemCount: [2, 4] },
    { weight: 1, lootTypeKey: ['t0_starfruit'], itemCount: [5, 7] }
  ],

  // --- Treasurechest ---
  lt_treasure_sunOrElixir_100: [
    { weight: 1, lootTypeKey: ['sun'], itemCount: [25, 40] },
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [15, 30] },
  ],
  lt_treasure_sunOrElixir_200: [
    { weight: 1, lootTypeKey: ['sun'], itemCount: [40, 60] },
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [25, 50] },
  ],
  lt_treasure_sunOrElixir_300: [
    { weight: 1, lootTypeKey: ['sun'], itemCount: [55, 75] },
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [40, 75] },
  ],
};

// Config Triggers
export const lootConfigs: Record<string, ExternalLootConfigEntry[]> = {
  // World Overlays
  lc_sun_tiny: [{ lootTableTypeKey: 'lt_sun_node', lootTableRollCount: 1 }],
  lc_sun_ore: [{ lootTableTypeKey: 'lt_sun_node', lootTableRollCount: 3 }],
  lc_sun_clump: [{ lootTableTypeKey: 'lt_sun_node', lootTableRollCount: 10 }],
  lc_stray_crate: [{ lootTableTypeKey: 'lt_stray_crate', lootTableRollCount: 1 }],
  lc_wild_sunflower: [{ lootTableTypeKey: 'lt_wild_sunflower', lootTableRollCount: 1 }],

  // Treasure Chests
  lc_treasurechest_100: [
    { lootTableTypeKey: 'lt_treasure_sunOrElixir_100', lootTableRollCount: 1 },
    { lootTableTypeKey: 'lt_t0_healing', lootTableRollCount: 3 },
    { weight: 1, lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 1 },
    { weight: 1, lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 2 },
    { weight: 1 }
  ],
  lc_treasurechest_200: [
    { lootTableTypeKey: 'lt_treasure_sunOrElixir_200', lootTableRollCount: 1 },
    { lootTableTypeKey: 'lt_t0_healing', lootTableRollCount: 3 },
    { lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 3 },
    { weight: 1, lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 1 },
    { weight: 1, lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 3 },
    { weight: 2, lootTableTypeKey: 'lt_t0_booster', lootTableRollCount: 3 },
    { weight: 2 }
  ],
  lc_treasurechest_300: [
    { lootTableTypeKey: 'lt_treasure_sunOrElixir_300', lootTableRollCount: 1 },
    { lootTableTypeKey: 'lt_t0_healing', lootTableRollCount: 3 },
    { lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 4 },
    { lootTableTypeKey: 'lt_t0_booster', lootTableRollCount: 4 },
    { weight: 1, lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 2 },
    { weight: 1, lootTableTypeKey: 'lt_t0_explosive', lootTableRollCount: 4 },
    { weight: 2, lootTableTypeKey: 'lt_t0_booster', lootTableRollCount: 2 },
    { weight: 2 }
  ],

  // New: Crates and Pots
  lc_crate: [{ lootTableTypeKey: 'lt_crate_loot', lootTableRollCount: 1 }],
  lc_pot: [{ lootTableTypeKey: 'lt_crate_loot', lootTableRollCount: 2 }],

  // Enemies
  e_fast: [{ lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 1 }],
  e_basic: [{ lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 1 }],
  e_armor1: [{ lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 2 }],
  e_armor2: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 4 },{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 2 }],
  e_armor3: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 8 },{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 3 }],
  e_shooting: [{ lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 3 }],
  e_swarm: [{ lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 3 }],
  e_breast: [{ lootTableTypeKey: 'lt_elixir_01', lootTableRollCount: 1 }],
  e_giant: [{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 3 },{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 5 }],

  // Blocks
  o_dirt: [{ lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 5 }],
  o_clay: [{ lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 6 }],
  o_stone: [{ lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 7 }],
  o_slate: [{ lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 8 }],
  o_black: [{ lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 10 }]
};
