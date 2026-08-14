import fs from "fs";
import path from "path";

// A wrapper database utility that attempts to connect to MongoDB,
// but seamlessly falls back to a local JSON file database if MongoDB connection fails.
// This ensures 100% functionality even when offline or during DB outages.

let client = null;
let db = null;
const FALLBACK_FILE_PATH = path.join(process.cwd(), "src/lib/papers-db.json");

// Ensure fallback file exists
function initFallbackDb() {
  try {
    if (!fs.existsSync(FALLBACK_FILE_PATH)) {
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error("Failed to initialize fallback database file:", err);
  }
}

async function getMongoClient() {
  if (client && db) return { client, db };

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.warn("DATABASE_URL not found in environment variables. Using JSON file fallback database.");
    return null;
  }

  try {
    // Dynamically import mongodb to avoid crash if package not installed
    const { MongoClient } = await import("mongodb");
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db("question_papers");
    console.log("Successfully connected to MongoDB database.");
    return { client, db };
  } catch (err) {
    console.error("MongoDB connection failed, falling back to JSON file database. Error:", err.message);
    return null;
  }
}

export async function getPapers() {
  const mongo = await getMongoClient();
  if (mongo) {
    try {
      const papers = await mongo.db.collection("papers").find({}).sort({ updatedAt: -1 }).toArray();
      // Map _id to id string for consistency
      return papers.map(p => ({ ...p, id: p._id.toString() }));
    } catch (err) {
      console.error("Failed to get papers from MongoDB, using fallback:", err);
    }
  }

  // Fallback
  initFallbackDb();
  try {
    const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf8");
    const papers = JSON.parse(data);
    return papers.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (err) {
    console.error("Failed to read fallback database:", err);
    return [];
  }
}

export async function getPaperById(id) {
  const mongo = await getMongoClient();
  if (mongo) {
    try {
      const { ObjectId } = await import("mongodb");
      const paper = await mongo.db.collection("papers").findOne({ _id: new ObjectId(id) });
      if (paper) {
        return { ...paper, id: paper._id.toString() };
      }
    } catch (err) {
      console.error(`Failed to get paper ${id} from MongoDB, using fallback:`, err);
    }
  }

  // Fallback
  initFallbackDb();
  try {
    const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf8");
    const papers = JSON.parse(data);
    return papers.find(p => p.id === id) || null;
  } catch (err) {
    return null;
  }
}

export async function savePaper(paperData) {
  const mongo = await getMongoClient();
  const now = new Date().toISOString();
  const id = paperData.id || paperData._id || Math.random().toString(36).substring(2, 9);
  
  const record = {
    ...paperData,
    id,
    updatedAt: now
  };
  delete record._id; // Ensure we don't conflict with MongoDB ObjectId

  if (mongo) {
    try {
      const { ObjectId } = await import("mongodb");
      let filter = {};
      if (paperData.id && ObjectId.isValid(paperData.id)) {
        filter = { _id: new ObjectId(paperData.id) };
      } else {
        filter = { _id: new ObjectId() };
      }
      
      const updateResult = await mongo.db.collection("papers").updateOne(
        filter,
        { $set: { ...record, updatedAt: now } },
        { upsert: true }
      );
      
      const savedId = updateResult.upsertedId ? updateResult.upsertedId.toString() : (paperData.id || id);
      return { ...record, id: savedId };
    } catch (err) {
      console.error("Failed to save paper to MongoDB, saving to fallback:", err);
    }
  }

  // Fallback
  initFallbackDb();
  try {
    const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf8");
    const papers = JSON.parse(data);
    const existingIndex = papers.findIndex(p => p.id === id);
    
    if (existingIndex > -1) {
      papers[existingIndex] = record;
    } else {
      papers.push(record);
    }
    
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(papers, null, 2));
    return record;
  } catch (err) {
    console.error("Failed to save paper to fallback database:", err);
    throw err;
  }
}

export async function deletePaper(id) {
  const mongo = await getMongoClient();
  if (mongo) {
    try {
      const { ObjectId } = await import("mongodb");
      if (ObjectId.isValid(id)) {
        const res = await mongo.db.collection("papers").deleteOne({ _id: new ObjectId(id) });
        if (res.deletedCount > 0) return true;
      }
    } catch (err) {
      console.error(`Failed to delete paper ${id} from MongoDB, using fallback:`, err);
    }
  }

  // Fallback
  initFallbackDb();
  try {
    const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf8");
    let papers = JSON.parse(data);
    const lengthBefore = papers.length;
    papers = papers.filter(p => p.id !== id);
    if (papers.length !== lengthBefore) {
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(papers, null, 2));
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to delete paper from fallback database:", err);
    return false;
  }
}

const CLIPARTS_FALLBACK_FILE_PATH = path.join(process.cwd(), "src/lib/cliparts-db.json");

function initClipartsFallbackDb() {
  try {
    if (!fs.existsSync(CLIPARTS_FALLBACK_FILE_PATH)) {
      fs.writeFileSync(CLIPARTS_FALLBACK_FILE_PATH, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error("Failed to initialize cliparts database file:", err);
  }
}

export async function getCustomCliparts() {
  const mongo = await getMongoClient();
  if (mongo) {
    try {
      const cliparts = await mongo.db.collection("cliparts").find({}).toArray();
      return cliparts.map(c => ({ ...c, id: c._id ? c._id.toString() : c.id }));
    } catch (err) {
      console.error("Failed to get custom cliparts from MongoDB:", err);
    }
  }
  initClipartsFallbackDb();
  try {
    const data = fs.readFileSync(CLIPARTS_FALLBACK_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export async function saveCustomClipart(clipart) {
  const mongo = await getMongoClient();
  if (mongo) {
    try {
      await mongo.db.collection("cliparts").insertOne(clipart);
      return clipart;
    } catch (err) {
      console.error("Failed to save clipart to MongoDB:", err);
    }
  }
  initClipartsFallbackDb();
  try {
    const data = fs.readFileSync(CLIPARTS_FALLBACK_FILE_PATH, "utf8");
    const cliparts = JSON.parse(data);
    cliparts.push(clipart);
    fs.writeFileSync(CLIPARTS_FALLBACK_FILE_PATH, JSON.stringify(cliparts, null, 2));
    return clipart;
  } catch (err) {
    console.error("Failed to save custom clipart to fallback:", err);
    throw err;
  }
}
