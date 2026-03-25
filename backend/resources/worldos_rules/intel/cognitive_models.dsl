# WorldOS Actor Cognition DSL (V2)
# Modeling Homeostatic Regulation and Causal Response

# --- 1. Homeostatic Regulation (Needs) ---

rule Homeostatic_Regulation
priority 10
scope global
category cognition
trigger energy
then
calc h_hunger
formula "(1.0 - (energy / maxEnergy))"
set hunger h_hunger
    
when
energy < (maxEnergy * 0.2)
then
set hunger (hunger + 1.2)
    
calc h_safety
formula "0.8"
set safety h_safety
when
collapse_active then
set safety (safety - 0.4)
    
calc h_repro
formula "0.2"
set reproduction h_repro
when
energy > (maxEnergy * 0.7) && generation < 10 then
set reproduction (reproduction + 0.3)
    
set belonging_need 0.5

# --- 2. Personality Manifold ---

rule Personality_Manifold
priority 20
scope global
category cognition
trigger traits
then
set trait_dominance (get_trait 0)
set trait_ambition (get_trait 1)
set trait_coercion (get_trait 2)
set trait_empathy (get_trait 4)
set trait_curiosity (get_trait 8)
set trait_dogmatism (get_trait 9)
set trait_risk (get_trait 10)
set trait_fear (get_trait 11)
set trait_hope (get_trait 13)
set trait_pride (get_trait 15)
set trait_solidarity (get_trait 5)
set trait_pragmatism (get_trait 7)

# --- 3. Causal Resonance ---

rule Causal_Response
priority 25
scope global
category cognition
trigger causal_integrity
then
calc causal_anxiety
formula "(1.0 - causal_integrity)"
    
when
causal_integrity < 0.4 then
set trait_fear (trait_fear + (0.2 * causal_anxiety))
set trait_risk (trait_risk + (0.1 * causal_anxiety))

# --- 4. Motivation Synthesis (Phase 30: 8-Attractor Aligned) ---

rule Motivation_Synthesis
priority 30
scope global
category cognition
trigger arch_survival
then
    # weights: archetype 0.7, personality 0.3
set mSurvival ((arch_survival * 0.7) + (trait_fear * 0.3))
set mRepro ((arch_reproduction * 0.7) + (trait_hope * 0.3))
set mWealth ((arch_wealth * 0.7) + (trait_pragmatism * 0.3))
set mPower ((arch_power * 0.7) + (trait_dominance * 0.3))
set mKnowledge ((arch_knowledge * 0.7) + (trait_curiosity * 0.3))
set mMeaning ((arch_meaning * 0.7) + (trait_hope * 0.3))
set mStatus ((arch_status * 0.7) + (trait_pride * 0.3))
set mBelonging ((arch_belonging * 0.7) + (trait_solidarity * 0.3))

# --- 5. Action Utility Scoring (8-Attractor Resonance) ---

rule Action_Utility_Scoring
priority 40
scope global
category cognition
trigger field_meaning
then
set score_idle 0.1
set score_eat (hunger * 1.5 + field_survival * 0.5)
set score_flee (field_power * trait_fear * 2.0 + (1.0 - field_survival) * 1.5)
set score_mate (reproduction * 1.2 + field_reproduction * mRepro + field_meaning * 0.3)
set score_explore (trait_curiosity * 0.5 + field_knowledge * mKnowledge + field_status * 0.3)
set score_battle (field_power * mPower * 1.5 + field_status * 0.5)
set score_research (field_knowledge * mKnowledge * 2.5 + field_meaning * 0.5)
set score_trade (field_wealth * mWealth * 2.0 + field_status * 0.4)
set score_meditate (field_meaning * mMeaning * 2.2 + field_belonging * 0.3)

    # Cultural Resonance (8D Memes - Phase 30)
calc culture_weight
formula "0.3"
    
set score_battle (score_battle * (1.0 + (meme_power - 0.5) * culture_weight))
set score_research (score_research * (1.0 + (meme_knowledge - 0.5) * culture_weight))
set score_meditate (score_meditate * (1.0 + (meme_meaning - 0.5) * culture_weight))
set score_trade (score_trade * (1.0 + (meme_wealth - 0.5) * culture_weight))
set score_mate (score_mate * (1.0 + (meme_reproduction - 0.5) * culture_weight))
    
    # Heroic Acceleration
when
is_heroic then
when
heroic_type == "SCIENTIST" then set score_research (score_research * 2.0)
when
heroic_type == "GENERAL" then set score_battle (score_battle * 2.0)
when
heroic_type == "MERCHANT" then set score_trade (score_trade * 2.0)
when
heroic_type == "PROPHET" then set score_meditate (score_meditate * 2.0)