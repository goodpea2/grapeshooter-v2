import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_miningbomb: TurretConfig = { 
  name: 'Mining Bomb', costs: { sun: 60 }, costAlmanac: { shard: 8, shell: 4, fuel: 8 }, drops: { shard: 1, shell: 1, fuel: 1 }, health: 150, color: [255, 100, 50], size: 24, tier: 3, 
  tooltip: "Pulses when close to obstacles, damaging obstacles in a much wider area", animationBodyType: 'tough',
  actionType: ['pulse'],
  actionConfig: { pulseBulletTypeKey: 'b_miningbomb_explosion', pulseTriggerRadius: GRID_SIZE * 1.5, pulseTriggerBy: ['obstacle'], pulseCooldown: 120, pulseCenteredAtTriggerSource: false },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'closest' }
};
