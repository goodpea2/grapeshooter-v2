
export interface LootType {
  type: 'currency' | 'turret';
  item: string; 
  itemValue?: number; // Value added if currency, or turret key if turret
  idleAssetImg: string;
  idleAssetImgSize: [number, number]; // Random range for scaling
}

export interface LootTableEntry {
  weight: number;
  lootTypeKey?: string[]; // Array to allow picking one randomly
  itemCount?: number[];   // Array to allow picking one randomly
}

export interface ExternalLootConfigEntry {
  weight: number;
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
  t_sunflower: {
    type: 'turret',
    item: 't_sunflower',
    idleAssetImg: 'img_seed_sunflower',
    idleAssetImgSize: [40, 40]
  }
};

export const lootTableTypes: Record<string, LootTableEntry[]> = {
  // --- Sun Tables ---
  lt_sun_node: [{ weight: 1, lootTypeKey: ['sun'], itemCount: [1] }],
  
  // --- Elixir Tables (Based on Enemy Average Drops) ---
  lt_elixir_01: [ // avg 0.1
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [1] },
    { weight: 9 }
  ],
  lt_elixir_05: [ // avg 0.5
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [1] },
    { weight: 1 }
  ],
  lt_elixir_10: [{ weight: 100, lootTypeKey: ['elixir'], itemCount: [1] }], // avg 1.0
  lt_elixir_20: [ // avg 0.5
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [3] },
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [2] },
    { weight: 1, lootTypeKey: ['elixir'], itemCount: [1] }
  ],

  // --- Soil Tables (Based on Block Average Drops) ---
  lt_soil_005: [
    { weight: 1, lootTypeKey: ['soil'], itemCount: [1]},
    { weight: 19 }
  ],

  // --- Special ---
  lt_stray_crate: [{ weight: 1, lootTypeKey: ['t_seed'], itemCount: [1] }],
  lt_wild_sunflower: [{ weight: 1, lootTypeKey: ['t_sunflower'], itemCount: [1] }],

  // --- New: Crates and Pots ---
  lt_crate_loot: [
    { weight: 5, lootTypeKey: ['sun'], itemCount: [1, 2] },
    { weight: 1, lootTypeKey: ['t_seed'], itemCount: [1] },
    { weight: 14 } // Nothing
  ]
};

// Config Triggers
export const lootConfigs: Record<string, ExternalLootConfigEntry[]> = {
  // World Overlays
  lc_sun_tiny: [{ weight: 1, lootTableTypeKey: 'lt_sun_node', lootTableRollCount: 1 }],
  lc_sun_ore: [{ weight: 1, lootTableTypeKey: 'lt_sun_node', lootTableRollCount: 3 }],
  lc_sun_clump: [{ weight: 1, lootTableTypeKey: 'lt_sun_node', lootTableRollCount: 10 }],
  lc_stray_crate: [{ weight: 1, lootTableTypeKey: 'lt_stray_crate', lootTableRollCount: 1 }],
  lc_wild_sunflower: [{ weight: 1, lootTableTypeKey: 'lt_wild_sunflower', lootTableRollCount: 1 }],

  // New: Crates and Pots
  lc_crate: [{ weight: 1, lootTableTypeKey: 'lt_crate_loot', lootTableRollCount: 1 }],
  lc_pot: [{ weight: 1, lootTableTypeKey: 'lt_crate_loot', lootTableRollCount: 2 }],

  // Enemies
  e_fast: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 1 }],
  e_basic: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 1 }],
  e_armor1: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 2 }],
  e_armor2: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 4 },{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 2 }],
  e_armor3: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 8 },{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 3 }],
  e_shooting: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 3 }],
  e_swarm: [{ weight: 1, lootTableTypeKey: 'lt_elixir_05', lootTableRollCount: 3 }],
  e_critter: [{ weight: 1, lootTableTypeKey: 'lt_elixir_01', lootTableRollCount: 1 }],
  e_giant: [{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 3 },{ weight: 1, lootTableTypeKey: 'lt_elixir_20', lootTableRollCount: 5 }],

  // Blocks
  o_dirt: [{ weight: 1, lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 5 }],
  o_clay: [{ weight: 1, lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 6 }],
  o_stone: [{ weight: 1, lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 7 }],
  o_slate: [{ weight: 1, lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 8 }],
  o_black: [{ weight: 1, lootTableTypeKey: 'lt_soil_005', lootTableRollCount: 10 }]
};
