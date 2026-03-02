# AI Neuro System

The **AI Neuro System** is the "Brain" of WorldOS V3. While the *Physics Engine* handles data evolution and the *Narrative Engine* handles structure, the **Neuro System** provides the **Intelligence**, **Creativity**, and **Decision Making**.

## 1. Core Philosophy: The "Observer-Actor" Model
The AI in WorldOS is not a monolithic "God". It functions as a set of specialized **Agents** that observe the simulation and intervene only when necessary.

### The Feedback Loop
1.  **Observation**: The AI reads the `WorldStateVector` and `WorldEvents`.
2.  **Reflection**: It evaluates these against high-level goals (Narrative Interest, Consistency, User Intent).
3.  **Action**: It performs an output (Writing text, Forking a Universe, Injecting a specialized Event).

## 2. Architecture

### 2.1 The Provider Layer (`LLMProvider`)
The foundation is the `LLMProvider` contract. WorldOS is agnostic to the underlying model.
-   **Drivers**: `Qwen (Alibaba)`, `OpenAI`, `Anthropic`, `Local (Ollama)`.
-   **Responsibility**: Handles rate limiting, token counting, and retry logic.
-   **Context Management**: `AIAgentContext` manages the sliding window of history passed to the LLM.

### 2.2 The Chronicler (The Storyteller)
See `App\Domains\Narrative\Services\LLMChronicler`.
-   **Role**: Turns mathematical state into prose.
-   **Input**: `Entropy: 0.8`, `Genre: Xianxia`, `Events: [War_Started]`.
-   **Instruction**: "Write a 3-sentence summary in the style of Renegade Immortal."
-   **Output**: "The bloody mist covered the sect..."

### 2.3 The Evaluator (The Strategist)
See `App\Domains\Cosmology\Services\AIEvaluationService` (Future/Planned).
-   **Role**: Decides the *path* of the simulation.
-   **Questions it asks**:
    -   "Is this timeline boring?" (If yes -> Increase Variance/Entropy).
    -   "Did the user want a tragedy?" (If yes, but `Happiness > 0.9` -> Inject Crisis).
    -   "Should we save this state?" (If `Innovation` spiked -> Snapshot).

### 2.4 The Neuro-Agents (NPCs)
(Planned) Specific entities within the world that have AI-driven autonomy beyond simple FSMs.
-   **Heroes/Villains**: Defined by `WorldHero` model.
-   **Agency**: Can propose `WorldAction` (e.g., "I want to start a rebellion") which the Physics Engine then validates.

## 3. Configuration & Tuning
The AI behavior is governed by **Presets** in `config/worldos.php` or `Universe` parameters.
-   **Creativity**: Temperature setting (0.2 for history, 0.9 for myths).
-   **Coherence**: Frequency penalty.
-   **Bias**: Genre-specific system prompts (see [Genre System](10-genre-system.md)).

## 4. Integration with Other Systems
-   **vs Genre**: Genre provides the *Prompt Template*. AI fills it.
-   **vs Physics**: Physics provides the *Constraint*. AI operates within it (or hallucinates validly within the "Magic System").
-   **vs IP Factory**: AI is the *Worker* that manufactures the draft content for human review.
