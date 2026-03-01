import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';

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

export function drawPersistentDeathVisual(x: number, y: number, size: number, col: any) {
    const cx = floor(x / (CHUNK_SIZE * GRID_SIZE));
    const cy = floor(y / (CHUNK_SIZE * GRID_SIZE));
    const chunk = state.world.getChunk(cx, cy);
    if (chunk) {
        const buffer = chunk.ensureDeathBuffer();
        buffer.push();
        // Local coordinates within the chunk
        const lx = x - cx * CHUNK_SIZE * GRID_SIZE;
        const ly = y - cy * CHUNK_SIZE * GRID_SIZE;
        buffer.translate(lx, ly);
        buffer.noStroke();
        
        const r = col[0];
        const g = col[1];
        const b = col[2];

        // Detailed splat logic from user's reference
        for (let i = 0; i < 5; i++) {
            buffer.fill(r, g, b, random(20, 40));
            let offX = random(-size * 0.4, size * 0.4);
            let offY = random(-size * 0.4, size * 0.4);
            let splatSize = random(size * 0.2, size * 0.5);
            buffer.ellipse(offX, offY, splatSize, splatSize * random(0.7, 1.3));
        }
        
        buffer.pop();
    }
}
