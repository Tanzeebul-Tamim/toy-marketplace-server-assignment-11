const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y70m6ei.mongodb.net/?retryWrites=true&w=majority`;

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

    const toyCollection = client.db("fluffyFriends").collection("allToys");

    app.get("/allToys", async (req, res) => {
      const search = req.query.search;
      const query = search ? { productName: { $regex: search, $options: 'i' } } : {};
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const cursor = toyCollection.find(query);
      const result = await cursor.skip(skip).limit(limit).toArray();
      res.send(result);
    });

    app.get('/totalToys', async(req, res) => {
      const result = await toyCollection.estimatedDocumentCount();
      res.send({totalToys: result});
    });
    
    app.get("/allToys/email/:email", async (req, res) => {
      const email = req.params.email;
      const sortOrder = req.query.sort === "descending" ? -1 : 1;
      const query = { sellerEmail: email };
      const result = await toyCollection.find(query).sort({ price: sortOrder }).toArray();
      res.send(result);
    });

    app.get("/allToys/id/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });

    app.post("/allToys", async (req, res) => {
      const newToy = req.body;
      const result = await toyCollection.insertOne(newToy);
      res.send(result);
    });

    app.patch('/allToys/id/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const updatedToy = req.body;
      const toy = {
        $set: {
          price: updatedToy.price,
          availableQuantity: updatedToy.availableQuantity,
          productDescription: updatedToy.productDescription
        }
      };
      const result = await toyCollection.updateOne(query, toy);
      res.send(result);
    })

    app.delete('/allToys/id/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Toy-marketplace-server is running");
});

app.listen(port, () => {
  console.log(`Toy marketplace server is running on port: ${port}`);
});
