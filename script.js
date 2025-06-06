const BiomeId = {
    TOWN: "TOWN", PLAINS: "PLAINS", GRASS: "GRASS", METROPOLIS: "METROPOLIS",
    LAKE: "LAKE", TALL_GRASS: "TALL_GRASS", FOREST: "FOREST", CAVE: "CAVE",
    SLUM: "SLUM", CONSTRUCTION_SITE: "CONSTRUCTION_SITE", SWAMP: "SWAMP",
    JUNGLE: "JUNGLE", MEADOW: "MEADOW", SEA: "SEA", SEABED: "SEABED",
    ICE_CAVE: "ICE_CAVE", GRAVEYARD: "GRAVEYARD", BEACH: "BEACH",
    ISLAND: "ISLAND", VOLCANO: "VOLCANO", MOUNTAIN: "MOUNTAIN",
    WASTELAND: "WASTELAND", SPACE: "SPACE", BADLANDS: "BADLANDS",
    LABORATORY: "LABORATORY", DESERT: "DESERT", RUINS: "RUINS",
    SNOWY_FOREST: "SNOWY_FOREST", POWER_PLANT: "POWER_PLANT",
    FACTORY: "FACTORY", ABYSS: "ABYSS", DOJO: "DOJO", TEMPLE: "TEMPLE",
    FAIRY_CAVE: "FAIRY_CAVE"
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

const graph = new Map();
const allBiomes = new Set(Object.values(BiomeId));

Object.keys(BiomeId).forEach(idKey => {
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

    destinations.forEach(destEntry => {
        let targetBiome;
        let weight = 1;

        if (Array.isArray(destEntry)) {
            targetBiome = destEntry[0];
        } else {
            targetBiome = destEntry;
        }

        if (allBiomes.has(targetBiome)) {
            graph.get(sourceBiome).push({ to: targetBiome, weight: weight });
        } else {
            console.warn(`Unknown biome referenced: ${targetBiome} from ${sourceBiome}`);
        }
    });
}

const biomeNamesSorted = Array.from(allBiomes).sort();

const startBiomeSelect = document.getElementById('startBiome');
biomeNamesSorted.forEach(biome => {
    const option = new Option(biome.replace(/_/g, ' '), biome);
    startBiomeSelect.add(option);
});
startBiomeSelect.value = BiomeId.TOWN;
let previousStartNode = startBiomeSelect.value;


const selectedTargetBiomes = new Set();
const selectedAvoidBiomes = new Set();

const NODE_STYLES = {
    DEFAULT: { background: '#97C2FC', border: '#666666', fontColor: 'black', fontSize: 12, bold: false, borderWidth: 1.5 },
    START: { background: '#00FFFF', border: '#008B8B', fontColor: 'black', fontSize: 14, bold: true, borderWidth: 2.5 },
    TARGET: { background: '#FF00FF', border: '#8B008B', fontColor: 'white', fontSize: 14, bold: true, borderWidth: 2.5 },
    AVOID: { background: '#e0e0e0', border: '#757575', fontColor: '#757575', fontSize: 10, bold: false, borderWidth: 1.5 },
    PATH_ANIMATION: { background: '#79B6FF', border: 'black', borderWidth: 3 },
    LOOP_ANIMATION: { background: '#ed3545', border: 'black', borderWidth: 3 },
    INTERMEDIATE_NODE_TEXT: { color: 'black', fontWeight: 'normal' }
};

function applyNodeStyle(nodeId, style) {
    if (nodes.get(nodeId)) {
        nodes.update({
            id: nodeId,
            color: { background: style.background, border: style.border },
            font: { color: style.fontColor, size: style.fontSize, bold: style.bold },
            borderWidth: style.borderWidth
        });
    }
}

function getNodeStyleDefinition(nodeId) {
    const isStart = nodeId === startBiomeSelect.value;
    const isTarget = selectedTargetBiomes.has(nodeId);
    const isAvoid = selectedAvoidBiomes.has(nodeId);

    if (isStart) return NODE_STYLES.START;
    if (isAvoid) return NODE_STYLES.AVOID;
    if (isTarget) return NODE_STYLES.TARGET;
    return NODE_STYLES.DEFAULT;
}

function updateNodeAppearance(nodeId) {
    const style = getNodeStyleDefinition(nodeId);
    applyNodeStyle(nodeId, style);
}

function createMultiSelectItems(containerId, selectedSet, indicatorId) {
    const container = document.getElementById(containerId);
    const indicator = document.getElementById(indicatorId);
    container.innerHTML = '';

    biomeNamesSorted.forEach(biome => {
        const item = document.createElement('div');
        item.classList.add('multi-select-item');
        item.textContent = biome.replace(/_/g, ' ');
        item.dataset.value = biome;

        if (selectedSet.has(biome)) {
            item.classList.add('selected');
        }

        item.addEventListener('click', () => {
            const biomeValue = item.dataset.value;
            if (selectedSet.has(biomeValue)) {
                selectedSet.delete(biomeValue);
                item.classList.remove('selected');
            } else {
                if (containerId === 'avoidBiomesContainer' && biomeValue === startBiomeSelect.value) {
                    alert("Start biome cannot be in the 'Avoid Biomes' list.");
                    return;
                }
                selectedSet.add(biomeValue);
                item.classList.add('selected');
            }
            updateSelectedIndicator(selectedSet, indicator);
            updateNodeAppearance(biomeValue);

            if (containerId === 'avoidBiomesContainer' && selectedTargetBiomes.has(biomeValue)) {
                selectedTargetBiomes.delete(biomeValue);
                const targetItems = document.querySelectorAll('#targetBiomesContainer .multi-select-item');
                targetItems.forEach(tItem => {
                    if (tItem.dataset.value === biomeValue) tItem.classList.remove('selected');
                });
                updateSelectedIndicator(selectedTargetBiomes, document.getElementById('selectedTargetsIndicator'));
                updateNodeAppearance(biomeValue);
            }
            if (containerId === 'targetBiomesContainer' && selectedAvoidBiomes.has(biomeValue)) {
                selectedAvoidBiomes.delete(biomeValue);
                const avoidItems = document.querySelectorAll('#avoidBiomesContainer .multi-select-item');
                avoidItems.forEach(aItem => {
                    if (aItem.dataset.value === biomeValue) aItem.classList.remove('selected');
                });
                updateSelectedIndicator(selectedAvoidBiomes, document.getElementById('selectedAvoidIndicator'));
                updateNodeAppearance(biomeValue);
            }
        });
        container.appendChild(item);
    });
    updateSelectedIndicator(selectedSet, indicator);
}


function updateSelectedIndicator(selectedSet, indicatorElement) {
    if (selectedSet.size === 0) {
        indicatorElement.textContent = "Nothing selected";
    } else {
        indicatorElement.innerHTML = '';
        Array.from(selectedSet).sort().forEach(biome => {
            const span = document.createElement('span');
            span.textContent = biome.replace(/_/g, ' ');
            indicatorElement.appendChild(span);
        });
    }
}

createMultiSelectItems('targetBiomesContainer', selectedTargetBiomes, 'selectedTargetsIndicator');
createMultiSelectItems('avoidBiomesContainer', selectedAvoidBiomes, 'selectedAvoidIndicator');

startBiomeSelect.addEventListener('change', (event) => {
    const newStartNode = event.target.value;

    if (selectedAvoidBiomes.has(newStartNode)) {
        selectedAvoidBiomes.delete(newStartNode);
        const avoidItems = document.querySelectorAll('#avoidBiomesContainer .multi-select-item');
        avoidItems.forEach(aItem => {
            if (aItem.dataset.value === newStartNode) aItem.classList.remove('selected');
        });
        updateSelectedIndicator(selectedAvoidBiomes, document.getElementById('selectedAvoidIndicator'));
    }

    if (previousStartNode && previousStartNode !== newStartNode) {
        updateNodeAppearance(previousStartNode);
    }
    updateNodeAppearance(newStartNode);

    previousStartNode = newStartNode;
});


function dijkstra(startNode, endNode, avoidNodes = new Set()) {
    const distances = new Map();
    const prevNodes = new Map();
    const pq = new Set();

    allBiomes.forEach(biome => {
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
        for(const item of pq) if(item[1] === u && item[0] === minDist) toRemoveFromPq = item;
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
                for(const item of pq) if(item[1] === v) vToRemoveFromPq = item;
                if(vToRemoveFromPq) pq.delete(vToRemoveFromPq);

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
    if (cost === Infinity || path.length === 0 || (path.length === 1 && startNode !== endNode) || (path.length > 0 && path[0] !== startNode)) {
        return { path: [], cost: Infinity };
    }
    return { path: path, cost: cost };
}

let network = null;
const nodes = new vis.DataSet(biomeNamesSorted.map(name => {
    const defaultStyle = NODE_STYLES.DEFAULT;
    return {
        id: name,
        label: name.replace(/_/g, ' '),
        color: { background: defaultStyle.background, border: defaultStyle.border },
        font: { color: defaultStyle.fontColor, size: defaultStyle.fontSize, bold: defaultStyle.bold },
        borderWidth: defaultStyle.borderWidth
    };
}));

const edges = new vis.DataSet();
graph.forEach((connections, source) => {
    connections.forEach(conn => {
        edges.add({
            id: `${source}_${conn.to}_w${conn.weight}_${Math.random().toString(36).substr(2, 9)}`,
            from: source,
            to: conn.to,
            label: conn.weight > 1 ? String(conn.weight) : undefined,
            arrows: 'to',
            color: { color: '#cccccc', highlight:'#ababab' },
            font: { align: 'top', size: 9, color: '#777777'}
        });
    });
});

const graphContainer = document.getElementById('graph-container');
const data = { nodes: nodes, edges: edges };

const options = {
    layout: { randomSeed: 10 },
    edges: {
        smooth: { type: 'continuous', forceDirection: 'none', roundness: 0.2 },
        font: {
            size: 10,
            align: 'middle'
        },
        selfReference: {
          size: 20,
          angle: Math.PI / 4
        }
    },
    physics: {
        enabled: true,
        barnesHut: {
            gravitationalConstant: -25000, centralGravity: 0.25,
            springLength: 180, springConstant: 0.05,
            damping: 0.09, avoidOverlap: 0.6
        },
        stabilization: {
            enabled: true, iterations: 1000, updateInterval: 25,
            onlyDynamicEdges: false, fit: true
        },
        minVelocity: 0.75
    },
    interaction: {
        tooltipDelay: 200, hideEdgesOnDrag: true,
        dragNodes: true, zoomView: true, dragView: true
    },
    nodes: {
        shape: 'box', margin: 10,
        font: { face: 'Arial' },
        borderWidth: 1.5
    }
};
network = new vis.Network(graphContainer, data, options);

network.on("stabilizationIterationsDone", function () {
    network.setOptions( { physics: { enabled: false } } );
});

biomeNamesSorted.forEach(biomeId => {
    updateNodeAppearance(biomeId);
});


function resetGraphStyles() {
    nodes.getIds().forEach(nodeId => {
        updateNodeAppearance(nodeId);
    });
    edges.getIds().forEach(edgeId => {
        const edge = edges.get(edgeId);
        edges.update({
            id: edgeId,
            color: { color: '#cccccc', highlight:'#ababab' },
            width: 1,
            dashes: false,
        });
    });
}

async function animatePath(pathSegments, animationStyle, isLoop = false, baseDelay = 250) {
    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        if (!segment || segment.length === 0) continue;

        if (segment.length === 1) {
            applyNodeStyle(segment[0], animationStyle);
            await new Promise(resolve => setTimeout(resolve, baseDelay / 2));
            continue;
        }

        for (let j = 0; j < segment.length - 1; j++) {
            const u = segment[j];
            const v = segment[j+1];

            applyNodeStyle(u, animationStyle);
            await new Promise(resolve => setTimeout(resolve, baseDelay / 2));

            const edgeToUpdate = edges.get({
                filter: item => (item.from === u && item.to === v)
            });

            if (edgeToUpdate.length > 0) {
                edgeToUpdate.forEach(edge => {
                    edges.update({
                        id: edge.id,
                        color: { color: animationStyle.background, highlight: animationStyle.background },
                        width: 3.5,
                        dashes: isLoop ? [5,5] : false,
                    });
                });
            }
            await new Promise(resolve => setTimeout(resolve, baseDelay / 2));
        }
        applyNodeStyle(segment[segment.length-1], animationStyle);
    }
}

function getPermutations(array) {
    if (array.length === 0) return [[]];
    if (array.length === 1) return [[array[0]]];

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

function findShortestRoundTripFromNode(node, avoidNodesSet) {
    let minLoopCost = Infinity;
    let bestLoopPath = [];

    const potentialIntermediates = Array.from(allBiomes).filter(
        b => b !== node && !avoidNodesSet.has(b)
    );

    if (potentialIntermediates.length === 0) {
        return { path: [], cost: Infinity };
    }

    for (const intermediate of potentialIntermediates) {
        const pathToIntermediate = dijkstra(node, intermediate, avoidNodesSet);
        if (pathToIntermediate.cost === Infinity || !pathToIntermediate.path || pathToIntermediate.path.length === 0) {
            continue;
        }

        const pathFromIntermediate = dijkstra(intermediate, node, avoidNodesSet);
        if (pathFromIntermediate.cost === Infinity || !pathFromIntermediate.path || pathFromIntermediate.path.length === 0) {
            continue;
        }
        
        if (pathToIntermediate.path.length < 2 && pathToIntermediate.cost === 0 && node === intermediate) continue;
        if (pathFromIntermediate.path.length < 2 && pathFromIntermediate.cost === 0 && node === intermediate) continue;


        const currentLoopCost = pathToIntermediate.cost + pathFromIntermediate.cost;

        if (currentLoopCost < minLoopCost) {
            minLoopCost = currentLoopCost;
            if (pathFromIntermediate.path.length > 0 && pathFromIntermediate.path[0] === intermediate) {
                 bestLoopPath = [...pathToIntermediate.path, ...pathFromIntermediate.path.slice(1)];
            } else {
                 bestLoopPath = [...pathToIntermediate.path, ...pathFromIntermediate.path];
            }
            if (bestLoopPath.length < 2 && minLoopCost > 0) {
                minLoopCost = Infinity;
                bestLoopPath = [];
            }
        }
    }
    if (minLoopCost === Infinity || bestLoopPath.length < 2 || (bestLoopPath.length === 2 && bestLoopPath[0] !== bestLoopPath[1] && minLoopCost === 0 ) ) {
        if (bestLoopPath.length < 2) return { path: [], cost: Infinity };
    }


    return { path: bestLoopPath, cost: minLoopCost };
}


async function findPathGreedy(startNode, effectiveTargetNodes, avoidNodesSet, statusDiv, initialStatusHTML) {
    let statusHTML = initialStatusHTML;
    statusHTML += `Starting from <span style="color: ${NODE_STYLES.START.background}; font-weight: bold;">${startNode.replace(/_/g, ' ')}</span>.<br>Seeking targets: ${effectiveTargetNodes.map(t => `<span style="color: ${NODE_STYLES.TARGET.background}; font-weight: bold;">${t.replace(/_/g, ' ')}</span>`).join(', ')}.`;
    if (avoidNodesSet.size > 0) {
        statusHTML += `<br>Avoiding: ${Array.from(avoidNodesSet).map(a => `<span style="color: ${NODE_STYLES.AVOID.fontColor};">${a.replace(/_/g, ' ')}</span>`).join(', ')}.`;
    }
    statusDiv.innerHTML = statusHTML;
    await new Promise(resolve => setTimeout(resolve, 10));


    let currentPos = startNode;
    let remainingTargets = new Set(effectiveTargetNodes);
    const visitedTargetsOrder = [];
    const pathSegments = [];
    let totalCost = 0;
    let pathPossible = true;
    let firstVisitedTarget = null;

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
            statusHTML += `<br><br>Cannot reach any remaining targets from ${currentPos.replace(/_/g, ' ')}. Pathfinding stopped.`;
            break;
        }

        if (bestPathToNextTarget.path.length > 0 && !(bestPathToNextTarget.path.length === 1 && bestPathToNextTarget.path[0] === currentPos && bestPathToNextTarget.cost > 0) ) {
            if (bestPathToNextTarget.path.length > 1 || bestPathToNextTarget.cost === 0) {
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

        statusHTML += `<br>\nReached <span style="color: ${NODE_STYLES.TARGET.background}; font-weight: bold;">${nextTargetChosen.replace(/_/g, ' ')}</span>` +
            (bestPathToNextTarget.path.length > 1 ? ` via\n[${formatPathWithIntermediates(bestPathToNextTarget.path, startNode, effectiveTargetNodes)}]` : '') +
            ` (cost: ${bestPathToNextTarget.cost}).`;
        statusDiv.innerHTML = statusHTML;
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (!pathPossible && visitedTargetsOrder.length < effectiveTargetNodes.length) {
        statusHTML += `<br><br>Failed to visit all targets. ${visitedTargetsOrder.length} of ${effectiveTargetNodes.length} targets visited.`;
        if (pathSegments.length > 0) {
            await animatePath(pathSegments, NODE_STYLES.PATH_ANIMATION);
        }
    } else if (visitedTargetsOrder.length > 0) {
        statusHTML += `<br><br>All targets visited! Greedy path cost (to last target): ${totalCost}.`;
        if (pathSegments.length > 0) {
            await animatePath(pathSegments, NODE_STYLES.PATH_ANIMATION);
        }

        const loopStartNode = visitedTargetsOrder[visitedTargetsOrder.length - 1];
        const loopEndNode = firstVisitedTarget;

        statusHTML += `<br><br>Calculating return loop path from <span style="color: ${NODE_STYLES.LOOP_ANIMATION.background}; font-weight: bold;">${loopStartNode.replace(/_/g, ' ')}</span> back to <span style="color: ${NODE_STYLES.LOOP_ANIMATION.background}; font-weight: bold;">${loopEndNode.replace(/_/g, ' ')}</span>...`;
        statusDiv.innerHTML = statusHTML;
        await new Promise(resolve => setTimeout(resolve, 10));

        if (loopStartNode === loopEndNode) {
            statusHTML += `<br>Looping from/to the same target <span style="color: ${NODE_STYLES.TARGET.background}; font-weight: bold;">${loopStartNode.replace(/_/g, ' ')}</span>. Applying mandatory round trip rule.`;
            statusDiv.innerHTML = statusHTML;
            await new Promise(resolve => setTimeout(resolve, 10));

            const roundTripData = findShortestRoundTripFromNode(loopStartNode, avoidNodesSet);
            if (roundTripData.cost !== Infinity && roundTripData.path.length > 0) {
                totalCost += roundTripData.cost;
                 statusHTML += `<br><b>Mandatory Round Trip:</b> ${formatPathWithIntermediates(roundTripData.path, startNode, [loopStartNode], true)}` +
                                `<br><b>Cost:</b> ${roundTripData.cost}. <br><b>Total combined greedy cost: ${totalCost}</b>.`;
                await animatePath([roundTripData.path], NODE_STYLES.LOOP_ANIMATION, true, 300);
            } else {
                statusHTML += `<br>Cannot find a mandatory round trip from <span style="font-weight: bold;">${loopStartNode.replace(/_/g, ' ')}</span> via another node. Loop part failed. Total cost remains ${totalCost}.`;
            }
        } else {
            const loopPathData = dijkstra(loopStartNode, loopEndNode, avoidNodesSet);
            if (loopPathData.path.length > 0 && loopPathData.cost !== Infinity) {
                totalCost += loopPathData.cost;
                statusHTML += `<br><b>Return Loop Path:</b> ${formatPathWithIntermediates(loopPathData.path, startNode, [loopStartNode, loopEndNode], true)}` +
                                `<br><b>Cost:</b> ${loopPathData.cost}. <br><b>Total combined greedy cost: ${totalCost}</b>.`;
                await animatePath([loopPathData.path], NODE_STYLES.LOOP_ANIMATION, true, 300);
            } else {
                statusHTML += `<br>Cannot find return loop path from <span style="font-weight: bold;">${loopStartNode.replace(/_/g, ' ')}</span> to <span style="font-weight: bold;">${loopEndNode.replace(/_/g, ' ')}</span>. Total cost remains ${totalCost}.`;
            }
        }
    } else if (effectiveTargetNodes.length > 0) {
         statusHTML += `<br><br>Could not reach any of the specified targets.`;
    }
     statusDiv.innerHTML = statusHTML;

    visitedTargetsOrder.forEach(tn => applyNodeStyle(tn, NODE_STYLES.TARGET));
    applyNodeStyle(startNode, NODE_STYLES.START);
    avoidNodesSet.forEach(an => applyNodeStyle(an, NODE_STYLES.AVOID));
}

function formatPathWithIntermediates(pathArray, journeyStartNode, targetNodesInSegment, isLoopPath = false) {
    if (!pathArray || pathArray.length === 0) return "";

    const segmentStartNode = pathArray[0];
    const segmentEndNode = pathArray[pathArray.length - 1];

    return pathArray.map((node, index) => {
        const nodeText = node.replace(/_/g, ' ');
        let styleClass = "";

        const isJourneyStart = node === journeyStartNode && index === 0 && !isLoopPath;
        const isSegmentTarget = targetNodesInSegment.includes(node);


        if (isJourneyStart) {
            return `<span style="color: ${NODE_STYLES.START.background}; font-weight: bold;">${nodeText}</span>`;
        } else if (isSegmentTarget) {
             return `<span style="color: ${NODE_STYLES.TARGET.background}; font-weight: bold;">${nodeText}</span>`;
        } else {
            return `<span style="color: ${NODE_STYLES.INTERMEDIATE_NODE_TEXT.color}; font-weight: ${NODE_STYLES.INTERMEDIATE_NODE_TEXT.fontWeight};">${nodeText}</span>`;
        }
    }).join(' → ');
}


async function findPathOptimal(startNode, effectiveTargetNodes, avoidNodesSet, statusDiv, initialStatusHTML) {
    let statusHTML = initialStatusHTML;
    const MAX_TARGETS_FOR_OPTIMAL = 8;
    statusHTML += `Starting from: <span style="color: ${NODE_STYLES.START.background}; font-weight: bold;">${startNode.replace(/_/g, ' ')}</span><br>`;
    statusHTML += `Seeking targets: ${effectiveTargetNodes.map(t => `<span style="color: ${NODE_STYLES.TARGET.background}; font-weight: bold;">${t.replace(/_/g, ' ')}</span>`).join(', ')}.`;
    if (avoidNodesSet.size > 0) {
        statusHTML += `<br>Avoiding: ${Array.from(avoidNodesSet).map(a => `<span style="color: ${NODE_STYLES.AVOID.fontColor};">${a.replace(/_/g, ' ')}</span>`).join(', ')}.`;
    }
    statusHTML += "<br><br>Calculating optimal paths...";
    statusDiv.innerHTML = statusHTML;
    await new Promise(resolve => setTimeout(resolve, 10));

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
    await new Promise(resolve => setTimeout(resolve, 10));

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
            if (firstSegmentData.path.length > 0) currentPathSegmentsArrays.push(firstSegmentData.path);
        }

        if (permutationPossible) {
            for (let i = 0; i < perm.length - 1; i++) {
                const source = perm[i];
                const dest = perm[i+1];
                const segmentKey = `${source}->${dest}`;
                const segmentData = pathCache.get(segmentKey);

                if (!segmentData || segmentData.cost === Infinity) {
                    permutationPossible = false;
                    break;
                }
                currentTotalCost += segmentData.cost;
                if (segmentData.path.length > 0) currentPathSegmentsArrays.push(segmentData.path);
            }
        }

        if (permutationPossible) {
            const loopStartTarget = perm[perm.length - 1];
            const loopEndTarget = perm[0];

            if (loopStartTarget === loopEndTarget) {
                const roundTripData = findShortestRoundTripFromNode(loopStartTarget, avoidNodesSet);
                if (roundTripData.cost === Infinity || roundTripData.path.length === 0) {
                    permutationPossible = false;
                } else {
                    currentTotalCost += roundTripData.cost;
                    currentLoopSegmentData = roundTripData;
                }
            } else {
                const loopKey = `${loopStartTarget}->${loopEndTarget}`;
                const loopData = pathCache.get(loopKey);
                if (!loopData || loopData.cost === Infinity || loopData.path.length === 0) {
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
                totalCost: minTotalCost
            };
        }
    }

    statusHTML = initialStatusHTML;
    statusHTML += `Starting from: <span style="color: ${NODE_STYLES.START.background}; font-weight: bold;">${startNode.replace(/_/g, ' ')}</span><br>`;
    statusHTML += `Seeking targets: ${effectiveTargetNodes.map(t => `<span style="color: ${NODE_STYLES.TARGET.background}; font-weight: bold;">${t.replace(/_/g, ' ')}</span>`).join(', ')}.`;
     if (avoidNodesSet.size > 0) {
        statusHTML += `<br>Avoiding: ${Array.from(avoidNodesSet).map(a => `<span style="color: ${NODE_STYLES.AVOID.fontColor};">${a.replace(/_/g, ' ')}</span>`).join(', ')}.`;
    }
    statusHTML += "<br><br>";


    if (!bestPermutationDetails) {
        statusHTML += `No complete path visiting all targets and looping back could be found.`;
    } else {
        const pathCostWithoutLoop = bestPermutationDetails.totalCost - (bestPermutationDetails.loopSegment ? bestPermutationDetails.loopSegment.cost : 0);

        let fullOptimalPathDisplay = "";
        let lastNodeOfPreviousSegment = null;
        bestPermutationDetails.segments.forEach((segmentPath, index) => {
            let displaySegment = segmentPath;
            if (index > 0 && segmentPath.length > 0 && segmentPath[0] === lastNodeOfPreviousSegment) {
                displaySegment = segmentPath.slice(1);
            }
            if (displaySegment.length > 0) {
                 if (fullOptimalPathDisplay !== "") fullOptimalPathDisplay += " → ";
                 fullOptimalPathDisplay += formatPathWithIntermediates(displaySegment, startNode, bestPermutationDetails.permutation);
            }
            if (segmentPath.length > 0) lastNodeOfPreviousSegment = segmentPath[segmentPath.length-1];
        });


        statusHTML += `<b>Optimal Path:</b> ${fullOptimalPathDisplay}<br>`;
        statusHTML += `<b>Cost:</b> ${pathCostWithoutLoop}<br><br>`;

        let loopPathDisplay = "N/A";
        let loopCostDisplay = "0";
        if (bestPermutationDetails.loopSegment && bestPermutationDetails.loopSegment.path.length > 0 && bestPermutationDetails.loopSegment.cost !== Infinity) {
            loopCostDisplay = String(bestPermutationDetails.loopSegment.cost);
            
            let loopTargetsContext = [];
            const loopActualStart = bestPermutationDetails.loopSegment.path[0];
            const loopActualEnd = bestPermutationDetails.loopSegment.path[bestPermutationDetails.loopSegment.path.length - 1];

            const conceptualLoopStart = bestPermutationDetails.permutation[bestPermutationDetails.permutation.length - 1];
            const conceptualLoopEnd = bestPermutationDetails.permutation[0];

            if (loopActualStart === conceptualLoopStart) loopTargetsContext.push(conceptualLoopStart);
            if (conceptualLoopEnd !== conceptualLoopStart && loopActualEnd === conceptualLoopEnd) {
                 if (!loopTargetsContext.includes(conceptualLoopEnd)) loopTargetsContext.push(conceptualLoopEnd);
            } else if (conceptualLoopEnd === conceptualLoopStart && !loopTargetsContext.includes(conceptualLoopEnd)) {
                loopTargetsContext.push(conceptualLoopEnd);
            }


            loopPathDisplay = formatPathWithIntermediates(
                bestPermutationDetails.loopSegment.path,
                startNode,
                loopTargetsContext,
                true
            );
        }

        statusHTML += `<b>Optimal Loop Path:</b> ${loopPathDisplay}<br>`;
        statusHTML += `<b>Loop Cost:</b> ${loopCostDisplay}<br><br>`;
        statusHTML += `<b>Total Optimal Cost:</b> ${bestPermutationDetails.totalCost}<br>`;

        await animatePath(bestPermutationDetails.segments, NODE_STYLES.PATH_ANIMATION);
        if (bestPermutationDetails.loopSegment && bestPermutationDetails.loopSegment.path.length > 0 && bestPermutationDetails.loopSegment.cost !== Infinity) {
            if (!(bestPermutationDetails.loopSegment.path.length === 1 && bestPermutationDetails.loopSegment.cost === 0)) {
                 await animatePath([bestPermutationDetails.loopSegment.path], NODE_STYLES.LOOP_ANIMATION, true, 300);
            }
        }
    }
    statusDiv.innerHTML = statusHTML;

    effectiveTargetNodes.forEach(tn => applyNodeStyle(tn, NODE_STYLES.TARGET));
    applyNodeStyle(startNode, NODE_STYLES.START);
    avoidNodesSet.forEach(an => applyNodeStyle(an, NODE_STYLES.AVOID));
}


document.getElementById('findPathBtn').addEventListener('click', async () => {
    resetGraphStyles();
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = "Processing...";
    let statusHTML = "";

    const startNode = startBiomeSelect.value;
    const targetNodesInput = Array.from(selectedTargetBiomes);
    const avoidNodesSet = new Set(selectedAvoidBiomes);

    biomeNamesSorted.forEach(biomeId => updateNodeAppearance(biomeId));


    if (!startNode) {
        statusDiv.textContent = "Please select a start biome.";
        return;
    }

    if (avoidNodesSet.has(startNode)) {
        statusDiv.innerHTML = `Error: Start node '${startNode.replace(/_/g, ' ')}' cannot be in the avoid list. Please change start node or remove from avoid list.`;
        return;
    }

    const isOnlyStartNodeTarget = targetNodesInput.length === 0 || (targetNodesInput.length === 1 && targetNodesInput[0] === startNode);

    if (isOnlyStartNodeTarget) {
        let actionDescription = "";
        if (targetNodesInput.length === 0) {
             actionDescription = `No targets selected. Assuming mandatory round trip from Start Node: <span style="color: ${NODE_STYLES.START.background}; font-weight: bold;">${startNode.replace(/_/g, ' ')}</span>.`;
        } else {
             actionDescription = `Start Node <span style="color: ${NODE_STYLES.START.background}; font-weight: bold;">${startNode.replace(/_/g, ' ')}</span> is the only target. Finding a mandatory round trip.`;
        }
        statusHTML = actionDescription + "<br>";

        if (avoidNodesSet.size > 0) {
            statusHTML += `Avoiding: ${Array.from(avoidNodesSet).map(a => `<span style="color: ${NODE_STYLES.AVOID.fontColor};">${a.replace(/_/g, ' ')}</span>`).join(', ')}.<br>`;
        }
        statusDiv.innerHTML = statusHTML;
        await new Promise(resolve => setTimeout(resolve, 10));

        const roundTripData = findShortestRoundTripFromNode(startNode, avoidNodesSet);

        if (roundTripData.cost !== Infinity && roundTripData.path.length > 0) {
            statusHTML += `<br><b>Mandatory Round Trip:</b> ${formatPathWithIntermediates(roundTripData.path, startNode, [startNode], true)}<br>`;
            statusHTML += `<b>Cost:</b> ${roundTripData.cost}`;
            statusDiv.innerHTML = statusHTML;
            await animatePath([roundTripData.path], NODE_STYLES.LOOP_ANIMATION, true, 300);
        } else {
            statusHTML += `<br>Cannot find a mandatory round trip from <span style="font-weight: bold;">${startNode.replace(/_/g, ' ')}</span> via another node.`;
            statusDiv.innerHTML = statusHTML;
        }
        applyNodeStyle(startNode, NODE_STYLES.START);
        avoidNodesSet.forEach(an => applyNodeStyle(an, NODE_STYLES.AVOID));
        if (targetNodesInput.includes(startNode)) updateNodeAppearance(startNode);

        return;
    }


    if (targetNodesInput.length === 0) {
        statusDiv.textContent = "Please select at least one target biome.";
        return;
    }

    const effectiveTargetNodes = targetNodesInput.filter(tn => !avoidNodesSet.has(tn) && tn !== startNode);

    if (effectiveTargetNodes.length !== targetNodesInput.length) {
        const removedCount = targetNodesInput.length - effectiveTargetNodes.length;
        const autoRemovedReason = targetNodesInput.some(tn => tn === startNode) ? " (start node cannot be a distinct target)" :
                                 targetNodesInput.some(tn => avoidNodesSet.has(tn)) ? " (in avoid list)" : "";
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
        await findPathGreedy(startNode, effectiveTargetNodes, avoidNodesSet, statusDiv, statusHTML);
    } else {
        await findPathOptimal(startNode, effectiveTargetNodes, avoidNodesSet, statusDiv, statusHTML);
    }
});