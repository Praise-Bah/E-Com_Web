# GlobalMart (GM) - Amazon Clone

A full-stack Amazon-like e-commerce UI clone built with HTML, CSS, vanilla JavaScript, Node.js/Express, and MySQL.

## Features

- **Homepage** with hero banner and product rows
- **Product listing** with category filters and search
- **Product detail** page with add-to-cart
- **Shopping cart** synced to database
- **User authentication** (signup, login, logout)
- **Orders page** showing user's order history
- **Account page** with user profile

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Dockerized for development)
- **Auth**: JWT tokens with bcrypt password hashing

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Setup

1. Clone the repository
2. Start the database and API:
   ```bash
   docker-compose up --build
   ```
3. Open `index.html` in a browser (or use Live Server)

The API runs at `http://localhost:3000/api`

## Deployment (100% Free)

### Step 1: Create Free MySQL Database (TiDB Cloud)

1. Go to [tidbcloud.com](https://tidbcloud.com) and sign up (free)
2. Click **"Create Cluster"** → **"Serverless"** (free tier)
3. Choose a region and create
4. Once ready, click **"Connect"** → **"General"**
5. Note down: Host, Port, User, Password
6. Go to **"SQL Editor"** and paste the contents of `db/init.sql` → Run

### Step 2: Deploy Backend (Render - Free)

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables:
   - `DB_HOST` = (from TiDB Cloud)
   - `DB_PORT` = (from TiDB Cloud, usually 4000)
   - `DB_USER` = (from TiDB Cloud)
   - `DB_PASSWORD` = (from TiDB Cloud)
   - `DB_NAME` = `globalmart`
   - `DB_SSL` = `true`
   - `JWT_SECRET` = (any random string)
6. Click **"Create Web Service"**
7. Copy your Render URL (e.g., `https://globalmart-api.onrender.com`)

### Frontend (Netlify)

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repo
4. Set publish directory to root (`.`)
5. Before deploying, update `assets/js/config.js`:
   ```js
   const API_BASE = 'https://YOUR_RENDER_APP.onrender.com/api';
   ```
6. Deploy!

## Project Structure

```
E-Com_Web/
├── index.html          # Homepage
├── products.html       # Product listing
├── product.html        # Product detail
├── cart.html           # Shopping cart
├── login.html          # Sign in
├── signup.html         # Create account
├── account.html        # User account
├── orders.html         # Order history
├── assets/
│   ├── css/global.css  # All styles
│   └── js/
│       ├── config.js   # API URL config
│       └── app.js      # Frontend logic
├── server/             # Backend API
│   ├── index.js        # Express server
│   ├── package.json
│   └── Dockerfile
├── db/
│   └── init.sql        # Database schema
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/health | Health check | No |
| GET | /api/products | List products | No |
| GET | /api/products/:id | Get product | No |
| GET | /api/categories | List categories | No |
| POST | /api/auth/register | Create account | No |
| POST | /api/auth/login | Sign in | No |
| GET | /api/auth/me | Current user | Yes |
| GET | /api/cart | Get cart | No |
| POST | /api/cart/sync | Sync cart | No |
| GET | /api/orders | List orders | Yes |
| POST | /api/orders | Create order | Yes |

## License

This project is for educational purposes only.