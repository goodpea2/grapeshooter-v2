
export const GRID_SIZE = 34;
export const HEX_DIST = 22; 
export const CHUNK_SIZE = 16;
export const VISIBILITY_RADIUS = 14;
export const CHUNK_GEN_RADIUS = 1; // Radius around player to generate/update chunks
export const VERSION = "Grapeshooter - build 25/2 11:14am"; // absolute time from gmt+7, don't remove this comment
export const LEVEL_THRESHOLDS = [10, 22, 35, 50, 70, 90, 120, 150, 180, 200];
export const HOUR_FRAMES = 600;
export const MAX_VFX = 400;
export const LEVEL_BUDGET = [30, 60, 60, 90, 90, 150, 150, 200, 200, 200, 200];

// Optimization Tuning
export const TurretMinScanRate = 30;
export const EnemyCollideRadiusCheck = 68; // Neighborhood check distance for physics
export const SPATIAL_HASH_CELL_SIZE = 120;

export const PLAYER_DRAG_MIN_DISTANCE_TILES = 0.5; // Minimum drag distance in tiles to initiate player movement
export const PLAYER_DRAG_MAX_DISTANCE_TILES = 2; // Maximum drag distance in tiles for 100% player speed

export const WORLD_GEN_STATS: Record<string, { value: number, chance: number, budget?: number, dangerRange?: [number, number] }[]> = {
  sun: [
    { value: 5, chance: 0.50 }, // Lvl 0
    { value: 5, chance: 0.33 }, // Lvl 1
    { value: 4, chance: 0.20 }, // Lvl 2
    { value: 4, chance: 0.15 }, // Lvl 3
    { value: 3, chance: 0.10 }, // Lvl 4
    { value: 3, chance: 0.10 }, // Lvl 5
    { value: 2, chance: 0.10 }, // Lvl 6
    { value: 2, chance: 0.10 }, // Lvl 7
    { value: 1, chance: 0.10 }, // Lvl 8
    { value: 1, chance: 0.10 }, // Lvl 9
    { value: 0, chance: 0.10 }  // Lvl 10
  ],
  tnt: [
    { value: 0.5,  chance: 0.10 },
    { value: 0.5,  chance: 0.20 },
    { value: 0.5,  chance: 0.30 },
    { value: 1.0,  chance: 0.15 },
    { value: 1.0,  chance: 0.25 },
    { value: 1.0,  chance: 0.50 },
    { value: 1.5,  chance: 0.25 },
    { value: 1.5,  chance: 0.25 },
    { value: 1.5,  chance: 0.25 },
    { value: 1.0,  chance: 0.10 },
    { value: 1.0,  chance: 0.10 }
  ],
  stray: [
    { value: 0.12, chance: 1.00 },
    { value: 0.14, chance: 1.00 },
    { value: 0.16, chance: 0.50 },
    { value: 0.18, chance: 0.50 },
    { value: 0.20, chance: 0.50 },
    { value: 0.20, chance: 0.50 },
    { value: 0.20, chance: 0.25 },
    { value: 0.20, chance: 0.25 },
    { value: 0.15, chance: 0.25 },
    { value: 0.15, chance: 0.25 },
    { value: 0.10, chance: 0.10 }
  ],
  sunflower: [
    { value: 0.10, chance: 1.00 },
    { value: 0.10, chance: 1.00 },
    { value: 0.10, chance: 1.00 },
    { value: 0.10, chance: 1.00 },
    { value: 0.10, chance: 0.50 },
    { value: 0.10, chance: 0.50 },
    { value: 0.10, chance: 0.50 },
    { value: 0.05, chance: 0.25 },
    { value: 0.05, chance: 0.25 },
    { value: 0.05, chance: 0.25 },
    { value: 0,    chance: 1.00 }
  ],
  sniper: [
    { value: 0,    chance: 0.00 },
    { value: 0,    chance: 0.00 },
    { value: 0.05, chance: 1.00 },
    { value: 0.10, chance: 1.00 },
    { value: 0.15, chance: 1.00 },
    { value: 0.20, chance: 1.00 },
    { value: 0.30, chance: 1.00 },
    { value: 0.40, chance: 0.50 },
    { value: 0.50, chance: 0.50 },
    { value: 0.75, chance: 0.25 },
    { value: 1.00, chance: 0.25 }
  ],
  spawner: [
    { value: 0.1, chance: 0.05, budget: 30,  dangerRange: [1, 1] }, // Lvl 0
    { value: 0.1, chance: 0.10, budget: 60,  dangerRange: [1, 2] }, // Lvl 1
    { value: 0.2, chance: 0.10, budget: 60,  dangerRange: [1, 3] }, // Lvl 2
    { value: 0.2, chance: 0.15, budget: 90,  dangerRange: [1, 3] }, // Lvl 3
    { value: 0.3, chance: 0.15, budget: 90,  dangerRange: [2, 4] }, // Lvl 4
    { value: 0.3, chance: 0.20, budget: 150, dangerRange: [2, 5] }, // Lvl 5
    { value: 0.4, chance: 0.20, budget: 150, dangerRange: [3, 5] }, // Lvl 6
    { value: 0.4, chance: 0.25, budget: 200, dangerRange: [3, 6] }, // Lvl 7
    { value: 0.5, chance: 0.25, budget: 200, dangerRange: [3, 6] }, // Lvl 8
    { value: 0.6, chance: 0.25, budget: 200, dangerRange: [4, 6] }, // Lvl 9
    { value: 0.7, chance: 0.25, budget: 200, dangerRange: [5, 6] }  // Lvl 10
  ]
};
