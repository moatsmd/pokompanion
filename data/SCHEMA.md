# Pokompanion data schema (v1)

Canonical game data for the Pokémon Pokopia compendium. Research agents write
JSON files here. The Astro site consumes them at build time.

## Ground rules

- **Facts only.** Item names, categories, sourcing methods, recipe inputs,
  region resources are facts and are fine to aggregate. Do **not** copy prose,
  descriptions, or images verbatim from any wiki — write original one/two-line
  descriptions in your own words.
- **Cite.** Every file has a top-level `_sources` array of the URLs you drew
  from. If a specific field is uncertain or you inferred it, set the field's
  companion `*_uncertain: true` or add a `notes` string saying so. Never invent
  a value to fill a slot — omit it or mark it uncertain.
- **Correctness over completeness.** A smaller set of well-sourced, accurate
  entries beats a large half-guessed one. Hit the target ranges if the data
  supports it; stop short and note the gap if it doesn't.
- **IDs are kebab-case of the name**, globally stable, so files cross-link
  without coordination. Examples: `lumber`, `soft-clay`, `iron-ore`,
  `palette-town`, `water-gun`, `wooden-chair`. Strip punctuation, spaces → `-`.

## File: materials.json

Core crafting materials (raw + refined): lumber, limestone, soft clay, paint,
iron ore, paper, brick, twine, concrete, etc. Target ~20–40.

```json
{
  "_sources": ["https://...", "https://..."],
  "materials": [
    {
      "id": "lumber",
      "name": "Lumber",
      "category": "wood",              // wood | stone | metal | clay | fiber | liquid | refined | other
      "tier": "raw",                   // raw | refined
      "description": "One original sentence on what it is / its role.",
      "sources": [                      // how to obtain it — the core of the app
        {
          "method": "Cut trees",        // gather | mine | craft | buy | dig | fish | drop | forage
          "region": "palette-town",     // region id, or "any"
          "tool": "cut",                // move/tool id used, or null
          "detail": "Clear trees and logs in forested areas.",
          "notes": null
        }
      ],
      "refinedInto": ["plank"],         // material ids this becomes, or []
      "usedInSummary": "Early furniture and building blocks."
    }
  ]
}
```

## File: items.json

Craftable/findable non-material items: furniture, decor, building kits, food,
tools, collectibles. Target ~60–120.

```json
{
  "_sources": ["https://..."],
  "items": [
    {
      "id": "wooden-chair",
      "name": "Wooden Chair",
      "category": "furniture",         // furniture | decor | kit | food | tool | collectible | other
      "description": "One original sentence.",
      "obtain": "craft",               // craft | find | buy | reward | grow
      "obtainDetail": "Crafted at the workbench.",
      "recipeId": "wooden-chair",      // recipe id if craftable, else null
      "region": null,                  // region id if found/location-specific, else null
      "notes": null
    }
  ]
}
```

## File: recipes.json

Crafting recipes. Target ~40–80.

```json
{
  "_sources": ["https://..."],
  "recipes": [
    {
      "id": "wooden-chair",            // matches the output item id where possible
      "name": "Wooden Chair",
      "output": "wooden-chair",        // item id produced
      "outputQty": 1,
      "station": "workbench",          // workbench | kitchen | crafting-table | none
      "unlock": "Available from start",// how the recipe is unlocked, or "" 
      "ingredients": [
        { "material": "lumber", "qty": 3 }   // material OR item id + quantity
      ],
      "effect": null,                  // for food/consumables: flavor/effect, else null
      "notes": null
    }
  ]
}
```

## File: regions.json

All map regions (Palette Town, Withered Wasteland, Bleak Beach, Rocky Ridges
[surface + underground], Sparkling Skylands, + any others). Text guides, not
interactive pins. Target: all known regions.

```json
{
  "_sources": ["https://..."],
  "regions": [
    {
      "id": "palette-town",
      "name": "Palette Town",
      "order": 1,                      // rough progression order
      "summary": "Two original sentences on the region's vibe and role.",
      "keyResources": ["lumber", "soft-clay"],   // material/item ids found here
      "notableLocations": [            // named spots, facilities
        { "name": "Pokémon Center", "what": "Heals / hub facility." }
      ],
      "toolsUsedHere": ["cut", "water-gun"],     // move/tool ids relevant here
      "connectsTo": ["withered-wasteland"],      // region ids
      "notes": null
    }
  ]
}
```

## File: tips.json

Efficiency / strategy tips — short how-to guides like "best way to farm Pokemetal"
or "what to do with Mysterious Slates". Each is an article-style entry.

```json
{
  "_sources": ["https://..."],
  "tips": [
    {
      "id": "best-way-to-get-pokemetal",
      "title": "The fastest way to farm Pokemetal",
      "category": "farming",         // farming | currency | mystery-items | crafting | pokemon | progression | general
      "summary": "One-sentence takeaway shown on the list page.",
      "body": [                        // array of original paragraphs (no markdown, plain text)
        "First paragraph explaining the method...",
        "Second paragraph with the concrete steps or numbers..."
      ],
      "relatedItems": ["pokemetal"],   // material/item ids to cross-link (kebab-case)
      "relatedRegions": ["rocky-ridges"],
      "tags": ["pokemetal", "smelting"],
      "notes": null
    }
  ]
}
```

## File: habitats.json

Habitats are arrangements of plants/furniture/items placed together (roughly a
4×4 grid, close but not touching) that attract specific Pokémon. Target a solid,
well-documented subset (~30–60), not all 200+. `requirements[].item` references
an item/material id where one exists (kebab-case); otherwise use a kebab-case id
for the plant/decor and it renders as plain text.

```json
{
  "_sources": ["https://..."],
  "habitats": [
    {
      "id": "tall-grass",
      "name": "Tall Grass",
      "biome": "grassland",          // grassland | forest | water | beach | cave | desert | flower | fire | urban | other
      "description": "One or two original sentences.",
      "requirements": [               // what to place down to form the habitat
        { "item": "tall-grass", "qty": 4, "note": null }
      ],
      "conditions": "",              // extra conditions: "Rain", "Night", "Daytime", or "" if none
      "attracts": [                   // Pokémon this habitat attracts (names, we have no Pokémon pages yet)
        { "pokemon": "Bulbasaur", "note": "common" },
        { "pokemon": "Oddish", "note": null }
      ],
      "region": null,                 // region id if location-specific, else null
      "notes": null
    }
  ]
}
```

## File: tools.json

Pokémon-taught environment moves used as tools (Cut, Water Gun, Leafage,
Rock Smash, etc.). Small reference table so sourcing entries can link to how
you unlock the ability. Target ~8–20.

```json
{
  "_sources": ["https://..."],
  "tools": [
    {
      "id": "cut",
      "name": "Cut",
      "pokemon": "Oddish",             // pokemon that teaches it (best-known), or null
      "effect": "Fells trees and clears brush to gather wood.",
      "unlockSummary": "Befriend the Pokémon that teaches it.",
      "notes": null
    }
  ]
}
```
