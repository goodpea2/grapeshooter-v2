import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t0_starfruit: TurretConfig = {
  name: 'Healing Starfruit', costs: { elixir: 30 }, health: 100, color: [150, 255, 100], size: 22, tier: 0, isSpecial: true,
  tooltip: "Heal surrounding turrets over 2h", animationBodyType: 'soft',
  isActiveWhileMoving: false,
  actionType: ['pulse', 'die'],
  actionConfig: { 
      pulseBulletTypeKey: 'b_healing_pulse', 
      pulseTriggerRadius: GRID_SIZE * 2.5, 
      pulseTriggerBy: ['turret'], 
      pulseCooldown: 60, 
      pulseCenteredAtTriggerSource: false,
      pulseTriggerAlways: true,
      dieAfterDuration: HOUR_FRAMES * 2 
  },
  targetType: ['turret'], targetConfig: {}
};
