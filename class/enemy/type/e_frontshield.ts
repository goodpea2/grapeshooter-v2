import { Enemy } from '../../enemy';
import { ActionMoveDefault } from '../action/action_moveDefault';
import { ActionMeleeAttack } from '../action/action_meleeAttack';
import { ActionFrontShield } from '../action/action_frontShield';
import { EnemyAction } from '../EnemyAction';

export class FrontShieldEnemy extends Enemy {
  declare frontShieldAction?: ActionFrontShield;

  constructor(x: number, y: number, typeKey: string = 'e_frontshield') {
    super(x, y, typeKey);
  }

  override initActions(): EnemyAction[] {
    const actions: EnemyAction[] = [];
    actions.push(new ActionMoveDefault({ enemy: this }));
    actions.push(new ActionMeleeAttack({ enemy: this }));
    this.frontShieldAction = new ActionFrontShield({
      enemy: this,
      shieldHealth: this.actionConfig?.shieldHealth ?? 1000,
      shieldRadius: this.actionConfig?.shieldRadius,
      shieldArcDegrees: this.actionConfig?.shieldArcDegrees ?? 90,
    });
    actions.push(this.frontShieldAction);
    return actions;
  }

  override customDisplay(): void {
    this.frontShieldAction?.displayShield();
  }

  override customOnDeath(): void {
    this.frontShieldAction?.onDeath();
  }
}
