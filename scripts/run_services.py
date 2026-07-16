import os
import sys
import time
import subprocess
import signal

# Define backend root relative to this script
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
LOG_DIR = os.path.join(BACKEND_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

# List of services to run: (Name, file relative to backend, port)
SERVICES = [
    ("auth", "services/auth/main.py", 8001),
    ("project", "services/project/main.py", 8002),
    ("dataset", "services/dataset/main.py", 8003),
    ("analysis", "services/analysis/main.py", 8004),
    ("ai", "services/ai/main.py", 8005),
    ("bioinformatics", "services/bioinformatics/main.py", 8006),
    ("reports", "services/reports/main.py", 8007),
    ("notification", "services/notification/main.py", 8008),
    ("gateway", "gateway/main.py", 8000)
]

processes = []

def cleanup(sig=None, frame=None):
    print("\n[NeuroGen System] Shutting down all services...")
    for name, proc in processes:
        print(f"[NeuroGen System] Stopping {name} (PID: {proc.pid})...")
        try:
            # On Windows, we can use taskkill or terminate
            proc.terminate()
            proc.wait(timeout=2.0)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
    print("[NeuroGen System] All services stopped. Goodbye!")
    sys.exit(0)

# Register signals for graceful exit
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    print("==========================================================")
    print("   NeuroGen AI - Microservice Launcher (Local Mode)       ")
    print("==========================================================")
    print(f"Working Directory: {BACKEND_DIR}")
    print(f"Log Directory: {LOG_DIR}\n")

    for name, path_rel, port in SERVICES:
        # Convert path to module syntax, e.g. services.auth.main:app
        module_path = path_rel.replace(".py", "").replace("/", ".") + ":app"
        log_file_path = os.path.join(LOG_DIR, f"{name}.log")
        
        print(f"[NeuroGen System] Starting {name:15} on http://localhost:{port} -> Logging to {name}.log")
        
        # Open log file
        log_file = open(log_file_path, "w")
        
        # Prepare environment
        env = os.environ.copy()
        env["PYTHONPATH"] = BACKEND_DIR
        
        # Start uvicorn subprocess
        # Use python -m uvicorn to ensure it loads in the python environment
        cmd = [
            sys.executable, "-m", "uvicorn", 
            module_path, 
            "--host", "0.0.0.0", 
            "--port", str(port)
        ]
        
        # Run process
        proc = subprocess.Popen(
            cmd,
            cwd=BACKEND_DIR,
            stdout=log_file,
            stderr=subprocess.STDOUT,
            env=env
        )
        processes.append((name, proc))
        
    print("\n[NeuroGen System] All services launched successfully!")
    print("[NeuroGen System] Gateway is active at http://localhost:8000")
    print("[NeuroGen System] Press Ctrl+C to terminate all services.\n")
    
    # Keep main thread alive
    while True:
        try:
            time.sleep(1)
            # Check if any process died
            for name, proc in processes:
                poll = proc.poll()
                if poll is not None:
                    print(f"[Warning] Service {name} has terminated with exit code {poll}. Check logs/ for details.")
                    processes.remove((name, proc))
        except (KeyboardInterrupt, SystemExit):
            cleanup()
            break

if __name__ == "__main__":
    main()
