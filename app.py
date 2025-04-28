"""Main application file for Flatplan with MongoDB integration."""

import os
from datetime import datetime, timezone
from flask import Flask
from flask_login import LoginManager
from flask_mail import Mail

from dotenv import load_dotenv

# Import modules
from config import Config
from models.user import User
from extensions import mail, login_manager, serializer
from extensions import mongo_client, db, users, layouts

# Import blueprints
from routes.auth import auth_bp
from routes.layout import layout_bp
from routes.main import main_bp
from routes.api import api_bp

load_dotenv()


def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    login_manager.init_app(app)
    mail.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(layout_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)

    # Setup error handlers
    @app.errorhandler(404)
    def page_not_found(e):
        from flask import render_template

        return render_template("404.html"), 404

    return app


# Create the Flask application instance
app = create_app()


# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    from bson import ObjectId

    user_data = users.find_one({"_id": ObjectId(user_id)})
    return User(user_data) if user_data else None


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("FLASK_RUN_PORT", 8080)))
