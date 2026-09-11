import { state } from '../state';
import { requestSpawn } from '../lvDemo';

declare const createVector: any;
declare const lerp: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const fill: any;
declare const ellipse: any;
declare const sin: any;
declare const cos: any;
declare const TWO_PI: any;
declare const frameCount: any;

export class FlungSpawnPodVFX {
  pos: any;
  startPos: any;
  targetPos: any;
  enemyTypeKey: string;
  progress: number = 0;
  speed: number = 0.045; // ~22 frames flight
  arcHeight: number = 38;
  isDead: boolean = false;
  portalFrames: number = 25;

  constructor(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    enemyTypeKey: string = 'e_basic',
    portalFrames: number = 25
  ) {
    this.startPos = createVector(startX, startY);
    this.targetPos = createVector(targetX, targetY);
    this.pos = createVector(startX, startY);
    this.enemyTypeKey = enemyTypeKey;
    this.portalFrames = portalFrames;
  }

  update() {
    this.progress += this.speed;
    const t = Math.min(1, this.progress);

    // Parabolic arc interpolation
    const lx = lerp(this.startPos.x, this.targetPos.x, t);
    const ly = lerp(this.startPos.y, this.targetPos.y, t);
    const arc = -sin(t * Math.PI) * this.arcHeight;

    this.pos.x = lx;
    this.pos.y = ly + arc;

    if (this.progress >= 1) {
      this.isDead = true;
      // On landing: trigger spawn portal
      requestSpawn(this.targetPos.x, this.targetPos.y, this.enemyTypeKey, this.portalFrames);
    }
  }

  isDone(): boolean {
    return this.isDead;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    const t = Math.min(1, this.progress);
    const scaleFactor = 0.8 + 0.4 * sin(t * Math.PI);

    // Shadow on the ground directly below the pod
    const groundY = lerp(this.startPos.y, this.targetPos.y, t);
    const shadowOffsetY = groundY - this.pos.y;
    noStroke();
    fill(0, 0, 0, 60 * (1 - 0.4 * (this.arcHeight > 0 ? Math.abs(shadowOffsetY) / this.arcHeight : 0)));
    ellipse(0, shadowOffsetY, 12 * scaleFactor, 6 * scaleFactor);

    // Outer subtle glowing aura
    fill(180, 50, 255, 90);
    ellipse(0, 0, 18 * scaleFactor, 18 * scaleFactor);

    // Inner energy core
    fill(240, 140, 255, 230);
    ellipse(0, 0, 9 * scaleFactor, 9 * scaleFactor);

    // Micro sparkling trail
    for (let i = 0; i < 3; i++) {
      const pAng = (frameCount * 0.3 + i * 2.1);
      const pr = 4 + 3 * sin(frameCount * 0.2 + i);
      fill(255, 200, 255, 180);
      ellipse(cos(pAng) * pr, sin(pAng) * pr, 2.5);
    }

    pop();
  }
}
