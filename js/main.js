import { BiomeId, biomeNamesSorted, graph } from "./data.js";
import {
    createMultiSelectItems,
    updateSelectedIndicator,
    populatePokemonList,
    handleSearch,
    initializeModal,
    applyTheme,
    toggleTheme
} from "./ui.js";
import { initializeGraph, resetGraphStyles } from "./graph.js";
import { findPath } from "./pathfinding.js";

export const startBiomeSelect = document.getElementById("startBiome");
export const selectedTargetBiomes = new Set();
export const selectedAvoidBiomes = new Set();
export const selectedPokemon = new Set();
export let persistentPathNodeIds = new Set();
export let persistentPathEdgeIds = new Set();
export let persistentLoopEdgeIds = new Set();
export let visitedNodes = new Set();
export let allPokemonData = {};
export let biomePokemonSpawns = new Map();
export const networkHolder = { network: null };
export let nodes = new vis.DataSet();
export const edges = new vis.DataSet();

export const NODE_STYLES = {
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
    POKEMON_SPAWN_HIGHLIGHT: { border: "#FFD700", borderWidth: 4 },
    PATH_ANIMATION: { background: "#79B6FF", border: "black", borderWidth: 3 },
    LOOP_ANIMATION: { background: "#97C2FC", border: "black", borderWidth: 3 },
};

export function updateAllNodeStyles() {
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


function initializeEventListeners() {
    const pokemonSearchInput = document.getElementById("pokemonSearch");
    const pokemonListContainer = document.getElementById("pokemonListContainer");
    const selectedPokemonIndicator = document.getElementById(
        "selectedPokemonIndicator"
    );
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
    const findPathBtn = document.getElementById("findPathBtn");
    const themeToggleBtn = document.getElementById("theme-toggle");

    let previousStartNode = startBiomeSelect.value;

    biomeNamesSorted.forEach((biome) => {
        const option = new Option(biome.replace(/_/g, " "), biome);
        startBiomeSelect.add(option);
    });
    startBiomeSelect.value = BiomeId.TOWN;

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

    findPathBtn.addEventListener("click", async () => {
        persistentPathNodeIds.clear();
        persistentPathEdgeIds.clear();
        persistentLoopEdgeIds.clear();
        visitedNodes.clear();
        resetGraphStyles();

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

        await findPath(startNode, targetNodesInput, avoidNodesSet, pokemonSpawnNodes, selectedTargetBiomes);
    });

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

    themeToggleBtn.addEventListener("click", () => {
        toggleTheme();
        resetGraphStyles();
    });
}

async function initializeApp() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    applyTheme(savedTheme);

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
        initializeEventListeners();
        initializeModal();
        initializeGraph();
        resetGraphStyles();
    } catch (error) {
        console.error("Could not load Pokémon data:", error);
        document.getElementById("pokemonListContainer").innerHTML = "Error loading Pokémon list.";
        document.getElementById("graph-container").innerHTML =
            "Error loading graph, Pokémon data is required.";
    }
}

initializeApp();