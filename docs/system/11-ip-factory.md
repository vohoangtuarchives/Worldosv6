# IP Factory System

The **IP Factory** is the core business logic of WorldOS V3. It transforms the "Simulation" from a passive toy into an active **Engine for Intellectual Property (IP)** generation.

## 1. Concept
Instead of human authors manually writing every detail, WorldOS acts as a **Co-Author**:
1.  **Simulation** provides the *Truth* (What happened).
2.  **Genre** provides the *Style* (How it is told).
3.  **Human** provides the *Curation* (What is canon).

## 2. The Loop (Track K)

### Phase 1: Simulation (The Engine)
The **Universe** runs on the `WorldEvolutionKernel`.
-   **Input**: Physics Constants, Material Seeds.
-   **Process**: Agents act, factions fight, entropy rises.
-   **Output**: `WorldEvent` (Raw data: "Faction A damaged Faction B, damage=50").

### Phase 2: Narrative (The Lens)
The `NarrativeService` and `LLMChronicler` observe the simulation.
-   **Genre Filter**: The Universe has a `genre_key` (e.g., `xianxia`).
-   **Prompt Injection**: The system injects `Genre::getNarrativePrompt()`.
-   **Transformation**: "Faction A damaged Faction B" becomes *"The Azure Dragon Sect unleashed the Heaven-Burning Flame upon the Iron Bone Clan."*
-   **Product**: A **Draft Chapter** in a Serial Novel.

### Phase 3: Curation (The Editor)
The Human Writer (User) reviews the Draft Chapter via the **Serial UI**.
-   **Edit**: Tweaks the prose.
-   **Reject**: Rewinds the simulation to try a different path (Forking).
-   **Canonize**: Approves the chapter as "Official History".

### Phase 4: Feedback (The Memory)
When a chapter is **Canonized** (`POST /canonize`):
1.  **Myth Creation**: A `WorldMyth` is created in the Universe's DB.
2.  **Material Impact**: `NarrativeFeedbackService` calculates impact.
    -   *Xianxia Example*: A myth about a "Great War" might increase the global `SPIRIT_QI` density (scarcity creates value) or unlock a new `ALCHEMICAL_FORMULA`.
3.  **Physics Update**: The `WorldEvolutionKernel` reads these Myths in the next Tick, altering the `WorldStateVector`.

## 3. Key Components

### 3.1 Services
-   **`LLMChronicler`**: The ghostwriter. Connects Simulation State to LLM.
-   **`NarrativeFeedbackService`**: The bridge backwards. Converts Text -> Math.

### 3.2 Data Models
-   **`NarrativeSeries`**: Represents a Novel (Book/Series). Linked to a `Universe`.
-   **`SerialChapter`**: A single unit of content. Has `canonized_at` timestamp.
-   **`WorldMyth`**: The persistent memory unit.

## 4. Workflows

### Creating a New IP
1.  **Genesis**: Create a World + Universe. Select Genre (e.g., "Cyberpunk").
2.  **Run**: Advance simulation 50 years.
3.  **Chronicle**: Generate "Book 1: The Awakening".
4.  **Publish**: Canonize chapters.
5.  **Expand**: Fork the Universe at Year 50 to create "Book 2: The Divergence" (Alternate Timeline).

### "One World, Many Stories"
Because Myths are stored in the Universe (Phenotype) but can be referenced by the World (Genotype) via **Resonance**, a single World Foundation (e.g., "Middle Earth Physics") can spawn infinite variations of stories.
