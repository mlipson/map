"""Flask app for Flatplan with MongoDB integration."""

import os
import json
from datetime import datetime, timezone

from flask import (
    Flask,
    request,
    session,
    redirect,
    url_for,
    render_template,
    jsonify,
    flash,
)
from werkzeug.utils import secure_filename
from bson import ObjectId
import pymongo


app = Flask(__name__)
app.secret_key = (
    "your-secret-key"  # Replace with environment-secured secret in production
)

# MongoDB setup
mongo_client = pymongo.MongoClient(
    os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
)
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
        if request.files and "file" in request.files:
            # Handle file upload
            file = request.files["file"]
            if file and file.filename.endswith(".json"):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                file.save(file_path)

                try:
                    with open(file_path, "r") as f:
                        layout_data = json.load(f)

                    # Update layout with new data
                    layouts.update_one(
                        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)},
                        {
                            "$set": {
                                "layout": layout_data,
                                "modified_date": datetime.now(timezone.utc),
                            }
                        },
                    )
                    return redirect(url_for("view_layout", layout_id=layout_id))
                except Exception as e:
                    return f"Error processing JSON: {str(e)}", 400

            return "Invalid file format, please upload a JSON file", 400

        # Handle JSON data from AJAX
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
        "layout.html",
        items=layout_doc["layout"],
        layout_id=layout_id,
        layout_doc=layout_doc,  # Pass the entire layout document to the template
    )


@app.route("/create_layout", methods=["GET", "POST"])
def create_layout():
    """Create a new layout."""
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("home"))

    if request.method == "POST":
        publication = request.form.get("publication_name")
        issue = request.form.get("issue_name")
        pub_date = request.form.get("publication_date")

        if not all([publication, issue]):
            return "Publication name and issue are required", 400

        # Create a new empty layout
        layout_id = layouts.insert_one(
            {
                "account_id": ObjectId(user_id),
                "publication_name": publication,
                "issue_name": issue,
                "publication_date": pub_date,
                "modified_date": datetime.now(timezone.utc),
                "layout": [],  # Start with empty layout
            }
        ).inserted_id

        return redirect(url_for("view_layout", layout_id=layout_id))

    return render_template("create_layout.html")


@app.route("/api/page/<layout_id>", methods=["POST"])
def add_page(layout_id):
    """API endpoint to add a new page to a layout."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    layout_doc = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not layout_doc:
        return jsonify({"error": "Layout not found"}), 404

    page_data = request.json
    if not page_data:
        return jsonify({"error": "No page data provided"}), 400

    # Add an ID to the page data if not present
    if "id" not in page_data:
        page_data["id"] = f"page-{int(datetime.now().timestamp())}"

    # Get the layout's current pages
    current_layout = layout_doc["layout"]

    # Add the new page
    current_layout.append(page_data)

    # Update the layout in the database
    layouts.update_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)},
        {
            "$set": {
                "layout": current_layout,
                "modified_date": datetime.now(timezone.utc),
            }
        },
    )

    return jsonify({"status": "added", "page_id": page_data["id"]})


@app.route("/api/page/<layout_id>/<page_id>", methods=["PUT", "DELETE"])
def manage_page(layout_id, page_id):
    """API endpoint to update or delete a page in a layout."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    layout_doc = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not layout_doc:
        return jsonify({"error": "Layout not found"}), 404

    current_layout = layout_doc["layout"]

    if request.method == "PUT":
        # Update an existing page
        page_data = request.json
        if not page_data:
            return jsonify({"error": "No page data provided"}), 400

        # Find and update the page
        page_updated = False
        for i, page in enumerate(current_layout):
            if page.get("id") == page_id:
                current_layout[i] = page_data
                page_updated = True
                break

        if not page_updated:
            return jsonify({"error": "Page not found in layout"}), 404

    elif request.method == "DELETE":
        # Delete a page
        initial_length = len(current_layout)
        current_layout = [page for page in current_layout if page.get("id") != page_id]

        if len(current_layout) == initial_length:
            return jsonify({"error": "Page not found in layout"}), 404

    # Update the layout in the database
    layouts.update_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)},
        {
            "$set": {
                "layout": current_layout,
                "modified_date": datetime.now(timezone.utc),
            }
        },
    )

    return jsonify({"status": "success"})


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
