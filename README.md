# ⚙️ Utility Bill Management System — Server (Backend)

The **Utility Bill Management System (Server)** is the backend API built using **Node.js**, **Express.js**, and **MongoDB**.
It powers the **MERN-based Utility Bill Management web app**, allowing users to **view, filter, pay, and manage monthly utility bills** securely.

This backend handles **CRUD operations** for bills, manages **user-specific payment records**, and ensures **secure, token-verified access**.

---

## 🌍 Live API & Repositories

* 🚀 **Live API URL:** [https://smart-bills-server-nine.vercel.app/](https://smart-bills-server-nine.vercel.app/)
* 💻 **Client Repo:** [https://github.com/mdfardinislamselim/smart-bills-client](https://github.com/mdfardinislamselim/smart-bills-client)
* ⚙️ **Server Repo:** [https://github.com/mdfardinislamselim/smart-bills-server](https://github.com/mdfardinislamselim/smart-bills-server)

---

## 🖼️ Screenshot / Example Response

*(Optional: Add a screenshot of Postman request or API response here)*

![API Example](https://i.ibb.co/6H3v1kf/api-screenshot.png)

---

## 🧱 Tech Stack

* **Node.js** – Backend runtime environment
* **Express.js** – API framework for RESTful routes
* **MongoDB Atlas** – Cloud database for bills and payments
* **Mongoose** – ODM for MongoDB
* **dotenv** – Environment variable management
* **CORS** – Cross-origin request support
* **Firebase Admin SDK** – Token validation for secure user authentication

---

## 🚀 Key Features

* 📡 **RESTful API endpoints** for `bills` and `myBills` collections
* 🔍 **Filter bills by category** using query parameters
* 📋 **CRUD operations**: Create, Read, Update, Delete bills & paid bills
* 🔐 **User-based access control**: Each user can only access their own paid bills
* 🧾 **Server-side validation** for bill data
* 🌐 **CORS enabled** for frontend domain integration
* ☁️ **MongoDB Atlas** for cloud database storage
* ⚡ **Vercel deployment** for serverless-friendly hosting

---

## 📦 Project Dependencies

```json
"dependencies": {
  "express": "^4.18.2",
  "mongodb": "^6.10.0",
  "mongoose": "^7.5.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "bcrypt": "^5.1.0",
  "firebase-admin": "^12.10.0"
}
```

---

## 🚀 Local Setup Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/mdfardinislamselim/smart-bills-server.git
cd smart-bills-server
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the project root:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
FIREBASE_SERVICE_KEY=your_base64_encoded_firebase_service_key
```

### 4️⃣ Run the Server

```bash
npm run dev   # for development using nodemon
# or
node index.js # for production
```

After running, the API will be available at:
`http://localhost:5000` (or the port you configured)

---

## 📄 API Endpoints Overview

### Bills

* `GET /bills` – Get all bills (optional query: `?category=Electricity`)
* `GET /bills/:id` – Get bill by ID
* `POST /bills` – Add new bill
* `PUT /bills/:id` – Update bill
* `DELETE /bills/:id` – Delete bill

### My Paid Bills (User-specific)

* `GET /myBills` – Get logged-in user’s paid bills
* `POST /myBills` – Pay a bill
* `PUT /myBills/:id` – Update a paid bill
* `DELETE /myBills/:id` – Delete a paid bill

