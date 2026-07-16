"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const BIOAPI = "http://localhost:8009";

type GeneData = {
  gene: any;
  ensembl: any;
  protein: any;
  kegg_pathways: any;
  reactome_pathways: any;
  go_annotations: any;
  gdc_mutations: any;
  publications: any;
  clinical_trials: any;
  geo_datasets: any;
};

const BRAIN_GENES = ["EGFR", "IDH1", "TP53", "PTEN", "MGMT", "ATRX", "TERT", "CDKN2A", "RB1", "NF1"];

const sourceTag = (source: string) => {
  const colors: Record<string, string> = {
    "NCBI Gene": "#2196f3",
    "Ensembl": "#9c27b0",
    "UniProt": "#ff9800",
    "KEGG": "#4caf50",
    "Reactome": "#e91e63",
    "Gene Ontology (QuickGO)": "#00bcd4",
    "GDC": "#f44336",
    "PubMed": "#3f51b5",
    "ClinicalTrials.gov": "#8bc34a",
    "GEO": "#795548",
    "mock": "#607d8b",
    "cache": "#ffc107",
    "NeuroGen AI Aggregated Intelligence": "#6200ea",
  };
  const bg = colors[source] || "#607d8b";
  return (
    <span style={{ background: bg, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, marginLeft: 6 }}>
      {source === "mock" ? "OFFLINE FALLBACK" : source === "cache" ? "⚡ CACHED" : source}
    </span>
  );
};

export default function GeneIntelligencePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GeneData | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [cacheStats, setCacheStats] = useState<any>(null);

  const fetchIntelligence = async (symbol: string) => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const resp = await fetch(`${BIOAPI}/gene/intelligence?symbol=${symbol.trim().toUpperCase()}`);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      const result = await resp.json();
      setData(result);
      setActiveTab("overview");
    } catch (e: any) {
      setError(e.message || "Failed to fetch gene intelligence data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCacheStats = async () => {
    try {
      const resp = await fetch(`${BIOAPI}/cache/stats`);
      setCacheStats(await resp.json());
    } catch {}
  };

  const clearCache = async () => {
    await fetch(`${BIOAPI}/cache/clear`, { method: "DELETE" });
    setCacheStats(null);
    alert("Cache cleared successfully.");
  };

  useEffect(() => { fetchCacheStats(); }, [data]);

  const tabs = [
    { id: "overview", label: "🧬 Gene Overview" },
    { id: "protein", label: "🔬 Protein" },
    { id: "pathways", label: "🗺️ Pathways" },
    { id: "go", label: "🧪 Gene Ontology" },
    { id: "mutations", label: "🔴 Mutations" },
    { id: "papers", label: "📄 Publications" },
    { id: "trials", label: "🏥 Clinical Trials" },
    { id: "geo", label: "📊 GEO Datasets" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d1f3c 100%)", color: "#e0e7ff", fontFamily: "'Inter', sans-serif", padding: "0 0 60px 0" }}>
      
      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "16px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#a0b4c8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
          ← Dashboard
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, background: "linear-gradient(90deg, #7c3aed, #3b82f6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            🧬 Gene Intelligence Hub
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Live data from 10 authoritative biomedical APIs · Smart TTL caching</p>
        </div>
        {cacheStats && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, padding: "6px 14px", fontSize: 12 }}>
              ⚡ <strong>{cacheStats.total_cached_keys}</strong> cached queries
            </div>
            <button onClick={clearCache} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
              🗑 Clear Cache
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ maxWidth: 900, margin: "40px auto 0", padding: "0 24px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "#c4b5fd" }}>Search Any Gene</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchIntelligence(query)}
              placeholder="Enter gene symbol: EGFR, IDH1, TP53, PTEN, MGMT..."
              style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 18px", color: "#e0e7ff", fontSize: 15, outline: "none" }}
            />
            <button
              onClick={() => fetchIntelligence(query)}
              disabled={loading}
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none", color: "#fff", borderRadius: 10, padding: "12px 28px", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "🔄 Fetching..." : "🔍 Analyze"}
            </button>
          </div>

          {/* Quick select genes */}
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748b", marginRight: 4, lineHeight: "28px" }}>Quick search:</span>
            {BRAIN_GENES.map(g => (
              <button key={g} onClick={() => { setQuery(g); fetchIntelligence(g); }}
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)", color: "#c4b5fd", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* API Sources Grid */}
        {!data && !loading && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, color: "#64748b", marginBottom: 16 }}>Connected Biomedical APIs</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
              {[
                { name: "NCBI Gene", desc: "Gene IDs, sequences, annotations", icon: "🧬", color: "#2196f3" },
                { name: "GEO", desc: "Gene expression datasets", icon: "📊", color: "#795548" },
                { name: "TCGA / GDC", desc: "Clinical metadata, mutations", icon: "🏥", color: "#f44336" },
                { name: "PubMed", desc: "Research papers, abstracts", icon: "📄", color: "#3f51b5" },
                { name: "Ensembl", desc: "Genome coordinates, transcripts", icon: "🗂", color: "#9c27b0" },
                { name: "UniProt", desc: "Protein functions, domains", icon: "🔬", color: "#ff9800" },
                { name: "KEGG", desc: "Metabolic & signaling pathways", icon: "🗺️", color: "#4caf50" },
                { name: "Reactome", desc: "Signaling pathway data", icon: "🔗", color: "#e91e63" },
                { name: "Gene Ontology", desc: "Biological processes & functions", icon: "🧪", color: "#00bcd4" },
                { name: "ClinicalTrials.gov", desc: "Active trials, drugs, status", icon: "💊", color: "#8bc34a" },
              ].map(api => (
                <div key={api.name} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${api.color}33`, borderRadius: 12, padding: "16px", borderTop: `3px solid ${api.color}` }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{api.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: api.color, marginBottom: 4 }}>{api.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{api.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 24, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 20, color: "#fca5a5" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {data && (
          <div style={{ marginTop: 32 }}>
            {/* Gene Header Card */}
            <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15))", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)", borderRadius: 12, padding: "12px 20px", fontSize: 28, fontWeight: 900, color: "#fff", minWidth: 80, textAlign: "center" }}>
                  {data.gene?.symbol || query.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{data.gene?.full_name}</h2>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
                    Chr {data.gene?.chromosome} · {data.gene?.location} · Gene ID: {data.gene?.gene_id}
                    {sourceTag(data.gene?.source)}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "#cbd5e1", lineHeight: 1.6 }}>{data.gene?.summary}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ background: activeTab === tab.id ? "linear-gradient(135deg, #7c3aed, #3b82f6)" : "rgba(255,255,255,0.04)", border: activeTab === tab.id ? "none" : "1px solid rgba(255,255,255,0.1)", color: activeTab === tab.id ? "#fff" : "#94a3b8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Ensembl */}
                <div style={{ background: "rgba(156,39,176,0.08)", border: "1px solid rgba(156,39,176,0.25)", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#ce93d8" }}>🗂 Ensembl Coordinates {sourceTag(data.ensembl?.source)}</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: "#64748b" }}>Ensembl ID</span><br/><strong style={{ color: "#e0e7ff", fontFamily: "monospace" }}>{data.ensembl?.ensembl_id}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Biotype</span><br/><strong style={{ color: "#e0e7ff" }}>{data.ensembl?.biotype}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Start</span><br/><strong style={{ color: "#e0e7ff", fontFamily: "monospace" }}>{data.ensembl?.start?.toLocaleString()}</strong></div>
                    <div><span style={{ color: "#64748b" }}>End</span><br/><strong style={{ color: "#e0e7ff", fontFamily: "monospace" }}>{data.ensembl?.end?.toLocaleString()}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Strand</span><br/><strong style={{ color: "#e0e7ff" }}>{data.ensembl?.strand === 1 ? "+ (Forward)" : "− (Reverse)"}</strong></div>
                    <div><span style={{ color: "#64748b" }}>Assembly</span><br/><strong style={{ color: "#e0e7ff" }}>{data.ensembl?.assembly}</strong></div>
                  </div>
                </div>
                {/* Protein preview */}
                <div style={{ background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.25)", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#ffcc80" }}>🔬 Protein {sourceTag(data.protein?.source)}</h3>
                  <div style={{ fontSize: 13, color: "#e0e7ff", marginBottom: 8 }}>
                    <strong>{data.protein?.protein_name}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                    <span style={{ fontFamily: "monospace" }}>{data.protein?.accession}</span> · {data.protein?.length} aa
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{data.protein?.function?.slice(0, 180)}...</p>
                </div>
              </div>
            )}

            {/* Protein Tab */}
            {activeTab === "protein" && (
              <div style={{ background: "rgba(255,152,0,0.06)", border: "1px solid rgba(255,152,0,0.2)", borderRadius: 12, padding: 24 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#ffcc80" }}>UniProt Protein Record {sourceTag(data.protein?.source)}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20, fontSize: 13 }}>
                  <div><span style={{ color: "#64748b" }}>Accession</span><br/><strong style={{ color: "#fff", fontFamily: "monospace" }}>{data.protein?.accession}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Entry Name</span><br/><strong style={{ color: "#fff", fontFamily: "monospace" }}>{data.protein?.entry_name}</strong></div>
                  <div><span style={{ color: "#64748b" }}>Length</span><br/><strong style={{ color: "#fff" }}>{data.protein?.length} amino acids</strong></div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>FUNCTION</div>
                  <p style={{ margin: 0, fontSize: 14, color: "#e0e7ff", lineHeight: 1.7 }}>{data.protein?.function}</p>
                </div>
                {data.protein?.domains?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>PROTEIN DOMAINS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {data.protein.domains.map((d: string, i: number) => (
                        <span key={i} style={{ background: "rgba(255,152,0,0.15)", border: "1px solid rgba(255,152,0,0.3)", borderRadius: 6, padding: "4px 12px", fontSize: 12, color: "#ffcc80" }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pathways Tab */}
            {activeTab === "pathways" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* KEGG */}
                <div style={{ background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#a5d6a7" }}>🗺️ KEGG Pathways {sourceTag(data.kegg_pathways?.source)}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(data.kegg_pathways?.kegg_pathways || []).map((p: any, i: number) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 12px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#e0e7ff", fontFamily: "monospace", fontSize: 12 }}>{p.pathway_id}</span>
                        {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "#4caf50", fontSize: 11 }}>↗ KEGG</a>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Reactome */}
                <div style={{ background: "rgba(233,30,99,0.06)", border: "1px solid rgba(233,30,99,0.2)", borderRadius: 12, padding: 20 }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f48fb1" }}>🔗 Reactome Pathways {sourceTag(data.reactome_pathways?.source)}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(data.reactome_pathways?.reactome_pathways || []).map((p: any, i: number) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 12px" }}>
                        <div style={{ fontSize: 12, color: "#e0e7ff", marginBottom: 2 }}>{p.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{p.pathway_id}</span>
                          {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "#e91e63", fontSize: 11 }}>↗ Reactome</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* GO Tab */}
            {activeTab === "go" && (
              <div style={{ background: "rgba(0,188,212,0.06)", border: "1px solid rgba(0,188,212,0.2)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#80deea" }}>🧪 Gene Ontology Annotations {sourceTag(data.go_annotations?.source)}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(data.go_annotations?.go_annotations || []).map((ann: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "#00bcd4", minWidth: 100 }}>{ann.go_id}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "#e0e7ff" }}>{ann.go_name}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: ann.aspect === "molecular_function" ? "rgba(255,152,0,0.2)" : ann.aspect === "biological_process" ? "rgba(76,175,80,0.2)" : "rgba(33,150,243,0.2)", color: ann.aspect === "molecular_function" ? "#ffcc80" : ann.aspect === "biological_process" ? "#a5d6a7" : "#90caf9" }}>
                        {ann.aspect?.replace("_", " ")}
                      </span>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{ann.evidence}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mutations Tab */}
            {activeTab === "mutations" && (
              <div style={{ background: "rgba(244,67,54,0.06)", border: "1px solid rgba(244,67,54,0.2)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#ef9a9a" }}>🔴 GDC Somatic Mutations {sourceTag(data.gdc_mutations?.source)}</h3>
                <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Project: {data.gdc_mutations?.project}</p>
                {(data.gdc_mutations?.mutations || []).length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 14 }}>No mutations found in public GDC data for this gene in this project.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(data.gdc_mutations.mutations || []).map((m: any, i: number) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 13, color: "#ff8a80" }}>{m.change}</span>
                        <span style={{ fontSize: 12, background: "rgba(244,67,54,0.2)", borderRadius: 4, padding: "2px 8px", color: "#ffcdd2" }}>{m.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Publications Tab */}
            {activeTab === "papers" && (
              <div style={{ background: "rgba(63,81,181,0.06)", border: "1px solid rgba(63,81,181,0.2)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#9fa8da" }}>📄 PubMed Publications {sourceTag(data.publications?.source)}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(data.publications?.papers || []).map((p: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16 }}>
                      <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#7986cb", textDecoration: "none" }}>{p.title}</a>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                        {p.authors} · <em>{p.journal}</em> · {p.pub_date}
                        <span style={{ marginLeft: 10, fontFamily: "monospace", color: "#5c6bc0" }}>PMID: {p.pmid}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Trials Tab */}
            {activeTab === "trials" && (
              <div style={{ background: "rgba(139,195,74,0.06)", border: "1px solid rgba(139,195,74,0.2)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 16, color: "#c5e1a5" }}>🏥 ClinicalTrials.gov {sourceTag(data.clinical_trials?.source)}</h3>
                <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>{data.clinical_trials?.total} trials found for glioblastoma</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(data.clinical_trials?.trials || []).map((t: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <a href={t.url} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#aed581", textDecoration: "none" }}>{t.title}</a>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: t.status === "RECRUITING" ? "rgba(76,175,80,0.2)" : "rgba(100,116,139,0.2)", color: t.status === "RECRUITING" ? "#a5d6a7" : "#94a3b8" }}>{t.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {t.phase} · {t.sponsor} · <span style={{ fontFamily: "monospace", color: "#8bc34a" }}>{t.nct_id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GEO Datasets Tab */}
            {activeTab === "geo" && (
              <div style={{ background: "rgba(121,85,72,0.08)", border: "1px solid rgba(121,85,72,0.25)", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#d7ccc8" }}>📊 GEO Expression Datasets {sourceTag(data.geo_datasets?.source)}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(data.geo_datasets?.datasets || []).map((ds: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <strong style={{ color: "#bcaaa4", fontFamily: "monospace" }}>{ds.gse_id}</strong>
                        <span style={{ fontSize: 12, color: "#78909c" }}>{ds.samples} samples · {ds.platform}</span>
                      </div>
                      <div style={{ fontSize: 14, color: "#e0e7ff", marginBottom: 4 }}>{ds.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{ds.summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
