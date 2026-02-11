
import { state } from './state';

declare const push: any;
declare const pop: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const line: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const translate: any;
declare const rotate: any;
declare const atan2: any;

export function drawBullet(b: any) {
  if (isNaN(b.pos.x) || isNaN(b.prevPos.x)) return;
  
  const sprite = b.config.idleAssetImg ? state.assets[b.config.idleAssetImg] : null;

  if (sprite) {
    push();
    translate(b.pos.x, b.pos.y);
    rotate(atan2(b.pos.y - b.prevPos.y, b.pos.x - b.prevPos.x));
    imageMode(CENTER);
    image(sprite, 0, 0, b.config.bulletSize * 2.5, b.config.bulletSize * 2.5);
    pop();
  } else {
    push();
    stroke(b.col);
    strokeWeight(b.config.bulletSize);
    line(b.prevPos.x, b.prevPos.y, b.pos.x, b.pos.y);
    stroke(255, 200);
    strokeWeight(b.config.bulletSize * 0.4);
    line(b.prevPos.x, b.prevPos.y, b.pos.x, b.pos.y);
    pop();
  }
}
