# WorldOS V8: Meta-Attractor Graph DSL 🌌🌀🕸️
# Phối hợp giữa các Attractor Nodes và Transition Edges.

# -----------------------------------------------------------------------------
# 1. ATTRACTOR PULL RULES (Các nút trong Graph)
# -----------------------------------------------------------------------------

rule "attractor_STAGNATION_pull"
    condition "active_attractor == 'STAGNATION'"
    action {
        drift fields.innovation target 0.1 speed 0.05
        drift fields.stability_index target 1.0 speed 0.02
        drift topology.stagnation_pull target 1.0 speed 0.1
    }

rule "attractor_RENAISSANCE_pull"
    condition "active_attractor == 'RENAISSANCE'"
    action {
        drift fields.knowledge target 0.8 speed 0.02
        drift fields.innovation target 0.6 speed 0.03
        drift topology.renaissance_pull target 1.0 speed 0.1
    }

rule "attractor_APOTHEOSIS_pull"
    condition "active_attractor == 'APOTHEOSIS'"
    action {
        drift fields.knowledge target 1.0 speed 0.05
        drift fields.resonance target 0.9 speed 0.04
        drift topology.apotheosis_pull target 1.0 speed 0.1
    }

rule "attractor_EMPIRE_pull"
    condition "active_attractor == 'EMPIRE'"
    action {
        drift fields.power target 0.9 speed 0.03
        drift fields.authority target 0.9 speed 0.03
        drift topology.empire_pull target 1.0 speed 0.1
    }

# -----------------------------------------------------------------------------
# 2. TRANSITION EDGES (Các cạnh trong Graph)
# -----------------------------------------------------------------------------

rule "transition_STAGNATION_to_RENAISSANCE"
    condition "active_attractor == 'STAGNATION' && field_innovation > 0.4 && field_knowledge > 0.5"
    action {
        set previous_attractor = "STAGNATION"
        set active_attractor = "RENAISSANCE"
        set attractor_stability = 0.5
        emit_event ATTRACTOR_TRANSITION { from: "STAGNATION", to: "RENAISSANCE", description: "SỰ TRỖI DẬY CỦA TRI THỨC: Xuyên thủng màn sương đình trệ." }
    }

rule "transition_RENAISSANCE_to_APOTHEOSIS"
    condition "active_attractor == 'RENAISSANCE' && field_knowledge > 0.8 && field_innovation > 0.7"
    action {
        set previous_attractor = "RENAISSANCE"
        set active_attractor = "APOTHEOSIS"
        set attractor_stability = 0.35
        emit_event ATTRACTOR_TRANSITION { from: "RENAISSANCE", to: "APOTHEOSIS", description: "BƯỚC NHẢY THĂNG HOA: Văn minh chạm đến ranh giới của thực tại mới." }
    }

rule "transition_RENAISSANCE_to_EMPIRE"
    condition "active_attractor == 'RENAISSANCE' && field_power > 0.6"
    action {
        set previous_attractor = "RENAISSANCE"
        set active_attractor = "EMPIRE"
        set attractor_stability = 0.6
        emit_event ATTRACTOR_TRANSITION { from: "RENAISSANCE", to: "EMPIRE", description: "TẬP TRUNG QUYỀN LỰC: Thế giới chuyển mình thành một đại đế quốc." }
    }

rule "transition_EMPIRE_to_STAGNATION"
    condition "active_attractor == 'EMPIRE' && field_bureaucracy > 0.7"
    action {
        set previous_attractor = "EMPIRE"
        set active_attractor = "STAGNATION"
        set attractor_stability = 0.85
        emit_event ATTRACTOR_TRANSITION { from: "EMPIRE", to: "STAGNATION", description: "HỦY DIỆT TỰ THÂN: Bộ máy quan liêu làm đóng băng mọi chuyển động." }
    }

# -----------------------------------------------------------------------------
# 3. INITIALIZATION (Default State)
# -----------------------------------------------------------------------------

rule "init_meta_attractor"
    condition "active_attractor == 'none' || active_attractor == ''"
    action {
        set active_attractor = "STAGNATION"
        set attractor_stability = 0.85
    }
