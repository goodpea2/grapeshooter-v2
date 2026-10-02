// ==========================================
// Multi-Layered Core-and-Shell Cell Types Configuration
// ==========================================

export type CellLayerKey = 'tree' | 'dirt' | 'clay' | 'stone' | 'lake';

export interface CellRingOverlayOption {
  key: string;       // e.g. 'oreLeaf', 'spawner_lv1_A', or 'none'
  weight: number;    // selection weight
  budget?: number;   // optional spawner budget override
}

export interface CellRingThresholdConfig {
  threshold: number;         // Relative radius cutoff rEff (0.0 = outer shell, 0.7+ = mantle, 0.9+ = core)
  materials: string[];       // e.g. ['o_bush'], ['o_dirt', 'o_clay'], ['l_water']
  overlays: CellRingOverlayOption[]; // Weighted overlays
  airRatio: number;          // Additional air cutoff ratio within this ring (0.0 = solid, 1.0 = air)
}

export interface CellularLayerConfig {
  key: CellLayerKey;
  name: string;
  tier: number;                 // 0 = base tree, 1 = dirt, 2 = clay, 3 = stone, 4 = lake (higher tier overrides lower)
  seedOffset: number;           // Independent seed per layer
  superGridSize: number[];      // [Lv0..Lv10] coarse feature point supergrid distance per level
  ringThresholdConfig: CellRingThresholdConfig[]; // Ordered concentric rings from outer (lower threshold) to inner (higher threshold)
  isLiquid?: boolean;
  levelWeights: number[];       // [Lv0..Lv10] spawn probability weights (0-100)
}

// 5 Layer Configs ordered by evaluation tier (lowest tier -> highest tier override)
export const CELL_LAYERS: CellularLayerConfig[] = [
  {
    key: 'tree',
    name: 'Tree Cell',
    tier: 0,
    seedOffset: 16,
    superGridSize: [8, 12, 12, 8, 8, 8, 8, 8, 8, 8, 8],
    ringThresholdConfig: [
      {
        threshold: 0.0,
        materials: ['o_bush'],
        overlays: [{ key: 'none', weight: 10 }],
        airRatio: 0.30
      },
      {
        threshold: 0.85,
        materials: ['o_bush', 'o_dirt'],
        overlays: [{ key: 'none', weight: 10 }],
        airRatio: 0.0
      },
      {
        threshold: 0.95,
        materials: ['o_dirt'],
        overlays: [{ key: 'oreLeaf', weight: 7 }, { key: 'none', weight: 3 }],
        airRatio: 0.0
      }
    ],
    isLiquid: false,
    levelWeights: [100, 50, 25, 12, 6, 3, 0, 0, 0, 0, 0]
  },
  {
    key: 'dirt',
    name: 'Dirt Batch',
    tier: 1,
    seedOffset: 100,
    superGridSize: [20, 20, 26, 26, 20, 20, 20, 20, 20, 20, 20],
    ringThresholdConfig: [
      {
        threshold: 0.0,
        materials: ['o_dirt'],
        overlays: [{ key: 'none', weight: 10 }],
        airRatio: 0.0
      },
      {
        threshold: 0.75,
        materials: ['o_dirt'],
        overlays: [{ key: 'none', weight: 9 }, { key: 'oreLeaf', weight: 1 }],
        airRatio: 0.0
      },
      {
        threshold: 0.90,
        materials: ['o_clay'],
        overlays: [
          { key: 'none', weight: 5 },
          { key: 'oreLeaf', weight: 1 },
          { key: 'spawner_lv1_A', weight: 1, budget: 60 }
        ],
        airRatio: 0.0
      }
    ],
    isLiquid: false,
    levelWeights: [40, 80, 60, 60, 30, 15, 8, 4, 0, 0, 0]
  },
  {
    key: 'clay',
    name: 'Clay Batch',
    tier: 2,
    seedOffset: 200,
    superGridSize: [20, 20, 20, 26, 26, 26, 20, 20, 20, 20, 20],
    ringThresholdConfig: [
      {
        threshold: 0.0,
        materials: ['o_clay'],
        overlays: [{ key: 'none', weight: 10 }],
        airRatio: 0.0
      },
      {
        threshold: 0.75,
        materials: ['o_clay'],
        overlays: [{ key: 'none', weight: 9 }, { key: 'oreShard', weight: 1 }],
        airRatio: 0.0
      },
      {
        threshold: 0.90,
        materials: ['o_stone'],
        overlays: [
          { key: 'none', weight: 4 },
          { key: 'oreShard', weight: 4 },
          { key: 'sunMine', weight: 1 },
          { key: 'spawner_lv2_A', weight: 1, budget: 120 }
        ],
        airRatio: 0.0
      }
    ],
    isLiquid: false,
    levelWeights: [0, 10, 30, 90, 80, 40, 20, 10, 5, 0, 0]
  },
  {
    key: 'stone',
    name: 'Stone Batch',
    tier: 3,
    seedOffset: 300,
    superGridSize: [12, 12, 12, 12, 12, 16, 16, 16, 20, 20, 20],
    ringThresholdConfig: [
      {
        threshold: 0.0,
        materials: ['o_stone'],
        overlays: [{ key: 'none', weight: 10 }],
        airRatio: 0.0
      },
      {
        threshold: 0.75,
        materials: ['o_stone', 'o_clay'],
        overlays: [
          { key: 'none', weight: 7 },
          { key: 'oreShard', weight: 2 }
        ],
        airRatio: 0.0
      },
      {
        threshold: 0.90,
        materials: ['o_slate'],
        overlays: [
          { key: 'none', weight: 4 },
          { key: 'oreIce', weight: 2 },
          { key: 'sunMine', weight: 1 },
          { key: 'spawner_lv3_A', weight: 2, budget: 200 }
        ],
        airRatio: 0.0
      }
    ],
    isLiquid: false,
    levelWeights: [0, 0, 8, 30, 60, 90, 60, 30, 15, 10, 5]
  },
  {
    key: 'lake',
    name: 'Lake Cell',
    tier: 4,
    seedOffset: 400,
    superGridSize: [26, 26, 26, 26, 32, 32, 32, 26, 26, 16, 16],
    ringThresholdConfig: [
      {
        threshold: 0.0,
        materials: ['o_stone', 'o_dirt'],
        overlays: [{ key: 'none', weight: 9 }, { key: 'oreLeaf', weight: 1 }],
        airRatio: 0.0
      },
      {
        threshold: 0.65,
        materials: ['l_water'],
        overlays: [{ key: 'none', weight: 10 }],
        airRatio: 0.0
      },
      {
        threshold: 0.90,
        materials: ['l_water', 'l_ice'],
        overlays: [
          { key: 'none', weight: 4 },
          { key: 'sunMine', weight: 1 },
          { key: 'spawner_lv3_A', weight: 4, budget: 200 }
        ],
        airRatio: 0.0
      }
    ],
    isLiquid: true,
    levelWeights: [0, 10, 0, 20, 80, 100, 50, 20, 5, 0, 0]
  }
];

export const CELL_LAYER_MAP: Record<CellLayerKey, CellularLayerConfig> = {
  tree: CELL_LAYERS[0],
  dirt: CELL_LAYERS[1],
  clay: CELL_LAYERS[2],
  stone: CELL_LAYERS[3],
  lake: CELL_LAYERS[4]
};

// Backward-compatibility references
export const CELL_TYPES = CELL_LAYER_MAP as any;
export const CELL_TYPE_KEYS: CellLayerKey[] = ['tree', 'dirt', 'clay', 'stone', 'lake'];
export type CellTypeKey = CellLayerKey;

// Air corridor threshold per level (0.0 to 1.0): higher number = wider air corridor / more traversable space
// Deep levels have lower air cutoff, resulting in denser underground cell networks
export const AIR_CUTOFF_PER_LEVEL: number[] = [
  0.75, // Lv 0 (wide open pathways)
  0.55, // Lv 1
  0.65, // Lv 2
  0.40, // Lv 3
  0.55, // Lv 4
  0.38, // Lv 5
  0.40, // Lv 6
  0.32, // Lv 7
  0.24, // Lv 8
  0.18, // Lv 9
  0.12  // Lv 10 (tight, dense cavernous corridors)
];

// Global real-time tunable parameters for cellular worldgen & WorldPreview
export interface WorldGenCellularParams {
  superGridMultiplier: number;
  globalAirCutoffOffset: number;
  boundaryJitterAmp: number;
  oreChanceMultiplier: number;
  spawnerChanceMultiplier: number;
  worldSeed: number;
}

export const WORLD_GEN_CELLULAR_CONFIG: WorldGenCellularParams = {
  superGridMultiplier: 1.0,
  globalAirCutoffOffset: 0.0,
  boundaryJitterAmp: 0.0,
  oreChanceMultiplier: 1.0,
  spawnerChanceMultiplier: 1.0,
  worldSeed: 4242
};
