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

Fields checked and left as-is: `id`, `title`, `authors`, `flags`, `packs` (including `ownership` — still a valid pack field in v14), `relationships.recommends`.

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

1. **The dnd5e system migration.** Pack content is stamped dnd5e 4.3.6–5.1.10. Reaching
   6.0.x is a two-major-version jump (4.x → 5.x → 6.x) covering the 2024 rules
   restructure. This is the largest remaining risk and needs a real import to validate.
2. **Visual verification** of 206 scenes — walls, lighting, Monk's Active Tile triggers,
   Item Piles.
3. **Adventure Builder → Rebuild**, to write the migrated world state back over the
   21 Adventure documents and re-export the pack.

Procedure: clean-install Foundry 14.368 to its own directory and user data path
(v14 cannot install over v13, and worlds are one-way); install dnd5e plus the five
required modules at their v14 versions; import the adventure; verify; rebuild; export.

> **Note:** Foundry v14 requires **Node.js 24**. This machine has Node 22.14.0 — fine for
> the LevelDB work above, not enough to run a v14 server.

## 5. Dependency status (verified September 2026)

| Module | Latest | Foundry compatibility |
|---|---|---|
| Monk's Active Tile Triggers | 14.01 | 14+ (Verified 14) |
| Item Piles | 3.3.4 | 13–14 (Verified 14) |
| libWrapper | 1.13.5.1 | 0.6.5+ (Verified 14) |
| socketlib | 1.1.4 | 11+ (Verified 14) |
| Tagger | 1.6.0 | 13–14 (Verified 14) |
| dnd5e (system) | 6.0.5 | v14 only; needs core 14.367+ |

All five required modules have v14-verified releases, so nothing in `relationships.requires` blocks the port.

## 6. Not applicable to this module

This module ships no JavaScript — no `esmodules`, `scripts` or `styles`. The v14 API breaks that hit most modules therefore do not apply here:
ApplicationV2 `_insertElement` signature changes, detached/pop-out windows, `foundry.prosemirror.defaultPlugins` → `ProseMirrorEditor.buildDefaultPlugins()`, `CONST.CHAT_MESSAGE_TYPES` → `CHAT_MESSAGE_STYLES`, the `getPlaceableContextOptions` hook, and the AppV1 (`Application`/`Dialog`/`FormApplication`) deprecations scheduled for removal in v16.

## 7. Open decision

The `url`, `readme`, `bugs`, `changelog`, `manifest` and `download` fields point at **`ClayGolemDM/Curse-Of-Strahd-by-ClayGolem`** (upstream), matching the V13 manifest. This checkout's git remote is `SpaceMoehre/Curse-Of-Strahd-by-ClayGolem`. If the v14 release is published from the fork, repoint those six URLs before tagging `2.0.0`.

---

### Sources

- [Release 14.359](https://foundryvtt.com/releases/14.359) · [Release 14.360](https://foundryvtt.com/releases/14.360) · [Release 14.353](https://foundryvtt.com/releases/14.353) · [All releases](https://foundryvtt.com/releases/)
- [Adventure Documents](https://foundryvtt.com/article/adventure/) · [Introduction to Module Development](https://foundryvtt.com/article/module-development/) · [Content Packaging Guide](https://foundryvtt.com/article/packaging-guide/)
- [Module package API (v14)](https://foundryvtt.com/api/classes/foundry.packages.Module.html) · [PackageCompendiumData (v14)](https://foundryvtt.com/api/v14/interfaces/foundry.packages.types.PackageCompendiumData.html)
- [foundryvtt#13089 — Measured Templates absorbed into Scene Regions](https://github.com/foundryvtt/foundryvtt/issues/13089) · [foundryvtt#10187 — Quick Start Adventures](https://github.com/foundryvtt/foundryvtt/issues/10187)
- [Community v13→v14 migration reference](https://github.com/mordachai/vagabond/blob/main/FOUNDRY_V14_MIGRATION.md)
- Package pages: [dnd5e](https://foundryvtt.com/packages/dnd5e) · [monks-active-tiles](https://foundryvtt.com/packages/monks-active-tiles) · [item-piles](https://foundryvtt.com/packages/item-piles) · [lib-wrapper](https://foundryvtt.com/packages/lib-wrapper) · [socketlib](https://foundryvtt.com/packages/socketlib) · [tagger](https://foundryvtt.com/packages/tagger)
