import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { GRID_SIZE } from '../../../constants';
import { enemyTypes } from '../../../balanceEnemies';
import { eventBus } from '../../../src/events/eventBus';
import { soundEngine } from '../../../src/audio/soundEngine';
import { spawnHitSpark } from '../../../vfx/index';
import { lerpAngle } from '../../utils';

declare const p5: any;
declare const createVector: any;
declare const atan2: any;

export class ActionLaunchAlly extends EnemyAction {
  tags = ['support', 'launch', 'collab'];
  launchTimer: number = 0;
  launchInterval: number = 360; // 6 seconds @ 60 FPS
  collabRadius: number = GRID_SIZE * 4; // 4 tiles
  maxCostToLaunch: number = 150;
  launchDistanceRatio: number = 0.75;
  launchDuration: number = 75;
  maxArcHeight: number = 90;
  prepDuration: number = 60; // 60 frames stopping duration before launch

  phase: 'idle' | 'calling' | 'approaching' | 'windup' = 'idle';
  callingAlly: any = null;
  windupTimer: number = 0;

  constructor(config: EnemyActionConfig) {
    super(config);
    this.launchInterval = config.launchInterval || 360;
    this.collabRadius = config.collabRadius || GRID_SIZE * 4;
    this.maxCostToLaunch = config.maxCostToLaunch || 150;
    this.launchDistanceRatio = config.launchDistanceRatio || 0.75;
    this.launchDuration = config.launchDuration || 75;
    this.maxArcHeight = config.maxArcHeight || 90;
    this.prepDuration = config.prepDuration || 60;
    this.launchTimer = this.launchInterval;
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    if (this.enemy.isDying || this.enemy.isAirborne) return false;
    if (this.enemy.conditions.has('c_stun') || this.enemy.kbTimer > 0) return false;
    return true;
  }

  isReady(): boolean {
    return this.launchTimer <= 0;
  }

  update(playerPos: any, turrets: any[]): void {
    const enemy = this.enemy;
    if (enemy.isDying || enemy.isAirborne) {
      this.cancelCollab();
      return;
    }

    // Handle stun or knockback interruption
    if (enemy.conditions.has('c_stun') || enemy.kbTimer > 0) {
      if (this.phase === 'approaching' || this.phase === 'windup') {
        this.cancelCollab();
      }
      return;
    }

    // Cooldown phase
    if (this.phase === 'idle') {
      if (this.launchTimer > 0) {
        this.launchTimer--;
      }
      if (this.canExecute() && this.isReady()) {
        this.phase = 'calling';
      }
    }

    // Calling phase: broadcast 'NeedCollabor call' to eligible allies within 4 tiles
    if (this.phase === 'calling') {
      this.sendCollabCall();
    }

    // Approaching phase: partner ally intentionally moves to the launcher
    if (this.phase === 'approaching') {
      this.updateApproaching();
    }

    // Windup phase: 60-frame pause stopping both enemies before launching
    if (this.phase === 'windup') {
      this.updateWindup();
    }
  }

  performExecute(): void {}

  sendCollabCall(): void {
    const enemy = this.enemy;
    const rSq = this.collabRadius * this.collabRadius;

    // Broadcast NeedCollabor call via EventBus
    eventBus.emit('ENEMY_COLLAB', {
      type: 'need_collab' as any,
      source: enemy
    });

    if (state.vfx) {
      state.vfx.push(spawnHitSpark(enemy.pos.x, enemy.pos.y, [200, 130, 255]));
    }

    // Find nearest eligible ally within 4 tiles
    let bestAlly: any = null;
    let closestDistSq = Infinity;

    for (const other of state.enemies) {
      if (other === enemy || other.isDying || other.isAirborne) continue;
      if (other.leader) continue; // In a leader chain
      if (other.type === 'e_launcher') continue; // Don't launch other launchers
      if (other.conditions.has('c_hypnotized')) continue;
      if (other.collaboratingWith) continue; // Already collaborating

      const cost = enemyTypes[other.type]?.cost ?? 0;
      if (cost >= this.maxCostToLaunch) continue;

      const dx = other.pos.x - enemy.pos.x;
      const dy = other.pos.y - enemy.pos.y;
      const dSq = dx * dx + dy * dy;

      if (dSq <= rSq && dSq < closestDistSq) {
        closestDistSq = dSq;
        bestAlly = other;
      }
    }

    if (!bestAlly) {
      // No eligible ally nearby, retry scan in 30 frames
      this.launchTimer = 30;
      this.phase = 'idle';
      return;
    }

    // Assign collaborator: partner intentionally stops its current action and navigates to launcher
    this.callingAlly = bestAlly;
    bestAlly.collaboratingWith = enemy;
    bestAlly.lockActions(['movement', 'attack']);

    // Stop launcher movement while partner travels to it
    enemy.lockActions(['movement']);

    eventBus.emit('ENEMY_COLLAB', {
      type: 'collab_respond' as any,
      source: enemy,
      target: bestAlly
    });

    this.phase = 'approaching';
  }

  updateApproaching(): void {
    const enemy = this.enemy;
    const ally = this.callingAlly;

    // Validate collaborator still exists and is healthy
    if (!ally || ally.isDying || ally.health <= 0 || ally.isAirborne || ally.conditions.has('c_hypnotized')) {
      this.cancelCollab();
      this.launchTimer = 30;
      this.phase = 'idle';
      return;
    }

    // Lock launcher from wandering
    enemy.lockActions(['movement']);

    const dx = enemy.pos.x - ally.pos.x;
    const dy = enemy.pos.y - ally.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Calculate movement speed modifier for collaborator
    let speedMult = 1.0;
    for (const [cKey] of ally.conditions) {
      const cfg = (window as any).conditionTypes?.[cKey];
      if (cfg?.enemyMovementSpeedMultiplier !== undefined) speedMult *= cfg.enemyMovementSpeedMultiplier;
    }
    const moveSpeed = Math.max(0.7, ally.speed * speedMult * 1.25);

    if (d > 0.01) {
      const vx = (dx / d) * moveSpeed;
      const vy = (dy / d) * moveSpeed;
      ally.moveWithCollisions(createVector(vx, vy));
      ally.rot = lerpAngle(ally.rot, atan2(dy, dx), 0.2);
    }

    // Particle tether between launcher and collaborating ally
    if (state.frames % 6 === 0 && state.vfx) {
      const midX = (enemy.pos.x + ally.pos.x) * 0.5;
      const midY = (enemy.pos.y + ally.pos.y) * 0.5;
      state.vfx.push(spawnHitSpark(midX, midY, [190, 110, 255]));
    }

    // When ally reaches launcher, transition into 60-frame windup
    const contactDist = (enemy.size + ally.size) * 0.5 + 16;
    if (d <= contactDist) {
      this.phase = 'windup';
      this.windupTimer = this.prepDuration; // 60 frames
      enemy.lockActions(['movement', 'attack']);
      ally.lockActions(['movement', 'attack']);
      soundEngine.playSFXGroup('projectile_hit_dirt');
    }
  }

  updateWindup(): void {
    const enemy = this.enemy;
    const ally = this.callingAlly;

    // Validate collaborator
    if (!ally || ally.isDying || ally.health <= 0 || ally.isAirborne || ally.conditions.has('c_hypnotized')) {
      this.cancelCollab();
      this.launchTimer = 30;
      this.phase = 'idle';
      return;
    }

    // Both enemies remain stopped for the 60-frames duration
    enemy.lockActions(['movement', 'attack']);
    ally.lockActions(['movement', 'attack']);

    // Visual charging feedback
    if (state.frames % 8 === 0 && state.vfx) {
      state.vfx.push(spawnHitSpark(ally.pos.x, ally.pos.y, [210, 120, 255]));
      state.vfx.push(spawnHitSpark(enemy.pos.x, enemy.pos.y, [210, 120, 255]));
    }

    this.windupTimer--;
    if (this.windupTimer <= 0) {
      this.launchAllyNow();
    }
  }

  launchAllyNow(): void {
    const enemy = this.enemy;
    const ally = this.callingAlly;
    if (!ally || ally.isDying || ally.health <= 0) {
      this.cancelCollab();
      this.launchTimer = 30;
      this.phase = 'idle';
      return;
    }

    // Target landing spot: 75% distance from ally towards the player
    let targetX = state.player ? state.player.pos.x : enemy.pos.x;
    let targetY = state.player ? state.player.pos.y : enemy.pos.y;

    const toPlayerX = targetX - ally.pos.x;
    const toPlayerY = targetY - ally.pos.y;
    const landX = ally.pos.x + toPlayerX * this.launchDistanceRatio;
    const landY = ally.pos.y + toPlayerY * this.launchDistanceRatio;

    // Launch ally into airborne trajectory
    if (typeof ally.launchIntoAir === 'function') {
      ally.launchIntoAir(landX, landY, this.launchDuration, this.maxArcHeight);
    } else {
      ally.isAirborne = true;
      ally.airborneProgress = 0;
      ally.airborneDuration = this.launchDuration;
      ally.airborneStartPos = { x: ally.pos.x, y: ally.pos.y };
      ally.airborneTargetPos = { x: landX, y: landY };
      ally.airborneMaxHeight = this.maxArcHeight;
      ally.lockActions(['movement', 'attack']);
    }

    if (state.vfx) {
      state.vfx.push(spawnHitSpark(ally.pos.x, ally.pos.y, [180, 100, 255]));
      state.vfx.push(spawnHitSpark(enemy.pos.x, enemy.pos.y, [180, 100, 255]));
    }

    soundEngine.playSFXGroup('projectile_fire_mortar');
    eventBus.emit('ENEMY_COLLAB', { type: 'launch', source: enemy, target: ally });

    // Clean up collaboration state
    ally.collaboratingWith = null;
    this.callingAlly = null;
    enemy.unlockActions(['movement', 'attack']);

    // Reset launcher cycle
    this.launchTimer = this.launchInterval;
    this.phase = 'idle';
  }

  cancelCollab(): void {
    if (this.callingAlly) {
      this.callingAlly.collaboratingWith = null;
      this.callingAlly.unlockActions(['movement', 'attack']);
      this.callingAlly = null;
    }
    this.enemy.unlockActions(['movement', 'attack']);
    this.phase = 'idle';
  }

  override onDeath(): void {
    this.cancelCollab();
  }
}
