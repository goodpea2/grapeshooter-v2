
export interface RoomPrefab {
  id: string;
  name: string;
  roomValue: number;
  roomLevel: number; // Placeholder/Decorative label
  enemyBudget: number;
  worldGenConfig: {
    minAirRatio: number;
    airIncludeLiquid: boolean;
    enemySpawnerCount: [number, number];
    enemySpawnerConfig: {
      danger: number;
      enemySpawnConfig: {
        budget: [number, number];
      };
    };
    sun: [number, number];
    tnt: [number, number];
    crate: [number, number];
    guaranteedObstacleConfig: {
      type: string;
      count: [number, number];
    }[];
    guaranteedNpc?: string; // e.g. "NPC_tutorial", "lv1 npc", "lv2 npc", "lv3 npc"
    prioritizeUniqueNpc?: boolean;
    guaranteedOverlay?: string; // e.g. "ov_treasurechest_100"
  };
}

// Common Defaults
const AIR_NOT_REQUIRED = { minAirRatio: 0, airIncludeLiquid: false };
const AIR_DEFAULT = { minAirRatio: 0.4, airIncludeLiquid: false };

export const ROOM_PREFABS: RoomPrefab[] = [
  // --- Empty Prefab ---
  { id: 'emt0', name: 'Empty Room', roomValue: 0, roomLevel: 0, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 0], tnt: [0, 0], crate: [0, 0], guaranteedObstacleConfig: [] } },

  // --- Treasure Rooms ---
  { id: 'tre1', name: 'Treasure 1', roomValue: 100, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 0], crate: [0, 5], guaranteedObstacleConfig: [], guaranteedOverlay: 'ov_treasurechest_100' } },
  { id: 'tre2', name: 'Treasure 2', roomValue: 200, roomLevel: 2, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 0], crate: [0, 5], guaranteedObstacleConfig: [], guaranteedOverlay: 'ov_treasurechest_200' } },
  { id: 'tre3', name: 'Treasure 3', roomValue: 300, roomLevel: 3, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 0], crate: [0, 5], guaranteedObstacleConfig: [], guaranteedOverlay: 'ov_treasurechest_300' } },

  // --- NPC Rooms ---
  { id: 'tut0', name: 'Tutor Base', roomValue: 0, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [5, 5], tnt: [0, 0], crate: [0, 0], guaranteedObstacleConfig: [], guaranteedNpc: 'NPC_tutorial' } },
  { id: 'npc1', name: 'Outpost 1', roomValue: 0, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 0], crate: [0, 5], guaranteedObstacleConfig: [], guaranteedNpc: 'lv1 npc', prioritizeUniqueNpc: true } },
  { id: 'npc2', name: 'Outpost 2', roomValue: 0, roomLevel: 2, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 0], crate: [0, 5], guaranteedObstacleConfig: [], guaranteedNpc: 'lv2 npc', prioritizeUniqueNpc: true } },
  { id: 'npc3', name: 'Outpost 3', roomValue: 0, roomLevel: 3, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 0], crate: [0, 5], guaranteedObstacleConfig: [], guaranteedNpc: 'lv3 npc', prioritizeUniqueNpc: true } },

  // --- Existing Prefabs ---
  { id: 'mon1', name: 'Monster Room 1', roomValue: -20, roomLevel: 1, enemyBudget: 60, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'mon2', name: 'Monster Room 2', roomValue: -40, roomLevel: 2, enemyBudget: 150, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'mon3', name: 'Monster Room 3', roomValue: -80, roomLevel: 3, enemyBudget: 350, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'mon4', name: 'Monster Room 4', roomValue: -160, roomLevel: 4, enemyBudget: 800, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'mon5', name: 'Monster Room 5', roomValue: -300, roomLevel: 5, enemyBudget: 1500, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },

  { id: 'bos1', name: 'Boss Room 1', roomValue: -100, roomLevel: 1, enemyBudget: 600, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'bos2', name: 'Boss Room 2', roomValue: -200, roomLevel: 2, enemyBudget: 1500, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'bos3', name: 'Boss Room 3', roomValue: -300, roomLevel: 3, enemyBudget: 3500, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'bos4', name: 'Boss Room 4', roomValue: -400, roomLevel: 4, enemyBudget: 8000, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'bos5', name: 'Boss Room 5', roomValue: -500, roomLevel: 5, enemyBudget: 15000, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [0, 0], guaranteedObstacleConfig: [] } },

  { id: 'spw1', name: 'Nest Room 1', roomValue: 0, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [4, 10], enemySpawnerConfig: { danger: 1, enemySpawnConfig: { budget: [30, 50] } }, sun: [0, 10], tnt: [0, 2], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'spw2', name: 'Nest Room 2', roomValue: 0, roomLevel: 2, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [4, 10], enemySpawnerConfig: { danger: 2, enemySpawnConfig: { budget: [60, 100] } }, sun: [0, 10], tnt: [0, 2], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'spw3', name: 'Nest Room 3', roomValue: 0, roomLevel: 3, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [4, 10], enemySpawnerConfig: { danger: 3, enemySpawnConfig: { budget: [120, 200] } }, sun: [0, 10], tnt: [0, 2], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'spw4', name: 'Nest Room 4', roomValue: 0, roomLevel: 4, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [4, 10], enemySpawnerConfig: { danger: 4, enemySpawnConfig: { budget: [200, 320] } }, sun: [0, 10], tnt: [0, 2], crate: [0, 0], guaranteedObstacleConfig: [] } },
  { id: 'spw5', name: 'Nest Room 5', roomValue: 0, roomLevel: 5, enemyBudget: 0, worldGenConfig: { ...AIR_DEFAULT, enemySpawnerCount: [4, 10], enemySpawnerConfig: { danger: 5, enemySpawnConfig: { budget: [300, 480] } }, sun: [0, 10], tnt: [0, 2], crate: [0, 0], guaranteedObstacleConfig: [] } },

  { id: 'sun1', name: 'Sun Cache 1', roomValue: 20, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [15, 25], tnt: [0, 2], crate: [0, 4], guaranteedObstacleConfig: [] } },
  { id: 'sun2', name: 'Sun Cache 2', roomValue: 40, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [30, 50], tnt: [0, 3], crate: [0, 5], guaranteedObstacleConfig: [] } },
  { id: 'sun3', name: 'Sun Cache 3', roomValue: 80, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [50, 85], tnt: [0, 4], crate: [0, 6], guaranteedObstacleConfig: [] } },
  { id: 'sun4', name: 'Sun Cache 4', roomValue: 160, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [80, 130], tnt: [0, 5], crate: [0, 7], guaranteedObstacleConfig: [] } },
  { id: 'sun5', name: 'Sun Cache 5', roomValue: 300, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [120, 180], tnt: [0, 6], crate: [0, 8], guaranteedObstacleConfig: [] } },

  { id: 'xpl1', name: 'Blast Zone 1', roomValue: 10, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [5, 10], tnt: [2, 4], crate: [0, 2], guaranteedObstacleConfig: [] } },
  { id: 'xpl2', name: 'Blast Zone 2', roomValue: 20, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [5, 20], tnt: [4, 8], crate: [0, 3], guaranteedObstacleConfig: [] } },
  { id: 'xpl3', name: 'Blast Zone 3', roomValue: 30, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [5, 30], tnt: [8, 16], crate: [0, 4], guaranteedObstacleConfig: [] } },

  { id: 'crt1', name: 'Storage Room 1', roomValue: 20, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [4, 8], guaranteedObstacleConfig: [] } },
  { id: 'crt2', name: 'Storage Room 2', roomValue: 40, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [8, 16], guaranteedObstacleConfig: [] } },
  { id: 'crt3', name: 'Storage Room 3', roomValue: 80, roomLevel: 1, enemyBudget: 0, worldGenConfig: { ...AIR_NOT_REQUIRED, enemySpawnerCount: [0, 0], enemySpawnerConfig: { danger: 0, enemySpawnConfig: { budget: [0, 0] } }, sun: [0, 5], tnt: [0, 1], crate: [16, 32], guaranteedObstacleConfig: [] } },
];
