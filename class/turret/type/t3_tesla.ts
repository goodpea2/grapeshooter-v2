import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_tesla: TurretConfig = { 
  name: 'Tesla Laser', costs: { sun: 40 }, costAlmanac: { shard: 4, shell: 6, ice: 2 }, drops: { shard: 1, shell: 1, ice: 1 }, health: 300, color: [100, 200, 255], size: 24, tier: 3, 
  tooltip: "Creates electric chains between other Teslas, damaging everything on the way", animationBodyType: 'tough',
  actionType: ['generateElectricChain', 'shoot'],
  actionConfig: { 
    electricChainDamageRate: 15, electricChainDamage: 5, electricChainDamageWidth: GRID_SIZE,
    electricChainMaxLength: GRID_SIZE * 5, electricChainMaxDamage: 15,
    bulletTypeKey: 'b_tesla_zap', shootRange: GRID_SIZE * 2, shootFireRate: 15
  },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { enemyPriority: 'closest' }
};
