import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { GRID_SIZE, EnemyCollideRadiusCheck } from '../../../constants';
import { flowFieldRegistry } from '../../../pathfinding';
import { lerpAngle } from '../../utils';

declare const createVector: any;
declare const atan2: any;
declare const random: any;

export class ActionMoveDefault extends EnemyAction {
  tags = ['movement'];

  constructor(config: EnemyActionConfig) {
    super(config);
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    if (this.enemy.isDying || this.enemy.isAirborne) return false;
    if (this.enemy.conditions.has('c_stun') || this.enemy.kbTimer > 0) return false;
    if (this.enemy.attackAnimTimer > 0) return false;
    return true;
  }

  isReady(): boolean {
    return true;
  }

  update(playerPos: any, turrets: any[]): void {
    if (!this.canExecute()) return;
    this.execute();
  }

  performExecute(): void {
    const enemy = this.enemy;
    const isHypnotized = enemy.conditions.has('c_hypnotized');

    // Calculate speed multiplier from active conditions
    let speedMult = 1.0;
    for (const [cKey, life] of enemy.conditions) {
      const cfg = (window as any).conditionTypes?.[cKey];
      if (cfg?.enemyMovementSpeedMultiplier !== undefined) {
        speedMult *= cfg.enemyMovementSpeedMultiplier;
      }
    }

    // Liquid movement multiplier
    const gx = Math.floor(enemy.pos.x / GRID_SIZE);
    const gy = Math.floor(enemy.pos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy);
    const lData = liquidType ? (window as any).liquidTypes?.[liquidType] : null;
    if (lData?.liquidConfig?.enemyMovementSpeedMultiplier) {
      speedMult *= lData.liquidConfig.enemyMovementSpeedMultiplier;
    }

    if (!enemy.target) {
      if (isHypnotized) {
        let rVx = 0;
        let rVy = 0;
        if (enemy.isFlying) {
          if (state.player) {
            const pdx = enemy.pos.x - state.player.pos.x;
            const pdy = enemy.pos.y - state.player.pos.y;
            const pd = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pd > 0.001) {
              rVx = pdx / pd;
              rVy = pdy / pd;
            }
          }
        } else {
          const revFlow = flowFieldRegistry.getEnemyReverseMoveVector(enemy.pos, enemy.size);
          rVx = revFlow.vx;
          rVy = revFlow.vy;
        }

        if (Math.abs(rVx) > 0.01 || Math.abs(rVy) > 0.01) {
          const targetMoveVec = createVector(rVx, rVy).mult(enemy.speed * speedMult);
          enemy.moveWithCollisions(targetMoveVec);
          const moveHeading = atan2(rVy, rVx);
          enemy.rot = lerpAngle(enemy.rot, moveHeading, 0.12);
        } else {
          enemy.rot += random(-0.05, 0.05);
        }
      } else {
        enemy.rot += random(-0.05, 0.05);
      }
      return;
    }

    const tp = enemy.target.getWorldPos ? enemy.target.getWorldPos() : enemy.target.pos;
    if (!tp) return;

    const dx = tp.x - enemy.pos.x;
    const dy = tp.y - enemy.pos.y;
    const dSq = dx * dx + dy * dy;
    const d = Math.sqrt(dSq);
    const dirHeading = atan2(dy, dx);

    let flowVx = 0;
    let flowVy = 0;

    if (enemy.isFlying) {
      flowVx = d > 0 ? dx / d : 0;
      flowVy = d > 0 ? dy / d : 0;
      enemy.pathfindingMode = 'fly';
      enemy.moveVector = { x: flowVx, y: flowVy };
      enemy.rot = lerpAngle(enemy.rot, dirHeading, 0.15);
    } else {
      const goalId = enemy.target?.flowGoalId || (enemy.target === state.player ? 'player' : undefined);
      const flow = flowFieldRegistry.getEnemyMoveVector(enemy.pos, enemy.size, tp, goalId);
      flowVx = flow.vx;
      flowVy = flow.vy;
      enemy.pathfindingMode = flow.mode;
      enemy.moveVector = { x: flow.vx, y: flow.vy };

      const moveHeading = (Math.abs(flow.vx) > 0.01 || Math.abs(flow.vy) > 0.01) ? atan2(flow.vy, flow.vx) : dirHeading;
      enemy.rot = lerpAngle(enemy.rot, flow.mode === 'los' ? dirHeading : moveHeading, 0.12);
    }

    // Enemy-Enemy collision avoidance (Interleaved 30Hz evaluation)
    const isRepulsionFrame = ((enemy.uid || 0) & 1) === (state.frames & 1);
    if (isRepulsionFrame && state.spatialGrid) {
      const checkLimitSq = EnemyCollideRadiusCheck * EnemyCollideRadiusCheck;
      state.spatialGrid.forEachNeighborCell(enemy.pos.x, enemy.pos.y, 1, (neighbors: any[]) => {
        for (const other of neighbors) {
          if (other === enemy || other.isDying || !other.isEnemy) continue;
          const odx = enemy.pos.x - other.pos.x;
          const ody = enemy.pos.y - other.pos.y;
          const distSq = odx * odx + ody * ody;

          if (distSq > checkLimitSq) continue;

          const md = (enemy.size + other.size) * 0.55;
          if (distSq < md * md && distSq > 0) {
            const od = Math.sqrt(distSq);
            enemy.moveWithCollisions(createVector(odx / od * 0.4, ody / od * 0.4));
          }
        }
      });
    }

    const isShooter = enemy.type === 'e_shooting' || enemy.type === 'e_shooting_giant';
    const canShootInRange = enemy.actionType.includes('shoot') &&
      enemy.actionConfig.shootRange &&
      d < enemy.actionConfig.shootRange &&
      (isShooter || enemy.isFlying || state.world.checkLOS(enemy.pos.x, enemy.pos.y, tp.x, tp.y));

    if (!canShootInRange) {
      const rThresh = enemy.actionType.includes('shoot') ? enemy.actionConfig.shootRange * 0.75 : enemy.size * 0.6;
      if (d > rThresh) {
        const targetMoveVec = createVector(flowVx, flowVy).mult(enemy.speed * speedMult);
        enemy.moveWithCollisions(targetMoveVec);
      }
    }
  }
}
