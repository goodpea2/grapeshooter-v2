
import { state } from './state';
import { VISIBILITY_RADIUS, GRID_SIZE } from './constants';

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
declare const rect: any;
declare const sin: any;
declare const frameCount: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const tint: any;
declare const noTint: any;
declare const abs: any;
declare const PI: any;
declare const HALF_PI: any;

export function drawPlayer(p: any) {
  if (!p.pos) return;

  // 1. Draw Ground Visibility Light
  push();
  let grad = (window as any).drawingContext.createRadialGradient(
    p.pos.x, p.pos.y, 0, 
    p.pos.x, p.pos.y, VISIBILITY_RADIUS * GRID_SIZE
  );
  grad.addColorStop(0, 'rgba(100, 150, 255, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  (window as any).drawingContext.fillStyle = grad;
  noStroke();
  ellipse(p.pos.x, p.pos.y, VISIBILITY_RADIUS * GRID_SIZE * 2.8);
  pop();

  // 2. Draw Attachments (Behind Layer)
  p.displayAttachments(false);

  // 3. Animation Calculation (Soft Body Style)
  const isMoving = !state.isStationary;
  const frames = state.frames;
  
  let animY = 0;
  let animX = 0;
  let animScaleX = 1.0;
  let animScaleY = 1.0;
  let animRot = 0;

  // Idle / Breathe
  if (!isMoving) {
    const breatheRate = 0.08;
    const breatheAmp = 0.02; // Subtle
    animScaleY = 1.0 + sin(frames * breatheRate) * breatheAmp;
    animScaleX = 1.0 / animScaleY;
  } 
  // Moving / Hop
  else {
    const hopSpeed = 0.2;
    const hopHeight = 3; // Subtle
    const hopVal = abs(sin(frames * hopSpeed));
    animY = -hopVal * hopHeight;
    animScaleY = 1.0 + (hopVal * 0.06) - 0.03;
    animScaleX = 1.0 / animScaleY;
    animRot = sin(frames * 0.12) * 0.05;
  }

  // Hurt Shaking
  if (p.hurtAnimTimer > 0) {
    const intensity = (p.hurtAnimTimer / 10) * 2;
    animX += (Math.random() - 0.5) * intensity * 2;
    animY += (Math.random() - 0.5) * intensity * 2;
  }

  // Pulse Action Recoil
  if (p.pulseAnimTimer > 0) {
    const progress = 1 - (p.pulseAnimTimer / 15);
    const squash = sin(progress * Math.PI * 2) * (1 - progress) * 0.2; // Subtle
    animScaleY -= squash;
    animScaleX += squash;
  }

  // 4. Player Core Sprite
  push();
  translate(p.pos.x + animX, p.pos.y + animY);
  rotate(animRot);
  scale(animScaleX, animScaleY);

  let isLeft = false;
  let isBack = false;

  // PRIORITY FIX: If movement keys are pressed, lock rotation to input direction 
  // even if slamming into a wall (velocity = 0).
  if (p.isMovingIntent) {
    const input = p.moveInputVec;
    if (abs(input.x) > 0.1) isLeft = input.x < 0;
    if (abs(input.y) > 0.1) isBack = input.y < 0;
  } 
  // If no keys pressed, we only check aiming if the stationary timer has kicked in
  else if (state.isStationary) {
    const ang = p.autoTurretAngle; // Range: -PI to PI
    if (abs(ang) > HALF_PI) isLeft = true;
    if (ang < 0) isBack = true;
  }
  // Fallback: Use last known actual movement if keys are released but not yet stationary
  else {
    const dx = p.pos.x - p.prevPos.x;
    const dy = p.pos.y - p.prevPos.y;
    if (abs(dx) > 0.1) isLeft = dx < 0;
    if (abs(dy) > 0.1) isBack = dy < 0;
  }

  const spriteKey = isBack ? 'img_player_back_right' : 'img_player_front_right';
  const sprite = state.assets[spriteKey];

  if (sprite) {
    push();
    if (isLeft) scale(-1, 1);
    
    // CONDITION TINTS
    const isRaged = p.conditions.has('c_raged');
    if (p.flash > 0) tint(255, 100, 100);
    else if (isRaged) tint(255, 100 + sin(frameCount * 0.4) * 100, 200); 
    
    imageMode(CENTER);
    image(sprite, 0, 0, 80, 80);
    noTint();
    pop();
  } else {
    let c = [30, 40, 70];
    const isRaged = p.conditions.has('c_raged');
    if (p.flash > 0) c = [255, 100, 100];
    else if (isRaged) c = [255, 100, 200];

    stroke(20, 20, 40);
    strokeWeight(4);
    fill(c[0], c[1], c[2]);
    ellipse(0, 0, p.size, p.size);
    const coreP = 0.5 + 0.5 * sin(frameCount * 0.1);
    fill(50, 150, 255, 150 + coreP * 100);
    noStroke();
    ellipse(0, 0, 18, 18);
  }

  // 4. Auto Turret (Mining Laser Arm)
  if (state.isStationary || p.conditions.has('c_raged')) {
    push();
    rotate(p.autoTurretAngle);
    stroke(20, 20, 40);
    strokeWeight(2);
    fill(50, 150, 255);
    rect(14 - (p.recoil || 0), -5, 14, 10, 3);
    noStroke();
    fill(255, 150);
    rect(22 - (p.recoil || 0), -3, 4, 6, 1);
    pop();
  }

  pop();
}
