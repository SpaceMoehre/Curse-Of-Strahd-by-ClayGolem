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
