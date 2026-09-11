import { Enemy } from '../../enemy';
import { ActionMoveDefault } from '../action/action_moveDefault';
import { ActionMeleeAttack } from '../action/action_meleeAttack';
import { EnemyAction } from '../EnemyAction';
import { requestFlungSpawn } from '../../../lvDemo';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';

declare const random: any;
declare const cos: any;
declare const sin: any;
declare const TWO_PI: any;

export class ClonerEnemy extends Enemy {
  constructor(x: number, y: number, typeKey: string = 'e_cloner') {
    super(x, y, typeKey);
  }

  override initActions(): EnemyAction[] {
    const actions: EnemyAction[] = [];
    actions.push(new ActionMoveDefault({ enemy: this }));
    actions.push(new ActionMeleeAttack({ enemy: this }));
    return actions;
  }

  override customOnDamage(dmg: number, _source?: any): boolean {
    if (dmg > 0 && !this.isDying) {
      const ang = random(TWO_PI);
      const dist = (this.actionConfig?.cloneDistanceTiles || 2) * GRID_SIZE; // 2 tiles away
      let tx = this.pos.x + cos(ang) * dist;
      let ty = this.pos.y + sin(ang) * dist;

      // Check collision and find unblocked position if necessary
      if (state.world && state.world.checkCollision(tx, ty, 12)) {
        for (let i = 1; i < 8; i++) {
          const testAng = ang + (i * Math.PI / 4);
          const cx = this.pos.x + cos(testAng) * dist;
          const cy = this.pos.y + sin(testAng) * dist;
          if (!state.world.checkCollision(cx, cy, 12)) {
            tx = cx;
            ty = cy;
            break;
          }
        }
      }

      requestFlungSpawn(this.pos.x, this.pos.y, tx, ty, 'e_basic_nodrop', 15);
    }
    return false; // let standard damage handling proceed
  }
}
