import {
    nodes,
    edges,
    networkHolder,
    updateAllNodeStyles,
    persistentPathEdgeIds,
    persistentLoopEdgeIds,
    runPathfinding,
    selectedTargetBiomes,
} from "./main.js";
import { graph, biomeNamesSorted, biomePositions } from "./data.js";
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
                label: undefined,
                arrows: "to",
                color: { color: edgeColor, highlight: highlightColor },
                font: { align: "top", size: 16, color: fontColor },
                pathWeight: conn.weight,
            });
        });
    });

    const nodeData = biomeNamesSorted.map((name) => {
        const position = biomePositions[name] || { x: 0, y: 0 };
        return {
            id: name,
            label: name.replace(/_/g, " "),
            title: createTooltipElement(name),
            x: position.x,
            y: position.y,
            fixed: true,
        };
    });
    nodes.clear();
    nodes.add(nodeData);

    const graphContainer = document.getElementById("graph-container");
    const data = { nodes: nodes, edges: edges };

    const options = {
        layout: { improvedLayout: false },
        edges: {
            smooth: {
                type: "continuous",
                forceDirection: "none",
                roundness: 0.2,
            },
            font: { size: 10, align: "middle" },
            selfReference: { size: 20, angle: Math.PI / 4 },
        },
        physics: { enabled: false },
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

    networkHolder.network.moveTo({offset: { x: 0, y: -120 } });

    networkHolder.network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const biomeId = params.nodes[0];
            populateAndShowPokemonModal(biomeId);
        }
    });

    networkHolder.network.on("oncontext", function (params) {
        params.event.preventDefault();
        const nodeId = networkHolder.network.getNodeAt(params.pointer.DOM);
        if (nodeId) {
            const startBiomeSelect = document.getElementById("startBiome");
            startBiomeSelect.value = nodeId;
            startBiomeSelect.dispatchEvent(new Event("change"));
            if (selectedTargetBiomes.size > 0) {
                runPathfinding();
            }
        }
    });

    updateAllNodeStyles();
}

export function resetGraphStyles() {
    const isDark = document.body.classList.contains("dark-theme");
    const edgeColor = isDark ? "#555" : "#cccccc";
    const highlightColor = isDark ? "#777" : "#ababab";
    const fontColor = isDark ? "#FFFFFF" : "#777777";

    const pathEdgeStyle = {
        color: "#79B6FF",
        width: 2.5,
        dashes: false,
    };
    const weightedPathEdgeStyle = {
        color: "orange",
        width: 2.5,
        dashes: false,
    };
    const loopEdgeStyle = {
        color: "red",
        dashes: [5, 5],
        width: 2.5,
    };
    const weightedLoopEdgeStyle = {
        color: "orange",
        dashes: [5, 5],
        width: 2.5,
    };

    const edgeUpdates = edges.getIds().map((edgeId) => {
        const edge = edges.get(edgeId);
        const update = {
            id: edgeId,
            font: { color: fontColor },
        };

        const hasWeight = edge.pathWeight > 1;

        if (persistentLoopEdgeIds.has(edgeId)) {
            const style = hasWeight ? weightedLoopEdgeStyle : loopEdgeStyle;
            update.color = {
                color: style.color,
                highlight: highlightColor,
            };
            update.width = style.width;
            update.dashes = style.dashes;
        } else if (persistentPathEdgeIds.has(edgeId)) {
            const style = hasWeight ? weightedPathEdgeStyle : pathEdgeStyle;
            update.color = {
                color: style.color,
                highlight: highlightColor,
            };
            update.width = style.width;
            update.dashes = style.dashes;
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
