# WorldOS V6 - Epochal Evolution Rules
# Manages the transition between grand historical Eras (Epochs)

rule Epoch_Transition_Check
priority 100
scope global
then
    # relative_tick: ticks since epoch start
    # entropy: universe entropy
    # innovation: universe innovation level
    
set should_transition false
    
    # Condition 1: Time threshold
if (relative_tick >= 10000) then
set should_transition true
    
    # Condition 2: High Entropy (Reality Rift)
if (entropy > 0.9) then
if (relative_tick > 2000) then
set should_transition true

rule Determine_Next_Epoch_Theme
priority 50
scope global
when
should_transition == true
then
emit_event INITIATE_EPOCH_TRANSITION
    
    # Theme logic
if (entropy > 0.8) then
metadata theme "chaos"
metadata name "Kỷ Nguyên Hỗn Loạn (The Age of Chaos)"
metadata description "Thực tại rạn nứt, trật tự sụp đổ dưới sức nặng của sự hỗn mang."
metadata entropy_rate 1.5
metadata trauma_multiplier 1.2
else
if (innovation > 0.7) then
metadata theme "light"
metadata name "Thời Đại Ánh Sáng (The Age of Enlightenment)"
metadata description "Trí tuệ thăng hoa, các nền văn minh chạm tay vào những bí mật tối thượng."
metadata innovation_rate 2.0
metadata complexity_growth 1.3
else
metadata theme "order"
metadata name "Kỷ Nguyên Trật Tự (The Age of Order)"
metadata description "Một thời kỳ thái bình và ổn định dưới sự giám sát của các quy luật vĩnh cửu."
metadata stability_bonus 0.15
metadata conflict_chance 0.5