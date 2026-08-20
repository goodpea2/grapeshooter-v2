import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_laser } from './t_laser';

export const t2_laser2: TurretConfig = {
  ...t_laser,
  name: 'Laser MK2', costs: { sun: 25 }, costAlmanac: { shard: 8 }, drops: { shard: 2 }, health: 50, color: [100, 100, 255], size: 22, tier: 2,
  tooltip: "Laser breaks obstacles faster", animationBodyType: 'tough',
  actionConfig: { 
    ...t_laser.actionConfig,
    beamDamage: 10, beamWidth: 6, beamMaxLength: GRID_SIZE * 10 
  }
};
