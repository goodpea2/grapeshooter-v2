
import { state } from './state';
import { GRID_SIZE } from './constants';

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

export function drawTurret(t: any) {
  let wPos = t.getWorldPos();
  if (state.debugGizmosTurrets && t.target && state.isStationary) {
    let tc = t.getTargetCenter();
    if (tc) {
      push();
      stroke(255, 255, 100, 150);
      strokeWeight(2);
      line(wPos.x, wPos.y, tc.x, tc.y);
      pop();
    }
  }

  const isTrap = ['t_mine', 't_ice', 't2_minespawner', 't2_icebomb', 't2_stun'].includes(t.type);
  const pulseTimer = t.actionTimers.get('pulse') || -999999;
  const cooldown = (t.config.actionConfig.pulseCooldown || 0) / t.fireRateMultiplier;
  const onCooldown = isTrap && (state.frames - pulseTimer) < cooldown;

  push();
  translate(wPos.x, wPos.y);
  let hRatio = t.health / t.maxHealth;
  
  // Body Color Selection
  let bc = [...t.config.color];
  if (onCooldown) {
    // If not armed, show gray body
    bc = [120, 120, 130];
  }

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

  if (isTrap) {
    if (onCooldown) {
      // Unarmed state - Just a dark overlay to make it look empty
      fill(0, 80); noStroke();
      ellipse(0, 0, t.config.size * 0.8);
    } else {
      // Armed state - Unique idle VFX bits
      const g = 0.5 + 0.5 * sin(state.frames * 0.15);
      
      // Core glow based on type
      let glowCol = [255, 255, 100];
      if (t.type === 't_ice' || t.type === 't2_icebomb') glowCol = [150, 240, 255];
      if (t.type === 't2_stun') glowCol = [200, 200, 255];
      if (t.type === 't_mine' || t.type === 't2_minespawner') glowCol = [255, 100, 50];

      fill(glowCol[0], glowCol[1], glowCol[2], 50 + g * 100);
      noStroke();
      ellipse(0, 0, t.config.size * 0.6);
      
      fill(255, 255, 255, 100 + g * 100);
      ellipse(0, 0, t.config.size * 0.2);
    }
  }

  if (state.isStationary && !t.isWaterlogged && !t.isFrosted) {
    if (t.config.actionType.includes('laserBeam') && t.target) {
      let tc = t.getTargetCenter();
      if (tc) {
        stroke(bc[0], bc[1], bc[2], t.alpha * 0.4);
        strokeWeight(t.config.actionConfig.beamWidth * 2.5 + sin(state.frames * 0.6) * 4);
        line(0, 0, tc.x - wPos.x, tc.y - wPos.y);
        stroke(255, t.alpha * 0.9);
        strokeWeight(t.config.actionConfig.beamWidth * 0.8);
        line(0, 0, tc.x - wPos.x, tc.y - wPos.y);
        rotate(t.angle);
        fill(20, 20, 40, t.alpha);
        stroke(255, t.alpha * 0.5);
        strokeWeight(1);
        rect(4 - t.recoil, -4, 12, 8, 2);
      }
    } else if (t.config.actionType.includes('shoot')) {
      rotate(t.angle);
      let bW = t.config.size * 0.5;
      fill(20, 20, 40, t.alpha);
      stroke(255, t.alpha * 0.5);
      strokeWeight(2);
      rect(5 - t.recoil, -bW / 2, 14, bW, 3);
      noStroke();
      fill(bc[0], bc[1], bc[2], t.alpha);
      rect(10 - t.recoil, -bW / 2 + 2, 4, bW - 4, 1);
    } else if (t.config.actionType.includes('pulse') && t.type !== 't_spike' && !isTrap) {
      let lt = t.actionTimers.get('pulse') || -9999;
      if (state.frames - lt < t.config.actionConfig.pulseCooldown / t.fireRateMultiplier) {
        fill(40, 40, 60, t.alpha * 0.6);
        noStroke();
        ellipse(0, 0, 12);
      } else {
        let g = 0.5 + 0.5 * sin(state.frames * 0.25);
        fill(255, 255, 100, t.alpha * (0.4 + 0.6 * g));
        noStroke();
        ellipse(0, 0, 14);
        fill(255, t.alpha);
        ellipse(0, 0, 6);
      }
    }
    
    // Launching visual for special spawnBulletAtRandom actions
    if (t.config.actionType.includes('spawnBulletAtRandom') && !onCooldown) {
        const lastSpawn = t.actionTimers.get('spawnBulletAtRandom') || -99999;
        if (state.frames - lastSpawn < 30) {
            // Recoil/Flash visual for launch
            fill(255, 255, 255, map(state.frames - lastSpawn, 0, 30, 200, 0));
            ellipse(0, 0, t.config.size * 1.2);
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
