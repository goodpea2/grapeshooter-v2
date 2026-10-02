import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';


export function drawPersistentDeathVisual(x: number, y: number, size: number, col: any, targetBuffer?: any) {
    if (targetBuffer) {
        targetBuffer.push();
        targetBuffer.translate(x, y);
        targetBuffer.noStroke();
        const r = col[0] !== undefined ? col[0] : 140;
        const g = col[1] !== undefined ? col[1] : 70;
        const b = col[2] !== undefined ? col[2] : 220;

        for (let i = 0; i < 5; i++) {
            targetBuffer.fill(r, g, b, random(20, 40));
            let offX = random(-size * 0.4, size * 0.4);
            let offY = random(-size * 0.4, size * 0.4);
            let splatSize = random(size * 0.2, size * 0.5);
            targetBuffer.ellipse(offX, offY, splatSize, splatSize * random(0.7, 1.3));
        }
        targetBuffer.pop();
        return;
    }

    const cx = floor(x / (CHUNK_SIZE * GRID_SIZE));
    const cy = floor(y / (CHUNK_SIZE * GRID_SIZE));
    const chunk = state.world?.getChunk ? state.world.getChunk(cx, cy) : null;
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
