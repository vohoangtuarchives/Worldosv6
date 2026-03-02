# 08 — Governance System (Emergent Politics)

## 8.1 Philosophy: Governance as Output
In WorldOS V3, "Government" is not a setting you toggle. It is an **emergent property** of the simulation.
- You don't "set" a Democracy.
- You create conditions (Low Inequality, High Literacy, High Popular Support) that *force* the system to behave like a Democracy.

## 8.2 The Physics of Power (State Vector)
Political regimes are defined by the **Universe State Vector**:

| Dimension | Political Meaning |
| :--- | :--- |
| **Order** | **Authority**. High = Strong State / Tyranny. Low = Anarchy / Liberty. |
| **Legitimacy** | **Right to Rule**. High = Stable. Low = Coup imminent. |
| **Elite Cohesion** | **Unity of Rulers**. High = Unified Regime. Low = Warlordism / Civil War. |
| **Inequality** | **Power Concentration**. High = Oligarchy/Monarchy. Low = Egalitarianism. |

### Regime Types (Emergent)
The system "Narrates" the regime based on these combinations:

1.  **Imperial / Monarchy**:
    - `Order > 0.8` (Strong Centralization)
    - `Inequality > 0.7` (Hierarchical)
    - `Elite Cohesion > 0.6` (Loyal Nobility)

2.  **Republic / Democracy**:
    - `Order < 0.6` (Decentralized / Checks & Balances)
    - `Inequality < 0.4` (Middle Class exists)
    - `Legitimacy > 0.7` (Consent of the governed)

3.  **Warlord Era (Sứ Quân)**:
    - `Order > 0.5` (Attempts at control)
    - `Elite Cohesion < 0.3` (Infighting)
    - `Legitimacy < 0.2` (Might makes right)

## 8.3 Primitives (The "Tech Tree")
Before a Universe can *be* a Republic, it must discover the concept.
**World Primitives (WFR)** acts as the "Constitution DNA".

- **Code**: `REPUBLIC`
- **Domain**: `Civilization`
- **Constraint**: Requires `CITIZENSHIP` primitive.

If a Universe has `REPUBLIC` active (via Material investigation or Scripting), then the Physics Engine *allows* `Legitimacy` to scale with `Popular Support`. Without it, `Legitimacy` might only scale with `Divine Right` or `Military Power`.

## 8.4 Cosmic Factions
While regimes change, **Cosmic Factions** are the persistent "Players" or "Egregores" that span across time (and potentially Universes).
- They represent deep ideological alignments (e.g., "The Iron Blood Clan" - Militaristic).
- They can capture/lose control of the "Regime" based on the `Elite Cohesion` stat.
