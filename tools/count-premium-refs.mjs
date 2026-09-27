/**
 * Counts references from the Adventure pack into the premium WotC modules, grouped by
 * the field they live in. Used to decide whether `relationships.recommends` was
 * actually load-bearing (MIGRATION-V14.md §9). It was not: the overwhelming majority
 * are `_stats.compendiumSource`, which is provenance metadata only.
 *
 *   node count-premium-refs.mjs [path/to/Packs/Curse-of-Strahd]
 */
import { ClassicLevel } from 'classic-level';

const path = process.argv[2] ?? './db-final';
const PREMIUM = /^(dnd-players-handbook|dnd-monster-manual|dnd-dungeon-masters-guide|JB2A_DnD5e)$/;

const db = new ClassicLevel(path, { valueEncoding: 'json' });
await db.open();

const byField = {};
const byModule = {};

function walk(node, field) {
  if (node === null || node === undefined) return;
  if (typeof node === 'string') {
    const m = node.match(/Compendium\.([\w-]+)\./);
    if (m && PREMIUM.test(m[1])) {
      const key = field.replace(/\.\d+/g, '[]');   // collapse array indices
      byField[key] = (byField[key] ?? 0) + 1;
      byModule[m[1]] = (byModule[m[1]] ?? 0) + 1;
    }
    return;
  }
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${field}.${i}`));
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, field ? `${field}.${k}` : k);
  }
}

for await (const [, value] of db.iterator()) walk(value, '');
await db.close();

const total = Object.values(byField).reduce((a, b) => a + b, 0);
console.log(`total references: ${total}\n`);

console.log('by module:');
for (const [k, v] of Object.entries(byModule).sort((a, b) => b[1] - a[1])) {
  console.log(String(v).padStart(6), k);
}

console.log('\nby field:');
for (const [k, v] of Object.entries(byField).sort((a, b) => b[1] - a[1])) {
  console.log(String(v).padStart(6), k.replace(/^adventure\./, ''));
}
