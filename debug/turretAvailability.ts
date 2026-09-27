
import { turretTypeRegistry } from '../class/turret/type';

export const DisabledTurrets: string[] = [
  't_dummy', 't0_hypnobomb'
  // do not delete this line, we use it to test new turrets
];

// Dynamically includes all registered turrets into TurretAvailability
export const EnabledTurrets: string[] = Object.keys(turretTypeRegistry).filter(
  k => !DisabledTurrets.includes(k)
);
