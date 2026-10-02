
import { state } from './state';
import { VISIBILITY_RADIUS, GRID_SIZE } from './constants';


// ==========================================
// Player Run Animation Tuning Parameters
// ==========================================
export const PLAYER_ANIM_CONFIG = {
  // Total running distance (pixels) traveled for one full 6-frame cycle (2 complete hops)
  runCycleDistance: 120, 
  // Maximum hopping height (pixels) at the apex of each step
  hopHeight: 5,
  // Squash and stretch intensity during hopping
  squashStretchAmp: 0.08,
  // Normalized frame offset between sprite frame timing and hopping trajectory (-1.0 to 1.0)
  offsetForRunningFrames: -0.2,
  // Flattens the landing/trough curve relative to the launch apex (0.0 = symmetric sine, 0.5 = pronounced flat landing)
  landingCurveDamper: 0.2,
  // Subtle body rotational sway per hop
  rotSwayAmp: 0.035
};

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

  const runDist = p.runningDistance || 0;
  const cycleDist = Math.max(10, PLAYER_ANIM_CONFIG.runCycleDistance);
  const cycleProgress = (runDist % cycleDist) / cycleDist; // 0.0 to 1.0 (2 hops per cycle)
  
  // Progress within the current single hop (0.0 to 1.0, 2 hops per 6-frame cycle)
  const hopProgress = (cycleProgress * 2) % 1.0;
  const isSecondHop = cycleProgress >= 0.5;

  // Determine the current running frame (1 through 6) with optional timing offset
  const frameOffsetNorm = PLAYER_ANIM_CONFIG.offsetForRunningFrames || 0;
  const frameCycleProgress = ((cycleProgress + frameOffsetNorm) % 1.0 + 1.0) % 1.0;
  const runFrameIndex = Math.floor(frameCycleProgress * 6) % 6; // 0 to 5
  const runFrameNum = runFrameIndex + 1; // 1 to 6

  // Idle / Breathe
  if (!isMoving) {
    const breatheRate = 0.08;
    const breatheAmp = 0.02; // Subtle
    animScaleY = 1.0 + sin(frames * breatheRate) * breatheAmp;
    animScaleX = 1.0 / animScaleY;
  } 
  // Moving / Hop synced to running distance with damped landing curve
  else {
    // Calculate asymmetric hop trajectory (Frame 1/4 = takeoff, Frame 2/5 = crest, Frame 3/6 = landing)
    // When landingCurveDamper > 0, the descent flattens out smoothly into the ground contact phase
    let hopVal = 0;
    if (hopProgress <= 0.5) {
      // Ascending phase (0 -> 1)
      const t = hopProgress / 0.5;
      hopVal = sin(t * HALF_PI);
    } else {
      // Descending / landing phase (1 -> 0) with landing damper
      const t = (hopProgress - 0.5) / 0.5;
      const damper = Math.max(0, PLAYER_ANIM_CONFIG.landingCurveDamper);
      // Cosine fall raised to (1 + damper * 1.5) produces a steeper descent that settles into a flatter landing trough
      const baseFall = cos(t * HALF_PI);
      hopVal = Math.pow(Math.max(0, baseFall), 1.0 + damper * 1.5);
    }

    const maxHopHeight = PLAYER_ANIM_CONFIG.hopHeight;
    const squashAmp = PLAYER_ANIM_CONFIG.squashStretchAmp;
    const swayAmp = PLAYER_ANIM_CONFIG.rotSwayAmp;

    animY = -hopVal * maxHopHeight;
    animScaleY = 1.0 + (hopVal * squashAmp) - (squashAmp * 0.4);
    animScaleX = 1.0 / animScaleY;
    animRot = (isSecondHop ? -1 : 1) * (hopVal * swayAmp);
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

  let spriteKey = isBack ? 'img_player_back_right' : 'img_player_front_right';
  if (isMoving && !isBack) {
    const runKey = `img_player_front_right_run${runFrameNum}`;
    if (state.assets[runKey]) {
      spriteKey = runKey;
    }
  }
  const sprite = state.assets[spriteKey];

  if (sprite) {
    push();
    if (isLeft) scale(-1, 1);
    
    // CONDITION TINTS
    const isRaged = p.conditions.has('c_raged') || p.conditions.has('c_raged_visualonly');
    if (p.flash > 0) tint(255, 100, 100);
    else if (isRaged) tint(255, 100 + sin(state.frames * 0.4) * 100, 200); 
    
    imageMode(CENTER);
    image(sprite, 0, 0, 80, 80);
    noTint();
    pop();
  } else {
    let c = [30, 40, 70];
    const isRaged = p.conditions.has('c_raged') || p.conditions.has('c_raged_visualonly');
    if (p.flash > 0) c = [255, 100, 100];
    else if (isRaged) c = [255, 100, 200];

    stroke(20, 20, 40);
    strokeWeight(4);
    fill(c[0], c[1], c[2]);
    ellipse(0, 0, p.size, p.size);
    const coreP = 0.5 + 0.5 * sin(state.frames * 0.1);
    fill(50, 150, 255, 150 + coreP * 100);
    noStroke();
    ellipse(0, 0, 18, 18);
  }

  // 4. Auto Turret (Mining Laser Arm)
  if (state.isStationary || p.conditions.has('c_raged') || p.conditions.has('c_raged_visualonly')) {
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

  // 5. ClickHolding Pulsing Indicator (circle-pulsing on player only to indicate clickHolding)
  if (p.isClickHolding) {
    push();
    translate(p.pos.x + animX, p.pos.y + animY);
    noFill();
    const r = (p.size / 2 || 16) + 12;
    const pulseD = (r * 2) + sin(state.frames * 0.3) * 6;
    stroke(255, 100, 200, 190);
    strokeWeight(2.5);
    ellipse(0, 0, pulseD, pulseD);
    pop();
  }
}
