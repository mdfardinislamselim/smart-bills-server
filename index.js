const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");

const decoded = Buffer.from(
  process.env.fierebase_serviice_key,
  "base64"
).toString("utf8");
const serviceAccount = JSON.parse(decoded);

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// Firebase Admin SDK initialization
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// verifyToken middleware
const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ message: "Unauthorized access. Token not found!" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decodedUser = await admin.auth().verifyIdToken(token);
    req.decodedUser = decodedUser;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).send({ message: "Unauthorized access. Invalid token." });
  }
};

// mongodb uri
const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_password}@cluster0.j5l5aiu.mongodb.net/?appName=Cluster0`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let billsCollection;
let paidBillsCollection;

async function run() {
  try {
    // Connect to MongoDB
    // await client.connect();
    const db = client.db("smart-bills");
    billsCollection = db.collection("bills");
    paidBillsCollection = db.collection("paidBills");

    //post bills
    app.post("/bills", async (req, res) => {
      const newBill = req.body;
      const result = await billsCollection.insertOne(newBill);
      res.send(result);
    });

    // Save user to database (Upsert)
    app.put("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role || "user",
          lastLogin: new Date()
        },
      };
      const result = await db.collection("users").updateOne(query, updateDoc, options);
      res.send(result);
    });

    // GET /bills with Search, Sort, and Pagination
    app.get("/bills", async (req, res) => {
      const { category, search, sort, page = 1, limit = 8 } = req.query;
      
      let query = {};
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } }
        ];
      }

      let sortOptions = {};
      if (sort === "priceLow") sortOptions.amount = 1;
      else if (sort === "priceHigh") sortOptions.amount = -1;
      else if (sort === "dateNew") sortOptions.date = -1;
      else if (sort === "dateOld") sortOptions.date = 1;
      else if (sort === "titleAZ") sortOptions.title = 1;
      else if (sort === "titleZA") sortOptions.title = -1;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitVal = parseInt(limit);

      try {
        const total = await billsCollection.countDocuments(query);
        const bills = await billsCollection
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitVal)
          .toArray();
        
        res.json({
          bills,
          total,
          totalPages: Math.ceil(total / limitVal),
          currentPage: parseInt(page)
        });
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch bills", error: err });
      }
    });

    // get categories
    app.get("/bills/categories", async (req, res) => {
      try {
        const categories = await billsCollection
          .aggregate([
            { $group: { _id: "$category" } },
            { $project: { _id: 0, category: "$_id" } },
          ])
          .toArray();

        const categoryNames = categories.map((c) => c.category);

        res.json(categoryNames);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        res
          .status(500)
          .json({ message: "Failed to fetch categories", error: err });
      }
    });

    // Get latest 3 bills
    app.get("/bills/latest3", async (req, res) => {
      try {
        const cursor = billsCollection.find().sort({ date: -1 }).limit(3);

        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching latest bills:", error);
        res.status(500).send({ message: "Failed to fetch latest bills" });
      }
    });

    // Get latest 6 bills
    app.get("/bills/latest6", async (req, res) => {
      try {
        const cursor = billsCollection.find().sort({ date: -1 }).limit(6);

        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching latest bills:", error);
        res.status(500).send({ message: "Failed to fetch latest bills" });
      }
    });

    // A bill of particulars
    app.get("/bills/:id", async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid bill id" });
      }
      const query = { _id: new ObjectId(id) };
      const result = await billsCollection.findOne(query);
      res.send(result);
    });

    // Admin: Delete marketplace bill
    app.delete("/bills/:id", verifyToken, async (req, res) => {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send("Invalid ID");
        const result = await billsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    });

    // Admin: Update marketplace bill
    app.patch("/bills/:id", verifyToken, async (req, res) => {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).send("Invalid ID");
        const updatedBill = req.body;
        delete updatedBill._id; // Ensure ID isn't modified
        const result = await billsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedBill }
        );
        res.send(result);
    });

    // User Profile & Role Fetch
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = await db.collection("users").findOne({ email });
      res.send(user);
    });

    // Admin Dashboard Stats
    app.get("/admin-stats", async (req, res) => {
      try {
        const totalUsers = await db.collection("users").countDocuments();
        const totalBills = await billsCollection.countDocuments();
        const paidBills = await paidBillsCollection.find().toArray();
        const totalRevenue = paidBills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);

        // Chart Data: Revenue by Category
        const revenueByCategory = await paidBillsCollection.aggregate([
          { $group: { _id: "$category", total: { $sum: { $toDouble: "$amount" } } } },
          { $project: { category: "$_id", total: 1, _id: 0 } }
        ]).toArray();

        // Chart Data: Transaction Count by Date (last 7 days)
        const recentTransactions = await paidBillsCollection.aggregate([
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$date" } } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 7 }
        ]).toArray();

        res.json({
          totalUsers,
          totalBills,
          totalRevenue,
          totalTransactions: paidBills.length,
          revenueByCategory,
          recentTransactions
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching stats");
      }
    });

    // User Transactions (for history)
    app.get("/user-stats/:email", async (req, res) => {
        const email = req.params.email;
        const bills = await paidBillsCollection.find({ email }).toArray();
        const totalSpent = bills.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
        
        res.json({
            transactionCount: bills.length,
            totalSpent,
            recentBills: bills.slice(-5).reverse()
        });
    });

    // Admin: Get All Users
    app.get("/admin/all-users", verifyToken, async (req, res) => {
        const users = await db.collection("users").find().toArray();
        res.send(users);
    });

    // Admin: Update User Role
    app.patch("/users/role/:email", verifyToken, async (req, res) => {
        const email = req.params.email;
        const { role } = req.body;
        const result = await db.collection("users").updateOne(
            { email },
            { $set: { role } }
        );
        res.send(result);
    });

    // Console message simplified for deployment
    // console.log("Database Operational");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }

  // Transaction endpoints
  app.post("/paid-bills", async (req, res) => {
    const paidBill = req.body;
    if (!paidBill || typeof paidBill !== "object") {
      return res.status(400).send({ message: "Invalid request body" });
    }
    const result = await paidBillsCollection.insertOne(paidBill);
    res.send(result);
  });

  app.get("/admin/all-transactions", verifyToken, async (req, res) => {
     const bills = await paidBillsCollection.find().toArray();
     res.send(bills);
  });

  // get paid bills
  app.get("/paid-bills/user", verifyToken, async (req, res) => {
    const { email } = req.query;

    if (!email || email !== req.decodedUser.email) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only access your own bills",
      });
    }

    try {
      const bills = await paidBillsCollection.find({ email }).toArray();
      res.send(bills);
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch bills" });
    }
  });

  // Update paid bill
  app.patch("/paid-bills/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    const updatedBill = req.body;

    const bill = await paidBillsCollection.findOne({ _id: new ObjectId(id) });

    if (!bill) return res.status(404).json({ message: "Bill not found" });

    if (bill.email !== req.decodedUser.email) {
      return res.status(403).json({ message: "Forbidden: Not your bill" });
    }

    const result = await paidBillsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedBill }
    );
    res.send(result);
  });

  // Delete a bill
  app.delete("/paid-bills/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    const bill = await paidBillsCollection.findOne({ _id: new ObjectId(id) });

    if (!bill) return res.status(404).json({ message: "Bill not found" });

    if (bill.email !== req.decodedUser.email) {
      return res.status(403).json({ message: "Forbidden: Not your bill" });
    }

    const result = await paidBillsCollection.deleteOne({
      _id: new ObjectId(id),
    });
    res.send(result);
  });
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Smart bills server is running...");
});

// Default route
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
