
import { HEX_DIST } from '../constants';
import { state } from '../state';

declare const sqrt: any;
declare const round: any;
declare const abs: any;
declare const createVector: any;

export function getHexAxial(x: number, y: number) {
  let q = (2/3 * x) / HEX_DIST; 
  let r = (-1/3 * x + sqrt(3)/3 * y) / HEX_DIST;
  let x_ = q; let y_ = -q - r; let z_ = r;
  let rx = round(x_); let ry = round(y_); let rz = round(z_);
  let dx = abs(rx - x_); let dy = abs(ry - y_); let rz_ = abs(rz - z_);
  if (dx > dy && dx > rz_) rx = -ry - rz; 
  else if (dy > rz_) ry = -rx - rz; 
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

export function axialToWorld(q: number, r: number) { 
  return createVector(HEX_DIST * (3/2 * q), HEX_DIST * (sqrt(3)/2 * q + sqrt(3) * r)); 
}

export function isAdjacent(q: number, r: number, exclude: any = null) {
  const neighbors = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];
  for (let [dq, dr] of neighbors) {
    let nq = q + dq;
    let nr = r + dr;
    if (nq === 0 && nr === 0) return true;
    if (state.player.attachments.some((a: any) => a !== exclude && a.hq === nq && a.hr === nr)) return true;
  }
  return false;
}
