import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_holonut: TurretConfig = { 
  name: 'Holonut', costs: { sun: 35 }, costAlmanac: { shell: 8, fuel: 2, ice: 2 }, drops: { shell: 1, fuel: 1, ice: 1 }, health: 600, tier: 3, color: [150, 150, 255], size: 22, 
  tooltip: "Has a force field to protect surrounding plants", animationBodyType: 'tough',
  actionType: ['shield', 'pulse'],
  actionConfig: { 
      shieldRadius: GRID_SIZE * 2.8,
      pulseBulletTypeKey: 'b_holonut_heal', 
      pulseTriggerRadius: 1, 
      pulseTriggerBy: ['turret'], 
      pulseCooldown: 180, 
      pulseCenteredAtTriggerSource: true
  },
  targetType: ['turret'], targetConfig: {}
};
