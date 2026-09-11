import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { GRID_SIZE } from '../../../constants';
import { flowField } from '../../../pathfinding';
import { requestFlungSpawn } from '../../../lvDemo';
import { lerpAngle } from '../../utils';
import { state } from '../../../state';

declare const dist: any;
declare const atan2: any;
declare const cos: any;
declare const sin: any;
declare const random: any;
declare const TWO_PI: any;
declare const createVector: any;

export class ActionFleeAndHover extends EnemyAction {
  tags = ['movement', 'support'];
  minFleeDistanceTiles: number = 12;
  maxFleeDistanceTiles: number = 15;
  spawnInterval: number = 90;
  spawnTimer: number = 90;
  panicTimer: number = 0;

  constructor(config: EnemyActionConfig) {
    super(config);
    this.minFleeDistanceTiles = config.minFleeDistanceTiles || 12;
    this.maxFleeDistanceTiles = config.maxFleeDistanceTiles || 15;
    this.spawnInterval = config.spawnInterval || 90;
    this.spawnTimer = this.spawnInterval;
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

  onDamage(dmg: number, _source?: any): boolean {
    if (dmg > 0) {
      // Speed increases by 200% (3x total speed) for 60 frames
      this.panicTimer = 60;
    }
    return false;
  }

  update(playerPos: any, _turrets: any[] = []): void {
    const enemy = this.enemy;
    if (enemy.isDying || enemy.isAirborne) return;

    if (this.panicTimer > 0) {
      this.panicTimer--;
    }

    // Periodic spawn: e_critter_nodrop every 90 frames within 2 tiles radius
    this.spawnTimer--;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval;
      const ang = random(TWO_PI);
      const r = random(GRID_SIZE * 0.4, GRID_SIZE * 2);
      const sx = enemy.pos.x + cos(ang) * r;
      const sy = enemy.pos.y + sin(ang) * r;
      requestFlungSpawn(enemy.pos.x, enemy.pos.y, sx, sy, 'e_critter_nodrop', 15);
    }

    if (this.isLocked()) return;

    const turretList: any[] = [];
    if (Array.isArray(_turrets)) {
      turretList.push(..._turrets);
    } else if (state.player?.attachments && Array.isArray(state.player.attachments)) {
      turretList.push(...state.player.attachments);
    }
    if (state.world && typeof (state.world as any).getAllWorldTurrets === 'function') {
      const worldTurrets = (state.world as any).getAllWorldTurrets();
      if (Array.isArray(worldTurrets)) {
        turretList.push(...worldTurrets);
      }
    }

    let closestThreatPos = playerPos;
    let minThreatDist = dist(enemy.pos.x, enemy.pos.y, playerPos.x, playerPos.y);

    for (const t of turretList) {
      if (!t || t.health <= 0) continue;
      const tw = t.getWorldPos ? t.getWorldPos() : t.pos;
      if (!tw) continue;
      const td = dist(enemy.pos.x, enemy.pos.y, tw.x, tw.y);
      if (td < minThreatDist) {
        minThreatDist = td;
        closestThreatPos = tw;
      }
    }

    const currentSpeed = enemy.speed * (this.panicTimer > 0 ? 3.0 : 1.0);
    const minD = this.minFleeDistanceTiles * GRID_SIZE; // 384px (12 tiles)
    const maxD = this.maxFleeDistanceTiles * GRID_SIZE; // 480px (15 tiles)

    if (minThreatDist < minD) {
      // Direct flee away from closest threat (player or turret)
      const directFleeAngle = atan2(enemy.pos.y - closestThreatPos.y, enemy.pos.x - closestThreatPos.x);
      let moveVx = cos(directFleeAngle) * currentSpeed;
      let moveVy = sin(directFleeAngle) * currentSpeed;

      // Reverse pathfinding (second priority) if direct vector is obstructed
      if (state.world && state.world.checkCollision(enemy.pos.x + moveVx * 3, enemy.pos.y + moveVy * 3, enemy.size * 0.5)) {
        try {
          const rev = flowField.getReverseMoveVector(enemy.pos, enemy.size);
          if (rev && (rev.vx !== 0 || rev.vy !== 0)) {
            moveVx = rev.vx * currentSpeed;
            moveVy = rev.vy * currentSpeed;
          } else {
            // Fallback to tangential avoidance
            moveVx = cos(directFleeAngle + Math.PI / 2) * currentSpeed;
            moveVy = sin(directFleeAngle + Math.PI / 2) * currentSpeed;
          }
        } catch {
          // Fallback to tangential avoidance
          moveVx = cos(directFleeAngle + Math.PI / 2) * currentSpeed;
          moveVy = sin(directFleeAngle + Math.PI / 2) * currentSpeed;
        }
      }

      enemy.moveWithCollisions(createVector(moveVx, moveVy));
      enemy.rot = lerpAngle(enemy.rot, atan2(moveVy, moveVx), 0.2);
    } else if (minThreatDist > maxD) {
      // Outside 15 tiles: gently steer back toward the 12-15 tile zone around player
      const approachAngle = atan2(playerPos.y - enemy.pos.y, playerPos.x - enemy.pos.x);
      const moveVec = createVector(cos(approachAngle), sin(approachAngle)).mult(currentSpeed * 0.5);
      enemy.moveWithCollisions(moveVec);
      enemy.rot = lerpAngle(enemy.rot, approachAngle, 0.1);
    } else {
      // Between 12 and 15 tiles away: stay still and observe
      const faceAngle = atan2(playerPos.y - enemy.pos.y, playerPos.x - enemy.pos.x);
      enemy.rot = lerpAngle(enemy.rot, faceAngle, 0.05);
    }
  }
}
