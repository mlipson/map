"""Initialize required directory structure for the application."""

import os

def ensure_directories_exist():
    """Create the required directory structure if it doesn't already exist."""
    directories = [
        "models",
        "routes",
        "utils",
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        # Create __init__.py file in each directory
        init_file = os.path.join(directory, "__init__.py")
        if not os.path.exists(init_file):
            with open(init_file, "w") as f:
                f.write(f'"""Initializes the {directory} package."""\n')

if __name__ == "__main__":
    ensure_directories_exist()
    print("Directory structure initialized successfully.")
