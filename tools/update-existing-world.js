/**
 * Curse of Strahd by ClayGolem - update an already-imported world to 2.0.3.
 *
 * Re-importing the Adventure would also work, but it overwrites every document
 * it owns: Foundry matches on document ID, so your moved tokens, rolled HP,
 * journal notes and scene tweaks all revert to pack state. This macro instead
 * rewrites only the fields that actually changed, and leaves everything else
 * alone.
 *
 * It does two things:
 *
 *   1. repoints art that lived in the premium WotC modules at the equivalent
 *      art shipped by the dnd5e system or Foundry core  (release 2.0.2)
 *   2. makes the Landing Page handout buttons toggle instead of latching
 *      (release 2.0.3)
 *
 * Run it once as a GM from a Script macro. It is idempotent - running it again
 * finds nothing left to do. It does not touch the six creatures dnd5e does not
 * ship (barlgura, blue slaad, death slaad, nothic, scarecrow, crawling claw);
 * those keep their broken paths and are reported at the end.
 */

const MAP = {
  "modules/dnd-dungeon-masters-guide/assets/icons/items/KhazanStaff.png": "icons/weapons/staves/staff-simple.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/bag-of-tricks.webp": "icons/containers/bags/sack-twisted-leather-red.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/broom-of-flying.webp": "icons/tools/hand/broom-straw-brown.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/cape-of-the-mountebank.webp": "icons/equipment/head/hood-cloth-trimmed-pink-gold.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/cloak-of-protection.webp": "icons/equipment/back/cloak-heavy-fur-blue.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/driftglobe.webp": "icons/commodities/materials/glass-orb.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/hat-of-disguise.webp": "icons/equipment/head/hat-belted-simple.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/manual-of-bodily-health.webp": "icons/sundries/books/book-red-square.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/moon-touched-sword-rapier.webp": "icons/weapons/swords/sword-guard-bronze.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/orb-of-direction.webp": "icons/commodities/materials/glass-orb.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/pipes-of-haunting.webp": "icons/tools/instruments/flute-simple-wood.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/potion-of-fire-breath.webp": "icons/consumables/potions/potion-bottle-stopped-labeled-red.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/potion-of-healing.webp": "icons/consumables/potions/potion-tube-corked-red.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/quarterstaff.webp": "icons/weapons/staves/staff-simple.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/ring-of-mind-shielding.webp": "icons/equipment/finger/ring-cabochon-gold-purple.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/staff-of-frost.webp": "icons/weapons/staves/staff-ornate-blue.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/stone-of-good-luck.webp": "icons/commodities/gems/gem-rough-rectangle-red.webp",
  "modules/dnd-dungeon-masters-guide/assets/icons/items/wand-of-secrets.webp": "icons/weapons/staves/staff-ornate-orb-steel-red.webp",
  "modules/dnd-dungeon-masters-guide/assets/portraits/goat.webp": "systems/dnd5e/tokens/beast/Goat.webp",
  "modules/dnd-dungeon-masters-guide/assets/portraits/zombie.webp": "systems/dnd5e/tokens/undead/Zombie.webp",
  "modules/dnd-dungeon-masters-guide/assets/subjects/goat.webp": "icons/commodities/bones/hooves-cloven-brown.webp",
  "modules/dnd-dungeon-masters-guide/assets/subjects/zombie.webp": "systems/dnd5e/tokens/undead/Zombie.webp",
  "modules/dnd-dungeon-masters-guide/assets/tokens/goat.webp": "systems/dnd5e/tokens/beast/Goat.webp",
  "modules/dnd-dungeon-masters-guide/assets/tokens/zombie.webp": "systems/dnd5e/tokens/undead/Zombie.webp",
  "modules/dnd-monster-manual/assets/icons/armor/chain-shirt.webp": "icons/equipment/chest/breastplate-scale-grey.webp",
  "modules/dnd-monster-manual/assets/icons/armor/hide-armor.webp": "icons/equipment/chest/vest-cloth-tattered-tan.webp",
  "modules/dnd-monster-manual/assets/icons/armor/shield.webp": "icons/equipment/shield/round-wooden-boss-steel-brown.webp",
  "modules/dnd-monster-manual/assets/icons/armor/studded-leather-armor.webp": "icons/equipment/chest/breastplate-rivited-red.webp",
  "modules/dnd-monster-manual/assets/icons/items/greataxe.webp": "icons/weapons/axes/axe-double-black.webp",
  "modules/dnd-monster-manual/assets/icons/items/longbow.webp": "icons/weapons/bows/longbow-recurve-leather-brown.webp",
  "modules/dnd-monster-manual/assets/icons/items/shortbow.webp": "icons/weapons/bows/shortbow-leather.webp",
  "modules/dnd-monster-manual/assets/icons/items/shortsword.webp": "icons/weapons/swords/sword-guard-worn-purple.webp",
  "modules/dnd-monster-manual/assets/icons/items/spear.webp": "icons/weapons/polearms/spear-flared-green.webp",
  "modules/dnd-monster-manual/assets/journal-art/rats.webp": "systems/dnd5e/tokens/beast/SwarmRats.webp",
  "modules/dnd-monster-manual/assets/journal-art/shadow.webp": "systems/dnd5e/tokens/undead/Shadow.webp",
  "modules/dnd-monster-manual/assets/journal-art/skeletons.webp": "systems/dnd5e/tokens/undead/Skeleton.webp",
  "modules/dnd-monster-manual/assets/journal-art/vrock.webp": "systems/dnd5e/tokens/fiend/Vrock.webp",
  "modules/dnd-monster-manual/assets/journal-art/werewolf.webp": "systems/dnd5e/tokens/humanoid/Werewolf.webp",
  "modules/dnd-monster-manual/assets/portraits/adult-black-dragon.webp": "systems/dnd5e/tokens/dragon/BlackDragonAdult.webp",
  "modules/dnd-monster-manual/assets/portraits/animated-armor.webp": "systems/dnd5e/tokens/construct/AnimatedArmor.webp",
  "modules/dnd-monster-manual/assets/portraits/animated-rug-of-smothering.webp": "systems/dnd5e/tokens/construct/RugOfSmothering.webp",
  "modules/dnd-monster-manual/assets/portraits/bat-small.webp": "systems/dnd5e/tokens/beast/Bat.webp",
  "modules/dnd-monster-manual/assets/portraits/cat.webp": "systems/dnd5e/tokens/beast/CatOrange.webp",
  "modules/dnd-monster-manual/assets/portraits/clay-golem.webp": "systems/dnd5e/tokens/construct/ClayGolem.webp",
  "modules/dnd-monster-manual/assets/portraits/dire-wolf.webp": "systems/dnd5e/tokens/beast/DireWolf.webp",
  "modules/dnd-monster-manual/assets/portraits/draft-horse.webp": "systems/dnd5e/tokens/beast/DraftHorse.webp",
  "modules/dnd-monster-manual/assets/portraits/flesh-golem.webp": "systems/dnd5e/tokens/construct/FleshGolem.webp",
  "modules/dnd-monster-manual/assets/portraits/gargoyle.webp": "systems/dnd5e/tokens/elemental/Gargoyle.webp",
  "modules/dnd-monster-manual/assets/portraits/ghost.webp": "systems/dnd5e/tokens/undead/Ghost.webp",
  "modules/dnd-monster-manual/assets/portraits/ghoul.webp": "systems/dnd5e/tokens/undead/Ghoul.webp",
  "modules/dnd-monster-manual/assets/portraits/giant-spider-01.webp": "systems/dnd5e/tokens/beast/GiantSpider.webp",
  "modules/dnd-monster-manual/assets/portraits/gray-ooze.webp": "systems/dnd5e/tokens/ooze/GrayOoze.webp",
  "modules/dnd-monster-manual/assets/portraits/grick.webp": "systems/dnd5e/tokens/monstrosity/Grick.webp",
  "modules/dnd-monster-manual/assets/portraits/guard.webp": "systems/dnd5e/tokens/humanoid/Guard.webp",
  "modules/dnd-monster-manual/assets/portraits/hyena.webp": "systems/dnd5e/tokens/beast/Hyena.webp",
  "modules/dnd-monster-manual/assets/portraits/needle-blight.webp": "systems/dnd5e/tokens/plant/TwigBlight.webp",
  "modules/dnd-monster-manual/assets/portraits/ogre-zombie.webp": "systems/dnd5e/tokens/undead/OgreZombie.webp",
  "modules/dnd-monster-manual/assets/portraits/phase-spider.webp": "systems/dnd5e/tokens/monstrosity/PhaseSpider.webp",
  "modules/dnd-monster-manual/assets/portraits/pseudodragon.webp": "systems/dnd5e/tokens/dragon/Pseudodragon.webp",
  "modules/dnd-monster-manual/assets/portraits/quasit.webp": "systems/dnd5e/tokens/fiend/Quasit.webp",
  "modules/dnd-monster-manual/assets/portraits/red-dragon-wyrmling.webp": "systems/dnd5e/tokens/dragon/RedDragonWyrmling.webp",
  "modules/dnd-monster-manual/assets/portraits/roc.webp": "systems/dnd5e/tokens/monstrosity/Roc.webp",
  "modules/dnd-monster-manual/assets/portraits/shield-guardian.webp": "systems/dnd5e/tokens/construct/ShieldGuardian.webp",
  "modules/dnd-monster-manual/assets/portraits/specter-01.webp": "systems/dnd5e/tokens/undead/Specter.webp",
  "modules/dnd-monster-manual/assets/portraits/swarm-of-ravens.webp": "systems/dnd5e/tokens/beast/SwarmRavens.webp",
  "modules/dnd-monster-manual/assets/portraits/swarm-of-venomous-snakes.webp": "systems/dnd5e/tokens/beast/SwarmPoisonousSnakes.webp",
  "modules/dnd-monster-manual/assets/portraits/twig-blight.webp": "systems/dnd5e/tokens/plant/TwigBlight.webp",
  "modules/dnd-monster-manual/assets/portraits/vampire-spawn.webp": "systems/dnd5e/tokens/undead/VampireSpawn.webp",
  "modules/dnd-monster-manual/assets/portraits/venomous-snake.webp": "systems/dnd5e/tokens/beast/PoisonousSnake.webp",
  "modules/dnd-monster-manual/assets/portraits/vine-blight.webp": "systems/dnd5e/tokens/plant/TwigBlight.webp",
  "modules/dnd-monster-manual/assets/portraits/wight.webp": "systems/dnd5e/tokens/undead/Wight.webp",
  "modules/dnd-monster-manual/assets/portraits/will-o-wisp-01.webp": "systems/dnd5e/tokens/undead/WilloWisp.webp",
  "modules/dnd-monster-manual/assets/portraits/wraith.webp": "systems/dnd5e/tokens/undead/Wraith.webp",
  "modules/dnd-monster-manual/assets/tokens/adult-black-dragon.webp": "systems/dnd5e/tokens/dragon/BlackDragonAdult.webp",
  "modules/dnd-monster-manual/assets/tokens/animated-armor.webp": "systems/dnd5e/tokens/construct/AnimatedArmor.webp",
  "modules/dnd-monster-manual/assets/tokens/animated-rug-of-smothering.webp": "systems/dnd5e/tokens/construct/RugOfSmothering.webp",
  "modules/dnd-monster-manual/assets/tokens/cat-*.webp": "systems/dnd5e/tokens/beast/CatOrange.webp",
  "modules/dnd-monster-manual/assets/tokens/cat-01.webp": "systems/dnd5e/tokens/beast/CatOrange.webp",
  "modules/dnd-monster-manual/assets/tokens/cat-02.webp": "systems/dnd5e/tokens/beast/CatOrange.webp",
  "modules/dnd-monster-manual/assets/tokens/clay-golem.webp": "systems/dnd5e/tokens/construct/ClayGolem.webp",
  "modules/dnd-monster-manual/assets/tokens/dire-wolf.webp": "systems/dnd5e/tokens/beast/DireWolf.webp",
  "modules/dnd-monster-manual/assets/tokens/flesh-golem.webp": "systems/dnd5e/tokens/construct/FleshGolem.webp",
  "modules/dnd-monster-manual/assets/tokens/gargoyle.webp": "systems/dnd5e/tokens/elemental/Gargoyle.webp",
  "modules/dnd-monster-manual/assets/tokens/ghast.webp": "systems/dnd5e/tokens/undead/Ghast.webp",
  "modules/dnd-monster-manual/assets/tokens/ghost.webp": "systems/dnd5e/tokens/undead/Ghost.webp",
  "modules/dnd-monster-manual/assets/tokens/ghoul.webp": "systems/dnd5e/tokens/undead/Ghoul.webp",
  "modules/dnd-monster-manual/assets/tokens/giant-spider-*.webp": "systems/dnd5e/tokens/beast/GiantSpider.webp",
  "modules/dnd-monster-manual/assets/tokens/giant-spider-01.webp": "systems/dnd5e/tokens/beast/GiantSpider.webp",
  "modules/dnd-monster-manual/assets/tokens/giant-spider-02.webp": "systems/dnd5e/tokens/beast/GiantSpider.webp",
  "modules/dnd-monster-manual/assets/tokens/gray-ooze.webp": "systems/dnd5e/tokens/ooze/GrayOoze.webp",
  "modules/dnd-monster-manual/assets/tokens/grick.webp": "systems/dnd5e/tokens/monstrosity/Grick.webp",
  "modules/dnd-monster-manual/assets/tokens/guard.webp": "systems/dnd5e/tokens/humanoid/Guard.webp",
  "modules/dnd-monster-manual/assets/tokens/horse-02.webp": "systems/dnd5e/tokens/beast/RidingHorse.webp",
  "modules/dnd-monster-manual/assets/tokens/hyena.webp": "systems/dnd5e/tokens/beast/Hyena.webp",
  "modules/dnd-monster-manual/assets/tokens/iron-golem.webp": "systems/dnd5e/tokens/construct/IronGolem.webp",
  "modules/dnd-monster-manual/assets/tokens/needle-blight.webp": "systems/dnd5e/tokens/plant/TwigBlight.webp",
  "modules/dnd-monster-manual/assets/tokens/ogre-zombie.webp": "systems/dnd5e/tokens/undead/OgreZombie.webp",
  "modules/dnd-monster-manual/assets/tokens/phase-spider.webp": "systems/dnd5e/tokens/monstrosity/PhaseSpider.webp",
  "modules/dnd-monster-manual/assets/tokens/pseudodragon.webp": "systems/dnd5e/tokens/dragon/Pseudodragon.webp",
  "modules/dnd-monster-manual/assets/tokens/quasit.webp": "systems/dnd5e/tokens/fiend/Quasit.webp",
  "modules/dnd-monster-manual/assets/tokens/red-dragon-wyrmling.webp": "systems/dnd5e/tokens/dragon/RedDragonWyrmling.webp",
  "modules/dnd-monster-manual/assets/tokens/roc.webp": "systems/dnd5e/tokens/monstrosity/Roc.webp",
  "modules/dnd-monster-manual/assets/tokens/shadow.webp": "systems/dnd5e/tokens/undead/Shadow.webp",
  "modules/dnd-monster-manual/assets/tokens/shield-guardian.webp": "systems/dnd5e/tokens/construct/ShieldGuardian.webp",
  "modules/dnd-monster-manual/assets/tokens/skeleton-*.webp": "systems/dnd5e/tokens/undead/Skeleton.webp",
  "modules/dnd-monster-manual/assets/tokens/skeleton-01.webp": "systems/dnd5e/tokens/undead/Skeleton.webp",
  "modules/dnd-monster-manual/assets/tokens/skeleton-02.webp": "systems/dnd5e/tokens/undead/Skeleton.webp",
  "modules/dnd-monster-manual/assets/tokens/specter-*.webp": "systems/dnd5e/tokens/undead/Specter.webp",
  "modules/dnd-monster-manual/assets/tokens/specter-01.webp": "systems/dnd5e/tokens/undead/Specter.webp",
  "modules/dnd-monster-manual/assets/tokens/specter-02.webp": "systems/dnd5e/tokens/undead/Specter.webp",
  "modules/dnd-monster-manual/assets/tokens/swarm-of-bats.webp": "systems/dnd5e/tokens/beast/SwarmBats.webp",
  "modules/dnd-monster-manual/assets/tokens/swarm-of-rats.webp": "systems/dnd5e/tokens/beast/SwarmRats.webp",
  "modules/dnd-monster-manual/assets/tokens/swarm-of-ravens.webp": "systems/dnd5e/tokens/beast/SwarmRavens.webp",
  "modules/dnd-monster-manual/assets/tokens/swarm-of-venomous-snakes.webp": "systems/dnd5e/tokens/beast/SwarmPoisonousSnakes.webp",
  "modules/dnd-monster-manual/assets/tokens/twig-blight.webp": "systems/dnd5e/tokens/plant/TwigBlight.webp",
  "modules/dnd-monster-manual/assets/tokens/vampire-spawn.webp": "systems/dnd5e/tokens/undead/VampireSpawn.webp",
  "modules/dnd-monster-manual/assets/tokens/venomous-snake.webp": "systems/dnd5e/tokens/beast/PoisonousSnake.webp",
  "modules/dnd-monster-manual/assets/tokens/vine-blight.webp": "systems/dnd5e/tokens/plant/TwigBlight.webp",
  "modules/dnd-monster-manual/assets/tokens/vrock.webp": "systems/dnd5e/tokens/fiend/Vrock.webp",
  "modules/dnd-monster-manual/assets/tokens/werewolf.webp": "systems/dnd5e/tokens/humanoid/Werewolf.webp",
  "modules/dnd-monster-manual/assets/tokens/wight.webp": "systems/dnd5e/tokens/undead/Wight.webp",
  "modules/dnd-monster-manual/assets/tokens/winter-wolf.webp": "systems/dnd5e/tokens/monstrosity/WinterWolf.webp",
  "modules/dnd-monster-manual/assets/tokens/wolf-*.webp": "systems/dnd5e/tokens/beast/Wolf.webp",
  "modules/dnd-monster-manual/assets/tokens/wolf-01.webp": "systems/dnd5e/tokens/beast/Wolf.webp",
  "modules/dnd-monster-manual/assets/tokens/wolf-02.webp": "systems/dnd5e/tokens/beast/Wolf.webp",
  "modules/dnd-monster-manual/assets/tokens/wraith.webp": "systems/dnd5e/tokens/undead/Wraith.webp",
  "modules/dnd-monster-manual/assets/tokens/zombie-01.webp": "systems/dnd5e/tokens/undead/Zombie.webp",
  "modules/dnd-monster-manual/assets/tokens/zombie-02.webp": "systems/dnd5e/tokens/undead/Zombie.webp",
  "modules/dnd-players-handbook/assets/icons/armor/breastplate.webp": "icons/equipment/chest/breastplate-collared-steel-grey.webp",
  "modules/dnd-players-handbook/assets/icons/armor/leather-armor.webp": "icons/equipment/chest/breastplate-scale-leather.webp",
  "modules/dnd-players-handbook/assets/icons/armor/splint-armor.webp": "icons/equipment/chest/breastplate-layered-steel.webp",
  "modules/dnd-players-handbook/assets/icons/armor/studded-leather-armor.webp": "icons/equipment/chest/breastplate-rivited-red.webp",
  "modules/dnd-players-handbook/assets/icons/backgrounds/noble.webp": "systems/dnd5e/tokens/humanoid/Noble.webp",
  "modules/dnd-players-handbook/assets/icons/classes/fighter.webp": "icons/skills/melee/hand-grip-sword-red.webp",
  "modules/dnd-players-handbook/assets/icons/items/club.webp": "icons/weapons/clubs/club-banded-brown.webp",
  "modules/dnd-players-handbook/assets/icons/items/dagger.webp": "icons/weapons/daggers/dagger-straight-blue.webp",
  "modules/dnd-players-handbook/assets/icons/items/dart.webp": "icons/weapons/thrown/dart-feathered.webp",
  "modules/dnd-players-handbook/assets/icons/items/glaive.webp": "icons/weapons/polearms/glaive-simple.webp",
  "modules/dnd-players-handbook/assets/icons/items/greatsword.webp": "icons/weapons/swords/greatsword-crossguard-steel.webp",
  "modules/dnd-players-handbook/assets/icons/items/hand-crossbow.webp": "icons/weapons/crossbows/crossbow-slotted.webp",
  "modules/dnd-players-handbook/assets/icons/items/light-crossbow.webp": "icons/weapons/crossbows/crossbow-simple-brown.webp",
  "modules/dnd-players-handbook/assets/icons/items/longsword.webp": "icons/weapons/swords/greatsword-guard.webp",
  "modules/dnd-players-handbook/assets/icons/items/musket.webp": "icons/weapons/guns/gun-blunderbuss-gold.webp",
  "modules/dnd-players-handbook/assets/icons/items/rapier.webp": "icons/weapons/swords/sword-guard-bronze.webp",
  "modules/dnd-players-handbook/assets/icons/items/scimitar.webp": "icons/weapons/swords/scimitar-worn-blue.webp",
  "modules/dnd-players-handbook/assets/icons/items/shortsword.webp": "icons/weapons/swords/sword-guard-worn-purple.webp",
  "modules/dnd-players-handbook/assets/icons/items/spear.webp": "icons/weapons/polearms/spear-flared-green.webp",
  "modules/dnd-players-handbook/assets/icons/species/human.webp": "icons/environment/people/commoner.webp",
  "modules/dnd-players-handbook/assets/subjects/animated-object.webp": "icons/weapons/swords/sword-runed-glowing.webp",
  "modules/dnd-players-handbook/assets/tokens/druid-02.webp": "systems/dnd5e/tokens/humanoid/Druid.webp"
};

let art = 0, buttons = 0;
const still = new Set();

/** Every field shape the bad paths were found in, and nothing else. */
const pick = (v, key, out) => { const m = MAP[v]; if (m) { out[key] = m; return 1; } return 0; };

function noteRemaining(v) {
  if (typeof v === "string" && /^modules\/dnd-(monster-manual|dungeon-masters-guide|players-handbook)\//.test(v)) still.add(v);
}

async function fixEffects(doc) {
  const ups = [];
  for (const e of doc.effects ?? []) {
    const u = {};
    if (pick(e.img, "img", u)) ups.push({ _id: e.id, ...u });
    noteRemaining(e.img);
  }
  if (ups.length) { await doc.updateEmbeddedDocuments("ActiveEffect", ups); art += ups.length; }
}

async function fixItems(doc) {
  const ups = [];
  for (const it of doc.items ?? []) {
    const u = {};
    if (pick(it.img, "img", u)) ups.push({ _id: it.id, ...u });
    noteRemaining(it.img);
    await fixEffects(it);
  }
  if (ups.length) { await doc.updateEmbeddedDocuments("Item", ups); art += ups.length; }
}

// ---- 1. artwork -------------------------------------------------------------

for (const a of game.actors) {
  const u = {};
  pick(a.img, "img", u);
  pick(a.prototypeToken?.texture?.src, "prototypeToken.texture.src", u);
  pick(a.prototypeToken?.ring?.subject?.texture, "prototypeToken.ring.subject.texture", u);
  noteRemaining(a.img); noteRemaining(a.prototypeToken?.texture?.src);
  if (Object.keys(u).length) { await a.update(u); art += Object.keys(u).length; }
  await fixItems(a);
  await fixEffects(a);
}

for (const i of game.items) {
  const u = {};
  if (pick(i.img, "img", u)) { await i.update(u); art++; }
  noteRemaining(i.img);
  await fixEffects(i);
}

for (const scene of game.scenes) {
  const ups = [];
  for (const t of scene.tokens) {
    const u = {};
    pick(t.texture?.src, "texture.src", u);
    pick(t.ring?.subject?.texture, "ring.subject.texture", u);
    noteRemaining(t.texture?.src);
    if (Object.keys(u).length) ups.push({ _id: t.id, ...u });
  }
  if (ups.length) { await scene.updateEmbeddedDocuments("Token", ups); art += ups.length; }

  // unlinked tokens carry their own copies of the actor's items
  for (const t of scene.tokens) {
    if (t.isLinked || !t.actor) continue;
    await fixItems(t.actor);
  }
}

// ---- 2. Landing Page buttons ------------------------------------------------

for (const scene of game.scenes) {
  const ups = [];
  for (const tile of scene.tiles) {
    // buttons are tagged lp-<name>-btn; the Reset tile is lp-reset and must stay one-way
    const tags = tile.flags?.tagger?.tags ?? [];
    if (!tags.some(t => /^lp-.*-btn$/.test(t))) continue;
    const actions = foundry.utils.deepClone(tile.flags?.["monks-active-tiles"]?.actions);
    if (!actions) continue;
    let changed = 0;
    for (const a of actions) {
      const d = a.data;
      if (!d) continue;
      if (a.action === "activate" && d.activate === "activate") { d.activate = "toggle"; changed++; }
      else if (a.action === "showhide" && d.hidden === "show") { d.hidden = "toggle"; changed++; }
      else if (a.action === "tileimage" && String(d.select) === "2") { d.select = "next"; d.loop = 1; changed++; }
    }
    if (changed) { ups.push({ _id: tile.id, "flags.monks-active-tiles.actions": actions }); buttons += changed; }
  }
  if (ups.length) await scene.updateEmbeddedDocuments("Tile", ups);
}

// ---- report -----------------------------------------------------------------

const msg = [
  `<p><strong>Curse of Strahd 2.0.3 world update</strong></p>`,
  `<p>${art} artwork path${art === 1 ? "" : "s"} repointed at dnd5e / core Foundry.<br>`,
  `${buttons} Landing Page button action${buttons === 1 ? "" : "s"} made reversible.</p>`,
  still.size ? `<p>${still.size} path${still.size === 1 ? "" : "s"} left alone - dnd5e ships no equivalent:</p><ul>${[...still].sort().map(s => `<li>${s.split("/").pop()}</li>`).join("")}</ul>` : ""
].join("");

ChatMessage.create({ content: msg, whisper: [game.user.id] });
console.log("CoS 2.0.3 world update:", { art, buttons, unresolved: [...still] });
