# routes/home.py
from flask import Blueprint, render_template
from flask_login import login_required, current_user

home_bp = Blueprint("home", __name__)

@home_bp.get("/")
@login_required
def home():
    user_label = current_user.full_name or current_user.email
    return render_template("home.html", user_label=user_label)
