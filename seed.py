import subprocess
import sys
import os

if __name__ == "__main__":
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))
    sys.exit(subprocess.call([sys.executable, "seed.py"]))
