# Foundry VTT v14 Migration Notes

Reference for porting this adventure module from Foundry V13 to V14.
Target core build: **14.368** (Update Stable, 16 September 2026). V14 went stable as **14.359** on 1 April 2026.

---

## 1. What changed in the manifest

`module.json` on this branch differs from the `main` (V13) branch as follows:

| Change | Why |
|---|---|
| **Fixed invalid JSON** — the V13 manifest had a trailing comma after `relationships.recommends`, so `module.json` did not parse at all | Foundry rejects an unparseable manifest outright |
| `compatibility.minimum` `12` → `14`, `verified` `13` → `14.368` | v14 is a hard cutover; there is no in-place upgrade from v13 |
| `version` `0.1` → `2.0.0` | The v14 port is a breaking release; `0.1` also disagreed with the 1.x tags referenced in the README |
| Added `quickstart` | New v14 manifest field — see §2 |
| `relationships.*.compatibility` filled in (were empty `{}`) | Lets Foundry warn about out-of-date dependencies instead of silently loading a v13-era module |
| Added `description`, `readme`, `bugs`, `changelog` | `description` was empty; the rest populate the package sidebar and Setup UI |
| `download` URL pinned to the `2.0.0` tag, `manifest` pinned to `releases/latest` | Standard Foundry release pattern; the old `download` still pointed at the `0.1` zip |
| Repo URL casing normalised to `Curse-Of-Strahd-by-ClayGolem` | The manifest mixed `Curse-Of-Strahd` and `Curse-of-Strahd` |
| **`packs[0].path` `packs/...` → `Packs/...`** | The release zip ships the pack at `Packs/Curse-of-Strahd` (capital P). The repo manifest said lowercase, which fails to resolve on case-sensitive Linux hosts |

`relationships.recommends` was **removed** in 2.0.1. It listed the three premium WotC modules and JB2A; Foundry shows recommendations in the same install dialog as hard dependencies, which reads as though they are required. They are not — see §9.

Fields checked and left as-is: `id`, `title`, `authors`, `flags`, `packs` (including `ownership` — still a valid pack field in v14).

## 2. Quick Start Adventures (new in v14)

V14 added quick-start adventure registration. A module that ships an `Adventure` pack can declare:

```json
"quickstart": {
  "adventures": { "dnd5e": "<adventure uuid>" },
  "postImport": true,
  "world": {
    "background": "modules/curse-of-strahd-by-claygolem/assets/background.webp",
    "cover": "modules/curse-of-strahd-by-claygolem/assets/thumb.webp"
  }
}
```

Every field is optional. With `"quickstart": {}` Foundry lists **all** adventures in the module, filtered by the system the user picked, and takes the world background/cover from the chosen Adventure's own image.

This branch ships `{ "postImport": true }` — Foundry auto-discovers the adventure, and `postImport` blocks non-GM users from joining until the GM has completed post-import setup (correct for this adventure, which needs tile/trigger and Item Piles setup after import).

If you add branded `assets/background.webp` and `assets/thumb.webp` to the module, fill in the `world` block. If the pack ever contains more than one Adventure, pin the right one with `adventures`.

## 3. The compendium pack — audited against release 1.2

The LevelDB pack is not in this repository; it ships only inside the release zip.
Release **1.2** (`curse-of-strahd-by-claygolem.zip`, 427.5 MB) was downloaded and its
pack (`Packs/Curse-of-Strahd`, 26 keys) audited directly. Contents:

| | Count |
|---|---|
| Adventure documents | 21 |
| Scenes | 206 |
| Tokens | 1258 |
| Tiles | 767 |
| Actors | 262 |
| Items | 109 |
| Regions (already present) | 573 |
| **MeasuredTemplates** | **1** |
| ActiveEffects (legacy v1 shape) | 585 of 586 |
| Tokens with array `detectionModes` | 76 |

Authoring stamps: core `13.348`/`13.350`; dnd5e `4.3.6`–`5.1.10` (mixed, mostly
`5.1.9` and `4.3.6`).

**The MeasuredTemplate removal is a non-issue for this module.** The author had
already built the adventure on Scene Regions — 573 of them — and the entire pack
contains exactly one leftover template: a hidden, decorative 60 ft circle with a
Token Magic FX "Smoky Area" filter on *J5b - Yester Hill - Druid Circle*.

## 4. What was actually migrated

`tools/migrate-templates-to-regions.mjs` converted that single template to a Region:

```
type: ellipse   x: 8600  y: 8200   radiusX/radiusY: 2400px   (60ft x 200px/5ft)
_id preserved   visibility: 0 (LAYER, matching the old hidden: true)
```

The dead `templates` field was stripped from all 206 scenes. Verified after the
rewrite: 21 adventures, 206 scenes, 1258 tokens, 262 actors all intact; regions
573 → 574; zero scenes still carrying a `templates` field. The database was then
compacted back to 3.5 MB.

Two caveats on that one region:

- The `tokenmagic` flag is preserved but **inert** — it targets
  `placeableType: "MeasuredTemplate"`, and Token Magic FX is not a dependency of
  this module anyway. The smoke effect is lost either way; re-do it as a Region
  behaviour if you want it back.
- Region shapes in this pack use `ellipse`, not `circle`, so the conversion matches
  the surrounding data rather than introducing a new shape type.

### Left to Foundry's own migration — deliberately

The 585 legacy ActiveEffects (root-level `changes`, numeric `mode`) and the 76
array-form `detectionModes` were **not** hand-migrated. Core v14 has migration
shims for both, and dnd5e transforms effects again on top of that; hand-rolling
585 effect conversions would be more likely to introduce drift than to avoid it.
They migrate correctly on import.

The one thing core cannot migrate is the template, because the field it lives in
no longer exists — which is exactly the gap the script closes.

### Still requires a real Foundry instance

What could not be done offline, and needs Foundry v14 running with your licence:

1. **The remainder of the dnd5e 6.0 migration** — the rows marked "left" in §5. These
   run automatically on import (shims) or via `dnd5e.migrations.migrateWorld()`; see
   `INSTALL.md`.
2. **Visual verification** of 206 scenes — walls, lighting, Monk's Active Tile triggers,
   Item Piles.
3. **Adventure Builder → Rebuild**, to write the migrated world state back over the
   21 Adventure documents and re-export the pack.

Procedure: clean-install Foundry 14.368 to its own directory and user data path
(v14 cannot install over v13, and worlds are one-way); install dnd5e plus the five
required modules at their v14 versions; import the adventure; verify; rebuild; export.

> **Note:** Foundry v14 requires **Node.js 24**. This machine has Node 22.14.0 — fine for
> the LevelDB work above, not enough to run a v14 server.

## 5. dnd5e 6.0 content migration

Pack content is stamped dnd5e 4.3.6–5.1.10, but the version spread overstates the gap.
An audit of all 1,900 items found **1,821 already carrying `system.activities` and zero
legacy `system.damage.parts`** — the content already sits on the post-4.0 Activities
schema. `character.bastion` (dnd5e 4.1+) is present too.

### Where dnd5e 6.0's migrations actually live

| Mechanism | Runs when | Covers |
|---|---|---|
| `DataModel._migrateData` shims | Every document instantiation, including adventure import | AC `calc`/`formula` → `calcs`/`formulas`; `flags.dnd5e.riders.statuses` → `system.rider.statuses`; change `_id` defaults |
| `dnd5e.migrations.migrateWorld()` | System version bump, or called manually | Everything below, on world documents |
| `dnd5e.migrations.migrateCompendium()` | Manually, per pack | **Nothing here** — see below |

That last row is the gap. `module/migration.mjs` line 256 (release-6.0.5):

```js
if ( !["Actor", "Item", "Scene"].includes(documentName) ) return;
```

This is an **Adventure** pack, so dnd5e's own compendium migration tool skips it
entirely. That is why the offline pass below exists.

### The complete set of 6.0-era migrations

Every version gate in `migration.mjs` was enumerated — exactly three `6.0.0` gates and
two `5.3.0` gates exist. Measured against this pack:

| Migration | Hits | Status |
|---|---|---|
| Effect `origin` → `system.origin.{item,activity}` | 496 | **applied offline** |
| NPC-owned item gains `"gear"` property | 264 | **applied offline** |
| `flags.dnd5e.riders.statuses` → `system.rider.statuses` | 89 | **applied offline** (bakes in the shim) |
| NPC-owned item `equipped: false` → `true` | 45 | **applied offline** |
| Actor `prototypeToken.flags.dnd5e.lockScale` | 2 | **applied offline** |
| Effect change `_id` assignment | 795 | left — field has `initial: () => randomID()` |
| `changes` → `system.changes`, numeric `mode` → string `type` | 585 / 814 | left — **core v14** owns this shape, not dnd5e |
| Effect `system.magical` | 365 | left — needs core global `isSpellOrScroll()` |
| Spell `system.sourceItem` backfill | 141 | left — needs `formatIdentifier()` slug semantics |
| Enchantment `transfer` recalculation | 151 | left — already correct in this data |
| `system.advancement` `_replace()` | 921 | no-op — changes merge semantics, not content |
| `system.source.rules = "2014"` | 0 | gated `< 4.0.0`; content is 4.3.6+ |
| Movement/senses `0` → `null` | 0 | gated `< 2.4.0` |
| Token PNG → WEBP; `initiativeAdv`; `migratedProperties`; `migratedUses` | 0 | absent from this pack |

Applied by `tools/migrate-dnd5e-6.mjs`; counts verified against the rebuilt pack.

### Why the "left" rows were left

dnd5e 6.0.5's migration code calls three **Foundry v14 core globals** that are neither
importable nor documented: `_del`, `_replace` and `isSpellOrScroll`. Reproducing them
offline means guessing at core internals, and a wrong guess is *sticky* — `system.sourceItem`,
for instance, is guarded by `!itemData.system?.sourceItem`, so a bad value would
permanently block dnd5e from ever correcting it. Everything left alone is either
auto-shimmed on load or safely re-runnable inside Foundry.

`_stats.systemVersion` was **deliberately not bumped**, so dnd5e still sees the content
as pre-6.0 and its own migration will still fire. All five applied migrations are
idempotent, so running dnd5e's migration afterwards is safe.

## 6. Dependency status (verified September 2026)

| Module | Latest | Foundry compatibility |
|---|---|---|
| Monk's Active Tile Triggers | 14.01 | 14+ (Verified 14) |
| Item Piles | 3.3.4 | 13–14 (Verified 14) |
| libWrapper | 1.13.5.1 | 0.6.5+ (Verified 14) |
| socketlib | 1.1.4 | 11+ (Verified 14) |
| Tagger | 1.6.0 | 13–14 (Verified 14) |
| dnd5e (system) | 6.0.5 | v14 only; needs core 14.367+ |

All five required modules have v14-verified releases, so nothing in `relationships.requires` blocks the port.

## 7. Not applicable to this module

This module ships no JavaScript — no `esmodules`, `scripts` or `styles`. The v14 API breaks that hit most modules therefore do not apply here:
ApplicationV2 `_insertElement` signature changes, detached/pop-out windows, `foundry.prosemirror.defaultPlugins` → `ProseMirrorEditor.buildDefaultPlugins()`, `CONST.CHAT_MESSAGE_TYPES` → `CHAT_MESSAGE_STYLES`, the `getPlaceableContextOptions` hook, and the AppV1 (`Application`/`Dialog`/`FormApplication`) deprecations scheduled for removal in v16.

## 8. Release URLs (resolved)

The `url`, `readme`, `bugs`, `changelog`, `manifest` and `download` fields originally pointed at **`ClayGolemDM/Curse-Of-Strahd-by-ClayGolem`** (upstream), matching the V13 manifest. The v14 port is released from the **`SpaceMoehre`** fork, so all six were repointed there — Foundry reads `manifest` and `download` at install and update time, and upstream will never publish a v14 build.

The `authors` entry is deliberately unchanged: the module remains ClayGolem's work.

## 9. Premium module references

`relationships.recommends` listed `dnd-players-handbook`, `dnd-monster-manual`, `dnd-dungeon-masters-guide` and `JB2A_DnD5e`. Removed in 2.0.1 — Foundry renders recommendations alongside hard dependencies in the install dialog, so they look mandatory.

They are not *required* — every actor, item and scene is fully embedded in the Adventure pack, and nothing is fetched from those modules to render the adventure. But the pack does reference them 1,782 times (`dnd-players-handbook` 957, `dnd-monster-manual` 758, `dnd-dungeon-masters-guide` 67), and not all of it is inert:

| References | Field | Effect if the module is absent |
|---|---|---|
| 887 | `_stats.compendiumSource`, `flags.dnd5e.sourceId` | **None** — provenance only |
| 466 | effect `origin` / `system.origin.*` | Console warnings; effects still apply their changes |
| 177 | `activities.*.spell.uuid` | **Cast-spell activities cannot resolve the spell** |
| 139 | `@UUID[…]` in descriptions and biographies | Broken links in statblock and journal prose |
| 54 | `activities.*.profiles[].uuid` | Summon activities cannot resolve their creature |
| 46 | `system.advancement[]` pools, grants and `value.added` | Class/subclass level-up grants fail |
| 13 | `system.startingEquipment[].key` | Character creation only |

So 1,353 of the 1,782 (76%) are provenance or effect bookkeeping and cost nothing. The ~277 that are load-bearing are cast-spell activities, summons and level-up grants — these degrade for NPCs whose statblocks link out to PHB spell entries rather than embedding them.

`JB2A_DnD5e` had **zero** references and was pure noise.

Counts produced by `tools/count-premium-refs.mjs`.

## 10. Premium asset paths repointed at dnd5e (2.0.2)

§9 counted `Compendium.*` **document** references. It did not count asset **file
paths**, and those were the visible breakage: scenes referenced
`modules/dnd-monster-manual/assets/tokens/*.webp` directly, so without that module
installed every such token rendered as the default white square. On release 2.0.1,
**541 of the 1,258 scene tokens (43%) across 61 scenes** were blank.

dnd5e 6.0 ships 479 creature tokens under `tokens/`, which covers most of them.
Item and armor art has no dnd5e equivalent — dnd5e's `icons/` tree is 187 SVGs —
but dnd5e's own compendium items point at **core Foundry** icons, so that mapping
was read out of `packs/_source` rather than invented.

| | 2.0.1 | 2.0.2 |
|---|---|---|
| distinct premium asset paths | 161 | 11 |
| scene tokens on premium art | 541 | 36 |
| scenes with blank tokens | 61 | 8 |

150 paths remapped, rewriting 756 references across 20 documents — 102 to
`systems/dnd5e/tokens/…`, 48 to core `icons/…`.

The 11 remaining are six creatures dnd5e does not ship: barlgura, blue slaad,
death slaad, nothic, scarecrow, crawling claw. These were left pointing at the
premium module deliberately. Substituting a different monster's token would be a
silent lie about what is on the map, which is worse than a missing image the GM
can see and replace.

Still outstanding, and unrelated to the premium modules: **566 references to
`cg-curse-of-strahd`**, the module's own former ID. That art is in the package
already, rehomed under `Packs/Tiles/` with different names
(`attic-carpet-(4x4).webp` → `AtticRug.webp`), so it needs a hand-checked name
map rather than a normalised match.

Applied by `tools/remap-premium-assets.mjs`.

---

### Sources

- [Release 14.359](https://foundryvtt.com/releases/14.359) · [Release 14.360](https://foundryvtt.com/releases/14.360) · [Release 14.353](https://foundryvtt.com/releases/14.353) · [All releases](https://foundryvtt.com/releases/)
- [Adventure Documents](https://foundryvtt.com/article/adventure/) · [Introduction to Module Development](https://foundryvtt.com/article/module-development/) · [Content Packaging Guide](https://foundryvtt.com/article/packaging-guide/)
- [Module package API (v14)](https://foundryvtt.com/api/classes/foundry.packages.Module.html) · [PackageCompendiumData (v14)](https://foundryvtt.com/api/v14/interfaces/foundry.packages.types.PackageCompendiumData.html)
- [foundryvtt#13089 — Measured Templates absorbed into Scene Regions](https://github.com/foundryvtt/foundryvtt/issues/13089) · [foundryvtt#10187 — Quick Start Adventures](https://github.com/foundryvtt/foundryvtt/issues/10187)
- [Community v13→v14 migration reference](https://github.com/mordachai/vagabond/blob/main/FOUNDRY_V14_MIGRATION.md)
- Package pages: [dnd5e](https://foundryvtt.com/packages/dnd5e) · [monks-active-tiles](https://foundryvtt.com/packages/monks-active-tiles) · [item-piles](https://foundryvtt.com/packages/item-piles) · [lib-wrapper](https://foundryvtt.com/packages/lib-wrapper) · [socketlib](https://foundryvtt.com/packages/socketlib) · [tagger](https://foundryvtt.com/packages/tagger)
