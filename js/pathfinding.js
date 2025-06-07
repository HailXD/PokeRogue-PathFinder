import { allBiomes, graph } from "./data.js";
import {
    nodes,
    edges,
    persistentPathNodeIds,
    persistentPathEdgeIds,
    persistentLoopEdgeIds,
    visitedNodes,
    NODE_STYLES,
} from "./main.js";
import { resetGraphStyles } from "./graph.js";

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
}
