# Backend Service (Flask)

Backend service for a beverage ordering and recommendation system based on association-rule mining (Apriori) and user analytics.

---

# 后端服务说明 (Flask)

这是一个饮品点餐与推荐系统的后端服务，核心包含关联规则推荐（Apriori）和用户分析功能。

## Installation

```bash
pip install -r requirements.txt
```

## 安装

```bash
pip install -r requirements.txt
```

## Configuration

Configure your MySQL connection before starting:

- Update DB settings in `backend/db.py` (or your own config source).
- Make sure your target database exists and schema is initialized.

## 配置

启动前请先配置 MySQL：

- 修改 `backend/db.py` 里的数据库连接信息（或你自己的配置文件）。
- 确保目标数据库已创建并完成表结构初始化。

## Run

```bash
# Run from project root
python backend/app.py
```

## 运行

```bash
# 在项目根目录执行
python backend/app.py
```

## Default Endpoints

- Admin panel: `http://localhost:5000/admin`
- Miniapp API base: `http://localhost:5000/api/...`

## 默认访问地址

- 管理后台: `http://localhost:5000/admin`
- 小程序 API: `http://localhost:5000/api/...`

## Backend Screenshots

### Login
![Backend Login](../img/Flask/loginPage.png)

### Dashboard
![Backend Dashboard](../img/Flask/Dashboard.png)

### Gold Match
![Backend Gold Match](../img/Flask/GoldMatch1.png)

### Realtime Sales
![Backend Realtime Sales](../img/Flask/RealtimeSales1.png)

## 后端页面截图

### 登录页
![后端登录页](../img/Flask/loginPage.png)

### 数据看板
![后端数据看板](../img/Flask/Dashboard.png)

### 黄金搭配页
![后端黄金搭配页](../img/Flask/GoldMatch1.png)

### 实时销售页
![后端实时销售页](../img/Flask/RealtimeSales1.png)

## Default Admin Credentials

- Username: `admin`
- Password: `admin`

## 默认后台账号

- 用户名: `admin`
- 密码: `admin`
