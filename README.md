
# Core Explorer: Technical & Design Library

Core Explorer (v3.2) is a procedural 2D survival game built with **TypeScript** and **p5.js**. It features a unique mobile-base expansion system, a deep merging matrix, and a dynamic ecosystem.

---

## 🏃 Input & Orientation System
The game utilizes a **Decoupled Intent Pipeline** for character visuals:
- **Movement Intent**: Visual orientation (flipping/direction) is tied to raw keyboard input rather than character velocity. This prevents "sprite flickering" when the player is blocked by physical collisions (e.g., slamming into a wall).
- **State Locking**: The transition to the "Stationary" state (which enables turrets and aiming) is inhibited as long as any movement keys are held. This ensures tactical control over base deployment.

---

## 🏗️ Room Prefab System
Scripted chunk generation that bypasses the standard noise-based pipeline for tactical level design.
- **Air Ratio**: Ensures a minimum percentage of traversable space by strategically carving blocks.
- **Enemy Spawners**: Randomly picks spawner overlays with danger levels matched to the room's difficulty.
- **Loot Pots**: Randomly distributes Sun, TNT, and Crate nodes across the chunk.
- **Guaranteed Obstacles**: Allows placing specific block types (like Treasure Chests or specific resource crates) in precise quantities.
- **Immediate Budget**: Triggers a localized enemy wave upon generation to populate the "room".
- **Discovery Order Room Director**: The Room Director sequence is applied based on the order in which the player discovers new chunks. The world follows the generated string length exactly; once the scripted sequence is exhausted, chunks fall back to procedural noise generation rather than looping the director sequence.

---

## 👹 Enemy Budget & Aggression
The game employs a resilient budgeting system to maintain constant pressure.
- **Shared Pool**: Despawned enemies (those outrun by the player) refund their cost to a central pool.
- **Aggressive Re-deployment**: The world director attempts to spend the budget pool every frame, instantly spawning new portals near the player's current location if valid ground is found.
- **Scaling Difficulty**: Base budgets increase daily, ensuring the survival challenge keeps pace with base expansion.

---

## 🏗️ The Hex-Axial Grid System
Base expansion is built on a **Hex-Axial Coordinate System** (q, r).
- **Core (0,0)**: The player's main unit. It houses the auto-mining turret.
- **Attachments**: Turrets are snapped to the hex grid using axial-to-world conversion logic.
- **Adjacency Requirement**: New turrets must be placed adjacent to an existing unit.
- **Movement**: The entire base is physics-linked. When the player moves, the world-space offsets of all attachments are recalculated in real-time.

---

## 🚀 Advanced Tier 3 Systems
- **Knockback Physics**: High-tier projectiles and pulses exert force on enemies. The system uses a `kbTimer` to interrupt enemy pathfinding, making the displacement feel weighty and impactful. Smaller enemies are affected more significantly by the impulse.
- **Ballistic Launch**: The `highArcConfig` allows projectiles like Sky Mortar shells to reach their destination in a fixed number of frames. These projectiles fly "above" the map, granting them immunity to mid-air collisions with obstacles or enemies. 
- **Dynamic Ballistic Visuals**: Ballistic shells feature height-sensitive scaling and a shrinking ground shadow to accurately represent their trajectory in a 2D isometric-adjacent perspective.
- **Refined Piercing & Multi-Hit**: Piercing heavy projectiles (like the Bowling Bulb) apply knockback and hit effects to every unique target in their path. The `aoeConfig.dealAoeOnEveryHit` property allows bullets to trigger explosions on every target they pierce, rather than just the final impact, enabling devastating linear suppression. 
- **Standardized Feedback**: All combat impacts now trigger visual hit sparks (`v_hit_spark`) on both enemies and obstacles, ensuring consistent satisfying feedback during high-intensity gameplay.
- **Tesla Chaining**: The `t3_tesla` turret features a `generateElectricChain` action that dynamically links all active Teslas within a 10-tile radius. This link deals linear area damage to all entities intersecting the segment.
- **Beam Bullets**: High-tier lasers can now trigger additional effects at their point of impact via the `beamBulletTypeKey` property. This allows for mechanics like the Melting Laser's secondary explosions or the Ice Puncher's focalized chilling bursts.
