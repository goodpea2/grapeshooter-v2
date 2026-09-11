import { Enemy } from '../../enemy';
import { ActionFleeAndHover } from '../action/action_fleeAndHover';
import { EnemyAction } from '../EnemyAction';

export class SwarmChickenEnemy extends Enemy {
  fleeAction?: ActionFleeAndHover;

  constructor(x: number, y: number, typeKey: string = 'e_swarm_chicken') {
    super(x, y, typeKey);
  }

  override initActions(): EnemyAction[] {
    const actions: EnemyAction[] = [];
    this.fleeAction = new ActionFleeAndHover({
      enemy: this,
      minFleeDistanceTiles: this.actionConfig?.minFleeDistanceTiles || 12,
      maxFleeDistanceTiles: this.actionConfig?.maxFleeDistanceTiles || 15,
      spawnInterval: this.actionConfig?.spawnInterval || 90,
    });
    actions.push(this.fleeAction);
    return actions;
  }

  override customOnDamage(dmg: number, source?: any): boolean {
    if (this.fleeAction) {
      this.fleeAction.onDamage(dmg, source);
    }
    return false; // allow standard damage handling
  }
}
