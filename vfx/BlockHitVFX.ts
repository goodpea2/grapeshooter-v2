
import { state } from '../state';
import { GRID_SIZE } from '../constants';

declare const createVector: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noStroke: any;
declare const rect: any;
declare const map: any;
declare const CENTER: any;
declare const rectMode: any;

export class BlockHitVFX {
  pos: any; life: number = 10; maxLife: number = 10;
  constructor(x: number, y: number) {
    this.pos = createVector(x, y);
  }
  update() {
    this.life--;
  }
  isDone() { return this.life <= 0; }
  display() {
    const alpha = map(this.life, 0, this.maxLife, 0, 64);
    push();
    translate(this.pos.x, this.pos.y);
    rectMode(CENTER);
    noStroke();
    fill(255, 255, 255, alpha);
    rect(0, 0, GRID_SIZE, GRID_SIZE, 12);
    pop();
  }
}
