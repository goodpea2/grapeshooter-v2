import { Turret } from '../turret';
import { TurretAction } from '../turretAction';
import { UPGRADES } from '../../src/upgrades';
import { state } from '../../state';
import { ActionDie } from './action/action_die';
import { ActionShoot } from './action/action_shoot';
import { ActionLaunch } from './action/action_launch';
import { ActionPulse } from './action/action_pulse';
import { ActionLaserBeam } from './action/action_laserBeam';
import { ActionShield } from './action/action_shield';
import { ActionAura } from './action/action_aura';
import { ActionSpawnBulletAtRandom } from './action/action_spawnBulletAtRandom';
import { ActionGenerateElectricChain } from './action/action_generateElectricChain';
import { ActionShootMultiTarget } from './action/action_shootMultiTarget';
import { ActionLaunchMultiTarget } from './action/action_launchMultiTarget';
import { ActionBoostPlayer } from './action/action_boostPlayer';
import { ActionPassiveSun } from './action/action_passiveSun';
import { ActionFirstStrike } from './action/action_firstStrike';
import { ActionGrowth } from './action/action_growth';
import { ActionFarm } from './action/action_farm';
import { ActionSpawnOnTargetDeath } from './action/action_spawnOnTargetDeath';
import { ActionShootSpin } from './action/action_shootSpin';

// Specific turret types are handled generically via config unless they have a custom getActions in config

export class TurretHub {
  static getActions(turret: Turret): TurretAction[] {
    let actions: TurretAction[] = [];

    // Check for specific turret type logic
    if (turret.config.getActions) {
      actions = turret.config.getActions(turret);
    } else {
      // Fallback to generic actionType-based initialization
      actions = this.getGenericActions(turret);
    }

    // Add actions from upgrades
    const upgradeIds = state.turretUpgrades[turret.type] || [];
    for (const id of upgradeIds) {
      const upgrade = UPGRADES[id];
      if (upgrade?.modifiers?.shieldRadius) {
        if (!actions.some(a => a instanceof ActionShield)) {
          actions.push(new ActionShield({ turret }));
        }
      }
    }

    // Always add ActionDie for death effects if not already present
    if (!actions.some(a => a instanceof ActionDie)) {
      actions.push(new ActionDie({ turret }));
    }

    return actions;
  }

  private static getGenericActions(turret: Turret): TurretAction[] {
    const actions: TurretAction[] = [];
    const actionTypes = Array.isArray(turret.config.actionType) ? turret.config.actionType : [turret.config.actionType];
    
    for (const type of actionTypes) {
      switch (type) {
        case 'shoot': actions.push(new ActionShoot({ turret })); break;
        case 'launch': actions.push(new ActionLaunch({ turret })); break;
        case 'pulse': actions.push(new ActionPulse({ turret })); break;
        case 'laserBeam': actions.push(new ActionLaserBeam({ turret })); break;
        case 'shield': actions.push(new ActionShield({ turret })); break;
        case 'aura': actions.push(new ActionAura({ turret })); break;
        case 'spawnBulletAtRandom': actions.push(new ActionSpawnBulletAtRandom({ turret })); break;
        case 'generateElectricChain': actions.push(new ActionGenerateElectricChain({ turret })); break;
        case 'shootMultiTarget': actions.push(new ActionShootMultiTarget({ turret })); break;
        case 'launchMultiTarget': actions.push(new ActionLaunchMultiTarget({ turret })); break;
        case 'boostPlayer': actions.push(new ActionBoostPlayer({ turret })); break;
        case 'passiveSun': actions.push(new ActionPassiveSun({ turret })); break;
        case 'firstStrike': actions.push(new ActionFirstStrike({ turret })); break;
        case 'growth': actions.push(new ActionGrowth({ turret })); break;
        case 'farm': actions.push(new ActionFarm({ turret })); break;
        case 'spawnOnTargetDeath': actions.push(new ActionSpawnOnTargetDeath({ turret })); break;
        case 'shootSpin': actions.push(new ActionShootSpin({ turret })); break;
        case 'custom': break; // Handled by custom class logic
      }
    }
    return actions;
  }
}
