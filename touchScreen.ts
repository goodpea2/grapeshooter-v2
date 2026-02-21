
import { state } from './state';

declare const createVector: any;
declare const dist: any;
declare const width: any;
declare const height: any;
declare const mouseX: any;
declare const mouseY: any;
declare const pmouseX: any;
declare const pmouseY: any;

export function initTouchControls() {
  // We'll use these in index.tsx
}

export function handleTouchStarted(touches: any[]) {
  if (touches.length === 0) return;
  
  const t = touches[0];
  state.touchStartPos = { x: t.x, y: t.y };
  
  // Check if touching UI areas or a turret to allow scrolling/dragging instead of movement
  const isLeftUI = t.x < state.uiWidth; // Turret HUD area
  const isRightUI = (state.showDebug && t.x > width - 280) || (state.activeNPC && t.x > width - 320);
  const isTopUI = t.y < 100; // Clock and stats
  const isTurret = !!state.hoveredTurretInstance;
  
  state.isTouchingUI = isLeftUI || isRightUI || isTopUI || isTurret;
  
  if (!state.isTouchingUI) {
    updateTouchMove(t);
  }
}

function updateTouchMove(t: any) {
  const dx = t.x - width / 2;
  const dy = t.y - height / 2;
  const d = Math.sqrt(dx * dx + dy * dy);
  
  if (d > 20) {
    const mag = Math.min(1.0, d / 100); 
    state.touchInputVec = { x: (dx / d) * mag, y: (dy / d) * mag };
  } else {
    state.touchInputVec = { x: 0, y: 0 };
  }
}

export function handleTouchMoved(touches: any[]) {
  if (touches.length === 0) return;
  
  const t = touches[0];
  
  if (state.isTouchingUI) {
    return;
  }
  
  updateTouchMove(t);
}

export function handleTouchEnded() {
  state.touchStartPos = null;
  state.touchInputVec = { x: 0, y: 0 };
  state.isTouchingUI = false;
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
