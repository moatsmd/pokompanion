// Central data loader. Imports the canonical JSON in /data, normalizes it, and
// derives cross-links (which recipes use a material, which region has an item,
// etc.) so pages don't each re-compute relationships.
//
// Written defensively: the data is produced by research agents and may have
// missing optional fields, so every array access falls back to [] / null.

import materialsFile from '../../data/materials.json';
import itemsFile from '../../data/items.json';
import recipesFile from '../../data/recipes.json';
import regionsFile from '../../data/regions.json';
import toolsFile from '../../data/tools.json';
import habitatsFile from '../../data/habitats.json';
import tipsFile from '../../data/tips.json';

export type Source = {
  method?: string;
  region?: string;
  tool?: string | null;
  detail?: string;
  notes?: string | null;
};

export type Material = {
  id: string;
  name: string;
  category?: string;
  tier?: string;
  description?: string;
  sources?: Source[];
  refinedInto?: string[];
  usedInSummary?: string;
};

export type Item = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  obtain?: string;
  obtainDetail?: string;
  recipeId?: string | null;
  region?: string | null;
  notes?: string | null;
};

export type Ingredient = { material: string; qty?: number };

export type Recipe = {
  id: string;
  name: string;
  output: string;
  outputQty?: number;
  station?: string;
  unlock?: string;
  ingredients?: Ingredient[];
  effect?: string | null;
  notes?: string | null;
};

export type NotableLocation = { name: string; what?: string };

export type Region = {
  id: string;
  name: string;
  order?: number;
  summary?: string;
  keyResources?: string[];
  notableLocations?: NotableLocation[];
  toolsUsedHere?: string[];
  connectsTo?: string[];
  notes?: string | null;
};

export type Tool = {
  id: string;
  name: string;
  pokemon?: string | null;
  effect?: string;
  unlockSummary?: string;
  notes?: string | null;
};

export type HabitatReq = { item: string; qty?: number; note?: string | null };
export type Attract = { pokemon: string; note?: string | null };

export type Habitat = {
  id: string;
  name: string;
  biome?: string;
  description?: string;
  requirements?: HabitatReq[];
  conditions?: string;
  attracts?: Attract[];
  region?: string | null;
  notes?: string | null;
};

export type Tip = {
  id: string;
  title: string;
  category?: string;
  summary?: string;
  body?: string[];
  relatedItems?: string[];
  relatedRegions?: string[];
  tags?: string[];
  notes?: string | null;
};

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export const materials: Material[] = asArray<Material>((materialsFile as any).materials);
export const items: Item[] = asArray<Item>((itemsFile as any).items);
export const recipes: Recipe[] = asArray<Recipe>((recipesFile as any).recipes);
export const regions: Region[] = asArray<Region>((regionsFile as any).regions).sort(
  (a, b) => (a.order ?? 99) - (b.order ?? 99),
);
export const tools: Tool[] = asArray<Tool>((toolsFile as any).tools);
export const habitats: Habitat[] = asArray<Habitat>((habitatsFile as any).habitats).sort((a, b) =>
  a.name.localeCompare(b.name),
);
export const tips: Tip[] = asArray<Tip>((tipsFile as any).tips).sort((a, b) => a.title.localeCompare(b.title));

export const sources = {
  materials: asArray<string>((materialsFile as any)._sources),
  items: asArray<string>((itemsFile as any)._sources),
  recipes: asArray<string>((recipesFile as any)._sources),
  regions: asArray<string>((regionsFile as any)._sources),
  tools: asArray<string>((toolsFile as any)._sources),
  habitats: asArray<string>((habitatsFile as any)._sources),
  tips: asArray<string>((tipsFile as any)._sources),
};

export const materialsById = new Map(materials.map((m) => [m.id, m]));
export const itemsById = new Map(items.map((i) => [i.id, i]));
export const recipesById = new Map(recipes.map((r) => [r.id, r]));
export const regionsById = new Map(regions.map((r) => [r.id, r]));
export const toolsById = new Map(tools.map((t) => [t.id, t]));
export const habitatsById = new Map(habitats.map((h) => [h.id, h]));
export const tipsById = new Map(tips.map((t) => [t.id, t]));

// inverse of `refinedInto`: refined material id -> raw source material id(s)
const refinedFrom = new Map<string, string[]>();
for (const m of materials) {
  for (const t of asArray<string>(m.refinedInto)) {
    const arr = refinedFrom.get(t) ?? [];
    arr.push(m.id);
    refinedFrom.set(t, arr);
  }
}

export type Ref = { id: string; name: string; type: 'material' | 'item' | 'unknown'; href: string | null };

// Resolve a bare id (from ingredients / keyResources) to a display name + link.
export function resolveRef(id: string): Ref {
  const m = materialsById.get(id);
  if (m) return { id, name: m.name, type: 'material', href: `/materials/${id}` };
  const it = itemsById.get(id);
  if (it) return { id, name: it.name, type: 'item', href: `/items/${id}` };
  return { id, name: prettify(id), type: 'unknown', href: null };
}

export function prettify(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- derived cross-links -------------------------------------------------

export function recipesUsing(materialId: string): Recipe[] {
  return recipes.filter((r) => asArray<Ingredient>(r.ingredients).some((g) => g.material === materialId));
}

export function regionsWithResource(id: string): Region[] {
  return regions.filter((r) => asArray<string>(r.keyResources).includes(id));
}

export function recipeForItem(item: Item): Recipe | null {
  if (item.recipeId && recipesById.has(item.recipeId)) return recipesById.get(item.recipeId)!;
  // fall back to a recipe whose output is this item
  return recipes.find((r) => r.output === item.id) ?? null;
}

// Expand a recipe's ingredients down to raw materials, following refine edges.
// Refine ratios aren't in the data, so each refine step is treated as 1:1 and
// only the primary source is followed — returns null when nothing expands.
export type RollupRow = { id: string; name: string; qty: number; href: string | null };
// A material is only expanded if it is itself tier "refined". Some raw materials
// (e.g. Iron Ore) have an alternate "made from X" edge; we don't expand those.
const isRefined = (id: string) => materialsById.get(id)?.tier === 'refined' && refinedFrom.has(id);
export function rawRollup(ingredients: Ingredient[]): RollupRow[] | null {
  const list = asArray<Ingredient>(ingredients);
  if (!list.some((g) => isRefined(g.material))) return null;
  const totals = new Map<string, number>();
  const expand = (id: string, qty: number, depth: number) => {
    if (isRefined(id) && depth < 8) expand(refinedFrom.get(id)![0], qty, depth + 1);
    else totals.set(id, (totals.get(id) ?? 0) + qty);
  };
  for (const g of list) expand(g.material, g.qty ?? 1, 0);
  return [...totals.entries()]
    .map(([id, qty]) => {
      const r = resolveRef(id);
      return { id, name: r.name, qty, href: r.href };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function habitatsRequiring(id: string): Habitat[] {
  return habitats.filter((h) => asArray<HabitatReq>(h.requirements).some((r) => r.item === id));
}

export function habitatsInRegion(id: string): Habitat[] {
  return habitats.filter((h) => h.region === id);
}

export function tipsRelatedTo(id: string): Tip[] {
  return tips.filter((t) => asArray<string>(t.relatedItems).includes(id));
}

// --- Pokémon, derived from habitat `attracts` (no separate data file) ----

export type PokemonHabitat = {
  id: string;
  name: string;
  note?: string | null;
  conditions?: string;
  biome?: string;
  region?: string | null;
};

export type Pokemon = {
  id: string;
  name: string;
  habitats: PokemonHabitat[];
  biomes: string[];
  regions: string[];
};

export function pokeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const pokeMap = new Map<string, Pokemon>();
for (const h of habitats) {
  for (const a of asArray<Attract>(h.attracts)) {
    const id = pokeId(a.pokemon);
    if (!id) continue;
    let p = pokeMap.get(id);
    if (!p) {
      p = { id, name: a.pokemon, habitats: [], biomes: [], regions: [] };
      pokeMap.set(id, p);
    }
    p.habitats.push({ id: h.id, name: h.name, note: a.note ?? null, conditions: h.conditions ?? '', biome: h.biome, region: h.region ?? null });
    if (h.biome && !p.biomes.includes(h.biome)) p.biomes.push(h.biome);
    if (h.region && !p.regions.includes(h.region)) p.regions.push(h.region);
  }
}

export const pokemon: Pokemon[] = [...pokeMap.values()].sort((a, b) => a.name.localeCompare(b.name));
export const pokemonById = new Map(pokemon.map((p) => [p.id, p]));

// counts for the home page
export const counts = {
  materials: materials.length,
  items: items.length,
  recipes: recipes.length,
  regions: regions.length,
  tools: tools.length,
  habitats: habitats.length,
  pokemon: pokemon.length,
  tips: tips.length,
};
