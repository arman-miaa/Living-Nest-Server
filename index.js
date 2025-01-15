const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


    const verifyToken = (req, res, next) => {
      // console.log("inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        // console.log(req.decoded.email);
        next();
      });
    };


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7argw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const userCollection = client
      .db("apartmentDB")
      .collection("users");
    const apartmentCollection = client
      .db("apartmentDB")
      .collection("apartments");
    const agreementtCollection = client
      .db("apartmentDB")
      .collection("agreements");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });


    // save or update user data on mongodb
    app.post('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
      // console.log('query email', query, 'user data', user);

      const isExist = await userCollection.findOne(query)
      if (isExist) {
        return res.send(isExist);
      }

      const result = await userCollection.insertOne({
        ...user,
        role: "user",
        timestamp: Date.now(),
      });
      res.send(result)

    })


    app.get("/apartments", async (req, res) => {
      const result = await apartmentCollection.find().toArray();
      res.send(result);
    });

    // agreements

    app.post("/agreements", verifyToken, async (req, res) => {
      const agreement = req.body;
      const { userEmail, apartmentNo } = req.body;
      // console.log(userEmail, apartmentNo);

      const existingAgreement = await agreementtCollection.findOne({
        userEmail: userEmail,
        apartmentNo: apartmentNo,
      });

      if (existingAgreement) {
        return res
          .status(400)
          .send({ message: "You have already applied for this apartment" });
      }

      const result = await agreementtCollection.insertOne(agreement);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome Assignment 12");
});

app.listen(port, () => {
  console.log(`assignment 12 is running on port ${port}`);
});
