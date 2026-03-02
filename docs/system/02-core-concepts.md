# 02 — Core Concepts & Domains

## 2.1 The Hierarchy of Existence

### 1. World (The Genotype)
- **Role**: The Blueprint. Contains the physical laws, constants (`gravity`, `magic_density`), and the original "Seed" (Genre, Origin).
- **Persistence**: Usage is *Read-Mostly*. It does not change during simulation (except for manual edits).
- **Model**: `App\Models\World`.

### 2. Universe (The Phenotype)
- **Role**: The Runtime Instance. This is what actually "evolves". It has an `Age` (ticks), `Entropy`, and a mutable `State Vector`.
- **Divergence**: A single World can have multiple Universes (Multiverse). Each Universe evolves differently based on random seeds and player choices.
- **Model**: `App\Models\UniverseModel`.

### 3. Saga (The Observer)
- **Role**: The Interface between User and Universe. A Saga is a "Session". It tracks the progression of a specific Universe (or set of Universes).
- **Model**: `App\Domains\Saga\Saga`.

## 2.2 The Data Structure: State Vector
The `WorldStateVector` is the DNA of the civilization. It is a JSON array containing dimensions normalized from 0.0 to 1.0:

| Dimension | Description |
| :--- | :--- |
| `entropy` | 0.0 (Perfect Order) -> 1.0 (Heat Death) |
| `order` | 0.0 (Anarchy) -> 1.0 (Totalitarianism) |
| `innovation`| 0.0 (Stone Age) -> 1.0 (Singularity) |
| `cohesion` | 0.0 (Civil War) -> 1.0 (Hive Mind) |
| `inequality`| 0.0 (Utopia) -> 1.0 (Oligarchy) |
| `trauma` | 0.0 (Peace) -> 1.0 (Post-Apocalyptic) |

## 2.3 Snapshots
We use a **Snapshot-First** architecture.
- Every Tick -> New `UniverseSnapshot` row.
- **Benefit**: Time Travel (Rollback), Forking (Branching timelines), and AI Analysis are trivial.
- **Table**: `universe_snapshots`.
