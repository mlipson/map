"""Python
Flask application to upload a JSON file and display its contents in a table."""

import os
import json
from flask import Flask, render_template, request

from werkzeug.utils import secure_filename


app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


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


if __name__ == "__main__":
    app.run(debug=True)
