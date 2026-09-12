import { MongoClient } from "mongodb";
let connection: Promise<MongoClient> | undefined;
function connect() { if (connection) return connection; const uri=process.env.MONGODB_URI; if(!uri)return Promise.reject(new Error("DATABASE_UNAVAILABLE")); const client=new MongoClient(uri,{serverSelectionTimeoutMS:2500}); connection=client.connect().catch(error=>{connection=undefined;throw error}); return connection; }
const clientPromise={then<TResult1=MongoClient,TResult2=never>(onfulfilled?:((value:MongoClient)=>TResult1|PromiseLike<TResult1>)|null,onrejected?:((reason:unknown)=>TResult2|PromiseLike<TResult2>)|null){return connect().then(onfulfilled,onrejected)}} as Promise<MongoClient>;
export default clientPromise;
