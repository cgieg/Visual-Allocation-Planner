import glob
import re

for file in glob.glob("src/components/**/*.tsx", recursive=True):
    with open(file, 'r') as f:
        content = f.read()
    
    # Find lucide imports
    match = re.search(r"import\s+\{([^}]+)\}\s+from\s+'lucide-react'", content)
    if match:
        icons = [i.strip() for i in match.group(1).split(',')]
        for icon in icons:
            # Look for <IconName and insert strokeWidth={1.5} if not present
            # e.g., <Plus size={16} -> <Plus strokeWidth={1.5} size={16}
            content = re.sub(rf"<{icon}\b(?![^>]*strokeWidth)", f"<{icon} strokeWidth={{1.5}}", content)
        
        with open(file, 'w') as f:
            f.write(content)
