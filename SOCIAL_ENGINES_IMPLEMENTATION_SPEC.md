# Implementation Specification for Social Tier Stub Engines
**WorldOS V6 Simulation**  
**Date:** 2026-04-10

---

## Overview

Three stub engines need implementation:
1. **FinanceEngine** — Zone-based credit/debt tracking
2. **DiplomacyEngine** — Treaty management and diplomatic tension
3. **ProductionChainEngine** — Industrial output calculation

All three are registered in the kernel and have test files.

---

## 1. FinanceEngine

**File:** `backend/app/Modules/Simulation/Core/Engines/Social/FinanceEngine.php`

**Test:** `tests/Feature/Simulation/FinanceEngineTest.php` (lines 20-108)

**Input:** zones[*].state.economy_surplus, zones[*].state.economy_consumption

**Expected Output:**
```
civilization.finance:
  zones[0]:
    credit: 50
    debt: 0
  zones[1]:
    credit: 0
    debt: 60
  total_credit: 50
  total_debt: 60
```

**Logic:**
- For each zone: net = surplus - consumption
- If net >= 0: credit = net, debt = 0
- If net < 0: credit = 0, debt = abs(net)
- Sum totals

---

## 2. DiplomacyEngine

**File:** `backend/app/Modules/Simulation/Core/Engines/Social/DiplomacyEngine.php`

**Test:** `tests/Feature/Simulation/DiplomacyEngineTest.php` (lines 23-88)

**Input:** factions[*].ideology_vector, DiplomaticTreaty model

**Expected Output:**
```
diplomacy.tensions:
  1_2:
    ideology_distance: 0.100
    has_alliance: true
    base_tension: 0.050
  1_3:
    ideology_distance: 0.900
    has_alliance: false
    base_tension: 0.900
```

**Logic:**
1. Query DiplomaticTreaty for current universe
2. Mark treaties as inactive if ends_at_tick <= current_tick
3. Emit TREATY_EXPIRED event for expired treaties
4. Calculate ideology distance between faction pairs
5. Set has_alliance = true if active treaty exists
6. base_tension = ideology_distance * (1.0 - (0.5 if alliance else 0.0))

---

## 3. ProductionChainEngine

**File:** `backend/app/Modules/Simulation/Core/Engines/Social/ProductionChainEngine.php`

**Test:** `tests/Feature/Simulation/FinanceEngineTest.php` (co-tested)

**Input:** zones[*].state.economy_surplus

**Expected Output:**
```
civilization.production:
  zones[0]:
    industrial_output: 50
  zones[1]:
    industrial_output: 10
  total_industrial_output: 60
  material_bonus_multiplier: 1.0
```

**Logic:**
- material_bonus_multiplier = 1.0 + (bonus_count * 0.1)
- industrial_output = surplus * multiplier * 0.5
- Sum total outputs

---

## Execution Order

1. RULE_EXTRACTION: FinanceEngine → ProductionChainEngine
2. RULE_COHESION: DiplomacyEngine

All registered in KernelServiceProvider lines 412-429.

