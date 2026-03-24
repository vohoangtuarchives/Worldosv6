import os

def refactor_dsl(content):
    # Initial normalization: map condition/action to when/then
    # Use careful replaces to avoid middle-of-word hits
    lines = content.split('\n')
    processed_lines = []
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('condition '):
            line = line.replace('condition ', 'when ', 1)
        elif stripped.startswith('condition"'):
            line = line.replace('condition"', 'when "', 1)
        elif stripped == 'condition':
            line = line.replace('condition', 'when', 1)
        elif stripped == 'action':
            line = line.replace('action', 'then', 1)
        elif stripped.startswith('action '):
            line = line.replace('action ', 'then ', 1)
        processed_lines.append(line)
        
    content = '\n'.join(processed_lines)
    
    lines = content.split('\n')
    new_lines = []
    current_phase = None
    
    ACTION_KEYWORDS = ['emit_event', 'set', 'add', 'drift', 'metadata', 'spawn_actor', 'adjust_stability', 'adjust_entropy', 'calc', 'formula']
    HEADER_KEYWORDS = ['rule', 'priority', 'scope', 'cooldown', 'chance', 'else', 'constraints', 'dependencies']

    for line in lines:
        raw_line = line
        line = line.strip()
        
        # Preserve comments and empty lines
        if not line or line.startswith('#') or line.startswith('//'):
            new_lines.append(raw_line)
            continue
            
        lower = line.lower()
        parts = lower.split()
        first_word = parts[0] if parts else ""
        
        # Rule Header
        if first_word == 'rule':
            current_phase = 'rule'
            name = line[4:].strip().rstrip('{').rstrip(':').rstrip(',').strip().strip('"')
            new_lines.append(f"rule {name}")
            continue
            
        # When / Then Keywords
        if first_word == 'when':
            current_phase = 'when'
            new_lines.append('when')
            rest = line[4:].strip().rstrip('{').rstrip(':').rstrip(',').strip().strip('"')
            if rest:
                new_lines.append(rest)
            continue
            
        if first_word == 'then':
            current_phase = 'then'
            new_lines.append('then')
            rest = line[4:].strip().rstrip('{').rstrip(':').rstrip(',').strip().strip('"')
            if rest:
                new_lines.append(rest)
            continue
            
        if first_word == 'else':
            new_lines.append('else')
            continue
            
        # Other Header items
        if first_word in ['priority', 'scope', 'cooldown', 'chance', 'constraints', 'dependencies']:
            new_lines.append(line.rstrip('{').rstrip(':').rstrip(',').strip())
            continue

        # Ignore terminators
        if line in ['}', 'end', '};']:
            continue

        # Action Logic (inside then)
        if current_phase == 'then':
            if first_word == 'emit_event':
                parts = line.split()
                if len(parts) >= 2:
                    event_name = parts[1].rstrip('{').rstrip(',').rstrip('}').strip()
                    new_lines.append(f"emit_event {event_name}")
                continue
            
            if ':' in line and first_word not in ACTION_KEYWORDS:
                # Potential metadata (key: val)
                parts = line.split(':', 1)
                k = parts[0].strip()
                v = parts[1].strip().rstrip(',').rstrip('}').strip()
                if k and v:
                    new_lines.append(f"metadata {k} {v}")
                    continue
            
            # Default action preservation
            new_lines.append(line.rstrip('{').rstrip('}').rstrip(',').strip().strip('"'))
            continue
            
        # Condition Logic (inside when)
        if current_phase == 'when':
            new_lines.append(line.rstrip('{').rstrip('}').rstrip(',').strip().strip('"'))
            continue
            
        # Fallback
        new_lines.append(line.rstrip('{').rstrip('}').rstrip(',').strip())

    # Final cleanup: remove empty lines at end
    while new_lines and new_lines[-1] == "":
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
                    
                    new_content = refactor_dsl(content)
                    
                    with open(path, 'w', encoding='utf-8', newline='\n') as f:
                        f.write(new_content)
                except Exception as e:
                    # Avoid printing characters that might cause encoding errors
                    print(f"Error processing {file}")

if __name__ == "__main__":
    target_dir = r"C:\projects\IPFactory\backend\resources\worldos_rules"
    process_directory(target_dir)
