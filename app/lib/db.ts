import clientPromise from "./mongodb";
import { DB_NAME } from "./domain";

export async function getDb() {
  return (await clientPromise).db(DB_NAME);
}

export async function nextSequence(name: "order" | "invoice") {
  const db = await getDb();

  const result = await db.collection<any>("counters").findOneAndUpdate(
    { _id: name },
    [
      {
        $set: {
          value: {
            $add: [
              { $ifNull: ["$value", 10000] },
              1,
            ],
          },
        },
      },
    ],
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  if (!result) {
    throw new Error(`Failed to generate ${name} sequence.`);
  }

  return result.value;
}