"""API routes for the Flatplan application."""

from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, session, jsonify

from extensions import layouts

# Create blueprint
api_bp = Blueprint("api", __name__)


@api_bp.route("/api/page/<layout_id>", methods=["POST"])
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


@api_bp.route("/api/page/<layout_id>/<page_id>", methods=["PUT", "DELETE"])
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


@api_bp.route("/api/layout/<layout_id>/analytics", methods=["GET"])
def get_layout_analytics(layout_id):
    """API endpoint to get analytics for a layout."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    layout_doc = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not layout_doc:
        return jsonify({"error": "Layout not found"}), 404

    # Initialize analytics structure
    analytics = {
        "publication_name": layout_doc.get("publication_name", "Unnamed Publication"),
        "issue_name": layout_doc.get("issue_name", "Unnamed Issue"),
        "total_pages": len(layout_doc["layout"]),
        "page_types": {
            "edit": {"total": 0, "sections": {}},
            "ad": {"total": 0, "sections": {}},
            "placeholder": {"total": 0, "sections": {}},
            "unknown": {"total": 0, "sections": {}},
        },
    }

    # Process each page in the layout
    for page in layout_doc["layout"]:
        # Skip placeholder Page 0
        if page.get("page_number") == 0:
            continue

        # Get page type and section
        page_type = page.get("type", "unknown").lower()
        if page_type not in analytics["page_types"]:
            page_type = "unknown"

        section = page.get("section", "Uncategorized")

        # Increment counts
        analytics["page_types"][page_type]["total"] += 1

        # Initialize section counter if needed
        if section not in analytics["page_types"][page_type]["sections"]:
            analytics["page_types"][page_type]["sections"][section] = 0

        # Increment section counter
        analytics["page_types"][page_type]["sections"][section] += 1

    return jsonify(analytics)
