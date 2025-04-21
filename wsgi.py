"""WSGI config for the Flask application."""

import os
from app import app

if __name__ == "__main__":
    PORT = int(os.getenv("PORT", "8080"))
    DEBUG = os.getenv("DEBUG", "False").lower() in ["true", "1", "t"]
    app.run(port=PORT, debug=DEBUG)
