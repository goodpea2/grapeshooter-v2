import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { spawnLootAt } from '../../../economy';

export const t_laser: TurretConfig = { 
  name: 'Mining Laser', costs: { sun: 10 }, costAlmanac: { shard: 3 }, drops: { shard: 1 }, health: 100, color: [50, 200, 255], size: 22, tier: 1, cooldownHours: 1,
  tooltip: "Fires laser to break obstacles", animationBodyType: 'tough',
  actionType: ['laserBeam'],
  actionConfig: { beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 4 },
  actionTypeWhileCharged: ['laserBeam'],
  actionConfigWhileCharged: {
    beamDamage: 5,
    beamDamageRate: 3,
    beamWidth: 4,
    beamDuration: 1,
    beamFireRate: 6,
    beamDamageWidth: 0,
    beamAutoLength: true,
    beamMaxLength: GRID_SIZE * 8,
    staminaCostPerLaserBeamExecuted: 0,
  },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable' },
  upgrades: [
    { id: 'u_t_laser_1', description: "Player's mining damage +3 for each Mining Laser attached", modifiers: { playerMiningAdd: 3 } },
    { id: 'u_t_laser_2', description: "When merged, spawns +1 sun", hooks: { onMerge: (ctx: any) => { if (ctx.source?.type === 't_laser') { const p = ctx.source.getWorldPos(); spawnLootAt(p.x, p.y, 'sun'); } } } },
    { id: 'u_t_laser_3', description: "Damage +50% while alone", conditionals: [{ type: 'alone', bonus: { damageMult: 0.5 } }] },
    { id: 'u_t_laser_4', description: "Range +20% for every neighboring [c_shard]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_shard', bonus: { rangeMult: 0.2 } }] }
  ]
};
