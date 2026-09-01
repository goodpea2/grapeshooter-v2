import { state } from './state';
import { GRID_SIZE } from './constants';

declare const floor: any;
declare const sqrt: any;
declare const push: any;
declare const pop: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const line: any;
declare const fill: any;
declare const noFill: any;
declare const noStroke: any;
declare const ellipse: any;

const FIELD_RADIUS = 36; // 36 tiles in each direction (73x73 = 5,329 tiles, ~2336x2336 px)
const FIELD_DIM = FIELD_RADIUS * 2 + 1;
const SQRT2 = 1.41421356;

export interface FlowFieldGoal {
  id: string;
  pos: { x: number; y: number };
  priority: number; // Higher number = higher priority
  field: FlowFieldManager;
  active: boolean;
  type?: string;
}

export class FlowFieldManager {
  goalId: string = 'player';
  originGx: number = 0;
  originGy: number = 0;
  targetGx: number = 0;
  targetGy: number = 0;

  passable: Uint8Array = new Uint8Array(FIELD_DIM * FIELD_DIM);
  clearance: Uint8Array = new Uint8Array(FIELD_DIM * FIELD_DIM);

  distNormal: Float32Array = new Float32Array(FIELD_DIM * FIELD_DIM);
  distGiant: Float32Array = new Float32Array(FIELD_DIM * FIELD_DIM);

  vecXNormal: Float32Array = new Float32Array(FIELD_DIM * FIELD_DIM);
  vecYNormal: Float32Array = new Float32Array(FIELD_DIM * FIELD_DIM);

  vecXGiant: Float32Array = new Float32Array(FIELD_DIM * FIELD_DIM);
  vecYGiant: Float32Array = new Float32Array(FIELD_DIM * FIELD_DIM);

  isSiegeNormal: Uint8Array = new Uint8Array(FIELD_DIM * FIELD_DIM);
  isSiegeGiant: Uint8Array = new Uint8Array(FIELD_DIM * FIELD_DIM);

  lastUpdateFrame: number = -999;
  needsUpdate: boolean = true;

  private queueX: Int16Array = new Int16Array(FIELD_DIM * FIELD_DIM);
  private queueY: Int16Array = new Int16Array(FIELD_DIM * FIELD_DIM);

  constructor(goalId: string = 'player') {
    this.goalId = goalId;
  }

  markDirty() {
    this.needsUpdate = true;
  }

  update(targetPos: { x: number; y: number }, force: boolean = false) {
    if (!state.world || !state.world.isBlockAt) return;

    const tgx = floor(targetPos.x / GRID_SIZE);
    const tgy = floor(targetPos.y / GRID_SIZE);

    const tileMoved = tgx !== this.targetGx || tgy !== this.targetGy;
    const intervalDue = (state.frames - this.lastUpdateFrame) >= 12;

    if (!force && !this.needsUpdate && !tileMoved && !intervalDue) {
      return;
    }

    this.lastUpdateFrame = state.frames;
    this.needsUpdate = false;
    this.targetGx = tgx;
    this.targetGy = tgy;
    this.originGx = tgx - FIELD_RADIUS;
    this.originGy = tgy - FIELD_RADIUS;

    // Pass 1: Build passability grid
    for (let ly = 0; ly < FIELD_DIM; ly++) {
      const gy = this.originGy + ly;
      const wy = gy * GRID_SIZE + GRID_SIZE * 0.5;
      const rowOffset = ly * FIELD_DIM;

      for (let lx = 0; lx < FIELD_DIM; lx++) {
        const gx = this.originGx + lx;
        const wx = gx * GRID_SIZE + GRID_SIZE * 0.5;
        const idx = rowOffset + lx;

        const isSolid = state.world.isBlockAt(wx, wy);
        this.passable[idx] = isSolid ? 0 : 1;
      }
    }

    // Pass 2: Calculate clearance grid (0 = solid, 1 = 1x1 open, 2 = 2x2 open)
    for (let ly = 0; ly < FIELD_DIM; ly++) {
      const rowOffset = ly * FIELD_DIM;
      for (let lx = 0; lx < FIELD_DIM; lx++) {
        const idx = rowOffset + lx;
        if (this.passable[idx] === 0) {
          this.clearance[idx] = 0;
          continue;
        }

        // Clearance 1 is guaranteed if passable
        let clr = 1;
        if (lx + 1 < FIELD_DIM && ly + 1 < FIELD_DIM) {
          const r1 = this.passable[idx + 1];
          const b1 = this.passable[idx + FIELD_DIM];
          const d1 = this.passable[idx + FIELD_DIM + 1];
          if (r1 === 1 && b1 === 1 && d1 === 1) {
            clr = 2;
          }
        }
        this.clearance[idx] = clr;
      }
    }

    // Pass 3: Compute Dijkstra distance field & vectors for Normal enemies (clearance >= 1)
    this.computeDijkstraField(1, this.distNormal, this.vecXNormal, this.vecYNormal, this.isSiegeNormal);

    // Pass 4: Compute Dijkstra distance field & vectors for Giant enemies (clearance >= 2)
    this.computeDijkstraField(2, this.distGiant, this.vecXGiant, this.vecYGiant, this.isSiegeGiant);
  }

  private computeDijkstraField(
    minClearance: number,
    distField: Float32Array,
    vecX: Float32Array,
    vecY: Float32Array,
    siegeField: Uint8Array
  ) {
    const totalCells = FIELD_DIM * FIELD_DIM;
    distField.fill(1e9);
    siegeField.fill(0);
    vecX.fill(0);
    vecY.fill(0);

    const centerLx = FIELD_RADIUS;
    const centerLy = FIELD_RADIUS;
    const centerIdx = centerLy * FIELD_DIM + centerLx;

    let head = 0;
    let tail = 0;

    // Check if target tile itself meets clearance
    let startLx = centerLx;
    let startLy = centerLy;

    if (this.clearance[centerIdx] < minClearance) {
      // Find nearest accessible tile to target that meets clearance
      let bestDistSq = 9999;
      for (let r = 1; r <= 4; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const nx = centerLx + dx;
            const ny = centerLy + dy;
            if (nx >= 0 && nx < FIELD_DIM && ny >= 0 && ny < FIELD_DIM) {
              const nidx = ny * FIELD_DIM + nx;
              if (this.clearance[nidx] >= minClearance) {
                const dSq = dx * dx + dy * dy;
                if (dSq < bestDistSq) {
                  bestDistSq = dSq;
                  startLx = nx;
                  startLy = ny;
                }
              }
            }
          }
        }
        if (bestDistSq < 9999) break;
      }
    }

    const startIdx = startLy * FIELD_DIM + startLx;
    if (this.clearance[startIdx] >= minClearance) {
      distField[startIdx] = 0;
      this.queueX[tail] = startLx;
      this.queueY[tail] = startLy;
      tail++;
    }

    // Directions: 4 cardinals first, then 4 diagonals
    const dxs = [1, -1, 0, 0, 1, -1, 1, -1];
    const dys = [0, 0, 1, -1, 1, 1, -1, -1];
    const costs = [1.0, 1.0, 1.0, 1.0, SQRT2, SQRT2, SQRT2, SQRT2];

    // Standard Dijkstra / BFS Wavefront
    while (head < tail) {
      const cx = this.queueX[head];
      const cy = this.queueY[head];
      head++;

      const cIdx = cy * FIELD_DIM + cx;
      const cDist = distField[cIdx];

      for (let i = 0; i < 8; i++) {
        const nx = cx + dxs[i];
        const ny = cy + dys[i];

        if (nx < 0 || nx >= FIELD_DIM || ny < 0 || ny >= FIELD_DIM) continue;
        const nIdx = ny * FIELD_DIM + nx;

        if (this.clearance[nIdx] < minClearance) continue;

        // For diagonal movement, ensure both cardinal neighbors are passable to prevent cutting sharp corners
        if (i >= 4) {
          const card1Idx = cy * FIELD_DIM + nx;
          const card2Idx = ny * FIELD_DIM + cx;
          if (this.clearance[card1Idx] < minClearance || this.clearance[card2Idx] < minClearance) {
            continue;
          }
        }

        const newDist = cDist + costs[i];
        if (newDist < distField[nIdx]) {
          distField[nIdx] = newDist;
          this.queueX[tail] = nx;
          this.queueY[tail] = ny;
          tail++;
        }
      }
    }

    // Perimeter Siege Fallback: For disconnected pockets of open tiles (dist = 1e9)
    let hasUnreachable = false;
    for (let i = 0; i < totalCells; i++) {
      if (this.clearance[i] >= minClearance && distField[i] >= 1e8) {
        hasUnreachable = true;
        break;
      }
    }

    if (hasUnreachable) {
      // Find candidate seed: unreachable open tile with minimal Euclidean distance to center
      let bestSeedIdx = -1;
      let minEuclidSq = 999999;

      for (let ly = 0; ly < FIELD_DIM; ly++) {
        for (let lx = 0; lx < FIELD_DIM; lx++) {
          const idx = ly * FIELD_DIM + lx;
          if (this.clearance[idx] >= minClearance && distField[idx] >= 1e8) {
            const edx = lx - centerLx;
            const edy = ly - centerLy;
            const eSq = edx * edx + edy * edy;
            if (eSq < minEuclidSq) {
              minEuclidSq = eSq;
              bestSeedIdx = idx;
            }
          }
        }
      }

      if (bestSeedIdx !== -1) {
        const seedLx = bestSeedIdx % FIELD_DIM;
        const seedLy = Math.floor(bestSeedIdx / FIELD_DIM);

        distField[bestSeedIdx] = 0;
        siegeField[bestSeedIdx] = 1;
        head = 0;
        tail = 0;
        this.queueX[tail] = seedLx;
        this.queueY[tail] = seedLy;
        tail++;

        while (head < tail) {
          const cx = this.queueX[head];
          const cy = this.queueY[head];
          head++;

          const cIdx = cy * FIELD_DIM + cx;
          const cDist = distField[cIdx];

          for (let i = 0; i < 8; i++) {
            const nx = cx + dxs[i];
            const ny = cy + dys[i];

            if (nx < 0 || nx >= FIELD_DIM || ny < 0 || ny >= FIELD_DIM) continue;
            const nIdx = ny * FIELD_DIM + nx;

            if (this.clearance[nIdx] < minClearance) continue;
            if (i >= 4) {
              const card1Idx = cy * FIELD_DIM + nx;
              const card2Idx = ny * FIELD_DIM + cx;
              if (this.clearance[card1Idx] < minClearance || this.clearance[card2Idx] < minClearance) continue;
            }

            const newDist = cDist + costs[i];
            if (newDist < distField[nIdx]) {
              distField[nIdx] = newDist;
              siegeField[nIdx] = 1;
              this.queueX[tail] = nx;
              this.queueY[tail] = ny;
              tail++;
            }
          }
        }
      }
    }

    // Compute Direction Vectors via Gradient Descent
    for (let ly = 0; ly < FIELD_DIM; ly++) {
      const rowOffset = ly * FIELD_DIM;
      for (let lx = 0; lx < FIELD_DIM; lx++) {
        const idx = rowOffset + lx;
        if (this.clearance[idx] < minClearance || distField[idx] >= 1e8) {
          continue;
        }

        let bestDist = distField[idx];
        let bestDirX = 0;
        let bestDirY = 0;

        const hasNearbyObstacle = (
          (lx > 0 && this.clearance[idx - 1] < minClearance) ||
          (lx + 1 < FIELD_DIM && this.clearance[idx + 1] < minClearance) ||
          (ly > 0 && this.clearance[idx - FIELD_DIM] < minClearance) ||
          (ly + 1 < FIELD_DIM && this.clearance[idx + FIELD_DIM] < minClearance)
        );

        const maxDirections = hasNearbyObstacle ? 4 : 8;
        for (let i = 0; i < maxDirections; i++) {
          const nx = lx + dxs[i];
          const ny = ly + dys[i];
          if (nx < 0 || nx >= FIELD_DIM || ny < 0 || ny >= FIELD_DIM) continue;

          const nIdx = ny * FIELD_DIM + nx;
          const nDist = distField[nIdx];

          if (nDist < bestDist) {
            bestDist = nDist;
            bestDirX = dxs[i];
            bestDirY = dys[i];
          }
        }

        if (bestDirX !== 0 || bestDirY !== 0) {
          const len = Math.sqrt(bestDirX * bestDirX + bestDirY * bestDirY);
          vecX[idx] = bestDirX / len;
          vecY[idx] = bestDirY / len;
        }
      }
    }
  }

  isTileAccessible(worldX: number, worldY: number): boolean {
    if (!state.player) return true;
    const dx = worldX - state.player.pos.x;
    const dy = worldY - state.player.pos.y;
    const dSq = dx * dx + dy * dy;
    if (dSq <= (GRID_SIZE * 1.6) ** 2) return true;
    if (state.world && state.world.checkLOS && state.world.checkLOS(state.player.pos.x, state.player.pos.y, worldX, worldY)) {
      return true;
    }
    const gx = floor(worldX / GRID_SIZE);
    const gy = floor(worldY / GRID_SIZE);
    const lx = gx - this.originGx;
    const ly = gy - this.originGy;
    if (lx < 0 || lx >= FIELD_DIM || ly < 0 || ly >= FIELD_DIM) {
      return false;
    }
    const idx = ly * FIELD_DIM + lx;
    return this.distNormal[idx] < 1e8 && this.isSiegeNormal[idx] === 0;
  }

  isGridAccessible(gx: number, gy: number): boolean {
    if (!state.player) return true;
    const wx = gx * GRID_SIZE + GRID_SIZE / 2;
    const wy = gy * GRID_SIZE + GRID_SIZE / 2;
    return this.isTileAccessible(wx, wy);
  }

  getEnemyMoveVector(
    enemyPos: { x: number; y: number },
    enemySize: number,
    targetPos: { x: number; y: number }
  ): { vx: number; vy: number; mode: 'los' | 'flow' | 'siege' | 'direct' } {
    const directDx = targetPos.x - enemyPos.x;
    const directDy = targetPos.y - enemyPos.y;
    const directDistSq = directDx * directDx + directDy * directDy;

    // Check direct Line-of-Sight first
    if (state.world && state.world.checkLOS && state.world.checkLOS(enemyPos.x, enemyPos.y, targetPos.x, targetPos.y)) {
      const d = Math.sqrt(directDistSq);
      if (d > 0.001) {
        return { vx: directDx / d, vy: directDy / d, mode: 'los' };
      }
      return { vx: 0, vy: 0, mode: 'los' };
    }

    // Convert enemy pos to local grid space
    const egx = floor(enemyPos.x / GRID_SIZE);
    const egy = floor(enemyPos.y / GRID_SIZE);

    const lx = egx - this.originGx;
    const ly = egy - this.originGy;

    if (lx >= 0 && lx < FIELD_DIM && ly >= 0 && ly < FIELD_DIM) {
      const idx = ly * FIELD_DIM + lx;
      const isGiant = enemySize >= 44;

      let vx = isGiant ? this.vecXGiant[idx] : this.vecXNormal[idx];
      let vy = isGiant ? this.vecYGiant[idx] : this.vecYNormal[idx];
      const isSiege = (isGiant ? this.isSiegeGiant[idx] : this.isSiegeNormal[idx]) === 1;

      if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
        const tileCenterX = (egx + 0.5) * GRID_SIZE;
        const tileCenterY = (egy + 0.5) * GRID_SIZE;
        const offX = tileCenterX - enemyPos.x;
        const offY = tileCenterY - enemyPos.y;

        const centeringWeight = 0.55;
        if (Math.abs(vx) > 0.7 && Math.abs(vy) < 0.3) {
          vy += Math.max(-1, Math.min(1, offY / (GRID_SIZE * 0.4))) * centeringWeight;
        } else if (Math.abs(vy) > 0.7 && Math.abs(vx) < 0.3) {
          vx += Math.max(-1, Math.min(1, offX / (GRID_SIZE * 0.4))) * centeringWeight;
        } else {
          vx += Math.max(-0.6, Math.min(0.6, offX / GRID_SIZE)) * centeringWeight;
          vy += Math.max(-0.6, Math.min(0.6, offY / GRID_SIZE)) * centeringWeight;
        }

        const len = Math.sqrt(vx * vx + vy * vy);
        if (len > 0.001) {
          vx /= len;
          vy /= len;
        }

        return { vx, vy, mode: isSiege ? 'siege' : 'flow' };
      }
    }

    // Fallback: Direct vector towards target
    const d = Math.sqrt(directDistSq);
    if (d > 0.001) {
      return { vx: directDx / d, vy: directDy / d, mode: 'direct' };
    }
    return { vx: 0, vy: 0, mode: 'direct' };
  }

  drawDebug() {
    if (!state.debugGizmosEnemies) return;

    push();
    const margin = 200;
    const left = state.cameraPos.x - (window as any).width / 2 - margin;
    const right = state.cameraPos.x + (window as any).width / 2 + margin;
    const top = state.cameraPos.y - (window as any).height / 2 - margin;
    const bottom = state.cameraPos.y + (window as any).height / 2 + margin;

    for (let ly = 0; ly < FIELD_DIM; ly += 2) {
      const gy = this.originGy + ly;
      const wy = gy * GRID_SIZE + GRID_SIZE * 0.5;
      if (wy < top || wy > bottom) continue;

      const rowOffset = ly * FIELD_DIM;
      for (let lx = 0; lx < FIELD_DIM; lx += 2) {
        const gx = this.originGx + lx;
        const wx = gx * GRID_SIZE + GRID_SIZE * 0.5;
        if (wx < left || wx > right) continue;

        const idx = rowOffset + lx;
        const vx = this.vecXNormal[idx];
        const vy = this.vecYNormal[idx];
        const isSiege = this.isSiegeNormal[idx] === 1;

        if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
          if (isSiege) {
            stroke(255, 165, 0, 120);
          } else {
            stroke(0, 220, 255, 120);
          }
          strokeWeight(1.5);
          line(wx, wy, wx + vx * 12, wy + vy * 12);
        }
      }
    }

    pop();
  }
}

/**
 * Hierarchical Multi-Goal Flow Field Registry
 * Manages multiple prioritized targets (Player, Core Base, PayGates, High Priority Objectives)
 */
export class FlowFieldRegistry {
  private goals: Map<string, FlowFieldGoal> = new Map();
  playerField: FlowFieldManager;

  constructor() {
    this.playerField = new FlowFieldManager('player');
    this.registerGoal('player', { x: 0, y: 0 }, 100, this.playerField);
  }

  registerGoal(id: string, pos: { x: number; y: number }, priority: number = 10, existingField?: FlowFieldManager, type?: string): FlowFieldGoal {
    let field = existingField || this.goals.get(id)?.field;
    if (!field) {
      field = new FlowFieldManager(id);
    }
    const goal: FlowFieldGoal = {
      id,
      pos,
      priority,
      field,
      active: true,
      type
    };
    this.goals.set(id, goal);
    return goal;
  }

  unregisterGoal(id: string): void {
    if (id === 'player') return; // Cannot remove player field
    this.goals.delete(id);
  }

  getGoal(id: string): FlowFieldGoal | undefined {
    return this.goals.get(id);
  }

  getActiveGoalsSorted(): FlowFieldGoal[] {
    const list: FlowFieldGoal[] = [];
    for (const g of this.goals.values()) {
      if (g.active) list.push(g);
    }
    return list.sort((a, b) => b.priority - a.priority);
  }

  markDirty(): void {
    for (const g of this.goals.values()) {
      g.field.markDirty();
    }
  }

  updateAll(): void {
    if (state.player) {
      const pGoal = this.goals.get('player');
      if (pGoal) {
        pGoal.pos = state.player.pos;
        pGoal.field.update(state.player.pos);
      }
    }

    for (const g of this.goals.values()) {
      if (g.id !== 'player' && g.active) {
        g.field.update(g.pos);
      }
    }
  }

  getEnemyMoveVector(
    enemyPos: { x: number; y: number },
    enemySize: number,
    targetPos: { x: number; y: number },
    goalId?: string
  ): { vx: number; vy: number; mode: 'los' | 'flow' | 'siege' | 'direct' } {
    if (goalId && this.goals.has(goalId)) {
      const goal = this.goals.get(goalId)!;
      if (goal.active) {
        return goal.field.getEnemyMoveVector(enemyPos, enemySize, targetPos);
      }
    }

    // Default to player flow field
    return this.playerField.getEnemyMoveVector(enemyPos, enemySize, targetPos);
  }

  drawDebug(): void {
    for (const g of this.goals.values()) {
      if (g.active) {
        g.field.drawDebug();
      }
    }
  }
}

export const flowFieldRegistry = new FlowFieldRegistry();
export const flowField = flowFieldRegistry.playerField;

