
import { HOUR_FRAMES } from './constants';

export const groundFeatureTypes: any = {
  gf_fire_puddle: {
    name: 'Fire Puddle',
    life: 60,
    radius: 16,
    damage: 1,
    tickRate: 6,
    vfxType: 'fire_puddle',
    color: [255, 100, 50],
    appliedCondition: [{ type: 'c_burning', duration: 60, damage: 0 }],
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
