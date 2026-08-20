import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { t2_icebomb } from './t2_icebomb';

export const t3_frostfield: TurretConfig = { 
  ...t2_icebomb,
  name: 'Frost Field', costs: { sun: 50 }, costAlmanac: { fuel: 6, ice: 12 }, drops: { fuel: 2, ice: 1 }, health: 150, color: [180, 240, 255], size: 22, tier: 3, 
  tooltip: "Emits a chilling field while armed. Explodes on contact and freezes enemies", animationBodyType: 'soft',
  actionType: ['pulse', 'aura'],
  actionConfig: { 
    ...t2_icebomb.actionConfig,
    pulseBulletTypeKey: 'b_frostfield_explosion', 
    pulseTriggerRadius: GRID_SIZE * 1.5, 
    pulseCooldown: HOUR_FRAMES * 2, 
    auraConfig: { radius: GRID_SIZE * 2.8, appliedCondition: 'c_chilled', duration: 150, auraVfx: 'aura_frostfield' }
  },
};
