# backend/app.py
from flask import Flask
from blueprints.dashboard import bp as dashboard_bp
from blueprints.gold_match import bp as gold_bp
from blueprints.segmentation import bp as seg_bp
from blueprints.realtime_sales import bp as rt_bp
from blueprints.customer_profile import bp as profile_bp
from blueprints.miniapp_api import bp as miniapp_api_bp

def create_app():
    app = Flask(__name__, template_folder="templates")
    app.config["SECRET_KEY"] = "dev"  # 自己改

    app.register_blueprint(dashboard_bp, url_prefix="/")
    app.register_blueprint(gold_bp, url_prefix="/gold")
    app.register_blueprint(seg_bp, url_prefix="/seg")
    app.register_blueprint(rt_bp, url_prefix="/realtime")
    app.register_blueprint(profile_bp, url_prefix="/profile")
    app.register_blueprint(miniapp_api_bp, url_prefix="/api")

    @app.before_request
    def require_login():
        from flask import request, redirect, url_for, session
        # 允许未登录访问登录/登出以及静态资源
        if request.endpoint in ("dashboard.login", "dashboard.logout", "static"):
            return None
        # 允许小程序 API 访问（不走后台登录）
        if request.path.startswith("/api/"):
            return None
        if not session.get("logged_in"):
            return redirect(url_for("dashboard.login"))

    @app.after_request
    def add_no_cache_headers(response):
        """
        登出后禁止通过浏览器返回键看到缓存页面：
        给所有响应添加 no-store 等缓存控制头。
        """
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    return app

if __name__ == "__main__":
    app = create_app()
    # 让小程序真机/局域网可访问（将 BASE_URL 指向本机局域网 IP）
    app.run(debug=True, host="0.0.0.0", port=5000)