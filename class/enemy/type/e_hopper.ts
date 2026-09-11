import { Enemy } from '../../enemy';
import { ActionHopJump } from '../action/action_hopJump';
import { EnemyAction } from '../EnemyAction';

export class HopperEnemy extends Enemy {
  hopAction?: ActionHopJump;

  constructor(x: number, y: number, typeKey: string = 'e_hopper') {
    super(x, y, typeKey);
  }

  override initActions(): EnemyAction[] {
    const actions: EnemyAction[] = [];
    this.hopAction = new ActionHopJump({
      enemy: this,
      restFramesMin: this.actionConfig?.restFramesMin || 110,
      restFramesMax: this.actionConfig?.restFramesMax || 130,
      landingInaccuracyTiles: this.actionConfig?.landingInaccuracyTiles ?? 0.5,
      landingBulletKey: this.actionConfig?.landingBulletKey || 'b_hopper_slam',
      maxHopTiles: this.actionConfig?.maxHopTiles || 3,
      jumpDuration: this.actionConfig?.jumpDuration || 35,
      maxArcHeight: this.actionConfig?.maxArcHeight || 60,
    });
    actions.push(this.hopAction);
    return actions;
  }

  override customOnLand(): void {
    if (this.hopAction) {
      this.hopAction.onLand();
    }
  }
}
