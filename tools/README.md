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
