
import { state } from './state';
import { GRID_SIZE } from './constants';
import { hasTurretSprite, drawTurretSprite } from './assetTurret';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const ellipse: any;
declare const strokeWeight: any;
declare const line: any;
declare const arc: any;
declare const HALF_PI: any;
declare const TWO_PI: any;
declare const sin: any;
declare const rectMode: any;
declare const CENTER: any;
declare const rect: any;
declare const random: any;
declare const beginShape: any;
declare const endShape: any;
declare const vertex: any;
declare const CLOSE: any;
declare const map: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const floor: any;

export function drawTurret(t: any) {
  let wPos = t.getWorldPos();
  const config = t.config;
  const actionConfig = config.actionConfig;
  
  // Debug lines and range indicators
  if (state.debugGizmosTurrets && state.isStationary) {
    push(); // Isolated debug block
    if (t.target) {
        let tc = t.getTargetCenter();
        if (tc) {
          stroke(255, 255, 100, 150);
          strokeWeight(2);
          line(wPos.x, wPos.y, tc.x, tc.y);
        }
    }

    // Cooldown/Arming timer for debug mode
    if (actionConfig.hasUnarmedAsset) {
      const timersToCheck = ['pulse', 'shoot', 'spawnBulletAtRandom'];
      let maxRemaining = 0;
      let activeProgress = 0;

      for (const act of timersToCheck) {
        if (config.actionType.includes(act)) {
          const timer = t.actionTimers.get(act) || -999999;
          let fr = 0;
          if (act === 'pulse') fr = actionConfig.pulseCooldown;
          else if (act === 'shoot') fr = Array.isArray(actionConfig.shootFireRate) ? actionConfig.shootFireRate[0] : actionConfig.shootFireRate;
          else if (act === 'spawnBulletAtRandom') fr = actionConfig.spawnBulletAtRandom.cooldown;
          
          const total = fr / (t.fireRateMultiplier || 1);
          const elapsed = state.frames - timer;
          const remaining = total - elapsed;
          
          if (remaining > maxRemaining) {
            maxRemaining = remaining;
            activeProgress = elapsed / total;
          }
        }
      }

      if (maxRemaining > 0) {
        push();
        translate(wPos.x, wPos.y);
        noFill();
        stroke(255, 100, 0, 180);
        strokeWeight(4);
        arc(0, 0, t.size + 15, t.size + 15, -HALF_PI, -HALF_PI + TWO_PI * activeProgress);
        
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(10);
        text(`${floor(maxRemaining)}f`, 0, t.size/2 + 15);
        pop();
      }
    }
    pop();
  }

  // Draw Sprite if available
  if (hasTurretSprite(t.type)) {
    drawTurretSprite(t);
  } else {
    // FALLBACK PROCEDURAL DRAWING
    const isTrap = ['t_mine', 't_ice', 't2_minespawner', 't2_icebomb', 't2_stun'].includes(t.type);
    const pulseTimer = t.actionTimers.get('pulse') || -999999;
    const cooldown = (actionConfig.pulseCooldown || 0) / (t.fireRateMultiplier || 1);
    const onCooldown = isTrap && (state.frames - pulseTimer) < cooldown;

    push();
    translate(wPos.x, wPos.y);
    
    let bc = [...t.config.color];
    if (onCooldown) bc = [120, 120, 130];

    stroke(20, 20, 40, t.alpha);
    strokeWeight(3);
    fill(bc[0], bc[1], bc[2], t.alpha);

    if (t.type === 't_spike' || t.type === 't2_spike') {
      rectMode(CENTER);
      fill(60, 60, 80, t.alpha);
      rect(0, 0, 30, 30, 6);
      fill(onCooldown ? 150 : 200, onCooldown ? 150 : 200, onCooldown ? 160 : 255, t.alpha);
      for (let i = -0.5; i <= 0.5; i++) {
        for (let j = -0.5; j <= 0.5; j++) {
          if (i !== 0 || j !== 0) {
            push();
            translate(i * 10, j * 10);
            noStroke();
            beginShape();
            vertex(-3, 3); vertex(0, -8); vertex(3, 3);
            endShape(CLOSE);
            pop();
          }
        }
      }
    } else {
      ellipse(0, 0, t.config.size, t.config.size);
      noStroke();
      fill(255, t.alpha * 0.4);
      ellipse(-t.config.size * 0.2, -t.config.size * 0.2, t.config.size * 0.4);
    }
    pop();
  }

  // Common Overlays (Active FX, Status, Health)
  push();
  translate(wPos.x, wPos.y);

  if (state.isStationary && !t.isWaterlogged && !t.isFrosted) {
    if (t.config.actionType.includes('laserBeam') && t.target) {
      let tc = t.getTargetCenter();
      if (tc) {
        stroke(t.config.color[0], t.config.color[1], t.config.color[2], t.alpha * 0.4);
        strokeWeight(t.config.actionConfig.beamWidth * 2.5 + sin(state.frames * 0.6) * 4);
        line(0, 0, tc.x - wPos.x, tc.y - wPos.y);
        stroke(255, t.alpha * 0.9);
        strokeWeight(t.config.actionConfig.beamWidth * 0.8);
        line(0, 0, tc.x - wPos.x, tc.y - wPos.y);
      }
    }
  }

  if (t.frostLevel > 0 && !t.isFrosted) {
    noFill();
    stroke(180, 240, 255, 200);
    strokeWeight(2);
    arc(0, 0, t.size + 6, t.size + 6, -HALF_PI, -HALF_PI + TWO_PI * t.frostLevel);
  }

  if (t.isFrosted) {
    rectMode(CENTER);
    let sk = t.iceCubeHealth < 100 ? random(-1, 1) : 0;
    push();
    translate(sk, sk);
    fill(180, 240, 255, 180);
    stroke(220, 255, 255, 200);
    strokeWeight(2);
    rect(0, 0, t.size + 12, t.size + 12, 4);
    noStroke();
    fill(255, 100);
    rect(-t.size / 4, -t.size / 4, t.size / 2, t.size / 2, 2);
    pop();
  }
  pop();

  // Health Bar
  let hRatio = t.health / t.maxHealth;
  if (hRatio < 1.0) {
    push();
    translate(wPos.x, wPos.y);
    noFill();
    strokeWeight(2);
    stroke(20, 20, 40, t.alpha * 0.8);
    ellipse(0, 0, t.config.size);
    stroke(255, 100, 100, t.alpha);
    arc(0, 0, t.config.size, t.config.size, -HALF_PI, -HALF_PI + TWO_PI * hRatio);
    pop();
  }
}
