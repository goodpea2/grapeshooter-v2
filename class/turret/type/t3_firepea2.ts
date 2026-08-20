import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_firepea } from './t2_firepea';

export const t3_firepea2: TurretConfig = { 
  ...t2_firepea,
  name: 'Firepea MK2', costs: { sun: 60 }, costAlmanac: { leaf: 8, shard: 12 }, drops: { leaf: 2, shard: 1 }, health: 100, color: [255, 100, 0], size: 22, tier: 3,
  tooltip: "Shoots and leaves a bigger-longer lasting flame puddle", animationBodyType: 'soft',
  actionConfig: { 
    ...t2_firepea.actionConfig,
    bulletTypeKey: 'b_firepea_t3', shootRange: GRID_SIZE * 10, shootFireRate: 60 
  },
};
