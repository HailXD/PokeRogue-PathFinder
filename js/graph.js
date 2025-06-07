import {
    nodes,
    edges,
    networkHolder,
    updateAllNodeStyles,
    persistentPathEdgeIds,
    persistentLoopEdgeIds,
} from "./main.js";
import { graph, biomeNamesSorted } from "./data.js";
import { createTooltipElement, populateAndShowPokemonModal } from "./ui.js";

export function initializeGraph() {
    const isDark = document.body.classList.contains("dark-theme");
    const edgeColor = isDark ? "#555" : "#cccccc";
    const highlightColor = isDark ? "#777" : "#ababab";
    const fontColor = isDark ? "#FFFFFF" : "#777777";

    edges.clear();
    graph.forEach((connections, source) => {
        connections.forEach((conn) => {
            edges.add({
                id: `${source}_${conn.to}_w${conn.weight}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                from: source,
                to: conn.to,
                label: conn.weight > 1 ? `${Math.round(100 / conn.weight)}%` : undefined,
                arrows: "to",
                color: { color: edgeColor, highlight: highlightColor },
                font: { align: "top", size: 16, color: fontColor },
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
    networkHolder.network = new vis.Network(graphContainer, data, options);

    networkHolder.network.on("stabilizationIterationsDone", function () {
        networkHolder.network.setOptions({ physics: { enabled: false } });
    });

    networkHolder.network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const biomeId = params.nodes[0];
            populateAndShowPokemonModal(biomeId);
        }
    });

    updateAllNodeStyles();
}

export function resetGraphStyles() {
    updateAllNodeStyles();

    const isDark = document.body.classList.contains("dark-theme");
    const edgeColor = isDark ? "#555" : "#cccccc";
    const highlightColor = isDark ? "#777" : "#ababab";
    const fontColor = isDark ? "#FFFFFF" : "#777777";

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
