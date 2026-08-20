import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_laser } from './t_laser';

export const t2_laserexplode: TurretConfig = {
  ...t_laser,
  name: 'Exploding Laser', costs: { sun: 30 }, costAlmanac: { shard: 4, fuel: 6 }, drops: { shard: 1, fuel: 1 }, health: 50, color: [150, 40, 40], size: 22, tier: 2,
  tooltip: "Broken obstacle explodes, damaging nearby enemies and obstacles", animationBodyType: 'tough',
  actionConfig: { 
    ...t_laser.actionConfig,
    spawnBulletOnTargetDeath: 'b_laser_explosion'
  }
};
