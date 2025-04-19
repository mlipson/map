"""Python
Flask application to upload a JSON file and display its contents in a table."""

import os
import json
from flask import Flask, render_template, request, jsonify
import pymongo

from werkzeug.utils import secure_filename

from dotenv import load_dotenv

load_dotenv()

# Setup Flask
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Setup MongoDB Atlas
mongo_client = pymongo.MongoClient(os.environ.get("MONGODB_URI"))
db = mongo_client.get_database("flatplan")
layouts = db.layouts


@app.route("/", methods=["GET", "POST"])
def index():
    """main route to handle file upload and display JSON data."""
    items = []
    if request.method == "POST":
        file = request.files["file"]
        if file and file.filename.endswith(".json"):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            with open(filepath, "r", encoding="utf-8") as f:
                items = json.load(f)

            # Add visible placeholder Page 0 if first real page is Page 1
            if items and items[0]["page number"] == 1:
                items.insert(
                    0,
                    {
                        "name": "—",
                        "type": "placeholder",
                        "section": "Start",
                        "page number": 0,
                    },
                )

            for item in items:
                item["name"] = item.get("name", "").lower()

    return render_template("index.html", items=items)


@app.route("/save-layout", methods=["POST"])
def save_layout():
    """Save the layout to MongoDB"""
    layout_data = request.json
    print(layout_data)
    if not layout_data:
        return jsonify({"error": "No data provided"}), 400

    result = layouts.insert_one({"layout": layout_data})

    return jsonify({"status": "ok", "id": str(result.inserted_id)})


if __name__ == "__main__":
    app.run(debug=True)
