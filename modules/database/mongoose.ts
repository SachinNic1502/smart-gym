import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global cache in development to avoid creating multiple connections
const globalWithMongoose = global as typeof global & { _mongoose?: MongooseGlobal };

if (!globalWithMongoose._mongoose) {
  globalWithMongoose._mongoose = {
    conn: null,
    promise: null,
  };
}

const cached = globalWithMongoose._mongoose;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined. Please set it in your environment.");
    }

    const uri: string = MONGODB_URI;

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
