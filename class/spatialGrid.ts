import { state } from '../state';
import { Enemy } from './enemy';

/**
 * High-performance spatial bucket grid.
 * Uses packed 32-bit integer coordinate keys and pooled bucket arrays to minimize GC allocations.
 */
export class SpatialHashGrid {
  private cellSize: number;
  private buckets: Map<number, any[]> = new Map();
  private arrayPool: any[][] = [];

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  setCellSize(cellSize: number) {
    this.cellSize = cellSize;
    this.clear();
  }

  getCellSize(): number {
    return this.cellSize;
  }

  private hash(gx: number, gy: number): number {
    // Pack 16-bit coordinates safely with 32768 bias to avoid negative wraparound
    return (((gx + 32768) & 0xFFFF) << 16) | ((gy + 32768) & 0xFFFF);
  }

  clear() {
    for (const arr of this.buckets.values()) {
      arr.length = 0;
      if (this.arrayPool.length < 500) {
        this.arrayPool.push(arr);
      }
    }
    this.buckets.clear();
  }

  private getBucket(key: number): any[] {
    let b = this.buckets.get(key);
    if (!b) {
      b = this.arrayPool.pop() || [];
      this.buckets.set(key, b);
    }
    return b;
  }

  insert(entity: any, x: number, y: number) {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    const key = this.hash(gx, gy);
    this.getBucket(key).push(entity);
  }

  /**
   * Insert an entity with a radius, adding it to all overlapping spatial cells.
   */
  insertWithRadius(entity: any, x: number, y: number, radius: number) {
    const minGx = Math.floor((x - radius) / this.cellSize);
    const maxGx = Math.floor((x + radius) / this.cellSize);
    const minGy = Math.floor((y - radius) / this.cellSize);
    const maxGy = Math.floor((y + radius) / this.cellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = this.hash(gx, gy);
        this.getBucket(key).push(entity);
      }
    }
  }

  /**
   * Query entities in cells around (x, y) within radius.
   * Invokes callback(entity) for candidates.
   */
  queryCircle(x: number, y: number, radius: number, callback: (entity: any) => boolean | void) {
    const minGx = Math.floor((x - radius) / this.cellSize);
    const maxGx = Math.floor((x + radius) / this.cellSize);
    const minGy = Math.floor((y - radius) / this.cellSize);
    const maxGy = Math.floor((y + radius) / this.cellSize);

    const radiusSq = radius * radius;

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = this.hash(gx, gy);
        const cell = this.buckets.get(key);
        if (!cell) continue;

        for (let i = 0; i < cell.length; i++) {
          const ent = cell[i];
          const ePos = ent.getWorldPos ? ent.getWorldPos() : ent.pos;
          if (!ePos) continue;
          const dx = x - ePos.x;
          const dy = y - ePos.y;
          if (dx * dx + dy * dy <= radiusSq) {
            const stop = callback(ent);
            if (stop === true) return;
          }
        }
      }
    }
  }

  /**
   * Fast query for enemies only with a check on radius / bounding circle.
   */
  queryCircleEnemies(x: number, y: number, radius: number, callback: (enemy: any) => boolean | void) {
    const minGx = Math.floor((x - radius) / this.cellSize);
    const maxGx = Math.floor((x + radius) / this.cellSize);
    const minGy = Math.floor((y - radius) / this.cellSize);
    const maxGy = Math.floor((y + radius) / this.cellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = this.hash(gx, gy);
        const cell = this.buckets.get(key);
        if (!cell) continue;

        for (let i = 0; i < cell.length; i++) {
          const ent = cell[i];
          if (!(ent instanceof Enemy) || ent.health <= 0 || ent.isDying) continue;
          const dx = x - ent.pos.x;
          const dy = y - ent.pos.y;
          const hitRadius = (ent.size / 2) + radius;
          if (dx * dx + dy * dy <= hitRadius * hitRadius) {
            const stop = callback(ent);
            if (stop === true) return;
          }
        }
      }
    }
  }

  /**
   * Iterate over raw cells within a neighborhood (e.g. 1 cell radius around gx, gy).
   */
  forEachNeighborCell(x: number, y: number, cellRadius: number, callback: (cell: any[]) => boolean | void) {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    for (let i = -cellRadius; i <= cellRadius; i++) {
      for (let j = -cellRadius; j <= cellRadius; j++) {
        const cell = this.buckets.get(this.hash(gx + i, gy + j));
        if (cell && cell.length > 0) {
          const stop = callback(cell);
          if (stop === true) return;
        }
      }
    }
  }

  /**
   * Direct access to raw cell contents for backward compatibility.
   */
  getCellByGrid(gx: number, gy: number): any[] | undefined {
    return this.buckets.get(this.hash(gx, gy));
  }

  getCellByWorld(x: number, y: number): any[] | undefined {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    return this.buckets.get(this.hash(gx, gy));
  }
}

export const spatialGrid = new SpatialHashGrid(64);
