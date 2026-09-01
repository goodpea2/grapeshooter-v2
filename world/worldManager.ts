import { state } from '../state';
import { 
  GRID_SIZE, CHUNK_SIZE, LEVEL_THRESHOLDS, LEVEL_BUDGET, WORLD_GEN_STATS, CHUNK_GEN_RADIUS, VISIBILITY_RADIUS
} from '../constants';
import { obstacleTypes, overlayTypes } from '../balanceObstacles';
import { liquidTypes } from '../balanceLiquids';
import { spawnLootInFlightVFX } from '../vfx/index';
import { releaseLoot } from '../class/loot';
import { spawnFromBudget, getCurrentLevelHourlyBudget } from '../lvDemo';
import { generateRoomDirectorData } from '../debug/roomDirectorGenerator';
import { flowField } from '../pathfinding';
import { drawPayGateBubble } from '../ui/overlay/TurretMergeOverlay';
import { drawSpeechBubble } from '../uiComponents';
import { Block } from './block';
import { Chunk } from './chunk';
import { PayGateGroup, PayGateGroupConfig } from './paygate';

declare const dist: any;
declare const floor: any;
declare const random: any;
declare const constrain: any;
declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const rect: any;
declare const noStroke: any;
declare const ellipse: any;
declare const sin: any;
declare const strokeWeight: any;
declare const textAlign: any;
declare const textSize: any;
declare const textWidth: any;
declare const CENTER: any;
declare const LEFT: any;
declare const TOP: any;
declare const BOTTOM: any;
declare const text: any;
declare const width: any;
declare const height: any;

export class WorldManager {
  chunks: Map<string, Chunk> = new Map();
  obstacleVersion: number = 0;
  private losCache: Map<number, boolean> = new Map();
  private losCacheVersion: number = -1;

  constructor() {
    if (state.roomDirectorChain.length === 0) {
      state.roomDirectorData = generateRoomDirectorData();
      state.roomDirectorChain = state.roomDirectorData.split('-');
    }
  }

  getChunk(cx: number, cy: number) {
    let key = `${cx},${cy}`;
    
    // LRU Management
    const orderIdx = state.chunkAccessOrder.indexOf(key);
    if (orderIdx !== -1) {
      state.chunkAccessOrder.splice(orderIdx, 1);
    }
    state.chunkAccessOrder.push(key);

    if (!this.chunks.has(key)) {
      // Enforce 127 chunk limit
      if (this.chunks.size >= 127) {
        const oldestKey = state.chunkAccessOrder.shift();
        if (oldestKey) {
          this.chunks.delete(oldestKey);
        }
      }

      if (!state.chunkToDirectorIndex.has(key)) {
        state.chunkToDirectorIndex.set(key, state.nextDirectorIndex++);
      }
      const directorIdx = state.chunkToDirectorIndex.get(key);
      const lv = floor(constrain(state.currentChunkLevel, 0, 10));
      const bonusData: any = {};
      const isStart = (cx === 0 && cy === 0);
      const featureKeys = ['sun', 'tnt', 'stray', 'sunflower', 'sniper', 'spawner'];
      for (const fk of featureKeys) {
        const stats = WORLD_GEN_STATS[fk][lv];
        if (isStart || random() < stats.chance) {
          const potKey = `accumulated${fk.charAt(0).toUpperCase() + fk.slice(1)}Pot`;
          const amount = floor(state[potKey]);
          bonusData[fk] = amount;
          state[potKey] -= amount;
        } else { bonusData[fk] = 0; }
      }
      this.chunks.set(key, new Chunk(cx, cy, directorIdx, bonusData));
      this.dirtyChunkAndNeighbors(cx, cy);
    }
    return this.chunks.get(key);
  }

  regenerateChunkAt(x: number, y: number) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE);
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    this.chunks.delete(`${cx},${cy}`);
    this.getChunk(cx, cy);
  }

  dirtyBlock(gx: number, gy: number) {
    this.obstacleVersion++;
    if (this.losCache.size > 0) this.losCache.clear();
    flowField.markDirty();
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    
    // Always mark the chunk containing this block
    const homeChunk = this.chunks.get(`${cx},${cy}`);
    if (homeChunk) {
      homeChunk.needsRedraw = true;
      homeChunk.rebuildOverlayList();
    }

    // Only neighbor chunks sharing the perimeter boundary junction need redraw
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const touchLeft = lx === 0;
    const touchRight = lx === CHUNK_SIZE - 1;
    const touchTop = ly === 0;
    const touchBottom = ly === CHUNK_SIZE - 1;

    if (touchLeft) {
      const c = this.chunks.get(`${cx - 1},${cy}`);
      if (c) c.needsRedraw = true;
    }
    if (touchRight) {
      const c = this.chunks.get(`${cx + 1},${cy}`);
      if (c) c.needsRedraw = true;
    }
    if (touchTop) {
      const c = this.chunks.get(`${cx},${cy - 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchBottom) {
      const c = this.chunks.get(`${cx},${cy + 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchLeft && touchTop) {
      const c = this.chunks.get(`${cx - 1},${cy - 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchLeft && touchBottom) {
      const c = this.chunks.get(`${cx - 1},${cy + 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchRight && touchTop) {
      const c = this.chunks.get(`${cx + 1},${cy - 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchRight && touchBottom) {
      const c = this.chunks.get(`${cx + 1},${cy + 1}`);
      if (c) c.needsRedraw = true;
    }
  }

  payGateGroupsDirty: boolean = true;

  markPayGateGroupsDirty() {
    this.payGateGroupsDirty = true;
  }

  dirtyChunkAndNeighbors(cx: number, cy: number) {
    this.markPayGateGroupsDirty();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const chunk = this.chunks.get(`${cx + dx},${cy + dy}`);
        if (chunk) {
          chunk.needsRedraw = true;
          if (dx === 0 && dy === 0) {
            chunk.rebuildOverlayList();
          }
        }
      }
    }
  }

  display(playerPos: any) {
    const vp = state.viewportBounds;
    const chunkW = CHUNK_SIZE * GRID_SIZE;
    const isLevelEditor = state.currentScreen === 'level_editor';
    const visLimit = (VISIBILITY_RADIUS + 1) * GRID_SIZE;

    const minVisX = (!isLevelEditor && playerPos) ? playerPos.x - visLimit : -Infinity;
    const maxVisX = (!isLevelEditor && playerPos) ? playerPos.x + visLimit : Infinity;
    const minVisY = (!isLevelEditor && playerPos) ? playerPos.y - visLimit : -Infinity;
    const maxVisY = (!isLevelEditor && playerPos) ? playerPos.y + visLimit : Infinity;

    this.chunks.forEach(chunk => {
      const cMinX = chunk.cx * chunkW;
      const cMaxX = cMinX + chunkW;
      const cMinY = chunk.cy * chunkW;
      const cMaxY = cMinY + chunkW;

      // Viewport frustum culling check
      if (vp && vp.maxX !== undefined) {
        if (cMaxX < vp.minX || cMinX > vp.maxX || cMaxY < vp.minY || cMinY > vp.maxY) {
          return;
        }
      }

      // Visibility fog radius culling check (anything outside fog is completely black)
      if (cMaxX < minVisX || cMinX > maxVisX || cMaxY < minVisY || cMinY > maxVisY) {
        return;
      }

      state.activeChunkKeys.add(`${chunk.cx},${chunk.cy}`);
      chunk.display(playerPos); 
    });
  }

  setBlock(gx: number, gy: number, typeKey: string | null) {
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    if (!chunk) return;
    const existing = chunk.blockMap.get(`${gx},${gy}`);
    if (existing && existing.type === 'o_paygate') {
      this.markPayGateGroupsDirty();
    }
    if (typeKey === 'o_paygate') {
      this.markPayGateGroupsDirty();
    }
    if (typeKey === null) {
      const b = chunk.blockMap.get(`${gx},${gy}`);
      if (b) {
        if (b.type === 'o_paygate') this.markPayGateGroupsDirty();
        b.isMined = true;
      }
    } else {
      let b = chunk.blockMap.get(`${gx},${gy}`);
      if (!b) {
        b = new Block(gx, gy, typeKey);
        chunk.blocks.push(b);
        chunk.blockMap.set(`${gx},${gy}`, b);
      } else {
        b.isMined = false;
        b.type = typeKey;
        b.config = obstacleTypes[typeKey];
        b.health = b.config.health;
        b.maxHealth = b.health;
      }
    }
    this.dirtyBlock(gx, gy);
  }

  takeDamage(gx: number, gy: number, dmg: number, source?: any) {
    const b = this.getBlock(gx, gy);
    if (b) {
      return b.takeDamage(dmg, source);
    }
    return false;
  }

  update(playerPos: any) {
    let pcx = floor(playerPos.x / (GRID_SIZE * CHUNK_SIZE)); let pcy = floor(playerPos.y / (GRID_SIZE * CHUNK_SIZE));
    const exploredKey = `${pcx},${pcy}`;
    const currentChunk = this.getChunk(pcx, pcy);
    if (currentChunk && currentChunk.roomEnemyBudget > 0 && !currentChunk.isRoomBudgetTriggered) {
      spawnFromBudget(currentChunk.roomEnemyBudget);
      currentChunk.isRoomBudgetTriggered = true;
    }
    if (!state.exploredChunks.has(exploredKey)) { 
      state.exploredChunks.add(exploredKey); 
      const lv = floor(constrain(state.currentChunkLevel, 0, 10)); 
      state.accumulatedSunPot += WORLD_GEN_STATS.sun[lv].value;
      state.accumulatedTntPot += WORLD_GEN_STATS.tnt[lv].value;
      state.accumulatedStrayPot += WORLD_GEN_STATS.stray[lv].value;
      state.accumulatedSunflowerPot += WORLD_GEN_STATS.sunflower[lv].value;
      state.accumulatedSniperPot += WORLD_GEN_STATS.sniper[lv].value;
      state.accumulatedSpawnerPot += WORLD_GEN_STATS.spawner[lv].value;
      this.updateLevel(); 
    }
    for (let x = -CHUNK_GEN_RADIUS; x <= CHUNK_GEN_RADIUS; x++) for (let y = -CHUNK_GEN_RADIUS; y <= CHUNK_GEN_RADIUS; y++) this.getChunk(pcx + x, pcy + y);

    // Update world turrets in loaded and active building chunks
    state.activeChunkKeys.clear();
    const activeRadiusSq = (GRID_SIZE * CHUNK_SIZE * 2.5) ** 2;

    this.chunks.forEach(chunk => {
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW + chunkW/2;
      const cY = chunk.cy * chunkW + chunkW/2;
      const dx = cX - playerPos.x;
      const dy = cY - playerPos.y;
      const dSq = dx*dx + dy*dy;

      const isNearPlayer = dSq < activeRadiusSq;
      const hasActiveTurrets = chunk.turrets.length > 0;
      const hasActiveOverlays = chunk.overlayBlocks && chunk.overlayBlocks.some((b: any) => !b.isMined && (b.overlay === 'sunGenerator' || b.overlay?.startsWith('spawner') || b.overlay === 'ov_spawner' || b.overlay === 'catalyst_clay'));

      if (isNearPlayer || hasActiveTurrets || hasActiveOverlays) {
        state.activeChunkKeys.add(`${chunk.cx},${chunk.cy}`);
        
        // Update turrets in this active chunk
        for (let i = chunk.turrets.length - 1; i >= 0; i--) {
          chunk.turrets[i].update();
        }

        // Actively tick overlay blocks (e.g. sun generators, spawners, catalysts) in active chunks
        if (chunk.overlayBlocks) {
          for (let b of chunk.overlayBlocks) {
            if (!b.isMined) {
              b.update();
            }
          }
        }

        // Update loot (for player collection when near, while off-screen loots remain persistently in memory)
        const lootArr = chunk.loot;
        for (let i = lootArr.length - 1; i >= 0; i--) {
          const l = lootArr[i];
          const res = l.update(playerPos);
          if (res === 'collected') {
            const last = lootArr.pop()!;
            if (i < lootArr.length) {
              lootArr[i] = last;
            }
            const screenPos = {
              x: l.pos.x - (state.cameraPos.x - width/2),
              y: l.pos.y - (state.cameraPos.y - height/2)
            };
            
            // Determine UI target position
            let tx = 50, ty = 50;
            if (l.config.item === 'sun') { tx = 40; ty = 40; }
            else if (l.config.item === 'elixir') { tx = 40; ty = 80; }
            else if (l.config.item === 'soil') { tx = 40; ty = 120; }
            else if (l.config.item === 'raisin') {
              const btnMargin = 10;
              const almanacBtnSize = 80;
              tx = width - btnMargin - almanacBtnSize / 2;
              ty = height - btnMargin - almanacBtnSize / 2;
            }
            else if (l.config.type === 'turret' || l.config.type === 'item' || l.config.type === 'turretAsItem') {
              tx = width - 50; ty = height - 50;
            }

            state.uiVfx.push(spawnLootInFlightVFX(
              screenPos.x, screenPos.y, 
              tx, ty, 
              l.config.idleAssetImg, 
              l.renderSize, 
              l.config.itemValue || 1, 
              l.config.item, 
              l.config.type,
              (l as any).turretHP, // Pass HP if it's a TurretLoot
              (l as any).turretData // Pass preserved turret state/arming progress
            ));

            releaseLoot(l);
          } else if (res === 'missed' || res === 'consumed') {
            const last = lootArr.pop()!;
            if (i < lootArr.length) {
              lootArr[i] = last;
            }
            if (res === 'missed' && l.config.item === 'sun') {
              state.sunMissedTotal += l.config.itemValue || 1;
            }
            releaseLoot(l);
          }
        }
      }
    });
  }

  addTurret(turret: any) {
    const cx = floor(turret.gx / CHUNK_SIZE);
    const cy = floor(turret.gy / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    if (chunk) {
      // Avoid duplicates at the same position
      chunk.turrets = chunk.turrets.filter(t => t.gx !== turret.gx || t.gy !== turret.gy);
      chunk.turrets.push(turret);
    }
  }

  removeTurret(gx: number, gy: number) {
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    const chunk = this.chunks.get(`${cx},${cy}`);
    if (chunk) {
      chunk.turrets = chunk.turrets.filter(t => t.gx !== gx || t.gy !== gy);
    }
  }

  getAllTurrets() {
    const all: any[] = [];
    this.chunks.forEach(chunk => {
      all.push(...chunk.turrets);
    });
    return all;
  }

  getTurretAt(gx: number, gy: number) {
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    const chunk = this.chunks.get(`${cx},${cy}`);
    if (chunk) {
      return chunk.turrets.find(t => t.gx === gx && t.gy === gy);
    }
    return null;
  }

  updateLevel() {
    let count = state.exploredChunks.size; state.currentChunkLevel = 0;
    for (let i=0; i<LEVEL_THRESHOLDS.length; i++) { if (count >= LEVEL_THRESHOLDS[i]) state.currentChunkLevel = i + 1; else break; }
    const lv = floor(constrain(state.currentChunkLevel, 0, 10)); state.currentNightWaveBudget = Math.max(state.currentNightWaveBudget, LEVEL_BUDGET[lv]);
  }

  checkLOS(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return true;

    let gx = floor(x1 / GRID_SIZE);
    let gy = floor(y1 / GRID_SIZE);
    const targetGx = floor(x2 / GRID_SIZE);
    const targetGy = floor(y2 / GRID_SIZE);

    if (gx === targetGx && gy === targetGy) return true;

    // Check versioned LOS cache
    if (this.losCacheVersion !== this.obstacleVersion) {
      this.losCache.clear();
      this.losCacheVersion = this.obstacleVersion;
    }

    const k1 = ((gx + 2048) & 4095) | (((gy + 2048) & 4095) << 12);
    const k2 = ((targetGx + 2048) & 4095) | (((targetGy + 2048) & 4095) << 12);
    const cacheKey = k1 * 16777216 + k2;
    const cached = this.losCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const stepX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    const stepY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);

    const tDeltaX = dx !== 0 ? Math.abs(GRID_SIZE / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(GRID_SIZE / dy) : Infinity;

    let tMaxX = dx > 0 ? ((gx + 1) * GRID_SIZE - x1) / dx : (dx < 0 ? (gx * GRID_SIZE - x1) / dx : Infinity);
    let tMaxY = dy > 0 ? ((gy + 1) * GRID_SIZE - y1) / dy : (dy < 0 ? (gy * GRID_SIZE - y1) / dy : Infinity);

    let safety = 0;
    while ((gx !== targetGx || gy !== targetGy) && safety++ < 200) {
      let prevGx = gx;
      let prevGy = gy;

      if (Math.abs(tMaxX - tMaxY) < 1e-6) {
        // Hitting exact corner: step both X and Y
        tMaxX += tDeltaX;
        tMaxY += tDeltaY;
        gx += stepX;
        gy += stepY;

        // Diagonal passage check: if either corner neighbor is solid, LOS is blocked
        if (this.isBlockAtTile(gx, prevGy) || this.isBlockAtTile(prevGx, gy)) {
          if (this.losCache.size < 4000) this.losCache.set(cacheKey, false);
          return false;
        }
      } else if (tMaxX < tMaxY) {
        tMaxX += tDeltaX;
        gx += stepX;
      } else {
        tMaxY += tDeltaY;
        gy += stepY;
      }

      // Check current cell if not destination
      if (gx !== targetGx || gy !== targetGy) {
        if (this.isBlockAtTile(gx, gy)) {
          if (this.losCache.size < 4000) this.losCache.set(cacheKey, false);
          return false;
        }
      }

      // Check diagonal gap penetration: if ray crossed diagonally between two diagonal blocks
      if (gx !== prevGx && gy !== prevGy) {
        if (this.isBlockAtTile(gx, prevGy) && this.isBlockAtTile(prevGx, gy)) {
          if (this.losCache.size < 4000) this.losCache.set(cacheKey, false);
          return false;
        }
      }
    }

    if (this.losCache.size < 4000) this.losCache.set(cacheKey, true);
    return true;
  }

  isBlockAtTile(gx: number, gy: number): boolean {
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    const chunk = this.chunks.get(`${cx},${cy}`);
    if (!chunk) return false;
    const b = chunk.blockMap.get(`${gx},${gy}`);
    return !!(b && !b.isMined && (b.config.blocksLOS !== false));
  }

  payGateGroups: PayGateGroup[] = [];
  blockToPayGateGroup: Map<string, PayGateGroup> = new Map();

  getPayGateGroup(block: Block): PayGateGroup | null {
    if (!block || block.type !== 'o_paygate') return null;
    const key = `${block.gx},${block.gy}`;
    let grp: PayGateGroup | null = this.blockToPayGateGroup.get(key) || null;
    if (!grp || this.payGateGroupsDirty) {
      this.rebuildPayGateGroups();
      grp = this.blockToPayGateGroup.get(key) || null;
    }
    return grp;
  }

  rebuildPayGateGroups() {
    this.payGateGroupsDirty = false;
    this.payGateGroups = [];
    this.blockToPayGateGroup.clear();

    const allPayBlocks: Block[] = [];
    this.chunks.forEach(chunk => {
      for (const b of chunk.blocks) {
        if (b.type === 'o_paygate' && !b.isMined) {
          allPayBlocks.push(b);
        }
      }
    });

    if (allPayBlocks.length === 0) return;

    const map = new Map<string, Block>();
    for (const b of allPayBlocks) {
      map.set(`${b.gx},${b.gy}`, b);
    }

    const visited = new Set<string>();
    let groupIndex = 0;

    for (const b of allPayBlocks) {
      const key = `${b.gx},${b.gy}`;
      if (visited.has(key)) continue;

      const cluster: Block[] = [];
      const queue: Block[] = [b];
      visited.add(key);

      let sharedConfig: any = null;

      while (queue.length > 0) {
        const curr = queue.shift()!;
        cluster.push(curr);
        if (!sharedConfig && curr.paygateConfig) {
          sharedConfig = { ...curr.paygateConfig };
        }

        // Check 8-way neighbors for interconnecting blocks
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nKey = `${curr.gx + dx},${curr.gy + dy}`;
            if (!visited.has(nKey) && map.has(nKey)) {
              visited.add(nKey);
              queue.push(map.get(nKey)!);
            }
          }
        }
      }

      const group = new PayGateGroup(`paygate_group_${groupIndex++}`, sharedConfig || { resource: 'soil', amount: 10, spent: 0 });
      group.blocks = cluster;
      group.updateCenter();

      for (const member of cluster) {
        member.paygateConfig = {
          resource: group.config.resource,
          amount: group.config.amount,
          spent: group.config.spent
        };
        this.blockToPayGateGroup.set(`${member.gx},${member.gy}`, group);
      }

      this.payGateGroups.push(group);
    }
  }

  getPayGateGroupByWorldPos(wx: number, wy: number): PayGateGroup | null {
    if (this.payGateGroupsDirty || !this.payGateGroups || this.payGateGroups.length === 0) {
      this.rebuildPayGateGroups();
    }
    if (!this.payGateGroups || this.payGateGroups.length === 0) return null;

    for (const grp of this.payGateGroups) {
      const remaining = grp.getRemainingCost();
      if (remaining <= 0) continue;
      const unminedBlocks = grp.blocks.filter(b => !b.isMined);
      if (unminedBlocks.length === 0) continue;

      const costText = `${remaining}`;
      textSize(14);
      const tw = textWidth(costText);
      const bubbleW = Math.max(42, 16 + 4 + tw + 16);
      const bubbleH = 24;
      const bubbleCenterX = grp.centerPos.x;
      const bubbleCenterY = grp.centerPos.y - 20;

      if (
        wx >= bubbleCenterX - bubbleW / 2 &&
        wx <= bubbleCenterX + bubbleW / 2 &&
        wy >= bubbleCenterY - bubbleH / 2 &&
        wy <= bubbleCenterY + bubbleH / 2 + 8
      ) {
        return grp;
      }
    }
    return null;
  }

  drawPayGateCostBubbles(playerPos?: any, isEditorMode: boolean = false, hoveredGroup?: PayGateGroup | null) {
    if (this.payGateGroupsDirty || !this.payGateGroups || this.payGateGroups.length === 0) {
      this.rebuildPayGateGroups();
    }
    if (!this.payGateGroups || this.payGateGroups.length === 0) return;

    const pX = playerPos?.x ?? state.player?.pos?.x ?? 0;
    const pY = playerPos?.y ?? state.player?.pos?.y ?? 0;

    for (const grp of this.payGateGroups) {
      const remaining = grp.getRemainingCost();
      if (remaining <= 0) continue;
      const unminedBlocks = grp.blocks.filter(b => !b.isMined);
      if (unminedBlocks.length === 0) continue;

      const isHovered = hoveredGroup === grp;
      if (isEditorMode) {
        drawPayGateBubble(grp.centerPos.x, grp.centerPos.y, grp.config.resource, remaining, true, 255, isHovered);
      } else {
        const d = dist(pX, pY, grp.centerPos.x, grp.centerPos.y);
        if (d < 220) {
          const resKey = grp.config.resource;
          const curAmount = (state as any)[`${resKey}Currency`] || 0;
          const canAfford = curAmount > 0;
          drawPayGateBubble(grp.centerPos.x, grp.centerPos.y, resKey, remaining, canAfford, 255, false);
        }
      }
    }
  }

  isPayGateAtTile(gx: number, gy: number): boolean {
    const b = this.getBlock(gx, gy);
    return !!(b && !b.isMined && (b.type === 'o_paygate' || !!b.paygateConfig));
  }

  hasPayGateObstruction(x1: number, y1: number, x2: number, y2: number): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return false;

    let gx = floor(x1 / GRID_SIZE);
    let gy = floor(y1 / GRID_SIZE);
    const targetGx = floor(x2 / GRID_SIZE);
    const targetGy = floor(y2 / GRID_SIZE);

    if (this.isPayGateAtTile(gx, gy) || this.isPayGateAtTile(targetGx, targetGy)) {
      return true;
    }
    if (gx === targetGx && gy === targetGy) return false;

    const stepX = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
    const stepY = dy > 0 ? 1 : (dy < 0 ? -1 : 0);

    const tDeltaX = dx !== 0 ? Math.abs(GRID_SIZE / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(GRID_SIZE / dy) : Infinity;

    let tMaxX = dx > 0 ? ((gx + 1) * GRID_SIZE - x1) / dx : (dx < 0 ? (gx * GRID_SIZE - x1) / dx : Infinity);
    let tMaxY = dy > 0 ? ((gy + 1) * GRID_SIZE - y1) / dy : (dy < 0 ? (gy * GRID_SIZE - y1) / dy : Infinity);

    let safety = 0;
    while ((gx !== targetGx || gy !== targetGy) && safety++ < 200) {
      let prevGx = gx;
      let prevGy = gy;

      if (Math.abs(tMaxX - tMaxY) < 1e-6) {
        tMaxX += tDeltaX;
        tMaxY += tDeltaY;
        gx += stepX;
        gy += stepY;
        if (this.isPayGateAtTile(gx, prevGy) || this.isPayGateAtTile(prevGx, gy)) {
          return true;
        }
      } else if (tMaxX < tMaxY) {
        tMaxX += tDeltaX;
        gx += stepX;
      } else {
        tMaxY += tDeltaY;
        gy += stepY;
      }

      if (this.isPayGateAtTile(gx, gy)) {
        return true;
      }

      if (gx !== prevGx && gy !== prevGy) {
        if (this.isPayGateAtTile(gx, prevGy) || this.isPayGateAtTile(prevGx, gy)) {
          return true;
        }
      }
    }

    return false;
  }

  drawSpawnerEnemyGizmos(mWorldX: number, mWorldY: number) {
    const mgx = floor(mWorldX / GRID_SIZE);
    const mgy = floor(mWorldY / GRID_SIZE);
    const b = this.getBlock(mgx, mgy);
    if (!b) return;

    const isLiquid = b.liquidType === 'l_spawner' || b.liquidType?.startsWith('l_spawner') || !!liquidTypes[b.liquidType || '']?.isEnemySpawner || !!liquidTypes[b.liquidType || '']?.enemySpawnConfig;
    const isOverlay = !b.isMined && (b.overlay?.startsWith('ov_spawner') || !!overlayTypes[b.overlay || '']?.isEnemySpawner || !!overlayTypes[b.overlay || '']?.enemySpawnConfig);
    
    if (!isLiquid && !isOverlay && !b.customSpawnerConfig) return;

    const oCfg = (isLiquid ? liquidTypes[b.liquidType || ''] : overlayTypes[b.overlay || '']) || {};
    const sCfg = b.customSpawnerConfig ? { ...oCfg.enemySpawnConfig, ...b.customSpawnerConfig } : oCfg.enemySpawnConfig;
    if (!sCfg) return;

    const bcx = b.pos.x + GRID_SIZE / 2;
    const bcy = b.pos.y + GRID_SIZE / 2;

    push();
    // 1. Draw Trigger Range circle
    const trigRad = sCfg.spawnTriggerRadius > 0 ? sCfg.spawnTriggerRadius : (sCfg.spawnTriggerRadius === 0 ? 0 : 200);
    if (sCfg.spawnTriggerRadius >= 0 && trigRad > 0) {
      noFill();
      stroke(255, 200, 50, 160);
      strokeWeight(2);
      ellipse(bcx, bcy, trigRad * 2, trigRad * 2);
      noStroke();
      fill(255, 220, 80, 220);
      textAlign(CENTER, BOTTOM);
      textSize(10);
      text(`Trigger Range: ${trigRad}px`, bcx, bcy - trigRad - 4);
    }

    // 2. Draw Spawn Radius circle
    const spawnRad = sCfg.spawnRadius || 120;
    noFill();
    stroke(255, 60, 100, 180);
    strokeWeight(2);
    ellipse(bcx, bcy, spawnRad * 2, spawnRad * 2);
    noStroke();
    fill(255, 80, 120, 220);
    textAlign(CENTER, TOP);
    textSize(10);
    text(`Spawn Radius: ${spawnRad}px`, bcx, bcy + spawnRad + 4);

    // 3. Stats Tooltip Card
    const isHourly = !!sCfg.hourlySpawnConfig?.enabled;
    const tipW = 160;
    const tipH = isHourly ? 115 : 95;
    const tx = bcx + 15;
    const ty = bcy - 70;

    fill(0, 220);
    stroke(255, 100);
    rect(tx, ty, tipW, tipH, 4);

    noStroke();
    fill(255);
    textSize(10);
    textAlign(LEFT, TOP);

    const spName = b.customSpawnerConfig?.name || oCfg.name || (isLiquid ? 'Ground Spawner' : 'Overlay Spawner');
    let info = `Type: ${spName}\n`;
    if (isHourly) {
      const hCfg = sCfg.hourlySpawnConfig;
      const currentHourly = getCurrentLevelHourlyBudget();
      const mult = hCfg.hourlyBudgetMultiplier !== undefined ? hCfg.hourlyBudgetMultiplier : 1.0;
      const add = hCfg.hourlyBudgetAdd || 0;
      const rate = currentHourly * mult + add;
      info += `Hourly Rate: ${rate.toFixed(1)}/hr (base: ${currentHourly})\n`;
      info += `Accrued: ${(b.hourlySpawnBudgetAccrued || 0).toFixed(1)}\n`;
      info += `Spawned: ${b.totalBudgetSpawned || 0} / ${hCfg.selfDestructAfterBudgetSpawned || '∞'}\n`;
    } else {
      info += `Budget: ${b.spawnerBudget !== undefined ? b.spawnerBudget : (sCfg.budget ?? 60)}\n`;
    }
    info += `Interval: ${sCfg.spawnInterval || 60}f (min)\n`;
    info += `Trigger: ${sCfg.spawnTriggerRadius >= 0 ? `${sCfg.spawnTriggerRadius}px` : 'Global'}\n`;
    info += `Spawn Rad: ${spawnRad}px\n`;
    const eTypes = sCfg.enemyTypeKey || ['e_basic'];
    info += `Enemies: ${eTypes.map((k: string) => k.replace('e_', '')).join(', ')}`;

    text(info, tx + 6, ty + 6);
    pop();
  }

  drawSunGeneratorHoverBubbles(mWorldX: number, mWorldY: number) {
    const mgx = floor(mWorldX / GRID_SIZE);
    const mgy = floor(mWorldY / GRID_SIZE);
    const blk = this.getBlock(mgx, mgy);
    if (blk && !blk.isMined && blk.overlay === 'sunGenerator') {
      const cfg = blk.sunGeneratorConfig || { damagePerSun: 600, maxSun: 100, accumulatedDamage: 0, sunsDropped: 0 };
      const left = Math.max(0, cfg.maxSun - cfg.sunsDropped);
      const textLabel = `${left} left`;
      
      const bcx = blk.pos.x + GRID_SIZE / 2;
      const bcy = blk.pos.y - 12;

      drawSpeechBubble(bcx, bcy, 76, 24, textLabel, {
        icon: state.assets['img_icon_sun'],
        iconSize: 16,
        fontSize: 11,
        radius: 8,
        tailDirection: 'bottom',
        tailSize: 6,
        bgColor: [15, 18, 35, 230],
        textColor: [255, 240, 180, 255]
      });
    }
  }

  getNearestBlock(pos: any, range: number) {
    let nearest = null; let minDistSq = range*range;
    const viewportMargin = range + 200;
    this.chunks.forEach(chunk => {
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW; const cY = chunk.cy * chunkW;
      const dx = (cX + chunkW/2) - pos.x; const dy = (cY + chunkW/2) - pos.y;
      if (dx*dx + dy*dy > (viewportMargin + chunkW)**2) return;
      for (let b of chunk.blocks) { 
        if (b.isMined) continue; 
        let bX = b.pos.x + GRID_SIZE/2; let bY = b.pos.y + GRID_SIZE/2; 
        let dSq = (pos.x - bX)**2 + (pos.y - bY)**2;
        if (dSq < minDistSq && this.checkLOS(pos.x, pos.y, bX, bY)) { minDistSq = dSq; nearest = b; } 
      }
    });
    return nearest;
  }

  getBlock(gx: number, gy: number) {
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return null;
    return chunk.blockMap.get(`${gx},${gy}`);
  }

  isTileDangerous(x: number, y: number): boolean {
    const gx = floor(x / GRID_SIZE);
    const gy = floor(y / GRID_SIZE);
    const block = this.getBlock(gx, gy);

    if (block) {
      if (block.overlay && overlayTypes[block.overlay]?.isDanger) return true;
      if (block.liquidType && liquidTypes[block.liquidType]?.isDanger) return true;
    }
    return false;
  }

  isBlockAt(x: number, y: number) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE); let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return false;
    const b = chunk.blockMap.get(`${gx},${gy}`);
    return b && !b.isMined && (b.config.blocksLOS !== false);
  }

  canConnectTo(x: number, y: number, myConfig: any) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE); let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return false;
    const b = chunk.blockMap.get(`${gx},${gy}`);
    if (!b || b.isMined) return false;
    if (myConfig.connectToOtherBlock === false || b.config.connectToOtherBlock === false) return false;
    return true;
  }

  getLiquidAt(gx: number, gy: number) {
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE); let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return null;
    const b = chunk.blockMap.get(`${gx},${gy}`); return b ? b.liquidType : null;
  }

  checkCollision(x: number, y: number, radius: number) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE);
    const searchRange = radius > GRID_SIZE ? 2 : 1;
    for (let i = gx - searchRange; i <= gx + searchRange; i++) {
      for (let j = gy - searchRange; j <= gy + searchRange; j++) {
        let cx = floor(i / CHUNK_SIZE); let cy = floor(j / CHUNK_SIZE);
        let chunk = this.chunks.get(`${cx},${cy}`);
        if (chunk) { 
          const b = chunk.blockMap.get(`${i},${j}`); 
          if (b && !b.isMined) {
            const sizeMult = b.config.sizeMultiplier || 1.0;
            const renderSize = GRID_SIZE * sizeMult;
            const offset = (GRID_SIZE - renderSize) / 2;
            
            // Constrain point to actual visual bounds of the block
            let cX = constrain(x, b.pos.x + offset, b.pos.x + offset + renderSize); 
            let cY = constrain(y, b.pos.y + offset, b.pos.y + offset + renderSize); 
            if ((x - cX)**2 + (y - cY)**2 < radius*radius) return true; 
          } 
        }
      }
    }
    for (const gf of state.groundFeatures) {
       if (gf.typeKey === 'gf_forcefield') {
          const dSq = (x - gf.pos.x)**2 + (y - gf.pos.y)**2;
          const rSum = radius + gf.config.radius;
          if (dSq < rSum * rSum) return true;
       }
    }
    return false;
  }

  spawnAreaSet: Set<string> = new Set();

  hasSpawnArea(): boolean {
    return !!(this.spawnAreaSet && this.spawnAreaSet.size > 0);
  }

  isSpawnAreaAt(x: number, y: number): boolean {
    if (!this.spawnAreaSet || this.spawnAreaSet.size === 0) return true;
    const gx = floor(x / GRID_SIZE);
    const gy = floor(y / GRID_SIZE);
    return this.spawnAreaSet.has(`${gx},${gy}`);
  }

  isSpawnAreaTile(gx: number, gy: number): boolean {
    return this.spawnAreaSet ? this.spawnAreaSet.has(`${gx},${gy}`) : false;
  }

  setSpawnAreaTile(gx: number, gy: number, isArea: boolean) {
    if (!this.spawnAreaSet) this.spawnAreaSet = new Set();
    const key = `${gx},${gy}`;
    if (isArea) {
      this.spawnAreaSet.add(key);
    } else {
      this.spawnAreaSet.delete(key);
    }
  }

  getRandomSpawnAreaPos(): { x: number, y: number } | null {
    if (!this.spawnAreaSet || this.spawnAreaSet.size === 0) return null;
    const arr = Array.from(this.spawnAreaSet);
    const picked = arr[floor(random(arr.length))];
    const [gx, gy] = picked.split(',').map(Number);
    return {
      x: gx * GRID_SIZE + random(4, GRID_SIZE - 4),
      y: gy * GRID_SIZE + random(4, GRID_SIZE - 4)
    };
  }
}
