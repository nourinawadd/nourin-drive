import mongoose from "mongoose";

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn("[db] MONGO_URI not set — skipping database connection.");
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log("[db] connected to MongoDB");
    return true;
  } catch (err) {
    console.error("[db] connection failed:", err);
    return false;
  }
}
