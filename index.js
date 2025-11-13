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

    // GET /bills?category=Electricity
    app.get("/bills", async (req, res) => {
      const { category } = req.query;
      let query = {};
      if (category) {
        query.category = category;
      }

      try {
        const bills = await billsCollection.find(query).toArray();
        res.json(bills);
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

    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }

  //Add a new paid bill
  app.post("/paid-bills", async (req, res) => {
    const paidBill = req.body;

    if (!paidBill || typeof paidBill !== "object") {
      return res.status(400).send({ message: "Invalid request body" });
    }

    const result = await paidBillsCollection.insertOne(paidBill);
    res.send(result);
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
