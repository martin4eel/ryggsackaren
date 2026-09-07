/**
 * Stämplar service workerns skalcache med byggets commit, så att den töms
 * vid varje ny utgåva utan att någon behöver minnas att byta ett tal.
 *
 * Skalcachen är cache-först och innehåller allt som inte har hash i
 * namnet: startsidan, ikonerna, ljuden och butiksytorna. Namnet stod som
 * "v97" och byttes för hand, tills det slutade bytas - och då serverade
 * spelet den gamla app-ikonen för alltid, hur man än laddade om.
 *
 * Körs sist i `npm run build` och ändrar bara dist/sw.js; källfilen i
 * public/ behåller sin platshållare.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const fil = 'dist/sw.js';
if (!existsSync(fil)) {
  console.error(`${fil} saknas. Kör vite build först.`);
  process.exit(1);
}
const git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
};
const commit = git(['rev-parse', '--short', 'HEAD']) || Date.now().toString(36);
// Ett bygge med osparade ändringar får en tidsstämpel också, så att två
// byggen av samma commit inte får samma cache.
const smutsigt = git(['status', '--porcelain']) !== '';
const stampel = smutsigt ? `${commit}-${Date.now().toString(36)}` : commit;

const s = readFileSync(fil, 'utf8');
const ny = s.replace(/upptackaren-skal-[A-Za-z0-9-]+/, `upptackaren-skal-${stampel}`);
if (ny === s) {
  console.error('Hittade ingen skalcache att stämpla i dist/sw.js.');
  process.exit(1);
}
writeFileSync(fil, ny);
console.log(`Service workerns skalcache: upptackaren-skal-${stampel}`);
