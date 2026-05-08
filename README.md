# Apriori Algorithm Recommendation System

A full-stack beverage ordering and recommendation project built for portfolio and interview demos.  
It combines a Flask admin backend, recommendation logic (Apriori + clustering), and multiple client apps.

---

# Apriori 推荐系统（中英双语说明）

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

### Current Images

- Backend/Flask screenshots are currently available in your local source document (`C:\Users\user\Downloads\img.docx`).
- Existing repository images:
  - Login: `blueprint/img/loginImg.png`
  - ER Diagram: `E-R diagram.png`

### Suggested Additional Screenshots

- Admin dashboard overview
- Gold recommendation page
- Segmentation page
- Miniapp ordering page
- Mobile app home/order page

## 演示截图说明

### 当前已有图片

- 你本地的后端（Flask）效果图已在 `C:\Users\user\Downloads\img.docx` 中。
- 仓库已包含图片：
  - 登录页: `blueprint/img/loginImg.png`
  - ER 图: `E-R diagram.png`

### 建议补充图片

- 管理后台总览页
- 黄金搭配推荐页
- 用户分群页
- 小程序下单页
- 移动端首页/订单页

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
