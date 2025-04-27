"""Flask app for Flatplan with MongoDB integration."""

from dotenv import load_dotenv

load_dotenv()

import os
from datetime import datetime, timezone

from flask import (
    Flask,
    request,
    session,
    redirect,
    url_for,
    render_template,
    jsonify,
    flash,
)
from bson import ObjectId
import pymongo


from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer


app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY")

# MongoDB setup
mongo_client = pymongo.MongoClient(
    os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
)
db = mongo_client.get_database("flatplan")
users = db.users
layouts = db.layouts


# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# Flask-Mail setup
app.config["MAIL_SERVER"] = "smtppro.zoho.com"
app.config["MAIL_PORT"] = 465
app.config["MAIL_USE_SSL"] = True
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "your-email@example.com")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "your-email-password")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get(
    "MAIL_DEFAULT_SENDER", "your-email@example.com"
)
mail = Mail(app)

# Token serializer for password reset
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])


# User class for Flask-Login
class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data["_id"])
        self.email = user_data["email"]
        self.password_hash = user_data.get("password_hash", None)
        self.created_at = user_data.get("created_at", datetime.now(timezone.utc))

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        return self.password_hash

    @staticmethod
    def get_by_email(email):
        user_data = users.find_one({"email": email})
        return User(user_data) if user_data else None


# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    user_data = users.find_one({"_id": ObjectId(user_id)})
    return User(user_data) if user_data else None


# Forms
class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])
    remember_me = BooleanField("Remember Me")
    submit = SubmitField("Sign In")


class RegistrationForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=8)])
    password2 = PasswordField(
        "Repeat Password", validators=[DataRequired(), EqualTo("password")]
    )
    submit = SubmitField("Register")


class PasswordResetRequestForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    submit = SubmitField("Request Password Reset")


class PasswordResetForm(FlaskForm):
    password = PasswordField("New Password", validators=[DataRequired(), Length(min=8)])
    password2 = PasswordField(
        "Repeat Password", validators=[DataRequired(), EqualTo("password")]
    )
    submit = SubmitField("Reset Password")


class ShareLayoutForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    submit = SubmitField("Share")


# Main routes
@app.route("/")
def index():
    if current_user.is_authenticated:
        # # Show user's layouts
        # user_layouts = list(db.layouts.find({"user_id": ObjectId(current_user.id)}))
        # return render_template("index.html", layouts=user_layouts)
        return redirect(url_for("account"))
    return render_template("index.html")


# # Update the home route to render the new index.html template
# @app.route("/")
# def home():
#     return render_template("index.html")


# # Add a new route for the login page
# @app.route("/login", methods=["GET"])
# def login_page():
#     return render_template("login.html")


# # Update the login route to handle only POST requests
# @app.route("/login", methods=["POST"])
# def login():
#     email = request.form.get("email")
#     if not email:
#         return "Email is required", 400

#     user = users.find_one({"email": email})
#     if not user:
#         user_id = users.insert_one(
#             {
#                 "email": email,
#                 "name": email.split("@")[0],
#                 "created_at": datetime.now(timezone.utc),
#             }
#         ).inserted_id
#         user = users.find_one({"_id": user_id})

#     session["user_id"] = str(user["_id"])
#     return redirect(url_for("account"))


# # Add a logout route
# @app.route("/logout")
# def logout():
#     """Log out a user by clearing their session."""
#     session.clear()
#     return redirect(url_for("home"))


# Routes for authentication
@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("account"))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.get_by_email(form.email.data)

        if user is None:
            flash("No account found with that email address.")
            return redirect(url_for("login"))

        # Check if user has a password (might be a new user from old system)
        if not user.password_hash:
            flash("Please set your password first.")
            # Generate a password reset token and redirect to password reset
            token = generate_reset_token(user.email)
            return redirect(url_for("reset_password", token=token))

        # Check password
        if not user.check_password(form.password.data):
            flash("Invalid password.")
            return redirect(url_for("login"))

        # Login user
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get("next")
        if not next_page or not next_page.startswith("/"):
            next_page = url_for("index")
        return redirect(next_page)

    return render_template("login.html", form=form)


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("index"))

    form = RegistrationForm()
    if form.validate_on_submit():
        # Check if user already exists
        existing_user = users.find_one({"email": form.email.data})

        if existing_user:
            # User exists but may not have password (from old system)
            if not existing_user.get("password_hash"):
                user = User(existing_user)
                password_hash = user.set_password(form.password.data)

                # Update user in database with password
                users.update_one(
                    {"_id": ObjectId(user.id)},
                    {"$set": {"password_hash": password_hash}},
                )

                flash("Your password has been set.")
                return redirect(url_for("login"))
            else:
                flash("An account already exists with that email.")
                return redirect(url_for("login"))

        # Create new user
        new_user = {
            "email": form.email.data,
            "password_hash": generate_password_hash(form.password.data),
            "created_at": datetime.now(timezone.utc),
        }

        result = users.insert_one(new_user)
        flash("Congratulations, you are now registered!")
        return redirect(url_for("login"))

    return render_template("register.html", form=form)


@app.route("/logout")
def logout():
    """Log out a user by clearing their session."""
    if not current_user.is_authenticated:
        print("User not logged in")
        return redirect(url_for("index"))
    # Clear the session and log out the user
    print("Logging out user")
    logout_user()
    session.clear()
    return redirect(url_for("index"))


# Password reset functionality
def send_password_reset_email(user_email):
    """Send a password reset email to the user."""
    token = generate_reset_token(user_email)
    reset_url = url_for("reset_password", token=token, _external=True)

    msg = Message("Password Reset Request", recipients=[user_email])
    msg.body = f"To reset your password, visit the following link: {reset_url} If you did not make this request, simply ignore this email."
    mail.send(msg)


def generate_reset_token(email):
    """Generate a password reset token."""
    return serializer.dumps(email, salt="password-reset")


def verify_reset_token(token, expiration=3600):
    """Verify the password reset token."""
    try:
        email = serializer.loads(token, salt="password-reset", max_age=expiration)
    except:
        return None
    return email


@app.route("/reset_password_request", methods=["GET", "POST"])
def reset_password_request():
    """Request a password reset for the user."""
    if current_user.is_authenticated:
        return redirect(url_for("index"))

    form = PasswordResetRequestForm()
    if form.validate_on_submit():
        user_data = users.find_one({"email": form.email.data})
        if user_data:
            send_password_reset_email(form.email.data)
        flash("Check your email for instructions to reset your password.")
        return redirect(url_for("login"))

    return render_template("reset_password_request.html", form=form)


@app.route("/reset_password/<token>", methods=["GET", "POST"])
def reset_password(token):
    """Reset the user's password."""

    print("Resetting password")
    print("token", token)

    if not token:
        flash("Invalid or expired token.")
        return redirect(url_for("reset_password_request"))

    if current_user.is_authenticated:
        return redirect(url_for("index"))

    email = verify_reset_token(token)
    if not email:
        flash("The reset link is invalid or has expired.")
        return redirect(url_for("reset_password_request"))

    form = PasswordResetForm()
    if form.validate_on_submit():
        user_data = users.find_one({"email": email})
        if not user_data:
            flash("User not found.")
            return redirect(url_for("index"))

        user = User(user_data)
        password_hash = user.set_password(form.password.data)

        users.update_one(
            {"_id": ObjectId(user.id)}, {"$set": {"password_hash": password_hash}}
        )

        flash("Your password has been reset.")
        return redirect(url_for("login"))

    return render_template("reset_password.html", form=form, token=token)


@app.route("/account")
def account():
    """Display the user's account page with their layouts."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("home"))

    user = users.find_one({"_id": ObjectId(user_id)})
    user_layouts = list(layouts.find({"account_id": ObjectId(user_id)}))
    return render_template("account.html", user=user, layouts=user_layouts)


@app.route("/layout/<layout_id>", methods=["GET", "POST"])
@login_required
def view_layout(layout_id):
    """View and edit a layout."""
    user_id = session.get("_user_id")
    if not user_id:
        return redirect(url_for("home"))

    layout_doc = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not layout_doc:
        return "Layout not found", 404

    if request.method == "POST":
        # Handle JSON data from AJAX
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


# Share functionality for read-only access
@app.route("/share/<layout_id>", methods=["GET", "POST"])
@login_required
def share_layout(layout_id):
    # Get the layout
    layout = db.layouts.find_one({"_id": ObjectId(layout_id)})

    if not layout:
        flash("Layout not found.")
        return redirect(url_for("index"))

    # Check ownership

    print("layout", layout)
    print("current_user", current_user)

    if str(layout.get("account_id")) != current_user.id:
        flash("You do not have permission to share this layout.")
        return redirect(url_for("index"))

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
            "view_shared_layout", layout_id=layout_id, code=access_code, _external=True
        )

        msg = Message("Layout Shared With You", recipients=[form.email.data])
        msg.body = f"""You have been given access to view a layout.
                    Access with this link: {share_url}
                    Access code: {access_code}
                    """
        mail.send(msg)

        flash(f"Layout shared with {form.email.data}")
        return redirect(url_for("view_layout", layout_id=layout_id))

    return render_template("share_layout.html", form=form, layout=layout)


@app.route("/shared/<layout_id>", methods=["GET", "POST"])
def view_shared_layout(layout_id):
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
        return redirect(url_for("index"))

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


@app.route("/create_layout", methods=["GET", "POST"])
def create_layout():
    """Create a new layout."""
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("home"))

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

        return redirect(url_for("view_layout", layout_id=layout_id))

    return render_template("create_layout.html")


@app.route("/clone_layout/<layout_id>")
def clone_layout(layout_id):
    """Clone an existing layout."""
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("home"))

    # Fetch the original layout
    original_layout = layouts.find_one(
        {"_id": ObjectId(layout_id), "account_id": ObjectId(user_id)}
    )

    if not original_layout:
        flash("Layout not found", "error")
        return redirect(url_for("account"))

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
    return redirect(url_for("view_layout", layout_id=new_layout_id))


@app.route("/edit_layout_metadata", methods=["POST"])
def edit_layout_metadata():
    """Update the metadata for a layout."""
    user_id = session.get("user_id")
    if not user_id:
        return redirect(url_for("home"))

    layout_id = request.form.get("layout_id")
    publication_name = request.form.get("publication_name")
    issue_name = request.form.get("issue_name")
    publication_date = request.form.get("publication_date")
    return_to = request.form.get("return_to", "account")  # Default to account view

    if not all([layout_id, publication_name, issue_name]):
        flash("Publication name and issue name are required", "error")
        if return_to == "layout":
            return redirect(url_for("view_layout", layout_id=layout_id))
        else:
            return redirect(url_for("account"))

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
        return redirect(url_for("view_layout", layout_id=layout_id))
    else:
        return redirect(url_for("account"))


@app.route("/api/page/<layout_id>", methods=["POST"])
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


@app.route("/api/page/<layout_id>/<page_id>", methods=["PUT", "DELETE"])
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


@app.route("/api/layout/<layout_id>/analytics", methods=["GET"])
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


@app.route("/session")
def session_info():
    return jsonify(dict(session))


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
