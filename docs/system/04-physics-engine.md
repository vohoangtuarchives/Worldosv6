# 04 — Cosmology & Physics Engine

## 4.1 Domain Overview (`App\Domains\Cosmology`)
The **Cosmology Domain** (formerly `Cosmic`) is the beating heart of the simulation. It unifies:
- **Physics**: Mathematical rules of the universe (Entropy, Order).
- **Attractors**: Narrative gravity wells that pull the world toward specific themes (e.g., "Dark Age", "Golden Era").
- **Scars**: Historical inertia that resists change.

## 4.2 BasePhysicsEngine (The Rules)
The engine uses differential equations to simulate societal trends.

### Key Formulas (Simplified)
- **Entropy Growth**: `dEntropy = (Inequality^2 * 0.05) + (Trauma * 0.03) - (Innovation * 0.02)`
    - *Meaning*: Inequality and Trauma cause Decay. Innovation slows it down.
- **Revolution Risk**: `dTrauma = (Inequality > 0.7) ? +0.05 : -0.01`
    - *Meaning*: High Inequality creates "Trauma" (Unrest).
- **Collapse**: If `Entropy > 0.85`, the system enters `CRITICAL` state, forcing a massive `dOrder` drop (Collapse).

## 4.3 Attractors & Bifurcation
**Attractors** are pre-defined states (e.g., `Cyberpunk Dystopia`, `Magical Feudalism`) that the simulation "falls" into.

- **Bifurcation**: When the `WorldStateVector` becomes unstable (High Entropy), the system *bifurcates* (splits).
- **Selection**: The `BifurcationManager` selects the nearest valid `Attractor` based on the current vector.
- **Incarnation**: The chosen Attractor becomes the "Current Truth" (Incarnation), defining the laws of physics and potential events for the next Era.

## 4.4 World Scars (Inertia)
Implemented in V3.03, **World Scars** represent deep, unhealed wounds in the world's history (e.g., "The shattering of the Red Moon").

- **Source**: Decayed `WorldMyth` or catastrophic `CosmicEvent`.
- **Effect**: Scars add **Inertia** to the `WorldStateVector`.
- **Mechanism**: A world with high Inertia requires *more* energy (Innovation/Revolution) to change its state. It "resists" evolution, trapping the simulation in a cycle of stagnation until a massive force (Hero/Player Intervention) breaks it.

