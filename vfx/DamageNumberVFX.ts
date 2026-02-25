import { state } from '../state';

declare const p5: any;
declare const createVector: any;
declare const color: any;
declare const red: any;
declare const green: any;
declare const blue: any;
declare const map: any;
declare const lerp: any;
declare const lerpColor: any;
declare const random: any;
declare const TWO_PI: any;
declare const cos: any;
declare const sin: any;
declare const pow: any;
declare const noStroke: any;
declare const noFill: any;
declare const fill: any;
declare const beginShape: any;
declare const endShape: any;
declare const vertex: any;
declare const ellipse: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const scale: any;
declare const CLOSE: any;
declare const width: any;
declare const height: any;
declare const rect: any;
declare const distSq: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const triangle: any;
declare const frameCount: any;
declare const max: any;
declare const floor: any;
declare const HALF_PI: any;
declare const line: any;
declare const arc: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const tint: any;
declare const noTint: any;
declare const text: any;
declare const textSize: any;
declare const textAlign: any;
declare const HCENTER: any;
declare const VCENTER: any;

export class DamageNumberVFX {
    pos: any; damage: number; life: number; maxLife: number;
    color: any; startY: number; xOffset: number;

    constructor(x: number, y: number, damage: number, col: any = [255, 255, 255]) {
        this.xOffset = random(-10, 10);
        this.pos = createVector(x, y);
        this.startY = y;
        this.damage = damage;
        this.life = 45; // Duration of the VFX
        this.maxLife = 45;
        this.color = col;
    }

    update() {
        this.life--;
      let t = 1 - (this.life / this.maxLife);
      let eased = 1 - pow(1 - t, 4);
      this.pos.y = lerp(this.startY, this.startY - 30, eased);
    }

    isDone() { return this.life <= 0; }

    display() {
        let alpha = map(this.life, 0, this.maxLife, 0, 255);
        let currentSize = map(this.life, 0, this.maxLife, 10, 14);

        push();
        translate(this.pos.x + this.xOffset, this.pos.y);
        textAlign(CENTER, CENTER);
        textSize(currentSize);
        noStroke();
        fill(this.color[0], this.color[1], this.color[2], alpha);
        text(floor(this.damage), 0, 0);
        pop();
    }
}