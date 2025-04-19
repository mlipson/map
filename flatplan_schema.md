
# MongoDB Schema Reference for Flatplan Layout System

## COLLECTION: users

Each user (or account) in the system.

### Document Structure:
{
  "_id": ObjectId,               // MongoDB generated user ID
  "email": String,               // User's email address
  "name": String,                // Display name
  "created_at": ISODate          // Timestamp when the account was created
}


## COLLECTION: layouts

Each document stores a saved layout for a specific magazine issue by a specific user.

### Document Structure:
{
  "_id": ObjectId,               // Layout document ID
  "account_id": ObjectId,        // Reference to the 'users' collection (_id)
  "publication_name": String,    // e.g., "C Magazine"
  "issue_name": String,          // e.g., "Spring 2025"
  "publication_date": String,    // e.g., "2025-03-15" (can be ISODate)
  "modified_date": ISODate,      // Timestamp of last save
  "layout": [                    // Array of individual page objects
    {
      "page_number": Number,
      "name": String,
      "type": String,            // "edit", "ad", "placeholder", etc.
      "section": String
    },
    ...
  ]
}


## NOTES:

- The `account_id` field enables lookup of all layouts for a given user.
- You can index `account_id`, `publication_name`, and `issue_name` for efficient querying.
- Consider adding a `version` or `archived` flag for version control later.
