# Flatplan - Magazine Layout Planning Tool

A web application for creating and managing magazine layouts with MongoDB integration.

## Features

- Visual drag-and-drop interface for creating magazine layouts
- Page type differentiation (editorial, advertisement, placeholder)
- Section organization and tracking
- Layout analytics
- Layout sharing with access controls
- User authentication and account management

## Project Structure

The application has been refactored into a modular structure:

```
flatplan/
├── app.py                # Main application entry point
├── config.py             # Configuration settings
├── extensions.py         # Shared extension instances
├── forms.py              # Form definitions
├── init_directories.py   # Helper script to create required directories
├── models/               # Database models
│   ├── __init__.py
│   └── user.py           # User model for Flask-Login
├── routes/               # Route handlers
│   ├── __init__.py
│   ├── api.py            # API endpoints
│   ├── auth.py           # Authentication routes
│   ├── layout.py         # Layout management routes
│   └── main.py           # Main application routes
├── static/               # Static assets (CSS, JS)
├── templates/            # Jinja2 templates
├── utils/                # Utility functions
│   ├── __init__.py
│   └── email.py          # Email functionality
├── requirements.txt      # Python dependencies
└── wsgi.py               # WSGI entry point for deployment
```

## Installation

1. Clone the repository
2. Create a virtual environment and activate it
3. Install dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use venv\Scripts\activate
pip install -r requirements.txt
```

4. Create required directories (if not already present)

```bash
python init_directories.py
```

5. Configure environment variables - create a `.env` file with:

```
SECRET_KEY=your_secret_key
MONGODB_URI=your_mongodb_connection_string
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
MAIL_DEFAULT_SENDER=your_email@example.com
DEBUG=True  # Set to False in production
```

## Running the Application

For development:

```bash
python app.py
```

For production, use a WSGI server:

```bash
python wsgi.py
```

## Database Setup

The application uses MongoDB. You need to have a MongoDB instance running, either locally or in the cloud.

The application will automatically create the required collections:
- users
- layouts
- shared_access

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a new Pull Request
