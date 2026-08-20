import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_puncher } from './t2_puncher';

export const t3_puncher2: TurretConfig = { 
  ...t2_puncher,
  name: 'Puncher MK2', costs: { sun: 40 }, costAlmanac: { shard: 4, shell: 8 }, drops: { shard: 2, shell: 1 }, health: 400, color: [140, 140, 255], size: 24, tier: 3, 
  tooltip: "Fires stronger close-range laser at both enemies and obstacles", animationBodyType: 'tough',
  actionConfig: { 
    ...t2_puncher.actionConfig,
    beamDamage: 15, beamWidth: 12, beamFireRate: 15, beamMaxLength: GRID_SIZE * 2.5 
  },
};
