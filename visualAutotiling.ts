
import { state } from './state';
import { GRID_SIZE } from './constants';

declare const noise: any;

// Mapping for the 4x4 tileset provided by user
// Index = (TL * 1) + (TR * 2) + (BL * 4) + (BR * 8)
export const BITMASK_MAP: Record<number, {x: number, y: number}> = {
  0: {x: 0, y: 3},  // 00 / 00
  1: {x: 3, y: 3},  // 10 / 00
  2: {x: 0, y: 2},  // 01 / 00
  3: {x: 1, y: 2},  // 11 / 00
  4: {x: 0, y: 0},  // 00 / 10
  5: {x: 3, y: 2},  // 10 / 10
  6: {x: 2, y: 3},  // 01 / 10
  7: {x: 3, y: 1},  // 11 / 10
  8: {x: 1, y: 3},  // 00 / 01
  9: {x: 0, y: 1},  // 10 / 01
  10: {x: 1, y: 0}, // 01 / 01
  11: {x: 2, y: 2}, // 11 / 01
  12: {x: 3, y: 0}, // 00 / 11
  13: {x: 2, y: 0}, // 10 / 11
  14: {x: 1, y: 1}, // 01 / 11
  15: {x: 2, y: 1}  // 11 / 11
};

// Priority for rendering: Higher number = renders on top
const MATERIAL_PRIORITY: Record<string, number> = {
  'o_black': 1,
  'o_slate': 2,
  'o_stone': 3,
  'o_clay': 4,
  'o_dirt': 5
};

export function getBlockType(gx: number, gy: number) {
  const b = state.world.getBlock(gx, gy);
  if (!b || b.isMined) return null;
  return b.type;
}

export function isBlockConcealed(gx: number, gy: number) {
  const b = state.world.getBlock(gx, gy);
  if (!b || b.isMined) return false;
  // A block is concealed if it is surrounded by other solid blocks
  const n = state.world.getBlock(gx, gy - 1);
  const s = state.world.getBlock(gx, gy + 1);
  const w = state.world.getBlock(gx - 1, gy);
  const e = state.world.getBlock(gx + 1, gy);
  return (n && !n.isMined) && (s && !s.isMined) && (w && !w.isMined) && (e && !e.isMined);
}

export function drawAutotile(pg: any, vx: number, vy: number, gx: number, gy: number, tl: string | null, tr: string | null, bl: string | null, br: string | null) {
  const neighbors = [tl, tr, bl, br];
  const uniqueMaterials = Array.from(new Set(neighbors.filter((m): m is string => m !== null && MATERIAL_PRIORITY[m] !== undefined)));

  if (uniqueMaterials.length === 0) return;

  // Sort materials by priority (hardest first, softest last)
  uniqueMaterials.sort((a, b) => (MATERIAL_PRIORITY[a] || 0) - (MATERIAL_PRIORITY[b] || 0));

  const tileSize = 128; // Source tile size
  const drawX = (vx - 0.5) * GRID_SIZE;
  const drawY = (vy - 0.5) * GRID_SIZE;

  // Draw each material layer
  for (const mat of uniqueMaterials) {
    let mask = 0;
    const pMat = MATERIAL_PRIORITY[mat] || 0;

    // A material connects to itself OR any material with HIGHER priority
    // This makes lower materials "fill in" under higher ones
    if (tl === mat || (tl && (MATERIAL_PRIORITY[tl] || 0) > pMat)) mask |= 1;
    if (tr === mat || (tr && (MATERIAL_PRIORITY[tr] || 0) > pMat)) mask |= 2;
    if (bl === mat || (bl && (MATERIAL_PRIORITY[bl] || 0) > pMat)) mask |= 4;
    if (br === mat || (br && (MATERIAL_PRIORITY[br] || 0) > pMat)) mask |= 8;

    const coords = BITMASK_MAP[mask];
    if (!coords) continue;

    // Determine asset
    let assetKey = 'img_tileset_fallback';
    if (mat === 'o_dirt') {
      const nVal = noise((gx + 0.5) * 3, (gy + 0.5) * 3, 999); // do not change these params
      assetKey = nVal > 0.5 ? 'img_tileset_dirt_v2' : 'img_tileset_dirt';
    } else if (mat === 'o_clay') {
      const nVal = noise((gx + 0.5) * 3, (gy + 0.5) * 3, 999);
      assetKey = nVal > 0.5 ? 'img_tileset_clay_v2' : 'img_tileset_clay';
    } else if (mat === 'o_stone') {
      const nVal = noise((gx + 0.5) * 3, (gy + 0.5) * 3, 999);
      assetKey = nVal > 0.5 ? 'img_tileset_stone_v2' : 'img_tileset_stone';
    } else if (mat === 'o_slate') {
      const nVal = noise((gx + 0.5) * 3, (gy + 0.5) * 3, 999);
      assetKey = nVal > 0.5 ? 'img_tileset_slate_v2' : 'img_tileset_slate';
    } else if (mat === 'o_black') {
      const nVal = noise((gx + 0.5) * 3, (gy + 0.5) * 3, 999);
      assetKey = nVal > 0.5 ? 'img_tileset_black_v2' : 'img_tileset_black';
    }
    // Add other materials here as assets are provided
    
    const img = state.assets[assetKey];
    if (img && img.width > 0) {
      if (mask === 15) {
        const seed = (gx * 31 + gy * 7);
        const rot = (Math.abs(seed) % 4) * (window as any).HALF_PI;
        pg.push();
        pg.translate(drawX + GRID_SIZE / 2, drawY + GRID_SIZE / 2);
        pg.rotate(rot);
        pg.image(img, -GRID_SIZE / 2, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE, 
                 coords.x * tileSize, coords.y * tileSize, tileSize, tileSize);
        pg.pop();
      } else {
        pg.image(img, drawX, drawY, GRID_SIZE, GRID_SIZE, 
                 coords.x * tileSize, coords.y * tileSize, tileSize, tileSize);
      }
    }
  }

  // Draw Concealed Overlay
  let concealedMask = 0;
  if (isBlockConcealed(gx, gy)) concealedMask |= 1;
  if (isBlockConcealed(gx + 1, gy)) concealedMask |= 2;
  if (isBlockConcealed(gx, gy + 1)) concealedMask |= 4;
  if (isBlockConcealed(gx + 1, gy + 1)) concealedMask |= 8;

  if (concealedMask > 0) {
    const concealedCoords = BITMASK_MAP[concealedMask];
    const concealedImg = state.assets['img_tileset_concealed'];
    if (concealedImg && concealedImg.width > 0) {
      pg.blendMode((window as any).MULTIPLY);
      pg.image(concealedImg, drawX, drawY, GRID_SIZE, GRID_SIZE,
               concealedCoords.x * tileSize, concealedCoords.y * tileSize, tileSize, tileSize);
      pg.blendMode((window as any).BLEND);
    }
  }

  // Debug: Show bitmask on tile
  if (state.showDebug && state.showObstacleOutline) {
    pg.fill(255, 255, 0, 200);
    pg.noStroke();
    pg.textSize(10);
    pg.textAlign((window as any).CENTER, (window as any).CENTER);
    pg.text(gx + "," + gy, vx * GRID_SIZE, vy * GRID_SIZE);
  }
}
