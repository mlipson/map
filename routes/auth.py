"""Authentication routes for the Flatplan application."""

from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, session, redirect, url_for, render_template, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash
from flask_mail import Message

from extensions import users, mail, serializer
from forms import (
    LoginForm,
    RegistrationForm,
    PasswordResetRequestForm,
    PasswordResetForm,
)
from models.user import User

# Create blueprint
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Log in a user."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.get_by_email(form.email.data)

        if user is None:
            flash("No account found with that email address.")
            return redirect(url_for("auth.login"))

        # Check if user has a password (might be a new user from old system)
        if not user.password_hash:
            flash("Please set your password first.")
            # Generate a password reset token and redirect to password reset
            token = generate_reset_token(user.email)
            return redirect(url_for("auth.reset_password", token=token))

        # Check password
        if not user.check_password(form.password.data):
            flash("Invalid password.")
            return redirect(url_for("auth.login"))

        # Login user
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get("next")
        if not next_page or not next_page.startswith("/"):
            next_page = url_for("main.index")
        return redirect(next_page)

    return render_template("login.html", form=form)


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    """Register a new user."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = RegistrationForm()
    if form.validate_on_submit():
        # Check if user already exists
        existing_user = users.find_one({"email": form.email.data})

        if existing_user:
            # User exists but may not have password (from old system)
            if not existing_user.get("password_hash"):
                user = User(existing_user)
                password_hash = user.set_password(form.password.data)

                # Update user in database with password
                users.update_one(
                    {"_id": ObjectId(user.id)},
                    {"$set": {"password_hash": password_hash}},
                )

                flash("Your password has been set.")
                return redirect(url_for("auth.login"))
            else:
                flash("An account already exists with that email.")
                return redirect(url_for("auth.login"))

        # Create new user
        new_user = {
            "email": form.email.data,
            "password_hash": generate_password_hash(form.password.data),
            "created_at": datetime.now(timezone.utc),
        }

        result = users.insert_one(new_user)
        flash("Congratulations, you are now registered!")
        return redirect(url_for("auth.login"))

    return render_template("register.html", form=form)


@auth_bp.route("/logout")
def logout():
    """Log out a user by clearing their session."""
    if not current_user.is_authenticated:
        return redirect(url_for("main.index"))

    # Clear the session and log out the user
    logout_user()
    session.clear()
    return redirect(url_for("main.index"))


# Password reset email function
def send_password_reset_email(user_email):
    """Send a password reset email to the user."""
    token = generate_reset_token(user_email)
    reset_url = url_for("auth.reset_password", token=token, _external=True)

    msg = Message("Password Reset Request", recipients=[user_email])
    msg.body = f"""To reset your password, visit the following link: {reset_url}

If you did not make this request, simply ignore this email."""
    mail.send(msg)


@auth_bp.route("/reset_password_request", methods=["GET", "POST"])
def reset_password_request():
    """Request a password reset for the user."""
    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    form = PasswordResetRequestForm()
    if form.validate_on_submit():
        user_data = users.find_one({"email": form.email.data})
        if user_data:
            send_password_reset_email(form.email.data)
        flash("Check your email for instructions to reset your password.")
        return redirect(url_for("auth.login"))

    return render_template("reset_password_request.html", form=form)


@auth_bp.route("/reset_password/<token>", methods=["GET", "POST"])
def reset_password(token):
    """Reset the user's password."""
    if not token:
        flash("Invalid or expired token.")
        return redirect(url_for("auth.reset_password_request"))

    if current_user.is_authenticated:
        return redirect(url_for("main.index"))

    email = verify_reset_token(token)
    if not email:
        flash("The reset link is invalid or has expired.")
        return redirect(url_for("auth.reset_password_request"))

    form = PasswordResetForm()
    if form.validate_on_submit():
        user_data = users.find_one({"email": email})
        if not user_data:
            flash("User not found.")
            return redirect(url_for("main.index"))

        user = User(user_data)
        password_hash = user.set_password(form.password.data)

        users.update_one(
            {"_id": ObjectId(user.id)}, {"$set": {"password_hash": password_hash}}
        )

        flash("Your password has been reset.")
        return redirect(url_for("auth.login"))

    return render_template("reset_password.html", form=form, token=token)


# Password reset token functions
def generate_reset_token(email):
    """Generate a password reset token."""
    return serializer.dumps(email, salt="password-reset")


def verify_reset_token(token, expiration=3600):
    """Verify the password reset token."""
    try:
        email = serializer.loads(token, salt="password-reset", max_age=expiration)
    except:
        return None
    return email
