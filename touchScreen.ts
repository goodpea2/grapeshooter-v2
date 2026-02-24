
import { state } from './state';
import { GRID_SIZE, PLAYER_DRAG_MIN_DISTANCE_TILES, PLAYER_DRAG_MAX_DISTANCE_TILES } from './constants';

declare const createVector: any;
declare const atan2: any;
declare const dist: any;
declare const width: any;
declare const height: any;
declare const mouseX: any;
declare const mouseY: any;
declare const pmouseX: any;
declare const pmouseY: any;
declare const map: any;

export function initTouchControls() {
  // We'll use these in index.tsx
}

export function handleTouchStarted(touches: any[]) {
  if (touches.length === 0) return;
  
  const t = touches[0];
  state.touchStartPos = { x: t.x, y: t.y };
  state.playerSpeedMultiplier = 0; // Reset speed multiplier on new touch
  
  // Check if touching UI areas or a turret to allow scrolling/dragging instead of movement
  const isLeftUI = t.x < state.uiWidth; // Turret HUD area
  const isRightUI = (state.showDebug && t.x > width - 280) || (state.activeNPC && t.x > width - 320);
  const isTopUI = t.y < 100; // Clock and stats
  const isTurret = !!state.hoveredTurretInstance;
  
  state.isTouchingUI = isLeftUI || isRightUI || isTopUI || isTurret;
  
  if (!state.isTouchingUI) {
    // Initial touch, don't move yet, wait for drag
    state.touchInputVec = { x: 0, y: 0 };
  }
}

// Removed updateTouchMove as its logic is integrated directly into handleTouchMoved

export function handleTouchMoved(touches: any[]) {
  if (touches.length === 0 || !state.touchStartPos) return;
  
  const t = touches[0];
  
  if (state.isTouchingUI) {
    return;
  }
  
  const dragDistance = dist(state.touchStartPos.x, state.touchStartPos.y, t.x, t.y);
  const dragDistanceTiles = dragDistance / GRID_SIZE;

  if (dragDistanceTiles < PLAYER_DRAG_MIN_DISTANCE_TILES) {
    state.touchInputVec = { x: 0, y: 0 };
    state.playerSpeedMultiplier = 0;
    return;
  }

  // Convert screen touch position to world coordinates
  const touchWorldX = t.x - width / 2 + state.cameraPos.x;
  const touchWorldY = t.y - height / 2 + state.cameraPos.y;

  // Calculate direction vector from player to touch world position
  const dx = touchWorldX - state.player.pos.x;
  const dy = touchWorldY - state.player.pos.y;
  const currentDist = dist(0, 0, dx, dy);

  if (currentDist > 0) {
    state.touchInputVec = { x: dx / currentDist, y: dy / currentDist };
  } else {
    state.touchInputVec = { x: 0, y: 0 };
  }

  // Calculate speed multiplier based on drag distance
  state.playerSpeedMultiplier = map(
    dragDistanceTiles,
    PLAYER_DRAG_MIN_DISTANCE_TILES,
    PLAYER_DRAG_MAX_DISTANCE_TILES,
    0.0,
    1.0
  );
  state.playerSpeedMultiplier = Math.min(1.0, Math.max(0.0, state.playerSpeedMultiplier));
}

export function handleTouchEnded() {
  state.touchStartPos = null;
  state.touchInputVec = { x: 0, y: 0 };
  state.isTouchingUI = false;
  state.playerSpeedMultiplier = 0;
}

export function drawTouchVisuals() {
  if (!state.showTouchGizmo) return;
  
  if (state.touchStartPos && !state.isTouchingUI && (state.touchInputVec.x !== 0 || state.touchInputVec.y !== 0)) {
    const push: any = (window as any).push;
    const pop: any = (window as any).pop;
    const stroke: any = (window as any).stroke;
    const fill: any = (window as any).fill;
    const noFill: any = (window as any).noFill;
    const ellipse: any = (window as any).ellipse;
    const line: any = (window as any).line;
    const strokeWeight: any = (window as any).strokeWeight;
    const translate: any = (window as any).translate;
    const rotate: any = (window as any).rotate;
    const beginShape: any = (window as any).beginShape;
    const endShape: any = (window as any).endShape;
    const vertex: any = (window as any).vertex;
    const CLOSE: any = (window as any).CLOSE;
    const atan2: any = (window as any).atan2;

    push();
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw triangle from player to touch direction
    const angle = atan2(state.touchInputVec.y, state.touchInputVec.x);
    const gizmoDist = 60;
    
    push();
    translate(centerX, centerY);
    rotate(angle);
    
    noFill();
    stroke(100, 255, 255, 150);
    strokeWeight(2);
    
    // Triangle shape pointing in direction
    beginShape();
    vertex(gizmoDist, 0);
    vertex(gizmoDist - 20, -10);
    vertex(gizmoDist - 20, 10);
    endShape(CLOSE);
    
    // Line connecting player to triangle
    line(0, 0, gizmoDist - 20, 0);
    pop();
    
    // Also draw a subtle circle at the touch point
    noFill();
    stroke(255, 80);
    strokeWeight(1);
    ellipse(state.touchStartPos.x, state.touchStartPos.y, 40);
    
    // Line from touch start to current touch position
    stroke(255, 50);
    line(state.touchStartPos.x, state.touchStartPos.y, mouseX, mouseY);
    ellipse(mouseX, mouseY, 10);
    
    pop();
  }
}
