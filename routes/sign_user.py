# routes/sign_user.py
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import current_user
from app.extensions import db
from app.models.models import User

sign_user_bp = Blueprint("sign_user", __name__)

@sign_user_bp.route("/sign-user", methods=["GET", "POST"])
def sign_user():
    # Se já existe usuário no sistema e a pessoa não está logada, redireciona
    has_any_user = User.query.first() is not None
    if has_any_user and not current_user.is_authenticated:
        return redirect(url_for("login.login_get"))

    if request.method == "POST":
        full_name = (request.form.get("full_name") or "").strip()
        email = (request.form.get("email") or "").strip().lower()
        password = (request.form.get("password") or "")
        confirm_password = (request.form.get("confirm_password") or "")

        errors: list[str] = []

        if not email:
            errors.append("E-mail é obrigatório.")
        if not password:
            errors.append("Senha é obrigatória.")
        if password and len(password) < 8:
            errors.append("A senha deve ter pelo menos 8 caracteres.")
        if password != confirm_password:
            errors.append("As senhas não conferem.")

        # Verifica se já existe usuário com o mesmo email
        if email and User.query.filter_by(email=email).first():
            errors.append("Já existe um usuário cadastrado com esse e-mail.")

        if errors:
            for msg in errors:
                flash(msg, "error")
            # Mantém valores já digitados
            return render_template(
                "sign_user.html",
                full_name=full_name,
                email=email,
            )

        # Cria novo usuário
        user = User(
            email=email,
            full_name=full_name or None,
        )
        user.set_password(password)

        db.session.add(user)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            flash("Erro ao salvar usuário. Tente novamente.", "error")
            return render_template(
                "sign_user.html",
                full_name=full_name,
                email=email,
            )

        flash("Usuário criado com sucesso!", "success")
        
        # Se for o primeiro usuário, redireciona para o login
        # Senão, volta para a mesma tela (para criar mais usuários)
        if not has_any_user:
            flash("Primeiro usuário criado! Faça login para continuar.", "success")
            return redirect(url_for("login.login_get"))
        
        return redirect(url_for("sign_user.sign_user"))

    # GET
    return render_template("sign_user.html")