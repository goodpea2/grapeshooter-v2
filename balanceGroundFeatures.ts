
import { HOUR_FRAMES } from './constants';

export const groundFeatureTypes: any = {
  gf_fire_puddle: {
    name: 'Fire Puddle',
    life: 60,
    radius: 16,
    damage: 3, // firepea's fire puddle also damages obstacles
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 100, 50],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 2 }], // this damage is its own source
    conditionDuration: 60
  },
  gf_fire_puddle_t3: {
    name: 'T3 Fire Puddle',
    life: 240, // 4 seconds
    radius: 20,
    damage: 3,
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 120, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 2 }],
    conditionDuration: 60
  },
  gf_fire_puddle_flamethrower: {
    name: 'Flamethrower fire',
    life: 60,
    radius: 20,
    damage: 2, // lower dmg to obstacles but stackable
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 120, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 5 }], // mainly burn dmg to enemies
    conditionDuration: 60
  },
  gf_fire_puddle_firecharge: {
    name: 'Firecharge fire',
    life: 180,
    radius: 24,
    damage: 5, // same dmg to both enemies and obstacles
    tickRate: 15,
    vfxType: 'fire_puddle',
    color: [255, 120, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 0 }], // mainly burn dmg to enemies
    conditionDuration: 60
  },
  gf_firecherry_puddle: {
    name: 'Cherry Fire',
    life: HOUR_FRAMES * 2,
    radius: 20,
    damage: 1,
    tickRate: 6,
    vfxType: 'fire_puddle',
    color: [255, 50, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 1 }],
    conditionDuration: 60
  },
  gf_stun_gas: {
    name: 'Stun Gas',
    life: HOUR_FRAMES * 2,
    radius: 32,
    damage: 0,
    tickRate: 10,
    vfxType: 'stun_gas',
    color: [200, 200, 255],
    appliedCondition: 'c_stun',
    conditionDuration: 120
  },
  gf_stun_gas_t3: {
    name: 'Stun Gas T3',
    life: HOUR_FRAMES * 3,
    radius: 34,
    damage: 0,
    tickRate: 10,
    vfxType: 'stun_gas',
    color: [200, 200, 255],
    appliedCondition: 'c_stun',
    conditionDuration: 180
  },
  gf_poison_gas: {
    name: 'Poison Gas',
    life: HOUR_FRAMES,
    radius: 34,
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
