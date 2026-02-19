
import { HOUR_FRAMES } from './constants';

export const groundFeatureTypes: any = {
  gf_fire_puddle: {
    name: 'Fire Puddle',
    life: 60,
    radius: 16,
    damage: 1, // firepea's fire puddle also damages obstacles
    tickRate: 6,
    vfxType: 'fire_puddle',
    color: [255, 100, 50],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 1 }], // this damage is its own source
    conditionDuration: 60
  },
  gf_fire_puddle_t3: {
    name: 'T3 Fire Puddle',
    life: 180, // 3 seconds
    radius: 20,
    damage: 1,
    tickRate: 6,
    vfxType: 'fire_puddle',
    color: [255, 120, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 1 }],
    conditionDuration: 60
  },
  gf_fire_puddle_flamethrower: {
    name: 'Flamethrower fire',
    life: 60,
    radius: 20,
    damage: 0.25, // lower dmg to obstacles but stackable
    tickRate: 6,
    vfxType: 'fire_puddle',
    color: [255, 120, 0],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 1 }], // mainly burn dmg to enemies
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
  gf_forcefield: {
    name: 'Forcefield',
    life: 180,
    radius: 51, // ~1.5 tiles (34 * 1.5)
    damage: 0,
    tickRate: 1,
    vfxType: 'forcefield',
    color: [50, 150, 255]
  }
};
