const BiomeId = {
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
    [BiomeId.PLAINS]: [BiomeId.GRASS, BiomeId.METROPOLIS, BiomeId.LAKE],
    [BiomeId.GRASS]: BiomeId.TALL_GRASS,
    [BiomeId.TALL_GRASS]: [BiomeId.FOREST, BiomeId.CAVE],
    [BiomeId.SLUM]: [BiomeId.CONSTRUCTION_SITE, [BiomeId.SWAMP, 2]],
    [BiomeId.FOREST]: [BiomeId.JUNGLE, BiomeId.MEADOW],
    [BiomeId.SEA]: [BiomeId.SEABED, BiomeId.ICE_CAVE],
    [BiomeId.SWAMP]: [BiomeId.GRAVEYARD, BiomeId.TALL_GRASS],
    [BiomeId.BEACH]: [BiomeId.SEA, [BiomeId.ISLAND, 2]],
    [BiomeId.LAKE]: [BiomeId.BEACH, BiomeId.SWAMP, BiomeId.CONSTRUCTION_SITE],
    [BiomeId.SEABED]: [BiomeId.CAVE, [BiomeId.VOLCANO, 3]],
    [BiomeId.MOUNTAIN]: [
        BiomeId.VOLCANO,
        [BiomeId.WASTELAND, 2],
        [BiomeId.SPACE, 3],
    ],
    [BiomeId.BADLANDS]: [BiomeId.DESERT, BiomeId.MOUNTAIN],
    [BiomeId.CAVE]: [BiomeId.BADLANDS, BiomeId.LAKE, [BiomeId.LABORATORY, 2]],
    [BiomeId.DESERT]: [BiomeId.RUINS, [BiomeId.CONSTRUCTION_SITE, 2]],
    [BiomeId.ICE_CAVE]: BiomeId.SNOWY_FOREST,
    [BiomeId.MEADOW]: [BiomeId.PLAINS, BiomeId.FAIRY_CAVE],
    [BiomeId.POWER_PLANT]: BiomeId.FACTORY,
    [BiomeId.VOLCANO]: [BiomeId.BEACH, [BiomeId.ICE_CAVE, 3]],
    [BiomeId.GRAVEYARD]: BiomeId.ABYSS,
    [BiomeId.DOJO]: [BiomeId.PLAINS, [BiomeId.JUNGLE, 2], [BiomeId.TEMPLE, 2]],
    [BiomeId.FACTORY]: [BiomeId.PLAINS, [BiomeId.LABORATORY, 2]],
    [BiomeId.RUINS]: [BiomeId.MOUNTAIN, [BiomeId.FOREST, 2]],
    [BiomeId.WASTELAND]: BiomeId.BADLANDS,
    [BiomeId.ABYSS]: [BiomeId.CAVE, [BiomeId.SPACE, 2], [BiomeId.WASTELAND, 2]],
    [BiomeId.SPACE]: BiomeId.RUINS,
    [BiomeId.CONSTRUCTION_SITE]: [BiomeId.POWER_PLANT, [BiomeId.DOJO, 2]],
    [BiomeId.JUNGLE]: [BiomeId.TEMPLE],
    [BiomeId.FAIRY_CAVE]: [BiomeId.ICE_CAVE, [BiomeId.SPACE, 2]],
    [BiomeId.TEMPLE]: [BiomeId.DESERT, [BiomeId.SWAMP, 2], [BiomeId.RUINS, 2]],
    [BiomeId.METROPOLIS]: BiomeId.SLUM,
    [BiomeId.SNOWY_FOREST]: [
        BiomeId.FOREST,
        [BiomeId.MOUNTAIN, 2],
        [BiomeId.LAKE, 2],
    ],
    [BiomeId.ISLAND]: BiomeId.SEA,
    [BiomeId.LABORATORY]: BiomeId.CONSTRUCTION_SITE,
};

const graph = new Map();
const allBiomes = new Set(Object.values(BiomeId));

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
        const useWeight = false;
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

const biomeNamesSorted = Array.from(allBiomes).sort();

const startBiomeSelect = document.getElementById("startBiome");
biomeNamesSorted.forEach((biome) => {
    const option = new Option(biome.replace(/_/g, " "), biome);
    startBiomeSelect.add(option);
});
startBiomeSelect.value = BiomeId.TOWN;
let previousStartNode = startBiomeSelect.value;

const selectedTargetBiomes = new Set();
const selectedAvoidBiomes = new Set();
const selectedPokemon = new Set();
let persistentPathNodeIds = new Set();
let persistentPathEdgeIds = new Set();
let persistentLoopEdgeIds = new Set();
let visitedNodes = new Set();

const pokemonSearchInput = document.getElementById("pokemonSearch");
const pokemonListContainer = document.getElementById("pokemonListContainer");
const selectedPokemonIndicator = document.getElementById(
    "selectedPokemonIndicator"
);
let allPokemonData = {};
let biomePokemonSpawns = new Map();

const rarityOrder = [
    "COMMON",
    "UNCOMMON",
    "RARE",
    "SUPER_RARE",
    "ULTRA_RARE",
    "BOSS",
    "BOSS_RARE",
    "BOSS_SUPER_RARE",
    "BOSS_ULTRA_RARE",
];

const NODE_STYLES = {
    DEFAULT: {
        background: "#97C2FC",
        border: "#666666",
        fontColor: "black",
        fontSize: 12,
        bold: false,
        borderWidth: 1.5,
    },
    START: {
        background: "#00FFFF",
        border: "#008B8B",
        fontColor: "black",
        fontSize: 14,
        bold: true,
        borderWidth: 2.5,
    },
    TARGET: {
        background: "#FF00FF",
        border: "#8B008B",
        fontColor: "white",
        fontSize: 14,
        bold: true,
        borderWidth: 2.5,
    },
    AVOID: {
        background: "#e0e0e0",
        border: "#757575",
        fontColor: "#757575",
        fontSize: 10,
        bold: false,
        borderWidth: 1.5,
    },
    POKEMON_SPAWN_HIGHLIGHT: { border: "#FFD700", borderWidth: 4},
    PATH_ANIMATION: { background: "#79B6FF", border: "black", borderWidth: 3 },
    LOOP_ANIMATION: { background: "#97C2FC", border: "black", borderWidth: 3 },
};

const TIME_ICONS = {
    DAWN: "🌅",
    DAY: "☀️",
    DUSK: "🌇",
    NIGHT: "🌙",
    ALL: "🌍",
};

function updateAllNodeStyles() {
    const pokemonSpawnBiomes = new Set();
    if (selectedPokemon.size > 0) {
        selectedPokemon.forEach((pokemonName) => {
            const spawns = allPokemonData[pokemonName] || [];
            spawns.forEach((spawnInfo) => pokemonSpawnBiomes.add(spawnInfo[0]));
        });
    }

    const updates = nodes.getIds().map((nodeId) => {
        const isStart = nodeId === startBiomeSelect.value;
        const isTarget = selectedTargetBiomes.has(nodeId);
        const isAvoid = selectedAvoidBiomes.has(nodeId);
        const isPokemonSpawn = pokemonSpawnBiomes.has(nodeId);
        const isVisited = visitedNodes.has(nodeId);

        let style;
        let isDefaultStyled = false;

        if (isStart) {
            style = NODE_STYLES.START;
        } else if (isAvoid) {
            style = NODE_STYLES.AVOID;
        } else if (isTarget) {
            style = NODE_STYLES.TARGET;
        } else {
            style = NODE_STYLES.DEFAULT;
            isDefaultStyled = true;
        }

        const nodeUpdate = {
            id: nodeId,
            color: {
                background: style.background,
                border: style.border,
            },
            font: {
                color: style.fontColor,
                size: style.fontSize,
                bold: style.bold,
            },
            borderWidth: style.borderWidth,
        };

        if (isVisited) {
            nodeUpdate.font.bold = true;
            if (isDefaultStyled) {
                const pathStyle = NODE_STYLES.PATH_ANIMATION;
                nodeUpdate.color.background = pathStyle.background;
                nodeUpdate.color.border = pathStyle.border;
                nodeUpdate.borderWidth = pathStyle.borderWidth;
            }
        }

        if (isPokemonSpawn) {
            const spawnHighlight = NODE_STYLES.POKEMON_SPAWN_HIGHLIGHT;
            nodeUpdate.color.border = spawnHighlight.border;
            nodeUpdate.borderWidth = spawnHighlight.borderWidth;
        }

        return nodeUpdate;
    });

    if (updates.length > 0) {
        nodes.update(updates);
    }
}

function createMultiSelectItems(containerId, selectedSet, indicatorId) {
    const container = document.getElementById(containerId);
    const indicator = document.getElementById(indicatorId);
    container.innerHTML = "";

    biomeNamesSorted.forEach((biome) => {
        const item = document.createElement("div");
        const itemText = biome.replace(/_/g, " ");
        item.classList.add("multi-select-item");
        item.textContent = itemText;
        item.dataset.value = biome;
        item.dataset.originalText = itemText;

        if (selectedSet.has(biome)) {
            item.classList.add("selected");
        }

        item.addEventListener("click", () => {
            const biomeValue = item.dataset.value;
            if (selectedSet.has(biomeValue)) {
                selectedSet.delete(biomeValue);
                item.classList.remove("selected");
            } else {
                if (
                    containerId === "avoidBiomesContainer" &&
                    biomeValue === startBiomeSelect.value
                ) {
                    alert("Start biome cannot be in the 'Avoid Biomes' list.");
                    return;
                }
                selectedSet.add(biomeValue);
                item.classList.add("selected");
            }
            updateSelectedIndicator(selectedSet, indicator, containerId);
            updateAllNodeStyles();

            if (
                containerId === "avoidBiomesContainer" &&
                selectedTargetBiomes.has(biomeValue)
            ) {
                selectedTargetBiomes.delete(biomeValue);
                document
                    .querySelectorAll(
                        "#targetBiomesContainer .multi-select-item"
                    )
                    .forEach((tItem) => {
                        if (tItem.dataset.value === biomeValue)
                            tItem.classList.remove("selected");
                    });
                updateSelectedIndicator(
                    selectedTargetBiomes,
                    document.getElementById("selectedTargetsIndicator"),
                    "targetBiomesContainer"
                );
            }
            if (
                containerId === "targetBiomesContainer" &&
                selectedAvoidBiomes.has(biomeValue)
            ) {
                selectedAvoidBiomes.delete(biomeValue);
                document
                    .querySelectorAll(
                        "#avoidBiomesContainer .multi-select-item"
                    )
                    .forEach((aItem) => {
                        if (aItem.dataset.value === biomeValue)
                            aItem.classList.remove("selected");
                    });
                updateSelectedIndicator(
                    selectedAvoidBiomes,
                    document.getElementById("selectedAvoidIndicator"),
                    "avoidBiomesContainer"
                );
            }
            updateAllNodeStyles();
        });
        container.appendChild(item);
    });
    updateSelectedIndicator(selectedSet, indicator, containerId);
}

function updateSelectedIndicator(
    selectedSet,
    indicatorElement,
    listContainerId
) {
    if (!indicatorElement) return;

    indicatorElement.innerHTML = "";

    if (selectedSet.size === 0) {
        indicatorElement.textContent = "Nothing selected";
        indicatorElement.classList.add("indicator-empty");
        return;
    }

    indicatorElement.classList.remove("indicator-empty");

    Array.from(selectedSet)
        .sort()
        .forEach((itemName) => {
            const button = document.createElement("button");
            button.className = "selected-indicator-btn";
            button.dataset.value = itemName;

            button.innerHTML = `<span>${itemName.replace(
                /_/g,
                " "
            )}</span><span class="deselect-x">×</span>`;

            button.addEventListener("click", () => {
                selectedSet.delete(itemName);

                const mainListContainer =
                    document.getElementById(listContainerId);
                if (mainListContainer) {
                    const itemInList = mainListContainer.querySelector(
                        `.multi-select-item[data-value="${itemName}"]`
                    );
                    if (itemInList) {
                        itemInList.classList.remove("selected");
                    }
                }

                updateAllNodeStyles();

                if (listContainerId === "pokemonListContainer") {
                    nodes.update(
                        nodes.get().map((node) => ({
                            id: node.id,
                            title: createTooltipElement(node.id),
                        }))
                    );
                }

                updateSelectedIndicator(
                    selectedSet,
                    indicatorElement,
                    listContainerId
                );
            });

            indicatorElement.appendChild(button);
        });
}

createMultiSelectItems(
    "targetBiomesContainer",
    selectedTargetBiomes,
    "selectedTargetsIndicator"
);
createMultiSelectItems(
    "avoidBiomesContainer",
    selectedAvoidBiomes,
    "selectedAvoidIndicator"
);

startBiomeSelect.addEventListener("change", (event) => {
    const newStartNode = event.target.value;

    if (selectedAvoidBiomes.has(newStartNode)) {
        selectedAvoidBiomes.delete(newStartNode);
        const itemInList = document.querySelector(
            `#avoidBiomesContainer .multi-select-item[data-value="${newStartNode}"]`
        );
        if (itemInList) itemInList.classList.remove("selected");

        updateSelectedIndicator(
            selectedAvoidBiomes,
            document.getElementById("selectedAvoidIndicator"),
            "avoidBiomesContainer"
        );
    }

    previousStartNode = newStartNode;
    updateAllNodeStyles();
});

function dijkstra(startNode, endNode, avoidNodes = new Set()) {
    const distances = new Map();
    const prevNodes = new Map();
    const pq = new Set();

    allBiomes.forEach((biome) => {
        distances.set(biome, Infinity);
        prevNodes.set(biome, null);
    });

    distances.set(startNode, 0);
    pq.add([0, startNode]);

    while (pq.size > 0) {
        let u = null;
        let minDist = Infinity;
        for (const item of pq) {
            if (item[0] < minDist) {
                minDist = item[0];
                u = item[1];
            }
        }

        if (u === null) break;

        let toRemoveFromPq;
        for (const item of pq)
            if (item[1] === u && item[0] === minDist) toRemoveFromPq = item;
        pq.delete(toRemoveFromPq);

        if (avoidNodes.has(u) && u !== startNode && u !== endNode) continue;

        const neighbors = graph.get(u) || [];
        for (const edge of neighbors) {
            const v = edge.to;
            if (avoidNodes.has(v) && v !== endNode) continue;

            const alt = distances.get(u) + edge.weight;
            if (alt < distances.get(v)) {
                distances.set(v, alt);
                prevNodes.set(v, u);

                let vToRemoveFromPq;
                for (const item of pq)
                    if (item[1] === v) vToRemoveFromPq = item;
                if (vToRemoveFromPq) pq.delete(vToRemoveFromPq);

                pq.add([alt, v]);
            }
        }
    }

    const path = [];
    let curr = endNode;
    if (prevNodes.get(curr) || curr === startNode) {
        while (curr) {
            path.unshift(curr);
            curr = prevNodes.get(curr);
        }
    }

    const cost = distances.get(endNode);
    if (
        cost === Infinity ||
        path.length === 0 ||
        (path.length === 1 && startNode !== endNode) ||
        (path.length > 0 && path[0] !== startNode)
    ) {
        return { path: [], cost: Infinity };
    }
    return { path: path, cost: cost };
}

let network = null;
let nodes = new vis.DataSet();
const edges = new vis.DataSet();

function sortSpawns(a, b) {
    const rarityAIndex = rarityOrder.indexOf(a.rarity);
    const rarityBIndex = rarityOrder.indexOf(b.rarity);

    if (rarityAIndex !== rarityBIndex) {
        return rarityAIndex - rarityBIndex;
    }

    return a.pokemonName.localeCompare(b.pokemonName);
}

function createPokemonListElement(spawns, listType) {
    const list = document.createElement("ul");

    spawns.sort(sortSpawns).forEach((spawn) => {
        const pokemonName = spawn.pokemonName.replace(/_/g, " ");
        const rarityClass = `rarity-tag rarity-${spawn.rarity}`;
        const timeIcon = TIME_ICONS[spawn.time] || "❓";

        const listItem = document.createElement("li");

        const nameSpan = document.createElement("span");
        nameSpan.className = "pokemon-name";
        nameSpan.textContent = pokemonName;

        const detailsSpan = document.createElement("span");
        detailsSpan.className = "spawn-details";

        const raritySpan = document.createElement("span");
        raritySpan.className = rarityClass;
        raritySpan.textContent = spawn.rarity.replace(/_/g, " ");
        const timeSpan = document.createElement("span");
        timeSpan.textContent = timeIcon;

        detailsSpan.appendChild(raritySpan);
        detailsSpan.appendChild(timeSpan);

        listItem.appendChild(nameSpan);
        listItem.appendChild(detailsSpan);

        list.appendChild(listItem);
    });
    return list;
}

function createTooltipElement(biomeId) {
    const allSpawns = biomePokemonSpawns.get(biomeId) || [];
    const biomeName = biomeId.replace(/_/g, " ");

    const tooltipElement = document.createElement("div");
    const header = document.createElement("h4");
    header.textContent = biomeName;
    tooltipElement.appendChild(header);

    if (selectedPokemon.size === 0) {
        tooltipElement.append("Select Pokemon to highlight spawns.");
        tooltipElement.appendChild(document.createElement("br"));
        tooltipElement.append(" Click node for full spawn list.");
        return tooltipElement;
    }

    const selectedSpawns = allSpawns.filter((spawn) =>
        selectedPokemon.has(spawn.pokemonName)
    );

    if (selectedSpawns.length === 0) {
        tooltipElement.append("No selected Pokémon spawns in this biome.");
        tooltipElement.appendChild(document.createElement("br"));
        tooltipElement.append("Click node for full spawn list.");
        return tooltipElement;
    }

    tooltipElement.append("Selected Pokémon Spawns:");
    const listElement = createPokemonListElement(selectedSpawns, "tooltip");
    tooltipElement.appendChild(listElement);

    const footer = document.createElement("p");
    footer.className = "tooltip-footer";
    footer.textContent = "Click node for full spawn list.";
    tooltipElement.appendChild(footer);

    return tooltipElement;
}

function initializeGraph() {
    const isDark = document.body.classList.contains("dark-theme");
    const edgeColor = isDark ? "#555" : "#cccccc";
    const highlightColor = isDark ? "#777" : "#ababab";
    const fontColor = isDark ? "#999" : "#777777";

    edges.clear();
    graph.forEach((connections, source) => {
        connections.forEach((conn) => {
            edges.add({
                id: `${source}_${conn.to}_w${conn.weight}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                from: source,
                to: conn.to,
                label: conn.weight > 1 ? String(conn.weight) : undefined,
                arrows: "to",
                color: { color: edgeColor, highlight: highlightColor },
                font: { align: "top", size: 9, color: fontColor },
            });
        });
    });

    const nodeData = biomeNamesSorted.map((name) => ({
        id: name,
        label: name.replace(/_/g, " "),
        title: createTooltipElement(name),
    }));
    nodes.clear();
    nodes.add(nodeData);

    const graphContainer = document.getElementById("graph-container");
    const data = { nodes: nodes, edges: edges };

    const options = {
        layout: { randomSeed: 10 },
        edges: {
            smooth: {
                type: "continuous",
                forceDirection: "none",
                roundness: 0.2,
            },
            font: { size: 10, align: "middle" },
            selfReference: { size: 20, angle: Math.PI / 4 },
        },
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -25000,
                centralGravity: 0.25,
                springLength: 180,
                springConstant: 0.05,
                damping: 0.09,
                avoidOverlap: 0.6,
            },
            stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 25,
                onlyDynamicEdges: false,
                fit: true,
            },
            minVelocity: 0.75,
        },
        interaction: {
            tooltipDelay: 200,
            hideEdgesOnDrag: true,
            dragNodes: true,
            zoomView: true,
            dragView: true,
        },
        nodes: {
            shape: "box",
            margin: 10,
            font: { face: "Arial" },
            borderWidth: 1.5,
        },
    };
    network = new vis.Network(graphContainer, data, options);

    network.on("stabilizationIterationsDone", function () {
        network.setOptions({ physics: { enabled: false } });
    });

    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const biomeId = params.nodes[0];
            populateAndShowPokemonModal(biomeId);
        }
    });

    updateAllNodeStyles();
}

function resetGraphStyles() {
    updateAllNodeStyles();

    const isDark = document.body.classList.contains("dark-theme");
    const edgeColor = isDark ? "#555" : "#cccccc";
    const highlightColor = isDark ? "#777" : "#ababab";
    const fontColor = isDark ? "#999" : "#777777";

    const pathEdgeStyle = {
        color: "#79B6FF",
        width: 2.5,
        dashes: false,
    };
    const loopEdgeStyle = {
        color: "red",
        dashes: [5, 5],
        width: 2.5,
    };

    const edgeUpdates = edges.getIds().map((edgeId) => {
        const update = {
            id: edgeId,
            font: { color: fontColor },
        };

        if (persistentLoopEdgeIds.has(edgeId)) {
            update.color = {
                color: loopEdgeStyle.color,
                highlight: highlightColor,
            };
            update.width = loopEdgeStyle.width;
            update.dashes = loopEdgeStyle.dashes;
        } else if (persistentPathEdgeIds.has(edgeId)) {
            update.color = {
                color: pathEdgeStyle.color,
                highlight: highlightColor,
            };
            update.width = pathEdgeStyle.width;
            update.dashes = pathEdgeStyle.dashes;
        } else {
            update.color = { color: edgeColor, highlight: highlightColor };
            update.width = 1;
            update.dashes = false;
        }
        return update;
    });

    if (edgeUpdates.length > 0) {
        edges.update(edgeUpdates);
    }
}

async function animatePath(pathSegments, animationStyle, options = {}) {
    const {
        isLoop = false,
        baseDelay = 250,
        startNode = "",
        targetNodes = new Set(),
        pokemonSpawnNodes = new Set(),
    } = options;

    const processNode = async (nodeId) => {
        const isStart = nodeId === startNode;
        const isTarget = targetNodes.has(nodeId);
        const isPokemonSpawn = pokemonSpawnNodes.has(nodeId);

        let baseStyle = NODE_STYLES.DEFAULT;
        if (isStart) baseStyle = NODE_STYLES.START;
        else if (isTarget) baseStyle = NODE_STYLES.TARGET;

        const nodeUpdate = {
            id: nodeId,
            font: {
                color: baseStyle.fontColor,
                size: baseStyle.fontSize,
                bold: baseStyle.bold,
            },
        };

        const backgroundColor = isTarget
            ? NODE_STYLES.TARGET.background
            : animationStyle.background;

        let borderColor, borderWidth;
        if (isPokemonSpawn) {
            borderColor = NODE_STYLES.POKEMON_SPAWN_HIGHLIGHT.border;
            borderWidth = NODE_STYLES.POKEMON_SPAWN_HIGHLIGHT.borderWidth;
        } else {
            borderColor = animationStyle.border;
            borderWidth = animationStyle.borderWidth;
        }

        nodeUpdate.color = {
            background: backgroundColor,
            border: borderColor,
        };
        nodeUpdate.borderWidth = borderWidth;

        nodes.update(nodeUpdate);
    };

    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        if (!segment || segment.length === 0) continue;

        if (segment.length === 1) {
            await processNode(segment[0]);
            await new Promise((resolve) => setTimeout(resolve, baseDelay / 2));
            continue;
        }

        for (let j = 0; j < segment.length - 1; j++) {
            const u = segment[j];
            const v = segment[j + 1];

            await processNode(u);
            await new Promise((resolve) => setTimeout(resolve, baseDelay / 2));

            const edgeToUpdate = edges.get({
                filter: (item) => item.from === u && item.to === v,
            });

            if (edgeToUpdate.length > 0) {
                edgeToUpdate.forEach((edge) => {
                    edges.update({
                        id: edge.id,
                        color: {
                            color: isLoop ? "red" : animationStyle.background,
                            highlight: isLoop
                                ? "red"
                                : animationStyle.background,
                        },
                        width: 3.5,
                        dashes: isLoop ? [5, 5] : false,
                    });
                });
            }
            await new Promise((resolve) => setTimeout(resolve, baseDelay / 2));
        }
        const lastNode = segment[segment.length - 1];
        await processNode(lastNode);
    }
}

function getPermutations(array) {
    if (array.length <= 1) return [array];
    const result = [];
    for (let i = 0; i < array.length; i++) {
        const currentElement = array[i];
        const remainingElements = [...array.slice(0, i), ...array.slice(i + 1)];
        const permsOfRemaining = getPermutations(remainingElements);
        for (const perm of permsOfRemaining) {
            result.push([currentElement, ...perm]);
        }
    }
    return result;
}

function getEdgeIdsForPath(path) {
    const ids = new Set();
    if (!path || path.length < 2) return Array.from(ids);

    for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const foundEdges = edges.get({
            filter: (item) => item.from === u && item.to === v,
        });
        foundEdges.forEach((edge) => ids.add(edge.id));
    }
    return Array.from(ids);
}

function findShortestRoundTripFromNode(node, avoidNodesSet) {
    let minLoopCost = Infinity;
    let bestLoopPath = [];

    const potentialIntermediates = Array.from(allBiomes).filter(
        (b) => b !== node && !avoidNodesSet.has(b)
    );

    if (potentialIntermediates.length === 0) {
        return { path: [], cost: Infinity };
    }

    for (const intermediate of potentialIntermediates) {
        const pathToIntermediate = dijkstra(node, intermediate, avoidNodesSet);
        if (
            pathToIntermediate.cost === Infinity ||
            !pathToIntermediate.path ||
            pathToIntermediate.path.length === 0
        ) {
            continue;
        }

        const pathFromIntermediate = dijkstra(
            intermediate,
            node,
            avoidNodesSet
        );
        if (
            pathFromIntermediate.cost === Infinity ||
            !pathFromIntermediate.path ||
            pathFromIntermediate.path.length === 0
        ) {
            continue;
        }

        if (
            pathToIntermediate.path.length < 2 &&
            pathToIntermediate.cost === 0 &&
            node === intermediate
        )
            continue;
        if (
            pathFromIntermediate.path.length < 2 &&
            pathFromIntermediate.cost === 0 &&
            node === intermediate
        )
            continue;

        const currentLoopCost =
            pathToIntermediate.cost + pathFromIntermediate.cost;

        if (currentLoopCost > 0 && currentLoopCost < minLoopCost) {
            minLoopCost = currentLoopCost;
            bestLoopPath = [
                ...pathToIntermediate.path,
                ...pathFromIntermediate.path.slice(1),
            ];
        }
    }

    if (minLoopCost === Infinity || bestLoopPath.length < 3) {
        return { path: [], cost: Infinity };
    }

    return { path: bestLoopPath, cost: minLoopCost };
}

async function findPathGreedy(
    startNode,
    effectiveTargetNodes,
    avoidNodesSet,
    statusDiv,
    initialStatusHTML,
    styleOptions
) {
    let statusHTML = initialStatusHTML;
    statusHTML += `Starting from <span class="highlight-start">${startNode.replace(
        /_/g,
        " "
    )}</span>.<br>Seeking targets: ${effectiveTargetNodes
        .map(
            (t) =>
                `<span class="highlight-target">${t.replace(/_/g, " ")}</span>`
        )
        .join(", ")}.`;
    if (avoidNodesSet.size > 0) {
        statusHTML += `<br>Avoiding: ${Array.from(avoidNodesSet)
            .map(
                (a) =>
                    `<span class="highlight-avoid">${a.replace(
                        /_/g,
                        " "
                    )}</span>`
            )
            .join(", ")}.`;
    }
    statusDiv.innerHTML = statusHTML;
    await new Promise((resolve) => setTimeout(resolve, 10));

    let currentPos = startNode;
    let remainingTargets = new Set(effectiveTargetNodes);
    const visitedTargetsOrder = [];
    const pathSegments = [];
    let totalCost = 0;
    let pathPossible = true;
    let firstVisitedTarget = null;
    let finalLoopPath = [];

    while (remainingTargets.size > 0) {
        let bestPathToNextTarget = { path: [], cost: Infinity };
        let nextTargetChosen = null;

        for (const target of remainingTargets) {
            if (target === currentPos) {
                bestPathToNextTarget = { path: [currentPos], cost: 0 };
                nextTargetChosen = target;
                break;
            }
            const res = dijkstra(currentPos, target, avoidNodesSet);
            if (res.path.length > 0 && res.cost < bestPathToNextTarget.cost) {
                bestPathToNextTarget = res;
                nextTargetChosen = target;
            }
        }

        if (!nextTargetChosen) {
            pathPossible = false;
            statusHTML += `<br><br>Cannot reach any remaining targets from ${currentPos.replace(
                /_/g,
                " "
            )}. Pathfinding stopped.`;
            break;
        }

        if (
            bestPathToNextTarget.path.length > 0 &&
            !(
                bestPathToNextTarget.path.length === 1 &&
                bestPathToNextTarget.path[0] === currentPos &&
                bestPathToNextTarget.cost > 0
            )
        ) {
            if (
                bestPathToNextTarget.path.length > 1 ||
                bestPathToNextTarget.cost === 0
            ) {
                pathSegments.push(bestPathToNextTarget.path);
            }
        }

        totalCost += bestPathToNextTarget.cost;
        currentPos = nextTargetChosen;

        if (!visitedTargetsOrder.includes(nextTargetChosen)) {
            visitedTargetsOrder.push(nextTargetChosen);
            if (!firstVisitedTarget) {
                firstVisitedTarget = nextTargetChosen;
            }
        }
        remainingTargets.delete(nextTargetChosen);

        statusHTML +=
            `<br>\nReached <span class="highlight-target">${nextTargetChosen.replace(
                /_/g,
                " "
            )}</span>` +
            (bestPathToNextTarget.path.length > 1
                ? ` via\n[${formatPathWithIntermediates(
                      bestPathToNextTarget.path,
                      startNode,
                      effectiveTargetNodes
                  )}]`
                : "") +
            ` (cost: ${bestPathToNextTarget.cost}).`;
        statusDiv.innerHTML = statusHTML;
        await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (
        !pathPossible &&
        visitedTargetsOrder.length < effectiveTargetNodes.length
    ) {
        statusHTML += `<br><br>Failed to visit all targets. ${visitedTargetsOrder.length} of ${effectiveTargetNodes.length} targets visited.`;
        if (pathSegments.length > 0) {
            await animatePath(pathSegments, NODE_STYLES.PATH_ANIMATION, {
                startNode: startNode,
                targetNodes: styleOptions.allTargetNodes,
                pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
            });
        }
    } else if (visitedTargetsOrder.length > 0) {
        statusHTML += `<br><br>All targets visited! Greedy path cost (to last target): ${totalCost}.`;
        if (pathSegments.length > 0) {
            await animatePath(pathSegments, NODE_STYLES.PATH_ANIMATION, {
                startNode: startNode,
                targetNodes: styleOptions.allTargetNodes,
                pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
            });
        }

        const loopStartNode =
            visitedTargetsOrder[visitedTargetsOrder.length - 1];
        const loopEndNode = firstVisitedTarget;

        statusHTML += `<br><br>Calculating return loop path from <span class="highlight-loop">${loopStartNode.replace(
            /_/g,
            " "
        )}</span> back to <span class="highlight-loop">${loopEndNode.replace(
            /_/g,
            " "
        )}</span>...`;
        statusDiv.innerHTML = statusHTML;
        await new Promise((resolve) => setTimeout(resolve, 10));

        if (loopStartNode === loopEndNode) {
            statusHTML += `<br>Looping from/to the same target <span class="highlight-target">${loopStartNode.replace(
                /_/g,
                " "
            )}</span>. Applying mandatory round trip rule.`;
            statusDiv.innerHTML = statusHTML;
            await new Promise((resolve) => setTimeout(resolve, 10));

            const roundTripData = findShortestRoundTripFromNode(
                loopStartNode,
                avoidNodesSet
            );
            if (
                roundTripData.cost !== Infinity &&
                roundTripData.path.length > 0
            ) {
                finalLoopPath = roundTripData.path;
                totalCost += roundTripData.cost;
                statusHTML +=
                    `<br><b>Mandatory Round Trip:</b> ${formatPathWithIntermediates(
                        roundTripData.path,
                        startNode,
                        [loopStartNode],
                        true
                    )}` +
                    `<br><b>Cost:</b> ${roundTripData.cost}. <br><b>Total combined greedy cost: ${totalCost}</b>.`;
                await animatePath(
                    [roundTripData.path],
                    NODE_STYLES.LOOP_ANIMATION,
                    {
                        isLoop: true,
                        baseDelay: 200,
                        startNode: startNode,
                        targetNodes: styleOptions.allTargetNodes,
                        pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
                    }
                );
            } else {
                statusHTML += `<br>Cannot find a mandatory round trip from <span style="font-weight: bold;">${loopStartNode.replace(
                    /_/g,
                    " "
                )}</span> via another node. Loop part failed. Total cost remains ${totalCost}.`;
            }
        } else {
            const loopPathData = dijkstra(
                loopStartNode,
                loopEndNode,
                avoidNodesSet
            );
            if (
                loopPathData.path.length > 0 &&
                loopPathData.cost !== Infinity
            ) {
                finalLoopPath = loopPathData.path;
                totalCost += loopPathData.cost;
                statusHTML +=
                    `<br><b>Return Loop Path:</b> ${formatPathWithIntermediates(
                        loopPathData.path,
                        startNode,
                        [loopStartNode, loopEndNode],
                        true
                    )}` +
                    `<br><b>Cost:</b> ${loopPathData.cost}. <br><b>Total combined greedy cost: ${totalCost}</b>.`;
                await animatePath(
                    [loopPathData.path],
                    NODE_STYLES.LOOP_ANIMATION,
                    {
                        isLoop: true,
                        baseDelay: 300,
                        startNode: startNode,
                        targetNodes: styleOptions.allTargetNodes,
                        pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
                    }
                );
            } else {
                statusHTML += `<br>Cannot find return loop path from <span style="font-weight: bold;">${loopStartNode.replace(
                    /_/g,
                    " "
                )}</span> to <span style="font-weight: bold;">${loopEndNode.replace(
                    /_/g,
                    " "
                )}</span>. Total cost remains ${totalCost}.`;
            }
        }
    } else if (effectiveTargetNodes.length > 0) {
        statusHTML += `<br><br>Could not reach any of the specified targets.`;
    }

    pathSegments.forEach((segment) => {
        segment.forEach((node) => {
            persistentPathNodeIds.add(node);
            visitedNodes.add(node);
        });
        getEdgeIdsForPath(segment).forEach((id) =>
            persistentPathEdgeIds.add(id)
        );
    });
    finalLoopPath.forEach((node) => {
        persistentPathNodeIds.add(node);
        visitedNodes.add(node);
    });
    getEdgeIdsForPath(finalLoopPath).forEach((id) =>
        persistentLoopEdgeIds.add(id)
    );

    statusDiv.innerHTML = statusHTML;
    resetGraphStyles();
}

function formatPathWithIntermediates(
    pathArray,
    journeyStartNode,
    targetNodesInSegment,
    isLoopPath = false
) {
    if (!pathArray || pathArray.length === 0) return "";

    return pathArray
        .map((node, index) => {
            const nodeText = node.replace(/_/g, " ");
            const isJourneyStart =
                node === journeyStartNode && index === 0 && !isLoopPath;
            const isSegmentTarget = targetNodesInSegment.includes(node);

            if (isJourneyStart) {
                return `<span class="highlight-start">${nodeText}</span>`;
            } else if (isSegmentTarget) {
                return `<span class="highlight-target">${nodeText}</span>`;
            } else {
                return `<span class="highlight-intermediate">${nodeText}</span>`;
            }
        })
        .join(" → ");
}

async function findPathOptimal(
    startNode,
    effectiveTargetNodes,
    avoidNodesSet,
    statusDiv,
    initialStatusHTML,
    styleOptions
) {
    let statusHTML = initialStatusHTML;
    statusHTML += `Starting from: <span class="highlight-start">${startNode.replace(
        /_/g,
        " "
    )}</span><br>`;
    statusHTML += `Seeking targets: ${effectiveTargetNodes
        .map(
            (t) =>
                `<span class="highlight-target">${t.replace(/_/g, " ")}</span>`
        )
        .join(", ")}.`;
    if (avoidNodesSet.size > 0) {
        statusHTML += `<br>Avoiding: ${Array.from(avoidNodesSet)
            .map(
                (a) =>
                    `<span class="highlight-avoid">${a.replace(
                        /_/g,
                        " "
                    )}</span>`
            )
            .join(", ")}.`;
    }
    statusHTML += "<br><br>Calculating optimal paths...";
    statusDiv.innerHTML = statusHTML;
    await new Promise((resolve) => setTimeout(resolve, 10));

    const pathCache = new Map();
    const nodesForPathCalc = [startNode, ...effectiveTargetNodes];

    for (const nodeA of nodesForPathCalc) {
        for (const nodeB of nodesForPathCalc) {
            if (nodeA === nodeB) {
                pathCache.set(`${nodeA}->${nodeB}`, { path: [nodeA], cost: 0 });
                continue;
            }
            const cacheKey = `${nodeA}->${nodeB}`;
            if (!pathCache.has(cacheKey)) {
                pathCache.set(cacheKey, dijkstra(nodeA, nodeB, avoidNodesSet));
            }
        }
    }

    statusDiv.innerHTML = statusHTML;
    await new Promise((resolve) => setTimeout(resolve, 10));

    const permutations = getPermutations(effectiveTargetNodes);
    let minTotalCost = Infinity;
    let bestPermutationDetails = null;

    for (const perm of permutations) {
        let currentTotalCost = 0;
        const currentPathSegmentsArrays = [];
        let currentLoopSegmentData = null;
        let permutationPossible = true;

        const firstSegmentKey = `${startNode}->${perm[0]}`;
        const firstSegmentData = pathCache.get(firstSegmentKey);

        if (!firstSegmentData || firstSegmentData.cost === Infinity) {
            permutationPossible = false;
        } else {
            currentTotalCost += firstSegmentData.cost;
            if (firstSegmentData.path.length > 0)
                currentPathSegmentsArrays.push(firstSegmentData.path);
        }

        if (permutationPossible) {
            for (let i = 0; i < perm.length - 1; i++) {
                const source = perm[i];
                const dest = perm[i + 1];
                const segmentKey = `${source}->${dest}`;
                const segmentData = pathCache.get(segmentKey);

                if (!segmentData || segmentData.cost === Infinity) {
                    permutationPossible = false;
                    break;
                }
                currentTotalCost += segmentData.cost;
                if (segmentData.path.length > 0)
                    currentPathSegmentsArrays.push(segmentData.path);
            }
        }

        if (permutationPossible) {
            const loopStartTarget = perm[perm.length - 1];
            const loopEndTarget = perm[0];

            if (loopStartTarget === loopEndTarget) {
                const roundTripData = findShortestRoundTripFromNode(
                    loopStartTarget,
                    avoidNodesSet
                );
                if (
                    roundTripData.cost === Infinity ||
                    roundTripData.path.length === 0
                ) {
                    permutationPossible = false;
                } else {
                    currentTotalCost += roundTripData.cost;
                    currentLoopSegmentData = roundTripData;
                }
            } else {
                const loopKey = `${loopStartTarget}->${loopEndTarget}`;
                const loopData = pathCache.get(loopKey);
                if (
                    !loopData ||
                    loopData.cost === Infinity ||
                    loopData.path.length === 0
                ) {
                    permutationPossible = false;
                } else {
                    currentTotalCost += loopData.cost;
                    currentLoopSegmentData = loopData;
                }
            }
        }

        if (permutationPossible && currentTotalCost < minTotalCost) {
            minTotalCost = currentTotalCost;
            bestPermutationDetails = {
                permutation: perm,
                segments: currentPathSegmentsArrays,
                loopSegment: currentLoopSegmentData,
                totalCost: minTotalCost,
            };
        }
    }

    statusHTML = initialStatusHTML;
    statusHTML += `Starting from: <span class="highlight-start">${startNode.replace(
        /_/g,
        " "
    )}</span><br>`;
    statusHTML += `Seeking targets: ${effectiveTargetNodes
        .map(
            (t) =>
                `<span class="highlight-target">${t.replace(/_/g, " ")}</span>`
        )
        .join(", ")}.`;
    if (avoidNodesSet.size > 0) {
        statusHTML += `<br>Avoiding: ${Array.from(avoidNodesSet)
            .map(
                (a) =>
                    `<span class="highlight-avoid">${a.replace(
                        /_/g,
                        " "
                    )}</span>`
            )
            .join(", ")}.`;
    }
    statusHTML += "<br><br>";

    if (!bestPermutationDetails) {
        statusHTML += `No complete path visiting all targets and looping back could be found.`;
    } else {
        bestPermutationDetails.segments.forEach((seg) => {
            seg.forEach((node) => {
                persistentPathNodeIds.add(node);
                visitedNodes.add(node);
            });
            getEdgeIdsForPath(seg).forEach((id) =>
                persistentPathEdgeIds.add(id)
            );
        });
        if (
            bestPermutationDetails.loopSegment &&
            bestPermutationDetails.loopSegment.path
        ) {
            bestPermutationDetails.loopSegment.path.forEach((node) => {
                persistentPathNodeIds.add(node);
                visitedNodes.add(node);
            });
            getEdgeIdsForPath(bestPermutationDetails.loopSegment.path).forEach(
                (id) => persistentLoopEdgeIds.add(id)
            );
        }

        const pathCostWithoutLoop =
            bestPermutationDetails.totalCost -
            (bestPermutationDetails.loopSegment
                ? bestPermutationDetails.loopSegment.cost
                : 0);

        let fullOptimalPathDisplay = "";
        let lastNodeOfPreviousSegment = null;
        bestPermutationDetails.segments.forEach((segmentPath, index) => {
            let displaySegment = segmentPath;
            if (
                index > 0 &&
                segmentPath.length > 0 &&
                segmentPath[0] === lastNodeOfPreviousSegment
            ) {
                displaySegment = segmentPath.slice(1);
            }
            if (displaySegment.length > 0) {
                if (fullOptimalPathDisplay !== "")
                    fullOptimalPathDisplay += " → ";
                fullOptimalPathDisplay += formatPathWithIntermediates(
                    displaySegment,
                    startNode,
                    bestPermutationDetails.permutation
                );
            }
            if (segmentPath.length > 0)
                lastNodeOfPreviousSegment = segmentPath[segmentPath.length - 1];
        });

        statusHTML += `<b>Optimal Path:<br></b>${fullOptimalPathDisplay}<br>`;
        statusHTML += `<b>Cost:</b> ${pathCostWithoutLoop}<br><br>`;

        let loopPathDisplay = "N/A";
        let loopCostDisplay = "0";
        if (
            bestPermutationDetails.loopSegment &&
            bestPermutationDetails.loopSegment.path.length > 0 &&
            bestPermutationDetails.loopSegment.cost !== Infinity
        ) {
            loopCostDisplay = String(bestPermutationDetails.loopSegment.cost);
            const loopTargetsContext = [
                bestPermutationDetails.permutation[0],
                bestPermutationDetails.permutation[
                    bestPermutationDetails.permutation.length - 1
                ],
            ];

            loopPathDisplay = formatPathWithIntermediates(
                bestPermutationDetails.loopSegment.path,
                startNode,
                loopTargetsContext,
                true
            );
        }

        statusHTML += `<b>Optimal Loop Path:<br></b>${loopPathDisplay}<br>`;
        statusHTML += `<b>Loop Cost:</b> ${loopCostDisplay}<br><br>`;
        statusHTML += `<b>Total Optimal Cost:</b> ${bestPermutationDetails.totalCost}<br>`;

        await animatePath(
            bestPermutationDetails.segments,
            NODE_STYLES.PATH_ANIMATION,
            {
                startNode: startNode,
                targetNodes: styleOptions.allTargetNodes,
                pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
            }
        );
        if (
            bestPermutationDetails.loopSegment &&
            bestPermutationDetails.loopSegment.path.length > 0 &&
            bestPermutationDetails.loopSegment.cost !== Infinity
        ) {
            if (
                !(
                    bestPermutationDetails.loopSegment.path.length === 1 &&
                    bestPermutationDetails.loopSegment.cost === 0
                )
            ) {
                await animatePath(
                    [bestPermutationDetails.loopSegment.path],
                    NODE_STYLES.LOOP_ANIMATION,
                    {
                        isLoop: true,
                        baseDelay: 300,
                        startNode: startNode,
                        targetNodes: styleOptions.allTargetNodes,
                        pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
                    }
                );
            }
        }
    }
    statusDiv.innerHTML = statusHTML;
    resetGraphStyles();
}

document.getElementById("findPathBtn").addEventListener("click", async () => {
    persistentPathNodeIds.clear();
    persistentPathEdgeIds.clear();
    persistentLoopEdgeIds.clear();
    visitedNodes.clear();
    resetGraphStyles();

    const statusDiv = document.getElementById("status");
    statusDiv.innerHTML = "Processing...";
    let statusHTML = "";

    const startNode = startBiomeSelect.value;
    const targetNodesInput = Array.from(selectedTargetBiomes);
    const avoidNodesSet = new Set(selectedAvoidBiomes);

    const pokemonSpawnNodes = new Set();
    if (selectedPokemon.size > 0) {
        selectedPokemon.forEach((pokemonName) => {
            const spawns = allPokemonData[pokemonName] || [];
            spawns.forEach((spawnInfo) => pokemonSpawnNodes.add(spawnInfo[0]));
        });
    }

    const styleOptions = {
        allTargetNodes: selectedTargetBiomes,
        pokemonSpawnNodes: pokemonSpawnNodes,
    };

    if (!startNode) {
        statusDiv.textContent = "Please select a start biome.";
        return;
    }

    if (avoidNodesSet.has(startNode)) {
        statusDiv.innerHTML = `Error: Start node '${startNode.replace(
            /_/g,
            " "
        )}' cannot be in the avoid list. Please change start node or remove from avoid list.`;
        return;
    }

    const isOnlyStartNodeTarget =
        targetNodesInput.length === 0 ||
        (targetNodesInput.length === 1 && targetNodesInput[0] === startNode);

    if (isOnlyStartNodeTarget) {
        let actionDescription =
            targetNodesInput.length === 0
                ? `No targets selected. Assuming mandatory round trip from Start Node: <span class="highlight-start">${startNode.replace(
                      /_/g,
                      " "
                  )}</span>.`
                : `Start Node <span class="highlight-start">${startNode.replace(
                      /_/g,
                      " "
                  )}</span> is the only target. Finding a mandatory round trip.`;
        statusHTML = actionDescription + "<br>";

        if (avoidNodesSet.size > 0) {
            statusHTML += `Avoiding: ${Array.from(avoidNodesSet)
                .map(
                    (a) =>
                        `<span class="highlight-avoid">${a.replace(
                            /_/g,
                            " "
                        )}</span>`
                )
                .join(", ")}.<br>`;
        }
        statusDiv.innerHTML = statusHTML;
        await new Promise((resolve) => setTimeout(resolve, 10));

        const roundTripData = findShortestRoundTripFromNode(
            startNode,
            avoidNodesSet
        );

        if (roundTripData.cost !== Infinity && roundTripData.path.length > 0) {
            roundTripData.path.forEach((node) => {
                persistentPathNodeIds.add(node);
                visitedNodes.add(node);
            });
            getEdgeIdsForPath(roundTripData.path).forEach((id) =>
                persistentLoopEdgeIds.add(id)
            );

            statusHTML += `<br><b>Mandatory Round Trip:</b> ${formatPathWithIntermediates(
                roundTripData.path,
                startNode,
                [startNode],
                true
            )}<br>`;
            statusHTML += `<b>Cost:</b> ${roundTripData.cost}`;
            statusDiv.innerHTML = statusHTML;
            await animatePath(
                [roundTripData.path],
                NODE_STYLES.LOOP_ANIMATION,
                {
                    isLoop: true,
                    baseDelay: 300,
                    startNode: startNode,
                    targetNodes: styleOptions.allTargetNodes,
                    pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
                }
            );
        } else {
            statusHTML += `<br>Cannot find a mandatory round trip from <span style="font-weight: bold;">${startNode.replace(
                /_/g,
                " "
            )}</span> via another node.`;
            statusDiv.innerHTML = statusHTML;
        }
        resetGraphStyles();
        return;
    }

    if (targetNodesInput.length === 0) {
        statusDiv.textContent = "Please select at least one target biome.";
        return;
    }

    const effectiveTargetNodes = targetNodesInput.filter(
        (tn) => !avoidNodesSet.has(tn) && tn !== startNode
    );

    if (effectiveTargetNodes.length !== targetNodesInput.length) {
        const removedCount =
            targetNodesInput.length - effectiveTargetNodes.length;
        const autoRemovedReason = targetNodesInput.some(
            (tn) => tn === startNode
        )
            ? " (start node cannot be a distinct target)"
            : targetNodesInput.some((tn) => avoidNodesSet.has(tn))
            ? " (in avoid list)"
            : "";
        statusHTML += `Warning: ${removedCount} target(s) were invalid${autoRemovedReason} and have been excluded.<br>`;
    }

    if (effectiveTargetNodes.length === 0) {
        statusHTML += `Error: No valid targets to route to after filtering. Ensure targets are not the start node or in the avoid list.`;
        statusDiv.innerHTML = statusHTML;
        return;
    }

    const MAX_TARGETS_FOR_OPTIMAL = 8;

    if (effectiveTargetNodes.length > MAX_TARGETS_FOR_OPTIMAL) {
        statusHTML += `Number of targets (${effectiveTargetNodes.length}) exceeds ${MAX_TARGETS_FOR_OPTIMAL}. Using a greedy heuristic (may not be the absolute shortest path).<br>`;
        await findPathGreedy(
            startNode,
            effectiveTargetNodes,
            avoidNodesSet,
            statusDiv,
            statusHTML,
            styleOptions
        );
    } else {
        await findPathOptimal(
            startNode,
            effectiveTargetNodes,
            avoidNodesSet,
            statusDiv,
            statusHTML,
            styleOptions
        );
    }
});

function populatePokemonList() {
    pokemonListContainer.innerHTML = "";
    const pokemonNames = Object.keys(allPokemonData).sort();

    pokemonNames.forEach((pokemonName) => {
        const item = document.createElement("div");
        const itemText = pokemonName.replace(/_/g, " ");
        item.classList.add("multi-select-item");
        item.textContent = itemText;
        item.dataset.pokemonName = pokemonName;
        item.dataset.value = pokemonName;
        item.dataset.originalText = itemText;

        if (selectedPokemon.has(pokemonName)) {
            item.classList.add("selected");
        }

        item.addEventListener("click", () => {
            if (selectedPokemon.has(pokemonName)) {
                selectedPokemon.delete(pokemonName);
                item.classList.remove("selected");
            } else {
                selectedPokemon.add(pokemonName);
                item.classList.add("selected");
            }
            updateSelectedIndicator(
                selectedPokemon,
                selectedPokemonIndicator,
                "pokemonListContainer"
            );
            updateAllNodeStyles();
            nodes.update(
                nodes.get().map((node) => ({
                    id: node.id,
                    title: createTooltipElement(node.id),
                }))
            );
        });
        pokemonListContainer.appendChild(item);
    });
}

function handleSearch(searchInput, container) {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const items = container.getElementsByClassName("multi-select-item");

    for (const item of items) {
        const originalText = item.dataset.originalText;
        if (!originalText) continue;

        const originalTextLower = originalText.toLowerCase();

        if (searchTerm === "") {
            item.style.display = "";
            item.innerHTML = originalText;
            continue;
        }

        const index = originalTextLower.indexOf(searchTerm);
        if (index > -1) {
            item.style.display = "";
            const matchEndIndex = index + searchTerm.length;
            const highlightedHTML =
                originalText.substring(0, index) +
                "<b>" +
                originalText.substring(index, matchEndIndex) +
                "</b>" +
                originalText.substring(matchEndIndex);
            item.innerHTML = highlightedHTML;
        } else {
            item.style.display = "none";
        }
    }
}

let pokemonModal, modalCloseBtn, modalBiomeName, modalPokemonList;

function initializeModal() {
    pokemonModal = document.getElementById("pokemon-modal");
    modalCloseBtn = document.querySelector(".modal-close-btn");
    modalBiomeName = document.getElementById("modal-biome-name");
    modalPokemonList = document.getElementById("modal-pokemon-list-container");

    modalCloseBtn.onclick = () => {
        pokemonModal.style.display = "none";
    };

    window.onclick = (event) => {
        if (event.target == pokemonModal) {
            pokemonModal.style.display = "none";
        }
    };
}

function populateAndShowPokemonModal(biomeId) {
    const spawns = biomePokemonSpawns.get(biomeId) || [];
    modalBiomeName.textContent = `${biomeId.replace(/_/g, " ")} Spawns`;
    modalPokemonList.innerHTML = "";

    if (spawns.length === 0) {
        modalPokemonList.textContent = "No known Pokémon spawns in this biome.";
    } else {
        const listElement = createPokemonListElement(spawns, "modal");
        modalPokemonList.appendChild(listElement);
    }

    pokemonModal.style.display = "block";
}

const themeToggleBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-theme", isDark);
    themeToggleBtn.textContent = isDark ? "☀️" : "🌙";

    if (network) {
        // This function handles all node and edge style updates correctly
        // according to the new theme and any persistent path styles.
        resetGraphStyles();
    }
}

function toggleTheme() {
    const currentThemeIsDark = document.body.classList.contains("dark-theme");
    const newTheme = currentThemeIsDark ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
}

async function initializeApp() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);
    themeToggleBtn.addEventListener("click", toggleTheme);

    try {
        const response = await fetch("pokemon_spawn.json");
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        allPokemonData = await response.json();

        for (const pokemonName in allPokemonData) {
            const spawns = allPokemonData[pokemonName];
            spawns.forEach((spawnInfo) => {
                const [biome, rarity, time] = spawnInfo;
                if (!biomePokemonSpawns.has(biome)) {
                    biomePokemonSpawns.set(biome, []);
                }
                biomePokemonSpawns
                    .get(biome)
                    .push({ pokemonName, rarity, time });
            });
        }

        populatePokemonList();

        const targetBiomeSearchInput =
            document.getElementById("targetBiomeSearch");
        const targetBiomesContainer = document.getElementById(
            "targetBiomesContainer"
        );
        const avoidBiomeSearchInput =
            document.getElementById("avoidBiomeSearch");
        const avoidBiomesContainer = document.getElementById(
            "avoidBiomesContainer"
        );

        pokemonSearchInput.addEventListener("input", () =>
            handleSearch(pokemonSearchInput, pokemonListContainer)
        );
        targetBiomeSearchInput.addEventListener("input", () =>
            handleSearch(targetBiomeSearchInput, targetBiomesContainer)
        );
        avoidBiomeSearchInput.addEventListener("input", () =>
            handleSearch(avoidBiomeSearchInput, avoidBiomesContainer)
        );

        updateSelectedIndicator(
            selectedPokemon,
            selectedPokemonIndicator,
            "pokemonListContainer"
        );

        initializeModal();
        initializeGraph();
    } catch (error) {
        console.error("Could not load Pokémon data:", error);
        pokemonListContainer.innerHTML = "Error loading Pokémon list.";
        document.getElementById("graph-container").innerHTML =
            "Error loading graph, Pokémon data is required.";
    }
}

initializeApp();
