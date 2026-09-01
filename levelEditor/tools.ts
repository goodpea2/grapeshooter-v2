import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { overlayTypes } from '../balanceObstacles';
import { liquidTypes } from '../balanceLiquids';
import { enemyTypes } from '../balanceEnemies';
import { npcTypes } from '../balanceNPC';
import { lootTypes } from '../balanceLootTable';
import { turretTypes } from '../balanceTurrets';
import { Block } from '../world';
import { GroundFeature, NPCEntity, Enemy, LootEntity, spawnLootEntity } from '../entities';
import { createWorldTurret } from '../class/turret/TurretRegistry';
import { spawnLootAt } from '../economy';

declare const floor: any;
declare const dist: any;

export function isPointInPolygon(px: number, py: number, polygon: { x: number; y: number }[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function fillBucketObstacle(mWorldX: number, mWorldY: number, isRightClick: boolean = false) {
  const gx = floor(mWorldX / GRID_SIZE);
  const gy = floor(mWorldY / GRID_SIZE);
  if (!state.world) return;

  const targetBlock = state.world.getBlock(gx, gy);
  const targetType = (!targetBlock || targetBlock.isMined) ? 'empty' : targetBlock.type;
  const newType = isRightClick ? 'empty' : state.levelEditor.selectedItemKey;

  if (targetType === newType) return;

  const queue: [number, number][] = [[gx, gy]];
  const visited = new Set<string>([`${gx},${gy}`]);
  const maxTiles = 800;
  const minGx = gx - 35, maxGx = gx + 35, minGy = gy - 35, maxGy = gy + 35;
  const dirtyChunks = new Set<string>();

  while (queue.length > 0 && visited.size <= maxTiles) {
    const [curGx, curGy] = queue.shift()!;
    
    if (newType === 'empty') {
      const blk = state.world.getBlock(curGx, curGy);
      if (blk) {
        blk.isMined = true;
        blk.overlay = null;
      }
    } else {
      const blk = state.world.getBlock(curGx, curGy);
      const existingLiquid = blk?.liquidType || null;
      state.world.setBlock(curGx, curGy, newType);
      const updatedBlk = state.world.getBlock(curGx, curGy);
      if (updatedBlk && existingLiquid) {
        updatedBlk.liquidType = existingLiquid;
      }
    }

    const cx = floor(curGx / CHUNK_SIZE);
    const cy = floor(curGy / CHUNK_SIZE);
    dirtyChunks.add(`${cx},${cy}`);

    const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of neighbors) {
      const nx = curGx + dx;
      const ny = curGy + dy;
      const key = `${nx},${ny}`;
      if (nx < minGx || nx > maxGx || ny < minGy || ny > maxGy) continue;
      if (!visited.has(key)) {
        visited.add(key);
        const nBlk = state.world.getBlock(nx, ny);
        const nType = (!nBlk || nBlk.isMined) ? 'empty' : nBlk.type;
        if (nType === targetType) {
          queue.push([nx, ny]);
        }
      }
    }
  }

  for (const chunkKey of dirtyChunks) {
    const [cx, cy] = chunkKey.split(',').map(Number);
    state.world.dirtyChunkAndNeighbors(cx, cy);
  }
}

export function fillBucketLiquid(mWorldX: number, mWorldY: number, isRightClick: boolean = false) {
  const gx = floor(mWorldX / GRID_SIZE);
  const gy = floor(mWorldY / GRID_SIZE);
  if (!state.world) return;

  const targetBlock = state.world.getBlock(gx, gy);
  const targetLiquid = (targetBlock && targetBlock.liquidType) ? targetBlock.liquidType : 'empty';
  const newLiquid = isRightClick ? 'empty' : state.levelEditor.selectedItemKey;

  if (targetLiquid === newLiquid) return;

  const queue: [number, number][] = [[gx, gy]];
  const visited = new Set<string>([`${gx},${gy}`]);
  const maxTiles = 800;
  const minGx = gx - 35, maxGx = gx + 35, minGy = gy - 35, maxGy = gy + 35;
  const dirtyChunks = new Set<string>();

  while (queue.length > 0 && visited.size <= maxTiles) {
    const [curGx, curGy] = queue.shift()!;
    
    let blk = state.world.getBlock(curGx, curGy);
    if (!blk) {
      const cx = floor(curGx / CHUNK_SIZE);
      const cy = floor(curGy / CHUNK_SIZE);
      const chunk = state.world.getChunk(cx, cy);
      blk = new Block(curGx, curGy, 'o_dirt');
      blk.isMined = true;
      chunk.blocks.push(blk);
      chunk.blockMap.set(`${curGx},${curGy}`, blk);
    }

    if (newLiquid === 'empty') {
      blk.liquidType = null;
    } else {
      blk.liquidType = newLiquid;
    }

    const cx = floor(curGx / CHUNK_SIZE);
    const cy = floor(curGy / CHUNK_SIZE);
    dirtyChunks.add(`${cx},${cy}`);

    const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of neighbors) {
      const nx = curGx + dx;
      const ny = curGy + dy;
      const key = `${nx},${ny}`;
      if (nx < minGx || nx > maxGx || ny < minGy || ny > maxGy) continue;
      if (!visited.has(key)) {
        visited.add(key);
        const nBlk = state.world.getBlock(nx, ny);
        const nLiquid = (nBlk && nBlk.liquidType) ? nBlk.liquidType : 'empty';
        if (nLiquid === targetLiquid) {
          queue.push([nx, ny]);
        }
      }
    }
  }

  for (const chunkKey of dirtyChunks) {
    const [cx, cy] = chunkKey.split(',').map(Number);
    state.world.dirtyChunkAndNeighbors(cx, cy);
  }
}

export function placeSelectedItem(mWorldX: number, mWorldY: number) {
  const gx = floor(mWorldX / GRID_SIZE);
  const gy = floor(mWorldY / GRID_SIZE);
  const category = state.levelEditor.activeCategory;
  const key = state.levelEditor.selectedItemKey;

  if (!key || !state.world) return;

  if (category === 'obstacles') {
    state.world.setBlock(gx, gy, key);
  } else if (category === 'overlays') {
    let block = state.world.getBlock(gx, gy);
    if (!block || block.isMined) {
      state.world.setBlock(gx, gy, 'o_dirt');
      block = state.world.getBlock(gx, gy);
    }
    if (block) {
      block.isMined = false;
      block.setOverlay(key);
      if (key === 'ov_textsign' && !block.customText) {
        block.customText = 'Hint';
      }
      const oCfg = overlayTypes[key];
      if (key === 'ov_spawner_custom' || oCfg?.isCustomPrefab || oCfg?.isEnemySpawner) {
        const tip = state.levelEditor.toolbarSpawnerTooltip;
        const activeConfig = (tip && tip.key === key) ? tip.config : (oCfg?.enemySpawnConfig || {});
        const activeName = (tip && tip.key === key) ? tip.name : (oCfg?.name || 'Custom Spawner');
        block.customSpawnerConfig = {
          name: activeName,
          budget: activeConfig.budget !== undefined ? activeConfig.budget : (block.spawnerBudget || 60),
          enemyTypeKey: activeConfig.enemyTypeKey ? [...activeConfig.enemyTypeKey] : ['e_basic'],
          spawnRadius: activeConfig.spawnRadius !== undefined ? activeConfig.spawnRadius : 120,
          spawnTriggerRadius: activeConfig.spawnTriggerRadius !== undefined ? activeConfig.spawnTriggerRadius : 200,
          spawnInterval: activeConfig.spawnInterval !== undefined ? activeConfig.spawnInterval : 60,
          spawnIntervalConsumeBudget: activeConfig.spawnIntervalConsumeBudget !== false,
          health: activeConfig.health || oCfg?.minHealth || block.health || 300
        };
        block.spawnerBudget = block.customSpawnerConfig.budget;
        block.health = block.customSpawnerConfig.health;
        block.maxHealth = block.customSpawnerConfig.health;
      }

      if (key === 'sunGenerator') {
        const tip = state.levelEditor.toolbarSunGeneratorTooltip;
        const sgCfg = overlayTypes['sunGenerator'];
        const dmg = (tip && tip.config?.damagePerSun !== undefined) ? tip.config.damagePerSun : (sgCfg?.damagePerSun ?? 600);
        const maxS = (tip && tip.config?.maxSun !== undefined) ? tip.config.maxSun : (sgCfg?.maxSunDropped ?? 100);
        block.sunGeneratorConfig = {
          damagePerSun: dmg,
          maxSun: maxS,
          accumulatedDamage: 0,
          sunsDropped: 0
        };
      }

      if (oCfg?.catalystConfig || key === 'catalyst_clay') {
        const cCfg = oCfg?.catalystConfig || (overlayTypes['catalyst_clay'] as any)?.catalystConfig;
        const matrix = cCfg?.neighborMatrix || [
          [-1, -1], [0, -1], [1, -1],
          [-1,  0],          [1,  0],
          [-1,  1], [0,  1], [1,  1]
        ];
        const spawnObstacle = cCfg?.obstacleToSpawn || 'o_clay';
        for (const [dx, dy] of matrix) {
          const nx = gx + dx;
          const ny = gy + dy;
          const targetBlk = state.world.getBlock(nx, ny);
          if (!targetBlk || targetBlk.isMined) {
            state.world.setBlock(nx, ny, spawnObstacle);
            const ncx = floor(nx / CHUNK_SIZE);
            const ncy = floor(ny / CHUNK_SIZE);
            state.world.dirtyChunkAndNeighbors(ncx, ncy);
          }
        }
      }

      const cx = floor(gx / CHUNK_SIZE);
      const cy = floor(gy / CHUNK_SIZE);
      state.world.dirtyChunkAndNeighbors(cx, cy);
    }
  } else if (category === 'liquids') {
    let block = state.world.getBlock(gx, gy);
    if (!block) {
      const cx = floor(gx / CHUNK_SIZE);
      const cy = floor(gy / CHUNK_SIZE);
      const chunk = state.world.getChunk(cx, cy);
      block = new Block(gx, gy, 'o_dirt');
      block.isMined = true;
      chunk.blocks.push(block);
      chunk.blockMap.set(`${gx},${gy}`, block);
    }
    block.liquidType = key;
    if (key === 'l_spawner' || key.startsWith('l_spawner') || liquidTypes[key]?.isEnemySpawner || liquidTypes[key]?.enemySpawnConfig) {
      const lCfg = liquidTypes[key];
      const tip = state.levelEditor.toolbarSpawnerTooltip;
      const activeConfig = (tip && tip.key === key) ? tip.config : (lCfg?.enemySpawnConfig || {});
      const activeName = (tip && tip.key === key) ? tip.name : (lCfg?.name || 'Ground Spawner');
      block.customSpawnerConfig = {
        name: activeName,
        budget: activeConfig.budget !== undefined ? activeConfig.budget : (block.spawnerBudget || 60),
        enemyTypeKey: activeConfig.enemyTypeKey ? [...activeConfig.enemyTypeKey] : ['e_basic'],
        spawnRadius: activeConfig.spawnRadius !== undefined ? activeConfig.spawnRadius : 120,
        spawnTriggerRadius: activeConfig.spawnTriggerRadius !== undefined ? activeConfig.spawnTriggerRadius : 200,
        spawnInterval: activeConfig.spawnInterval !== undefined ? activeConfig.spawnInterval : 60,
        spawnIntervalConsumeBudget: activeConfig.spawnIntervalConsumeBudget !== false,
        health: activeConfig.health || 300
      };
      block.spawnerBudget = block.customSpawnerConfig.budget;
      block.lastSpawnTime = state.frames + Math.floor(Math.random() * (block.customSpawnerConfig.spawnInterval || 60));
    }
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    state.world.dirtyChunkAndNeighbors(cx, cy);
  } else if (category === 'groundFeatures') {
    const existing = state.groundFeatures.find((gf: any) => gf.type === key && dist(gf.pos.x, gf.pos.y, mWorldX, mWorldY) < 16);
    if (!existing) {
      state.groundFeatures.push(new GroundFeature(mWorldX, mWorldY, key));
    }
  } else if (category === 'entities') {
    if (key === 'player_spawn') {
      state.player.pos.x = mWorldX;
      state.player.pos.y = mWorldY;
    } else if (npcTypes[key]) {
      const existing = state.npcs.find((npc: any) => dist(npc.pos.x, npc.pos.y, mWorldX, mWorldY) < 24);
      if (!existing) {
        state.npcs.push(new NPCEntity(mWorldX, mWorldY, key));
      }
    } else if (enemyTypes[key]) {
      const existing = state.enemies.find((e: any) => dist(e.pos.x, e.pos.y, mWorldX, mWorldY) < 20);
      if (!existing) {
        state.enemies.push(new Enemy(mWorldX, mWorldY, key));
      }
    } else if (lootTypes[key]) {
      const cx = floor(gx / CHUNK_SIZE);
      const cy = floor(gy / CHUNK_SIZE);
      const chunk = state.world.getChunk(cx, cy);
      if (chunk) {
        const existing = chunk.loot.find((l: any) => dist(l.pos.x, l.pos.y, mWorldX, mWorldY) < 15);
        if (!existing) {
          const loot = spawnLootEntity(mWorldX, mWorldY, key);
          loot.neverDespawn = true;
          chunk.loot.push(loot);
        }
      }
    }
  } else if (category === 'turrets') {
    const existingTurret = state.world.getTurretAt(gx, gy);
    if (!existingTurret || existingTurret.type !== key) {
      if (existingTurret) {
        state.world.removeTurret(gx, gy);
      }
      const wt = createWorldTurret(key, gx, gy);
      state.world.addTurret(wt);
    }
  } else if (category === 'flags') {
    if (key === 'isWinCondition') {
      const enemy = state.enemies.find((e: any) => dist(e.pos.x, e.pos.y, mWorldX, mWorldY) < 28);
      if (enemy) {
        if (!state.levelEditor.isFlagDragActive) {
          state.levelEditor.isFlagDragActive = true;
          // Determine drag action based on initial enemy clicked
          state.levelEditor.flagDragMode = enemy.isWinCondition ? 'remove' : 'add';
          enemy.isWinCondition = (state.levelEditor.flagDragMode === 'add');
        } else {
          // Continuous drag in one gesture: apply current locked drag mode
          if (state.levelEditor.flagDragMode === 'add') {
            enemy.isWinCondition = true;
          } else if (state.levelEditor.flagDragMode === 'remove') {
            enemy.isWinCondition = false;
          }
        }
      } else {
        const block = state.world.getBlock(gx, gy);
        if (block && !block.isMined) {
          if (!state.levelEditor.isFlagDragActive) {
            state.levelEditor.isFlagDragActive = true;
            state.levelEditor.flagDragMode = block.isWinCondition ? 'remove' : 'add';
            block.isWinCondition = (state.levelEditor.flagDragMode === 'add');
          } else {
            if (state.levelEditor.flagDragMode === 'add') {
              block.isWinCondition = true;
            } else if (state.levelEditor.flagDragMode === 'remove') {
              block.isWinCondition = false;
            }
          }
          const cx = floor(gx / CHUNK_SIZE);
          const cy = floor(gy / CHUNK_SIZE);
          state.world.dirtyChunkAndNeighbors(cx, cy);
        }
      }
    }
  }
}

export function deleteAtPosition(mWorldX: number, mWorldY: number, onlyOverlay: boolean = false) {
  const gx = floor(mWorldX / GRID_SIZE);
  const gy = floor(mWorldY / GRID_SIZE);

  if (!state.world) return;

  if (state.levelEditor?.activeCategory === 'flags') {
    // When in flags mode, right-click removes win condition flags instead of deleting entities
    const enemy = state.enemies.find((e: any) => dist(e.pos.x, e.pos.y, mWorldX, mWorldY) < 28);
    if (enemy) {
      enemy.isWinCondition = false;
      return;
    }
    const block = state.world.getBlock(gx, gy);
    if (block && block.isWinCondition) {
      block.isWinCondition = false;
      const cx = floor(gx / CHUNK_SIZE);
      const cy = floor(gy / CHUNK_SIZE);
      state.world.dirtyChunkAndNeighbors(cx, cy);
    }
    return;
  }

  if (onlyOverlay) {
    const block = state.world.getBlock(gx, gy);
    if (block && block.overlay) {
      block.overlay = null;
      block.customSpawnerConfig = null;
      const cx = floor(gx / CHUNK_SIZE);
      const cy = floor(gy / CHUNK_SIZE);
      state.world.dirtyChunkAndNeighbors(cx, cy);
      if (state.levelEditor.selectedCustomSpawner?.gx === gx && state.levelEditor.selectedCustomSpawner?.gy === gy) {
        state.levelEditor.selectedCustomSpawner = null;
      }
    }
    return;
  }

  // 1. Delete Turrets
  state.world.removeTurret(gx, gy);

  // 2. Delete Ground Features near mouse
  for (let i = state.groundFeatures.length - 1; i >= 0; i--) {
    const gf = state.groundFeatures[i];
    if (dist(gf.pos.x, gf.pos.y, mWorldX, mWorldY) < 24) {
      state.groundFeatures.splice(i, 1);
    }
  }

  // 3. Delete NPCs near mouse
  for (let i = state.npcs.length - 1; i >= 0; i--) {
    const npc = state.npcs[i];
    if (dist(npc.pos.x, npc.pos.y, mWorldX, mWorldY) < 28) {
      state.npcs.splice(i, 1);
    }
  }

  // 4. Delete Enemies near mouse
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (dist(e.pos.x, e.pos.y, mWorldX, mWorldY) < 24) {
      state.enemies.splice(i, 1);
    }
  }

  // 5. Delete Loot near mouse
  const cx = floor(gx / CHUNK_SIZE);
  const cy = floor(gy / CHUNK_SIZE);
  const chunk = state.world.chunks.get(`${cx},${cy}`);
  if (chunk && chunk.loot) {
    for (let i = chunk.loot.length - 1; i >= 0; i--) {
      const l = chunk.loot[i];
      if (dist(l.pos.x, l.pos.y, mWorldX, mWorldY) < 24) {
        chunk.loot.splice(i, 1);
      }
    }
  }

  // 6. Delete Block / Overlay / Liquid
  const block = state.world.getBlock(gx, gy);
  if (block) {
    if (block.overlay) {
      block.overlay = null;
      block.customSpawnerConfig = null;
      if (state.levelEditor.selectedCustomSpawner?.gx === gx && state.levelEditor.selectedCustomSpawner?.gy === gy) {
        state.levelEditor.selectedCustomSpawner = null;
      }
    } else if (block.liquidType) {
      block.liquidType = null;
    } else if (!block.isMined) {
      block.isMined = true;
    }
    state.world.dirtyChunkAndNeighbors(cx, cy);
  }
}
