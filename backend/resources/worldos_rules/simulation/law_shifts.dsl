# Metaphysical Law Shifts DSL 🌌📜
# Phase 57: Định nghĩa sự biến thiên của hằng số vật lý theo trạng thái văn minh.

rule "renaissance_physics_boost"
    condition "active_attractor == 'RENAISSANCE'"
    action {
        # Trong thời kỳ Phục hưng, rào cản đổi mới giảm xuống
        drift axioms.innovation_impact target 0.04 speed 0.01
        drift axioms.entropy_drift_base target 0.0001 speed 0.005
    }

rule "dark_age_entropy_decay"
    condition "active_attractor == 'DARK_AGE'"
    action {
        # Thời kỳ tăm tối khiến Entropy tăng vọt và trật tự sụp đổ nhanh hơn
        drift axioms.entropy_drift_base target 0.01 speed 0.02
        drift axioms.order_decay_rate target 0.05 speed 0.01
    }

rule "transcendence_negentropy_shift"
    condition "active_attractor == 'TRANSCENDENCE'"
    action {
        # Thăng hoa: Đảo ngược Entropy (Negentropy)
        drift entropy target 0.0 speed 0.05
        drift axioms.entropy_drift_base target 0.00001 speed 0.1
        drift axioms.innovation_impact target 0.1 speed 0.05
    }

rule "empire_stability_inertia"
    condition "active_attractor == 'EMPIRE'"
    action {
        # Đế quốc: Tăng tính ổn định nhưng làm chậm đổi mới
        drift stability_index target 1.0 speed 0.02
        drift axioms.innovation_impact target 0.005 speed 0.01
    }
