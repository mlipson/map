"""Email utility functions for the Flatplan application."""

from flask import url_for
from flask_mail import Message

from extensions import mail
from routes.auth import generate_reset_token


def send_password_reset_email(user_email):
    """Send a password reset email to the user."""
    token = generate_reset_token(user_email)
    reset_url = url_for("auth.reset_password", token=token, _external=True)

    msg = Message("Password Reset Request", recipients=[user_email])
    msg.body = f"""To reset your password, visit the following link: {reset_url}

If you did not make this request, simply ignore this email."""
    mail.send(msg)
