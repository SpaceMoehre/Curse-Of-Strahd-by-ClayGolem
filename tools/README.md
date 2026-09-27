# tools/

## migrate-templates-to-regions.mjs

One-shot data migration for the v13 → v14 port. Foundry v14 deleted the
`MeasuredTemplate` document type, so `Scene#templates` no longer exists and any
template baked into a packed scene is silently discarded on import. This script
rewrites those templates as Scene Regions before that can happen.

Run it against a **copy** of the unzipped LevelDB pack:

```bash
npm install classic-level
cp -r /path/to/module/Packs/Curse-of-Strahd ./db-v14
rm -f db-v14/LOCK
node migrate-templates-to-regions.mjs        # expects ./db-v14
```

It converts circle templates to `ellipse` region shapes using
`radius_px = distance * (grid.size / grid.distance)`, preserves the template's
`_id` and flags, sets `visibility: 0` (LAYER) to match the old `hidden: true`,
and strips the dead `templates` field from every scene. Any non-circle template
is reported and left alone rather than guessed at.

Afterwards, compact the database so the superseded SSTs are dropped from the
release zip:

```js
await db.compactRange('!', '~');
```

Applied to release 1.2 this converted exactly 1 template (see MIGRATION-V14.md §4).

## migrate-dnd5e-6.mjs

Applies the dnd5e 6.0 migrations that nothing else will apply to this pack.

dnd5e ships `dnd5e.migrations.migrateCompendium()`, but it early-returns for any pack
that is not `Actor`, `Item` or `Scene` — and this is an **Adventure** pack, so it is
skipped entirely. The remaining automatic coverage is `DataModel._migrateData`, which
only shims a subset. This script closes the difference.

Run it after `migrate-templates-to-regions.mjs`, against the same working copy:

```bash
node migrate-dnd5e-6.mjs        # expects ./db-final, compacts when done
```

It applies five migrations, each a direct transcription of the corresponding rule in
dnd5e `module/migration.mjs` (release-6.0.5):

| Migration | dnd5e source | Hits on release 1.2 |
|---|---|---|
| effect `origin` → `system.origin.{item,activity}` | `_migrateEffectOrigin` | 496 |
| NPC-owned item gains `"gear"` | `migrateItemData` | 264 |
| `flags.dnd5e.riders.statuses` → `system.rider.statuses` | `ActiveEffect5e.migrateData` | 89 |
| NPC-owned item `equipped: false` → `true` | `migrateActorData` | 45 |
| actor `prototypeToken…lockScale` | `migrateActorData` | 2 |

Two deliberate deviations from dnd5e's own behaviour:

- the legacy `origin` field is **kept** alongside `system.origin.*` rather than nulled,
  so the runtime fallback in `ActiveEffect5e#prepareBaseData` still works;
- `_stats.systemVersion` is **not** bumped, so dnd5e still treats the content as pre-6.0
  and its own migration will still fire after import.

Everything the script does is idempotent. Migrations that depend on the Foundry v14 core
globals `_del`, `_replace` or `isSpellOrScroll` are deliberately **not** attempted — see
MIGRATION-V14.md §5.

## count-premium-refs.mjs

Read-only. Counts references from the pack into the premium WotC modules
(`dnd-players-handbook`, `dnd-monster-manual`, `dnd-dungeon-masters-guide`) and
`JB2A_DnD5e`, grouped by the field they live in.

```bash
node count-premium-refs.mjs path/to/Packs/Curse-of-Strahd
```

Written to decide whether `relationships.recommends` was load-bearing before removing it
in 2.0.1. Answer: mostly not — 76% of the 1,782 references are `_stats.compendiumSource`
provenance or effect-origin bookkeeping, which cost nothing when the module is absent.
The remainder (cast-spell activities, summon profiles, advancement grants) do degrade.
Full breakdown in MIGRATION-V14.md §9.

Note that `classic-level` resolves relative to the script's own location, so run it from
a directory where that package is installed rather than from the repo.

## remap-premium-assets.mjs

Repoints asset paths that live in the premium WotC modules at art that ships with
dnd5e or with Foundry core, so scenes render without those modules installed.

```bash
node remap-premium-assets.mjs path/to/Packs/Curse-of-Strahd path/to/dnd5e-checkout [--apply]
```

The dnd5e checkout needs `tokens/` and `packs/_source/` (a sparse checkout of
release-6.0.5 is enough). Without `--apply` it only reports and writes
`remap-plan.tsv`.

Creature art is matched against dnd5e's 479 bundled tokens on the normalised
filename — extension dropped, a trailing `-NN` or `-*` dropped, folded to
`[a-z0-9]`, so `wolf-01.webp` finds `tokens/beast/Wolf.webp`. An `ALIAS` table
covers names dnd5e spells differently (`adult-black-dragon` → `BlackDragonAdult`,
`swarm-of-venomous-snakes` → `SwarmPoisonousSnakes`).

Item, armor, class and species art has no dnd5e equivalent — dnd5e's own `icons/`
tree is 187 SVGs, not item art. Instead the script reads `name:`/`img:` out of
dnd5e's `packs/_source` YAML and reuses the **core Foundry** icon each item
already points at, so every target is a path dnd5e itself ships content against
rather than one invented here.

Applied to 2.0.2: **150 of 161** distinct premium paths remapped, rewriting 756
references across 20 documents. Broken scene tokens went from 541 to 36. The 11
left alone are six creatures dnd5e does not ship at all (barlgura, blue slaad,
death slaad, nothic, scarecrow, crawling claw); substituting a different monster
would be worse than a missing one, so they are reported and skipped.

Same `classic-level` working-directory caveat as above.

## toggle-landing-page-buttons.mjs

Makes the **Landing Page** handout buttons toggle instead of latching.

```bash
node toggle-landing-page-buttons.mjs path/to/Packs/Curse-of-Strahd [--apply]
```

The Landing Page scene (in `Core Resources & Intro`) is a GM-facing board: ten
handout tiles, all `hidden`, and a row of Monk's Active Tiles buttons that reveal
them to players. Each button ran three one-way actions —
`activate: "activate"`, `showhide: "show"` and `tileimage: select "2"` — so a
second click re-ran the same three and nothing ever turned back off. The only way
back was the separate Reset button.

The script rewrites those to `"toggle"`, `"toggle"` and `"next"` (with `loop: 1`).
All three values already appear elsewhere in this pack, written by the original
author, so no new MATT vocabulary is introduced.

Applied to 2.0.3: **33 actions across 10 buttons**. Buttons are found by their
`lp-…-btn` Tagger tag, which excludes the Reset tile (`lp-reset`) — that one has
to stay one-way.

`permissions` actions are left alone on purpose. MATT has no toggle for
permission, and revoking a handout the party has already read is worse than
leaving it readable; Reset still revokes all of them.
