"""User model for Flask-Login integration."""

from datetime import datetime, timezone
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import users


class User(UserMixin):
    """User class for Flask-Login."""

    def __init__(self, user_data):
        self.id = str(user_data["_id"])
        self.email = user_data["email"]
        self.password_hash = user_data.get("password_hash", None)
        self.created_at = user_data.get("created_at", datetime.now(timezone.utc))

    def check_password(self, password):
        """Check if the password matches the stored hash."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def set_password(self, password):
        """Generate and save password hash."""
        self.password_hash = generate_password_hash(password)
        return self.password_hash

    @staticmethod
    def get_by_email(email):
        """Find a user by email address."""
        user_data = users.find_one({"email": email})
        return User(user_data) if user_data else None
