import io

def fix_types():
    filepath = 'engine/worldos-core/src/types.rs'
    with io.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fields = [
        'structured_mass', 'entropy', 'material_stress', 
        'embodied_knowledge', 'inequality', 'trauma', 
        'knowledge_frontier', 'regional_scars'
    ]
    
    for field in fields:
        # Thay thế "field: 0," thành "field: 0.0,"
        content = content.replace(field + ': 0,', field + ': 0.0,')
    
    with io.open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_imports():
    filepath = 'engine/worldos-core/src/universe_meta.rs'
    with io.open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = [line for line in lines if 'use crate::constants;' not in line]
    
    with io.open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    fix_types()
    fix_imports()
