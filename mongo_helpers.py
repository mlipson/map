"""MongoDB helper functions for Flatplan application."""

import os
from datetime import datetime

from pymongo import MongoClient
from bson import ObjectId

mongo_client = MongoClient(os.environ.get("MONGODB_URI"))
db = mongo_client.get_database("flatplan")
users = db.users
layouts = db.layouts


def save_layout_to_mongo(layout_data, account_id, publication, issue, pub_date):
    """Save a new layout document to the layouts collection."""
    result = layouts.insert_one(
        {
            "account_id": ObjectId(account_id),
            "publication_name": publication,
            "issue_name": issue,
            "publication_date": pub_date,
            "modified_date": datetime.utcnow(),
            "layout": layout_data,
        }
    )
    return str(result.inserted_id)


def get_layouts_by_user(account_id):
    """Retrieve all layouts saved by a specific user."""
    return list(layouts.find({"account_id": ObjectId(account_id)}))


def get_layout_by_issue(account_id, publication, issue):
    """Retrieve a single layout for a specific issue."""
    return layouts.find_one(
        {
            "account_id": ObjectId(account_id),
            "publication_name": publication,
            "issue_name": issue,
        }
    )


def update_existing_layout(account_id, publication, issue, new_layout):
    """Overwrite an existing layout if it exists."""
    result = layouts.update_one(
        {
            "account_id": ObjectId(account_id),
            "publication_name": publication,
            "issue_name": issue,
        },
        {"$set": {"layout": new_layout, "modified_date": datetime.utcnow()}},
    )
    return result.modified_count
