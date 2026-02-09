
declare const push: any;
declare const pop: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const line: any;

export function drawBullet(b: any) {
  if (isNaN(b.pos.x) || isNaN(b.prevPos.x)) return;
  push();
  stroke(b.col);
  strokeWeight(b.config.bulletSize);
  line(b.prevPos.x, b.prevPos.y, b.pos.x, b.pos.y);
  stroke(255, 200);
  strokeWeight(b.config.bulletSize * 0.4);
  line(b.prevPos.x, b.prevPos.y, b.pos.x, b.pos.y);
  pop();
}
