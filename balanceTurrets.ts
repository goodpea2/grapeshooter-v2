
import { GRID_SIZE, HOUR_FRAMES } from './constants';
import { turretTypeRegistry } from './class/turret/type';

const placeholderT3 = { 
  health: 400, color: [100, 100, 100], size: 22, actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
};

export const turretTypes: any = {
  ...turretTypeRegistry,

  // --- SPECIAL / REWARD ONLY ---
  t_seed: {
    name: 'Seed', cost: 0, health: 50, color: [200, 200, 200], size: 16, tier: 1.5,
    isActiveWhileMoving: false, animationBodyType: 'soft',
    tooltip: "Grows into a random Tier 1 turret over time. Water speeds up growth.",
    actionType: ['growth'],
    actionConfig: { maxGrowth: 32, growthInterval: HOUR_FRAMES * 0.25, growthPool: ['t_pea', 't_laser', 't_wall', 't_mine', 't_ice'] },
    targetType: [], targetConfig: {}
  },
  t_seed2: {
    name: 'Seed (T2)', cost: 0, health: 50, color: [255, 200, 50], size: 16, tier: 1.5,
    isActiveWhileMoving: false, animationBodyType: 'soft',
    tooltip: "Grows into a random Tier 2 turret over time. Water speeds up growth.",
    actionType: ['growth'],
    actionConfig: { maxGrowth: 48, growthInterval: HOUR_FRAMES * 0.25, growthPool: ['t2_repeater', 't2_firepea', 't2_laser2', 't2_peanut', 't2_puncher', 't2_tall', 't2_mortar', 't2_pulse', 't2_laserexplode', 't2_minespawner', 't2_snowpea', 't2_iceray', 't2_spike', 't2_icebomb', 't2_stun'] },
    targetType: [], targetConfig: {}
  },
  t_farm_bush: {
    name: 'Fern Pot', costs: { sun: 40 }, costAlmanac: { soil: 30 }, drops: { leaf: 2 }, health: 100, color: [50, 150, 50], size: 22, tier: 1,
    tooltip: "Grows a bush that drop leaves on harvest, attracts and consumes elixir",
    animationBodyType: 'soft',
    actionType: ['farm'],
    actionConfig: {},
    farmConfig: {
      assetImg: [
        'img_t_farm_bush_stage0',
        'img_t_farm_bush_stage1',
        'img_t_farm_bush_stage2',
        'img_t_farm_bush_stage3',
        'img_t_farm_bush_stage4',
        'img_t_farm_bush_stage5'
      ],
      elixirRequired: [2, 0, 2, 0, 2, 0],
      growthTimer: [HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, 0],
      harvestStageHp: 100,
      lootOnHarvest: { leaf: [3, 4], extra: { chance: 0.5, items: ['leaf', 'shell'] } },
      resetAfterHarvest: true,
      attractRange: GRID_SIZE * 4
    },
    targetType: [], targetConfig: {}
  },
  t_farm_crystal: {
    name: 'Crystal Pot', costs: { sun: 40 }, costAlmanac: { soil: 30 }, drops: { shard: 2 }, health: 100, color: [100, 200, 255], size: 22, tier: 1,
    tooltip: "Grows a bulb that drops shards on harvest, attracts and consumes elixir",
    animationBodyType: 'tough',
    actionType: ['farm'],
    actionConfig: {},
    farmConfig: {
      assetImg: [
        'img_t_farm_crystal_stage0',
        'img_t_farm_crystal_stage1',
        'img_t_farm_crystal_stage2',
        'img_t_farm_crystal_stage3',
        'img_t_farm_crystal_stage4',
        'img_t_farm_crystal_stage5'
      ],
      elixirRequired: [2, 0, 2, 0, 2, 0],
      growthTimer: [HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, 0],
      harvestStageHp: 100,
      lootOnHarvest: { shard: [3, 4], extra: { chance: 0.5, items: ['shard', 'shell'] } },
      resetAfterHarvest: true,
      attractRange: GRID_SIZE * 4
    },
    targetType: [], targetConfig: {}
  },
  t_farm_mob: {
    name: 'Raisin Mold', costs: { sun: 30 }, costAlmanac: { elixir: 10, raisin: 1 }, drops: { shell: 2 }, health: 100, color: [150, 50, 200], size: 22, tier: 1,
    tooltip: "Occasionally spawns an enemy nearby",
    animationBodyType: 'soft',
    actionType: ['farm'],
    actionConfig: {},
    farmConfig: {
      assetImg: [
        'img_t_farm_mob_stage0',
        'img_t_farm_mob_stage1',
        'img_t_farm_mob_stage2',
        'img_t_farm_mob_stage3',
        'img_t_farm_mob_stage4'
      ],
      elixirRequired: [0, 0, 0, 0, 0],
      growthTimer: [HOUR_FRAMES * 0.5, HOUR_FRAMES * 0.5, HOUR_FRAMES * 0.5, HOUR_FRAMES * 0.5, 0],
      isMobFarm: true,
      mobSpawnConfig: {
        enemies: ['e_basic', 'e_armor1'],
        spawnDist: GRID_SIZE * 2
      },
      resetAfterHarvest: true
    },
    targetType: [], targetConfig: {}
  },

  // --- TIER 2 ---

  // --- TIER 3 ---
};
