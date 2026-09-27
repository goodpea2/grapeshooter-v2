import { TurretConfig } from '../turretConfig';
import { t_pea } from './t_pea';
import { state } from '../../../state';
import { recalculateAllStats } from '../../../src/upgrades';

export const t2_snowpea: TurretConfig = {
  ...t_pea,
  name: 'Snowpea', 
  costs: { sun: 20 }, 
  costAlmanac: { leaf: 5, ice: 2 }, 
  drops: { leaf: 1, ice: 1 }, 
  color: [200, 250, 255], 
  tier: 2,
  tooltip: "Shoots snow at random enemies, slowing them down",
  actionConfig: { 
    ...t_pea.actionConfig,
    bulletTypeKey: 'b_snowpea' 
  },
  targetConfig: { 
    ...t_pea.targetConfig,
    enemyPriority: 'random' 
  },
  upgrades: [
    { id: 'u_t2_snowpea_1', description: "Player's stamina recharge speed +25% for each Snowpea attached", modifiers: { staminaRechargeMult: 0.25 } },
    { id: 'u_t2_snowpea_2', description: "Fire rate +50% when charged", conditionals: [{ type: 'charged', bonus: { firerateMult: 0.5 } }] },
    { id: 'u_t2_snowpea_3', description: "Range +10% for every neighboring [c_ice]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_ice', bonus: { rangeMult: 0.1 } }] },
    { id: 'u_t2_snowpea_4', stackable: false, description: "Damage -50%, chilling duration +200%", modifiers: { damageMult: -0.5, chillDurationMult: 2.0 } },
    { id: 'u_t2_snowpea_5', description: "Damage +10% everytime a plant dies", hooks: { 
      onDeath: (ctx: any) => { 
        if (ctx.targetType === 'turret') {
          const stackCount = (state.turretUpgrades?.['t2_snowpea'] || []).filter((id: string) => id === 'u_t2_snowpea_5').length;
          const bonus = 0.10 * Math.max(1, stackCount);
          if (state.player) {
            for (const a of state.player.attachments) {
              if (a && a.type === 't2_snowpea' && a.health > 0) {
                a.deathDmgBonus = (a.deathDmgBonus || 0) + bonus;
              }
            }
          }
          if (state.world) {
            for (const wt of state.world.getAllTurrets()) {
              if (wt && wt.type === 't2_snowpea' && wt.health > 0) {
                wt.deathDmgBonus = (wt.deathDmgBonus || 0) + bonus;
              }
            }
          }
          recalculateAllStats();
        }
      } 
    } }
  ]
};
