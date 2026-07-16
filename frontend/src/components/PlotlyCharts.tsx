"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import react-plotly.js to disable server-side rendering
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] bg-slate-950/20 border border-gray-800 rounded-xl flex items-center justify-center text-sm text-gray-500">
      Loading Plotly visualization canvas...
    </div>
  ),
});

// 1. Phred Score QC Chart
export function QcPhredChart({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;

  return (
    <Plot
      data={[
        {
          x: Array.from({ length: data.length }, (_, i) => i + 1),
          y: data,
          type: "scatter",
          mode: "lines",
          line: { color: "#0ea5e9", width: 2.5 },
          name: "Average Phred Quality",
        },
      ]}
      layout={{
        title: { text: "Phred Quality Score Profile per Cycle", font: { color: "#f3f4f6", size: 14 } },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { title: "Position in Read (bp)", gridcolor: "#1f2937", tickcolor: "#4b5563", font: { color: "#9ca3af" }, tickfont: { color: "#9ca3af" } },
        yaxis: { title: "Quality Score (Phred Q)", range: [0, 42], gridcolor: "#1f2937", tickcolor: "#4b5563", font: { color: "#9ca3af" }, tickfont: { color: "#9ca3af" } },
        margin: { t: 50, b: 50, l: 50, r: 20 },
        height: 350,
        autosize: true,
      }}
      config={{ responsive: true, displayModeBar: false }}
      className="w-full"
    />
  );
}

// 2. Volcano Plot
interface VolcanoPoint {
  gene: string;
  log2FC: number;
  minusLog10P: number;
}
export function ExpressionVolcano({ points }: { points: VolcanoPoint[] }) {
  if (!points || points.length === 0) return null;

  // Filter into categories for color highlights
  const sigUp = points.filter(p => p.log2FC >= 1.5 && p.minusLog10P >= 1.3);
  const sigDown = points.filter(p => p.log2FC <= -1.5 && p.minusLog10P >= 1.3);
  const nonSig = points.filter(p => Math.abs(p.log2FC) < 1.5 || p.minusLog10P < 1.3);

  return (
    <Plot
      data={[
        {
          x: nonSig.map(p => p.log2FC),
          y: nonSig.map(p => p.minusLog10P),
          text: nonSig.map(p => p.gene),
          type: "scatter",
          mode: "markers",
          marker: { color: "#4b5563", size: 5, opacity: 0.6 },
          name: "Non-Significant",
          hoverinfo: "text+x+y",
        },
        {
          x: sigUp.map(p => p.log2FC),
          y: sigUp.map(p => p.minusLog10P),
          text: sigUp.map(p => p.gene),
          type: "scatter",
          mode: "markers",
          marker: { color: "#ef4444", size: 7, opacity: 0.8 },
          name: "Upregulated (log2FC ≥ 1.5)",
          hoverinfo: "text+x+y",
        },
        {
          x: sigDown.map(p => p.log2FC),
          y: sigDown.map(p => p.minusLog10P),
          text: sigDown.map(p => p.gene),
          type: "scatter",
          mode: "markers",
          marker: { color: "#3b82f6", size: 7, opacity: 0.8 },
          name: "Downregulated (log2FC ≤ -1.5)",
          hoverinfo: "text+x+y",
        },
      ]}
      layout={{
        title: { text: "Differentially Expressed Genes (Volcano Plot)", font: { color: "#f3f4f6", size: 14 } },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { title: "log2 Fold Change", gridcolor: "#1f2937", tickcolor: "#4b5563", tickfont: { color: "#9ca3af" } },
        yaxis: { title: "-log10 p-value", gridcolor: "#1f2937", tickcolor: "#4b5563", tickfont: { color: "#9ca3af" } },
        margin: { t: 50, b: 50, l: 50, r: 20 },
        height: 380,
        showlegend: true,
        legend: { font: { color: "#9ca3af" } },
      }}
      config={{ responsive: true }}
      className="w-full"
    />
  );
}

// 3. Expression Heatmap
interface HeatmapData {
  genes: string[];
  samples: string[];
  data: { gene: string; values: number[] }[];
}
export function ExpressionHeatmap({ heatmap }: { heatmap: HeatmapData }) {
  if (!heatmap || !heatmap.data || heatmap.data.length === 0) return null;

  // Format data for Plotly heatmap
  const zData = heatmap.data.map(row => row.values);

  return (
    <Plot
      data={[
        {
          z: zData,
          x: heatmap.samples,
          y: heatmap.genes,
          type: "heatmap",
          colorscale: [
            [0, "#3b82f6"],       // Cool blue for downregulated
            [0.5, "#0b0f19"],     // Mid space-dark
            [1, "#ef4444"],       // Hot red for upregulated
          ],
          showscale: true,
          colorbar: { tickfont: { color: "#9ca3af" } },
        },
      ]}
      layout={{
        title: { text: "Tumor Marker Gene Expression Matrix", font: { color: "#f3f4f6", size: 14 } },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { tickangle: -45, tickfont: { color: "#9ca3af" } },
        yaxis: { tickfont: { color: "#9ca3af" }, autorange: "reversed" },
        margin: { t: 50, b: 80, l: 80, r: 20 },
        height: 380,
      }}
      config={{ responsive: true }}
      className="w-full"
    />
  );
}

// 4. Mutation Lollipop Plot
interface MutationPoint {
  position: number;
  count: number;
  type: string;
  change: string;
  domain: string;
}
interface ProteinDomain {
  name: string;
  start: number;
  end: number;
}
export function MutationLollipop({ mutations, domains, proteinLength }: { mutations: MutationPoint[]; domains: ProteinDomain[]; proteinLength: number }) {
  if (!mutations || mutations.length === 0) return null;

  // 1. Draw lollipop sticks (vertical line shapes)
  const shapes: any[] = mutations.map(m => ({
    type: "line",
    x0: m.position,
    y0: 0,
    x1: m.position,
    y1: m.count,
    line: { color: "#4b5563", width: 1.5 },
  }));

  // 2. Draw protein domain bars (horizontal rectangles)
  const colors = ["rgba(14,165,233,0.15)", "rgba(139,92,246,0.15)", "rgba(16,185,129,0.15)", "rgba(217,70,239,0.15)", "rgba(245,158,11,0.15)"];
  const borderColors = ["#0ea5e9", "#8b5cf6", "#10b981", "#d946ef", "#f59e0b"];

  domains.forEach((d, idx) => {
    shapes.push({
      type: "rect",
      x0: d.start,
      y0: -2,
      x1: d.end,
      y1: -0.5,
      fillcolor: colors[idx % colors.length],
      line: { color: borderColors[idx % borderColors.length], width: 1 },
    });
  });

  // Base protein backbone
  shapes.push({
    type: "rect",
    x0: 1,
    y0: -1.5,
    x1: proteinLength,
    y1: -1,
    fillcolor: "rgba(255,255,255,0.08)",
    line: { color: "rgba(255,255,255,0.2)", width: 1 },
  });

  return (
    <Plot
      data={[
        {
          x: mutations.map(m => m.position),
          y: mutations.map(m => m.count),
          text: mutations.map(m => `${m.change}<br>Type: ${m.type}<br>Domain: ${m.domain}`),
          type: "scatter",
          mode: "markers",
          marker: {
            color: mutations.map(m => m.type === "Deletion" ? "#ef4444" : "#0ea5e9"),
            size: 10,
            line: { color: "#ffffff", width: 1 },
          },
          hoverinfo: "text",
          name: "Mutations",
        },
      ]}
      layout={{
        title: { text: "EGFR Mutation Lollipop Chart (Cohort Alteration Frequencies)", font: { color: "#f3f4f6", size: 14 } },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { title: "Amino Acid Residue Position", range: [0, proteinLength + 20], gridcolor: "#1f2937", tickfont: { color: "#9ca3af" } },
        yaxis: { title: "Mutation Frequencies (Counts)", range: [-3, Math.max(...mutations.map(m => m.count)) + 3], gridcolor: "#1f2937", tickfont: { color: "#9ca3af" } },
        shapes: shapes,
        margin: { t: 50, b: 50, l: 50, r: 20 },
        height: 380,
      }}
      config={{ responsive: true }}
      className="w-full"
    />
  );
}

// 5. Kaplan-Meier Survival Curves
interface SurvivalPoint {
  time: number;
  survival: number;
}
export function SurvivalKmChart({ curves, pValue }: { curves: { [groupName: string]: SurvivalPoint[] }; pValue: number }) {
  if (!curves || Object.keys(curves).length === 0) return null;

  const colors = ["#0ea5e9", "#8b5cf6", "#10b981", "#ef4444"];
  const plotlyData = Object.entries(curves).map(([groupName, pts], idx) => {
    // Sort points by time
    const sorted = [...pts].sort((a, b) => a.time - b.time);
    
    return {
      x: sorted.map(p => p.time),
      y: sorted.map(p => p.survival),
      type: "scatter",
      mode: "lines",
      line: { shape: "hv", color: colors[idx % colors.length], width: 2.5 }, // 'hv' creates step line layout
      name: groupName,
    };
  });

  return (
    <Plot
      data={plotlyData}
      layout={{
        title: { text: `Kaplan-Meier Survival Estimation (Log-Rank p-value = ${pValue})`, font: { color: "#f3f4f6", size: 14 } },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        xaxis: { title: "Time in Days", gridcolor: "#1f2937", tickfont: { color: "#9ca3af" } },
        yaxis: { title: "Survival Probability", range: [0, 1.05], gridcolor: "#1f2937", tickfont: { color: "#9ca3af" } },
        margin: { t: 50, b: 50, l: 50, r: 20 },
        height: 380,
        legend: { font: { color: "#9ca3af" } },
      }}
      config={{ responsive: true }}
      className="w-full"
    />
  );
}
