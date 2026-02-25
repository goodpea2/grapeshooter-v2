
import { state } from './state';
import { GRID_SIZE } from './constants';
import { hasTurretSprite, drawTurretSprite } from './assetTurret';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const scale: any;
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
declare const cos: any;
declare const abs: any;
declare const rectMode: any;
declare const CENTER: any;
declare const LEFT: any;
declare const BOTTOM: any;
declare const CORNER: any;
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
declare const radians: any;

export function drawTurret(t: any) {
  let wPos = t.getWorldPos();
  const config = t.config;
  const actionConfig = config.actionConfig;
  
  // ANIMATION CALCULATION
  const isMoving = !state.isStationary;
  const frames = state.frames;

  // Sync Lilypad body type with occupant
  let isSoft = config.animationBodyType === 'soft';
  if (t.type === 't_lilypad' && t.parent?.attachments) {
    const occupant = t.parent.attachments.find((a: any) => 
      a.hq === t.hq && a.hr === t.hr && a.config.turretLayer !== 'ground'
    );
    if (occupant) {
      isSoft = occupant.config.animationBodyType === 'soft';
    }
  }

  // Determine environmental context
  const gx = floor(wPos.x / GRID_SIZE);
  const gy = floor(wPos.y / GRID_SIZE);
  const liquidAtPos = state.world.getLiquidAt(gx, gy);
  const isOnWater = liquidAtPos === 'l_water';
  
  let animY = 0;
  let animX = 0;
  let animScaleX = 1.0;
  let animScaleY = 1.0;
  let animRot = 0;

  // 1. Idle Animations
  if (!isMoving) {
    if (isOnWater) {
      const bobRate = isSoft ? 0.08 : 0.05;
      const bobAmp = isSoft ? 2.5 : 1.2;
      animY = sin(frames * bobRate) * bobAmp;
    } else {
      const breatheRate = isSoft ? 0.1 : 0.06;
      const breatheAmp = isSoft ? 0.04 : 0.02;
      animScaleY = 1.0 + sin(frames * breatheRate) * breatheAmp;
      animScaleX = 1.0 / animScaleY;
    }
  } 
  // 2. Moving Animations
  else {
    if (isOnWater) {
      const floatRate = 0.12;
      const floatAmp = isSoft ? 3 : 1.5;
      animY = sin(frames * floatRate) * floatAmp;
      animRot = sin(frames * 0.08) * (isSoft ? 0.12 : 0.05);
      animScaleY = 1.0 + abs(sin(frames * floatRate)) * 0.02;
      animScaleX = 1.0 / animScaleY;
    } else {
      const hopSpeed = 0.25;
      const hopHeight = isSoft ? 5 : 3;
      const hopVal = abs(sin(frames * hopSpeed));
      animY = -hopVal * hopHeight;
      animScaleY = 1.0 + (hopVal * 0.1) - 0.05;
      animScaleX = 1.0 / animScaleY;

      if (isSoft) {
          animRot = sin(frames * 0.15) * 0.1;
      }
    }
  }

  // 3. Hurt Shaking
  if (t.hurtAnimTimer > 0) {
    const intensity = (t.hurtAnimTimer / 10) * 3;
    animX += random(-intensity, intensity);
    animY += random(-intensity, intensity);
  }

  // 4. Pulse Action Recoil
  if (t.pulseAnimTimer > 0) {
    const progress = 1 - (t.pulseAnimTimer / 15);
    const squash = sin(progress * Math.PI * 2) * (1 - progress) * 0.4;
    animScaleY -= squash;
    animScaleX += squash;
  }

  push();
  translate(wPos.x + animX, wPos.y + animY);
  rotate(animRot);
  
  if (state.debugGizmosTurrets && state.isStationary) {
    push();
    if (t.target) {
        let tc = t.getTargetCenter();
        if (tc) {
          stroke(255, 255, 100, 150);
          strokeWeight(2);
          line(0, 0, tc.x - wPos.x, tc.y - wPos.y);
        }
    }

    const timersToCheck = ['pulse', 'shoot', 'spawnBulletAtRandom', 'passiveSun'];
    let maxRemaining = 0;
    let activeProgress = 0;

    for (const act of timersToCheck) {
      if (config.actionType.includes(act)) {
        const timer = t.actionTimers.get(act) || -999999;
        let fr = 0;
        if (act === 'pulse') fr = actionConfig.pulseCooldown;
        else if (act === 'shoot') fr = Array.isArray(actionConfig.shootFireRate) ? actionConfig.shootFireRate[0] : actionConfig.shootFireRate;
        else if (act === 'spawnBulletAtRandom') fr = actionConfig.spawnBulletAtRandom.cooldown;
        else if (act === 'passiveSun') fr = actionConfig.sunCooldown;
        
        const total = (fr || 1) / (t.fireRateMultiplier || 1);
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
      noFill();
      stroke(255, 100, 0, 180);
      strokeWeight(4);
      arc(0, 0, t.size + 15, t.size + 15, -HALF_PI, -HALF_PI + TWO_PI * (1 - activeProgress));
      
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      text(`${floor(maxRemaining)}f`, 0, t.size/2 + 15);
      pop();
    }

    let lifeInfo = "";
    if (actionConfig.dieAfterDuration) {
        const rem = actionConfig.dieAfterDuration - t.framesAlive;
        lifeInfo = `Life: ${floor(rem)}f`;
    } else if (actionConfig.dieAfterActionCount) {
        const step = t.actionSteps.get(actionConfig.dieAfterAction) || 0;
        const rem = actionConfig.dieAfterActionCount - step;
        lifeInfo = `Charge: ${rem}`;
    }

    if (lifeInfo) {
        push();
        fill(255, 255, 100);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(9);
        text(lifeInfo, 0, t.size/2 + 25);
        pop();
    }
    pop();
  }

  if (config.actionType.includes('shield') && t.specialActivityLevel > 0.01) {
    // Shield VFX is intentionally not scaled by animScaleX/Y
    const activity = t.specialActivityLevel;
    const rad = (actionConfig.shieldRadius || 50) * activity;
    const pulse = 1.0 + 0.03 * sin(state.frames * 0.05);
    const alpha = (t.alpha / 255) * (100 + 20 * sin(state.frames * 0.04)) * activity;
    
    noFill();
    stroke(100, 200, 255, alpha * 1.5);
    strokeWeight(2);
    ellipse(0, 0, rad * 2 * pulse);
    
    fill(50, 150, 255, alpha * 0.4);
    noStroke();
    ellipse(0, 0, rad * 2 * pulse);

    if (t.shieldImpactAngles && t.shieldImpactAngles.length > 0) {
        noFill();
        strokeWeight(4);
        const flareWidth = radians(30);
        for (let angle of t.shieldImpactAngles) {
            stroke(200, 240, 255, (200 + sin(state.frames * 0.5) * 55) * activity);
            arc(0, 0, rad * 2 * pulse, rad * 2 * pulse, angle - flareWidth/2, angle + flareWidth/2);
            
            stroke(255, 255, 255, 220 * activity);
            strokeWeight(2);
            arc(0, 0, rad * 2 * pulse, rad * 2 * pulse, angle - flareWidth/3, angle + flareWidth/3);
        }
    }
  }

  // Apply scaling after shield to prevent pulse from affecting shield VFX
  scale(animScaleX, animScaleY);

  if (hasTurretSprite(t.type)) {
    drawTurretSprite(t);
  } else {
    const isTrap = ['t_mine', 't_ice', 't2_minespawner', 't2_icebomb', 't2_stun'].includes(t.type);
    const pulseTimer = t.actionTimers.get('pulse') || -999999;
    const cooldown = (actionConfig.pulseCooldown || 0) / (t.fireRateMultiplier || 1);
    const onCooldown = isTrap && (state.frames - pulseTimer) < cooldown;

    push();
    let bc = [...(t.config.color || [100, 100, 100])];
    if (onCooldown) bc = [120, 120, 130];
    
    if (t.flashTimer > 0) {
        if (t.flashType === 'heal') bc = [100, 255, 100];
        else bc = [255, 100, 100];
    }

    stroke(20, 20, 40, t.alpha);
    strokeWeight(3);
    fill(bc[0], bc[1], bc[2], t.alpha);

    if (t.type === 't_spike' || t.type === 't2_spike' || t.type === 't3_spike2') {
      fill(60, 60, 80, t.alpha);
      rectMode(CENTER);
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
      ellipse(0, 0, t.config.size || 22, t.config.size || 22);
      noStroke();
      fill(255, t.alpha * 0.4);
      ellipse(-(t.config.size || 22) * 0.2, -(t.config.size || 22) * 0.2, (t.config.size || 22) * 0.4);
    }
    pop();
  }

  if (state.isStationary && !t.isWaterlogged && !t.isFrosted) {
    if (t.config.actionType.includes('laserBeam') && t.target) {
      let tc = t.getTargetCenter();
      if (tc) {
        const ramp = t.rampFactor || 0;
        const baseWidth = t.config.actionConfig.beamWidth;
        const dynamicWidth = baseWidth * (1 + ramp * 1.5);
        
        stroke(t.config.color[0], t.config.color[1], t.config.color[2], t.alpha * 0.4);
        strokeWeight(dynamicWidth * 2.5 + sin(state.frames * 0.6) * 4);
        line(0, 0, tc.x - wPos.x, tc.y - wPos.y);
        stroke(255, t.alpha * 0.9);
        strokeWeight(dynamicWidth * 0.8);
        line(0, 0, tc.x - wPos.x, tc.y - wPos.y);
      }
    }
  }

  if ((t.type === 't_seed' || t.type === 't_seed2') && t.growthProgress > 0) {
    const maxG = t.config.actionConfig.maxGrowth || 32;
    const gRatio = t.growthProgress / maxG;
    const barW = t.size + 10;
    const barH = 5;
    const glowAlpha = t.isWaterlogged ? 150 + 100 * sin(state.frames * 0.2) : 180;

    push();
    const hRatio = t.health / t.maxHealth;
    const verticalOffset = hRatio < 1.0 ? -t.size/2 - 18 : -t.size/2 - 12;
    translate(0, verticalOffset);
    noStroke();
    fill(20, 180);
    rectMode(CENTER);
    rect(0, 0, barW, barH, 2);
    fill(t.isWaterlogged ? [150, 255, 200, glowAlpha] : [100, 255, 100, 220]);
    rectMode(CORNER);
    rect(-barW/2, -barH/2, barW * gRatio, barH, 2);
    pop();
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

  let hRatio = t.health / t.maxHealth;
  if (hRatio < 1.0) {
    push();
    const barW = t.size + 6;
    const barH = 4;
    translate(0, -t.size/2 - 8);
    noStroke();
    fill(20, 20, 40, t.alpha * 0.8);
    rectMode(CENTER);
    rect(0, 0, barW, barH, 2);
    fill(255, 100, 100, t.alpha);
    rectMode(CORNER);
    rect(-barW/2, -barH/2, barW * hRatio, barH, 2);
    pop();
  }

  pop();
}
