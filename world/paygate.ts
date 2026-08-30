import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { BlockHitVFX, BlockDebris, PayGateFlyVFX } from '../vfx/index';
import type { Block } from './block';
import type { WorldManager } from './worldManager';

export interface PayGateGroupConfig {
  resource: string;
  amount: number;
  spent: number;
}

export class PayGateGroup {
  id: string;
  blocks: Block[] = [];
  config: PayGateGroupConfig;
  centerPos: { x: number; y: number } = { x: 0, y: 0 };
  lastPayFrame: number = 0;

  constructor(id: string, config?: Partial<PayGateGroupConfig>) {
    this.id = id;
    this.config = {
      resource: config?.resource || 'soil',
      amount: config?.amount !== undefined ? config?.amount : 10,
      spent: config?.spent || 0
    };
  }

  updateCenter() {
    if (this.blocks.length === 0) return;
    let sumX = 0, sumY = 0;
    for (const b of this.blocks) {
      sumX += b.pos.x + GRID_SIZE / 2;
      sumY += b.pos.y + GRID_SIZE / 2;
    }
    this.centerPos = {
      x: sumX / this.blocks.length,
      y: sumY / this.blocks.length
    };
  }

  getRemainingCost(): number {
    return Math.max(0, this.config.amount - this.config.spent);
  }

  payOneResource(world: WorldManager): boolean {
    if (this.getRemainingCost() <= 0) {
      this.breakGroup(world);
      return false;
    }
    const resKey = this.config.resource;
    const currencyProp = `${resKey}Currency` as keyof typeof state;
    const curAmount = (state as any)[currencyProp] || 0;
    if (curAmount <= 0) return false;

    // Deduct 1 currency from player
    (state as any)[currencyProp] = curAmount - 1;
    this.config.spent++;

    // Sync all member blocks and trigger obstacle hit vfx on the whole group
    for (const b of this.blocks) {
      b.paygateConfig = {
        resource: this.config.resource,
        amount: this.config.amount,
        spent: this.config.spent
      };
      if (!b.isMined) {
        b.damageGlow = 1.0;
        state.vfx.push(new BlockHitVFX(b.pos.x + GRID_SIZE / 2, b.pos.y + GRID_SIZE / 2));
      }
    }

    // Spawn PayGateFlyVFX from player to paygate
    const targetBlock = this.blocks[Math.floor(Math.random() * this.blocks.length)];
    const targetX = targetBlock ? targetBlock.pos.x + GRID_SIZE / 2 : this.centerPos.x;
    const targetY = targetBlock ? targetBlock.pos.y + GRID_SIZE / 2 : this.centerPos.y;
    state.vfx.push(new PayGateFlyVFX(
      state.player.pos.x,
      state.player.pos.y,
      targetX,
      targetY,
      resKey
    ));

    // Check if fully paid
    if (this.config.spent >= this.config.amount) {
      this.breakGroup(world);
    }
    return true;
  }

  breakGroup(world: WorldManager) {
    for (const b of this.blocks) {
      if (!b.isMined) {
        b.isMined = true;
        state.vfx.push(new BlockDebris(b.pos.x + GRID_SIZE / 2, b.pos.y + GRID_SIZE / 2, b.config.color || [185, 145, 85]));
        const cx = Math.floor(b.gx / CHUNK_SIZE);
        const cy = Math.floor(b.gy / CHUNK_SIZE);
        world.dirtyChunkAndNeighbors(cx, cy);
      }
    }
  }
}
