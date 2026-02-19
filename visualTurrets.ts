
import { state } from './state';
import { GRID_SIZE } from './constants';
import { hasTurretSprite, drawTurretSprite } from './assetTurret';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
// Added missing scale declaration
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
declare const rectMode: any;
declare const CENTER: any;
// Added missing p5 constant declarations
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
// Added missing radians declaration to fix error on line 147
declare const radians: any;

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
      translate(wPos.x, wPos.y);
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

    // Lifetime / Charge info
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
        translate(wPos.x, wPos.y);
        fill(255, 255, 100);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(9);
        text(lifeInfo, 0, t.size/2 + 25);
        pop();
    }
    pop();
  }

  // Energy Shield Logic
  // REFINED: Strictly only render if turret is Active (Not waterlogged, not frosted) and player is stationary
  const isActive = !t.isWaterlogged && !t.isFrosted;
  if (config.actionType.includes('shield') && state.isStationary && isActive) {
    push();
    translate(wPos.x, wPos.y);
    const rad = actionConfig.shieldRadius || 50;
    const pulse = 1.0 + 0.03 * sin(state.frames * 0.05);
    const alpha = (t.alpha / 255) * (100 + 20 * sin(state.frames * 0.04));
    
    // Main Shield Shell
    noFill();
    stroke(100, 200, 255, alpha * 1.5);
    strokeWeight(2);
    ellipse(0, 0, rad * 2 * pulse);
    
    fill(50, 150, 255, alpha * 0.4);
    noStroke();
    ellipse(0, 0, rad * 2 * pulse);

    // REACTIVE IMPACT FLARES: Lights up localized sections of the shield outline
    if (t.shieldImpactAngles && t.shieldImpactAngles.length > 0) {
        noFill();
        strokeWeight(4);
        const flareWidth = radians(30);
        for (let angle of t.shieldImpactAngles) {
            stroke(200, 240, 255, 200 + sin(state.frames * 0.5) * 55);
            arc(0, 0, rad * 2 * pulse, rad * 2 * pulse, angle - flareWidth/2, angle + flareWidth/2);
            
            stroke(255, 255, 255, 220);
            strokeWeight(2);
            arc(0, 0, rad * 2 * pulse, rad * 2 * pulse, angle - flareWidth/3, angle + flareWidth/3);
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
    
    let bc = [...(t.config.color || [100, 100, 100])];
    if (onCooldown) bc = [120, 120, 130];
    
    // HEAL / DAMAGE FLASH
    if (t.flashTimer > 0) {
        if (t.flashType === 'heal') bc = [100, 255, 100];
        else bc = [255, 100, 100];
    }

    stroke(20, 20, 40, t.alpha);
    strokeWeight(3);
    fill(bc[0], bc[1], bc[2], t.alpha);

    if (t.type === 't_spike' || t.type === 't2_spike' || t.type === 't3_spike2') {
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
      ellipse(0, 0, t.config.size || 22, t.config.size || 22);
      noStroke();
      fill(255, t.alpha * 0.4);
      ellipse(-(t.config.size || 22) * 0.2, -(t.config.size || 22) * 0.2, (t.config.size || 22) * 0.4);
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
        // Visual ramp factor for Inferno Ray
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

  // Seed Growth Bar (Applies to both T1 and T2 seeds)
  if ((t.type === 't_seed' || t.type === 't_seed2') && t.growthProgress > 0) {
    const maxG = t.config.actionConfig.maxGrowth || 32;
    const gRatio = t.growthProgress / maxG;
    const barW = t.size + 10;
    const barH = 5;
    
    // effect when waterlogged
    const glowAlpha = t.isWaterlogged ? 150 + 100 * sin(state.frames * 0.2) : 180;

    push();
    // Offset further up if HP bar is also present
    const hRatio = t.health / t.maxHealth;
    const verticalOffset = hRatio < 1.0 ? -t.size/2 - 18 : -t.size/2 - 12;
    translate(0, verticalOffset);
    scale(1.0);
    
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
  pop();

  // Health Bar (Rectangular Version)
  let hRatio = t.health / t.maxHealth;
  if (hRatio < 1.0) {
    push();
    translate(wPos.x, wPos.y);
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
}
