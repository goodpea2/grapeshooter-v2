import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_iceray } from './t2_iceray';

export const t3_iceray2: TurretConfig = { 
  ...t2_iceray,
  name: 'Ice Laser MK2', costs: { sun: 45 }, costAlmanac: { shard: 6, ice: 9 }, drops: { shard: 2, ice: 1 }, health: 50, color: [180, 255, 255], size: 22, tier: 3, 
  tooltip: "Freezes the enemies contacting the laser beam", animationBodyType: 'tough',
  actionConfig: { 
    ...t2_iceray.actionConfig,
    beamDamage: 10, 
    beamDamageRate: 6, 
    beamWidth: 6, 
    beamFireRate: 6, 
    beamDamageWidth: GRID_SIZE * 0.5, 
    beamMaxLength: GRID_SIZE * 8,
    appliedConditions: [{ type: 'c_stun', duration: 60 }],
    spawnOnTargetDeathConfig: { count: 16, bulletTypeKey: 'b_snowpea', pattern: 'volley', spawnAt: 'turret', onlyTriggerFromIntendedTargetDeath: true }
  },
};
