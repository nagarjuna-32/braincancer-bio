/**
 * API base URL resolver.
 * Dynamically switches between the online gateway deployment and local runtimes.
 */
export const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable set at build time
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Client-side runtime domain detection (e.g. Vercel deployment)
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://neurogen-backend-c15o.onrender.com";
  }
  
  // 3. Local fallback
  return "http://localhost:8000";
};

// Dynamic string evaluator so `${API_BASE_URL}` executes getApiBaseUrl() at runtime
export const API_BASE_URL = {
  toString: () => getApiBaseUrl(),
  valueOf: () => getApiBaseUrl()
};
