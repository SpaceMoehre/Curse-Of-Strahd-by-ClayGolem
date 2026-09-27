# Installing the v14 build

The v14 build is a complete module: the migrated compendium pack plus all 650 art and
audio files from release 1.2. It is **not** in this repository — the repo only tracks
the manifest, docs and migration scripts. The build lives outside the working tree:

```
/mnt/hdd/.cos-v14-work/build/curse-of-strahd-by-claygolem/   435 MB   drop-in folder
/mnt/hdd/.cos-v14-work/curse-of-strahd-by-claygolem-v2.0.0.zip   433 MB   archive
```

Contents:

```
curse-of-strahd-by-claygolem/
├── module.json                  v14 manifest (v2.0.0)
└── Packs/
    ├── Curse-of-Strahd/         migrated compendium  (3.5 MB LevelDB)
    ├── Scenes/   184 MB         ├── Actors/  110 MB
    ├── Tiles/     93 MB         ├── Items/    36 MB
    └── Sounds/    11 MB
```

## 1. Put the module where Foundry can see it

The folder **must** keep the name `curse-of-strahd-by-claygolem` — it has to match the
manifest `id`, or Foundry will refuse to load it.

### Self-hosted Foundry

Copy the folder into your user data directory:

| OS | Path |
|---|---|
| Linux | `~/.local/share/FoundryVTT/Data/modules/` |
| Windows | `%localappdata%\FoundryVTT\Data\modules\` |
| macOS | `~/Library/Application Support/FoundryVTT/Data/modules/` |
| Docker (`felddy/foundryvtt`) | `/data/Data/modules/` |

```bash
cp -r /mnt/hdd/.cos-v14-work/build/curse-of-strahd-by-claygolem \
      ~/.local/share/FoundryVTT/Data/modules/
```

Then restart Foundry. Foundry only scans `modules/` at startup — a reload is not enough.

### Hosted Foundry (The Forge, Molten, etc.)

Upload `curse-of-strahd-by-claygolem-v2.0.0.zip` through your host's module-upload or
"install from archive" flow. Foundry's own **Install Module** dialog only accepts a
manifest URL, so a local zip cannot be installed through it — you either upload it to
your host, or publish the zip as a GitHub release and point the dialog at
`module.json`'s `manifest` URL.

## 2. Verify it loaded

Launch Foundry 14.368 with dnd5e 6.0.x, then check **Setup → Add-on Modules**. The
module should appear with no compatibility warning. If it is missing, the folder name
is wrong or the parent directory is not the one Foundry is using — check
**Configuration → User Data Path** on the setup screen.

## 3. Get the adventure into a world

Two routes:

**Quick Start** (new in v14) — the manifest sets `"quickstart": {"postImport": true}`,
so the adventure is offered directly on the **World Creation** screen. Pick it there and
Foundry creates the world and imports in one step.

**Manual** — create a dnd5e world, enable the module in **Manage Modules**, then open
the **Curse of Strahd** compendium and import the Adventure document.

Either way, importing is **one-way**. Import into a fresh world first and look at it
before you commit a campaign to it.

## 4. Finish the dnd5e migration

Most of the dnd5e 6.0 changes were applied to the pack offline, and the rest are shimmed
automatically as documents load. Three items are neither — they need dnd5e's own code to
run (see `MIGRATION-V14.md` §5 for exactly which, and why they were left):

- effect `system.magical` (≈365 effects)
- spell `system.sourceItem` backfill (≈141 spells)
- persisted `_id`s on effect changes (≈795)

After importing, run this once as a GM, via a **Script** macro:

```js
await dnd5e.migrations.migrateWorld({ bypassVersionCheck: true });
```

`bypassVersionCheck` is required: a fresh v14 world already records dnd5e 6.0.x as its
migration version, so the migration will not fire on its own for content imported
afterwards. The pack's `_stats.systemVersion` was deliberately left at its original
value so dnd5e still recognises this content as pre-6.0.

This is safe to run more than once — every migration applied offline is idempotent.

> Note: `dnd5e.migrations.migrateCompendium()` does **not** work on this pack. It
> early-returns for anything that is not an Actor, Item or Scene pack, and this is an
> Adventure pack. Migrating the world after import is the supported path.

## 5. Re-exporting a fully migrated pack (optional)

To bake everything in permanently rather than relying on load-time shims: after step 4,
open the imported Adventure in the **Adventure Builder** and use **Rebuild**. That writes
the migrated world state back over the Adventure document. Export the pack afterwards if
you want to redistribute it.

## Known gaps

- **206 scenes have not been opened in a real v14 client.** Walls, lighting, Monk's Active
  Tile triggers and Item Piles are unverified.
- **Effect origins pointing at absent compendiums.** Some effects reference
  `Compendium.world.cpr-spells.*`, `Compendium.dnd-players-handbook.*` and
  `Compendium.dnd-monster-manual.*`. These are pre-existing in release 1.2 and unrelated
  to v14; they resolve only if you own those modules.
- **Foundry v14 requires Node.js 24.** The build machine has 22.14.0 — enough for the
  LevelDB work, not enough to run a v14 server.
