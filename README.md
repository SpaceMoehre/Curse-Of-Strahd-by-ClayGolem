# Curse-Of-Strahd-by-ClayGolem

Final packaged version for running Curse of Strahd, using [DragnaCarta's Curse of Strahd: Reloaded](https://www.strahdreloaded.com/Introduction/A+DM's+Guide+to+Curse+of+Strahd) version.

**This branch (`v14`) targets Foundry VTT v14 and the D&D 5e 2024 rules.**
For Foundry V13 use the `main` branch / the 1.x releases.

Help video link below!

A Foundry VTT Adventure pack for running the "Curse of Strahd" D&D adventure.
Includes all pre-built maps, including walls, light, sounds and numerous triggers.
Includes all Actors and Items in the module.

To run this adventure you will need access to the free DragnaCarta version of Curse of Strahd: Reloaded: https://www.strahdreloaded.com/Introduction/A+DM's+Guide+to+Curse+of+Strahd
You will also need a copy of the original Curse of Strahd module, available from WotC shop or DnDBeyond.

## Requirements

| | Minimum | Verified |
|---|---|---|
| Foundry VTT | 14 | 14.368 |
| D&D 5e system | 5.3.0 | 6.0.5 |

> **Note:** dnd5e 6.0.0 and later *only* run on Foundry v14, and dnd5e 6.0.5 itself requires core build 14.367 or newer. dnd5e 5.3.x is the last line that runs on both v13 and v14.

### Required Modules

All of these are v14-verified:

- Monk's Active Tile Triggers (14.01+)
- Item Piles (3.3.4+)
- libWrapper (1.13.5.1+)
- socketLib (1.1.4+)
- Tagger (1.6.0+)

### Recommended Modules

- D&D Dungeon Masters Guide 2024
- D&D Monster Manual 2024
- D&D Players Handbook 2024
- JB2A Animated Assets (free or Patreon)

## Installation

Once you have installed the modules listed above, copy this Module Manifest link:

https://github.com/ClayGolemDM/Curse-Of-Strahd-by-ClayGolem/releases/latest/download/module.json

Paste it into the Manifest URL box at the bottom of the Add-ons menu in Foundry (where you went to activate the modules above).
Hey presto! This will install for you. Once done, click Update for the Curse of Strahd module to ensure you have the latest version with any needed bug-fixes.

### Quick Start (new in v14)

This module registers a **Quick Start Adventure**. When you create a new World in Foundry v14, Curse of Strahd appears as an option on the World Creation screen and Foundry will populate the new world with the adventure's contents for you — no separate "activate module, then import compendium" step required.

Because the adventure needs GM setup after importing, `postImport` is enabled: players cannot join until you, the GM, have finished the post-import pass.

## Upgrading from the V13 release

Foundry v14 worlds are **one-way** — a world opened in v14 cannot be opened in v13 again, and v14 cannot be installed in place over v13. Back up your user data and use a separate v14 installation before migrating an in-progress campaign.

See [MIGRATION-V14.md](MIGRATION-V14.md) for the full port notes, including an audit of the
release 1.2 compendium pack and what still needs doing in a live v14 instance.

## How to use

[Guide to Running CoS with this Module](https://youtu.be/OfPCsTHIP2o)
