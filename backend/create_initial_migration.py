
import subprocess
import sys

def main():

    try:
        result = subprocess.run(
            [
                sys.executable, "-m", "alembic",
                "revision",
                "--autogenerate",
                "-m", "initial_schema"
            ],
            check=True,
            capture_output=True,
            text=True
        )



    except subprocess.CalledProcessError as e:
        sys.exit(1)

if __name__ == "__main__":
    main()
