import { Enemy } from '../../enemy';
import { ActionMoveDefault } from '../action/action_moveDefault';
import { ActionLaunchAlly } from '../action/action_launchAlly';
import { EnemyAction } from '../EnemyAction';

export class LauncherEnemy extends Enemy {
  launchAction?: ActionLaunchAlly;

  constructor(x: number, y: number, typeKey: string = 'e_launcher') {
    super(x, y, typeKey);
  }

  override initActions(): EnemyAction[] {
    const actions: EnemyAction[] = [];
    actions.push(new ActionMoveDefault({ enemy: this }));
    this.launchAction = new ActionLaunchAlly({
      enemy: this,
      launchInterval: this.actionConfig?.launchInterval || 360,
      collabRadius: this.actionConfig?.collabRadius,
      maxCostToLaunch: this.actionConfig?.maxCostToLaunch || 150,
      launchDistanceRatio: this.actionConfig?.launchDistanceRatio || 0.75,
      launchDuration: this.actionConfig?.launchDuration || 75,
      maxArcHeight: this.actionConfig?.maxArcHeight || 90,
      prepDuration: this.actionConfig?.prepDuration || 60,
    });
    actions.push(this.launchAction);
    return actions;
  }

  override customOnDeath(): void {
    this.launchAction?.cancelCollab();
  }
}
