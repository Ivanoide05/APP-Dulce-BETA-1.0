const fs = require('fs');
const execSync = require('child_process').execSync;
const txt = fs.readFileSync('C:\\Users\\ivanr\\Desktop\\IA\\Dulce_Jaleo_Proyecto_Completo\\DULCE_JALEO_BASE_BETA\\index.html', 'utf8');

const scripts = txt.match(/<script>([\s\S]*?)<\/script>/g);
if (scripts) {
    scripts.forEach((s, i) => {
        let code = s.replace(/<script>|<\/script>/g, '');
        fs.writeFileSync(`script_${i}.js`, code, 'utf8');
        try {
            console.log(`Checking script ${i}...`);
            execSync(`node -c script_${i}.js`, { encoding: 'utf8' });
            console.log(`Script ${i} syntax OK.`);
        } catch (e) {
            console.error(`Script ${i} syntax ERROR:\n`, e.stderr || e.stdout || e.message);
        }
    });
}
