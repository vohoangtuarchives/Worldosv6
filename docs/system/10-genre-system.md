# Genre System

The **Genre System** in WorldOS V3 is not just a label; it is a **fundamental configuration layer** that dictates both the *Physics* (Simulation) and the *Narrative* (Representation) of a Universe.

## 1. Core Philosophy
A Genre acts as a "Lens" or "preset" that transforms the generic World Evolution Kernel into a specific thematic experience. It bridges the gap between raw data (WorldStateVector) and the user's perceived story (Novel).

### Dual Role
1.  **Physics Layer (Simulation)**:
    -   Defines unique **Materials** (e.g., *Spirit Qi* in Xianxia, *Radiation* in Survival).
    -   Sets **Progression Rules** (e.g., Cultivation Levels, Tech Trees).
    -   Enforces **World Constraints** (e.g., "Mortal cannot harm Immortal", "Death is final").

2.  **Narrative Layer (Representation)**:
    -   Provides **Vocabulary Maps** (e.g., "School" -> "Sect", "Energy" -> "Mana").
    -   Injects **Narrative Prompts** into the `LLMChronicler` to enforce style.
    -   Determines **Event Catalogs** (what kind of events can happen).

## 2. Architecture

### Genre Definition Interface
All genres implement the `GenreDefinition` contract:

```php
interface GenreDefinition {
    public function key(): string;
    public function materials(): MaterialSystem;
    public function progression(): ProgressionRule;
    public function vocabulary(): VocabularyMap;
    public function getNarrativePrompt(): string; // [NEW] For IP Factory
}
```

### Supported Genres
| Genre Key | Display Name | Physics Focus | Narrative Style |
| :--- | :--- | :--- | :--- |
| `xianxia` | Xianxia (Cultivation) | **Qi Accumulation**, Hierarchy, Immortality | Grandiose, Ruthless, "Dao", "Tribulation" |
| `survival` | Apocalypse | **Scarcity**, Attrition, Crafting | Gritty, Desperate, "Fragility", "Ruins" |
| `scifi` | Hard Sci-Fi | **Innovation**, entropy-management | Analytical, Technical, "Protocol", "Quantum" |

## 3. IP Factory & Feedback Loop (Track K)
The Genre System is central to the **IP Factory** model, where the Simulation generates content for Long-Term Novels.

### Flow
1.  **Generation**:
    -   `Universe` evolves -> produces `WorldEvent`.
    -   `LLMChronicler` reads `Universe->genre_key`.
    -   Injects `Genre::getNarrativePrompt()` into the context.
    -   **Result**: A raw event "War started" becomes "The Great Sect War began under the blood moon."

2.  **Feedback (Canonization)**:
    -   User "Canonizes" a Chapter.
    -   `NarrativeFeedbackService` calculates impact based on Genre.
    -   **Xianxia Impact**: Increases `HIERARCHY`, `SPIRIT_QI`.
    -   **Cyberpunk Impact**: Increases `INEQUALITY`, `INNOVATION`.
    -   **Result**: The story changes the simulation's future trajectory.

## 4. Implementation Details

### Narrative Prompting
Each genre provides a specific prompt to the AI Chronicler:
> "Rewrite the following historical event in the style of a Xianxia/Cultivation novel... Use terms like 'Qi', 'Dao'..."

### Material Injection
When a Universe is initialized with a Genre, it automatically seeds specific Materials:
-   **Xianxia**: Seeds `SPIRIT_QI`, `ALCHEMICAL_PILL`.
-   **Survival**: Seeds `SCRAP_METAL`, `CANNED_FOOD`.

These materials then interact with the `BasePhysicsEngine` via the **Material Engine**.
