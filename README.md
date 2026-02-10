
# Core Explorer - Game Documentation

## 🚀 Deployment Instructions

### Option A: GitHub Pages (via GitHub Actions)
1. Push your code to a GitHub repository named exactly what you want the URL to be.
2. Go to your repository on GitHub.com.
3. Click **Settings** -> **Pages**.
4. Under **Build and deployment** > **Source**, change the dropdown from "Deploy from a branch" to **"GitHub Actions"**.
5. The next time you push to `main`, the `.github/workflows/deploy.yml` file will automatically build and publish your game.

### Option B: Vercel (Recommended - Fastest)
1. Push your code to GitHub.
2. Import the repo into [Vercel](https://vercel.com).
3. It will auto-detect Vite. Click **Deploy**.

### Option C: Manual Local Build
1. Install [Node.js](https://nodejs.org/).
2. Run `npm install` then `npm run build`.
3. Host the contents of the `dist/` folder.

---

## Core Mechanics (v3.0)
- **Mining**: Player core has an auto-mining turret that targets the nearest block or enemy.
- **Base Expansion**: Turrets attach to the core using a hex-axial grid system.
- **Stationary vs Moving**: Systems become less active when in motion to encourage tactical positioning.

## Merging System
- **T1 Base Turrets**: Peashooter, Mining Laser, Wallnut, Landmine, Iceberg.
- **Dynamic Merging**: Combine two turrets to create Tier 2 or Tier 3 variants based on their ingredient history.

## Environments
- **Water**: Standard movement.
- **Ice**: Low friction, turrets become "Frosted".
- **Tar**: Reduced movement and fire rates.
- **Lava**: Dangerous tick-damage and "Burning" condition.
