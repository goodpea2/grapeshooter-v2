
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
declare const sin: any;
declare const PI: any;
declare const map: any;
declare const fill: any;
declare const noStroke: any;
declare const ellipse: any;

export function drawBullet(b: any) {
  if (isNaN(b.pos.x) || isNaN(b.prevPos.x)) return;
  
  const sprite = b.config.idleAssetImg ? state.assets[b.config.idleAssetImg] : null;
  const angle = atan2(b.pos.y - b.prevPos.y, b.pos.x - b.prevPos.x);

  if (b.config.highArcConfig) {
    const travelTime = b.config.highArcConfig.arcTravelTime;
    const progress = 1.0 - (b.life / travelTime);
    const arcHeight = b.config.highArcConfig.arcHeight;
    
    const arcVisualOffset = sin(progress * PI);
    const visualScale = 1.0 + arcVisualOffset * 1.5;
    
    // Shadow gets smaller the higher the bullet is flung
    const shadowScale = 1.0 - (arcVisualOffset * 0.6);
    const shadowAlpha = 50 * (1.0 - arcVisualOffset * 0.4);

    // Draw shadow on ground (b.pos.x, b.pos.y is ground-track)
    push();
    translate(b.pos.x, b.pos.y);
    fill(0, shadowAlpha);
    noStroke();
    ellipse(0, 0, b.config.bulletSize * 3 * shadowScale, b.config.bulletSize * 1.5 * shadowScale);
    pop();

    // Draw bullet elevated
    push();
    translate(b.pos.x, b.pos.y - arcVisualOffset * arcHeight);
    rotate(angle);
    if (sprite) {
      imageMode(CENTER);
      image(sprite, 0, 0, b.config.bulletSize * 2.5 * visualScale, b.config.bulletSize * 2.5 * visualScale);
    } else {
      stroke(b.col);
      strokeWeight(b.config.bulletSize * visualScale);
      line(-b.config.bulletLength/2, 0, b.config.bulletLength/2, 0);
    }
    pop();
    return;
  }

  if (sprite) {
    push();
    translate(b.pos.x, b.pos.y);
    rotate(angle);
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
