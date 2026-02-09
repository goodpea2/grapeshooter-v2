import { GRID_SIZE, HOUR_FRAMES } from './constants';

export const obstacleTypes: any = {
  o_dirt: { name: 'Dirt', health: 100, color: [40, 180, 80], borderColor: [60, 220, 100], blocksLOS: true },
  o_clay: { name: 'Clay', health: 200, color: [220, 120, 60], borderColor: [255, 160, 100], blocksLOS: true },
  o_stone: { name: 'Stone', health: 400, color: [80, 60, 200], borderColor: [120, 100, 255], blocksLOS: true },
  o_slate: { name: 'Slate', health: 800, color: [40, 30, 80], borderColor: [70, 60, 140], blocksLOS: true },
  o_black: { name: 'Obsidian', health: 1500, color: [200, 20, 60], borderColor: [255, 60, 100], blocksLOS: true }
};

export const overlayTypes: any = {
  sunTiny: { 
    name: 'Tiny Sun', 
    minHealth: -1, 
    isValuable: true, 
    obstacleOverlayVfx: 'v_sun_tiny',
    isConcealedAlongWithObstacle: false,
    lootConfigOnDeath: { lootTableTypeKey: 'lt_sun', lootTableRollCount: 1, lootTableChance: 1 }
  },
  sunOre: { 
    name: 'Sun Ore', 
    minHealth: -1, 
    isValuable: true, 
    obstacleOverlayVfx: 'v_sun_ore',
    isConcealedAlongWithObstacle: false,
    lootConfigOnDeath: { lootTableTypeKey: 'lt_sun', lootTableRollCount: 3, lootTableChance: 1 }
  },
  sunClump: { 
    name: 'Sun Clump', 
    minHealth: -1, 
    isValuable: true, 
    obstacleOverlayVfx: 'v_sun_clump',
    isConcealedAlongWithObstacle: false,
    lootConfigOnDeath: { lootTableTypeKey: 'lt_sun', lootTableRollCount: 10, lootTableChance: 1 }
  },
  o_tnt: { 
    name: 'TNT', 
    minHealth: -1, 
    isValuable: false, 
    obstacleOverlayVfx: 'v_tnt',
    isConcealedAlongWithObstacle: true,
    concealedSparkleVfx: 'v_sparkle_white',
    bulletToSpawnOnDeath: ['b_tnt_explosion']
  },
  o_sunflower: { 
    name: 'Wild Sunflower', 
    minHealth: -1, 
    isValuable: true, 
    obstacleOverlayVfx: 'v_sunflower',
    isConcealedAlongWithObstacle: false,
    lootConfigOnDeath: { lootTableTypeKey: 'lt_sunflowerTurret', lootTableRollCount: 1, lootTableChance: 1 }
  },
  o_stray: { 
    name: 'Stray Crate', 
    minHealth: -1, 
    isValuable: true, 
    obstacleOverlayVfx: 'v_stray',
    isConcealedAlongWithObstacle: true,
    concealedSparkleVfx: 'v_sparkle_white',
    lootConfigOnDeath: { lootTableTypeKey: 'lt_strayTurret', lootTableRollCount: 1, lootTableChance: 1 }
  },
  sniperTower: { 
    name: 'Sniper Tower', 
    minHealth: 300, 
    isEnemy: true, 
    isValuable: false,
    obstacleOverlayVfx: 'v_sniper_tower',
    isConcealedAlongWithObstacle: false,
    enemyTurretConfig: { 
      sightRadius: 400, 
      shootRange: GRID_SIZE * 12, 
      shootFireRate: 360, 
      damage: 15, 
      bulletTypeKey: 'b_sniper_shot',
      seeThroughObstacles: true
    }
  },

  // --- MONSTER SPAWNERS ---
  spawner_lv1_A: {
    name: 'Spawner Lv1', minHealth: 200, isEnemy: true, isEnemySpawner: true, danger: 1, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 30, enemyTypeKey: ['e_basic', 'e_fast', 'e_armor1'], spawnRadius: 100, spawnTriggerRadius: 250, spawnInterval: -1, spawnIntervalConsumeBudget: true }
  },
  spawner_lv2_A: {
    name: 'Spawner Lv2', minHealth: 300, isEnemy: true, isEnemySpawner: true, danger: 2, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 60, enemyTypeKey: ['e_armor1', 'e_armor2', 'e_critter'], spawnRadius: 120, spawnTriggerRadius: 280, spawnInterval: -1, spawnIntervalConsumeBudget: true }
  },
  spawner_lv3_A: {
    name: 'Spawner Lv3', minHealth: 400, isEnemy: true, isEnemySpawner: true, danger: 3, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 90, enemyTypeKey: ['e_shooting', 'e_swarm'], spawnRadius: 150, spawnTriggerRadius: 300, spawnInterval: -1, spawnIntervalConsumeBudget: true }
  },
  spawner_lv4_A: {
    name: 'Spawner Lv4', minHealth: 600, isEnemy: true, isEnemySpawner: true, danger: 4, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 120, enemyTypeKey: ['e_basic', 'e_armor3', 'e_giant'], spawnRadius: 150, spawnTriggerRadius: 350, spawnInterval: -1, spawnIntervalConsumeBudget: true }
  },
  spawner_lv5_A: {
    name: 'Spawner Lv5', minHealth: 800, isEnemy: true, isEnemySpawner: true, danger: 5, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 150, enemyTypeKey: ['e_shooting', 'e_giant'], spawnRadius: 180, spawnTriggerRadius: 400, spawnInterval: -1, spawnIntervalConsumeBudget: true }
  },
  spawner_lv6_A: {
    name: 'Spawner Lv6', minHealth: 1200, isEnemy: true, isEnemySpawner: true, danger: 6, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 200, enemyTypeKey: ['e_giant'], spawnRadius: 200, spawnTriggerRadius: 450, spawnInterval: -1, spawnIntervalConsumeBudget: true }
  },
  // Interval variants
  spawner_lv3_30: {
    name: 'Fast Spawner Lv3', minHealth: 400, isEnemy: true, isEnemySpawner: true, danger: 3, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 90, enemyTypeKey: ['e_fast'], spawnRadius: 120, spawnTriggerRadius: 300, spawnInterval: 30, spawnIntervalConsumeBudget: true }
  },
  spawner_lv4_30: {
    name: 'Elite Spawner Lv4', minHealth: 500, isEnemy: true, isEnemySpawner: true, danger: 4, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 100, enemyTypeKey: ['e_armor1'], spawnRadius: 120, spawnTriggerRadius: 300, spawnInterval: 30, spawnIntervalConsumeBudget: true }
  },
  spawner_lv5_30: {
    name: 'Swarm Spawner Lv5', minHealth: 600, isEnemy: true, isEnemySpawner: true, danger: 5, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 150, enemyTypeKey: ['e_shooting', 'e_swarm'], spawnRadius: 150, spawnTriggerRadius: 350, spawnInterval: 30, spawnIntervalConsumeBudget: true }
  },
  spawner_lv1_360: {
    name: 'Slow Spawner Lv1', minHealth: 150, isEnemy: true, isEnemySpawner: true, danger: 1, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 30, enemyTypeKey: ['e_basic', 'e_fast'], spawnRadius: 100, spawnTriggerRadius: 200, spawnInterval: 360, spawnIntervalConsumeBudget: true }
  },
  spawner_lv2_360: {
    name: 'Slow Spawner Lv2', minHealth: 250, isEnemy: true, isEnemySpawner: true, danger: 2, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 60, enemyTypeKey: ['e_armor1', 'e_armor2'], spawnRadius: 100, spawnTriggerRadius: 200, spawnInterval: 360, spawnIntervalConsumeBudget: true }
  },
  spawner_lv4_360: {
    name: 'Slow Spawner Lv4', minHealth: 400, isEnemy: true, isEnemySpawner: true, danger: 4, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 120, enemyTypeKey: ['e_shooting', 'e_swarm'], spawnRadius: 120, spawnTriggerRadius: 250, spawnInterval: 360, spawnIntervalConsumeBudget: true }
  },
  spawner_lv4_5: {
    name: 'Infest Spawner Lv4', minHealth: 300, isEnemy: true, isEnemySpawner: true, danger: 4, obstacleOverlayVfx: 'v_spawner', isConcealedAlongWithObstacle: false,
    enemySpawnConfig: { budget: 80, enemyTypeKey: ['e_critter'], spawnRadius: 150, spawnTriggerRadius: 300, spawnInterval: 5, spawnIntervalConsumeBudget: true }
  }
};

export const BLOCK_WEIGHTS = [
  [5, 1, 0, 0, 0], [1, 1, 0, 0, 0], [1, 5, 1, 0, 0], [1, 5, 5, 0, 0],
  [1, 5, 25, 5, 0], [0, 1, 5, 5, 0], [0, 1, 5, 25, 5], [0, 1, 5, 25, 25],
  [0, 1, 1, 10, 25], [0, 0, 1, 5, 25], [0, 0, 1, 1, 25]
];

export const SPAWNER_CHANCE = [1, 0.01, 0.02, 0.02, 0.03, 0.03, 0.04, 0.04, 0.05, 0.06, 0.07];