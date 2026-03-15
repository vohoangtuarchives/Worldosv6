# WorldOS V6 - Biosphere & Population Dynamics
# Handles Ecological Collapse, Population growth, and Disease outbreaks

# --- 1. Ecological Stability & Collapse ---

rule Detect_Ecological_Collapse
  priority 10
  scope global
  when
    # active == false and instability_score >= threshold
    is_collapse_active == false
    instability_score >= 0.7
  then
    # Trigger collapse
    emit_event ECOLOGICAL_COLLAPSE_TRIGGERED {
      instability_score: instability_score,
      resource_stress: resource_stress
    }
    
    # Calculate duration (mimicking PHP logic)
    set collapse_duration (200 + (random_dur * 800))
    set is_collapse_active true
    
    # Determine type
    when resource_stress >= 0.6
    then
      set collapse_type "famine"
    else
      when random_type < 0.5
      then
        set collapse_type "disease"
      else
        set collapse_type "predator_crash"

rule Monitor_Collapse_Duration
  priority 11
  scope global
  when
    is_collapse_active == true
    current_tick >= until_tick
  then
    set is_collapse_active false
    emit_event ECOLOGICAL_COLLAPSE_ENDED

# --- 2. Population & Biology Metrics ---

rule Population_Dynamics
  priority 20
  scope global
  then
    # Fertility/Mortality nudges
    set base_fertility 0.05
    set base_mortality 0.02
    
    when is_collapse_active == true
    then
      set base_fertility (base_fertility * 0.5)
      set base_mortality (base_mortality * 2.0)
    
    set fertility (clamp base_fertility 0.0 1.0)
    set mortality (clamp base_mortality 0.0 1.0)

# --- 3. Disease Propagation (SIR Model) ---

rule Disease_SIR_Evolution
  priority 30
  scope global
  when
    is_collapse_active == true
    collapse_type == "disease"
  then
    # SIR Evolution: Susceptible (S), Infected (I), Recovered (R)
    # infected_growth = I * beta * (S/N)
    # recovered_growth = I * gamma
    
    set beta 0.3
    set gamma 0.1
    
    # Calculate state changes for PHP to apply
    set d_infected (infected * beta)
    set d_infected (d_infected * (susceptible / population))
    
    set d_recovered (infected * gamma)
    
    set d_mortality (infected * 0.02) # Crude mortality rate
    
    set mortality (mortality + d_mortality)
    
    emit_event PANDEMIC_PROGRESS {
      new_infections: d_infected,
      new_recoveries: d_recovered,
      new_deaths: d_mortality
    }

# --- 4. Agriculture & Food Security (§Level-9) ---

rule Agriculture_Production
  priority 5
  scope global
  then
    # base_production = land_area * tech_multiplier * ecological_stability
    set tech_mult (1.0 + (tech_level * 2.0))
    set base_prod (land_area * tech_mult)
    set base_prod (base_prod * ecological_stability)
    
    # food_required = population * intake_rate
    set food_req (population * 0.01)
    
    # food_surplus = base_prod - food_req
    set food_surplus (base_prod - food_req)
    set food_security (base_prod / food_req)
    set food_security (clamp food_security 0.0 2.0)
    
    # famine trigger
    when food_security < 0.6
    then
      set famine_risk (1.0 - food_security)
      when random_chance < famine_risk
      then
        emit_event FAMINE_OUTBREAK { intensity: famine_risk }
        set mortality (mortality + (famine_risk * 0.05))
        set instability_score (instability_score + 0.1)

    set production base_prod
    set requirement food_req

# --- 5. Climate Cycles & Stability ---

rule Climate_Cycle_Evolution
  priority 1
  scope global
  then
    # Use a sine wave simulation for temperature cycles in PHP usually,
    # but we can nudge it here or apply effects.
    # ecological_stability drift
    set e_drift (0.01 * (random_chance - 0.5))
    
    # Drought risk if stability low
    when ecological_stability < 0.4
    then
      set e_drift (e_drift - 0.02)
      emit_event CLIMATE_INSTABILITY_WARNING { stability: ecological_stability }

    set ecological_stability (ecological_stability + e_drift)
    set ecological_stability (clamp ecological_stability 0.0 1.0)
