import { Enemy } from '../enemy';
import { LauncherEnemy } from './type/e_launcher';
import { LeaderEnemy } from './type/e_leader';
import { FrontShieldEnemy } from './type/e_frontshield';
import { ClonerEnemy } from './type/e_cloner';
import { SwarmChickenEnemy } from './type/e_swarm_chicken';
import { HopperEnemy } from './type/e_hopper';
import { LeaderRingEnemy } from './type/e_leader_ring';

/**
 * Registry for custom enemy logic classes.
 * Maps enemy type keys to their specialized class implementations.
 */
export const EnemyLogicMap: Record<string, any> = {
  'e_launcher': LauncherEnemy,
  'e_leader': LeaderEnemy,
  'e_frontshield': FrontShieldEnemy,
  'e_cloner': ClonerEnemy,
  'e_swarm_chicken': SwarmChickenEnemy,
  'e_hopper': HopperEnemy,
  'e_leader_ring': LeaderRingEnemy,
};

/**
 * Factory function to create an Enemy instance.
 * Uses a custom class from the registry if available, otherwise falls back to the base Enemy.
 */
export function createEnemy(x: number, y: number, typeKey: string): Enemy {
  const LogicClass = EnemyLogicMap[typeKey];
  if (LogicClass) {
    return new LogicClass(x, y, typeKey);
  }
  return new Enemy(x, y, typeKey);
}
