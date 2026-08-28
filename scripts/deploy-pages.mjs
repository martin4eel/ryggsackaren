/**
 * Publicerar det byggda spelet till branchen gh-pages, som GitHub Pages sedan
 * serverar. Används i stället för ett GitHub Actions-arbetsflöde när den token
 * som finns till hands saknar workflow-scope.
 *
 * Körs med: npm run deploy
 *
 * Autentisering sker via git credential helper, eller via miljövariablerna
 * GH_USER och GH_TOKEN om de är satta. Token skrivs aldrig till disk.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BRANCH = 'gh-pages';
const DIST = 'dist';

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', ...opts });

if (!existsSync(DIST)) {
  console.error(`Hittar ingen ${DIST}-mapp. Kör "npm run build" först.`);
  process.exit(1);
}

// Bygget måste innehålla en startsida, annars publicerar vi något trasigt.
if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`${DIST}/index.html saknas. Bygget ser inte komplett ut.`);
  process.exit(1);
}

const remote = run('git', ['remote', 'get-url', 'origin']).trim();
const sourceCommit = run('git', ['rev-parse', '--short', 'HEAD']).trim();

// Om token skickas med via miljön använder vi en askpass-fil i en temporär
// mapp, så att hemligheten varken hamnar i .git/config eller i skalhistoriken.
let askpassDir;
const env = { ...process.env };
if (process.env.GH_TOKEN) {
  askpassDir = mkdtempSync(join(tmpdir(), 'deploy-askpass-'));
  const askpass = join(askpassDir, 'askpass.sh');
  writeFileSync(
    askpass,
    '#!/bin/sh\ncase "$1" in\n  *[Uu]sername*) printf "%s\\n" "$GH_USER" ;;\n  *) printf "%s\\n" "$GH_TOKEN" ;;\nesac\n'
  );
  chmodSync(askpass, 0o700);
  env.GIT_ASKPASS = askpass;
  env.GIT_TERMINAL_PROMPT = '0';
}

// Vi bygger upp branchen i ett eget arbetsträd så att din vanliga
// arbetskopia aldrig rörs.
const work = mkdtempSync(join(tmpdir(), 'ryggsackaren-gh-pages-'));

try {
  run('git', ['init', '-q', '-b', BRANCH], { cwd: work });
  run('git', ['config', 'user.name', run('git', ['config', 'user.name']).trim()], { cwd: work });
  run('git', ['config', 'user.email', run('git', ['config', 'user.email']).trim()], { cwd: work });

  // Kopiera in bygget. -a bevarar tidsstämplar, punktfiler tas med.
  run('sh', ['-c', `cp -a "${process.cwd()}/${DIST}/." "${work}/"`]);

  // Egen domän: public/CNAME följer med bygget till dist/ och därmed hit.
  // Utan den nollställer varje publicering domäninställningen på GitHub.
  if (!existsSync(join(work, 'CNAME'))) throw new Error('CNAME saknas i bygget - public/CNAME borta?');

  // .nojekyll krävs för att GitHub Pages inte ska filtrera bort filer och
  // mappar som börjar med understreck.
  writeFileSync(join(work, '.nojekyll'), '');

  run('git', ['add', '-A'], { cwd: work });
  run(
    'git',
    ['commit', '-q', '-m', `Publicera spelet, byggt från ${sourceCommit}`],
    { cwd: work }
  );
  run('git', ['remote', 'add', 'origin', remote], { cwd: work });

  // Hämta befintlig gh-pages och lägg den nya versionen ovanpå. En vanlig
  // commit på toppen av historiken är det som får GitHub Pages att bygga om;
  // en force-push med fristående historik ignoreras ibland.
  let nothingToDo = false;
  let hasRemoteBranch = true;
  try {
    run('git', ['-c', 'credential.helper=', 'fetch', '-q', '--depth', '1', 'origin', BRANCH], {
      cwd: work,
      env,
    });
  } catch {
    hasRemoteBranch = false;
  }

  if (hasRemoteBranch) {
    // Behåll historiken men ersätt innehållet med det nya bygget.
    run('git', ['reset', '--soft', 'FETCH_HEAD'], { cwd: work });
    run('git', ['add', '-A'], { cwd: work });
    const changed = run('git', ['status', '--porcelain'], { cwd: work }).trim();
    if (!changed) {
      console.log(
        'Inget nytt att publicera, bygget är identiskt med det som ligger ute.'
      );
      nothingToDo = true;
    } else {
      run(
        'git',
        ['commit', '-q', '-m', `Publicera spelet, byggt från ${sourceCommit}`],
        { cwd: work }
      );
    }
  }

  if (!nothingToDo) {
    console.log(`Publicerar ${DIST}/ till ${BRANCH} ...`);
    run('git', ['-c', 'credential.helper=', 'push', 'origin', BRANCH], {
      cwd: work,
      env,
      stdio: 'inherit',
    });
  }

  const match = nothingToDo ? null : remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (match) {
    const [, user, repo] = match;
    console.log(`\nKlart. Spelet blir tillgängligt på:`);
    console.log(`  https://${user}.github.io/${repo}/`);
    console.log(
      `\nFörsta gången: kontrollera att Settings -> Pages har Source satt till` +
        `\n"Deploy from a branch", branch ${BRANCH} och mapp / (root).`
    );
  }
} finally {
  rmSync(work, { recursive: true, force: true });
  if (askpassDir) rmSync(askpassDir, { recursive: true, force: true });
}
