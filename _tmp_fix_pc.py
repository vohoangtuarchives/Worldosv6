import os

# PlayerControls.tsx
filepath1 = 'c:/projects/IPFactory/frontend/src/components/vaf/PlayerControls.tsx'
content1 = open(filepath1, 'r', encoding='utf-8').read()

# Fix line 27: formatTime return
content1 = content1.replace(
    '  return ;',
    "  return `${m}:${s.toString().padStart(2, '0')}`;",
)

# Fix line 131: progress width
content1 = content1.replace(
    'style={{ width:  }}',
    'style={{ width: `${progress * 100}%` }}',
)

# Fix line 176: className template
content1 = content1.replace(
    'className={}',
    "className={`rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-2.5 h-2.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                        : isPast
                        ? 'w-2 h-2 bg-white/50'
                        : 'w-2 h-2 bg-white/20'
                    }`}",
)

with open(filepath1, 'w', encoding='utf-8', newline='
') as f:
    f.write(content1)
print('PlayerControls.tsx fixed.')