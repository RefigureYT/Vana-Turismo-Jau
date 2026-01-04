import os
from dotenv import load_dotenv
from flask import Flask, redirect, url_for, request
from flask_login import current_user

from app.extensions import db, login_manager

load_dotenv()


def build_db_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    host = os.getenv("PGHOST", "localhost")
    port = os.getenv("PGPORT", "5432")
    name = os.getenv("PGDATABASE", "vanatur")
    user = os.getenv("PGUSER", "postgres")
    pwd = os.getenv("PGPASSWORD", "postgres")
    return f"postgresql+psycopg://{user}:{pwd}@{host}:{port}/{name}"


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="public/static",
        static_url_path="/static"
    )

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = build_db_url()
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,     # testa a conexão antes de usar
        "pool_recycle": 1800,      # recicla conexões antigas (30 min)
        "connect_args": {"connect_timeout": 5},
    }

    db.init_app(app)
    login_manager.init_app(app)

    # define para onde vai quando precisa logar
    login_manager.login_view = "login.login_get"

    # garante que o model carregou
    from app.models.models import User  # noqa: F401

    # registra rotas
    from routes.home import home_bp
    from routes.login import login_bp
    from routes.sign_user import sign_user_bp
    
    app.register_blueprint(home_bp)
    app.register_blueprint(login_bp)
    app.register_blueprint(sign_user_bp)
    
    # força login em tudo (exceto allowlist)
    @app.before_request
    def force_login():
        if request.endpoint is None:
            return None
        if request.endpoint.startswith("static"):
            return None

        # Rotas sempre públicas
        allow = {
            "login.login_get",
            "login.login_post",
            "login.logout",
        }

        # --- NOVO: Libera /sign-user apenas se NÃO houver nenhum usuário no banco
        if request.endpoint == "sign_user.sign_user":
            # Checa se existe pelo menos 1 usuário
            has_any_user = User.query.first() is not None
            
            # Se não tem nenhum usuário, libera acesso sem login
            if not has_any_user:
                return None
            # Se já tem usuário, segue o fluxo normal (exige login)

        if request.endpoint in allow:
            return None

        if not current_user.is_authenticated:
            return redirect(url_for("login.login_get"))

        return None

    @app.after_request
    def no_cache(resp):
        resp.headers["Cache-Control"] = "no-store"
        return resp

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)