import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';
import { spawnHitSpark, MuzzleFlash } from '../../../vfx/index';
import { soundEngine } from '../../../src/audio/soundEngine';
import { Bullet } from '../../bullet';

declare const dist: any;
declare const atan2: any;
declare const cos: any;
declare const sin: any;
declare const color: any;
declare const TWO_PI: any;
declare const random: any;

export class ActionHopJump extends EnemyAction {
  tags = ['movement'];
  restFramesMin: number = 110;
  restFramesMax: number = 130;
  restTimer: number = 120;
  maxHopTiles: number = 3;
  inaccuracyTiles: number = 0.5;
  landingBulletKey: string = 'b_hopper_slam';
  jumpDuration: number = 35;
  maxArcHeight: number = 60;
  wasAirborne: boolean = false;
  lastLandFrame: number = -1;

  constructor(config: EnemyActionConfig) {
    super(config);
    this.restFramesMin = config.restFramesMin || 110;
    this.restFramesMax = config.restFramesMax || 130;
    this.inaccuracyTiles = config.landingInaccuracyTiles ?? 0.5;
    this.landingBulletKey = config.landingBulletKey || 'b_hopper_slam';
    this.maxHopTiles = config.maxHopTiles || 3;
    this.jumpDuration = config.jumpDuration || 35;
    this.maxArcHeight = config.maxArcHeight || 60;
    this.restTimer = this.rollRestFrames();
  }

  rollRestFrames(): number {
    return Math.floor(random(this.restFramesMin, this.restFramesMax + 1));
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    if (this.enemy.isDying) return false;
    return true;
  }

  isReady(): boolean {
    return true;
  }

  performExecute(): void {}

  onLand(): void {
    this.triggerLandingAoE();
  }

  update(playerPos: any, turrets: any[]): void {
    const enemy = this.enemy;
    if (enemy.isDying) return;

    if (enemy.isAirborne) {
      this.wasAirborne = true;
      return;
    }

    if (this.wasAirborne && !enemy.isAirborne) {
      this.wasAirborne = false;
      this.triggerLandingAoE();
    }

    if (this.isLocked()) return;

    // Resting phase
    this.restTimer--;
    if (this.restTimer <= 0) {
      // Find closest target between player and active turrets
      let targetPos = playerPos;
      let minDist = dist(enemy.pos.x, enemy.pos.y, playerPos.x, playerPos.y);

      const targetTurrets: any[] = [];
      if (Array.isArray(turrets)) {
        targetTurrets.push(...turrets);
      } else if (state.player?.attachments && Array.isArray(state.player.attachments)) {
        targetTurrets.push(...state.player.attachments);
      }

      for (const t of targetTurrets) {
        if (!t || t.health <= 0) continue;
        const tw = t.getWorldPos ? t.getWorldPos() : t.pos;
        if (!tw) continue;
        const td = dist(enemy.pos.x, enemy.pos.y, tw.x, tw.y);
        if (td < minDist) {
          minDist = td;
          targetPos = tw;
        }
      }

      // Calculate hop trajectory towards target
      const ang = atan2(targetPos.y - enemy.pos.y, targetPos.x - enemy.pos.x);
      const hopDist = Math.min(minDist, this.maxHopTiles * GRID_SIZE);
      let tx = enemy.pos.x + cos(ang) * hopDist;
      let ty = enemy.pos.y + sin(ang) * hopDist;

      // Slight inaccuracy of 0.5 tile (16px) for target landing position
      const inaccuracyMax = this.inaccuracyTiles * GRID_SIZE;
      const inaccAngle = random(TWO_PI);
      const inaccDist = random(0, inaccuracyMax);
      tx += cos(inaccAngle) * inaccDist;
      ty += sin(inaccAngle) * inaccDist;

      enemy.rot = ang;

      // Jump takeoff feedback
      if (state.vfx) {
        state.vfx.push(spawnHitSpark(enemy.pos.x, enemy.pos.y, [180, 160, 120]));
        state.vfx.push(spawnHitSpark(enemy.pos.x + 6, enemy.pos.y, [180, 160, 120]));
      }

      enemy.launchIntoAir(tx, ty, this.jumpDuration, this.maxArcHeight);
      this.wasAirborne = true;
      this.restTimer = this.rollRestFrames();
    }
  }

  triggerLandingAoE(): void {
    if (state.frames === this.lastLandFrame) return;
    this.lastLandFrame = state.frames;

    const enemy = this.enemy;
    const bulletKey = this.landingBulletKey || 'b_hopper_slam';

    // Spawn landing impact bullet (deals 5 damage, 2 tiles AOE to player, turrets, and obstacles)
    const b = Bullet.create(enemy.pos.x, enemy.pos.y, enemy.pos.x, enemy.pos.y, bulletKey, 'none', enemy);
    b.life = 0;
    if (enemy.conditions.has('c_hypnotized')) {
      b.damageTargets = ['enemy', 'obstacle'];
      state.bullets.push(b);
    } else {
      state.enemyBullets.push(b);
    }
    b.explode();

    // Ground impact visual and audio effects
    soundEngine.playSFXGroup('projectile_hit_dirt');

    if (state.vfx) {
      for (let i = 0; i < 8; i++) {
        const sa = (TWO_PI / 8) * i;
        state.vfx.push(new MuzzleFlash(enemy.pos.x, enemy.pos.y, sa, 16, 5, color(180, 140, 90)));
      }
      state.vfx.push(spawnHitSpark(enemy.pos.x, enemy.pos.y, [220, 190, 130]));
      state.vfx.push(spawnHitSpark(enemy.pos.x + 8, enemy.pos.y + 4, [220, 190, 130]));
      state.vfx.push(spawnHitSpark(enemy.pos.x - 8, enemy.pos.y - 4, [220, 190, 130]));
    }
  }
}
