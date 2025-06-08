import { allBiomes, graph } from "./data.js";
import {
    nodes,
    edges,
    persistentPathNodeIds,
    persistentPathEdgeIds,
    persistentLoopEdgeIds,
    visitedNodes,
    NODE_STYLES,
    updateAllNodeStyles,
} from "./main.js";
import { resetGraphStyles } from "./graph.js";

const INSTRUCTIONAL_TEXT = `
    <br><br><hr style="border-top: 1px solid #ccc; margin: 10px 0;"><br>
    Select <span class="highlight-key">biomes</span> to find the optimal path.<br />
    <span class="highlight-key">Click</span> on a biome to see
    list full list of spawn.<br />
    <span class="highlight-key">Right-click</span> a biome to set
    it as the start biome.<br />
    <span class="highlight-key">Search</span> for Pokemon to
    highlight their biomes.<br />
    <span class="highlight-key">Hover</span> on highlighted to
    view selected Pokemon.<br />`;

class PriorityQueue {
    constructor() {
        this.heap = [];
    }
    enqueue(element, priority) {
        this.heap.push({ element, priority });
        this.bubbleUp();
    }
    bubbleUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            const element = this.heap[index];
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];
            if (parent.priority <= element.priority) break;
            this.heap[index] = parent;
            this.heap[parentIndex] = element;
            index = parentIndex;
        }
    }
    dequeue() {
        if (this.isEmpty()) {
            return undefined;
        }
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = end;
            this.sinkDown(0);
        }
        return min;
    }
    sinkDown(index) {
        const left = 2 * index + 1;
        const right = 2 * index + 2;
        let smallest = index;
        const length = this.heap.length;
        if (
            left < length &&
            this.heap[left].priority < this.heap[smallest].priority
        ) {
            smallest = left;
        }
        if (
            right < length &&
            this.heap[right].priority < this.heap[smallest].priority
        ) {
            smallest = right;
        }
        if (smallest !== index) {
            [this.heap[index], this.heap[smallest]] = [
                this.heap[smallest],
                this.heap[index],
            ];
            this.sinkDown(smallest);
        }
    }
    isEmpty() {
        return this.heap.length === 0;
    }
}

function dijkstra(
    startNode,
    endNode,
    avoidNodes = new Set(),
    useUnitWeight = false
) {
    const distances = new Map();
    const prevNodes = new Map();
    const pq = new PriorityQueue();

    allBiomes.forEach((biome) => {
        distances.set(biome, Infinity);
        prevNodes.set(biome, null);
    });

    distances.set(startNode, 0);
    pq.enqueue(startNode, 0);

    while (!pq.isEmpty()) {
        const dequeued = pq.dequeue();
        if (!dequeued) break;
        const { element: u, priority: u_dist } = dequeued;

        if (u_dist > distances.get(u)) {
            continue;
        }

        if (u === endNode) break;

        if (avoidNodes.has(u) && u !== startNode && u !== endNode) continue;

        const neighbors = graph.get(u) || [];
        for (const edge of neighbors) {
            const v = edge.to;
            if (avoidNodes.has(v) && v !== endNode) continue;

            const weight = useUnitWeight ? 1 : edge.weight;
            const alt = distances.get(u) + weight;

            if (alt < distances.get(v)) {
                distances.set(v, alt);
                prevNodes.set(v, u);
                pq.enqueue(v, alt);
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

async function animatePath(pathSegments, animationStyle, options = {}) {
    const {
        isLoop = false,
        baseDelay = 50,
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

        const backgroundColor = isStart
            ? NODE_STYLES.START.background
            : isTarget
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

function findShortestRoundTripFromNode(
    node,
    avoidNodesSet,
    useUnitWeight = false
) {
    let minLoopCost = Infinity;
    let bestLoopPath = [];

    const potentialIntermediates = Array.from(allBiomes).filter(
        (b) => b !== node && !avoidNodesSet.has(b)
    );

    if (potentialIntermediates.length === 0) {
        return { path: [], cost: Infinity };
    }

    for (const intermediate of potentialIntermediates) {
        const pathToIntermediate = dijkstra(
            node,
            intermediate,
            avoidNodesSet,
            useUnitWeight
        );
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
            avoidNodesSet,
            useUnitWeight
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

function formatPathWithIntermediates(
    pathArray,
    journeyStartNode,
    targetNodesInSegment,
    isLoopPath = false
) {
    if (!pathArray || pathArray.length === 0) return "";

    let html = "";
    for (let i = 0; i < pathArray.length; i++) {
        const node = pathArray[i];
        const nodeText = node.replace(/_/g, " ");
        const isJourneyStart =
            node === journeyStartNode && i === 0 && !isLoopPath;
        const isSegmentTarget = targetNodesInSegment.includes(node);

        let nodeClass = "highlight-intermediate";
        if (isJourneyStart) {
            nodeClass = "highlight-start";
        } else if (isSegmentTarget) {
            nodeClass = "highlight-target";
        }

        html += `<span class="${nodeClass}">${nodeText}</span>`;

        if (i < pathArray.length - 1) {
            const nextNode = pathArray[i + 1];
            const connections = graph.get(node) || [];
            const edge = connections.find((conn) => conn.to === nextNode);
            const weight = edge ? edge.weight : 1;

            if (weight > 1) {
                html += ` <span style="color: orange; font-weight: bold;">→</span> `;
            } else {
                html += " → ";
            }
        }
    }
    return html;
}

function findNearestNeighborPath(startNode, targetNodes, pathCache) {
    const unvisited = new Set(targetNodes);
    const permutation = [];
    let lastNode = startNode;

    while (unvisited.size > 0) {
        let nearestTarget = null;
        let minCost = Infinity;

        for (const target of unvisited) {
            const key = `${lastNode}->${target}`;
            const segment = pathCache.get(key);
            if (segment.cost < minCost) {
                minCost = segment.cost;
                nearestTarget = target;
            }
        }

        if (nearestTarget) {
            permutation.push(nearestTarget);
            unvisited.delete(nearestTarget);
            lastNode = nearestTarget;
        } else {
            break;
        }
    }
    return permutation;
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
    statusHTML += "<br><br>";
    statusDiv.innerHTML = statusHTML;
    await new Promise((resolve) => setTimeout(resolve, 10));

    const pathCache = new Map();
    const shortestPathCache = new Map();
    const nodesForPathCalc = [startNode, ...effectiveTargetNodes];

    statusHTML += "Finding optimal path...<br>";
    statusDiv.innerHTML = statusHTML;
    await new Promise((resolve) => setTimeout(resolve, 10));

    for (const nodeA of nodesForPathCalc) {
        for (const nodeB of nodesForPathCalc) {
            if (nodeA === nodeB) {
                pathCache.set(`${nodeA}->${nodeB}`, { path: [nodeA], cost: 0 });
                shortestPathCache.set(`${nodeA}->${nodeB}`, {
                    path: [nodeA],
                    cost: 0,
                });
                continue;
            }
            const cacheKey = `${nodeA}->${nodeB}`;
            if (!pathCache.has(cacheKey)) {
                pathCache.set(cacheKey, dijkstra(nodeA, nodeB, avoidNodesSet));
                shortestPathCache.set(
                    cacheKey,
                    dijkstra(nodeA, nodeB, avoidNodesSet, true)
                );
            }
        }
    }

    const MAX_TARGETS_FOR_OPTIMAL = 8;
    let permutations;

    if (effectiveTargetNodes.length > MAX_TARGETS_FOR_OPTIMAL) {
        statusHTML += `Finding best path for ${effectiveTargetNodes.length} targets using a fast heuristic...<br>`;
        permutations = [
            findNearestNeighborPath(startNode, effectiveTargetNodes, pathCache),
        ];
    } else {
        statusHTML += `Finding optimal path for ${effectiveTargetNodes.length} targets...<br>`;
        permutations = getPermutations(effectiveTargetNodes);
    }
    statusDiv.innerHTML = statusHTML;
    await new Promise((resolve) => setTimeout(resolve, 10));

    let minTotalCost = Infinity;
    let bestPermutationDetails = null;
    let minShortestPathCost = Infinity;
    let bestShortestPathPermutationDetails = null;

    for (const perm of permutations) {
        let currentTotalCost = 0;
        const currentPathSegmentsArrays = [];
        let currentLoopSegmentData = null;
        let permutationPossible = true;

        let currentShortestPathCost = 0;
        const currentShortestPathSegmentsArrays = [];
        let currentShortestPathLoopSegmentData = null;

        const firstSegmentKey = `${startNode}->${perm[0]}`;
        const firstSegmentData = pathCache.get(firstSegmentKey);
        const firstShortestPathSegmentData =
            shortestPathCache.get(firstSegmentKey);

        if (!firstSegmentData || firstSegmentData.cost === Infinity) {
            permutationPossible = false;
        } else {
            currentTotalCost += firstSegmentData.cost;
            if (firstSegmentData.path.length > 0)
                currentPathSegmentsArrays.push(firstSegmentData.path);

            currentShortestPathCost += firstShortestPathSegmentData.cost;
            if (firstShortestPathSegmentData.path.length > 0)
                currentShortestPathSegmentsArrays.push(
                    firstShortestPathSegmentData.path
                );
        }

        if (permutationPossible) {
            for (let i = 0; i < perm.length - 1; i++) {
                const source = perm[i];
                const dest = perm[i + 1];
                const segmentKey = `${source}->${dest}`;
                const segmentData = pathCache.get(segmentKey);
                const shortestPathSegmentData =
                    shortestPathCache.get(segmentKey);

                if (!segmentData || segmentData.cost === Infinity) {
                    permutationPossible = false;
                    break;
                }
                currentTotalCost += segmentData.cost;
                if (segmentData.path.length > 0)
                    currentPathSegmentsArrays.push(segmentData.path);

                currentShortestPathCost += shortestPathSegmentData.cost;
                if (shortestPathSegmentData.path.length > 0)
                    currentShortestPathSegmentsArrays.push(
                        shortestPathSegmentData.path
                    );
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
                const shortestRoundTripData = findShortestRoundTripFromNode(
                    loopStartTarget,
                    avoidNodesSet,
                    true
                );

                if (
                    roundTripData.cost === Infinity ||
                    roundTripData.path.length === 0
                ) {
                    permutationPossible = false;
                } else {
                    currentTotalCost += roundTripData.cost;
                    currentLoopSegmentData = roundTripData;
                    currentShortestPathCost += shortestRoundTripData.cost;
                    currentShortestPathLoopSegmentData = shortestRoundTripData;
                }
            } else {
                const loopKey = `${loopStartTarget}->${loopEndTarget}`;
                const loopData = pathCache.get(loopKey);
                const shortestLoopData = shortestPathCache.get(loopKey);

                if (
                    !loopData ||
                    loopData.cost === Infinity ||
                    loopData.path.length === 0
                ) {
                    permutationPossible = false;
                } else {
                    currentTotalCost += loopData.cost;
                    currentLoopSegmentData = loopData;
                    currentShortestPathCost += shortestLoopData.cost;
                    currentShortestPathLoopSegmentData = shortestLoopData;
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

        if (
            permutationPossible &&
            currentShortestPathCost < minShortestPathCost
        ) {
            minShortestPathCost = currentShortestPathCost;
            bestShortestPathPermutationDetails = {
                permutation: perm,
                segments: currentShortestPathSegmentsArrays,
                loopSegment: currentShortestPathLoopSegmentData,
                totalCost: minShortestPathCost,
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

        statusHTML += `<b>Optimal Path (Highest Probability):<br></b>${fullOptimalPathDisplay}<br>`;
        statusHTML += `<br>`;

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

        statusHTML += `<b>Optimal Loop Path (Highest Probability):<br></b>${loopPathDisplay}<br>`;
        statusHTML += `<br>`;

        if (bestShortestPathPermutationDetails) {
            const fullOptimalPathString = JSON.stringify(
                bestPermutationDetails.segments
            );
            const fullShortestPathString = JSON.stringify(
                bestShortestPathPermutationDetails.segments
            );

            if (fullOptimalPathString !== fullShortestPathString) {
                const shortestPathCostWithoutLoop =
                    bestShortestPathPermutationDetails.totalCost -
                    (bestShortestPathPermutationDetails.loopSegment
                        ? bestShortestPathPermutationDetails.loopSegment.cost
                        : 0);

                let fullShortestPathDisplay = "";
                let lastNodeOfPreviousShortestSegment = null;
                bestShortestPathPermutationDetails.segments.forEach(
                    (segmentPath, index) => {
                        let displaySegment = segmentPath;
                        if (
                            index > 0 &&
                            segmentPath.length > 0 &&
                            segmentPath[0] === lastNodeOfPreviousShortestSegment
                        ) {
                            displaySegment = segmentPath.slice(1);
                        }
                        if (displaySegment.length > 0) {
                            if (fullShortestPathDisplay !== "")
                                fullShortestPathDisplay += " → ";
                            fullShortestPathDisplay +=
                                formatPathWithIntermediates(
                                    displaySegment,
                                    startNode,
                                    bestShortestPathPermutationDetails.permutation
                                );
                        }
                        if (segmentPath.length > 0)
                            lastNodeOfPreviousShortestSegment =
                                segmentPath[segmentPath.length - 1];
                    }
                );

                statusHTML += `<b>Shortest Path:<br></b>${fullShortestPathDisplay}<br>`;
                statusHTML += `<br>`;

                let shortestLoopPathDisplay = "N/A";
                let shortestLoopCostDisplay = "0";
                if (
                    bestShortestPathPermutationDetails.loopSegment &&
                    bestShortestPathPermutationDetails.loopSegment.path.length >
                        0 &&
                    bestShortestPathPermutationDetails.loopSegment.cost !==
                        Infinity
                ) {
                    shortestLoopCostDisplay = String(
                        bestShortestPathPermutationDetails.loopSegment.cost
                    );
                    const loopTargetsContext = [
                        bestShortestPathPermutationDetails.permutation[0],
                        bestShortestPathPermutationDetails.permutation[
                            bestShortestPathPermutationDetails.permutation
                                .length - 1
                        ],
                    ];

                    shortestLoopPathDisplay = formatPathWithIntermediates(
                        bestShortestPathPermutationDetails.loopSegment.path,
                        startNode,
                        loopTargetsContext,
                        true
                    );
                }

                statusHTML += `<b>Shortest Loop Path:<br></b>${shortestLoopPathDisplay}<br>`;
                statusHTML += `<br>`;
            }
        }

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
                        baseDelay: 50,
                        startNode: startNode,
                        targetNodes: styleOptions.allTargetNodes,
                        pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
                    }
                );
            }
        }
    }
    statusDiv.innerHTML = statusHTML + INSTRUCTIONAL_TEXT;
    resetGraphStyles();
}

export async function findPath(
    startNode,
    targetNodesInput,
    avoidNodesSet,
    pokemonSpawnNodes,
    allTargetNodes
) {
    const statusDiv = document.getElementById("status");
    statusDiv.innerHTML = "Processing...";
    let statusHTML = "";

    const styleOptions = {
        allTargetNodes: allTargetNodes,
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
                ? `No targets selected. Assuming cycle from Start Node: <span class="highlight-start">${startNode.replace(
                      /_/g,
                      " "
                  )}</span>.`
                : `Start Node <span class="highlight-start">${startNode.replace(
                      /_/g,
                      " "
                  )}</span> is the only target. Finding a cycle.`;
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
            avoidNodesSet,
            false
        );

        if (roundTripData.cost !== Infinity && roundTripData.path.length > 0) {
            roundTripData.path.forEach((node) => {
                persistentPathNodeIds.add(node);
                visitedNodes.add(node);
            });
            getEdgeIdsForPath(roundTripData.path).forEach((id) =>
                persistentLoopEdgeIds.add(id)
            );

            statusHTML += `<br><b>Cycle:</b> ${formatPathWithIntermediates(
                roundTripData.path,
                startNode,
                [startNode],
                true
            )}<br>`;
            statusHTML += ``;
            statusDiv.innerHTML = statusHTML;
            await animatePath(
                [roundTripData.path],
                NODE_STYLES.LOOP_ANIMATION,
                {
                    isLoop: true,
                    baseDelay: 50,
                    startNode: startNode,
                    targetNodes: styleOptions.allTargetNodes,
                    pokemonSpawnNodes: styleOptions.pokemonSpawnNodes,
                }
            );
        } else {
            statusHTML += `<br>Cannot find a cycle from <span style="font-weight: bold;">${startNode.replace(
                /_/g,
                " "
            )}</span> via another node.`;
            statusDiv.innerHTML = statusHTML;
        }
        statusDiv.innerHTML += INSTRUCTIONAL_TEXT;
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

    if (effectiveTargetNodes.length === 0) {
        statusHTML += `Error: No valid targets to route to after filtering. `;
        statusDiv.innerHTML = statusHTML;
        return;
    }

    await findPathOptimal(
        startNode,
        effectiveTargetNodes,
        avoidNodesSet,
        statusDiv,
        statusHTML,
        styleOptions
    );
    updateAllNodeStyles();
}
