/**
 * Make the "Landing Page" handout buttons toggle instead of latching.
 *
 * The Landing Page scene (adventure "Core Resources & Intro") is a GM-facing
 * board: ten handout tiles, all hidden, plus a row of Monk's Active Tiles
 * buttons that reveal them to the players. Every button was one-way —
 *
 *     activate  -> "activate"     make the handout tile's own triggers live
 *     showhide  -> "show"         un-hide it for players
 *     tileimage -> select "2"     swap the button art to its lit state
 *
 * so clicking a lit button just re-ran the same three actions and nothing
 * turned off. The only way back was the separate Reset button.
 *
 * This flips each of those to its reversible form: "toggle", "toggle" and
 * "next". All three values are already used elsewhere in this same pack by the
 * original author, so nothing new is being invented — `select: "next"` is
 * paired with `loop: 1` to match the pack's dominant usage (24 of 41).
 *
 * Deliberately left alone:
 *
 *   - the `permissions` actions, which grant players Observer on the matching
 *     Party Journal page. Monk's Active Tiles has no toggle for permission, and
 *     silently revoking a handout the party has already read is worse than
 *     leaving it readable. The Reset button still revokes all of them.
 *   - the Reset button itself (tag `lp-reset`), which must stay one-way.
 *
 *   node toggle-landing-page-buttons.mjs <pack-dir> [--apply]
 *
 * Without --apply it is a dry run. Same `classic-level` working-directory
 * caveat as the other scripts here.
 */
import { ClassicLevel } from 'classic-level';

const [packDir, ...rest] = process.argv.slice(2);
const APPLY = rest.includes('--apply');
if (!packDir) {
  console.error('usage: toggle-landing-page-buttons.mjs <pack-dir> [--apply]');
  process.exit(1);
}

const SCENE = 'Landing Page';
/** Buttons are tagged `lp-…-btn`; the Reset tile is `lp-reset` and is excluded. */
const isButton = tile => (tile.flags?.tagger?.tags ?? []).some(t => /-btn$/.test(t));

const db = new ClassicLevel(packDir, { valueEncoding: 'json' });
await db.open();

let changed = 0;
const log = [];
const batch = [];

for await (const [key, doc] of db.iterator()) {
  let touched = false;
  for (const scene of doc.scenes ?? []) {
    if (scene.name !== SCENE) continue;
    for (const [i, tile] of (scene.tiles ?? []).entries()) {
      if (!isButton(tile)) continue;
      const actions = tile.flags?.['monks-active-tiles']?.actions ?? [];
      for (const a of actions) {
        const d = a.data;
        if (!d) continue;
        let what = null;
        if (a.action === 'activate' && d.activate === 'activate') { d.activate = 'toggle'; what = 'activate -> toggle'; }
        else if (a.action === 'showhide' && d.hidden === 'show') { d.hidden = 'toggle'; what = 'show -> toggle'; }
        else if (a.action === 'tileimage' && String(d.select) === '2') { d.select = 'next'; d.loop = 1; what = 'select 2 -> next'; }
        if (what) {
          const target = d.entity?.id === 'tile' ? 'self' : String(d.entity?.id ?? '').replace('tagger:', '');
          log.push(`  tile ${String(i).padStart(2)} ${(tile.flags.tagger.tags[0]).padEnd(24)} ${a.action.padEnd(10)} ${what.padEnd(18)} [${target}]`);
          changed++; touched = true;
        }
      }
    }
  }
  if (touched) batch.push({ type: 'put', key, value: doc });
}

if (APPLY && batch.length) {
  await db.batch(batch);
  await db.compactRange('!', '~');
}
await db.close();

console.log(log.join('\n'));
console.log(`\n${changed} actions in ${batch.length} document(s)`);
console.log(APPLY ? 'applied' : 'dry run - pass --apply to write');
