import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_snowpea } from './t2_snowpea';

export const t3_snowpea2: TurretConfig = { 
  ...t2_snowpea,
  name: 'Snowpea MK2', costs: { sun: 60 }, costAlmanac: { leaf: 9, ice: 6 }, drops: { leaf: 2, ice: 1 }, health: 100, color: [100, 200, 255], size: 22, tier: 3,
  tooltip: "Shoots ice at random enemies, stun-locking them", animationBodyType: 'soft',
  actionConfig: { 
    ...t2_snowpea.actionConfig,
    bulletTypeKey: 'b_snowpea2', shootRange: GRID_SIZE * 10, shootFireRate: 45 
  },
};
