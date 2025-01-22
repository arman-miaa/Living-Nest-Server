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

  if (!req.headers.authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
  
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
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

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
        
        const result = await userCollection.findOne(query);
       
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
    app.post("/create-payment-intent",verifyToken, verifyMember, async (req, res) => {
      
      const { rent } = req.body;
      const amount = parseInt(rent * 100);
     

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payment/:email", verifyToken, verifyMember, async (req, res) => {
      const email = req.params.email;
     
      const query = { email: email };

      const result = await paymentCollection.findOne(query);

      res.send(result);
    });

    app.post("/payment", verifyToken, verifyMember, async (req, res) => {
      const payment = req.body;

      const { apartmentId } = payment;

   

      const result = await paymentCollection.insertOne(payment);

      res.send(result);
    });

    app.patch("/updateApartment/:id", verifyToken, verifyMember, async (req, res) => {
      const id = req.params.id; 
      const query = { _id: new ObjectId(id) }; 

      const updateDoc = {
        $set: { availability: "unavailable" }, 
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

    
    // save or update user data on mongodb
    app.post("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
   

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

  
    app.get("/user/role/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });

      if (!result) {
        return res.status(404).send({ message: "User not found", role: null });
      }

      res.send({ role: result.role });
    });

    

    app.get("/apartments",  async (req, res) => {
      try {
       

        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 6;
        const minRent = parseInt(req.query.minRent) || 0;
        const maxRent = parseInt(req.query.maxRent) || Infinity;

        const filter = {};

        if (minRent > 0 || maxRent < Infinity) {
          filter.rent = { $gte: minRent, $lte: maxRent };
        }

        const total = await apartmentCollection.countDocuments(filter);

        const apartments = await apartmentCollection
          .find(filter)
          .skip(page * limit)
          .limit(limit)
          .toArray();

        res.send({ success: true, total, apartments });
      } catch (error) {
        console.error("Error fetching apartments:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to fetch apartments." });
      }
    });

 

    app.get("/admin/info", verifyToken, verifyAdmin, async (req, res) => {
      try {
        // Count the total number of apartments
        const totalApartments = await apartmentCollection.countDocuments();

        // available apartments

        const availableApartments = await apartmentCollection.countDocuments({
          availability: "available",
        });
        const availablePercentage =
          (availableApartments / totalApartments) * 100;

        // unavailable apartments
        const unavailableApartments = await apartmentCollection.countDocuments({
          availability: "unavailable",
        });

        const unavailablePercentage =
          (unavailableApartments / totalApartments) * 100;

        // total users
        const totalUsers = await userCollection.countDocuments({
          role: "user",
        });
        // total member
        const totalMembers = await userCollection.countDocuments({
          role: "member",
        });

        // Send the count as the response
        res.send({
          total: totalApartments,
          available: availablePercentage.toFixed(2),
          unavailable: unavailablePercentage.toFixed(2),
          totalUsers: totalUsers,
          totalMembers: totalMembers,
        });
      } catch (error) {
        console.error("Error fetching total apartments:", error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch total apartments.",
        });
      }
    });

    // agreements

    app.get("/agreement/:email", verifyToken, verifyMember, async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await agreementtCollection.findOne(query);
      res.send(result);
    });

    app.post("/agreements", verifyToken, verifyMember, async (req, res) => {
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

  

    app.get("/admin/members", verifyToken, verifyAdmin, async (req, res) => {
      const members = await userCollection.find({ role: "member" }).toArray();
      res.send(members);
    });

    // update user role

    app.patch("/update-userRole/:userId", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { userId } = req.params;
       

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

  
    app.post("/announcements", verifyToken, verifyAdmin, async (req, res) => {
      const announcement = req.body;

      // Add current date to the announcement
      announcement.date = new Date().toISOString();

      const result = await announcementsCollection.insertOne(announcement);
      res.send(result);
    });


    // agreement requests
    app.get("/agreementRequests", verifyToken,verifyAdmin, async (req, res) => {
      const query = { status: "pending" };
      const result = await agreementtCollection.find(query).toArray();
      res.send(result);
    });

    // agreement request accept

    app.patch("/acceptUser/:id", verifyToken, verifyAdmin, async (req, res) => {
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

    app.patch("/rejectedUser/:id", verifyToken, verifyAdmin, async (req, res) => {
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

    app.get("/coupons", async (req, res) => {
      const result = await couponsCollection.find().toArray();
      res.send(result);
    });

    // update availity of coupons
    app.patch("/coupons/:id", verifyToken, verifyAdmin, async (req, res) => {
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

    app.post("/coupons", verifyToken, verifyAdmin, async (req, res) => {
      const coupon = req.body;
      const result = await couponsCollection.insertOne(coupon);
      res.send(result);
    });

    /// validation coupon
    // API Endpoint: Validate a Coupon
    app.get("/coupons/:code", verifyToken, verifyMember, async (req, res) => {
      try {
        const { code } = req.params;
        

        // Find the coupon by its code
        const coupon = await couponsCollection.findOne({ code });

        if (!coupon) {
          return res.status(404).json({
            message: "Coupon not found",
            available: false,
          });
        }

        if (!coupon.available) {
          return res.status(400).json({
            message: "Coupon is unavailable",
            available: false,
          });
        }

        // Respond with coupon details if valid
        res.status(200).json({
          code: coupon.code,
          percentage: coupon.percentage,
          description: coupon.description,
          available: coupon.available,
        });
      } catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({
          message: "Internal server error",
        });
      }
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
