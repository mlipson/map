"""Configuration settings for the Flatplan application."""

import os


class Config:
    """Base configuration class for the application."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "default-dev-key")

    # MongoDB settings
    MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")

    # Flask-Mail settings
    MAIL_SERVER = "smtppro.zoho.com"
    MAIL_PORT = 465
    MAIL_USE_SSL = True
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "your-email@example.com")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "your-email-password")
    MAIL_DEFAULT_SENDER = os.environ.get(
        "MAIL_DEFAULT_SENDER", "your-email@example.com"
    )


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
