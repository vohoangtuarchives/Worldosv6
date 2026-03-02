# Narrative Series System

The **Narrative Series** system manages the long-form storytelling capabilities of WorldOS V3. It organizes generated content into structured formats (Book/Chapter) and manages the high-level plot through "Arcs" and the "Story Bible".

## 1. Concept: The "Series" Container
A `NarrativeSeries` acts as a container for a specific story being told within a Universe.
-   **One Universe, Many Series**: A single Universe can host multiple Series (e.g., "The Rise of the Empire" and "The Fall of the Rebels").
-   **State Tracking**: Each Series tracks its own progress (`current_book_index`, `total_chapters_generated`).
-   **Configuration**: Stores pipeline settings (e.g., `quality_pipeline`, `require_arc_approval`).

## 2. Architecture

### 2.1 Core Entities

| Entity | Role | Relationship |
| :--- | :--- | :--- |
| `NarrativeSeries` | The root container. Links to `Universe`. | 1 Series -> N Books/Chapters |
| `SerialChapter` | A single unit of narrative text. | N Chapters -> 1 Series |
| `StoryBible` | The "Wiki" for the series. Tracks characters, locations, relations. | 1 Bible -> 1 Series |
| `NarrativeArcOutline` | The Plot Planning structure. | N Arcs -> 1 Series |

### 2.2 Hierarchy
1.  **Saga**: The overarching story (e.g., "The War of the Three Realms").
2.  **Book**: A major segment (e.g., "Book 1: Awakening").
3.  **Arc**: A narrative arc within a book (e.g., "The Tournament Arc").
4.  **Chapter**: The actual reading unit.

## 3. The "Serial" Pipeline

The generation process follows a specific pipeline, managed by `SerialStoryService`:

1.  **Planning (Arc Generation)**:
    -   `PlotPlannerService` reads the Universe State and `StoryBible`.
    -   Generates a `NarrativeArcOutline` (e.g., "Hero participates in the Grand Tournament").
    -   User can Approve/Reject this outline (`PUT /arcs/{index}/approve`).

2.  **Drafting (Chapter Generation)**:
    -   `GenerateSerialChapterJob` picks the next approved Arc.
    -   `NarrativeBridge` fetches the current Simulation State.
    -   `GenreDefinition` provides the Prompt (`getNarrativePrompt`).
    -   `LLMChronicler` writes the raw text.

3.  **Refinement (Review)**:
    -   Chapter is saved with `needs_review = true`.
    -   User edits via the Serial UI.

4.  **Publishing (Canonization)**:
    -   User clicks "Canonize".
    -   `NarrativeFeedbackService` triggers the **IP Factory Loop**.

## 4. The Story Bible
The `StoryBible` is a critical component that effectively gives the Series "Long-Term Memory" separate from the Universe's raw data.
-   **Characters**: Tracks specific individuals relevant to the story (who might just be one of thousands of agents in the Sim).
-   **Locations**: Important places.
-   **Lore**: Custom explanations for phenomena.

*Note: While the Universe has "Truth" (WorldStateVector), the StoryBible has "Meaning" (Characters/Themes).*

## 5. Usage (Code)

```php
// Creating a Series
$series = $serialService->createSeries([
    'title' => 'My Xianxia Epic',
    'genre_key' => 'xianxia',
    'universe_id' => $universe->id,
    'config' => ['books_count' => 5]
]);

// Generating Content
$serialService->generateNextChapter($series->id);

// Canonizing (Feedback)
$feedbackService->processCanonization($chapter, $universe);
```
