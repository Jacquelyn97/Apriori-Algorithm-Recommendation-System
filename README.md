# Apriori Algorithm Recommendation System

A full-stack beverage ordering and recommendation project built for portfolio and interview demos.  
It combines a Flask admin backend, recommendation logic (Apriori + clustering), and multiple client apps.

---

# Apriori 推荐系统

这是一个用于作品集和面试展示的全栈饮品点餐与推荐项目。  
项目包含 Flask 后端、Apriori+聚类推荐逻辑，以及多端客户端实现。

## Project Structure

- `backend`: Flask web app, admin pages, miniapp APIs
- `weapp`: WeChat Mini Program client
- `mobile`: React Native (Expo) client
- `sql`: Database schema/setup scripts

## 项目结构

- `backend`: Flask 后端、管理后台页面、小程序 API
- `weapp`: 微信小程序前端
- `mobile`: React Native（Expo）移动端
- `sql`: 数据库建表与初始化脚本

## Core Features

- User segmentation and customer profiling
- Apriori-based product association recommendations
- Real-time sales dashboards and metrics views
- End-to-end order flow for miniapp/mobile clients

## 核心功能

- 用户分群与画像分析
- 基于 Apriori 的商品关联推荐
- 实时销售看板与指标可视化
- 小程序与移动端下单全流程支持

## Tech Stack

- Backend: Flask, PyMySQL, NumPy, scikit-learn
- Frontend: WeChat Mini Program, React Native (Expo)
- Database: MySQL

## 技术栈

- 后端: Flask, PyMySQL, NumPy, scikit-learn
- 前端: 微信小程序, React Native (Expo)
- 数据库: MySQL

## Quick Start

### 1) Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Access:

- Admin: `http://localhost:5000/admin`
- API base: `http://localhost:5000/api/...`

### 2) Mobile (Expo)

```bash
cd mobile
npm install
npm run start
```

### 3) WeChat Mini Program

Import the `weapp` directory into WeChat DevTools, then set the API base URL to your backend service.

## 快速开始

### 1) 启动后端

```bash
cd backend
pip install -r requirements.txt
python app.py
```

访问地址：

- 管理后台: `http://localhost:5000/admin`
- API 基础路径: `http://localhost:5000/api/...`

### 2) 启动移动端 (Expo)

```bash
cd mobile
npm install
npm run start
```

### 3) 启动微信小程序

将 `weapp` 目录导入微信开发者工具，并将 API 地址指向你的后端服务。

## Demo Screenshots

### Flask Backend UI

#### Login
![Flask Login](img/Flask/loginPage.png)

#### Dashboard
![Flask Dashboard](img/Flask/Dashboard.png)

#### Gold Match (Recommendation)
![Flask Gold Match 1](img/Flask/GoldMatch1.png)
![Flask Gold Match 2](img/Flask/GoldMatch2.png)

#### User Segmentation
![Flask User Segmentation](img/Flask/UserSegmentation.png)

#### Realtime Sales
![Flask Realtime Sales](img/Flask/RealtimeSales1.png)

### WeChat Mini Program UI

#### Main / Product / Order
![Miniapp Main Page](img/Miniapp/MainPage.jpg)
![Miniapp Product Page](img/Miniapp/ProductPage.jpg)
![Miniapp Order Page](img/Miniapp/OrderPage.jpg)

#### User / History / Confirm
![Miniapp Profile Page](img/Miniapp/ProfilePage.jpg)
![Miniapp History Page](img/Miniapp/HistoryPage.jpg)
![Miniapp Confirm Order](img/Miniapp/ConfirmOrder.jpg)

### More Screenshots

- More backend screenshots: `img/Flask/`
- More miniapp screenshots: `img/Miniapp/`

## 演示截图说明

### Flask 后端页面

#### 登录页
![Flask 登录页](img/Flask/loginPage.png)

#### 数据看板
![Flask Dashboard](img/Flask/Dashboard.png)

#### 黄金搭配推荐页
![Flask Gold Match 1](img/Flask/GoldMatch1.png)
![Flask Gold Match 2](img/Flask/GoldMatch2.png)

#### 用户分群页
![Flask User Segmentation](img/Flask/UserSegmentation.png)

#### 实时销售页
![Flask Realtime Sales](img/Flask/RealtimeSales1.png)

### 微信小程序页面

#### 首页 / 商品页 / 下单页
![小程序首页](img/Miniapp/MainPage.jpg)
![小程序商品页](img/Miniapp/ProductPage.jpg)
![小程序下单页](img/Miniapp/OrderPage.jpg)

#### 个人中心 / 历史订单 / 取餐确认
![小程序个人中心](img/Miniapp/ProfilePage.jpg)
![小程序历史订单](img/Miniapp/HistoryPage.jpg)
![小程序确认取餐](img/Miniapp/ConfirmOrder.jpg)

### 更多截图

- 更多 Flask 截图见：`img/Flask/`
- 更多小程序截图见：`img/Miniapp/`

## Portfolio Highlights

- Shows full-stack capability: algorithms + backend + frontend integration
- Contains practical business workflows, not just isolated algorithm demos
- Structured for interview walkthroughs with clear modules and runnable setup

## 作品集亮点

- 展示全栈能力：算法 + 后端 + 前端联动
- 强调业务可用性，不是只做算法演示
- 模块清晰，便于面试过程讲解与现场演示

## Notes

- This repository is curated for portfolio presentation.
- Temporary files and personal local configs are excluded.

## 备注

- 此仓库已按作品集展示进行整理。
- 临时文件与个人本地配置已排除在版本管理之外。
