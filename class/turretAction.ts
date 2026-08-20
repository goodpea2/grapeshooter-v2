
import { Turret } from './turret';

export interface TurretActionConfig {
  turret: Turret;
  [key: string]: any;
}

export abstract class TurretAction {
  turret: Turret;
  tags: string[] = [];

  constructor(config: TurretActionConfig) {
    this.turret = config.turret;
  }

  abstract update(): void;
  abstract canExecute(): boolean;
  abstract isReady(): boolean;
  
  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    return 0;
  }

  needsLOS(): boolean {
    return true;
  }

  needsRotationLock(): boolean {
    return false;
  }

  execute() {
    this.turret.onActionExecute(this.constructor.name);
    this.performExecute();
    this.turret.onActionComplete(this.constructor.name);
  }

  abstract performExecute(): void;

  onTargetKilled(target: any) {}

  onDamage(dmg: number, source?: any): boolean {
    return false;
  }

  isLocked(): boolean {
    return this.turret.isActionLocked(this.tags);
  }

  lock(tags: string[]) {
    this.turret.lockActions(tags);
  }

  unlock(tags: string[]) {
    this.turret.unlockActions(tags);
  }
}
