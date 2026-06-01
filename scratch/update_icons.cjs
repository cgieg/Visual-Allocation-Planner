const fs = require('fs');
const glob = require('glob');

glob("src/components/**/*.tsx", (err, files) => {
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find all lucide imports
    const match = content.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+'lucide-react'/);
    if (match) {
      const icons = match[1].split(',').map(i => i.trim());
      icons.forEach(icon => {
        // Add strokeWidth={1.5} to icon tags that don't have it
        const regex = new RegExp(`<${icon}(?![^>]*strokeWidth)`, 'g');
        content = content.replace(regex, `<${icon} strokeWidth={1.5}`);
      });
      fs.writeFileSync(file, content);
    }
  });
});
