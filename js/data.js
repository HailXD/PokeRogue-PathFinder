export const BiomeId = {
    TOWN: "TOWN",
    PLAINS: "PLAINS",
    GRASS: "GRASS",
    METROPOLIS: "METROPOLIS",
    LAKE: "LAKE",
    TALL_GRASS: "TALL_GRASS",
    FOREST: "FOREST",
    CAVE: "CAVE",
    SLUM: "SLUM",
    CONSTRUCTION_SITE: "CONSTRUCTION_SITE",
    SWAMP: "SWAMP",
    JUNGLE: "JUNGLE",
    MEADOW: "MEADOW",
    SEA: "SEA",
    SEABED: "SEABED",
    ICE_CAVE: "ICE_CAVE",
    GRAVEYARD: "GRAVEYARD",
    BEACH: "BEACH",
    ISLAND: "ISLAND",
    VOLCANO: "VOLCANO",
    MOUNTAIN: "MOUNTAIN",
    WASTELAND: "WASTELAND",
    SPACE: "SPACE",
    BADLANDS: "BADLANDS",
    LABORATORY: "LABORATORY",
    DESERT: "DESERT",
    RUINS: "RUINS",
    SNOWY_FOREST: "SNOWY_FOREST",
    POWER_PLANT: "POWER_PLANT",
    FACTORY: "FACTORY",
    ABYSS: "ABYSS",
    DOJO: "DOJO",
    TEMPLE: "TEMPLE",
    FAIRY_CAVE: "FAIRY_CAVE",
};

const biomeLinksRaw = {
  [BiomeId.TOWN]: BiomeId.PLAINS,
  [BiomeId.PLAINS]: [ BiomeId.GRASS, BiomeId.METROPOLIS, BiomeId.LAKE ],
  [BiomeId.GRASS]: BiomeId.TALL_GRASS,
  [BiomeId.TALL_GRASS]: [ BiomeId.FOREST, BiomeId.CAVE ],
  [BiomeId.SLUM]: [ BiomeId.CONSTRUCTION_SITE, [ BiomeId.SWAMP, 2 ]],
  [BiomeId.FOREST]: [ BiomeId.JUNGLE, BiomeId.MEADOW ],
  [BiomeId.SEA]: [ BiomeId.SEABED, BiomeId.ICE_CAVE ],
  [BiomeId.SWAMP]: [ BiomeId.GRAVEYARD, BiomeId.TALL_GRASS ],
  [BiomeId.BEACH]: [ BiomeId.SEA, [ BiomeId.ISLAND, 2 ]],
  [BiomeId.LAKE]: [ BiomeId.BEACH, BiomeId.SWAMP, BiomeId.CONSTRUCTION_SITE ],
  [BiomeId.SEABED]: [ BiomeId.CAVE, [ BiomeId.VOLCANO, 3 ]],
  [BiomeId.MOUNTAIN]: [ BiomeId.VOLCANO, [ BiomeId.WASTELAND, 2 ], [ BiomeId.SPACE, 3 ]],
  [BiomeId.BADLANDS]: [ BiomeId.DESERT, BiomeId.MOUNTAIN ],
  [BiomeId.CAVE]: [ BiomeId.BADLANDS, BiomeId.LAKE, [ BiomeId.LABORATORY, 2 ]],
  [BiomeId.DESERT]: [ BiomeId.RUINS, [ BiomeId.CONSTRUCTION_SITE, 2 ]],
  [BiomeId.ICE_CAVE]: BiomeId.SNOWY_FOREST,
  [BiomeId.MEADOW]: [ BiomeId.PLAINS, BiomeId.FAIRY_CAVE ],
  [BiomeId.POWER_PLANT]: BiomeId.FACTORY,
  [BiomeId.VOLCANO]: [ BiomeId.BEACH, [ BiomeId.ICE_CAVE, 3 ]],
  [BiomeId.GRAVEYARD]: BiomeId.ABYSS,
  [BiomeId.DOJO]: [ BiomeId.PLAINS, [ BiomeId.JUNGLE, 2 ], [ BiomeId.TEMPLE, 2 ]],
  [BiomeId.FACTORY]: [ BiomeId.PLAINS, [ BiomeId.LABORATORY, 2 ]],
  [BiomeId.RUINS]: [ BiomeId.MOUNTAIN, [ BiomeId.FOREST, 2 ]],
  [BiomeId.WASTELAND]: BiomeId.BADLANDS,
  [BiomeId.ABYSS]: [ BiomeId.CAVE, [ BiomeId.SPACE, 2 ], [ BiomeId.WASTELAND, 2 ]],
  [BiomeId.SPACE]: BiomeId.RUINS,
  [BiomeId.CONSTRUCTION_SITE]: [ BiomeId.POWER_PLANT, [ BiomeId.DOJO, 2 ]],
  [BiomeId.JUNGLE]: [ BiomeId.TEMPLE ],
  [BiomeId.FAIRY_CAVE]: [ BiomeId.ICE_CAVE, [ BiomeId.SPACE, 2 ]],
  [BiomeId.TEMPLE]: [ BiomeId.DESERT, [ BiomeId.SWAMP, 2 ], [ BiomeId.RUINS, 2 ]],
  [BiomeId.METROPOLIS]: BiomeId.SLUM,
  [BiomeId.SNOWY_FOREST]: [ BiomeId.FOREST, [ BiomeId.MOUNTAIN, 2 ], [ BiomeId.LAKE, 2 ]],
  [BiomeId.ISLAND]: BiomeId.SEA,
  [BiomeId.LABORATORY]: BiomeId.CONSTRUCTION_SITE
};


export const graph = new Map();
export const allBiomes = new Set(Object.values(BiomeId));

Object.keys(BiomeId).forEach((idKey) => {
    const biomeName = BiomeId[idKey];
    if (!graph.has(biomeName)) {
        graph.set(biomeName, []);
    }
});

for (const sourceBiome in biomeLinksRaw) {
    if (!graph.has(sourceBiome)) graph.set(sourceBiome, []);
    let destinations = biomeLinksRaw[sourceBiome];
    if (!Array.isArray(destinations)) {
        destinations = [destinations];
    }

    destinations.forEach((destEntry) => {
        const useWeight = true;
        let targetBiome;
        let weight = 1;
        if (Array.isArray(destEntry)) {
            targetBiome = destEntry[0];
            if (useWeight) {
                weight = destEntry[1];
            }
        } else {
            targetBiome = destEntry;
        }

        if (allBiomes.has(targetBiome)) {
            graph.get(sourceBiome).push({ to: targetBiome, weight: weight });
        } else {
            console.warn(
                `Unknown biome referenced: ${targetBiome} from ${sourceBiome}`
            );
        }
    });
}

export const biomeNamesSorted = Array.from(allBiomes).sort();

export const biomePositions = {
    [BiomeId.TOWN]: { x: 0, y: 0 },
    [BiomeId.PLAINS]: { x: 150, y: 0 },
    [BiomeId.METROPOLIS]: { x: 300, y: -75 },
    [BiomeId.SLUM]: { x: 450, y: -75 },
    [BiomeId.CONSTRUCTION_SITE]: { x: 600, y: -75 },
    [BiomeId.POWER_PLANT]: { x: 750, y: -150 },
    [BiomeId.FACTORY]: { x: 900, y: -150 },
    [BiomeId.LABORATORY]: { x: 750, y: 0 },
    [BiomeId.DOJO]: { x: 600, y: 75 },
    [BiomeId.GRASS]: { x: 300, y: 75 },
    [BiomeId.TALL_GRASS]: { x: 450, y: 75 },
    [BiomeId.FOREST]: { x: 600, y: 150 },
    [BiomeId.JUNGLE]: { x: 750, y: 225 },
    [BiomeId.TEMPLE]: { x: 900, y: 225 },
    [BiomeId.MEADOW]: { x: 450, y: 150 },
    [BiomeId.FAIRY_CAVE]: { x: 300, y: 225 },
    [BiomeId.LAKE]: { x: 150, y: 150 },
    [BiomeId.SWAMP]: { x: 300, y: 150 },
    [BiomeId.GRAVEYARD]: { x: 450, y: 225 },
    [BiomeId.ABYSS]: { x: 600, y: 300 },
    [BiomeId.BEACH]: { x: 0, y: 225 },
    [BiomeId.SEA]: { x: -150, y: 225 },
    [BiomeId.ISLAND]: { x: -300, y: 225 },
    [BiomeId.SEABED]: { x: -150, y: 300 },
    [BiomeId.VOLCANO]: { x: -300, y: 375 },
    [BiomeId.ICE_CAVE]: { x: 0, y: 375 },
    [BiomeId.SNOWY_FOREST]: { x: 150, y: 375 },
    [BiomeId.CAVE]: { x: -150, y: 75 },
    [BiomeId.BADLANDS]: { x: -300, y: 75 },
    [BiomeId.DESERT]: { x: -450, y: 75 },
    [BiomeId.RUINS]: { x: -600, y: 75 },
    [BiomeId.MOUNTAIN]: { x: -300, y: 0 },
    [BiomeId.WASTELAND]: { x: -450, y: -75 },
    [BiomeId.SPACE]: { x: -450, y: 0 },
};
