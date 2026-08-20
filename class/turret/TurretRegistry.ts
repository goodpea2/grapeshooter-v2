
import { AttachedTurret } from '../attachedTurret';
import { WorldTurret } from '../worldTurret';
import { JalapenoAttachedTurret, JalapenoWorldTurret } from './type/t0_jalapeno';
import { PeaAttachedTurret, PeaWorldTurret } from './type/t_pea';
import { SnowpeaAttachedTurret, SnowpeaWorldTurret } from './type/t2_snowpea';

/**
 * Registry for custom turret logic classes.
 * Maps turret type keys to their respective Attached and World class implementations.
 */
export const TurretLogicMap: Record<string, { Attached?: any, World?: any }> = {
  't0_jalapeno': { Attached: JalapenoAttachedTurret, World: JalapenoWorldTurret },
  't_pea': { Attached: PeaAttachedTurret, World: PeaWorldTurret },
  't2_snowpea': { Attached: SnowpeaAttachedTurret, World: SnowpeaWorldTurret }
};

/**
 * Factory function to create an AttachedTurret instance.
 * Uses a custom class from the registry if available, otherwise falls back to the base AttachedTurret.
 */
export function createAttachedTurret(type: string, parent: any, hq: number, hr: number): AttachedTurret {
  const entry = TurretLogicMap[type];
  if (entry?.Attached) {
    return new entry.Attached(type, parent, hq, hr);
  }
  return new AttachedTurret(type, parent, hq, hr);
}

/**
 * Factory function to create a WorldTurret instance.
 * Uses a custom class from the registry if available, otherwise falls back to the base WorldTurret.
 */
export function createWorldTurret(type: string, gx: number, gy: number): WorldTurret {
  const entry = TurretLogicMap[type];
  if (entry?.World) {
    return new entry.World(type, gx, gy);
  }
  return new WorldTurret(type, gx, gy);
}
