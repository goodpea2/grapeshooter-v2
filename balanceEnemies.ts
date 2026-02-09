import { GRID_SIZE, HOUR_FRAMES } from './constants';

const PURPLE_BASE = [142, 80, 200];
const PURPLE_ELITE = [100, 40, 180];
const PURPLE_GLOW = [200, 100, 255];

export const enemyTypes: any = {
  e_fast:    { cost: 10, health: 50,  speed: 1.0, size: 22, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30 }, col: PURPLE_BASE },
  e_basic:   { cost: 10, health: 100, speed: 0.5, size: 28, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30 }, col: PURPLE_BASE },
  e_armor1:  { cost: 25, health: 300, speed: 0.5, size: 32, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30 }, col: PURPLE_BASE },
  e_armor2:  { cost: 50, health: 600, speed: 0.5, size: 34, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30 }, col: PURPLE_ELITE },
  e_armor3:  { cost: 90, health: 1200, speed: 0.5, size: 36, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30 }, col: PURPLE_ELITE },
  e_shooting:{ cost: 30, health: 200, speed: 0.4, size: 30, actionType: ['moveDefault', 'shoot'], actionConfig: { bulletTypeKey: 'b_enemy_basic', shootRange: GRID_SIZE*4, shootFireRate: 60 }, col: PURPLE_GLOW },
  e_swarm:   { cost: 30, health: 200, speed: 0.4, size: 34, actionType: ['moveDefault', 'meleeAttack', 'spawnEnemy'], actionConfig: { damage: 5, attackFireRate: 30, enemyTypeToSpawn: ['e_critter'], spawnBudget: 16, spawnRadius: 60, spawnTriggerOnHealthRatio: [0], maxSpawnBudget: 16 }, col: PURPLE_GLOW },
  e_critter: { cost: 2,  health: 10,  speed: 0.8, size: 14, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 2, attackFireRate: 30 }, col: [220, 180, 255] },
  e_giant:   { cost: 200, health: 3000, speed: 0.3, size: 60, actionType: ['moveDefault', 'meleeAttack', 'spawnEnemy'], actionConfig: { damage: 300, attackFireRate: 60, enemyTypeToSpawn: ['e_fast'], spawnBudget: 10, spawnRadius: 80, spawnTriggerOnHealthRatio: [0.75, 0.5, 0.25], maxSpawnBudget: 30 }, col: PURPLE_ELITE },
  e_fastNoDrop:{ cost: 10, health: 50, speed: 1.0, size: 22, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30 }, col: PURPLE_BASE }
};