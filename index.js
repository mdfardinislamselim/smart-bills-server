const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

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

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db("smart-bills");
    const billsCollection = db.collection("bills");

    //post bills
    app.post("/bills", async (req, res) => {
      const newBill = req.body;
      const result = await billsCollection.insertOne(newBill);
      res.send(result);
    });

    // get bills
    app.get("/bills", async (req, res) => {
      const cursor = billsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
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

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Smart bills server is running...");
});

// Default route
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
