# ⚙️ Utility Bill Management System — Server (Backend)

The **Utility Bill Management System (Server)** is the backend API built using **Node.js**, **Express.js**, and **MongoDB**.  
It handles bill data management, user-specific payment records, and all CRUD operations for the MERN-based Utility Bill Management web app.

This server powers the **Utility Bill Management System client**, which allows users to view, filter, pay, and manage monthly utility bills (Electricity, Gas, Water, Internet).

---

## 🌍 Live API & Repositories

- 🚀 **Live API URL:** [👉 https://smart-bills-server-nine.vercel.app/](#)
- 💻 **Client Repo:** [👉 https://github.com/mdfardinislamselim/smart-bills-client](#)
- ⚙️ **Server Repo:** [👉 https://github.com/mdfardinislamselim/smart-bills-server](#)

---

## 🧱 Tech Stack

- **Node.js** – Backend runtime
- **Express.js** – API framework
- **MongoDB Atlas** – Database
- **Mongoose** – ODM for MongoDB
- **dotenv** – Environment variable management
- **CORS** – Cross-origin requests support
- **Firebase Auth integration (client)** – For token validation (if implemented)

---

## 🚀 Features

- 📡 RESTful API endpoints for bills and user-paid bills
- 🔍 Bills filtering by category via query parameters
- 📋 CRUD operations for both `bills` and `myBills` collections
- 🔐 Secured user-based data access (each user sees only their own paid bills)
- 🧾 Server-side data validation for paid bills
- 🌐 CORS configuration for frontend domain
- ☁️ MongoDB Atlas cloud database connection
- ⚡ Deployed on **Vercel** (serverless-friendly setup)
