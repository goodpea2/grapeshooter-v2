import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_spike } from './t2_spike';

export const t3_spike2: TurretConfig = { 
  ...t2_spike,
  name: 'Speed Spike', costs: { sun: 40 }, costAlmanac: { shell: 6, ice: 6 }, drops: { shell: 2, ice: 1 }, health: 10, tier: 3, color: [180, 180, 200], size: 24, 
  tooltip: "Stay underground, damages contacting enemies with faster rate", animationBodyType: 'tough',
  actionConfig: { 
      ...t2_spike.actionConfig,
      pulseBulletTypeKey: 'b_spike2_pulse', 
      pulseTriggerRadius: GRID_SIZE * 1.0, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: 30, 
  },
};
