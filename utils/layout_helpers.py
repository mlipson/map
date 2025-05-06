"""Helper utilities for the layout module.

This module contains helper functions for the layout module to
keep the main routes file clean and focused on routing logic.
"""

from typing import Dict, List, Any


def preprocess_layout_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Preprocess layout items for rendering.

    Args:
        items: The raw layout items from the database

    Returns:
        Processed layout items ready for rendering
    """
    # Make a copy to avoid modifying the original
    processed_items = items.copy()

    # Add visible placeholder Page 0 if first real page is Page 1
    if processed_items and processed_items[0].get("page_number") == 1:
        processed_items.insert(
            0,
            {
                "name": "—",
                "type": "placeholder",
                "section": "Start",
                "page_number": 0,
            },
        )

    # Normalize item names
    for item in processed_items:
        if "name" in item:
            item["name"] = item.get("name", "").strip()

    # Ensure page numbering is consistent
    processed_items = ensure_consistent_page_numbering(processed_items)

    return processed_items


def ensure_consistent_page_numbering(
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Ensure page numbering is consistent and sequential.

    Args:
        items: The layout items to check

    Returns:
        Layout items with consistent page numbering
    """
    # Skip if no items
    if not items:
        return items

    # Skip page 0 if it exists
    start_index = 1 if items[0].get("page_number") == 0 else 0

    # Ensure remaining pages are numbered sequentially
    for i in range(start_index, len(items)):
        items[i]["page_number"] = i if start_index == 0 else i

    return items


def extract_layout_summary(layout_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Extract a summary of a layout for display in listings.

    Args:
        layout_doc: The complete layout document

    Returns:
        A dictionary with summary information
    """
    items = layout_doc.get("layout", [])

    # Count page types
    page_counts = {
        "total": len(items),
        "editorial": sum(1 for item in items if item.get("type") == "edit"),
        "ads": sum(1 for item in items if item.get("type") == "ad"),
        "mixed": sum(1 for item in items if item.get("type") == "mixed"),
        "placeholder": sum(1 for item in items if item.get("type") == "placeholder"),
    }

    # Calculate editorial and ad percentages including fractional pages
    total_editorial = page_counts["editorial"]
    total_ads = page_counts["ads"]

    # Process mixed pages
    for item in items:
        if item.get("type") == "mixed" and "fractional_ads" in item:
            # Calculate ad space in this mixed page
            fractional_ads = item.get("fractional_ads", [])
            total_ad_space = 0.0

            for ad in fractional_ads:
                ad_size = ad.get("size", "1/4")
                ad_decimal_size = fractional_size_to_decimal(ad_size)
                total_ad_space += ad_decimal_size

            # Calculate editorial space (remaining space on the page)
            editorial_space = max(0, 1 - total_ad_space)

            # Add to totals
            total_ads += total_ad_space
            total_editorial += editorial_space

    # Add to summary
    summary = {
        "id": str(layout_doc.get("_id")),
        "publication_name": layout_doc.get("publication_name", "Unnamed Publication"),
        "issue_name": layout_doc.get("issue_name", "Unnamed Issue"),
        "publication_date": layout_doc.get("publication_date"),
        "modified_date": layout_doc.get("modified_date"),
        "page_counts": page_counts,
        "total_editorial": round(total_editorial, 2),
        "total_ads": round(total_ads, 2),
    }

    return summary


def fractional_size_to_decimal(size_str: str) -> float:
    """Convert a fractional size string to its decimal equivalent.

    Args:
        size_str: The fractional size as a string (e.g., "1/4", "1/3", etc.)

    Returns:
        The decimal value of the fraction
    """
    size_map = {"1/4": 0.25, "1/3": 0.333, "1/2": 0.5, "2/3": 0.667}
    return size_map.get(size_str, 0.0)
