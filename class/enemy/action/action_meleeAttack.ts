import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { spawnHitSpark, spawnExplosion } from '../../../vfx/index';

declare const p5: any;
declare const sin: any;
declare const dist: any;
declare const color: any;

export class ActionMeleeAttack extends EnemyAction {
  tags = ['attack'];

  constructor(config: EnemyActionConfig) {
    super(config);
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    if (this.enemy.isDying || this.enemy.isAirborne) return false;
    if (this.enemy.conditions.has('c_stun') || this.enemy.kbTimer > 0) return false;
    return true;
  }

  isReady(): boolean {
    return this.enemy.meleeCooldown <= 0;
  }

  update(playerPos: any, turrets: any[]): void {
    const enemy = this.enemy;
    if (enemy.isDying || enemy.isAirborne) return;

    let attackSpeedMult = 1.0;
    for (const [cKey] of enemy.conditions) {
      const cfg = (window as any).conditionTypes?.[cKey];
      if (cfg?.enemyAttackSpeedMultiplier !== undefined) {
        attackSpeedMult *= cfg.enemyAttackSpeedMultiplier;
      }
    }

    // Handle Attack Animation Sequence
    if (enemy.attackAnimTimer > 0) {
      enemy.attackAnimTimer--;
      const progress = 1 - (enemy.attackAnimTimer / enemy.attackAnimDuration);
      const lungeDist = enemy.actionConfig.meleeAttackRange || (enemy.size * 0.25);

      if (progress < 0.4) {
        const backProgress = progress / 0.4;
        enemy.attackOffset = p5.Vector.fromAngle(enemy.rot).mult(-lungeDist * 0.2 * backProgress);
      } else {
        const strikeProgress = (progress - 0.4) / 0.6;
        const strikeAmt = sin(strikeProgress * Math.PI) * lungeDist;
        enemy.attackOffset = p5.Vector.fromAngle(enemy.rot).mult(strikeAmt - (lungeDist * 0.2 * (1 - strikeProgress)));

        if (enemy.attackAnimTimer === Math.floor(enemy.attackAnimDuration * 0.35)) {
          this.performMeleeStrike();
        }
      }
      return;
    } else {
      enemy.attackOffset?.set(0, 0);
    }

    if (!this.canExecute()) return;

    if (!enemy.target) return;

    // Friendly fire check: only attack hostile targets
    const isHypnotized = enemy.conditions.has('c_hypnotized');
    const targetIsEnemy = !!enemy.target.isEnemy;

    if (targetIsEnemy) {
      // Enemy vs Enemy: only attack if one is hypnotized and the other is not
      const targetHypnotized = !!enemy.target.conditions?.has('c_hypnotized');
      if (isHypnotized === targetHypnotized) return;
    } else {
      // Enemy vs Player/Turret/Obstacle: hypnotized enemies do not attack friendly player/turrets
      if (isHypnotized) return;
    }

    const tp = enemy.target.getWorldPos ? enemy.target.getWorldPos() : enemy.target.pos;
    if (!tp) return;

    const dx = tp.x - enemy.pos.x;
    const dy = tp.y - enemy.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const targetRadius = (enemy.target.size || 32) * 0.5;
    const inMeleeRange = d < (enemy.size * 0.5 + targetRadius + 15);

    if (inMeleeRange && this.isReady()) {
      enemy.attackAnimDuration = Math.max(20, Math.round((enemy.actionConfig.attackFireRate || 30) * attackSpeedMult));
      enemy.attackAnimTimer = enemy.attackAnimDuration;
      enemy.meleeCooldown = Math.round((enemy.actionConfig.attackFireRate || 30) * attackSpeedMult);
      this.execute();
    }

    if (enemy.meleeCooldown > 0) enemy.meleeCooldown--;
  }

  performExecute(): void {
    // Action initiated - animation will strike midway
  }

  performMeleeStrike(): void {
    const enemy = this.enemy;
    if (!enemy.target || enemy.isDying) return;

    // Ignore damage to inactive turrets
    if (enemy.target instanceof AttachedTurret || enemy.target instanceof WorldTurret) {
      const isRetracted = !state.isStationary && !enemy.target.config.isActiveWhileMoving && enemy.target.isAttachedToPlayer();
      const isInactive = isRetracted || enemy.target.isWaterlogged || enemy.target.isFrosted;
      if (isInactive) return;
    }

    // Friendly fire check: only damage hostile targets
    const isHypnotized = enemy.conditions.has('c_hypnotized');
    const targetIsEnemy = !!enemy.target.isEnemy;

    if (targetIsEnemy) {
      const targetHypnotized = !!enemy.target.conditions?.has('c_hypnotized');
      if (isHypnotized === targetHypnotized) return;
    } else {
      if (isHypnotized) return;
    }

    const strikePos = p5.Vector.add(enemy.pos, enemy.attackOffset);
    const tc = enemy.target.getWorldPos ? enemy.target.getWorldPos() : (enemy.target.pos || null);
    if (!tc) return;

    const targetRadius = (enemy.target.size || 32) * 0.5;
    const distToStrike = dist(strikePos.x, strikePos.y, tc.x, tc.y);
    const strikeRange = enemy.size * 0.5 + targetRadius + 20;

    if (distToStrike < strikeRange) {
      enemy.target.takeDamage(enemy.actionConfig.damage);
      if (state.frames % 5 === 0) state.vfx.push(spawnHitSpark(strikePos.x, strikePos.y, [255, 50, 50]));

      if (enemy.type === 'e_giant' || enemy.type === 'e_shooting_giant' || enemy.type === 'e_snowthrower_giant') {
        state.cameraShake = Math.max(state.cameraShake, 10);
        state.cameraShakeFalloff = 0.9;
        state.vfx.push(spawnExplosion(strikePos.x, strikePos.y, enemy.size * 2, color(255, 100, 0)));
      }
    }
  }
}
