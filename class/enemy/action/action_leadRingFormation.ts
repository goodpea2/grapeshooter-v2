import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { GRID_SIZE } from '../../../constants';
import { eventBus } from '../../../src/events/eventBus';
import { lerpAngle } from '../../utils';
import { spawnHitSpark } from '../../../vfx/index';

declare const dist: any;
declare const cos: any;
declare const sin: any;

export class ActionLeadRingFormation extends EnemyAction {
  tags = ['collab', 'leader', 'support'];
  followers: any[] = [];
  maxFollowers: number = 8;
  collabRadius: number = GRID_SIZE * 1.5; // Contact attachment radius
  recruitRadius: number = GRID_SIZE * 8; // 8 tiles recruitment search radius
  ringRadius: number = GRID_SIZE * 2;   // 2 tiles circle
  revolveAngle: number = 0;
  revolveSpeed: number = 0.02;

  // Secondary ability: healFollower by 20 per 120 frames
  healAmount: number = 20;
  healInterval: number = 120;
  healTimer: number = 120;

  constructor(config: EnemyActionConfig) {
    super(config);
    this.maxFollowers = config.maxFollowers || 8;
    this.collabRadius = config.collabRadius || GRID_SIZE * 1.5;
    this.recruitRadius = config.recruitRadius || GRID_SIZE * 4;
    this.ringRadius = config.ringRadius || GRID_SIZE * 2;
    this.revolveSpeed = config.revolveSpeed || 0.02;
    this.healAmount = config.healFollowerAmount || 20;
    this.healInterval = config.healFollowerInterval || 120;
    this.healTimer = this.healInterval;
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    if (this.enemy.isDying || this.enemy.isAirborne) return false;
    return true;
  }

  isReady(): boolean {
    return true;
  }

  performExecute(): void {}

  findNearestRecruit(): any | null {
    if (this.followers.length >= this.maxFollowers) return null;
    const enemy = this.enemy;
    const rSq = this.recruitRadius * this.recruitRadius;
    let bestRecruit: any = null;
    let bestDistSq = Infinity;

    for (const other of state.enemies) {
      if (other === enemy || other.isDying || other.isAirborne || other.health <= 0) continue;
      if (other.leader) continue;
      if (other.type === 'e_leader' || other.type === 'e_leader_ring') continue;
      if (other.conditions.has('c_hypnotized')) continue;
      if (other.collaboratingWith) continue;
      if (other.maxHealth >= enemy.maxHealth) continue;

      const dx = other.pos.x - enemy.pos.x;
      const dy = other.pos.y - enemy.pos.y;
      const dSq = dx * dx + dy * dy;

      if (dSq <= rSq && dSq < bestDistSq) {
        bestDistSq = dSq;
        bestRecruit = other;
      }
    }
    return bestRecruit;
  }

  update(_playerPos: any, _turrets: any[]): void {
    const enemy = this.enemy;
    if (enemy.isDying || enemy.isAirborne) {
      this.releaseFormation();
      return;
    }

    // Clean dead or disconnected followers
    this.followers = this.followers.filter(f => {
      if (!f || f.isDying || f.health <= 0 || f.isAirborne) {
        if (f) {
          f.unlockActions(['movement']);
          f.leader = null;
        }
        return false;
      }
      return true;
    });

    // Search and recruit nearby eligible lesser-health enemies
    if (this.followers.length < this.maxFollowers) {
      this.searchAndRecruit();
    }

    // Update circular revolving formation positioning for all followers
    this.updateFollowerPositions();

    // Secondary Ability: healFollower by 20 per 120 frames
    this.healTimer--;
    if (this.healTimer <= 0) {
      this.healTimer = this.healInterval;
      this.healFollowers();
    }
  }

  healFollowers(): void {
    if (this.followers.length === 0) return;
    let healedAny = false;

    for (const f of this.followers) {
      if (f && !f.isDying && f.health > 0 && f.health < f.maxHealth) {
        f.takeDamage(-this.healAmount, this.enemy);
        f.flash = 12;
        f.flashType = 'heal';
        healedAny = true;
        if (state.vfx) {
          state.vfx.push(spawnHitSpark(f.pos.x, f.pos.y, [100, 255, 140]));
          state.vfx.push(spawnHitSpark(f.pos.x, f.pos.y - 8, [130, 255, 180]));
        }
      }
    }

    if (healedAny) {
      eventBus.emit('ENEMY_COLLAB', {
        type: 'heal_follower' as any,
        source: this.enemy,
        amount: this.healAmount
      });
      if (state.vfx) {
        state.vfx.push(spawnHitSpark(this.enemy.pos.x, this.enemy.pos.y, [80, 255, 160]));
      }
    }
  }

  searchAndRecruit(): void {
    const enemy = this.enemy;

    for (const other of state.enemies) {
      if (this.followers.length >= this.maxFollowers) break;
      if (other === enemy || other.isDying || other.isAirborne || other.health <= 0) continue;
      if (other.leader) continue; // Already attached to a leader
      if (other.type === 'e_leader' || other.type === 'e_leader_ring') continue;
      if (other.conditions.has('c_hypnotized')) continue;
      if (other.collaboratingWith) continue;
      // Lesser-health check: only recruit enemies with lower max health than leader (400)
      if (other.maxHealth >= enemy.maxHealth) continue;

      const d = dist(enemy.pos.x, enemy.pos.y, other.pos.x, other.pos.y);
      const contactDist = (enemy.size + other.size) * 0.5 + 24;
      if (d <= contactDist) {
        this.attachFollower(other);
      }
    }
  }

  attachFollower(ally: any): void {
    if (this.followers.includes(ally)) return;
    this.followers.push(ally);
    ally.leader = this.enemy;
    // Lock only movement: followers still attack, shoot, or cast if within range!
    ally.lockActions(['movement']);

    if (state.vfx) {
      state.vfx.push(spawnHitSpark(ally.pos.x, ally.pos.y, [120, 220, 255]));
    }
    eventBus.emit('ENEMY_COLLAB', { type: 'ring_attach', source: this.enemy, target: ally });
  }

  updateFollowerPositions(): void {
    const n = this.followers.length;
    if (n === 0) return;

    // Slowly revolve the circle
    this.revolveAngle += this.revolveSpeed;
    if (this.revolveAngle > Math.PI * 2) {
      this.revolveAngle -= Math.PI * 2;
    }

    const step = (Math.PI * 2) / n;

    for (let i = 0; i < n; i++) {
      const follower = this.followers[i];
      const slotAngle = this.revolveAngle + (i * step);

      const targetX = this.enemy.pos.x + cos(slotAngle) * this.ringRadius;
      const targetY = this.enemy.pos.y + sin(slotAngle) * this.ringRadius;

      // Smooth position interpolation to the revolving ring slot
      follower.pos.x += (targetX - follower.pos.x) * 0.25;
      follower.pos.y += (targetY - follower.pos.y) * 0.25;
      // Rotate follower to face outward from ring center
      follower.rot = lerpAngle(follower.rot, slotAngle, 0.2);
    }
  }

  releaseFormation(): void {
    for (const f of this.followers) {
      if (f) {
        f.unlockActions(['movement']);
        f.leader = null;
      }
    }
    this.followers = [];
  }

  override onDeath(): void {
    this.releaseFormation();
  }
}
