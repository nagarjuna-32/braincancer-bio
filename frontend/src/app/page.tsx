"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Brain, Activity, ShieldAlert, Users, Database, HelpCircle, ArrowRight, Dna, FileText } from "lucide-react";

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState("researcher");

  const roles = {
    researcher: {
      title: "Bioinformatics Researchers",
      desc: "Upload genomic raw data, map variant annotations, and run pathway crosstalk pipelines.",
      features: ["FASTA/FASTQ quality control", "Volcano expression heatmaps", "Pathway enrichment plotting"],
      icon: Dna,
    },
    professor: {
      title: "Supervising Professors",
      desc: "Review student pipeline logs, authorize publications, and manage team project boundaries.",
      features: ["Supervise sandbox research", "Audit logs & pipeline reviews", "Collaborative annotation tools"],
      icon: Users,
    },
    student: {
      title: "Bioinformatics Students",
      desc: "Learn clinical research methodologies, run simulated cohorts, and complete laboratory assignments.",
      features: ["Step-by-step pipeline guidance", "AI hypothesis generator", "Interactive bioinformatics quizzes"],
      icon: HelpCircle,
    },
    lab: {
      title: "Laboratory Managers",
      desc: "Organize raw clinical samples, track sequencing progress, and integrate with cloud storage.",
      features: ["Sample cohort tracking", "Automated batch processing", "S3 object storage connection"],
      icon: Database,
    },
    hospital: {
      title: "Hospital Research Departments",
      desc: "Manage de-identified patient data, study clinical outcomes, and map survival curves.",
      features: ["HIPAA compliant de-identification", "Kaplan-Meier survival curves", "Cohort clinical comparisons"],
      icon: ShieldAlert,
    },
  };

  const selectedRole = roles[activeRole as keyof typeof roles];
  const SelectedIcon = selectedRole.icon;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-brand-dark min-h-screen">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-teal/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-dark/60 border-b border-gray-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-teal to-brand-purple">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-outfit font-extrabold text-xl tracking-tight text-white">NeuroGen</span>
            <span className="font-outfit font-light text-xl tracking-tight text-brand-teal"> AI</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-300 hover:text-white transition font-medium text-sm">
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-teal to-brand-emerald text-white font-medium text-sm hover:opacity-90 transition shadow-lg shadow-brand-teal/20"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 grid lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/30 text-brand-teal font-medium text-xs w-fit">
            <Activity className="w-3.5 h-3.5" />
            AI-Powered Brain Cancer Bioinformatics Platform
          </div>

          <h1 className="font-outfit font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
            Decoding Brain Cancer Genomes via{" "}
            <span className="text-gradient-teal">Bio-Computation</span> &{" "}
            <span className="text-gradient-purple">AI</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl font-light leading-relaxed max-w-xl">
            Empowering researchers, professors, and clinics to analyze genomic sequences, transcriptomic pathways, and patient survival metrics through a secure web application.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-purple text-white font-semibold hover:opacity-95 transition shadow-xl shadow-brand-teal/15 flex items-center justify-center gap-2 group"
            >
              Enter Platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 font-semibold hover:bg-gray-800/80 transition flex items-center justify-center gap-2"
            >
              Register Workspace
            </Link>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-6 border-t border-gray-800/80 pt-10 mt-6">
            <div>
              <div className="font-outfit font-extrabold text-2xl text-white">4.2B+</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Bases Sequenced</div>
            </div>
            <div>
              <div className="font-outfit font-extrabold text-2xl text-white">12,400+</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Patient Cohorts</div>
            </div>
            <div>
              <div className="font-outfit font-extrabold text-2xl text-white">99.8%</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Pipeline Accuracy</div>
            </div>
          </div>
        </div>

        {/* Hero Right Visual: Brain Scanner SVG */}
        <div className="lg:col-span-5 flex justify-center relative">
          <div className="w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] rounded-full relative bg-slate-900/40 border border-gray-800/50 backdrop-blur-sm flex items-center justify-center animate-float">
            {/* Glowing outer rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-brand-teal/20 animate-spin [animation-duration:120s]"></div>
            <div className="absolute inset-6 rounded-full border border-double border-brand-purple/20 animate-spin [animation-duration:60s] [animation-direction:reverse]"></div>
            <div className="absolute inset-16 rounded-full bg-gradient-to-tr from-brand-teal/5 to-brand-purple/5 blur-md"></div>

            {/* Neural Brain SVG Graphic */}
            <svg className="w-[70%] h-[70%] relative z-10" viewBox="0 0 100 100" fill="none">
              {/* Brain outline / pathways */}
              <path
                d="M50,15 C40,15 32,22 32,32 C32,36 34,39 36,42 C30,46 26,52 26,60 C26,72 36,80 46,80 C48,80 50,78 50,75 L50,15 Z"
                stroke="#0ea5e9"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-80"
              />
              <path
                d="M50,15 C60,15 68,22 68,32 C68,36 66,39 64,42 C70,46 74,52 74,60 C74,72 64,80 54,80 C52,80 50,78 50,75 L50,15 Z"
                stroke="#8b5cf6"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-80"
              />
              
              {/* Pulsing hotspots / nodes */}
              <circle cx="42" cy="30" r="3" fill="#0ea5e9" className="animate-ping" style={{ transformOrigin: "42px 30px" }} />
              <circle cx="42" cy="30" r="2" fill="#0ea5e9" />
              
              <circle cx="58" cy="45" r="3.5" fill="#8b5cf6" className="animate-ping" style={{ transformOrigin: "58px 45px" }} />
              <circle cx="58" cy="45" r="2.5" fill="#8b5cf6" />
              
              <circle cx="36" cy="55" r="3" fill="#10b981" className="animate-ping" style={{ transformOrigin: "36px 55px" }} />
              <circle cx="36" cy="55" r="2" fill="#10b981" />

              <circle cx="64" cy="65" r="3" fill="#d946ef" className="animate-ping" style={{ transformOrigin: "64px 65px" }} />
              <circle cx="64" cy="65" r="2" fill="#d946ef" />

              {/* Connecting networks */}
              <line x1="42" y1="30" x2="50" y2="40" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="1 2" />
              <line x1="58" y1="45" x2="50" y2="40" stroke="#8b5cf6" strokeWidth="0.5" strokeDasharray="1 2" />
              <line x1="36" y1="55" x2="50" y2="60" stroke="#10b981" strokeWidth="0.5" strokeDasharray="1 2" />
              <line x1="64" y1="65" x2="50" y2="60" stroke="#d946ef" strokeWidth="0.5" strokeDasharray="1 2" />
              <line x1="50" y1="40" x2="50" y2="60" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
            </svg>
            
            {/* Floating metrics tags */}
            <div className="absolute top-10 right-[-30px] px-3 py-1.5 rounded-lg glass-card text-xs flex items-center gap-1.5 border border-brand-purple/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse"></span>
              EGFRvIII Amplified
            </div>
            <div className="absolute bottom-12 left-[-30px] px-3 py-1.5 rounded-lg glass-card text-xs flex items-center gap-1.5 border border-brand-teal/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse"></span>
              IDH1 R132H Mutant
            </div>
          </div>
        </div>
      </main>

      {/* Stakeholders Walkthrough Panel */}
      <section className="bg-slate-950/60 border-t border-gray-900 py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-12">
          <div className="text-center flex flex-col gap-3">
            <h2 className="font-outfit font-extrabold text-3xl sm:text-4xl text-white">
              Built for the Entire Research Ecosystem
            </h2>
            <p className="text-gray-400 max-w-xl font-light">
              NeuroGen AI connects laboratory pipelines, data analysts, supervising researchers, and clinics under a unified collaborative workspace.
            </p>
          </div>

          {/* Interactive Role Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(roles).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                className={`px-5 py-3 rounded-xl border text-sm font-semibold transition ${
                  activeRole === r
                    ? "bg-gradient-to-r from-brand-teal to-brand-purple text-white border-transparent shadow-lg shadow-brand-teal/10"
                    : "bg-slate-900/60 border-gray-800 text-gray-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="w-full max-w-3xl rounded-2xl glass-card p-8 sm:p-10 grid sm:grid-cols-12 gap-8 items-center border border-gray-800/80">
            <div className="sm:col-span-8 flex flex-col gap-4">
              <h3 className="font-outfit font-bold text-2xl text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
                  <SelectedIcon className="w-6 h-6" />
                </div>
                {selectedRole.title}
              </h3>
              <p className="text-gray-400 text-base leading-relaxed font-light">
                {selectedRole.desc}
              </p>
              
              <ul className="flex flex-col gap-2 mt-2">
                {selectedRole.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-teal"></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-4 flex justify-center sm:justify-end">
              <Link
                href="/register"
                className="px-6 py-4 rounded-xl bg-slate-900 border border-gray-800 hover:border-brand-teal/40 text-white font-bold transition flex items-center gap-2 group whitespace-nowrap"
              >
                Join as {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition text-brand-teal" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-10 px-6 text-center text-gray-500 text-sm bg-brand-dark mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-teal" />
            <span className="font-outfit font-extrabold text-white">NeuroGen AI</span>
          </div>
          <div>© 2026 NeuroGen AI Bioinformatics. All rights reserved. Built for Clinical Brain Tumors Genomics.</div>
        </div>
      </footer>
    </div>
  );
}
