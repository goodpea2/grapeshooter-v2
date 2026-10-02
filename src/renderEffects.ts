import { state } from '../state';
import { VISIBILITY_RADIUS, GRID_SIZE } from '../constants';
import { getTime } from '../ui/ui';
import { getLightLevel } from '../lvDemo';
import { drawSynergySystem } from './synergies';

export function drawGlobalLighting() {
  let t = getTime();
  let mins = t.hour * 60 + t.minutes;
  const keys: any[] = [];
  for (let h = 0; h < 24; h++) {
    const l = getLightLevel(h);
    let c = [0, 0, 0, 0];
    if (l === 0) c = [15, 10, 50, 140];
    else if (l === 1) c = [180, 50, 20, 48];
    else c = [0, 0, 0, 0];
    keys.push({ m: h * 60, c });
  }
  keys.push({ m: 24 * 60, c: keys[0].c });
  let k1 = keys[0], k2 = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (mins >= keys[i].m && mins < keys[i + 1].m) { k1 = keys[i]; k2 = keys[i + 1]; break; }
  }
  let f = (mins - k1.m) / (k2.m - k1.m);
  let r = lerp(k1.c[0], k2.c[0], f);
  let g = lerp(k1.c[1], k2.c[1], f);
  let b = lerp(k1.c[2], k2.c[2], f);
  let a = lerp(k1.c[3], k2.c[3], f);

  // GAME OVER TINT Transition (linked to showGameOverPopup)
  if (state.isGameOver) {
    const p = state.gameOverProgress;
    r = lerp(r, 60, p);
    g = lerp(g, 10, p);
    b = lerp(b, 120, p);
    a = lerp(a, 220, p);
  }

  if (a > 1) {
    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
    if (ctx) {
      ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${(a / 255).toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
    } else {
      push(); noStroke(); fill(r, g, b, a); rect(0, 0, width, height); pop();
    }
  }
}

export function drawVisibilityOverlay() {
  const px = width / 2;
  const py = height / 2;
  const innerRadius = (VISIBILITY_RADIUS - 2) * GRID_SIZE;
  const outerRadius = (VISIBILITY_RADIUS) * GRID_SIZE;

  const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
  if (ctx) {
    ctx.save();
    // Use a radial gradient to create the cutout effect
    const grad = ctx.createRadialGradient(px, py, 0, px, py, outerRadius);
    grad.addColorStop(0, 'rgba(12,12,27,0)');
    grad.addColorStop(Math.max(0, Math.min(1, innerRadius / outerRadius)), 'rgba(12,12,27,0)');
    grad.addColorStop(1, 'rgba(12,12,27,1)');
    
    ctx.fillStyle = grad;
    // Drawing a single rect across screen space is instantaneous and handles the entire canvas
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    return;
  }

  push();
  drawingContext.save();
  const grad = drawingContext.createRadialGradient(px, py, 0, px, py, outerRadius);
  grad.addColorStop(0, 'rgba(12,12,27,0)');
  grad.addColorStop(innerRadius / outerRadius, 'rgba(12,12,27,0)');
  grad.addColorStop(1, 'rgba(12,12,27,1)');
  
  drawingContext.fillStyle = grad;
  drawingContext.fillRect(0, 0, width, height);
  drawingContext.restore();
  pop();
}

export function drawDamageVignette() {
  if (!state.damageFlash || state.damageFlash <= 0) return;
  const alpha = state.damageFlash * 0.65;
  const px = width / 2;
  const py = height / 2;
  const outerR = Math.hypot(width, height) * 0.7;
  const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
  if (ctx) {
    ctx.save();
    const grad = ctx.createRadialGradient(px, py, 0, px, py, outerR);
    grad.addColorStop(0, `rgba(220, 20, 20, 0)`);
    grad.addColorStop(0.5, `rgba(220, 20, 20, ${alpha * 0.25})`);
    grad.addColorStop(1, `rgba(220, 20, 20, ${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    return;
  }
  push();
  drawingContext.save();
  const grad = drawingContext.createRadialGradient(px, py, 0, px, py, outerR);
  grad.addColorStop(0, `rgba(220, 20, 20, 0)`);
  grad.addColorStop(0.5, `rgba(220, 20, 20, ${alpha * 0.25})`);
  grad.addColorStop(1, `rgba(220, 20, 20, ${alpha})`);
  drawingContext.fillStyle = grad;
  drawingContext.fillRect(0, 0, width, height);
  drawingContext.restore();
  pop();
}

export function drawAllTurretConnections() {
  drawSynergySystem();
}
