const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// verify token middleware
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
    req.user = decoded;
    // console.log(req.user.email);
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

    const userCollection = client.db("apartmentDB").collection("users");
    const apartmentCollection = client
      .db("apartmentDB")
      .collection("apartments");
    const agreementtCollection = client
      .db("apartmentDB")
      .collection("agreements");
    const announcementsCollection = client
      .db("apartmentDB")
      .collection("announcements");
    const couponsCollection = client.db("apartmentDB").collection("coupons");
    const paymentCollection = client.db("apartmentDB").collection("payments");

    // admin middleware

    const verifyAdmin = async (req, res, next) => {
      try {
        const email = req.user?.email;
        const query = { email };
        console.log(email);
        const result = await userCollection.findOne(query);
        console.log(email);
        if (!result || result?.role !== "admin") {
          return res
            .status(403)
            .send({ message: "Forbidden Access! Admin Only Actions!" });
        }

        next();
      } catch (error) {
        console.error("Error verifying admin:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    };

    const verifyMember = async (req, res, next) => {
      const email = req.user?.email;
      const query = { email };
      const result = await userCollection.findOne(query);
      if (!result || result?.role !== "member") {
        return res
          .status(403)
          .send({ message: "Forbidden Access! Member Only Actions!" });
      }
      next();
    };

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });

    // payment intent
    app.post("/create-payment-intent", async (req, res) => {
      console.log(req.body);
      const { rent } = req.body;
      const amount = parseInt(rent * 100);
      console.log(amount, "amount inside intent");

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payment/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };

      const result = await paymentCollection.findOne(query);

      res.send(result);
    });

    app.post("/payment", async (req, res) => {
      const payment = req.body;

      const { apartmentId } = payment;

      console.log(apartmentId, payment);

      const result = await paymentCollection.insertOne(payment);

   

      res.send(result);
    });

app.patch("/updateApartment/:id", async (req, res) => {
  const id = req.params.id; // Get ID from URL parameter
  const query = { _id: new ObjectId(id) }; // Convert to ObjectId for MongoDB query

  const updateDoc = {
    $set: { availability: "unavailable" }, // Update availability to "unavailable"
  };

  try {
    // Perform the update operation
    const result = await apartmentCollection.updateOne(query, updateDoc);

    if (result.modifiedCount === 0) {
      // If no document was modified, return an appropriate response
      return res.status(404).send({
        success: false,
        message: "No apartment found or already unavailable.",
      });
    }

    // Send the successful response
    res.status(200).send({
      success: true,
      message: "Apartment updated successfully.",
      result,
    });

    console.log("Updated apartment ID:", id); // Log the ID for debugging
  } catch (error) {
    // Handle any errors during the update process
    console.error("Error updating apartment:", error);

    res.status(500).send({
      success: false,
      message: "Failed to update apartment.",
      error: error.message,
    });
  }
});


    // const { ObjectId } = require("mongodb"); // ObjectId ইনপোর্ট করা

    // app.patch("/payment", async (req, res) => {
    //   const payment = req.body; // পেমেন্ট ডেটা
    //   const { apartmentId } = payment; // অ্যাপার্টমেন্ট আইডি

    //   try {
    //     // Step 1: পেমেন্ট ডেটা ইনসার্ট করা
    //     const result = await paymentCollection.insertOne(payment);
    //     if (!result.insertedId) {
    //       return res.status(500).send({
    //         success: false,
    //         message: "Failed to insert payment data.",
    //       });
    //     }

    //     // Step 2: অ্যাপার্টমেন্টের অ্যাভেইলেবিলিটি চেক করা
    //    const apartment = await apartmentCollection.findOne({
    //      _id: ObjectId.isValid(apartmentId)
    //        ? new ObjectId(apartmentId)
    //        : apartmentId,
    //    });

    //     if (!apartment) {
    //       return res.status(404).send({
    //         success: false,
    //         message: "Apartment not found.",
    //       });
    //     }

    //     if (apartment.availability === "unavailable") {
    //       return res.status(400).send({
    //         success: false,
    //         message: "This apartment is already rented.",
    //       });
    //     }

    //     // Step 3: অ্যাপার্টমেন্ট `availability` আপডেট করা
    //     const updateApartment = await apartmentCollection.updateOne(
    //       { _id: new ObjectId(apartmentId) }, // সঠিকভাবে ObjectId রূপান্তর
    //       { $set: { availability: "unavailable" } }
    //     );

    //     if (updateApartment.modifiedCount === 0) {
    //       return res.status(500).send({
    //         success: false,
    //         message: "Failed to update apartment availability.",
    //       });
    //     }

    //     // সফল রেসপন্স
    //     res.status(200).send({
    //       success: true,
    //       message: "Payment successful, and apartment availability updated.",
    //       paymentId: result.insertedId,
    //     });
    //   } catch (error) {
    //     console.error("Error in payment process:", error);
    //     res.status(500).send({
    //       success: false,
    //       message: "An error occurred during the payment process.",
    //     });
    //   }
    // });

    // save or update user data on mongodb
    app.post("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
      // console.log('query email', query, 'user data', user);

      const isExist = await userCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      }

      const result = await userCollection.insertOne({
        ...user,
        role: "user",
        timestamp: Date.now(),
      });
      res.send(result);
    });

    // get user role
    // app.get('/user/role/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const result = await userCollection.findOne({ email });
    //   res.send({role: result?.role})
    // })
    app.get("/user/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });

      if (!result) {
        return res.status(404).send({ message: "User not found", role: null });
      }

      res.send({ role: result.role });
    });

    app.get("/apartments", async (req, res) => {
      const result = await apartmentCollection.find().toArray();
      res.send(result);
    });

    // agreements

    app.get("/agreement/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await agreementtCollection.findOne(query);
      res.send(result);
    });

    app.post("/agreements", verifyToken, async (req, res) => {
      const agreement = req.body;
      const { userEmail } = req.body;

      agreement.date = new Date();
      const existingAgreement = await agreementtCollection.findOne({
        userEmail: userEmail,
      });

      if (existingAgreement) {
        return res
          .status(400)
          .send({ message: "You have already applied for an apartment" });
      }

      const result = await agreementtCollection.insertOne(agreement);
      res.send(result);
    });

    // admin stats

    // app.get('/admin/stats', verifyToken, async (req, res) => {

    //   const email = req.user.email;
    //   const admin = await userCollection.findOne({ email });
    //   if (admin?.role !== 'admin') {
    //     return res.status(403).send({message: 'Access denied'})
    //   }

    // })

    app.get("/admin/members", verifyToken, async (req, res) => {
      const members = await userCollection.find({ role: "member" }).toArray();
      res.send(members);
    });

    // update user role

    app.patch("/update-userRole/:userId", async (req, res) => {
      try {
        const { userId } = req.params;
        //  console.log("User ID:", userId);

        const query = { _id: new ObjectId(userId) };
        const updateDoc = {
          $set: {
            role: "user",
          },
        };

        const result = await userCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "User not found" });
        }

        res
          .status(200)
          .send({ message: "User role updated successfully", result });
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // announcement APIs

    app.get("/announcements", verifyToken, async (req, res) => {
      const result = await announcementsCollection.find().toArray();
      res.send(result);
    });

    app.post("/announcements", verifyToken, async (req, res) => {
      const announcement = req.body;
      const result = await announcementsCollection.insertOne(announcement);
      res.send(result);
    });

    // agreement requests
    app.get("/agreementRequests", verifyToken, async (req, res) => {
      const query = { status: "pending" };
      const result = await agreementtCollection.find(query).toArray();
      res.send(result);
    });

    // agreement request accept

    app.patch("/acceptUser/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      // console.log(id);

      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "checked ",
        },
      };

      const updatedStatus = await agreementtCollection.updateOne(
        query,
        updateDoc
      );

      const agreement = await agreementtCollection.findOne(query);

      const userQuery = { email: agreement.userEmail };

      const updatedRole = {
        $set: {
          role: "member",
        },
      };

      const updatedUserRole = await userCollection.updateOne(
        userQuery,
        updatedRole
      );

      // const apartmentDelete = await agreementtCollection.deleteOne(query);

      res.send({ updatedStatus, updatedUserRole });
    });

    // agreement rejected api

    app.patch("/rejectedUser/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "checked ",
        },
      };

      const updatedStatus = await agreementtCollection.updateOne(
        query,
        updateDoc
      );
      res.send(updatedStatus);
    });

    // coupons api

    app.get("/coupons", verifyToken, verifyAdmin, async (req, res) => {
      const result = await couponsCollection.find().toArray();
      res.send(result);
    });

    // update availity of coupons
    app.patch("/coupons/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const { available } = req.body;

      const result = await couponsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { available } }
      );

      if (result.modifiedCount > 0) {
        res.send({ success: true, message: "Coupon availability updated." });
      } else {
        res.status(400).send({ success: false, message: "Failed to update." });
      }
    });

    app.post("/coupons", verifyToken, async (req, res) => {
      const coupon = req.body;
      const result = await couponsCollection.insertOne(coupon);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Living Nest server is running..");
});

app.listen(port, () => {
  console.log(`LivingNest is running on port ${port}`);
});
