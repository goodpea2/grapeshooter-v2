import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_pulse } from './t2_pulse';

export const t3_repulser: TurretConfig = { 
  ...t2_pulse,
  name: 'Repulser', costs: { sun: 50 }, costAlmanac: { leaf: 4, shell: 6, fuel: 8 }, drops: { leaf: 1, shell: 1, fuel: 1 }, health: 150, color: [100, 255, 150], size: 22, tier: 3,
  tooltip: "Pulses surrounding damage waves at enemies, knocking them back", animationBodyType: 'soft',
  actionConfig: { 
    ...t2_pulse.actionConfig,
    pulseBulletTypeKey: 'b_repulser_pulse', 
    pulseTriggerRadius: GRID_SIZE * 1.5, 
    pulseCooldown: 60, 
  },
};
