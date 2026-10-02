// ==========================================
// Multi-Layered Worley / Cellular Noise Engine
// Pure mathematical function of (worldX, worldY, level, seed)
// ==========================================

import { 
  CELL_LAYERS, 
  CELL_LAYER_MAP, 
  AIR_CUTOFF_PER_LEVEL, 
  WORLD_GEN_CELLULAR_CONFIG, 
  CellLayerKey, 
  CellularLayerConfig 
} from './cellTypes';
import { overlayTypes } from '../balanceObstacles';

// Standard pure coordinate hash (Murmur3 / xxHash style integer mix)
export function hash2D(x: number, y: number, seed: number = 1337): number {
  let h = (x * 374761393 + y * 668265263 + seed * 961748941) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

// Normalized 0..1 deterministic pseudo-random float from (x, y, seed)
export function hash2DFloat(x: number, y: number, seed: number = 1337): number {
  return hash2D(x, y, seed) / 4294967296.0;
}

export interface WorleyCellResult {
  cellId: number;
  cellX: number; // Feature point world X
  cellY: number; // Feature point world Y
  dist: number;  // Distance to closest feature point
  dist2: number; // Distance to second closest feature point
  normalizedDist: number; // Relative boundary distance (0 = center, 1 = border)
  relativeRadius: number; // Relative core distance (1 = nucleus center, 0 = border)
  superGridX: number;
  superGridY: number;
}

/**
 * Pure 2D Worley / Cellular noise calculation.
 * Evaluates nearest feature point across a coarse super-grid with deterministic point hashing.
 */
export function getWorleyCell(
  gx: number, 
  gy: number, 
  seed: number = 4242, 
  superGridSize: number = 24
): WorleyCellResult {
  const sgSize = Math.max(6, superGridSize);
  
  // Super-grid coordinates of the current tile
  const scx = Math.floor(gx / sgSize);
  const scy = Math.floor(gy / sgSize);

  let minDistSq = Infinity;
  let secondMinDistSq = Infinity;
  let closestId = 0;
  let closestX = 0;
  let closestY = 0;
  let closestSCX = scx;
  let closestSCY = scy;

  // Search 3x3 supergrid neighborhood
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nx = scx + dx;
      const ny = scy + dy;

      // Deterministic feature point coordinates inside supercell [nx, ny]
      const hX = hash2DFloat(nx, ny, seed);
      const hY = hash2DFloat(nx, ny, seed + 1013);
      const pointId = hash2D(nx, ny, seed + 2039);

      // Place point inside supercell with jitter margin [0.1 .. 0.9] to prevent overlaps
      const px = (nx + 0.1 + hX * 0.8) * sgSize;
      const py = (ny + 0.1 + hY * 0.8) * sgSize;

      const dSq = (gx - px) * (gx - px) + (gy - py) * (gy - py);

      if (dSq < minDistSq) {
        secondMinDistSq = minDistSq;
        minDistSq = dSq;
        closestId = pointId;
        closestX = px;
        closestY = py;
        closestSCX = nx;
        closestSCY = ny;
      } else if (dSq < secondMinDistSq) {
        secondMinDistSq = dSq;
      }
    }
  }

  const dist1 = Math.sqrt(minDistSq);
  const dist2 = Math.sqrt(secondMinDistSq);
  // Normalized distance measure: dist1 / (dist1 + dist2)
  const normalizedDist = dist1 / Math.max(0.001, dist1 + dist2);
  // Relative radius: 1.0 = cell center / nucleus, 0.0 = outer cell border / corridor
  const relativeRadius = Math.max(0, 1.0 - normalizedDist);

  return {
    cellId: closestId,
    cellX: closestX,
    cellY: closestY,
    dist: dist1,
    dist2: dist2,
    normalizedDist: normalizedDist,
    relativeRadius: relativeRadius,
    superGridX: closestSCX,
    superGridY: closestSCY
  };
}

export interface EvaluatedCellTile {
  hasSolidTile: boolean;
  isLiquid: boolean;
  material: string | null;
  overlay: string | null;
  spawnerBudget: number;
  layerKey: CellLayerKey | null;
  band: 'air' | 'shell' | 'mantle' | 'core';
  relativeRadius: number;
  cellId: number;
}

/**
 * Multi-Layered Core-and-Shell Evaluation.
 * Evaluates layers in ascending tier order (Tree -> Dirt -> Clay -> Stone -> Lake).
 * Higher-tier active cells override lower-tier terrain beneath them.
 */
export function getMultiLayerCellAt(
  gx: number,
  gy: number,
  level: number = 0,
  seed: number = WORLD_GEN_CELLULAR_CONFIG.worldSeed
): EvaluatedCellTile {
  const lv = Math.floor(Math.min(10, Math.max(0, level)));
  const baseAirCutoff = AIR_CUTOFF_PER_LEVEL[lv] ?? 0.35;
  const globalAirOffset = WORLD_GEN_CELLULAR_CONFIG.globalAirCutoffOffset ?? 0.0;
  const airCutoff = Math.max(0.05, Math.min(0.85, baseAirCutoff + globalAirOffset));

  let result: EvaluatedCellTile = {
    hasSolidTile: false,
    isLiquid: false,
    material: null,
    overlay: null,
    spawnerBudget: 0,
    layerKey: null,
    band: 'air',
    relativeRadius: 0,
    cellId: 0
  };

  // Evaluate lower tier -> higher tier sequence
  for (let i = 0; i < CELL_LAYERS.length; i++) {
    const layer = CELL_LAYERS[i];
    const weight = layer.levelWeights[lv] ?? 0;
    if (weight <= 0) continue;

    const layerSeed = (seed + layer.seedOffset) >>> 0;
    const baseSg = layer.superGridSize[lv] ?? layer.superGridSize[layer.superGridSize.length - 1] ?? 24;
    const sgSize = baseSg * (WORLD_GEN_CELLULAR_CONFIG.superGridMultiplier || 1.0);
    const worley = getWorleyCell(gx, gy, layerSeed, sgSize);

    // Roll cell existence / activation at current level
    const spawnRoll = (hash2D(worley.cellId, lv, layerSeed + 1337) / 4294967296.0) * 100;
    if (spawnRoll > weight) continue;

    // Organic boundary perturbation
    const jitterAmp = WORLD_GEN_CELLULAR_CONFIG.boundaryJitterAmp ?? 0.08;
    const jitter = (hash2DFloat(gx, gy, layerSeed + 777) - 0.5) * jitterAmp;
    const rEff = worley.relativeRadius + jitter;

    // Outer corridor check
    if (rEff < airCutoff) {
      continue; // Outside cell shell (pathway / corridor) - does not override
    }

    // Inside Cell! Find the active ring in ringThresholdConfig (sorted ascending, pick highest matching threshold)
    const rings = layer.ringThresholdConfig;
    let matchedRingIndex = 0;
    for (let rIdx = rings.length - 1; rIdx >= 0; rIdx--) {
      if (rEff >= rings[rIdx].threshold) {
        matchedRingIndex = rIdx;
        break;
      }
    }
    const ring = rings[matchedRingIndex];

    // Combine with ring-specific airRatio (additional air carving within this ring)
    if (ring.airRatio > 0) {
      const ringAirRoll = hash2DFloat(gx, gy, layerSeed + 555);
      if (ringAirRoll < ring.airRatio) {
        continue;
      }
    }

    // Determine Material using cellular hash with equal weighting
    let chosenMat: string | null = null;
    if (ring.materials.length === 1) {
      chosenMat = ring.materials[0];
    } else if (ring.materials.length > 1) {
      const matNoise = hash2DFloat(gx, gy, layerSeed + 888);
      const matIdx = Math.floor(matNoise * ring.materials.length) % ring.materials.length;
      chosenMat = ring.materials[matIdx];
    }

    // Determine Overlay using weighted distribution
    let chosenOverlay: string | null = null;
    let spBudget = 0;
    if (ring.overlays && ring.overlays.length > 0) {
      const totalWeight = ring.overlays.reduce((s, o) => s + (o.weight || 0), 0);
      if (totalWeight > 0) {
        const ovRoll = hash2DFloat(gx, gy, layerSeed + 999) * totalWeight;
        let cumulative = 0;
        for (const opt of ring.overlays) {
          cumulative += opt.weight;
          if (ovRoll <= cumulative) {
            if (opt.key && opt.key !== 'none') {
              chosenOverlay = opt.key;
              spBudget = opt.budget || (overlayTypes[opt.key]?.enemySpawnConfig?.budget || 60);
            }
            break;
          }
        }
      }
    }

    const isLiq = chosenMat ? (chosenMat.startsWith('l_') || !!layer.isLiquid) : !!layer.isLiquid;
    const bandName = matchedRingIndex === rings.length - 1 ? 'core' : (matchedRingIndex > 0 ? 'mantle' : 'shell');

    result = {
      hasSolidTile: !isLiq && !!chosenMat,
      isLiquid: isLiq,
      material: chosenMat,
      overlay: chosenOverlay,
      spawnerBudget: spBudget,
      layerKey: layer.key,
      band: bandName,
      relativeRadius: rEff,
      cellId: worley.cellId
    };
  }

  return result;
}

// Backward-compatible query alias
export function getCellAt(
  gx: number,
  gy: number,
  level: number = 0,
  seed: number = WORLD_GEN_CELLULAR_CONFIG.worldSeed
) {
  const evaluated = getMultiLayerCellAt(gx, gy, level, seed);
  const def = evaluated.layerKey ? CELL_LAYER_MAP[evaluated.layerKey] : CELL_LAYERS[0];
  return {
    cellId: evaluated.cellId,
    cellTypeKey: evaluated.layerKey || 'dirt',
    cellDef: {
      ...def,
      interiorFeatures: {
        spawnerChance: 0.1,
        subPocketChance: 0.15,
        oreChance: 0.5,
        oreTypes: ['oreLeaf', 'oreShard'],
        subPocketMaterial: 'o_dirt'
      }
    },
    distToCenter: (1.0 - evaluated.relativeRadius) * 20,
    normalizedDist: 1.0 - evaluated.relativeRadius,
    isInsideBlob: evaluated.band !== 'air',
    hasSolidTile: evaluated.hasSolidTile,
    isLiquid: evaluated.isLiquid
  };
}
