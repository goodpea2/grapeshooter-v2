# Core Explorer: Technical & Design Library

Core Explorer (v3.0) is a procedural 2D survival game built with **TypeScript** and **p5.js**. It features a unique mobile-base expansion system, a deep merging matrix, and a dynamic ecosystem.

---

## 🏗️ The Hex-Axial Grid System
Base expansion is built on a **Hex-Axial Coordinate System** (q, r).
- **Core (0,0)**: The player's main unit. It houses the auto-mining turret.
- **Attachments**: Turrets are snapped to the hex grid using axial-to-world conversion logic.
- **Adjacency Requirement**: New turrets must be placed adjacent to an existing unit.
- **Movement**: The entire base is physics-linked. When the player moves, the world-space offsets of all attachments are recalculated in real-time.

## 🌍 Procedural World Generation
The world is generated in **16x16 block chunks** using multi-layered Simplex noise.
- **Obstacle Noise**: Determines block density and material (Dirt -> Obsidian).
- **Liquid System**:
    - **Water**: Standard flow.
    - **Ice**: Frictionless movement; causes "Frosted" status to turrets.
    - **Tar**: 50% fire rate and movement penalty.
    - **Lava**: High tick damage; applies "Burning" status.
- **The "Pot" System**: Feature generation (Sun ores, TNT, Spawners) uses an **Accumulated Pot** logic. Value accumulates over explored distance and is "spent" to spawn clusters, ensuring fair distribution across infinite terrain.

## 🧪 The Merge Matrix (Evolution Path)
Turrets evolve by combining T1 base ingredients. The system tracks the "Ingredient History" of every unit.

### T1 Base Ingredients
- **Peashooter (`t_pea`)**: Pure DPS.
- **Mining Laser (`t_laser`)**: Rapid block destruction.
- **Wallnut (`t_wall`)**: High HP defense.
- **Landmine (`t_mine`)**: Contact AOE.
- **Iceberg (`t_ice`)**: Freeze/Stun trap.

### Merge Logic
- **T2 Evolution**: Combine any two T1s.
    - *Example*: `t_pea` + `t_laser` = **Firepea** (Puddle damage).
    - *Example*: `t_pea` + `t_wall` = **Peanut** (Armored shooter).
- **T3 Evolution**: Combine three T1s or specific T2+T1 combinations.
    - *Example*: `t_pea` + `t_laser` + `t_wall` = **Inferno Ray**.

## ⚙️ Core Mechanics & State Machine
The game operates on a **Stationary vs Moving** binary state:
- **Moving**: Turrets are retracted/inactive, UI shop fades, exploration focus.
- **Stationary**: (After 15 frames of no movement) Turrets deploy, mining laser arms, and the Merge UI becomes active.
- **Time/Light**: 24-hour cycle (600 frames/hour). Night (21:00-04:00) triples enemy spawn budgets and reduces visibility.

## 🛠️ Technical Maintenance Notes (For Future Iterations)
- **TypeScript Strict Mode**: Iterating over `Map.values()` or complex arrays requires explicit type narrowing. Avoid `any` casting where possible, but use explicit interfaces for `Block` and `Chunk` to prevent the compiler from inferring `never` types during loop-heavy operations.
- **p5.js Global Scope**: The project uses p5.js in global mode. All p5 constants (`CENTER`, `TWO_PI`) and functions must be declared as `declare const` in headers to satisfy the build pipeline.
- **VFX Rendering**: Persistent death visuals are drawn to a hidden `p5.Graphics` buffer (8000x8000) to keep frame rates high by avoiding thousands of active sprite objects.
- **Gradients**: Radial lighting gradients use the native `drawingContext` to create the "Fog of War" effect around the player core.

## 👾 Enemy AI & Wave Budget
- **Budget Pool**: Each hour, a budget is added to the pool based on `Day` and `ChunkLevel`.
- **Wave Spawning**: At 21:00, a large chunk of the budget is spent simultaneously to create "Night Waves".
- **Refund Mechanic**: If enemies despawn (too far from player), their cost is refunded to the budget pool, preventing resource exhaustion in the infinite world.