"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Mail, Lock, ArrowRight, Globe, AlertCircle, Loader } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      // Store credentials and user profile
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      // Simulate Google OAuth flow by generating a mock token and passing to Auth service
      const mockGoogleToken = `google_oauth_token_${Math.random().toString(36).substring(2, 15)}`;
      
      const response = await fetch("http://localhost:8000/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: mockGoogleToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Google Login failed.");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google Login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = () => {
    localStorage.setItem("token", "demo_token_2026");
    localStorage.setItem("user", JSON.stringify({
      id: 1,
      email: "demo.researcher@neurogen.ai",
      full_name: "Dr. Nagarjuna N (Demo)",
      role: "Researcher",
      organization_id: 1
    }));
    router.push("/dashboard");
  };

  return (
    <div className="flex-1 min-h-screen bg-brand-dark flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[-15%] w-[45%] h-[45%] rounded-full bg-brand-teal/5 blur-[100px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[45%] h-[45%] rounded-full bg-brand-purple/5 blur-[100px] pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-tr from-brand-teal to-brand-purple">
            <Brain className="w-7 h-7 text-white" />
          </Link>
          <h2 className="font-outfit font-extrabold text-2xl text-white mt-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm font-light">Access your NeuroGen clinical workspace</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border border-gray-800/80">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg glass-input text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <Link href="#" className="text-xs text-brand-teal hover:underline font-medium">Forgot?</Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
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
              className="mt-2 w-full py-3 rounded-lg bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-95 text-white font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-teal/10 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 border-t border-gray-800 -translate-y-1/2"></span>
            <span className="relative bg-brand-card px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider z-10">or</span>
          </div>

          {/* Google sign-in */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 rounded-lg bg-slate-900 border border-gray-800 hover:bg-slate-800/80 text-gray-200 font-semibold transition flex items-center justify-center gap-3 text-sm disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader className="w-4 h-4 animate-spin text-brand-teal" />
            ) : (
              <>
                <Globe className="w-4 h-4 text-red-500" />
                Sign in with Google
              </>
            )}
          </button>

          {/* Demo login */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 text-white font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-purple/10"
          >
            Explore Demo Workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-teal hover:underline font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
