
import { HOUR_FRAMES } from './constants';

export const groundFeatureTypes: any = {
  gf_fire_firepea: {
    name: 'Fire Puddle',
    life: 60,
    radius: 16,
    damageConfig: {
      enemy: 0,
      turret: 0,
      player: 0,
      obstacle: 5
    },
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 100, 50],
    appliedCondition: [{ type: 'c_burning', duration: 60, damageConfig: { enemy: 5, turret: 1, player: 1 } }]
  },
  gf_fire_firepeat3: {
    name: 'T3 Fire Puddle',
    life: 360, // 6 seconds
    radius: 20,
    damageConfig: {
      enemy: 0,
      turret: 0,
      player: 0,
      obstacle: 5
    },
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 120, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damageConfig: { enemy: 5, turret: 1, player: 1 } }]
  },
  gf_fire_flamethrower: {
    name: 'Flamethrower Fire',
    life: 60,
    radius: 20,
    damageConfig: {
      enemy: 0,
      turret: 0,
      player: 0,
      obstacle: 3
    },
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 100, 50],
    appliedCondition: [{ type: 'c_burning', duration: 60, damageConfig: { enemy: 5, turret: 0, player: 0 } }]
  },
  gf_fire_firecharge: {
    name: 'Firecharge Fire',
    life: 180,
    radius: 24,
    damageConfig: {
      enemy: 0,
      turret: 0,
      player: 0,
      obstacle: 5
    },
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 120, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damageConfig: { enemy: 5, turret: 0, player: 0 } }]
  },
  gf_fire_firecherry: {
    name: 'Cherry Fire',
    life: HOUR_FRAMES * 2,
    radius: 20,
    damageConfig: {
      enemy: 0,
      turret: 0,
      player: 0,
      obstacle: 10
    },
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 50, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damageConfig: { enemy: 5, turret: 0, player: 0 } }]
  },
  gf_stun_gas: {
    name: 'Stun Gas',
    life: HOUR_FRAMES * 2,
    radius: 32,
    damageConfig: { enemy: 0, turret: 0, player: 0, obstacle: 0 },
    damage: 0,
    tickRate: 10,
    vfxType: 'stun_gas',
    color: [200, 200, 255],
    appliedCondition: [{ type: 'c_stun', duration: 120 }]
  },
  gf_stun_gas_t3: {
    name: 'Stun Gas T3',
    life: HOUR_FRAMES * 3,
    radius: 34,
    damageConfig: { enemy: 0, turret: 0, player: 0, obstacle: 0 },
    damage: 0,
    tickRate: 10,
    vfxType: 'stun_gas',
    color: [200, 200, 255],
    appliedCondition: [{ type: 'c_stun', duration: 180 }]
  },
  gf_poison_gas: {
    name: 'Poison Gas',
    life: HOUR_FRAMES,
    radius: 34,
    damageConfig: { enemy: 0, turret: 2.5, player: 2.5, obstacle: 0 },
    damage: 2.5,
    tickRate: 30,
    vfxType: 'poison_gas',
    color: [150, 255, 100],
    damageTargets: ['turret', 'player']
  },
  gf_forcefield: {
    name: 'Forcefield',
    life: 180,
    radius: 51, // ~1.5 tiles (34 * 1.5)
    damageConfig: { enemy: 0, turret: 0, player: 0, obstacle: 0 },
    damage: 0,
    tickRate: 1,
    vfxType: 'forcefield',
    color: [50, 150, 255]
  },
  gf_spawner: {
    name: 'Ground Spawner',
    life: Infinity,
    radius: 34,
    isEnemySpawner: true,
    isEnemy: true,
    danger: 3,
    isDanger: true,
    color: [180, 50, 220],
    assetImgConfig: { idleAssetImg: ['img_ground_spawner_a'], randomRotation: false, randomFlip: false },
    enemySpawnConfig: {
      budget: 60,
      enemyTypeKey: ['e_basic'],
      spawnRadius: 120,
      spawnTriggerRadius: 200,
      spawnInterval: 60,
      spawnIntervalConsumeBudget: true
    }
  }
};

// Backward-compatibility aliases for existing saves/maps
groundFeatureTypes.gf_fire_puddle = groundFeatureTypes.gf_fire_firepea;
groundFeatureTypes.gf_fire_puddle_t3 = groundFeatureTypes.gf_fire_firepeat3;
groundFeatureTypes.gf_fire_puddle_flamethrower = groundFeatureTypes.gf_fire_flamethrower;
groundFeatureTypes.gf_fire_puddle_firecharge = groundFeatureTypes.gf_fire_firecharge;
groundFeatureTypes.gf_firecherry_puddle = groundFeatureTypes.gf_fire_firecherry;
