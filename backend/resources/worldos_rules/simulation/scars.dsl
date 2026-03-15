# Causal Scars Dynamics DSL 📜🩸
# Phase 51: Định nghĩa quy luật tiến hóa và phân rã của các vết sẹo thực tại.

# 1. Decay Rules (Quy luật phân rã theo thời gian)
# -----------------------------------------------

rule "scar_memory_decay"
    priority 100
    condition "count(scars) > 0"
    action {
        # Mỗi vết sẹo tự phân rã theo thời gian để nhường chỗ cho thực tại mới
        # Tốc độ phân rã mặc định là 2% mỗi tick
        drift scars.*.magnitude by -2% 
        
        # Xóa các vết sẹo đã mờ nhạt (magnitude < 0.1)
        delete scars where magnitude < 0.1
    }

# 2. Field Interference (Tác động lên các trường lực)
# ---------------------------------------------------

rule "war_scar_interference"
    condition "has_scar('WAR_SCAR')"
    action {
        # Chiến tranh để lại bóng ma sợ hãi và kìm hãm sáng tạo
        pressure "fear" add (scars.WAR_SCAR.magnitude * 0.5)
        pressure "innovation" subtract (scars.WAR_SCAR.magnitude * 0.2)
        
        # Tăng entropy xã hội
        drift fields.entropy by (scars.WAR_SCAR.magnitude * 0.05)
    }

rule "plague_scar_interference"
    condition "has_scar('PLAGUE_SCAR')"
    action {
        # Dịch bệnh để lại sự thận trọng và suy giảm dân số
        pressure "survival" subtract (scars.PLAGUE_SCAR.magnitude * 0.3)
        drift fields.stability_index by -(scars.PLAGUE_SCAR.magnitude * 0.02)
    }

rule "innovation_scar_historical_momentum"
    condition "has_scar('INNOVATION_SCAR')"
    action {
        # Các cột mốc sáng tạo lớn tạo ra đà tiến cho tương lai (Golden Age momentum)
        pressure "innovation" add (scars.INNOVATION_SCAR.magnitude * 0.3)
        pressure "meaning" add (scars.INNOVATION_SCAR.magnitude * 0.1)
    }

rule "causal_correction_scar_reality_stiffness"
    condition "has_scar('CAUSAL_CORRECTION_SCAR')"
    action {
        # Sự can thiệp nhân quả mạnh tay làm thực tại trở nên "cứng nhắc" (tăng ổn định nhưng giảm biến hóa)
        drift fields.stability_index by (scars.CAUSAL_CORRECTION_SCAR.magnitude * 0.1)
        pressure "chaos" subtract (scars.CAUSAL_CORRECTION_SCAR.magnitude * 0.5)
    }
