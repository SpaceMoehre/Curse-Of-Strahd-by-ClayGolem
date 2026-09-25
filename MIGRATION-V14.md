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

## 3. Rebuilding the compendium pack — required

**The LevelDB pack (`packs/Curse-of-Strahd`) is not in this repository**; it ships only inside the release zip. It must be rebuilt under v14 before a `2.0.0` release, because v14 changes document data that this adventure's scenes and actors rely on.

Procedure:

1. Clean-install Foundry **14.368** to a separate directory with its own user data path (v14 cannot be installed over v13, and worlds are one-way).
2. Install dnd5e (6.0.x, or 5.3.x if you are not ready for 6.x) and the five required modules at their v14 versions.
3. Create a world and import the existing V13 adventure. Core and system migrations run on import.
4. Work through §4 below on every scene.
5. Use the Adventure Builder's **Rebuild** button to write the world's state back over the Adventure document, then export the pack into the release zip.

### 4. Content changes v14 forces on this adventure

- **Measured Templates are gone.** V14 deleted the `MeasuredTemplate` document type outright — the first core document type Foundry has ever removed — and absorbed it into Scene Regions, which gained cone, ray/line, ring and emanation shapes. Any template baked into a packed scene must become a Region. `canvas.scene.templates` → `canvas.scene.regions`; shape `t: "ray"` → `type: "line"`; cone direction now reads from `shapes[0].rotation`. Rectangle regions pivot from the **top-left** via `anchorX`/`anchorY`, not the centre. As of 14.360 the default visibility for converted template regions is `ALWAYS`, not `OBSERVER`.
- **Active Effects v2.** `changes` moved from the effect root to `system.changes`; `mode` (numeric) became `type` (string: `"add"`, `"multiply"`, `"subtract"`, `"downgrade"`, `"upgrade"`, `"override"`); `origin` is now a UUID. Effects on packed actors/items get migrated on import — spot-check any hand-authored effects.
- **Scene Levels.** Scenes now support stacked layers at defined elevation ranges via a new `Level` document embedded in Scene; tiles, lights, walls and sounds can be assigned to a level. Optional, but worth using for the multi-storey maps (Death House, Castle Ravenloft).
- **Tokens.** `detectionModes` is now an object keyed by ID rather than an array, and tokens gained required `depth` and `level` fields.
- **TinyMCE is removed** — ProseMirror is the only built-in editor. Journal entries authored in the old editor still render, but check any raw-HTML journal content in the pack.
- **Adventure imports** now record metadata (server time, module version at import) in the `core.adventureImports` setting.

### 5. Dependency status (verified September 2026)

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
