//! Agent definitions: 17D Trait Vector, Archetypes, and Decision Logic (§3.1, §4).

use serde::{Deserialize, Serialize};

/// 17D Trait Vector (WORLDOS_V6 §3.1)
/// Indices:
/// 0: Dominance, 1: Ambition, 2: Coercion (Power)
/// 3: Loyalty, 4: Empathy, 5: Solidarity, 6: Conformity (Social)
/// 7: Pragmatism, 8: Curiosity, 9: Dogmatism, 10: RiskTolerance (Cognitive)
/// 11: Fear, 12: Vengeance, 13: Hope, 14: Grief, 15: Pride, 16: Shame (Emotional)
pub type TraitVector = [f64; 17];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Archetype {
    Warlord,
    Zealot,
    Opportunist,
    Sage,
    Commoner,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: u64,
    pub trait_vector: TraitVector,
    pub archetype: Archetype,
    /// Ring buffer for short-term memory (cap 5)
    pub memory: Vec<String>,
}

impl Agent {
    pub fn new(id: u64, traits: TraitVector, archetype: Archetype) -> Self {
        Self {
            id,
            trait_vector: traits,
            archetype,
            memory: Vec::with_capacity(5),
        }
    }

    /// ActionUtility = BaseScore(Archetype, Context) + (TraitVector · ContextWeight) + Noise
    pub fn calculate_utility(
        &self,
        base_score: f64,
        context_weight: &TraitVector,
        noise: f64,
    ) -> f64 {
        let dot_product: f64 = self.trait_vector.iter()
            .zip(context_weight.iter())
            .map(|(t, w)| t * w)
            .sum();
        
        base_score + dot_product + noise
    }

    pub fn push_memory(&mut self, event: String) {
        if self.memory.len() >= 5 {
            self.memory.remove(0);
        }
        self.memory.push(event);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trait_vector_utility() {
        let mut traits = [0.0; 17];
        traits[0] = 1.0; // Dominance
        let agent = Agent::new(1, traits, Archetype::Warlord);

        let mut weights = [0.0; 17];
        weights[0] = 0.5; // Power context
        
        let utility = agent.calculate_utility(0.1, &weights, 0.05);
        // 0.1 (base) + (1.0 * 0.5) + 0.05 (noise) = 0.65
        assert!((utility - 0.65).abs() < 1e-6);
    }
}
