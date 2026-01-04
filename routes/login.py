from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user
from sqlalchemy.exc import OperationalError

from app.extensions import db
from app.models.models import User

login_bp = Blueprint("login", __name__, url_prefix="/login")


@login_bp.get("/")
def login_get():
    return render_template("login.html")


@login_bp.post("/")
def login_post():
    email = (request.form.get("email") or "").strip().lower()
    password = request.form.get("password") or ""

    try:
        user = User.query.filter_by(email=email).first()
    except OperationalError:
        # Conexão caiu/morreu no pool -> limpa e tenta de novo 1x
        db.session.rollback()
        db.engine.dispose()
        try:
            user = User.query.filter_by(email=email).first()
        except OperationalError:
            flash("Servidor indisponível no momento. Tente novamente em instantes.", "error")
            return redirect(url_for("login.login_get"))

    if not user or not user.check_password(password):
        flash("E-mail ou senha inválidos.", "error")
        return redirect(url_for("login.login_get"))

    login_user(user)
    return redirect(url_for("home.home"))


@login_bp.get("/logout")
def logout():
    logout_user()
    return redirect(url_for("login.login_get"))
