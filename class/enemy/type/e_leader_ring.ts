import { Enemy } from '../../enemy';
import { ActionMoveDefault } from '../action/action_moveDefault';
import { ActionMeleeAttack } from '../action/action_meleeAttack';
import { ActionLeadRingFormation } from '../action/action_leadRingFormation';
import { EnemyAction } from '../EnemyAction';

export class LeaderRingEnemy extends Enemy {
  leadRingAction?: ActionLeadRingFormation;

  constructor(x: number, y: number, typeKey: string = 'e_leader_ring') {
    super(x, y, typeKey);
  }

  override initActions(): EnemyAction[] {
    const actions: EnemyAction[] = [];
    actions.push(new ActionMoveDefault({ enemy: this }));
    actions.push(new ActionMeleeAttack({ enemy: this }));
    this.leadRingAction = new ActionLeadRingFormation({
      enemy: this,
      collabRadius: this.actionConfig?.collabRadius,
      recruitRadius: this.actionConfig?.recruitRadius || 128,
      maxFollowers: this.actionConfig?.maxFollowers || 8,
      ringRadius: this.actionConfig?.ringRadius,
      revolveSpeed: this.actionConfig?.revolveSpeed || 0.01,
      healFollowerAmount: this.actionConfig?.healFollowerAmount || 20,
      healFollowerInterval: this.actionConfig?.healFollowerInterval || 120,
    });
    actions.push(this.leadRingAction);
    return actions;
  }

  override customGetTarget(): any {
    if (this.leadRingAction && this.leadRingAction.followers.length < this.leadRingAction.maxFollowers) {
      return this.leadRingAction.findNearestRecruit();
    }
    return null;
  }

  override customOnDeath(): void {
    this.leadRingAction?.releaseFormation();
  }
}
