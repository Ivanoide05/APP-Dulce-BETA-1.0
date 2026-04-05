const fs = require('fs');
const targetFile = 'c:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\index.html';
let content = fs.readFileSync(targetFile, 'utf8');

// The FAB HTML:
//         <button class="nav-btn-fab" id="fabBtn" title="Escanear Documento">
//            <div class="fab-inner">
//                <span style="display:inline-flex; align-items:center; justify-content:center; margin-right:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="lucide lucide-camera" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></span>
//            </div>
//        </button>

// Replace any occurrence of the nav-btn-fab block up to the closing </button>
const fabRegex = /<!-- Scanner FAB \(center\) -->\s*<button class="nav-btn-fab"[^>]*>[\s\S]*?<\/button>/gi;
content = content.replace(fabRegex, '<!-- Scanner FAB removed at user request -->');

// Also remove any stray fabBtn if the comment wasn't exactly right
const fallbackRegex = /<button class="nav-btn-fab"[^>]*>[\s\S]*?<\/button>/gi;
content = content.replace(fallbackRegex, '');

// The bottom nav inner style needs to handle 5 items evenly
const bottomNavRegex = /\.bottom-nav-inner\s*\{[^}]*\}/g;
// Actually the CSS handles flex distribution, but let's make sure it doesn't pad the middle
const fabFix = /\.nav-btn:nth-child\(2\)\s*\{\s*margin-right:\s*48px;\s*\}/g;
content = content.replace(fabFix, '/* margin-right removed */');

fs.writeFileSync(targetFile, content);
console.log("Camera FAB and layout constraints removed from bottom nav.");
