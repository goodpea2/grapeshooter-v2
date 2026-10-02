import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { drawTurretSprite } from '../../assetTurret';
import { AlmanacProgression, getActiveAlmanacProgression, DEFAULT_SKILL_TREE_CONFIG } from '../../lvDemo';
import { drawNewTurretTooltip } from '../UITurretTooltip';
import { setUILayer, drawHexTreeNode, drawUpwardArrowIcon, drawFadedEdgeGradients, drawTreeNodeTooltipCard } from '../../uiComponents';
import { color } from '../../uiColors';
import { soundEngine } from '../../src/audio/soundEngine';
import { NodeUnlockVFX, spawnNodeUnlockVFX } from '../../vfx/NodeUnlockVFX';


export type UnlockNodeType = 'turretUnlock' | 'turretUpgrade' | 'loot' | 'empty';

export interface HexUnlockNode {
  id: string; // "q,r"
  q: number;
  r: number;
  ring: number;
  type: UnlockNodeType;
  cost: number;
  isUnlocked: boolean;
  hoverAnim?: number;
  
  // Specific properties
  turretKey?: string;
  upgradeTurretKey?: string;
  upgradeDescription?: string;
  lootType?: 'sun' | 'elixir';
  lootAmount?: number;
}

const RING_CONFIG: Record<number, { turrets: number; upgrades: number; loot: number; empty: number; cost: number }> = {
  0: { turrets: 0, upgrades: 0, loot: 1, empty: 0, cost: 0 },
  1: { turrets: 3, upgrades: 3, loot: 0, empty: 0, cost: 1 },
  2: { turrets: 5, upgrades: 4, loot: 1, empty: 2, cost: 1 },
  3: { turrets: 7, upgrades: 5, loot: 2, empty: 4, cost: 2 },
  4: { turrets: 10, upgrades: 6, loot: 3, empty: 5, cost: 2 },
  5: { turrets: 8, upgrades: 8, loot: 6, empty: 8, cost: 3 },
  6: { turrets: 7, upgrades: 10, loot: 10, empty: 9, cost: 3 }
};

const HEX_V_SPACING = 68;
const HEX_H_SPACING = HEX_V_SPACING * (Math.sqrt(3) / 2);
const NODE_SIZE = 52;

const NEIGHBOR_DIRS = [
  [0, -1], [1, -1], [1, 0],
  [0, 1], [-1, 1], [-1, 0]
];

// Active VFX inside the tree viewport
const activeTreeVFX: NodeUnlockVFX[] = [];

// Seeded PRNG (Mulberry32)
function createPRNG(seed: number) {
  let s = (seed || 1337) | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getHexRing(q: number, r: number): number {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
}

export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = q * HEX_H_SPACING;
  const y = (r + q / 2) * HEX_V_SPACING;
  return { x, y };
}

export function initTurretUnlockTree(forceSeed?: number) {
  const seed = forceSeed || state.worldSeed || 2026;
  const rng = createPRNG(seed);

  const nodes = new Map<string, HexUnlockNode>();

  // Collect all hex coordinates for Rings 0..6
  const ringNodes: Record<number, { q: number; r: number }[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  };

  for (let q = -6; q <= 6; q++) {
    for (let r = -6; r <= 6; r++) {
      const ring = getHexRing(q, r);
      if (ring <= 6) {
        ringNodes[ring].push({ q, r });
      }
    }
  }

  // Build non-repeating pool of locked turrets with weights
  const prog = getActiveAlmanacProgression();
  const rawLocked = prog.LockedTurret || AlmanacProgression.LockedTurret || [];
  interface WeightedTurretCandidate {
    type: string;
    weight: number;
  }
  const candidatePool: WeightedTurretCandidate[] = [];
  const seenKeys = new Set<string>();

  for (const item of rawLocked) {
    const key = typeof item === 'string' ? item : item.type;
    const weight = typeof item === 'string' ? 10 : (typeof item.weight === 'number' ? item.weight : 10);
    if (key && !seenKeys.has(key)) {
      seenKeys.add(key);
      candidatePool.push({ type: key, weight: Math.max(1, weight) });
    }
  }

  // Shuffle & populate each ring from 0 to 6
  for (let ring = 0; ring <= 6; ring++) {
    const coords = [...ringNodes[ring]];
    // Fisher-Yates shuffle coordinates
    for (let i = coords.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    const cfg = RING_CONFIG[ring] || { turrets: 0, upgrades: 0, loot: 0, empty: coords.length, cost: 3 };
    const treeCfg = prog.SkillTreeConfig || DEFAULT_SKILL_TREE_CONFIG;
    const ringTurrets = (treeCfg.TurretUnlockNodes && treeCfg.TurretUnlockNodes[ring] !== undefined)
      ? treeCfg.TurretUnlockNodes[ring]
      : cfg.turrets;
    const ringUpgrades = (treeCfg.TurretUpgradeNodes && treeCfg.TurretUpgradeNodes[ring] !== undefined)
      ? treeCfg.TurretUpgradeNodes[ring]
      : cfg.upgrades;
    const ringLoot = (treeCfg.LootNodes && treeCfg.LootNodes[ring] !== undefined)
      ? treeCfg.LootNodes[ring]
      : cfg.loot;
    let cIdx = 0;

    // Ring 0 is the starting cache
    if (ring === 0) {
      const c = coords[0];
      const id = `${c.q},${c.r}`;
      if (ringLoot > 0) {
        nodes.set(id, {
          id,
          q: c.q,
          r: c.r,
          ring: 0,
          type: 'loot',
          cost: 0,
          isUnlocked: false,
          lootType: 'sun',
          lootAmount: 3
        });
      } else if (ringTurrets > 0 && candidatePool.length > 0) {
        const pickedTurret = candidatePool.shift()!.type;
        nodes.set(id, {
          id,
          q: c.q,
          r: c.r,
          ring: 0,
          type: 'turretUnlock',
          cost: 0,
          isUnlocked: false,
          turretKey: pickedTurret
        });
      } else if (ringUpgrades > 0) {
        nodes.set(id, {
          id,
          q: c.q,
          r: c.r,
          ring: 0,
          type: 'turretUpgrade',
          cost: 0,
          isUnlocked: false
        });
      } else {
        nodes.set(id, {
          id,
          q: c.q,
          r: c.r,
          ring: 0,
          type: 'empty',
          cost: 0,
          isUnlocked: false
        });
      }
      continue;
    }

    // 1. Turret Unlocks (Weighted random selection without repeats; populated from ring 0 to 6)
    for (let i = 0; i < ringTurrets && cIdx < coords.length; i++, cIdx++) {
      const c = coords[cIdx];
      const id = `${c.q},${c.r}`;
      if (candidatePool.length > 0) {
        let totalWeight = 0;
        for (const cand of candidatePool) {
          totalWeight += cand.weight;
        }
        let roll = rng() * totalWeight;
        let pickedIdx = 0;
        for (let k = 0; k < candidatePool.length; k++) {
          roll -= candidatePool[k].weight;
          if (roll <= 0) {
            pickedIdx = k;
            break;
          }
        }
        const pickedTurret = candidatePool.splice(pickedIdx, 1)[0].type;
        nodes.set(id, {
          id,
          q: c.q,
          r: c.r,
          ring,
          type: 'turretUnlock',
          cost: cfg.cost,
          isUnlocked: false,
          turretKey: pickedTurret
        });
      } else {
        nodes.set(id, {
          id,
          q: c.q,
          r: c.r,
          ring,
          type: 'empty',
          cost: cfg.cost,
          isUnlocked: false
        });
      }
    }

    // 2. Turret Upgrades
    for (let i = 0; i < ringUpgrades && cIdx < coords.length; i++, cIdx++) {
      const c = coords[cIdx];
      const id = `${c.q},${c.r}`;
      nodes.set(id, {
        id,
        q: c.q,
        r: c.r,
        ring,
        type: 'turretUpgrade',
        cost: cfg.cost,
        isUnlocked: false
      });
    }

    // 3. Loot
    for (let i = 0; i < ringLoot && cIdx < coords.length; i++, cIdx++) {
      const c = coords[cIdx];
      const id = `${c.q},${c.r}`;
      nodes.set(id, {
        id,
        q: c.q,
        r: c.r,
        ring,
        type: 'loot',
        cost: cfg.cost,
        isUnlocked: false
      });
    }

    // 4. Empty
    while (cIdx < coords.length) {
      const c = coords[cIdx++];
      const id = `${c.q},${c.r}`;
      nodes.set(id, {
        id,
        q: c.q,
        r: c.r,
        ring,
        type: 'empty',
        cost: cfg.cost,
        isUnlocked: false
      });
    }
  }

  state.turretUnlockTree = {
    nodes,
    selectedNodeId: null
  };

  if (!state.turretUnlockTreeScroll) {
    state.turretUnlockTreeScroll = { x: 0, y: 0, zoom: 0.88, targetZoom: 0.88 };
  } else {
    state.turretUnlockTreeScroll.targetZoom = state.turretUnlockTreeScroll.zoom || 0.88;
  }
}

export function triggerNodeUnlockVFX(nodeId: string, theme: 'gold' | 'purple' | 'cyan' = 'gold') {
  if (!state.turretUnlockTree?.nodes) return;
  const nodesMap = state.turretUnlockTree.nodes as Map<string, HexUnlockNode>;
  const node = nodesMap.get ? nodesMap.get(nodeId) : (nodesMap as any)[nodeId];
  if (!node) return;
  const { x: nx, y: ny } = hexToPixel(node.q, node.r);
  activeTreeVFX.push(spawnNodeUnlockVFX(nx, ny, theme));
}

export function resetTurretUnlockTreeState() {
  activeTreeVFX.length = 0;
  state.turretUnlockTree = null;
  state.turretUnlockChoiceModal = null;
  state.turretUnlockTreeScroll = { x: 0, y: 0, zoom: 0.88, targetZoom: 0.88 };
}

export function isNodeAvailable(node: HexUnlockNode): boolean {
  if (node.isUnlocked) return false;
  if (node.ring === 0) return true; // Center node starts available

  const nodesMap = state.turretUnlockTree?.nodes as Map<string, HexUnlockNode>;
  if (!nodesMap) return false;

  for (const [dq, dr] of NEIGHBOR_DIRS) {
    const nId = `${node.q + dq},${node.r + dr}`;
    const neighbor = nodesMap.get(nId);
    if (neighbor && neighbor.isUnlocked) {
      return true;
    }
  }
  return false;
}

// Interactive State
let isDraggingTree = false;
let dragStartX = 0;
let dragStartY = 0;
let initialScrollX = 0;
let initialScrollY = 0;

let hoveredNode: HexUnlockNode | null = null;
let hoveredNodeScreenPos: { x: number; y: number } | null = null;

export function handleTurretUnlockTreeScroll(delta: number): boolean {
  if (!state.turretUnlockTreeScroll) {
    state.turretUnlockTreeScroll = { x: 0, y: 0, zoom: 0.88, targetZoom: 0.88 };
  }
  const scroll = state.turretUnlockTreeScroll;
  if (typeof scroll.targetZoom !== 'number') scroll.targetZoom = scroll.zoom || 0.88;
  
  const factor = delta > 0 ? 0.9 : 1.11;
  scroll.targetZoom = constrain(scroll.targetZoom * factor, 0.45, 1.8);
  return true;
}

export function drawTurretUnlockTreePanel(
  panelX: number,
  panelY: number,
  panelW: number,
  panelH: number,
  modalX: number,
  modalY: number
) {
  const screenPanelX = modalX + panelX;
  const screenPanelY = modalY + panelY;

  push();
  translate(panelX, panelY);
  drawTurretUnlockTree(screenPanelX, screenPanelY, panelW, panelH);
  pop();
}

export function drawTurretUnlockTree(
  screenPanelX: number,
  screenPanelY: number,
  panelW: number,
  panelH: number
) {
  if (!state.turretUnlockTree || !state.turretUnlockTree.nodes) {
    initTurretUnlockTree();
  }

  if (!state.turretUnlockTreeScroll) {
    state.turretUnlockTreeScroll = { x: 0, y: 0, zoom: 0.88, targetZoom: 0.88 };
  }

  // Smooth zoom lerp
  const scroll = state.turretUnlockTreeScroll;
  if (typeof scroll.targetZoom !== 'number') scroll.targetZoom = scroll.zoom || 0.88;
  scroll.zoom = (scroll.zoom || 0.88) + (scroll.targetZoom - (scroll.zoom || 0.88)) * 0.25;

  const zoom = scroll.zoom;
  const viewportCenterX = panelW / 2 + (scroll.x || 0);
  const viewportCenterY = panelH / 2 + (scroll.y || 0);

  // Mouse relative to panel local coordinate space
  const localMouseX = mouseX - screenPanelX;
  const localMouseY = mouseY - screenPanelY;

  const mouseInPanel =
    localMouseX >= 0 &&
    localMouseX <= panelW &&
    localMouseY >= 0 &&
    localMouseY <= panelH;

  // Handle Drag Panning
  if (mouseInPanel && mouseIsPressed && !state.turretUnlockChoiceModal) {
    if (!isDraggingTree) {
      isDraggingTree = true;
      dragStartX = mouseX;
      dragStartY = mouseY;
      initialScrollX = scroll.x || 0;
      initialScrollY = scroll.y || 0;
    } else {
      scroll.x = initialScrollX + (mouseX - dragStartX);
      scroll.y = initialScrollY + (mouseY - dragStartY);
    }
  } else {
    isDraggingTree = false;
  }

  hoveredNode = null;
  hoveredNodeScreenPos = null;

  const nodesMap = state.turretUnlockTree.nodes as Map<string, HexUnlockNode>;

  // Panel Background
  fill(15, 18, 35, 150);
  noStroke();
  rect(0, 0, panelW, panelH, 25);

  // Strictly clip rendering to rounded panel boundary
  const ctx = (drawingContext as CanvasRenderingContext2D);
  ctx.save();
  ctx.beginPath();
  const radius = 24;
  ctx.moveTo(radius, 0);
  ctx.lineTo(panelW - radius, 0);
  ctx.quadraticCurveTo(panelW, 0, panelW, radius);
  ctx.lineTo(panelW, panelH - radius);
  ctx.quadraticCurveTo(panelW, panelH, panelW - radius, panelH);
  ctx.lineTo(radius, panelH);
  ctx.quadraticCurveTo(0, panelH, 0, panelH - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // 1. Draw Connecting Breadcrumb / Trace Lines
  push();
  translate(viewportCenterX, viewportCenterY);
  scale(zoom);

  const drawnEdges = new Set<string>();
  nodesMap.forEach((node) => {
    const p1 = hexToPixel(node.q, node.r);
    for (const [dq, dr] of NEIGHBOR_DIRS) {
      const nq = node.q + dq;
      const nr = node.r + dr;
      const nId = `${nq},${nr}`;
      const neighbor = nodesMap.get(nId);
      if (!neighbor) continue;

      const edgeKey = node.id < nId ? `${node.id}-${nId}` : `${nId}-${node.id}`;
      if (drawnEdges.has(edgeKey)) continue;
      drawnEdges.add(edgeKey);

      const p2 = hexToPixel(nq, nr);

      if (node.isUnlocked && neighbor.isUnlocked) {
        // Both Unlocked: Glowing Amber Line
        stroke(255, 195, 40, 220);
        strokeWeight(4);
        line(p1.x, p1.y, p2.x, p2.y);
      } else if (
        (node.isUnlocked && isNodeAvailable(neighbor)) ||
        (neighbor.isUnlocked && isNodeAvailable(node))
      ) {
        // Path to Available Node: Solid Light Blue Line
        stroke(80, 180, 255, 180);
        strokeWeight(2.5);
        line(p1.x, p1.y, p2.x, p2.y);
      } else {
        // Inactive Dark Guide Line
        stroke(32, 38, 62, 100);
        strokeWeight(1.5);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    }
  });

  // Render & Update Active Node Unlock VFX inside the tree viewport
  for (let i = activeTreeVFX.length - 1; i >= 0; i--) {
    const vfx = activeTreeVFX[i];
    vfx.update();
    vfx.display();
    if (vfx.isDone()) {
      activeTreeVFX.splice(i, 1);
    }
  }

  pop();

  // 2. Draw Hex Nodes
  push();
  translate(viewportCenterX, viewportCenterY);
  scale(zoom);

  let curHovered: HexUnlockNode | null = null;
  let curHoveredPos: { x: number; y: number } | null = null;

  nodesMap.forEach((node) => {
    const { x: nx, y: ny } = hexToPixel(node.q, node.r);
    const nodeLocalX = viewportCenterX + nx * zoom;
    const nodeLocalY = viewportCenterY + ny * zoom;
    const screenX = screenPanelX + nodeLocalX;
    const screenY = screenPanelY + nodeLocalY;

    const available = isNodeAvailable(node);
    const isSelected = state.turretUnlockTree?.selectedNodeId === node.id;
    const isUnderMouse = mouseInPanel && dist(localMouseX, localMouseY, nodeLocalX, nodeLocalY) <= (NODE_SIZE * zoom) / 2;

    // Smooth & Quick Hover Animation (1.1x scale + slightly raised)
    const targetHover = (isUnderMouse && (available || isSelected || node.isUnlocked)) ? 1.0 : 0.0;
    node.hoverAnim = (node.hoverAnim || 0) + (targetHover - (node.hoverAnim || 0)) * 0.35;
    if (Math.abs(node.hoverAnim - targetHover) < 0.005) node.hoverAnim = targetHover;

    if (isUnderMouse) {
      curHovered = node;
      curHoveredPos = { x: screenX, y: screenY };
      hoveredNode = node;
      hoveredNodeScreenPos = { x: screenX, y: screenY };
    }

    drawSingleNode(nx, ny, node, available, isUnderMouse, isSelected);
  });

  pop();

  // Draw soft edge fade vignettes along borders
  drawFadedEdges(panelW, panelH);

  ctx.restore();

  // 3. Draw Floating Tooltip in Root Screen Coordinates
  if (curHovered && curHoveredPos && !isDraggingTree && !state.turretUnlockChoiceModal) {
    const pos = curHoveredPos as { x: number; y: number };
    push();
    resetMatrix();
    setUILayer(260);
    drawNodeTooltip(curHovered, pos.x, pos.y);
    pop();
  }
}

function drawFadedEdges(w: number, h: number) {
  drawFadedEdgeGradients(w, h, 36, 'rgba(15, 18, 35, 0.95)');
}

function drawSingleNode(
  nx: number,
  ny: number,
  node: HexUnlockNode,
  available: boolean,
  isHovered: boolean,
  isSelected: boolean
) {
  const hoverFactor = node.hoverAnim || 0;
  const alphaVal = node.isUnlocked || available ? 255 : 120;

  drawHexTreeNode(nx, ny, {
    id: `tree_node_${node.id}`,
    size: NODE_SIZE,
    isUnlocked: node.isUnlocked,
    isAvailable: available,
    isSelected: isSelected,
    isHovered: isHovered,
    hoverFactor: hoverFactor,
    cost: node.cost,
    contentRender: () => {
      if (node.type === 'turretUnlock') {
        // Turret Asset Sprite / Preview
        const tr = turretTypes[node.turretKey || 't_pea'];
        if (tr) {
          push();
          translate(0, -2);
          const hop = node.isUnlocked ? abs(sin(frameCount * 0.1)) * 3 : 0;
          translate(0, -hop);
          scale(0.8);
          const dummy = {
            type: node.turretKey,
            config: tr,
            angle: 0,
            alpha: alphaVal,
            actionTimers: new Map(),
            flashTimer: 0,
            recoil: 0,
            fireRateMultiplier: 1.0,
            uid: `tree_node_${node.id}`
          };
          drawTurretSprite(dummy);
          pop();
        }
      } else if (node.type === 'turretUpgrade') {
        if (node.isUnlocked && node.upgradeTurretKey) {
          // Unlocked Upgrade: Show chosen plant + small upward arrow
          const tr = turretTypes[node.upgradeTurretKey];
          if (tr) {
            push();
            translate(0, -4);
            scale(0.72);
            const dummy = {
              type: node.upgradeTurretKey,
              config: tr,
              angle: 0,
              alpha: 255,
              actionTimers: new Map(),
              flashTimer: 0,
              recoil: 0,
              fireRateMultiplier: 1.0,
              uid: `tree_node_upg_${node.id}`
            };
            drawTurretSprite(dummy);
            pop();
          }
          // Small Upward Arrow Badge in Corner
          fill(...color.yellow());
          noStroke();
          circle(12, 10, 16);
          fill(...color.black());
          drawUpwardArrowIcon(12, 10, 8, [0, 0, 0, 255]);
        } else {
          // Upward Arrow Icon
          const arrowColor = node.isUnlocked ? [0, 0, 0, 255] as [number, number, number, number] : [220, 240, 255, alphaVal] as [number, number, number, number];
          drawUpwardArrowIcon(0, -2, 14, arrowColor);
        }
      } else if (node.type === 'loot') {
        // Loot Icon (Sun or Elixir)
        const iconKey = node.isUnlocked && node.lootType === 'elixir' ? 'img_icon_elixir' : 'img_icon_sun';
        const icon = state.assets[iconKey];
        if (icon) {
          imageMode(CENTER);
          if (!node.isUnlocked && !available) {
            tint(255, 120);
          }
          image(icon, 0, -2, 28, 28);
          noTint();
        }
      }
    }
  });
}

function drawNodeTooltip(node: HexUnlockNode, sx: number, sy: number) {
  if (node.type === 'turretUnlock') {
    // Re-use actual gameplay tooltip from UITurretTooltip
    drawNewTurretTooltip({ type: node.turretKey || 't_pea' }, sx, sy);
    return;
  }

  if (node.type === 'turretUpgrade') {
    drawUpgradeNodeTooltip(node, sx, sy);
    return;
  }

  if (node.type === 'loot') {
    drawLootNodeTooltip(node, sx, sy);
    return;
  }

  // Empty node
  drawEmptyNodeTooltip(node, sx, sy);
}

function drawUpgradeNodeTooltip(node: HexUnlockNode, x: number, y: number) {
  const title = (node.isUnlocked && node.upgradeTurretKey)
    ? `${turretTypes[node.upgradeTurretKey]?.name || 'Turret'} Upgrade`
    : 'Turret Upgrade';
  const desc = (node.isUnlocked && node.upgradeDescription)
    ? node.upgradeDescription
    : 'Upgrade an unlocked plant';

  drawTreeNodeTooltipCard(
    x,
    y,
    title,
    desc,
    (iconCx, iconCy) => {
      drawUpwardArrowIcon(iconCx, iconCy, 12, [255, 255, 255, 255]);
    },
    { boxW: 250, boxH: 75, iconRadius: 38 }
  );
}

function drawLootNodeTooltip(node: HexUnlockNode, x: number, y: number) {
  const title = node.ring === 0 ? 'Starting Cache' : (node.isUnlocked ? 'Claimed Loot' : 'Resource Cache');
  const desc = node.ring === 0 ? 'Gain extra resource (+3 Sun)' : (node.isUnlocked ? `+${node.lootAmount} ${node.lootType}` : 'Gain extra resource');

  drawTreeNodeTooltipCard(
    x,
    y,
    title,
    desc,
    (iconCx, iconCy) => {
      const iconKey = (node.isUnlocked && node.lootType === 'elixir') ? 'img_icon_elixir' : 'img_icon_sun';
      const icon = state.assets[iconKey];
      if (icon) {
        imageMode(CENTER);
        image(icon, iconCx, iconCy, 32, 32);
      }
    },
    { boxW: 250, boxH: 75, iconRadius: 38 }
  );
}

function drawEmptyNodeTooltip(node: HexUnlockNode, x: number, y: number) {
  drawTreeNodeTooltipCard(
    x,
    y,
    'Empty',
    'Nothing!',
    undefined,
    { boxW: 200, boxH: 60 }
  );
}

export function handleTurretUnlockTreeClick(
  panelX: number,
  panelY: number,
  panelW: number,
  panelH: number,
  modalX: number,
  modalY: number
): boolean {
  if (!state.turretUnlockTree || state.turretUnlockChoiceModal) return false;

  const screenPanelX = modalX + panelX;
  const screenPanelY = modalY + panelY;

  const localMouseX = mouseX - screenPanelX;
  const localMouseY = mouseY - screenPanelY;

  const mouseInPanel =
    localMouseX >= 0 &&
    localMouseX <= panelW &&
    localMouseY >= 0 &&
    localMouseY <= panelH;

  if (!mouseInPanel) return false;

  // If clicked on an empty area, deselect current selection
  if (!hoveredNode) {
    if (state.turretUnlockTree.selectedNodeId) {
      state.turretUnlockTree.selectedNodeId = null;
      return true;
    }
    return false;
  }

  const node = hoveredNode;
  const available = isNodeAvailable(node);

  if (node.isUnlocked) {
    state.turretUnlockTree.selectedNodeId = null;
    return true;
  }

  if (!available) {
    state.turretUnlockTree.selectedNodeId = null;
    soundEngine.playSFX('btn_disabled');
    return true;
  }

  // Confirmation Step: First click selects the node (turns into purple button)
  if (state.turretUnlockTree.selectedNodeId !== node.id) {
    state.turretUnlockTree.selectedNodeId = node.id;
    soundEngine.playSFX('btn_click');
    return true;
  }

  // Second Click on the purple button: Confirm Unlock
  const currentRaisins = state.raisinCurrency || 0;
  if (node.cost > 0 && currentRaisins < node.cost) {
    soundEngine.playSFX('btn_disabled');
    return true;
  }

  // Deduct Raisins
  if (node.cost > 0) {
    state.raisinCurrency -= node.cost;
  }

  // Clear confirmation state
  state.turretUnlockTree.selectedNodeId = null;

  // Execute Node Action
  if (node.type === 'turretUnlock') {
    // Immediate unlock: trigger golden VFX
    triggerNodeUnlockVFX(node.id, 'gold');

    node.isUnlocked = true;
    const key = node.turretKey || 't_pea';
    if (!state.unlockedTurrets.includes(key)) {
      state.unlockedTurrets.push(key);
    }
    if (state.lockedTurrets) {
      state.lockedTurrets = state.lockedTurrets.filter(
        (t: any) => (typeof t === 'string' ? t : t.type) !== key
      );
    }
    state.showUnlockPopup = true;
    state.lastUnlockedTurret = key;
    state.unlockPopupTimer = 300;
    soundEngine.playSFX('unlock');
    return true;
  } else if (node.type === 'turretUpgrade') {
    const options = generateUpgradeOptions();
    state.turretUnlockChoiceModal = {
      type: 'upgrade',
      nodeId: node.id,
      options,
      openedAtFrame: frameCount
    };
    soundEngine.playSFX('btn_click');
    // Note: NodeUnlockVFX will play after closing the TurretUnlockModal upon confirmation!
    return true;
  } else if (node.type === 'loot') {
    if (node.ring === 0) {
      // Free starting loot claim: +3 Sun!
      triggerNodeUnlockVFX(node.id, 'cyan');

      node.isUnlocked = true;
      node.lootType = 'sun';
      node.lootAmount = 3;
      state.sunCurrency = (state.sunCurrency || 0) + 3;
      soundEngine.playSFX('unlock');
      return true;
    } else {
      state.turretUnlockChoiceModal = {
        type: 'loot',
        nodeId: node.id,
        options: [
          { lootType: 'sun', amount: 20 },
          { lootType: 'elixir', amount: 20 }
        ],
        openedAtFrame: frameCount
      };
      soundEngine.playSFX('btn_click');
      // Note: NodeUnlockVFX will play after closing the TurretUnlockModal upon confirmation!
      return true;
    }
  } else {
    // Empty Node
    triggerNodeUnlockVFX(node.id, 'cyan');
    node.isUnlocked = true;
    soundEngine.playSFX('unlock');
    return true;
  }
}

export function generateUpgradeOptions(fromAttachedOnly: boolean = false): any[] {
  const attachedKeys: string[] = state.player?.attachments ? Array.from(new Set(state.player.attachments.map((a: any) => String(a.type)))) : [];
  
  let pool: string[] = (fromAttachedOnly
    ? (attachedKeys.length > 0 ? attachedKeys : (state.unlockedTurrets || ['t_pea']))
    : (state.unlockedTurrets && state.unlockedTurrets.length > 0
      ? [...state.unlockedTurrets]
      : ['t_pea', 't_laser', 't_wall'])) as string[];

  // Filter pool strictly to turrets that have non-empty upgrades array defined
  const validPool = pool.filter((k: string) => {
    const tr = turretTypes[k];
    if (!tr?.upgrades || !Array.isArray(tr.upgrades) || tr.upgrades.length === 0) return false;
    const applied = state.turretUpgrades[k] || [];
    const available = tr.upgrades.filter((u: any) => u.stackable !== false || !applied.includes(u.id));
    return available.length > 0;
  });

  if (validPool.length === 0) {
    if (fromAttachedOnly) return [];
    // Check all turrets with upgrades
    const allWithUpgrades = Object.keys(turretTypes).filter(k => {
      const tr = turretTypes[k];
      return tr?.upgrades && Array.isArray(tr.upgrades) && tr.upgrades.length > 0;
    });
    if (allWithUpgrades.length === 0) return [];
    validPool.push(...allWithUpgrades);
  }

  const results: any[] = [];
  const pickedIds = new Set<string>();

  for (let attempt = 0; attempt < 20 && results.length < 3; attempt++) {
    const tKey = validPool[Math.floor(Math.random() * validPool.length)];
    const tr = turretTypes[tKey];
    if (!tr?.upgrades) continue;
    const applied = state.turretUpgrades[tKey] || [];
    const available = tr.upgrades.filter((u: any) => (u.stackable !== false || !applied.includes(u.id)) && !pickedIds.has(`${tKey}_${u.id}`));

    if (available.length > 0) {
      const upg = available[Math.floor(Math.random() * available.length)];
      pickedIds.add(`${tKey}_${upg.id}`);
      results.push({
        turretKey: tKey,
        upgradeId: upg.id,
        description: upg.description
      });
    } else {
      const anyAvail = tr.upgrades.filter((u: any) => u.stackable !== false || !applied.includes(u.id));
      if (anyAvail.length > 0) {
        const upg = anyAvail[Math.floor(Math.random() * anyAvail.length)];
        results.push({
          turretKey: tKey,
          upgradeId: upg.id,
          description: upg.description
        });
      }
    }
  }

  return results;
}
