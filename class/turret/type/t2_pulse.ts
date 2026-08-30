import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_pulse: TurretConfig = {
  name: 'Pulser', costs: { sun: 30 }, costAlmanac: { shell: 4, fuel: 6 }, drops: { shell: 1, fuel: 1 }, health: 50, color: [100, 255, 100], size: 22, tier: 2,
  tooltip: "Pulses surrounding damage waves at enemies", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { pulseBulletTypeKey: 'b_pulse_tier2', pulseTriggerRadius: GRID_SIZE * 2, pulseTriggerBy: ['enemy', 'obstacle'], pulseCooldown: 90, pulseCenteredAtTriggerSource: false },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
};
