// scripts/vscode-watcher-mute.js
const fs = require('fs');
const path = require('path');

const mode = process.argv[2]; // "on" | "off"
const dir = process.cwd();
const vsDir = path.join(dir, '.vscode');
const settingsPath = path.join(vsDir, 'settings.json');
const backupPath = path.join(vsDir, 'settings.before-install.json');

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}
function writeJSON(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

if (mode === 'on') {
  if (fs.existsSync(settingsPath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(settingsPath, backupPath);
  }
  const s = readJSON(settingsPath);

  // Mute FS churn
  s['files.watcherExclude'] = Object.assign({}, s['files.watcherExclude'], {
    '**/node_modules/**': true,
    '**/.pnpm/**': true,
  });
  s['search.exclude'] = Object.assign({}, s['search.exclude'], {
    '**/node_modules/**': true,
    '**/.pnpm/**': true,
  });

  // Mute Git while installing
  s['git.autorefresh'] = false;
  s['git.autofetch'] = false;
  s['git.decorations.enabled'] = false;
  s['git.countBadge'] = 'off';
  // Optional: reduce SCM diff noise (safe to omit if you prefer)
  s['scm.diffDecorations'] = 'none';

  // Optional extras you can enable if needed:
  // s['typescript.tsserver.maxTsServerMemory'] = 1024;
  // s['typescript.tsserver.experimental.enableProjectDiagnostics'] = false;
  // s['eslint.lintTask.enable'] = false;

  writeJSON(settingsPath, s);
  console.log('VS Code watchers & Git auto-* muted for install.');
} else if (mode === 'off') {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, settingsPath);
    fs.unlinkSync(backupPath);
    console.log('VS Code settings restored.');
  } else {
    console.log('No backup found; left settings as-is.');
  }
} else {
  console.error('Usage: node scripts/vscode-watcher-mute.js on|off');
  process.exit(1);
}
