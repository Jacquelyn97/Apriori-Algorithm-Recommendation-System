# Apriori Algorithm Recommendation System

A full-stack beverage ordering and recommendation project built for portfolio and interview demo.  
It combines a Flask admin backend, recommendation logic (Apriori + clustering), and client apps.

## What this project includes

- `backend`: Flask web app + admin pages + miniapp API endpoints
- `weapp`: WeChat Mini Program client
- `mobile`: React Native (Expo) mobile client
- `sql`: SQL script for database setup

## Core features

- User segmentation and customer profiling
- Apriori-based product association recommendation
- Real-time sales views and dashboard pages
- Order flow support in miniapp/mobile clients

## Tech stack

- Backend: Flask, PyMySQL, NumPy, scikit-learn
- Mobile: React Native, Expo, React Navigation, Axios
- Data: MySQL

## Quick start

### 1) Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Open:

- Admin: `http://localhost:5000/admin`
- API base: `http://localhost:5000/api/...`

### 2) Mobile (Expo)

```bash
cd mobile
npm install
npm run start
```

### 3) WeChat mini program

Import the `weapp` folder into WeChat DevTools and configure your API base URL to your backend server.

## Demo screenshots

### Login / Entry

![Login](blueprint/img/loginImg.png)

### Data model

![ER Diagram](E-R%20diagram.png)

## Portfolio highlights

- Demonstrates full-stack thinking: algorithm + backend + frontend clients
- Includes practical business features instead of algorithm-only demos
- Easy to present in interviews with clear modules and runnable setup

## Notes

- This repository is curated for portfolio review.
- Temporary files, local configs, and personal documents are excluded.
