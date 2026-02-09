
# Core Explorer - Game Documentation

## Core Mechanics (v3.0)
- **Mining**: Player core has an auto-mining turret that targets the nearest block or enemy. Mining projectiles travel to blocks to deal damage.
- **Base Expansion**: Turrets attach to the core using a hex-axial grid system. Base expansion is only available while stationary.
- **Stationary vs Moving**: Turrets fade to low opacity and systems (like auto-mining/combat) become less active when in motion.

## Ingredient-Based Merging System
- **T1 Base Turrets**: Peashooter, Mining Laser, Wallnut, Landmine, Iceberg.
- **Recipe Containers**: Every turret (T1, T2, T3) acts as a container for its base T1 ingredients.
- **Dynamic Merging**: Merging now calculates the combined ingredient pool of two turrets (or one placed turret and one source). 
- **Recipe Matching**: The system scans `TURRET_RECIPES` to find a match where:
  - All mandatory base ingredients are present.
  - Remaining slots are filled by duplicates of the mandatory set.
  - Total ingredient count matches the tier requirements (T2 = 2, T3 = 3).
- **Flexible Merging Paths**: You can merge a T2 with a T1, or two T1s, as long as the total base ingredient count and types match a valid T3 recipe.

## Modular Health Triggers
- **Health Ratios**: Enemy behaviors (like summoning minions) are driven by health ratios. A trigger at `0` acts as a modular "on-death" effect.

## Visual Polish & Rendering
- **Outermost Silhouette**: Enemies use a **Two-Pass Rendering Strategy**. 
  - *Pass 1*: All body components are rendered with a thick dark stroke to establish a collective silhouette. 
  - *Pass 2*: Components are redrawn with no stroke using the body color, erasing internal overlap lines and creating a unified "sticker-like" appearance.
- **Eye Rendering**: Eyes are rendered without outlines to maintain a clean, expressive look.

## Structured Overlays (v2.9)
- **Data-Driven Template**: Overlays (ores, TNT, structures) use the `overlayTypes` registry.
- **Hostile Structures**: Objects like `Sniper Tower` are flagged as `isEnemy`. They feature high-precision laser math that calculates relative positioning from block centers to player centers.
- **Loot Tables**: Destruction results (Sun, Turret Crates) are driven by `lootConfigOnDeath` keys.
- **Dynamic Hinting**: Hidden blocks containing overlays provide visual hints via `concealedSparkleVfx` when exposed to the player's detection radius.

## Dynamic World Gen
- **Multi-Pot Accumulator**: Exploring new chunks accumulates "pot" values (Sun, TNT, Crate, etc.) based on `ChunkLevel`.
- **Probabilistic Spawning**: New chunks roll a chance to "spend" these pots.
- **Legible Spawning**: The system uses `isLegibleSpot` to ensure enemies and loot only spawn on navigable ground or safe liquids, preventing entities from being trapped in obsidian or lava.

## Liquid Environments
- **Water**: Standard movement.
- **Ice**: High friction, leaves ice trails. Turrets become "Frosted" (Locked) if stationary for too long.
- **Tar**: High viscosity. Reduces movement speed and fire rates.
- **Lava**: Dangerous tick-damage and applied `c_burning`.
