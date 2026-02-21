
import { GRID_SIZE, HOUR_FRAMES } from './constants';

const PURPLE_BASE = [142, 80, 200];
const PURPLE_ELITE = [100, 40, 180];
const PURPLE_GLOW = [200, 100, 255];

export const enemyTypes: any = {
  e_fast:    { cost: 10, health: 30,  speed: 0.8, size: 22, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 16 }, col: PURPLE_BASE, lootConfigOnDeath: 'e_fast' },
  e_basic:   { cost: 10, health: 60, speed: 0.4, size: 28, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_BASE, lootConfigOnDeath: 'e_basic' },
  e_armor1:  { cost: 20, health: 120, speed: 0.4, size: 32, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_BASE, lootConfigOnDeath: 'e_armor1' },
  e_armor2:  { cost: 40, health: 240, speed: 0.4, size: 34, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_ELITE, lootConfigOnDeath: 'e_armor2' },
  e_armor3:  { cost: 70, health: 480, speed: 0.4, size: 36, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_ELITE, lootConfigOnDeath: 'e_armor3' },
  e_shooting:{ cost: 30, health: 120, speed: 0.3, size: 30, actionType: ['moveDefault', 'shoot'], actionConfig: { bulletTypeKey: 'b_enemy_basic', shootRange: GRID_SIZE*4, shootFireRate: 60 }, col: PURPLE_GLOW, lootConfigOnDeath: 'e_shooting' },
  e_swarm:   { cost: 30, health: 120, speed: 0.3, size: 34, actionType: ['moveDefault', 'meleeAttack', 'spawnEnemy'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 16, enemyTypeToSpawn: ['e_critter'], spawnBudget: 16, spawnRadius: 60, spawnTriggerOnHealthRatio: [0], maxSpawnBudget: 16 }, col: PURPLE_GLOW, lootConfigOnDeath: 'e_swarm' },
  e_critter: { cost: 2,  health: 5,  speed: 0.6, size: 14, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 1, attackFireRate: 15, meleeAttackRange: 4 }, col: [220, 180, 255], lootConfigOnDeath: 'e_critter' },
  e_giant:   { cost: 250, health: 1800, speed: 0.2, size: 60, actionType: ['moveDefault', 'meleeAttack', 'spawnEnemy'], actionConfig: { damage: 100, attackFireRate: 60, meleeAttackRange: 24, enemyTypeToSpawn: ['e_fast'], spawnBudget: 10, spawnRadius: 80, spawnTriggerOnHealthRatio: [0.75, 0.5, 0.25], maxSpawnBudget: 30 }, col: PURPLE_ELITE, lootConfigOnDeath: 'e_giant' },
  e_fastNoDrop:{ cost: 10, health: 30, speed: 1.0, size: 22, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 16 }, col: PURPLE_BASE },
  e_dummyTarget: { cost: 0, health: 50000, speed: 0, size: 60, actionType: [], actionConfig: {}, col: [150, 150, 150] }
};
