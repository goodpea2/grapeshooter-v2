
import { GRID_SIZE } from './constants';

declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const rect: any;

export function drawDecoration(feature: string, gx: number, gy: number, opacity: number) {
  noStroke();
  if (feature === 'moss') {
    fill(100, 255, 100, opacity * 0.6);
    ellipse(GRID_SIZE * 0.3, GRID_SIZE * 0.3, GRID_SIZE * 0.4);
  } else if (feature === 'flower') {
    fill(255, 100, 200, opacity);
    ellipse(GRID_SIZE * 0.7, GRID_SIZE * 0.7, 6);
  } else if (feature === 'crystal') {
    fill(200, 200, 255, opacity * 0.7);
    rect(GRID_SIZE * 0.5, GRID_SIZE * 0.2, 8, 12, 2);
  } else if (feature === 'rubble') {
    fill(30, opacity * 0.6);
    rect(GRID_SIZE * 0.2, GRID_SIZE * 0.6, 7, 7, 3);
  }
}
