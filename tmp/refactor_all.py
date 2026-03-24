import os

def refactor_dsl_safe(content):
    lines = content.split('\n')
    new_lines = []
    current_phase = None # 'rule', 'when', 'then'
    
    ACTION_KEYWORDS = ['emit_event', 'set', 'add', 'drift', 'metadata', 'spawn_actor', 'adjust_stability', 'adjust_entropy', 'calc', 'formula']
    HEADER_KEYWORDS = ['rule', 'priority', 'scope', 'cooldown', 'chance', 'else', 'constraints', 'dependencies']

    for line in lines:
        raw_line = line
        stripped = line.strip()
        
        # Preserve comments and empty lines
        if not stripped or stripped.startswith('#') or stripped.startswith('//'):
            new_lines.append(raw_line)
            continue
            
        # Clean current line
        # Map condition -> when, action -> then
        lower = stripped.lower()
        if lower.startswith('condition '):
            stripped = 'when ' + stripped[10:].strip()
        elif lower == 'condition':
            stripped = 'when'
        elif lower == 'action' or lower == 'actions':
            stripped = 'then'
        elif lower.startswith('action '):
            stripped = 'then ' + stripped[7:].strip()
            
        lower = stripped.lower()
        parts = lower.split()
        first_word = parts[0] if parts else ""
        
        # 1. Handle Rule Header
        if first_word == 'rule':
            current_phase = 'rule'
            name = stripped[4:].strip().rstrip('{').rstrip(':').rstrip(',').strip()
            if (name.startswith('"') and name.endswith('"')) or (name.startswith("'") and name.endswith("'")):
                 name = name[1:-1]
            new_lines.append(f"rule {name}")
            continue
            
        # 2. Handle when/then/else
        if first_word == 'when':
            current_phase = 'when'
            new_lines.append('when')
            rest = stripped[4:].strip().rstrip('{').rstrip(':').rstrip(',').strip()
            if (rest.startswith('"') and rest.endswith('"')) or (rest.startswith("'") and rest.endswith("'")):
                 rest = rest[1:-1]
            if rest:
                new_lines.append(rest)
            continue
            
        if first_word == 'then':
            current_phase = 'then'
            new_lines.append('then')
            rest = stripped[4:].strip().rstrip('{').rstrip(':').rstrip(',').strip()
            if (rest.startswith('"') and rest.endswith('"')) or (rest.startswith("'") and rest.endswith("'")):
                 rest = rest[1:-1]
            if rest:
                new_lines.append(rest)
            continue
            
        if first_word == 'else':
            new_lines.append('else')
            continue
            
        # 3. Handle specific header keywords
        if first_word in HEADER_KEYWORDS:
            new_lines.append(stripped.rstrip('{').rstrip(':').rstrip(',').strip())
            continue

        # 4. Ignore block terminators
        if stripped in ['}', 'end', '};']:
            continue

        # 5. Handle lines inside blocks or general lines
        # Clean up trailing garbage
        cleaned = stripped.rstrip('{').rstrip('}').rstrip(',').strip()
        
        if current_phase == 'then':
            # Specialized action handling
            if cleaned.startswith('emit_event'):
                # Extract event name only for Rust for now
                act_parts = cleaned.split()
                if len(act_parts) >= 2:
                    ev_name = act_parts[1].rstrip('{').rstrip(',').rstrip('}').strip()
                    new_lines.append(f"emit_event {ev_name}")
                continue
            
            # Convert key: val to metadata if not a known action
            if ':' in cleaned and not any(cleaned.startswith(kw) for kw in ACTION_KEYWORDS):
                kv = cleaned.split(':', 1)
                k = kv[0].strip()
                v = kv[1].strip().rstrip(',').rstrip('}').strip()
                if k and v:
                    new_lines.append(f"metadata {k} {v}")
                    continue
                    
            new_lines.append(cleaned)
        elif current_phase == 'when':
            # Keep condition lines but clean them
            new_lines.append(cleaned)
        else:
            # Lines before any block or outside blocks (before first rule)
            if cleaned:
                new_lines.append(cleaned)

    # Final pass to remove trailing empty lines
    while new_lines and not (new_lines[-1] and new_lines[-1].strip()):
        new_lines.pop()
        
    return '\n'.join(new_lines)

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.dsl'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = refactor_dsl_safe(content)
                    
                    with open(path, 'w', encoding='utf-8', newline='\n') as f:
                        f.write(new_content)
                    print(f"Refactored {file}")
                except Exception as e:
                    print(f"Error processing {file}")

if __name__ == "__main__":
    target_dir = r"C:\projects\IPFactory\backend\resources\worldos_rules"
    process_directory(target_dir)
