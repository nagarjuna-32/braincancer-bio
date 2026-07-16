"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, LogOut, Plus, FolderGit2, HardDrive, Cpu, FileCheck, Calendar, Bell, Loader, User2, MessageSquareText, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Project State
  const [showModal, setShowModal] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      router.push("/login");
      return;
    }

    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      let projData = [];
      let notifData = [];
      
      try {
        // Fetch projects
        const projResp = await fetch("http://localhost:8000/api/v1/projects/projects", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (projResp.ok) {
          projData = await projResp.json();
        }
      } catch (err) {
        console.error("Error loading projects, loading demo fallback", err);
      }

      try {
        // Fetch notifications
        const notifResp = await fetch("http://localhost:8000/api/v1/notifications/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (notifResp.ok) {
          notifData = await notifResp.json();
        }
      } catch (err) {
        console.error("Error loading notifications, loading demo fallback", err);
      }

      if (projData.length === 0 || token === "demo_token_2026") {
        projData = [
          {
            id: 4,
            name: "Glioblastoma EGFRvIII Clinical Study",
            description: "Mapping downstream PI3K/mTOR pathways in patient cohorts STR-04...",
            created_at: new Date().toISOString(),
            role: "Owner"
          },
          {
            id: 5,
            name: "Diffuse Astrocytoma IDH1/TP53 Mapping",
            description: "Longitudinal clinical study evaluating Kaplan-Meier survival curves in secondary glioma cohorts.",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            role: "Supervise"
          }
        ];
      }

      if (notifData.length === 0 || token === "demo_token_2026") {
        notifData = [
          {
            id: 1,
            title: "Variant Calling Pipeline Complete",
            message: "GATK somatic calling for tumor sample STR_04 completed successfully. 84 variants annotated.",
            is_read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            title: "FASTQ Quality Check Complete",
            message: "Reads quality metrics processed. Average Phred score: 34.2.",
            is_read: true,
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
      }

      setProjects(projData);
      setNotifications(notifData);
      setLoading(false);
    };

    fetchData();
  }, [token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !token) return;

    setCreateLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/projects/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: projName, description: projDesc })
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const newProj = await response.json();
      setProjects([newProj, ...projects]);
      setProjName("");
      setProjDesc("");
      setShowModal(false);

      // Trigger audit log internally
      fetch("http://localhost:8000/api/v1/notifications/audit-logs", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
         },
         body: JSON.stringify({
            action: `Created Project: ${newProj.name}`,
            target_type: "Project",
            target_id: newProj.id
         })
      }).catch(e => console.log("Audit log failed"));

    } catch (err) {
      alert("Could not create project. Verify gateway connection.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (!user || loading) {
    return (
      <div className="flex-1 min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-10 h-10 animate-spin text-brand-teal" />
          <span className="text-gray-400 text-sm font-medium">Authorizing clinical session...</span>
        </div>
      </div>
    );
  }

  // Calculate some counts
  const totalDatasets = projects.length * 2; // Simulated metrics
  const completedAnalyses = projects.length * 3;
  const reportsCount = projects.length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-brand-dark text-gray-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-brand-dark/60 border-b border-gray-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-brand-teal to-brand-purple">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-outfit font-extrabold text-lg text-white">NeuroGen</span>
            <span className="font-outfit font-light text-lg text-brand-teal"> AI</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Notifications count */}
          <div className="relative group cursor-pointer p-1.5 rounded-lg hover:bg-slate-900 transition">
            <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-brand-purple rounded-full"></span>
            )}
          </div>

          {/* Profile widget */}
          <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
            <div className="w-8 h-8 rounded-full bg-slate-950/60 border border-gray-800 flex items-center justify-center text-brand-teal">
              <User2 className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-semibold text-white leading-none">{user.full_name}</span>
              <span className="text-xs text-gray-500 mt-1 leading-none">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-950/30 hover:text-red-400 text-gray-500 transition ml-2"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
        
        {/* Welcome Banner */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800/80 pb-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-outfit font-extrabold text-3xl text-white">Research Workspace</h2>
            <p className="text-gray-400 text-sm font-light">Welcome back, {user.full_name.split(" ")[0]}. Monitor active tumor bioinformatics pipelines.</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-teal to-brand-emerald text-white text-sm font-bold shadow-lg shadow-brand-teal/15 flex items-center gap-2 hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4" />
            New Research Project
          </button>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 border border-gray-800/80 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-teal/10 text-brand-teal">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-outfit font-extrabold text-white">{projects.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">Projects</div>
            </div>
          </div>
          <div className="glass-card p-5 border border-gray-800/80 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purple">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-outfit font-extrabold text-white">{totalDatasets}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">Uploaded Datasets</div>
            </div>
          </div>
          <div className="glass-card p-5 border border-gray-800/80 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-emerald/10 text-brand-emerald">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-outfit font-extrabold text-white">{completedAnalyses}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">Analyses run</div>
            </div>
          </div>
          <div className="glass-card p-5 border border-gray-800/80 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-pink/10 text-brand-pink">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-outfit font-extrabold text-white">{reportsCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-0.5">Reports exported</div>
            </div>
          </div>
        </section>

        {/* Lower layout: Projects list (left) & notifications (right) */}
        <section className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Projects Panel */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <h3 className="font-outfit font-extrabold text-xl text-white flex items-center gap-2">
              Recent Projects
            </h3>
            
            {projects.length === 0 ? (
              <div className="glass-card p-12 text-center flex flex-col items-center gap-4 border border-gray-800/80">
                <div className="p-4 rounded-full bg-slate-900 text-gray-500">
                  <FolderGit2 className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-white">No research projects yet</h4>
                  <p className="text-gray-400 text-sm font-light">Create a project workspace to start running genome pipelines.</p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-2 px-4 py-2.5 rounded-lg bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-sm font-bold text-white transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-brand-teal" />
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div key={proj.id} className="glass-card p-6 flex flex-col justify-between min-h-[170px] border border-gray-800/80">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-outfit font-bold text-lg text-white group-hover:text-brand-teal transition">
                          {proj.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-brand-teal/10 text-brand-teal border border-brand-teal/20 text-[10px] uppercase font-bold tracking-wider">
                          {proj.role}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm font-light line-clamp-2">
                        {proj.description || "No project description provided."}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-6 border-t border-gray-850 pt-4">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(proj.created_at).toLocaleDateString()}
                      </span>
                      
                      <Link
                        href={`/project/${proj.id}`}
                        className="text-xs font-bold text-brand-teal hover:text-brand-teal/80 transition flex items-center gap-1"
                      >
                        Open Workspace
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side panel: Activity & Notifications */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <h3 className="font-outfit font-extrabold text-xl text-white flex items-center gap-2">
              System Alerts
            </h3>

            <div className="glass-card p-6 border border-gray-800/80 flex flex-col gap-5">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500 font-light">
                  No active system alerts or pipeline notifications.
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="flex gap-3 border-b border-gray-850 pb-3 last:border-0 last:pb-0">
                      <div className="p-2 rounded-lg bg-slate-950 border border-gray-800 text-brand-purple shrink-0 self-start">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="font-semibold text-xs text-white leading-tight">{notif.title}</div>
                        <div className="text-[11px] text-gray-400 leading-normal font-light">{notif.message}</div>
                        <span className="text-[9px] text-gray-500 mt-1">{new Date(notif.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick helper tip */}
            <div className="glass-card p-5 border border-brand-purple/20 bg-brand-purple/5 flex gap-3.5">
              <MessageSquareText className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <div className="font-bold text-xs text-white">Did you know?</div>
                <p className="text-[11px] text-gray-400 leading-normal font-light">
                  You can upload raw sequencing reads (FASTQ) and click **Analyze QC** to plot Phred quality metrics using the local bioinformatics engine.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-card p-6 border border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-outfit font-extrabold text-xl text-white mb-2">Create Research Workspace</h3>
            <p className="text-gray-400 text-xs font-light mb-6">Initialize a new brain cancer research workspace for collaborative data analysis.</p>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="Glioblastoma EGFRvIII Clinical Study"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  placeholder="Mapping downstream PI3K/mTOR pathways in patient cohorts STR-04..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="glass-input text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-gray-800 text-gray-300 font-semibold text-xs hover:bg-slate-800/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-teal to-brand-purple text-white font-bold text-xs hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createLoading ? (
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Initialize Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
