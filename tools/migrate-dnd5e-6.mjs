import { ClassicLevel } from 'classic-level';
const db = new ClassicLevel('./db-final', { valueEncoding: 'json' });
await db.open();

const older = (t, v) => { if (!v) return true;
  const a=String(t).split('.').map(Number), b=String(v).split('.').map(Number);
  for (let i=0;i<3;i++){ if((a[i]||0)>(b[i]||0)) return true; if((a[i]||0)<(b[i]||0)) return false; }
  return false; };

const n = {};
const B = k => n[k] = (n[k]||0)+1;

/** ActiveEffect5e.migrateData + _migrateEffectOrigin (origin kept as fallback). */
function effect(e) {
  const r = e.flags?.dnd5e?.riders?.statuses;
  if (r && !e.system?.rider?.statuses) {
    e.system ??= {}; e.system.rider ??= {}; e.system.rider.statuses = r;
    delete e.flags.dnd5e.riders.statuses;
    if (!Object.keys(e.flags.dnd5e.riders).length) delete e.flags.dnd5e.riders;
    B('AE riders.statuses -> system.rider.statuses');
  }
  const origin = e.flags?.core?.originText ?? e.origin;
  const already = Object.values(e.system?.origin ?? {}).some(v => v);
  if (origin && !already) {
    const field = origin.includes('Activity') ? 'activity'
      : origin.includes('ActiveEffect') ? 'effect'
      : origin.includes('Item') ? 'item'
      : origin.includes('Actor') ? 'actor'
      : origin.includes('RegionBehavior') ? 'behavior' : undefined;
    if (field) {
      e.system ??= {}; e.system.origin ??= {}; e.system.origin[field] = origin;
      B(`AE origin -> system.origin.${field}`);
    }
  }
}

/** migrateItemData: NPC-owned normalisation + gear property. */
function item(i, actorType) {
  (i.effects ?? []).forEach(effect);
  if (actorType !== 'npc') return;
  if (i.system?.prepared === false) { i.system.prepared = 1; B('npc item prepared -> 1'); }
  if (i.system?.equipped === false) { i.system.equipped = true; B('npc item equipped -> true'); }
  const props = i.system?.properties;
  const src = String(i._stats?.compendiumSource ?? '');
  if (Array.isArray(props) && i.system?.quantity && i.system?.type?.value !== 'natural'
    && (!['equipment','weapon'].includes(i.type) || i._stats?.compendiumSource)
    && !props.includes('gear')
    && !src.startsWith('Compendium.dnd-monster-manual.features.')
    && older('5.3.0', i._stats?.systemVersion)) {
    props.push('gear'); B('npc item + "gear" property');
  }
}

/** migrateActorData: prototype token lockScale. */
function actor(a) {
  if (a.system?.traits?.size === 'sm' && !a.prototypeToken?.ring?.enabled
    && older('6.0.0', a._stats?.systemVersion)) {
    a.prototypeToken ??= {};
    a.prototypeToken.flags ??= {};
    a.prototypeToken.flags.dnd5e ??= {};
    a.prototypeToken.flags.dnd5e.lockScale = true;
    B('actor prototypeToken lockScale');
  }
  (a.effects ?? []).forEach(effect);
  (a.items ?? []).forEach(i => item(i, a.type));
}

let keys = 0;
for await (const [key, adv] of db.iterator()) {
  if (!key.startsWith('!adventures')) continue;
  keys++;
  const smallIds = new Set();
  for (const a of adv.actors ?? []) { actor(a); if (a.system?.traits?.size === 'sm') smallIds.add(a._id); }
  for (const i of adv.items ?? []) item(i, null);
  for (const s of adv.scenes ?? []) {
    for (const t of s.tokens ?? []) {
      const size = t.delta?.system?.traits?.size ?? (smallIds.has(t.actorId) ? 'sm' : undefined);
      if (size === 'sm' && !t.ring?.enabled && older('6.0.0', s._stats?.systemVersion)) {
        t.flags ??= {}; t.flags.dnd5e ??= {}; t.flags.dnd5e.lockScale = true;
        B('scene token lockScale');
      }
    }
  }
  await db.put(key, adv);
}

console.log(`adventure keys rewritten: ${keys}\n`);
for (const [k, v] of Object.entries(n).sort((a,b)=>b[1]-a[1])) console.log(String(v).padStart(6), k);
await db.compactRange('!', '~');
await db.close();
