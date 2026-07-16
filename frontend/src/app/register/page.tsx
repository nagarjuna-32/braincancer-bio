"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, User, Mail, Lock, Building, ArrowRight, AlertCircle, Loader, ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("Researcher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          organization_name: orgName || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      // Store credentials and redirect to dashboard
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-brand-dark flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[-15%] w-[45%] h-[45%] rounded-full bg-brand-teal/5 blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[45%] h-[45%] rounded-full bg-brand-purple/5 blur-[100px] pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-lg flex flex-col gap-6 relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-tr from-brand-teal to-brand-purple">
            <Brain className="w-7 h-7 text-white" />
          </Link>
          <h2 className="font-outfit font-extrabold text-2xl text-white mt-2">Create Workspace Account</h2>
          <p className="text-gray-400 text-sm font-light font-outfit">Join the global brain cancer research network</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border border-gray-800/80">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            {/* Grid for Name and Email */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Nagarjuna N"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Grid for Org and Role */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Organization */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Organization (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Harvard Medical"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-sm"
                  />
                </div>
              </div>

              {/* Platform Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Workspace Role</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <ShieldAlert className="w-4 h-4" />
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-sm appearance-none cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="Researcher">Researcher (Bioinformatics)</option>
                    <option value="Professor">Professor (Supervisor)</option>
                    <option value="Student">Student (Learning)</option>
                    <option value="Lab">Laboratory Manager</option>
                    <option value="Hospital">Clinical Hospital Dept.</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-lg bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-95 text-white font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-teal/15 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Register Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 font-outfit">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-teal hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
