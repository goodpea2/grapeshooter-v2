import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { spawnBullet } from '../../bullet';
import { MuzzleFlash } from '../../../vfx/index';
import { soundEngine } from '../../../src/audio/soundEngine';

declare const cos: any;
declare const sin: any;
declare const atan2: any;
declare const radians: any;
declare const random: any;
declare const color: any;

export class ActionShoot extends EnemyAction {
  tags = ['attack', 'shoot'];

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
    return this.enemy.shootCooldown <= 0;
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

    if (!this.canExecute()) {
      if (enemy.shootCooldown > 0) enemy.shootCooldown--;
      return;
    }

    if (!enemy.target) {
      if (enemy.shootCooldown > 0) enemy.shootCooldown--;
      return;
    }

    // Friendly fire check: only shoot hostile targets
    const isHypnotized = enemy.conditions.has('c_hypnotized');
    const targetIsEnemy = !!enemy.target.isEnemy;

    if (targetIsEnemy) {
      const targetHypnotized = !!enemy.target.conditions?.has('c_hypnotized');
      if (isHypnotized === targetHypnotized) {
        if (enemy.shootCooldown > 0) enemy.shootCooldown--;
        return;
      }
    } else {
      if (isHypnotized) {
        if (enemy.shootCooldown > 0) enemy.shootCooldown--;
        return;
      }
    }

    const tp = enemy.target.getWorldPos ? enemy.target.getWorldPos() : enemy.target.pos;
    if (!tp) {
      if (enemy.shootCooldown > 0) enemy.shootCooldown--;
      return;
    }

    const dx = tp.x - enemy.pos.x;
    const dy = tp.y - enemy.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const isShooter = enemy.type === 'e_shooting' || enemy.type === 'e_shooting_giant';
    const canShootInRange = d < (enemy.actionConfig.shootRange || 200) &&
      (isShooter || enemy.isFlying || state.world.checkLOS(enemy.pos.x, enemy.pos.y, tp.x, tp.y));

    if (canShootInRange && this.isReady()) {
      this.execute();

      if (Array.isArray(enemy.actionConfig.shootFireRate)) {
        const step = enemy.actionSteps.get('shoot') || 0;
        enemy.shootCooldown = Math.round((enemy.actionConfig.shootFireRate[step % enemy.actionConfig.shootFireRate.length]) * attackSpeedMult);
        enemy.actionSteps.set('shoot', step + 1);
      } else {
        enemy.shootCooldown = Math.round((enemy.actionConfig.shootFireRate || 60) * attackSpeedMult);
      }
    }

    if (enemy.shootCooldown > 0) enemy.shootCooldown--;
  }

  performExecute(): void {
    const enemy = this.enemy;
    const tp = enemy.target.getWorldPos ? enemy.target.getWorldPos() : enemy.target.pos;
    if (!tp) return;

    const dx = tp.x - enemy.pos.x;
    const dy = tp.y - enemy.pos.y;
    const dirHeading = atan2(dy, dx);

    const bType = enemy.actionConfig.bulletTypeKey || 'b_enemy_basic';
    const sa = dirHeading + (enemy.actionConfig.inaccuracy ? random(-radians(enemy.actionConfig.inaccuracy), radians(enemy.actionConfig.inaccuracy)) : 0);
    const bullet = spawnBullet(enemy.pos.x, enemy.pos.y, enemy.pos.x + cos(sa) * 500, enemy.pos.y + sin(sa) * 500, bType, 'core', enemy);

    if (enemy.conditions.has('c_hypnotized')) {
      bullet.damageTargets = ['enemy'];
      state.bullets.push(bullet);
    } else {
      state.enemyBullets.push(bullet);
    }

    state.vfx.push(new MuzzleFlash(enemy.pos.x, enemy.pos.y, sa, 22, 6, color(200, 100, 255)));

    const shootSfx = enemy.config?.shootSfx || 'enemy_shooting_shoot';
    soundEngine.playSFXGroup(shootSfx);
  }
}
