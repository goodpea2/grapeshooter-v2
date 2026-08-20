import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_pulse } from './t2_pulse';

export const t3_durian: TurretConfig = { 
  ...t2_pulse,
  name: 'Endurian', costs: { sun: 40 }, costAlmanac: { shell: 8, fuel: 4 }, drops: { shell: 2, fuel: 1 }, health: 400, tier: 3, color: [200, 180, 50], size: 22, 
  tooltip: "Defensive wall that also damages contacting enemies", animationBodyType: 'tough',
  actionConfig: { 
      ...t2_pulse.actionConfig,
      pulseBulletTypeKey: 'b_durian_pulse', 
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: 15, 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
};
