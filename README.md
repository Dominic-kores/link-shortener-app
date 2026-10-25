
# 🔗 Linkly — Full-Stack Link Shortener

A full-stack URL shortening application built with **React, Node.js, Express, PostgreSQL, and Prisma ORM**. Linkly allows users to convert long URLs into short, shareable links, generate QR codes, and monitor link performance through an analytics dashboard.

## 🎯 Project Objectives

- Build a secure full-stack application using RESTful APIs.
- Implement user authentication with JWT and bcrypt.
- Generate unique six-character short URLs using nanoid.
- Track link clicks, referrers, and browser information.
- Develop a responsive analytics dashboard.
- Integrate PostgreSQL using Prisma ORM.
- Deploy the frontend and backend to cloud platforms.

## ✨ Key Features

- **User Authentication:** Secure registration, login, and protected routes.
- **URL Shortening:** Generate unique, shareable short links.
- **Custom Short Codes:** Create personalised short URLs.
- **Link Expiration:** Set optional expiry dates.
- **QR Code Generation:** Generate and download QR codes.
- **Click Analytics:** Monitor clicks, referrers, and browsers.
- **Link Management:** View, copy, and delete saved links.
- **Bulk Creation:** Upload multiple URLs through CSV files.
- **Responsive Design:** Accessible on desktop and mobile devices.

## 🛠️ Technology Stack

| Frontend | Backend | Database & Tools |
|---|---|---|
| React (Vite) | Node.js | PostgreSQL |
| Tailwind CSS | Express.js | Prisma ORM v6 |
| React Router | JWT & bcrypt | Git & GitHub |
| Axios | nanoid | Thunder Client |
| Recharts | QRCode | Railway & Vercel |

## 📁 Project Structure

```text
link-shortener/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── server.js
│   └── package.json
│
└── README.md
```

## 🚀 Installation and Setup

**1. Clone the repository**

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd link-shortener
```

**2. Set up the backend**

```bash
cd server
npm install
```

Create `server/.env`:

```env
DATABASE_URL="YOUR_POSTGRESQL_DATABASE_URL"
JWT_SECRET="YOUR_SECURE_JWT_SECRET"
PORT=5001
BASE_URL="http://localhost:5001"
CLIENT_URL="http://localhost:5173"
```

Run Prisma migrations and start the server:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

**3. Set up the frontend**

In a separate terminal:

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5001/api
```

Start React:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🔗 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Current user |
| POST | `/api/links` | Create short link |
| GET | `/api/links` | Retrieve saved links |
| GET | `/api/links/:id/stats` | View analytics |
| DELETE | `/api/links/:id` | Delete link |
| POST | `/api/links/bulk` | Bulk CSV creation |
| GET | `/:shortCode` | Redirect to original URL |

---
## 🌐 Live Deployment

- **Frontend (Vercel):** Add your deployed frontend URL
- **Backend (Railway):** Add your deployed backend URL
- **GitHub Repository:** Add your GitHub repository URL

*Note: Localhost URLs and QR codes are only accessible within the relevant local development environment. Public QR links require a publicly accessible backend.*

## 📚 Learning Outcomes

This project strengthened my practical understanding of full-stack development, database relationships, REST APIs, secure authentication, URL redirection, asynchronous click tracking, and frontend-backend integration.



---
## 👨‍💻 Author

**Dominic Kores Kisioya**  
Full-Stack Software & AI Engineer
