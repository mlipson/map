# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run the application in development mode
python app.py

# Create required directories if they don't exist
python init-directories.py

# Install dependencies
pip install -r requirements.txt
```

### Production
```bash
# Run with WSGI for production
python wsgi.py
```

## Architecture Overview

This is **Flatplan**, a Flask web application for magazine layout planning with MongoDB integration.

### Application Structure
- **Flask Blueprint Architecture**: Routes are organized into separate blueprints (`auth`, `layout`, `main`, `api`)
- **Extension Pattern**: Shared extensions (MongoDB, Flask-Login, Flask-Mail) are initialized in `extensions.py`
- **Application Factory**: `create_app()` function in `app.py` configures and assembles the application

### Key Components

**Database Layer (`extensions.py`)**:
- MongoDB client with `flatplan` database
- Collections: `users`, `layouts`, `shared_access`
- Direct pymongo integration (no ODM)

**Authentication (`models/user.py`, `routes/auth.py`)**:
- Custom User class implementing Flask-Login's UserMixin
- Password hashing with Werkzeug
- Email-based password reset with URLSafeTimedSerializer

**Layout System (`routes/layout.py`, `routes/api.py`)**:
- Drag-and-drop magazine layout editor
- Page types: editorial, advertisement, placeholder
- Section organization and analytics
- Layout sharing with access controls

**Frontend Architecture**:
- Vanilla JavaScript with module pattern
- Key files: `flatplan.js`, `page-editor.js`, `layout-analytics.js`
- Bootstrap-based responsive UI

### Data Models

**Layout Document Structure**:
```javascript
{
  "_id": ObjectId,
  "account_id": ObjectId,  // Reference to users collection
  "publication_name": String,
  "issue_name": String,
  "publication_date": String,
  "modified_date": ISODate,
  "layout": [  // Array of page objects
    {
      "page_number": Number,
      "name": String,
      "type": String,  // "edit", "ad", "placeholder"
      "section": String
    }
  ]
}
```

### Configuration
- Environment-based config in `config.py`
- Required env vars: `SECRET_KEY`, `MONGODB_URI`, mail settings
- Development vs Production config classes

### Key Routes
- `/` - Main layout editor interface
- `/api/layouts` - RESTful layout management
- `/auth/*` - Authentication endpoints
- `/layout/*` - Layout management pages