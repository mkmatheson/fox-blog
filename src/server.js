import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    // always need to pass useNewUrlParser cuz it is required
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = client.db("fox-blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "error connection to db", error });
  }
};

app.get("/api/character/:name", async (req, res) => {
  withDB(async (db) => {
    const charName = req.params.name;

    //.json performs like .send

    const charInfo = await db
      .collection("characters")
      .findOne({ name: charName });
    res.status(200).json(charInfo);
  }, res);
});

app.post("/api/character/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const charName = req.params.name;

    const charInfo = await db
      .collection("characters")
      .findOne({ name: charName });
    await db.collection("characters").updateOne(
      { name: charName },
      {
        $set: {
          upvotes: charInfo.upvotes + 1,
        },
      }
    );
    const updatedCharInfo = await db
      .collection("characters")
      .findOne({ name: charName });

    res.status(200).json(updatedCharInfo);
  }, res);
});

app.post("/api/character/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const charName = req.params.name;

  withDB(async (db) => {
    const charInfo = await db
      .collection("characters")
      .findOne({ name: charName });
    await db.collection("characters").updateOne(
      { name: charName },
      {
        $set: {
          comments: charInfo.comments.concat({ username, text }),
        },
      }
    );

    const updatedCharInfo = await db
      .collection("characters")
      .findOne({ name: charName });

    res.status(200).json(updatedCharInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});
app.listen(8000, () => {
  console.log("listening on port 8000");
});
