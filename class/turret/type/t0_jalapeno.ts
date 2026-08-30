import { TurretConfig } from '../turretConfig';
import { HOUR_FRAMES } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';

export const t0_jalapeno: TurretConfig = {
  name: 'Rage Chili', costs: { elixir: 20 }, health: 50, color: [255, 50, 50], size: 22, tier: 0, isSpecial: true,
  tooltip: "Allows the player to shoot while moving and gain x4 fire rate for 2h",
  isActiveWhileMoving: true, animationBodyType: 'soft',
  actionType: ['boostPlayer', 'die'],
  actionConfig: { 
    dieAfterDuration: HOUR_FRAMES * 2
  },
  targetType: [], targetConfig: {}
};
