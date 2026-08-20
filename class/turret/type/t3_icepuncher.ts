import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_puncher } from './t2_puncher';

export const t3_icepuncher: TurretConfig = { 
  ...t2_puncher,
  name: 'Ice Puncher', costs: { sun: 50 }, costAlmanac: { shard: 8, fuel: 2, ice: 8 }, drops: { shard: 1, fuel: 1, ice: 1 }, health: 50, color: [150, 200, 255], size: 24, tier: 3, 
  tooltip: "Fires close-range laser that also slows down enemies", animationBodyType: 'tough',
  actionConfig: { 
    ...t2_puncher.actionConfig,
    beamDamage: 10, beamWidth: 10, beamFireRate: 15, beamMaxLength: GRID_SIZE * 2.5, beamBulletTypeKey: 'b_icepuncher_hit' 
  },
};
