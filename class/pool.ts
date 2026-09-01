/**
 * Generic High-Performance Object Pool
 * Eliminates garbage collection spikes during high-frequency gameplay allocations.
 */
export class ObjectPool<T> {
  name: string;
  private pool: T[] = [];
  private factory: () => T;
  private resetFn?: (item: T) => void;
  private maxSize: number;

  // Diagnostics & Metrics
  totalCreated: number = 0;
  totalAcquired: number = 0;
  totalReleased: number = 0;
  peakActive: number = 0;

  constructor(name: string, factory: () => T, resetFn?: (item: T) => void, maxSize: number = 1000) {
    this.name = name;
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    poolRegistry.register(this);
  }

  get(): T {
    this.totalAcquired++;
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      this.totalCreated++;
      item = this.factory();
    }
    (item as any)._pool = this;
    const currentActive = this.activeCount;
    if (currentActive > this.peakActive) {
      this.peakActive = currentActive;
    }
    return item;
  }

  release(item: T): void {
    if (!item) return;
    this.totalReleased++;
    if (this.pool.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(item);
      }
      this.pool.push(item);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }

  resetPeak(): void {
    this.peakActive = this.activeCount;
  }

  get size(): number {
    return this.pool.length;
  }

  get activeCount(): number {
    return Math.max(0, this.totalAcquired - this.totalReleased);
  }

  getStats() {
    return {
      name: this.name,
      inPool: this.pool.length,
      active: this.activeCount,
      peakActive: this.peakActive,
      totalCreated: this.totalCreated,
      totalAcquired: this.totalAcquired,
      totalReleased: this.totalReleased,
      recycleRate: this.totalAcquired > 0 ? ((this.totalReleased / this.totalAcquired) * 100).toFixed(1) + '%' : '0%'
    };
  }
}

class PoolRegistry {
  private pools: ObjectPool<any>[] = [];

  register(pool: ObjectPool<any>): void {
    this.pools.push(pool);
  }

  getAll(): ObjectPool<any>[] {
    return this.pools;
  }

  trimAll(): void {
    for (const p of this.pools) {
      p.clear();
    }
  }

  resetAllPeaks(): void {
    for (const p of this.pools) {
      p.resetPeak();
    }
  }

  getSummary() {
    return this.pools.map(p => p.getStats());
  }
}

export const poolRegistry = new PoolRegistry();
