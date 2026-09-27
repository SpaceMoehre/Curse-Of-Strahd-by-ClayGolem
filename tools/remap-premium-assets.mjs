/**
 * Repoint asset paths that live in the premium WotC modules
 * (dnd-monster-manual, dnd-dungeon-masters-guide, dnd-players-handbook) at art
 * that ships with the dnd5e system or with Foundry core, so the pack renders
 * without those modules installed.
 *
 * Two sources are used, in this order:
 *
 *   1. creature art -> systems/dnd5e/tokens/<type>/<Name>.webp
 *      dnd5e 6.0 ships 479 creature tokens. Matched on the normalised filename,
 *      plus the explicit ALIAS table below for names that differ.
 *
 *   2. item / armor / class / species art -> icons/<...>.webp (Foundry core)
 *      dnd5e's own compendium items already point at core Foundry icons, so the
 *      mapping is read straight out of packs/_source rather than invented. Core
 *      icons are present in every Foundry install.
 *
 * Anything that matches neither is reported and left untouched.
 *
 *   node remap-premium-assets.mjs <pack-dir> <dnd5e-checkout> [--apply]
 *
 * Without --apply it is a dry run. See tools/README.md for the classic-level
 * working-directory caveat.
 */
import { ClassicLevel } from 'classic-level';
import fs from 'node:fs';
import path from 'node:path';

const [packDir, dnd5eDir, ...rest] = process.argv.slice(2);
const APPLY = rest.includes('--apply');
if (!packDir || !dnd5eDir) {
  console.error('usage: remap-premium-assets.mjs <pack-dir> <dnd5e-checkout> [--apply]');
  process.exit(1);
}

const PREMIUM = /^modules\/(dnd-monster-manual|dnd-dungeon-masters-guide|dnd-players-handbook)\//;
const IMAGE = /\.(webp|png|jpg|jpeg)$/i;

/** Filename -> comparison key: drop extension, drop a trailing -NN or -*, fold to a-z0-9. */
const norm = s => s.split('/').pop()
  .replace(IMAGE, '')
  .replace(/-(\d+|\*)$/, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------------------------------------------------------------- creature art

/** normalised name -> systems/dnd5e/tokens/... */
const tokens = new Map();
for (const dirent of fs.readdirSync(path.join(dnd5eDir, 'tokens'), { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue;
  for (const f of fs.readdirSync(path.join(dnd5eDir, 'tokens', dirent.name))) {
    if (!/\.webp$/i.test(f) || /thumb/i.test(f)) continue;
    tokens.set(norm(f), `systems/dnd5e/tokens/${dirent.name}/${f}`);
  }
}

/**
 * Creatures dnd5e names differently, or does not ship at all and a close
 * relative is better than a blank token. Values are keys into `tokens`.
 */
const ALIAS = {
  adultblackdragon: 'blackdragonadult',
  animatedrugofsmothering: 'rugofsmothering',
  batsmall: 'bat',
  cat: 'catorange',
  horse: 'ridinghorse',
  rats: 'swarmrats',
  skeletons: 'skeleton',
  swarmofbats: 'swarmbats',
  swarmofrats: 'swarmrats',
  swarmofravens: 'swarmravens',
  swarmofvenomoussnakes: 'swarmpoisonoussnakes',
  venomoussnake: 'poisonoussnake',
  // dnd5e ships only one blight; nearest kin beats the default token
  needleblight: 'twigblight',
  vineblight: 'twigblight'
};

// ------------------------------------------------------------------- item art

/** normalised item name -> core Foundry icon path, from dnd5e's own packs. */
const icons = new Map();
(function scan(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) { scan(p); continue; }
    if (!d.name.endsWith('.yml')) continue;
    const text = fs.readFileSync(p, 'utf8');
    const name = text.match(/^name: (.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
    const img = text.match(/^img: (.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
    if (!name || !img || !img.startsWith('icons/')) continue;
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!icons.has(key)) icons.set(key, img);
  }
})(path.join(dnd5eDir, 'packs', '_source'));

/**
 * dnd5e's item names are not always the premium module's filename. Try the
 * exact key, then the key with "armor" appended or stripped, then a unique
 * prefix match ("bagoftricks" -> "bagoftricksgray").
 */
function findIcon(key) {
  for (const k of [key, `${key}armor`, key.replace(/armor$/, '')]) {
    if (icons.has(k)) return icons.get(k);
  }
  const pre = [...icons.keys()].filter(k => k.startsWith(key));
  return pre.length ? icons.get(pre.sort((a, b) => a.length - b.length)[0]) : null;
}

/** Item-art paths whose filename is not a dnd5e item name. */
const ITEM_ALIAS = {
  // a magic item dnd5e does not ship, mapped to the mundane weapon it is one of
  moontouchedswordrapier: 'rapier',
  // nearest potion dnd5e ships, so the icon still reads as a potion
  potionoffirebreath: 'potionoffireresistance',
  // no dnd5e item; both are glass spheres, and Crystal Ball's icon is one
  driftglobe: 'crystalball',
  orbofdirection: 'crystalball',
  studdedleatherarmor: 'studdedleather',
  khazanstaff: 'quarterstaff',
  animatedobject: 'flyingsword'
};

// ------------------------------------------------------------------ the mapping

/** A premium path is creature art unless it sits in an icons/ or classes/ dir. */
const isItemArt = p => /\/(icons|subjects)\//.test(p);

function resolve(p) {
  const key = norm(p);
  if (isItemArt(p)) {
    const aliased = ITEM_ALIAS[key] ?? key;
    // a few "icons" are creatures (subjects/animated-object); fall through to tokens
    return findIcon(aliased) ?? tokens.get(ALIAS[key] ?? key) ?? null;
  }
  return tokens.get(ALIAS[key] ?? key) ?? findIcon(key) ?? null;
}

// ------------------------------------------------------------------ walk the db

const db = new ClassicLevel(packDir, { valueEncoding: 'json' });
await db.open();

const found = new Set();
(function () {})();
for await (const [, v] of db.iterator()) collect(v);
function collect(n) {
  if (n === null || n === undefined) return;
  if (typeof n === 'string') { if (PREMIUM.test(n) && IMAGE.test(n)) found.add(n); return; }
  if (Array.isArray(n)) return n.forEach(collect);
  if (typeof n === 'object') return Object.values(n).forEach(collect);
}

const map = new Map();
const unresolved = [];
for (const p of [...found].sort()) {
  const hit = resolve(p);
  if (hit) map.set(p, hit); else unresolved.push(p);
}

// ------------------------------------------------------------------- rewrite

let rewritten = 0, docs = 0;
function rewrite(n) {
  if (n === null || n === undefined) return n;
  if (typeof n === 'string') {
    const hit = map.get(n);
    if (hit) { rewritten++; return hit; }
    return n;
  }
  if (Array.isArray(n)) return n.map(rewrite);
  if (typeof n === 'object') {
    for (const [k, v] of Object.entries(n)) n[k] = rewrite(v);
    return n;
  }
  return n;
}

if (APPLY) {
  const batch = [];
  for await (const [k, v] of db.iterator()) {
    const before = JSON.stringify(v);
    const after = rewrite(v);
    if (JSON.stringify(after) !== before) { batch.push({ type: 'put', key: k, value: after }); docs++; }
  }
  await db.batch(batch);
  await db.compactRange('!', '~');
}
await db.close();

// -------------------------------------------------------------------- report

console.log(`distinct premium asset paths : ${found.size}`);
console.log(`  remapped                   : ${map.size}`);
console.log(`  left alone                 : ${unresolved.length}`);
if (unresolved.length) console.log('\nno dnd5e or core equivalent:\n  ' + unresolved.join('\n  '));
if (APPLY) console.log(`\napplied: ${rewritten} references across ${docs} documents`);
else console.log('\ndry run - pass --apply to write');

fs.writeFileSync('remap-plan.tsv', [...map].map(([a, b]) => `${a}\t${b}`).join('\n') + '\n');
