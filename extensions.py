"""Shared extensions for the Flatplan application."""

import os
import pymongo
from flask_login import LoginManager
from flask_mail import Mail
from itsdangerous import URLSafeTimedSerializer

# Flask-Login setup
login_manager = LoginManager()
login_manager.login_view = "auth.login"

# Flask-Mail setup
mail = Mail()

# Token serializer for password reset
serializer = URLSafeTimedSerializer(os.environ.get("SECRET_KEY", "default-dev-key"))

# MongoDB setup
mongo_client = pymongo.MongoClient(
    os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
)
db = mongo_client.get_database("flatplan")
users = db.users
layouts = db.layouts
