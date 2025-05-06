"""API routes for the Flatplan application."""

from datetime import datetime, timezone
from bson import ObjectId
from flask import Blueprint, request, session, jsonify
from typing import Dict, List, Any, Union, Optional

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


def fractional_size_to_decimal(size_str: str) -> float:
    """Convert a fractional size string to its decimal equivalent.

    Args:
        size_str: The fractional size as a string (e.g., "1/4", "1/3", etc.)

    Returns:
        The decimal value of the fraction
    """
    size_map = {"1/4": 0.25, "1/3": 0.333, "1/2": 0.5, "2/3": 0.667}
    return size_map.get(size_str, 0.0)


def create_analytics_structure(layout_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Create the initial analytics structure with default values.

    Args:
        layout_doc: The layout document from the database

    Returns:
        A dictionary with the initial analytics structure
    """
    return {
        "publication_name": layout_doc.get("publication_name", "Unnamed Publication"),
        "issue_name": layout_doc.get("issue_name", "Unnamed Issue"),
        "total_pages": len(layout_doc["layout"]),
        "total_editorial": 0.0,  # Total editorial including fractional
        "total_ads": 0.0,  # Total ads including fractional
        "page_types": {
            "edit": {"total": 0, "sections": {}},
            "ad": {"total": 0, "sections": {}},
            "mixed": {
                "total": 0,
                "sections": {},
                "editorialPercentage": 0.0,
                "adPercentage": 0.0,
            },
            "placeholder": {"total": 0, "sections": {}},
            "unknown": {"total": 0, "sections": {}},
        },
        "fractionalAdSizes": {"1/4": 0, "1/3": 0, "1/2": 0, "2/3": 0},
    }


def process_mixed_page(
    page: Dict[str, Any], analytics: Dict[str, Any], total_mixed_ad_space: float
) -> float:
    """Process a mixed page and update the analytics accordingly.

    Args:
        page: The page data
        analytics: The analytics data
        total_mixed_ad_space: Total ad space in mixed pages so far

    Returns:
        Updated total_mixed_ad_space value
    """
    fractional_ads = page.get("fractional_ads", [])
    total_ad_space = 0.0

    for ad in fractional_ads:
        ad_size = ad.get("size", "1/4")
        ad_decimal_size = fractional_size_to_decimal(ad_size)
        total_ad_space += ad_decimal_size

        # Track fractional ad sizes
        if ad_size in analytics["fractionalAdSizes"]:
            analytics["fractionalAdSizes"][ad_size] += 1

        # Add to section-specific ad tracking
        ad_section = ad.get("section", "Uncategorized")
        if ad_section not in analytics["page_types"]["ad"]["sections"]:
            analytics["page_types"]["ad"]["sections"][ad_section] = 0

        # Add fractional amount to the ad section
        analytics["page_types"]["ad"]["sections"][ad_section] += ad_decimal_size

    # Calculate editorial space (remaining space on the page)
    editorial_space = max(0, 1 - total_ad_space)

    # Add to totals
    analytics["total_ads"] += total_ad_space
    analytics["total_editorial"] += editorial_space

    return total_mixed_ad_space + total_ad_space


def update_section_counts(
    page_type: str, section: str, analytics: Dict[str, Any]
) -> None:
    """Update section counts for a page.

    Args:
        page_type: The page type
        section: The section name
        analytics: The analytics data
    """
    # Initialize section counter if needed
    if section not in analytics["page_types"][page_type]["sections"]:
        analytics["page_types"][page_type]["sections"][section] = 0

    # Increment section counter
    analytics["page_types"][page_type]["sections"][section] += 1


@api_bp.route("/api/layout/<layout_id>/analytics", methods=["GET"])
def get_layout_analytics(layout_id):
    """API endpoint to get analytics for a layout."""
    user_id = session.get("_user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    layout_doc = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )
    if not layout_doc:
        return jsonify({"error": "Layout not found"}), 404

    # Initialize analytics structure
    analytics = create_analytics_structure(layout_doc)

    # Track total ad space in mixed pages for percentage calculation
    total_mixed_ad_space = 0.0

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

        # Increment total for page type
        analytics["page_types"][page_type]["total"] += 1

        # Update section counts
        update_section_counts(page_type, section, analytics)

        # Handle page type-specific calculations
        if page_type == "edit":
            analytics["total_editorial"] += 1
        elif page_type == "ad":
            analytics["total_ads"] += 1
        elif page_type == "mixed":
            total_mixed_ad_space = process_mixed_page(
                page, analytics, total_mixed_ad_space
            )

    # Calculate percentages for mixed pages if any exist
    if analytics["page_types"]["mixed"]["total"] > 0:
        mixed_total = analytics["page_types"]["mixed"]["total"]
        ad_percentage = total_mixed_ad_space / mixed_total
        analytics["page_types"]["mixed"]["adPercentage"] = ad_percentage
        analytics["page_types"]["mixed"]["editorialPercentage"] = 1 - ad_percentage

    # Round decimal values for display
    analytics["total_editorial"] = round(analytics["total_editorial"], 2)
    analytics["total_ads"] = round(analytics["total_ads"], 2)

    return jsonify(analytics)
