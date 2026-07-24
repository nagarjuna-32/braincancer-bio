import os
import sys
import time
import subprocess
import signal

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
LOG_DIR = os.path.join(BACKEND_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

processes = []

def cleanup(sig=None, frame=None):
    print("\n[NeuroGen System] Shutting down monolithic server...")
    for name, proc in processes:
        print(f"[NeuroGen System] Stopping {name} (PID: {proc.pid})...")
        try:
            proc.terminate()
            proc.wait(timeout=2.0)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
    print("[NeuroGen System] Service stopped. Goodbye!")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    print("==========================================================")
    print("   NeuroGen AI - Unified Monolithic Launcher             ")
    print("==========================================================")
    print(f"Working Directory: {BACKEND_DIR}")
    print(f"Log Directory: {LOG_DIR}\n")

    log_file_path = os.path.join(LOG_DIR, "unified_backend.log")
    print(f"[NeuroGen System] Starting Unified Backend Engine on http://localhost:8000 -> Logging to unified_backend.log")
    
    log_file = open(log_file_path, "w")
    env = os.environ.copy()
    env["PYTHONPATH"] = BACKEND_DIR
    
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "main:app", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ]
    
    proc = subprocess.Popen(
        cmd,
        cwd=BACKEND_DIR,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        env=env
    )
    processes.append(("unified_backend", proc))
    
    print("\n[NeuroGen System] Unified backend engine launched successfully!")
    print("[NeuroGen System] API Gateway & Routers active at http://localhost:8000")
    print("[NeuroGen System] Press Ctrl+C to terminate server.\n")
    
    while True:
        try:
            time.sleep(1)
            poll = proc.poll()
            if poll is not None:
                print(f"[Warning] Unified backend server terminated with exit code {poll}. Check logs/unified_backend.log for details.")
                break
        except KeyboardInterrupt:
            cleanup()
            break

if __name__ == "__main__":
    main()
