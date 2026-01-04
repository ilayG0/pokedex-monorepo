require("dotenv").config();

const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in .env");
    }
    const conn = await mongoose.connect(uri); 

    console.log(
      "Connected to MongoDB Atlas",
      conn.connection.host,
      conn.connection.name
    );
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

module.exports = { connectDB, disconnectDB };
