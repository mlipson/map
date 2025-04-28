"""Layout routes for the Flatplan application."""

import os
from datetime import datetime, timezone
from bson import ObjectId
from flask import (
    Blueprint,
    request,
    session,
    redirect,
    url_for,
    render_template,
    jsonify,
    flash,
)
from flask_login import login_required, current_user
from flask_mail import Message

from extensions import layouts, mail, db
from forms import ShareLayoutForm

# Create blueprint
layout_bp = Blueprint("layout", __name__)


@layout_bp.route("/layout/<layout_id>", methods=["GET", "POST"])
@login_required
def view_layout(layout_id):
    """View and edit a layout."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("main.index"))

    layout_doc = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not layout_doc:
        return "Layout not found", 404

    if request.method == "POST":
        # Check if this is a JSON content type (AJAX request)
        if request.is_json:
            layout_data = request.json
            if layout_data:
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
        # Check if this is a file upload
        elif "file" in request.files:
            file = request.files["file"]
            if file and file.filename.endswith(".json"):
                try:
                    # Read and parse the JSON file
                    import json

                    layout_data = json.loads(file.read().decode("utf-8"))

                    # Update the layout in the database
                    layouts.update_one(
                        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)},
                        {
                            "$set": {
                                "layout": layout_data,
                                "modified_date": datetime.now(timezone.utc),
                            }
                        },
                    )
                    flash("Layout updated from JSON file")
                except Exception as e:
                    flash(f"Error processing JSON file: {str(e)}", "error")

                # Redirect to refresh the page with the new data
                return redirect(url_for("layout.view_layout", layout_id=layout_id))

    items = layout_doc["layout"]

    # Add visible placeholder Page 0 if first real page is Page 1
    if items and items[0].get("page_number") == 1:
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


@layout_bp.route("/share/<layout_id>", methods=["GET", "POST"])
@login_required
def share_layout(layout_id):
    """Share a layout with another user."""
    # Get the layout
    layout = db.layouts.find_one({"_id": ObjectId(layout_id)})

    if not layout:
        flash("Layout not found.")
        return redirect(url_for("main.index"))

    # Check ownership
    if str(layout.get("account_id")) != current_user.id:
        flash("You do not have permission to share this layout.")
        return redirect(url_for("main.index"))

    form = ShareLayoutForm()
    if form.validate_on_submit():
        # Generate a unique access code
        access_code = os.urandom(3).hex()

        # Save the shared access
        shared_access = {
            "layout_id": ObjectId(layout_id),
            "email": form.email.data,
            "access_code": access_code,
            "created_at": datetime.now(timezone.utc),
            "created_by": ObjectId(current_user.id),
        }

        db.shared_access.insert_one(shared_access)

        # Send an email with the access link
        share_url = url_for(
            "layout.view_shared_layout",
            layout_id=layout_id,
            code=access_code,
            _external=True,
        )

        msg = Message("Layout Shared With You", recipients=[form.email.data])
        msg.body = f"""You have been given access to view a layout.
                    Access with this link: {share_url}
                    Access code: {access_code}
                    """
        mail.send(msg)

        flash(f"Layout shared with {form.email.data}")
        return redirect(url_for("layout.view_layout", layout_id=layout_id))

    return render_template("share_layout.html", form=form, layout=layout)


@layout_bp.route("/shared/<layout_id>", methods=["GET", "POST"])
def view_shared_layout(layout_id):
    """View a shared layout with an access code."""
    # Check if access code is in URL
    access_code = request.args.get("code")

    if not access_code:
        # Show form to enter access code
        if request.method == "POST":
            access_code = request.form.get("access_code")
        else:
            return render_template("enter_access_code.html", layout_id=layout_id)

    # Verify access code
    shared_access = db.shared_access.find_one(
        {"layout_id": ObjectId(layout_id), "access_code": access_code}
    )

    if not shared_access:
        flash("Invalid access code.")
        return render_template("enter_access_code.html", layout_id=layout_id)

    # Get the layout
    layout_doc = layouts.find_one({"_id": ObjectId(layout_id)})
    if not layout_doc:
        flash("Layout not found.")
        return redirect(url_for("main.index"))

    items = layout_doc["layout"]

    # Add visible placeholder Page 0 if first real page is Page 1
    if items and items[0].get("page_number") == 1:
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
        "view_shared_layout.html",
        items=layout_doc["layout"],
        layout_id=layout_id,
        layout_doc=layout_doc,
    )


@layout_bp.route("/create_layout", methods=["GET", "POST"])
@login_required
def create_layout():
    """Create a new layout."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("main.index"))

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

        return redirect(url_for("layout.view_layout", layout_id=layout_id))

    return render_template("create_layout.html")


@layout_bp.route("/clone_layout/<layout_id>")
@login_required
def clone_layout(layout_id):
    """Clone an existing layout."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("main.index"))

    # Fetch the original layout
    original_layout = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not original_layout:
        flash("Layout not found", "error")
        return redirect(url_for("main.account"))

    # Create a clone with modified name
    clone_data = {
        "account_id": ObjectId(user_id),
        "publication_name": original_layout["publication_name"],
        "issue_name": original_layout["issue_name"] + " (Clone)",
        "publication_date": original_layout.get("publication_date"),
        "modified_date": datetime.now(timezone.utc),
        "layout": original_layout["layout"],  # Copy the entire layout structure
    }

    # Insert the clone into the database
    new_layout_id = layouts.insert_one(clone_data).inserted_id

    flash("Layout cloned successfully", "success")
    return redirect(url_for("layout.view_layout", layout_id=new_layout_id))


@layout_bp.route("/edit_layout_metadata", methods=["POST"])
@login_required
def edit_layout_metadata():
    """Update the metadata for a layout."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("main.index"))

    layout_id = request.form.get("layout_id")
    publication_name = request.form.get("publication_name")
    issue_name = request.form.get("issue_name")
    publication_date = request.form.get("publication_date")
    return_to = request.form.get("return_to", "account")  # Default to account view

    if not all([layout_id, publication_name, issue_name]):
        flash("Publication name and issue name are required", "error")
        if return_to == "layout":
            return redirect(url_for("layout.view_layout", layout_id=layout_id))
        else:
            return redirect(url_for("main.account"))

    # Update the layout metadata
    result = layouts.update_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)},
        {
            "$set": {
                "publication_name": publication_name,
                "issue_name": issue_name,
                "publication_date": publication_date,
                "modified_date": datetime.now(timezone.utc),
            }
        },
    )

    if result.modified_count > 0:
        flash("Layout details updated successfully", "success")
    else:
        flash("No changes were made or layout not found", "error")

    # Redirect based on where the edit was initiated
    if return_to == "layout":
        return redirect(url_for("layout.view_layout", layout_id=layout_id))
    else:
        return redirect(url_for("main.account"))


@layout_bp.route("/delete_layout/<layout_id>", methods=["POST"])
@login_required
def delete_layout(layout_id):
    """Delete a layout permanently."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("main.index"))

    # Check if the layout exists and belongs to the user
    layout = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not layout:
        flash("Layout not found or you don't have permission to delete it.", "error")
        return redirect(url_for("main.account"))

    # Delete the layout
    result = layouts.delete_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if result.deleted_count > 0:
        flash("Layout deleted successfully.", "success")
    else:
        flash("Failed to delete layout.", "error")

    return redirect(url_for("main.account"))
