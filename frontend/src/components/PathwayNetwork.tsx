"use client";

import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

interface PathwayNetworkProps {
  graphData: {
    nodes: any[];
    edges: any[];
  };
}

export default function PathwayNetwork({ graphData }: PathwayNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !graphData || graphData.nodes.length === 0) return;

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...graphData.nodes, ...graphData.edges],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            color: "#ffffff",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "11px",
            "font-weight": "bold",
            width: "55px",
            height: "55px",
            "border-width": "2px",
            "border-color": "#1f2937",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2.5,
            "line-color": "#4b5563",
            "target-arrow-color": "#4b5563",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(interaction)",
            "font-size": "8px",
            "text-background-opacity": 0.7,
            "text-background-color": "#030712",
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
            color: "#9ca3af",
          },
        },
        {
          selector: "edge[interaction='inhibits']",
          style: {
            "target-arrow-shape": "tee",
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
          },
        },
        {
          selector: "edge[interaction='activates']",
          style: {
            "line-color": "#10b981",
            "target-arrow-color": "#10b981",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": "3px",
            "border-color": "#0ea5e9",
            "background-color": "#0ea5e9",
          },
        },
      ],
      layout: {
        name: "preset", // Uses predefined (x, y) coordinates from backend!
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    // Add node tooltips/interaction
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const desc = node.data("description");
      const expr = node.data("expression");
      
      const tooltip = document.getElementById("pathway-tooltip");
      if (tooltip) {
        tooltip.innerHTML = `
          <div class="font-bold text-sm text-white">${node.id()}</div>
          <div class="text-xs text-brand-teal mt-0.5">Expression level: ${expr > 0 ? "+" : ""}${expr} log2FC</div>
          <div class="text-[11px] text-gray-400 mt-1 font-light leading-normal">${desc}</div>
        `;
      }
    });

    return () => {
      cy.destroy();
    };
  }, [graphData]);

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Network Canvas */}
      <div ref={containerRef} className="flex-1 w-full min-h-[420px] bg-slate-950/40 rounded-xl border border-gray-800/80"></div>
      
      {/* Dynamic Tooltip Pane */}
      <div 
        id="pathway-tooltip" 
        className="absolute bottom-4 left-4 right-4 p-4 rounded-xl glass-card border border-brand-purple/20 bg-slate-900/90 text-xs min-h-[70px] pointer-events-none"
      >
        <div className="text-gray-500 italic text-center py-2">Click any gene node in the pathway to inspect biological interactions and expression metrics.</div>
      </div>
    </div>
  );
}
