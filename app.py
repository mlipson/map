"""Flask app for Flatplan with MongoDB integration."""

import os
from datetime import datetime, timezone

from flask import Flask, request, session, redirect, url_for, render_template, jsonify
from werkzeug.utils import secure_filename
from bson import ObjectId
import pymongo


app = Flask(__name__)
app.secret_key = (
    "your-secret-key"  # Replace with environment-secured secret in production
)

# MongoDB setup
mongo_client = pymongo.MongoClient(os.environ.get("MONGODB_URI"))
db = mongo_client.get_database("flatplan")
users = db.users
layouts = db.layouts

app.config["UPLOAD_FOLDER"] = "uploads"
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


@app.route("/")
def home():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email")
    if not email:
        return "Email is required", 400

    user = users.find_one({"email": email})
    if not user:
        user_id = users.insert_one(
            {
                "email": email,
                "name": email.split("@")[0],
                "created_at": datetime.utcnow(),
            }
        ).inserted_id
        user = users.find_one({"_id": user_id})

    session["user_id"] = str(user["_id"])
    return redirect(url_for("account"))


@app.route("/account")
def account():
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("home"))

    user = users.find_one({"_id": ObjectId(user_id)})
    user_layouts = list(layouts.find({"account_id": ObjectId(user_id)}))
    return render_template("account.html", user=user, layouts=user_layouts)


@app.route("/layout/<layout_id>", methods=["GET", "POST"])
def view_layout(layout_id):
    """View and edit a layout."""
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("home"))

    layout_doc = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not layout_doc:
        return "Layout not found", 404

    if request.method == "POST":
        layout_data = request.json
        if not layout_data:
            return jsonify({"error": "No data provided"}), 400

        layouts.update_one(
            {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)},
            {
                "$set": {
                    "layout": layout_data,
                    "modified_date": datetime.now(timezone.utc),
                }
            },
        )
        return jsonify({"status": "updated"})

    items = layout_doc["layout"]

    # Add visible placeholder Page 0 if first real page is Page 1
    if items and items[0]["page_number"] == 1:
        items.insert(
            0,
            {
                "name": "—",
                "type": "placeholder",
                "section": "Start",
                "page_number": 0,
            },
        )

    for item in items:
        item["name"] = item.get("name", "").lower()

    return render_template(
        "layout.html", items=layout_doc["layout"], layout_id=layout_id
    )


if __name__ == "__main__":
    app.run(debug=True)
