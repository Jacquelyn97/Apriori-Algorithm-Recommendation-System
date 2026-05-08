# Apriori Algorithm Recommendation System

This repository is a full-stack beverage ordering and recommendation project built for portfolio and interview demonstration.  
It integrates a Flask admin backend, recommendation logic (Apriori + clustering), a WeChat Mini Program client, and a React Native mobile client.

## Academic Context

This project was developed during my study period in China.  
For that reason, most in-system labels, comments, and business-facing texts are primarily in Chinese.

## Language Note for Reviewers

- Primary language inside the system: Chinese
- Primary language in this README (first section): English
- Chinese explanation is provided in a dedicated section after the full English documentation

If you are an English-speaking reviewer, please use the screenshots and section-by-section explanations below to understand each page's purpose and workflow.

## Project Structure

- `backend`: Flask backend, admin pages, analytics pages, and miniapp APIs
- `weapp`: WeChat Mini Program frontend
- `mobile`: React Native (Expo) frontend
- `sql`: Database schema/setup scripts
- `img`: UI screenshots for backend and miniapp

## Core Capabilities

1. **Customer Profiling and Segmentation**
   - Build user profile statistics (gender, age, occupation, city, growth).
   - Perform clustering-based segmentation for customer groups.

2. **Apriori-Based Product Recommendation**
   - Mine item associations from order data.
   - Generate recommendation rules with support/confidence/lift levels.
   - Provide practical recommendation use cases such as bundle design and smart suggestion.

3. **Business Dashboard and Realtime Monitoring**
   - Sales dashboard for trend and store-level visibility.
   - Realtime metrics such as hourly orders, ticket-size distribution, and category share.

4. **End-to-End Ordering Flow**
   - Miniapp and mobile ordering workflows.
   - Order persistence, history querying, and status transitions.

## Tech Stack

- Backend: Flask, PyMySQL, NumPy, scikit-learn
- Frontend: WeChat Mini Program, React Native (Expo)
- Database: MySQL

## Quick Start

### 1) Run Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Access URLs:

- Admin panel: `http://localhost:5000/admin`
- API base: `http://localhost:5000/api/...`

### 2) Run Mobile (Expo)

```bash
cd mobile
npm install
npm run start
```

### 3) Run WeChat Mini Program

Import the `weapp` directory into WeChat DevTools and configure its API base URL to point to your backend server.

## Screenshot Walkthrough

### A) Flask Backend

#### 1. Login Page
![Flask Login](img/Flask/loginPage.png)
- Purpose: entry point for admin users.
- What to look at: credential validation and protected-route access.

#### 2. Dashboard
![Flask Dashboard](img/Flask/Dashboard.png)
- Purpose: high-level business overview.
- What to look at: revenue, orders, customer trend, and store performance.

#### 3. Gold Match (Recommendation) - View 1
![Flask Gold Match 1](img/Flask/GoldMatch1.png)
- Purpose: visualize Apriori rule outcomes.
- What to look at: frequent pairs, top rules, and recommendation confidence.

#### 4. Gold Match (Recommendation) - View 2
![Flask Gold Match 2](img/Flask/GoldMatch2.png)
- Purpose: additional recommendation details and strategy cards.
- What to look at: actionable bundle suggestions and rule ranking.

#### 5. User Segmentation
![Flask User Segmentation](img/Flask/UserSegmentation.png)
- Purpose: analyze customer segments and behavior profiles.
- What to look at: segment distribution, group characteristics, and migration signals.

#### 6. Realtime Sales
![Flask Realtime Sales](img/Flask/RealtimeSales1.png)
- Purpose: monitor current-day sales operations.
- What to look at: hourly trend, order volume, and live business indicators.

### B) WeChat Mini Program

#### 1. Main Page
![Miniapp Main Page](img/Miniapp/MainPage.jpg)
- Purpose: home entry and navigation.
- What to look at: user-facing entry points to products and order flow.

#### 2. Product Page
![Miniapp Product Page](img/Miniapp/ProductPage.jpg)
- Purpose: product browsing and selection.
- What to look at: item listings and purchasable menu structure.

#### 3. Order Page
![Miniapp Order Page](img/Miniapp/OrderPage.jpg)
- Purpose: checkout and order creation.
- What to look at: order details, total calculation, and submit flow.

#### 4. Profile Page
![Miniapp Profile Page](img/Miniapp/ProfilePage.jpg)
- Purpose: user account and personal operations.
- What to look at: user info, entry to historical orders and account actions.

#### 5. History Page
![Miniapp History Page](img/Miniapp/HistoryPage.jpg)
- Purpose: persistent order history for user review.
- What to look at: previous orders and status trace.

#### 6. Confirm Order
![Miniapp Confirm Order](img/Miniapp/ConfirmOrder.jpg)
- Purpose: order completion interaction.
- What to look at: status transition from pending/picked to completed.

### C) More Images

- Backend screenshots directory: `img/Flask/`
- Miniapp screenshots directory: `img/Miniapp/`

## Portfolio Highlights

- Demonstrates full-stack delivery: algorithms + backend + frontend integration
- Translates data-mining outputs into business-friendly pages and decisions
- Includes practical workflows rather than isolated technical demos
- Structured for interview walkthrough with clear modules and reproducible setup

## Notes

- This repository is curated for portfolio review.
- Certain labels and interface texts remain Chinese by design (real project context).
- Temporary local files and personal configurations are excluded from version control.

---

# 中文说明

## 项目背景

本项目是在我于中国留学期间完成的，因此系统中的业务字段、页面文案和注释多数以中文为主，这也是项目的真实使用场景。

## 项目简介

这是一个用于作品集与面试展示的全栈饮品点餐与推荐系统，整合了 Flask 后端管理系统、Apriori 关联推荐、用户分群分析、微信小程序和移动端流程。

## 项目结构

- `backend`: Flask 后端、管理后台页面、分析页面、小程序 API
- `weapp`: 微信小程序前端
- `mobile`: React Native（Expo）前端
- `sql`: 数据库建表与初始化脚本
- `img`: 后端与小程序页面截图

## 核心能力

1. **用户画像与分群**
   - 用户基础画像统计（性别、年龄、职业、城市、增长趋势）
   - 聚类分群与群体特征分析

2. **Apriori 关联推荐**
   - 基于订单数据挖掘商品关联关系
   - 支持度、置信度、提升度分级规则
   - 输出可落地的套餐与推荐建议

3. **经营看板与实时监控**
   - 销售看板与门店表现分析
   - 实时订单趋势、客单价分布、类目占比

4. **完整下单链路**
   - 小程序与移动端下单流程
   - 订单持久化、历史查询、状态流转

## 快速启动

### 1) 启动后端

```bash
cd backend
pip install -r requirements.txt
python app.py
```

访问地址：

- 管理后台：`http://localhost:5000/admin`
- API 基础路径：`http://localhost:5000/api/...`

### 2) 启动移动端（Expo）

```bash
cd mobile
npm install
npm run start
```

### 3) 启动微信小程序

将 `weapp` 目录导入微信开发者工具，并将其 API 地址配置到后端服务。

## 截图说明

- 后端截图目录：`img/Flask/`
- 小程序截图目录：`img/Miniapp/`

README 英文部分已对主要页面逐一解释，便于不懂中文的审阅者理解页面用途与业务流程。
