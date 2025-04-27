"""Main routes for the Flatplan application."""

from bson import ObjectId
from flask import Blueprint, session, redirect, url_for, render_template, jsonify
from flask_login import login_required, current_user

from extensions import users, layouts

# Create blueprint
main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    """Display the home page or redirect to account."""
    if current_user.is_authenticated:
        return redirect(url_for("main.account"))
    return render_template("index.html")


@main_bp.route("/account")
def account():
    """Display the user's account page with their layouts."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("main.index"))

    user = users.find_one({"_id": ObjectId(user_id)})
    user_layouts = list(layouts.find({"account_id": ObjectId(user_id)}))
    return render_template("account.html", user=user, layouts=user_layouts)


@main_bp.route("/session")
def session_info():
    """Return the current session information as JSON."""
    return jsonify(dict(session))
