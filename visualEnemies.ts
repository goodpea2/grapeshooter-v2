
import { state } from './state';

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
declare const rectMode: any;
declare const CENTER: any;
declare const rect: any;
declare const beginShape: any;
declare const endShape: any;
declare const vertex: any;
declare const CLOSE: any;
declare const triangle: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const floor: any;
declare const frameCount: any;
declare const sin: any;
declare const cos: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;
declare const TWO_PI: any;
declare const PI: any;
declare const map: any;
declare const random: any;

const OUTLINE_COLOR = [20, 20, 40];
const OUTLINE_WEIGHT = 4;

function drawEye(x: number, y: number, size: number, pupilColor: any = [0, 0, 0], hasGlint: boolean = true) {
  push();
  translate(x, y);
  noStroke(); // Silhouette only on body, eyes are clean
  fill(255);
  ellipse(0, 0, size);
  noStroke();
  fill(pupilColor[0], pupilColor[1], pupilColor[2]);
  ellipse(size * 0.15, 0, size * 0.55); // Forward looking
  if (hasGlint) {
    fill(255, 255, 255, 220);
    ellipse(-size * 0.15, -size * 0.15, size * 0.25);
  }
  pop();
}

function drawHighlight(x: number, y: number, w: number, h: number) {
  push();
  noStroke();
  fill(255, 255, 255, 60);
  rotate(-0.4);
  ellipse(x, y, w, h);
  pop();
}

export function drawPendingSpawn(s: any) {
  const progress = 1 - (s.timer / 60);
  push();
  translate(s.x, s.y);
  
  // Swirling portal
  noFill();
  strokeWeight(4);
  const baseSize = 40;
  for (let i = 0; i < 3; i++) {
    const ang = frameCount * 0.1 + (i * TWO_PI / 3);
    const sz = baseSize * (1 - progress) * (1 + 0.2 * sin(frameCount * 0.2 + i));
    stroke(150, 50, 255, 200 * (1 - progress));
    ellipse(cos(ang) * 5, sin(ang) * 5, sz);
  }
  
  // Central void
  noStroke();
  fill(20, 10, 30, 255 * (1 - progress));
  ellipse(0, 0, baseSize * 0.6 * (1 - progress));
  
  // Particle sparks
  for (let i = 0; i < 5; i++) {
    const pAng = (frameCount * 0.2 + i * 1.5);
    const pr = 10 + 20 * progress;
    fill(200, 100, 255, 255 * (1 - progress));
    ellipse(cos(pAng) * pr, sin(pAng) * pr, 3);
  }
  pop();
}

export function drawEnemy(e: any) {
  if (!e.pos || isNaN(e.pos.x) || isNaN(e.pos.y)) return;

  if (state.debugGizmosEnemies && e.target) {
    push();
    stroke(255, 50, 50, 100);
    strokeWeight(1);
    let tp = e.target.getWorldPos ? e.target.getWorldPos() : (e.target.pos || (e.target.gx !== undefined ? {x: e.target.gx * 34 + 17, y: e.target.gy * 34 + 17} : null));
    if (tp && !isNaN(tp.x) && !isNaN(tp.y)) {
      line(e.pos.x, e.pos.y, tp.x, tp.y);
    }
    pop();
  }

  // Handle Giant prolonged death visual override
  if (e.isDying) return; 

  push();
  // Animation vibration for Giant wind-up
  let vibX = 0;
  let vibY = 0;
  if (e.type === 'e_giant' && e.attackAnimTimer > (e.attackAnimDuration * 0.6)) {
      const vibAmt = map(e.attackAnimTimer, e.attackAnimDuration, e.attackAnimDuration * 0.6, 1, 4);
      vibX = random(-vibAmt, vibAmt);
      vibY = random(-vibAmt, vibAmt);
  }

  translate(e.pos.x + (e.attackOffset?.x || 0) + vibX, e.pos.y + (e.attackOffset?.y || 0) + vibY);
  rotate(e.rot);
  
  const s = e.size;
  let imgKey = e.type === 'e_swarm' ? 'img_swarm_center' : 'img_' + e.type.slice(2);
  if (e.type === 'e_dummyTarget') imgKey = 'img_giant';
  const sprite = state.assets[imgKey];

  if (sprite) {
    imageMode(CENTER);
    image(sprite, 0, 0, 64, 64);
    noTint();

    // Swarm particles handled separately to stay on top of the center asset
    if (e.type === 'e_swarm' && e.swarmParticles) {
      push();
      rotate(-e.rot); // Particles shouldn't rotate with the body
      for (let p of e.swarmParticles) {
        let x = p.offset.x + sin(frameCount * 0.06 + p.phase) * 6;
        let y = p.offset.y + cos(frameCount * 0.06 + p.phase) * 6;
        noStroke();
        fill(e.col[0], e.col[1], e.col[2], 180);
        ellipse(x, y, p.size);
        fill(255, 255, 255, 120);
        ellipse(x - p.size*0.2, y - p.size*0.2, p.size*0.3);
      }
      pop();
    }
  }
  pop();

  // HP Bar
  if (e.health < e.maxHealth || state.debugHP) {
    fill(20, 20, 40, 200);
    noStroke();
    rect(e.pos.x - 14, e.pos.y - e.size / 2 - 12, 28, 5, 2);
    fill(255, 60, 60);
    rect(e.pos.x - 14, e.pos.y - e.size / 2 - 12, (e.health / e.maxHealth) * 28, 5, 2);
    if (state.debugHP) {
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(floor(e.health), e.pos.x, e.pos.y - e.size / 2 - 20);
    }
  }
}
