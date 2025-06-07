import { biomeNamesSorted, allBiomes } from "./data.js";
import {
    selectedTargetBiomes,
    selectedAvoidBiomes,
    selectedPokemon,
    startBiomeSelect,
    allPokemonData,
    biomePokemonSpawns,
    nodes,
    updateAllNodeStyles,
    networkHolder,
} from "./main.js";

export const rarityOrder = [
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

export const TIME_ICONS = {
    DAWN: "🌅",
    DAY: "☀️",
    DUSK: "🌇",
    NIGHT: "🌙",
    ALL: "🌍",
};

export function createMultiSelectItems(
    containerId,
    selectedSet,
    indicatorId,
    options = {},
    isTarget = false
) {
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
                if (
                    isTarget &&
                    options.pokemonBiomes?.has(biomeValue) &&
                    options.includePokemonInTarget?.checked
                ) {
                    return;
                }
                selectedSet.delete(biomeValue);
                item.classList.remove("selected");
                if (isTarget) {
                    item.classList.remove("user-selected");
                }
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
                if (isTarget) {
                    item.classList.add("user-selected");
                }
            }
            updateSelectedIndicator(
                selectedSet,
                indicator,
                containerId,
                options
            );
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
                        if (tItem.dataset.value === biomeValue) {
                            tItem.classList.remove("selected");
                            tItem.classList.remove("user-selected");
                        }
                    });
                updateSelectedIndicator(
                    selectedTargetBiomes,
                    document.getElementById("selectedTargetsIndicator"),
                    "targetBiomesContainer",
                    options
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
    updateSelectedIndicator(selectedSet, indicator, containerId, options);
}

export function updateSelectedIndicator(
    selectedSet,
    indicatorElement,
    listContainerId,
    options = {}
) {
    if (!indicatorElement) return;

    const { pokemonBiomes, includePokemonInTarget, onPokemonChange } = options;
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

            const isPokemonTarget =
                pokemonBiomes &&
                pokemonBiomes.has(itemName) &&
                includePokemonInTarget &&
                includePokemonInTarget.checked;
            if (isPokemonTarget) {
                button.classList.add("pokemon-target");
            }

            button.innerHTML = `<span>${itemName.replace(
                /_/g,
                " "
            )}</span><span class="deselect-x">×</span>`;

            button.addEventListener("click", () => {
                if (isPokemonTarget) return;

                selectedSet.delete(itemName);

                const mainListContainer =
                    document.getElementById(listContainerId);
                if (mainListContainer) {
                    const itemInList = mainListContainer.querySelector(
                        `.multi-select-item[data-value="${itemName}"]`
                    );
                    if (itemInList) {
                        itemInList.classList.remove("selected");
                        if (listContainerId === "targetBiomesContainer") {
                            itemInList.classList.remove("user-selected");
                        }
                    }
                }

                updateAllNodeStyles();

                if (listContainerId === "pokemonListContainer") {
                    if (onPokemonChange) {
                        onPokemonChange();
                    }
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
                    listContainerId,
                    options
                );
            });

            indicatorElement.appendChild(button);
        });
}

export function sortSpawns(a, b) {
    const rarityAIndex = rarityOrder.indexOf(a.rarity);
    const rarityBIndex = rarityOrder.indexOf(b.rarity);

    if (rarityAIndex !== rarityBIndex) {
        return rarityAIndex - rarityBIndex;
    }

    return a.pokemonName.localeCompare(b.pokemonName);
}

export function createPokemonListElement(spawns, listType) {
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

export function populatePokemonList() {
    const pokemonListContainer = document.getElementById(
        "pokemonListContainer"
    );
    const selectedPokemonIndicator = document.getElementById(
        "selectedPokemonIndicator"
    );
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

        pokemonListContainer.appendChild(item);
    });
}

export function handleSearch(searchInput, container) {
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

export function initializeModal() {
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

export function populateAndShowPokemonModal(biomeId) {
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

export function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-theme", isDark);
    themeToggleBtn.textContent = isDark ? "☀️" : "🌙";

    if (networkHolder.network) {
        resetGraphStyles();
    }
}

export function toggleTheme() {
    const currentThemeIsDark = document.body.classList.contains("dark-theme");
    const newTheme = currentThemeIsDark ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
}
export function createTooltipElement(biomeId) {
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
