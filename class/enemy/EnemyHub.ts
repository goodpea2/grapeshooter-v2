import { EnemyAction } from './EnemyAction';
import { ActionMoveDefault } from './action/action_moveDefault';
import { ActionMeleeAttack } from './action/action_meleeAttack';
import { ActionShoot } from './action/action_shoot';
import { ActionStealSun } from './action/action_stealSun';
import { ActionSpawnEnemy } from './action/action_spawnEnemy';
import { ActionLaunchAlly } from './action/action_launchAlly';
import { ActionLeadFormation } from './action/action_leadFormation';
import { ActionFrontShield } from './action/action_frontShield';
import { ActionFleeAndHover } from './action/action_fleeAndHover';
import { ActionHopJump } from './action/action_hopJump';
import { ActionLeadRingFormation } from './action/action_leadRingFormation';

export class EnemyHub {
  static getActions(enemy: any): EnemyAction[] {
    if (enemy.config?.getActions) {
      return enemy.config.getActions(enemy);
    }

    const actions: EnemyAction[] = [];
    const types: string[] = enemy.actionType || enemy.config?.actionType || [];

    for (const type of types) {
      switch (type) {
        case 'moveDefault':
          actions.push(new ActionMoveDefault({ enemy }));
          break;
        case 'meleeAttack':
          actions.push(new ActionMeleeAttack({ enemy }));
          break;
        case 'shoot':
          actions.push(new ActionShoot({ enemy }));
          break;
        case 'stealSun':
          actions.push(new ActionStealSun({ enemy }));
          break;
        case 'spawnEnemy':
        case 'spawnObstacle':
        case 'spawnBullet':
        case 'spawnGroundFeature':
          if (!actions.some(a => a instanceof ActionSpawnEnemy)) {
            actions.push(new ActionSpawnEnemy({ enemy }));
          }
          break;
        case 'launchAlly':
          actions.push(new ActionLaunchAlly({ enemy }));
          break;
        case 'leadFormation':
          actions.push(new ActionLeadFormation({ enemy }));
          break;
        case 'frontShield':
          actions.push(new ActionFrontShield({ enemy }));
          break;
        case 'fleeAndHover':
        case 'spawnCritterPeriodic':
          if (!actions.some(a => a instanceof ActionFleeAndHover)) {
            actions.push(new ActionFleeAndHover({
              enemy,
              minFleeDistanceTiles: enemy.actionConfig?.minFleeDistanceTiles,
              maxFleeDistanceTiles: enemy.actionConfig?.maxFleeDistanceTiles,
              spawnInterval: enemy.actionConfig?.spawnInterval,
            }));
          }
          break;
        case 'hopJump':
          actions.push(new ActionHopJump({
            enemy,
            restFrames: enemy.actionConfig?.restFrames,
            maxHopTiles: enemy.actionConfig?.maxHopTiles,
            aoeRadiusTiles: enemy.actionConfig?.aoeRadiusTiles,
            aoeDamage: enemy.actionConfig?.aoeDamage,
            jumpDuration: enemy.actionConfig?.jumpDuration,
            maxArcHeight: enemy.actionConfig?.maxArcHeight,
          }));
          break;
        case 'leadRingFormation':
          actions.push(new ActionLeadRingFormation({
            enemy,
            collabRadius: enemy.actionConfig?.collabRadius,
            maxFollowers: enemy.actionConfig?.maxFollowers,
            ringRadius: enemy.actionConfig?.ringRadius,
            revolveSpeed: enemy.actionConfig?.revolveSpeed,
          }));
          break;
      }
    }

    return actions;
  }
}
