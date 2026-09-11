import { Enemy } from '../../enemy';
import { ActionMoveDefault } from '../action/action_moveDefault';
import { ActionMeleeAttack } from '../action/action_meleeAttack';
import { ActionLeadFormation } from '../action/action_leadFormation';
import { EnemyAction } from '../EnemyAction';

export class LeaderEnemy extends Enemy {
  leadAction?: ActionLeadFormation;

  constructor(x: number, y: number, typeKey: string = 'e_leader') {
    super(x, y, typeKey);
  }

  override initActions(): EnemyAction[] {
    const actions: EnemyAction[] = [];
    actions.push(new ActionMoveDefault({ enemy: this }));
    actions.push(new ActionMeleeAttack({ enemy: this }));
    this.leadAction = new ActionLeadFormation({
      enemy: this,
      maxFollowers: this.actionConfig?.maxFollowers || 4,
      collabRadius: this.actionConfig?.collabRadius,
      recruitRadius: this.actionConfig?.recruitRadius || 128,
      segmentSpacing: this.actionConfig?.segmentSpacing || 24,
    });
    actions.push(this.leadAction);
    return actions;
  }

  override customGetTarget(): any {
    if (this.leadAction && this.leadAction.followers.length < this.leadAction.maxFollowers) {
      return this.leadAction.findNearestRecruit();
    }
    return null;
  }

  override customOnDeath(): void {
    this.leadAction?.releaseFormation();
  }
}
