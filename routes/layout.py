"""Layout routes for the Flatplan application.

This module handles all routes related to layout creation, viewing, editing, and sharing.
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple, Union

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
from utils.layout_helpers import preprocess_layout_items

# Create blueprint
layout_bp = Blueprint("layout", __name__)


def get_user_layout(
    layout_id: str, user_id: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """Get a layout document for a specific user.

    Args:
        layout_id: The ID of the layout to retrieve
        user_id: The ID of the user who owns the layout

    Returns:
        A tuple containing the layout document (or None if not found) and an error message (or None if found)
    """
    if not user_id:
        return None, "User not authenticated"

    try:
        layout_doc = layouts.find_one(
            {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
        )

        if not layout_doc:
            return None, "Layout not found"

        return layout_doc, None
    except Exception as e:
        return None, f"Error retrieving layout: {str(e)}"


def update_layout_content(
    layout_id: str, user_id: str, layout_data: List[Dict[str, Any]]
) -> Tuple[bool, Optional[str]]:
    """Update the content of a layout.

    Args:
        layout_id: The ID of the layout to update
        user_id: The ID of the user who owns the layout
        layout_data: The new layout data

    Returns:
        A tuple containing a success flag and an error message (or None if successful)
    """
    try:
        result = layouts.update_one(
            {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)},
            {
                "$set": {
                    "layout": layout_data,
                    "modified_date": datetime.now(timezone.utc),
                }
            },
        )

        if result.modified_count == 0:
            return False, "No changes were made or layout not found"

        return True, None
    except Exception as e:
        return False, f"Error updating layout: {str(e)}"


def process_json_upload(
    file, layout_id: str, user_id: str
) -> Tuple[bool, Optional[str]]:
    """Process a JSON file upload to update a layout.

    Args:
        file: The uploaded file object
        layout_id: The ID of the layout to update
        user_id: The ID of the user who owns the layout

    Returns:
        A tuple containing a success flag and an error message (or None if successful)
    """
    if not file or not file.filename.endswith(".json"):
        return False, "Invalid file format. Please upload a JSON file."

    try:

        layout_data = json.loads(file.read().decode("utf-8"))

        success, error = update_layout_content(layout_id, user_id, layout_data)
        if not success:
            return False, error

        return True, None
    except json.JSONDecodeError:
        return False, "Invalid JSON format"
    except Exception as e:
        return False, f"Error processing JSON file: {str(e)}"


def create_shared_access(
    layout_id: str, email: str, user_id: str
) -> Tuple[str, bool, Optional[str]]:
    """Create a shared access record for a layout.

    Args:
        layout_id: The ID of the layout to share
        email: The email address of the user to share with
        user_id: The ID of the user who owns the layout

    Returns:
        A tuple containing the access code, a success flag, and an error message (or None if successful)
    """
    try:
        # Generate a unique access code
        access_code = os.urandom(3).hex()

        # Save the shared access
        shared_access = {
            "layout_id": ObjectId(layout_id),
            "email": email,
            "access_code": access_code,
            "created_at": datetime.now(timezone.utc),
            "created_by": ObjectId(user_id),
        }

        db.shared_access.insert_one(shared_access)
        return access_code, True, None
    except Exception as e:
        return "", False, f"Error creating shared access: {str(e)}"


def send_shared_layout_email(
    email: str, layout_id: str, access_code: str
) -> Tuple[bool, Optional[str]]:
    """Send an email with a shared layout access link.

    Args:
        email: The recipient's email address
        layout_id: The ID of the shared layout
        access_code: The access code for the shared layout

    Returns:
        A tuple containing a success flag and an error message (or None if successful)
    """
    try:
        share_url = url_for(
            "layout.view_shared_layout",
            layout_id=layout_id,
            code=access_code,
            _external=True,
        )

        msg = Message("Layout Shared With You", recipients=[email])
        msg.body = f"""You have been given access to view a layout.
                    Access with this link: {share_url}
                    Access code: {access_code}
                    """
        mail.send(msg)
        return True, None
    except Exception as e:
        return False, f"Error sending email: {str(e)}"


def verify_shared_access(
    layout_id: str, access_code: str
) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """Verify access to a shared layout.

    Args:
        layout_id: The ID of the shared layout
        access_code: The access code to verify

    Returns:
        A tuple containing a success flag and the layout document (or None if unsuccessful)
    """
    try:
        # Verify access code
        shared_access = db.shared_access.find_one(
            {"layout_id": ObjectId(layout_id), "access_code": access_code}
        )

        if not shared_access:
            return False, None

        # Get the layout
        layout_doc = layouts.find_one({"_id": ObjectId(layout_id)})
        if not layout_doc:
            return False, None

        return True, layout_doc
    except Exception:
        return False, None


@layout_bp.route("/layout/<layout_id>", methods=["GET", "POST"])
@login_required
def view_layout(layout_id):
    """View and edit a layout."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("main.index"))

    # Get the layout document
    layout_doc, error = get_user_layout(layout_id, user_id)
    if error:
        return error, 404

    # Handle POST requests
    if request.method == "POST":
        # Handle JSON content (AJAX request)
        if request.is_json:
            layout_data = request.json
            if layout_data:
                success, error = update_layout_content(layout_id, user_id, layout_data)
                if success:
                    return jsonify({"status": "updated"})
                return jsonify({"status": "error", "message": error}), 400

        # Handle file upload
        elif "file" in request.files:
            file = request.files["file"]
            success, error = process_json_upload(file, layout_id, user_id)

            if success:
                flash("Layout updated from JSON file")
            else:
                flash(f"Error processing JSON file: {error}", "error")

            # Redirect to refresh the page with the new data
            return redirect(url_for("layout.view_layout", layout_id=layout_id))

    # Preprocess layout items for rendering
    items = preprocess_layout_items(layout_doc["layout"])

    return render_template(
        "layout.html",
        items=items,
        layout_id=layout_id,
        layout_doc=layout_doc,
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
        # Create shared access record
        access_code, success, error = create_shared_access(
            layout_id, form.email.data, current_user.id
        )

        if not success:
            flash(f"Error sharing layout: {error}", "error")
            return render_template("share_layout.html", form=form, layout=layout)

        # Send email with access link
        email_success, email_error = send_shared_layout_email(
            form.email.data, layout_id, access_code
        )

        if not email_success:
            flash(
                f"Layout shared, but email could not be sent: {email_error}", "warning"
            )
        else:
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

    # Verify access code and get layout
    success, layout_doc = verify_shared_access(layout_id, access_code)

    if not success:
        flash("Invalid access code or layout not found.")
        return render_template("enter_access_code.html", layout_id=layout_id)

    # Preprocess layout items for rendering
    items = preprocess_layout_items(layout_doc["layout"])

    return render_template(
        "view_shared_layout.html",
        items=items,
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
    layout_doc, error = get_user_layout(layout_id, user_id)
    if error:
        flash(error, "error")
        return redirect(url_for("main.account"))

    # Create a clone with modified name
    clone_data = {
        "account_id": ObjectId(user_id),
        "publication_name": layout_doc["publication_name"],
        "issue_name": layout_doc["issue_name"] + " (Clone)",
        "publication_date": layout_doc.get("publication_date"),
        "modified_date": datetime.now(timezone.utc),
        "layout": layout_doc["layout"],  # Copy the entire layout structure
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

    # Get form data
    layout_id = request.form.get("layout_id")
    publication_name = request.form.get("publication_name")
    issue_name = request.form.get("issue_name")
    publication_date = request.form.get("publication_date")
    return_to = request.form.get("return_to", "account")  # Default to account view

    # Validate required fields
    if not all([layout_id, publication_name, issue_name]):
        flash("Publication name and issue name are required", "error")
        if return_to == "layout":
            return redirect(url_for("layout.view_layout", layout_id=layout_id))
        else:
            return redirect(url_for("main.account"))

    # Update the layout metadata
    try:
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
    except Exception as e:
        flash(f"Error updating layout: {str(e)}", "error")

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
    layout_doc, error = get_user_layout(layout_id, user_id)
    if error:
        flash("Layout not found or you don't have permission to delete it.", "error")
        return redirect(url_for("main.account"))

    # Delete the layout
    try:
        result = layouts.delete_one(
            {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
        )

        if result.deleted_count > 0:
            flash("Layout deleted successfully.", "success")
        else:
            flash("Failed to delete layout.", "error")
    except Exception as e:
        flash(f"Error deleting layout: {str(e)}", "error")

    return redirect(url_for("main.account"))
