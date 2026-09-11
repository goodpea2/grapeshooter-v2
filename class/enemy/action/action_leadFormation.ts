import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { GRID_SIZE } from '../../../constants';
import { eventBus } from '../../../src/events/eventBus';
import { lerpAngle } from '../../utils';
import { spawnHitSpark } from '../../../vfx/index';

declare const dist: any;
declare const atan2: any;

export class ActionLeadFormation extends EnemyAction {
  tags = ['collab', 'leader'];
  followers: any[] = [];
  maxFollowers: number = 4;
  collabRadius: number = GRID_SIZE * 1.5; // Contact attachment radius
  recruitRadius: number = GRID_SIZE * 8; // 8 tiles recruitment search radius
  segmentSpacing: number = 24; // Distance between snake segments
  history: { x: number; y: number; rot: number }[] = [];

  constructor(config: EnemyActionConfig) {
    super(config);
    this.maxFollowers = config.maxFollowers || 4;
    this.collabRadius = config.collabRadius || GRID_SIZE * 1.5;
    this.recruitRadius = config.recruitRadius || GRID_SIZE * 4;
    this.segmentSpacing = config.segmentSpacing || 24;
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    if (this.enemy.isDying || this.enemy.isAirborne) return false;
    return true;
  }

  isReady(): boolean {
    return true;
  }

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

  update(playerPos: any, turrets: any[]): void {
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

    // Record leader trail history (store position every frame)
    this.history.unshift({ x: enemy.pos.x, y: enemy.pos.y, rot: enemy.rot });
    if (this.history.length > 200) {
      this.history.pop();
    }

    // Search and recruit nearby eligible lesser-health enemies
    if (this.followers.length < this.maxFollowers) {
      this.searchAndRecruit();
    }

    // Update snake-like formation positioning for all followers
    this.updateFollowerPositions();
  }

  searchAndRecruit(): void {
    const enemy = this.enemy;

    for (const other of state.enemies) {
      if (this.followers.length >= this.maxFollowers) break;
      if (other === enemy || other.isDying || other.isAirborne || other.health <= 0) continue;
      if (other.leader) continue; // Already attached to a leader
      if (other.type === 'e_leader' || other.type === 'e_leader_ring') continue; // Leaders don't follow leaders
      if (other.conditions.has('c_hypnotized')) continue;
      if (other.collaboratingWith) continue;
      // Lesser-health check: only recruit enemies with lower max health than leader (400)
      if (other.maxHealth >= enemy.maxHealth) continue;

      const d = dist(enemy.pos.x, enemy.pos.y, other.pos.x, other.pos.y);
      // If close enough to touch / recruit (contact or recruitment zone)
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
    // Lock only movement: followers still attack, shoot, or bite if within range!
    ally.lockActions(['movement']);

    if (state.vfx) {
      state.vfx.push(spawnHitSpark(ally.pos.x, ally.pos.y, [100, 220, 255]));
    }
    eventBus.emit('ENEMY_COLLAB', { type: 'chain_attach', source: this.enemy, target: ally });
  }

  updateFollowerPositions(): void {
    if (this.followers.length === 0 || this.history.length < 2) return;

    let targetPrev = { x: this.enemy.pos.x, y: this.enemy.pos.y, rot: this.enemy.rot };

    for (let i = 0; i < this.followers.length; i++) {
      const follower = this.followers[i];
      const targetDist = this.segmentSpacing * (i + 1);

      // Interpolate along leader history trail to find position at targetDist
      let accumulatedDist = 0;
      let targetX = this.history[this.history.length - 1].x;
      let targetY = this.history[this.history.length - 1].y;
      let targetRot = this.history[this.history.length - 1].rot;

      for (let j = 0; j < this.history.length - 1; j++) {
        const p1 = this.history[j];
        const p2 = this.history[j + 1];
        const segDist = dist(p1.x, p1.y, p2.x, p2.y);

        if (accumulatedDist + segDist >= targetDist) {
          const ratio = segDist > 0 ? (targetDist - accumulatedDist) / segDist : 0;
          targetX = p1.x + (p2.x - p1.x) * ratio;
          targetY = p1.y + (p2.y - p1.y) * ratio;
          targetRot = p1.rot;
          break;
        }
        accumulatedDist += segDist;
      }

      // Smoothly pull follower towards target trail position
      const moveX = targetX - follower.pos.x;
      const moveY = targetY - follower.pos.y;
      follower.pos.x += moveX * 0.35;
      follower.pos.y += moveY * 0.35;

      const heading = atan2(targetPrev.y - follower.pos.y, targetPrev.x - follower.pos.x);
      follower.rot = lerpAngle(follower.rot, heading, 0.2);

      targetPrev = { x: follower.pos.x, y: follower.pos.y, rot: follower.rot };
    }
  }

  releaseFormation(): void {
    if (this.followers.length === 0) return;

    for (const follower of this.followers) {
      if (follower && !follower.isDying) {
        follower.unlockActions(['movement']);
        follower.leader = null;
        follower.unstuckFromObstacles?.();
      }
    }
    eventBus.emit('ENEMY_COLLAB', { type: 'chain_release', source: this.enemy });
    this.followers = [];
    this.history = [];
  }

  onDeath(): void {
    this.releaseFormation();
  }

  performExecute(): void {
    // Handled in update
  }
}
