import os
import sys
import time
import signal
import subprocess

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend")
)

process = None


def cleanup(sig=None, frame=None):
    global process

    print("\n[NeuroGen] Shutting down...")

    if process and process.poll() is None:
        process.terminate()

        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()

    print("[NeuroGen] Server stopped.")
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)


def main():
    global process

    port = os.environ.get("PORT", "8000")

    print("=" * 60)
    print(" NeuroGen AI - Unified Backend")
    print("=" * 60)
    print(f"Backend Directory : {BACKEND_DIR}")
    print(f"Port              : {port}")
    print()

    env = os.environ.copy()
    env["PYTHONPATH"] = BACKEND_DIR

    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(port),
    ]

    process = subprocess.Popen(
        cmd,
        cwd=BACKEND_DIR,
        env=env,
    )

    print(f"[NeuroGen] Backend started on port {port}")

    try:
        while True:
            exit_code = process.poll()

            if exit_code is not None:
                print(f"\n[ERROR] Backend exited with code {exit_code}")
                sys.exit(exit_code)

            time.sleep(1)

    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
