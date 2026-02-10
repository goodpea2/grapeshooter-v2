
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
  translate(e.pos.x, e.pos.y);
  rotate(e.rot);
  
  const s = e.size;
  const imgKey = e.type === 'e_swarm' ? 'img_swarm_center' : 'img_' + e.type.slice(2);
  const sprite = state.assets[imgKey];

  if (sprite) {
    if (e.flash > 0) tint(255, 100, 100);
    imageMode(CENTER);
    // Draw sprite with consistent scaling (approx 2x size to let legs/bits breathe outside circular hitbox)
    image(sprite, 0, 0, s * 2, s * 2);
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
  } else {
    // FALLBACK PROCEDURAL DRAWING
    let baseCol = [...e.col];
    if (e.flash > 0) baseCol = [255, 255, 255];

    // PASS 1: Silhouette (The Outline)
    stroke(OUTLINE_COLOR[0], OUTLINE_COLOR[1], OUTLINE_COLOR[2]);
    strokeWeight(OUTLINE_WEIGHT);
    fill(baseCol[0], baseCol[1], baseCol[2]);

    if (e.type === 'e_basic' || e.type === 'e_critter') {
      ellipse(0, 0, s, s * 0.85);
    } 
    else if (e.type === 'e_armor1' || e.type === 'e_armor2' || e.type === 'e_armor3') {
      ellipse(0, 0, s, s);
    }
    else if (e.type === 'e_fast' || e.type === 'e_fastNoDrop') {
      beginShape();
      vertex(s * 0.6, 0);
      vertex(-s * 0.4, s * 0.45);
      vertex(-s * 0.4, -s * 0.45);
      endShape(CLOSE);
    }
    else if (e.type === 'e_giant') {
      ellipse(-s * 0.1, -s * 0.2, s * 0.7, s * 0.6);
      ellipse(-s * 0.1, s * 0.2, s * 0.7, s * 0.6);
      ellipse(s * 0.15, 0, s * 0.7, s * 0.7);
    }
    else if (e.type === 'e_shooting') {
      push();
      rotate(0.5); ellipse(-s * 0.35, -s * 0.25, s * 0.3, s * 0.4);
      rotate(-1.0); ellipse(-s * 0.35, s * 0.25, s * 0.3, s * 0.4);
      pop();
      ellipse(s * 0.3, 0, s * 0.3, s * 0.4);
      ellipse(0, 0, s * 0.8, s * 0.75);
    }
    else if (e.type === 'e_swarm') {
      ellipse(0, 0, s * 0.6);
    }

    // PASS 2: Fill (Internal line removal)
    noStroke();
    fill(baseCol[0], baseCol[1], baseCol[2]);
    if (e.type === 'e_giant') {
      ellipse(-s * 0.1, -s * 0.2, s * 0.7, s * 0.6);
      ellipse(-s * 0.1, s * 0.2, s * 0.7, s * 0.6);
      ellipse(s * 0.15, 0, s * 0.7, s * 0.7);
    }
    else if (e.type === 'e_shooting') {
      push();
      rotate(0.5); ellipse(-s * 0.35, -s * 0.25, s * 0.3, s * 0.4);
      rotate(-1.0); ellipse(-s * 0.35, s * 0.25, s * 0.3, s * 0.4);
      pop();
      ellipse(s * 0.3, 0, s * 0.3, s * 0.4);
      ellipse(0, 0, s * 0.8, s * 0.75);
    }

    // PASS 3: Internal Details
    noStroke();
    if (e.type === 'e_basic' || e.type === 'e_critter') {
      drawHighlight(-s * 0.2, -s * 0.2, s * 0.4, s * 0.2);
      drawEye(s * 0.25, 0, s * 0.35, [0, 0, 0], true);
    } 
    else if (e.type === 'e_armor1') {
      fill(255, 255, 255, 40);
      ellipse(0, 0, s * 0.7);
      fill(baseCol[0], baseCol[1], baseCol[2]);
      ellipse(0, 0, s * 0.55);
      drawHighlight(-s * 0.2, -s * 0.2, s * 0.4, s * 0.2);
      drawEye(s * 0.3, 0, s * 0.3);
    }
    else if (e.type === 'e_armor2') {
      fill(255, 255, 255, 50);
      ellipse(0, 0, s * 0.8);
      fill(baseCol[0], baseCol[1], baseCol[2]);
      ellipse(0, 0, s * 0.65);
      drawHighlight(-s * 0.2, -s * 0.2, s * 0.4, s * 0.2);
      drawEye(s * 0.3, -s * 0.15, s * 0.25);
      drawEye(s * 0.3, s * 0.15, s * 0.25);
    }
    else if (e.type === 'e_armor3') {
      fill(255, 255, 255, 60);
      ellipse(0, 0, s * 0.9);
      fill(baseCol[0], baseCol[1], baseCol[2]);
      ellipse(0, 0, s * 0.75);
      drawHighlight(-s * 0.2, -s * 0.2, s * 0.4, s * 0.2);
      drawEye(s * 0.32, -s * 0.2, s * 0.22);
      drawEye(s * 0.35, 0, s * 0.22);
      drawEye(s * 0.32, s * 0.2, s * 0.22);
    }
    else if (e.type === 'e_fast' || e.type === 'e_fastNoDrop') {
      drawHighlight(-s * 0.1, -s * 0.1, s * 0.3, s * 0.15);
      drawEye(s * 0.2, 0, s * 0.25);
    }
    else if (e.type === 'e_giant') {
      drawHighlight(-s * 0.2, -s * 0.3, s * 0.3, s * 0.15);
      drawHighlight(-s * 0.2, s * 0.1, s * 0.3, s * 0.15);
      drawHighlight(s * 0.1, -s * 0.1, s * 0.3, s * 0.15);
      const eyeCol = [255, 230, 50];
      drawEye(s * 0.35, -s * 0.15, s * 0.18, eyeCol);
      drawEye(s * 0.4, 0, s * 0.18, eyeCol);
      drawEye(s * 0.35, s * 0.15, s * 0.18, eyeCol);
    }
    else if (e.type === 'e_shooting') {
      drawHighlight(-s * 0.1, -s * 0.15, s * 0.4, s * 0.2);
      drawEye(s * 0.2, 0, s * 0.25);
    }
    else if (e.type === 'e_swarm') {
      if (e.swarmParticles) {
        push();
        rotate(-e.rot);
        for (let p of e.swarmParticles) {
          let x = p.offset.x + sin(frameCount * 0.06 + p.phase) * 6;
          let y = p.offset.y + cos(frameCount * 0.06 + p.phase) * 6;
          fill(e.col[0], e.col[1], e.col[2], 180);
          ellipse(x, y, p.size);
          fill(255, 255, 255, 120);
          ellipse(x - p.size*0.2, y - p.size*0.2, p.size*0.3);
        }
        pop();
      }
      drawEye(0, 0, s * 0.3, [0, 0, 0], true);
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
