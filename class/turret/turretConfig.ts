import { Turret } from '../turret';
import { TurretAction } from '../turretAction';

export interface TurretConfig {
  name: string;
  cost?: number;
  costs?: { [key: string]: number };
  costAlmanac?: { [key: string]: number };
  drops?: { [key: string]: number };
  health: number;
  color: number[];
  size: number;
  tier: number;
  isSpecial?: boolean;
  tooltip: string;
  isActiveWhileMoving?: boolean;
  animationBodyType?: 'soft' | 'tough' | 'none';
  actionType: string[];
  actionConfig: any;
  targetType: string[];
  targetConfig: any;
  explosiveGrowth?: boolean;
  upgradeCosts?: number[];
  classes?: string[];
  cooldownHours?: number;
  turretLayer?: 'ground' | 'normal';
  randomRotation?: boolean;
  randomFlip?: boolean;
  smoothRotation?: boolean;
  farmConfig?: any;
  unarmedAssetApplyToAction?: string[];
  collideWithEnemy?: boolean;
  renderBehindEnemy?: boolean;
  isSpecialActivity?: boolean;
  specialActivityLevel?: number;
  countTowardAttachedCapacity?: boolean;
  CountTowardAttachedCapacity?: boolean;
  getActions?: (turret: Turret) => TurretAction[];
}
