import lazyClientPromise from "./mongodb-lazy";
import type { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  // Do not crash the storefront when deployment credentials are not present.
}

let clientPromise = lazyClientPromise;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri && process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = lazyClientPromise;
  }
  clientPromise = global._mongoClientPromise;
} else if (uri) {
  clientPromise = lazyClientPromise;
}

export default clientPromise;
