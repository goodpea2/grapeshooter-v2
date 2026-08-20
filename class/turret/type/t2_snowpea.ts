import { TurretConfig } from '../turretConfig';
import { t_pea } from './t_pea';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';

export class SnowpeaAttachedTurret extends AttachedTurret {}
export class SnowpeaWorldTurret extends WorldTurret {}

export const t2_snowpea: TurretConfig = {
  ...t_pea,
  name: 'Snowpea', 
  costs: { sun: 25 }, 
  costAlmanac: { leaf: 5, ice: 3 }, 
  drops: { leaf: 1, ice: 1 }, 
  color: [200, 250, 255], 
  tier: 2,
  tooltip: "Shoots snow at random enemies, slowing them down",
  actionConfig: { 
    ...t_pea.actionConfig,
    bulletTypeKey: 'b_snowpea' 
  },
  targetConfig: { 
    ...t_pea.targetConfig,
    enemyPriority: 'random' 
  }
};
