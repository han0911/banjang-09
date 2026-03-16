import { MongoClient } from 'mongodb';

const url = process.env.NEXT_PUBLIC_MONGODB_URL as string | undefined;
if (!url) {
  throw new Error('환경변수에 NEXT_PUBLIC_MONGODB_URL이 정의되지 않았습니다.');
}

const options = {};
let connectDB: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongo: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongo) {
    global._mongo = new MongoClient(url, options).connect();
  }
  connectDB = global._mongo;
} else {
  connectDB = new MongoClient(url, options).connect();
}

export { connectDB };
