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

    destinations.forEach(dest => {
        let targetBiome;
        const weight = 1;
        if (Array.isArray(dest)) {
            targetBiome = dest[0];
        } else {
            targetBiome = dest;
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

        if (u === endNode) break;
        if (avoidNodes.has(u) && u !== endNode) continue;


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
    if (cost === Infinity || path.length === 0 || (path.length === 1 && startNode !== endNode)) {
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
            id: `${source}_${conn.to}_${Math.random().toString(36).substr(2, 9)}`,
            from: source,
            to: conn.to,
            arrows: 'to',
            color: { color: '#cccccc', highlight:'#ababab' }
        });
    });
});

const graphContainer = document.getElementById('graph-container');
const data = { nodes: nodes, edges: edges };

const options = {
    layout: { randomSeed: 1 },
    edges: {
        smooth: { type: 'continuous', forceDirection: 'none', roundness: 0.2 }
    },
    physics: {
        enabled: true,
        barnesHut: {
            gravitationalConstant: -20000, centralGravity: 0.25,
            springLength: 150, springConstant: 0.04,
            damping: 0.09, avoidOverlap: 0.5
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
        edges.update({ 
            id: edgeId, 
            color: { color: '#cccccc', highlight:'#ababab' }, 
            width: 1, 
            dashes: false,
            label: undefined
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
                        label: undefined
                    });
                });
            }
            await new Promise(resolve => setTimeout(resolve, baseDelay / 2));
        }
        applyNodeStyle(segment[segment.length-1], animationStyle);
    }
}

document.getElementById('findPathBtn').addEventListener('click', async () => {
    resetGraphStyles(); 
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = "Processing...";

    const startNode = startBiomeSelect.value;
    const targetNodesInput = Array.from(selectedTargetBiomes);
    const avoidNodesSet = new Set(selectedAvoidBiomes);

    if (!startNode) {
        statusDiv.textContent = "Please select a start biome.";
        return;
    }
    if (targetNodesInput.length === 0) {
        statusDiv.textContent = "Please select at least one target biome.";
        return;
    }
        if (avoidNodesSet.has(startNode)) { 
        statusDiv.innerHTML = `Error: Start node '${startNode.replace(/_/g, ' ')}' cannot be in the avoid list. Please change start node or remove from avoid list.`;
        return;
    }

    let statusHTML = "";
    const effectiveTargetNodes = targetNodesInput.filter(tn => !avoidNodesSet.has(tn) && tn !== startNode);
    
    if (effectiveTargetNodes.length !== targetNodesInput.length) {
        const removedCount = targetNodesInput.length - effectiveTargetNodes.length;
        statusHTML += `Warning: ${removedCount} target(s) were invalid (already start, or in avoid list) and have been excluded.<br>`;
    }
    
    if (effectiveTargetNodes.length === 0) {
        statusHTML += `Error: No valid targets to route to after filtering. Ensure targets are not the start node or in the avoid list.`;
        statusDiv.innerHTML = statusHTML;
        return;
    }
    
    statusHTML += `Starting from <span class="highlight-start">${startNode.replace(/_/g, ' ')}</span>.<br>Seeking targets: ${effectiveTargetNodes.map(t => `<span class="highlight-target">${t.replace(/_/g, ' ')}</span>`).join(', ')}.`;
    if (avoidNodesSet.size > 0) {
            statusHTML += `<br>Avoiding: ${Array.from(avoidNodesSet).map(a => `<span class="highlight-avoid">${a.replace(/_/g, ' ')}</span>`).join(', ')}.`;
    }
    statusDiv.innerHTML = statusHTML;


    let currentPos = startNode;
    let remainingTargets = new Set(effectiveTargetNodes);
    const visitedTargetsOrder = []; 
    const initialPathSegments = [];
    let totalInitialCost = 0;
    let pathPossible = true;

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
        
        if (bestPathToNextTarget.path.length > 1 || (bestPathToNextTarget.path.length === 1 && currentPos !== nextTargetChosen) || (currentPos === nextTargetChosen && !visitedTargetsOrder.includes(currentPos)) ) {
                initialPathSegments.push(bestPathToNextTarget.path);
        }
        
        totalInitialCost += bestPathToNextTarget.cost;
        currentPos = nextTargetChosen;

        if (!visitedTargetsOrder.includes(nextTargetChosen)){ 
            visitedTargetsOrder.push(nextTargetChosen);
        }
        remainingTargets.delete(nextTargetChosen);

        statusHTML += `<br>\nReached <span class="highlight-target">${nextTargetChosen.replace(/_/g, ' ')}</span>` +
                        (bestPathToNextTarget.path.length > 1 ? ` via\n[${bestPathToNextTarget.path.map(p=>p.replace(/_/g, ' ')).join(' → ')}]` : (bestPathToNextTarget.cost === 0 && bestPathToNextTarget.path[0] === nextTargetChosen ? ' (already there/selected as target)' : '')) +
                        ` (cost: ${bestPathToNextTarget.cost}).`;
        statusDiv.innerHTML = statusHTML;
    }
    
    if (!pathPossible && visitedTargetsOrder.length < effectiveTargetNodes.length) {
        statusHTML += `<br><br>Failed to visit all targets. ${visitedTargetsOrder.length} of ${effectiveTargetNodes.length} targets visited.`;
        if (initialPathSegments.length > 0) {
            await animatePath(initialPathSegments, NODE_STYLES.PATH_ANIMATION);
        }
        statusDiv.innerHTML = statusHTML;
        visitedTargetsOrder.forEach(tn => applyNodeStyle(tn, NODE_STYLES.TARGET));
        applyNodeStyle(startNode, NODE_STYLES.START);
        return;
    }

    statusHTML += `<br><br>All targets visited! Total initial path cost: ${totalInitialCost}.`;
    statusDiv.innerHTML = statusHTML;
    if (initialPathSegments.length > 0) {
            await animatePath(initialPathSegments, NODE_STYLES.PATH_ANIMATION);
    }

    visitedTargetsOrder.forEach(tn => applyNodeStyle(tn, NODE_STYLES.TARGET));
    applyNodeStyle(startNode, NODE_STYLES.START);


    const loopableTargets = visitedTargetsOrder.slice(); 

    if (loopableTargets.length > 0) { 
        statusHTML += `<br><br>Calculating looping path for visited targets: ${loopableTargets.map(t => `<span class="highlight-loop">${t.replace(/_/g, ' ')}</span>`).join(' → ')}` +
                        (loopableTargets.length > 1 ? ` → <span class="highlight-loop">${loopableTargets[0].replace(/_/g, ' ')}</span>` : (loopableTargets.length === 1 ? ` (loop on self)` : '')) +
                        `...`;
        const loopingPathSegments = [];
        let totalLoopCost = 0;
        let loopPossible = true;

        for (let i = 0; i < loopableTargets.length; i++) {
            const fromNode = loopableTargets[i];
            const toNode = loopableTargets[(i + 1) % loopableTargets.length];
            
            if (fromNode === toNode && loopableTargets.length === 1) { 
                    statusHTML += `<br>Looping on <span class="highlight-loop">${fromNode.replace(/_/g, ' ')}</span> (cost: 0).`;
                    continue;
            }
                if (fromNode === toNode) continue; 

            const res = dijkstra(fromNode, toNode, avoidNodesSet);
            if (res.path.length > 0) {
                loopingPathSegments.push(res.path);
                totalLoopCost += res.cost;
                statusHTML += `<br>\nLoop segment: <span class="highlight-loop">${fromNode.replace(/_/g, ' ')}</span> → <span class="highlight-loop">${toNode.replace(/_/g, ' ')}</span>` +
                                (res.path.length > 1 ? ` via\n[${res.path.map(p=>p.replace(/_/g, ' ')).join(' → ')}]` : '') +
                                ` (cost: ${res.cost}).`;
            } else {
                loopPossible = false;
                statusHTML += `<br>Cannot find loop segment from <span class="highlight-loop">${fromNode.replace(/_/g, ' ')}</span> to <span class="highlight-loop">${toNode.replace(/_/g, ' ')}</span>.`;
                break;
            }
            statusDiv.innerHTML = statusHTML; 
        }

        if (loopPossible) {
            statusHTML += `<br><br>Looping path complete. Total loop cost: ${totalLoopCost}.`;
            if (loopingPathSegments.length > 0) {
                await animatePath(loopingPathSegments, NODE_STYLES.LOOP_ANIMATION, true, 300);
            }
            visitedTargetsOrder.forEach(tn => applyNodeStyle(tn, NODE_STYLES.TARGET));
            applyNodeStyle(startNode, NODE_STYLES.START);

        } else {
            statusHTML += `<br><br>Failed to complete the loop.`;
        }
    } else {
            statusHTML += `<br><br>No targets were successfully visited to form a loop.`;
    }
    statusDiv.innerHTML = statusHTML;
});
